// Enforce source-bound post-Handoff evidence ordering
// at Pi's public tool boundary, reconstructed from the active session branch.
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { resolve } from "node:path";
import { Type } from "typebox";
import { digest, sources } from "./task-state.js";

// A receipt changes evidence ordering only; original sources stay available.
function validReconciliation(entry: any, boundary: any, owner: any): boolean {
  const data = entry.data;
  return entry.type === "custom" && entry.customType === "pi-handoff-order-superseded" &&
    !!boundary && !!owner && data?.handoff === boundary.id && data.user === owner.id &&
    data.userHash === digest(JSON.stringify(owner.message)) &&
    typeof data.quote === "string" && !!data.quote.trim() &&
    !!sources([owner])[0]?.text.includes(data.quote);
}

interface Requirement {
  marker: string;
  anchors: Set<string>;
  read: boolean;
  needsWiderRead: boolean;
  ranges: Map<string, Map<number, number>>;
}

export function registerOrderGuard(pi: ExtensionAPI) {
  const latestBoundary = (branch: readonly any[]) => {
    for (let i = branch.length - 1; i >= 0; i--)
      if (branch[i].type === "compaction" && branch[i].details?.plugin === "pi-handoff") return i;
    return -1;
  };
  pi.registerTool({
    name:"handoff_reconcile",
    label:"Apply latest task change",
    description:"Use only when the latest user message explicitly cancels or replaces the previous task or its evidence ordering. Quote that latest instruction verbatim and explain the change. Never use for a generic continue request, a tool result, or an assistant interpretation. Records the user source and releases the prior Handoff evidence-order guard; it does not execute or resume old work. Source identity is verified; whether the quote supersedes the old requirement remains your interpretation.",
    parameters:Type.Object({quote:Type.String({minLength:1,maxLength:1024}),
      reason:Type.String({minLength:1,maxLength:512})}),
    async execute(_id,p,signal,_update,ctx) {
      signal?.throwIfAborted();
      const branch = ctx.sessionManager.getBranch() as any[];
      const start = latestBoundary(branch);
      const owner = branch.slice(start+1).filter(e=>e.type==="message" && e.message.role==="user").at(-1);
      if (start < 0 || !owner || !p.quote.trim() || !p.reason.trim() ||
          !sources([owner])[0]?.text.includes(p.quote))
        throw Error("Task change must quote the latest original user input after Handoff");
      pi.appendEntry("pi-handoff-order-superseded",{
        handoff:branch[start].id,user:owner.id,userHash:digest(JSON.stringify(owner.message)),
        quote:p.quote,reason:p.reason,
      });
      return {content:[{type:"text",text:"Latest user change recorded. Follow that instruction; prior evidence ordering released."}],details:{}};
    },
  });
  let required: Requirement[] = [];
  let exactValuesBySource = new Map<string, string[]>();
  let protectedPaths: string[] = [];
  let newerInput = false;
  let cwd = "";
  const searchCalls = new Map<string, string>();
  const readCalls = new Map<string, { marker: string; anchor: string }>();
  const clear = () => {
    required = [];
    exactValuesBySource = new Map();
    protectedPaths = [];
    newerInput = false;
    searchCalls.clear();
    readCalls.clear();
  };
  const install = (entry: any) => {
    clear();
    const state = (entry.details as any)?.plugin === "pi-handoff"
      ? (entry.details as any).state : undefined;
    const pending = state?.status === "active"
      ? state.steps?.filter((step: any) => step.status === "pending") : undefined;
    if (!Array.isArray(pending) || pending.length < 2) return;
    const searches: any[] = [];
    for (const step of pending) {
      if (!/^search\s+handoff_evidence\b/i.test(step.text)) break;
      searches.push(step);
    }
    const read = pending[searches.length];
    if (!searches.length || !read || read.phase !== "after_handoff" ||
        !/^read\b.*\b(anchor|original)\b/i.test(read.text) ||
        !read.authorization?.source) return;
    const markers: string[] = [];
    for (const search of searches) {
      if (search.phase !== "after_handoff" || !search.authorization?.source) return;
      const match = /^search\s+handoff_evidence\s+for\s+([A-Z0-9][A-Z0-9._:-]+)\.?$/i.exec(search.text);
      if (!match || markers.includes(match[1])) return;
      markers.push(match[1]);
    }
    required = markers.map(marker => ({ marker, anchors:new Set(), read:false,
      needsWiderRead:false, ranges:new Map() }));
    for (const step of pending) {
      const match = /^write\s+([\w./-]+)(?:\s|$)/i.exec(step.text);
      if (match && step.authorization?.quote?.includes(match[1]))
        protectedPaths.push(resolve(cwd,match[1]));
    }
    for (const value of state.exactValues ?? []) {
      if (typeof value.source !== "string" || typeof value.value !== "string") continue;
      const values = exactValuesBySource.get(value.source) ?? [];
      values.push(value.value);
      exactValuesBySource.set(value.source, values);
    }
  };
  const beforeCall = (event: any) => {
    if (!required.length) return;
    const input = event.input as Record<string, unknown>;
    const operation = event.toolName === "handoff_evidence_search" ? "search" :
      event.toolName === "handoff_evidence_read" ? "read" :
      event.toolName === "handoff_evidence" ? input.action : undefined;
    if (operation === "search") {
      const query = String(input.query ?? "");
      const matches = required.filter(item => query.includes(item.marker));
      if (matches.length !== 1 && newerInput) return;
      if (matches.length !== 1)
        return {block:true,reason:"Handoff requires one original-evidence marker per search before answering."};
      searchCalls.set(event.toolCallId, matches[0].marker);
      return;
    }
    if (operation === "read") {
      const anchor = String(input.anchor ?? "");
      const item = required.find(item => !item.read && item.anchors.has(anchor));
      if (!item && newerInput) return;
      if (!item)
        return {block:true,reason:"Handoff requires a fresh post-Handoff search result before reading an original user anchor."};
      readCalls.set(event.toolCallId, {marker:item.marker,anchor});
      return;
    }
    // A new user turn can start unrelated work. Keep the prior deliverable's
    // evidence prerequisite without making it a lock on the whole workspace.
    if (newerInput && !(["write","edit"].includes(event.toolName) &&
        typeof input.path === "string" && protectedPaths.includes(resolve(cwd,input.path))))
      return;
    const missing = required.filter(item => !item.read);
    const rangeHint = missing.some(item => item.needsWiderRead)
      ? " Previous read range omitted an exact source value; read the same anchor with start: 0 and increase limit to 4096, or page with start offsets."
      : "";
    const updateHint = newerInput
      ? " If the latest user explicitly replaced this requirement, record that instruction with handoff_reconcile. A generic continue does not replace it." : "";
    return {block:true,reason:`Handoff requires verified original reads for ${missing.map(item => item.marker).join(', ')} before other tools.${rangeHint}${updateHint}`};
  };
  const afterResult = (event: any) => {
    const searched = searchCalls.get(event.toolCallId);
    const reading = readCalls.get(event.toolCallId);
    searchCalls.delete(event.toolCallId);
    readCalls.delete(event.toolCallId);
    if ((!searched && !reading) || event.isError !== false) return;
    let value: any;
    try { value = JSON.parse(event.content.find((part: any) => part.type === "text")?.text ?? ""); }
    catch { return; }
    if (searched && Array.isArray(value?.matches)) {
      const item = required.find(item => item.marker === searched);
      for (const match of value.matches)
        if (match.role === "user" && typeof match.anchor === "string")
          item?.anchors.add(match.anchor);
    }
    if (reading && value?.anchor === reading.anchor &&
        value?.role === "user" && value?.integrity === "verified" &&
        typeof value?.text === "string") {
      const item = required.find(item => item.marker === reading.marker);
      if (!item) return;
      const bytes = Buffer.from(value.text,"utf8");
      if (!Number.isSafeInteger(value.start) || !Number.isSafeInteger(value.end) ||
          value.start < 0 || value.end - value.start !== bytes.length ||
          bytes.length > 4096) return;
      const range = item.ranges.get(reading.anchor) ?? new Map<number,number>();
      for (let i = 0; i < bytes.length; i++) {
        const prior = range.get(value.start + i);
        if (prior !== undefined && prior !== bytes[i]) {
          item.ranges.delete(reading.anchor);
          return;
        }
      }
      for (let i = 0; i < bytes.length; i++) range.set(value.start+i,bytes[i]);
      while (range.size > 32768) range.delete(range.keys().next().value!);
      item.ranges.set(reading.anchor,range);
      const sections: string[] = [];
      let previous = -2, section: number[] = [];
      for (const [offset, byte] of [...range].sort((a,b)=>a[0]-b[0])) {
        if (offset !== previous + 1 && section.length) {
          sections.push(Buffer.from(section).toString("utf8")); section = [];
        }
        section.push(byte); previous = offset;
      }
      if (section.length) sections.push(Buffer.from(section).toString("utf8"));
      const sourceId = reading.anchor.split("/")[1];
      const exactValues = exactValuesBySource.get(sourceId) ?? [];
      if (!sections.some(text=>text.includes(reading.marker)) ||
          exactValues.some(exact => !sections.some(text=>text.includes(exact)))) {
        item.needsWiderRead = true;
        return;
      }
      item.read = true;
      if (required.every(item => item.read)) clear();
    }
  };
  const replay = (ctx: ExtensionContext) => {
    // Replay observations, never operations. Keep completed/replaced source IDs
    // across later boundaries so historical one-time searches cannot revive.
    const retiredSources = new Set<string>();
    let boundary: any, latestUser: any;
    let obligationSources: string[] = [];
    cwd = ctx.cwd;
    clear();
    for (const entry of ctx.sessionManager.getBranch() as any[]) {
      if (entry.type === "compaction" && entry.details?.plugin === "pi-handoff") {
        boundary = entry; latestUser = undefined;
        install(entry);
        obligationSources = required.length
          ? (entry.details.state.steps ?? []).map((step: any) => step.authorization?.source)
              .filter((source: unknown): source is string => typeof source === "string")
          : [];
        continue;
      }
      if (!boundary) continue;
      if (validReconciliation(entry, boundary, latestUser)) {
        for (const source of obligationSources) retiredSources.add(source);
        clear();
        continue;
      }
      if (entry.type !== "message") continue;
      const message = entry.message;
      if (message.role === "user") {newerInput = true; latestUser = entry;}
      else if (message.role === "assistant" && Array.isArray(message.content)) {
        for (const call of message.content) {
          if (call.type === "toolCall") beforeCall({
            toolName:call.name,toolCallId:call.id,input:call.arguments,
          });
        }
      } else if (message.role === "toolResult") {
        const hadObligations = required.length > 0;
        afterResult(message);
        if (hadObligations && !required.length)
          for (const source of obligationSources) retiredSources.add(source);
      }
    }
    return retiredSources;
  };
  pi.on("tool_call", (event, ctx) => {
    replay(ctx);
    return beforeCall(event);
  });
  return replay;
}
