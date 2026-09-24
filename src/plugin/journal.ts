import {
  openSync,
  closeSync,
  fsyncSync,
  writeFileSync,
  renameSync,
  readFileSync,
  existsSync,
  unlinkSync,
} from "node:fs";
import { dirname, relative, isAbsolute } from "node:path";
import { randomUUID } from "node:crypto";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { digest } from "./task-state.js";
export interface Journal {
  version: 1;
  session: string;
  summaryHash: string;
  phase: "prepared" | "installed";
  continuation: "none" | "claimed" | "settled";
}
function path(ctx: ExtensionContext) {
  const file = ctx.sessionManager.getSessionFile();
  if (!file) throw new Error("Persistent Pi session required");
  const rel = relative(ctx.cwd, file);
  if (!rel.startsWith("..") && !isAbsolute(rel))
    throw new Error("Session storage must be outside the workspace");
  return `${file}.handoff.json`;
}
export function load(ctx: ExtensionContext): Journal | undefined {
  const p = path(ctx);
  if (!existsSync(p)) return;
  const envelope = JSON.parse(readFileSync(p, "utf8")),
    v = envelope.record;
  if (
    !v ||
    envelope.hash !== digest(JSON.stringify(v)) ||
    v.version !== 1 ||
    v.session !== ctx.sessionManager.getSessionId() ||
    !["prepared", "installed"].includes(v.phase) ||
    !["none", "claimed", "settled"].includes(v.continuation)
  )
    throw new Error("Corrupt Handoff journal; recovery required");
  return v;
}
export function save(ctx: ExtensionContext, record: Journal) {
  const p = path(ctx),
    temp = `${p}.${randomUUID()}.tmp`;
  let fd: number | undefined;
  try {
    fd = openSync(temp, "wx", 0o600);
    writeFileSync(
      fd,
      JSON.stringify({ record, hash: digest(JSON.stringify(record)) }) + "\n",
    );
    fsyncSync(fd);
    closeSync(fd);
    fd = undefined;
    renameSync(temp, p);
    fd = openSync(dirname(p), "r");
    fsyncSync(fd);
  } finally {
    if (fd !== undefined) closeSync(fd);
    if (existsSync(temp)) unlinkSync(temp);
  }
}
export function confirmCommit(ctx: ExtensionContext, summaryHash: string) {
  const file = ctx.sessionManager.getSessionFile()!;
  if (!hasCommit(ctx, summaryHash))
    throw new Error("Handoff commit is missing or changed; recovery required");
  const fd = openSync(file, "r");
  try {
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  const dir = openSync(dirname(file), "r");
  try {
    fsyncSync(dir);
  } finally {
    closeSync(dir);
  }
}
export function historyFingerprint(ctx: ExtensionContext) {
  const file = ctx.sessionManager.getSessionFile();
  if (!file) throw new Error("Persistent original history required");
  const content = readFileSync(file);
  if (content.length > 8 * 1024 * 1024)
    throw new Error("History exceeds 8 MiB integrity budget");
  return digest(content.toString("base64"));
}

export function hasCommit(ctx: ExtensionContext, summaryHash: string) {
  const file = ctx.sessionManager.getSessionFile();
  if (!file) throw new Error("Persistent original history required");
  const entries = readFileSync(file, "utf8")
    .trim()
    .split("\n")
    .map((s) => JSON.parse(s));
  return entries.some(
    (e) =>
      e.type === "compaction" &&
      e.details?.plugin === "pi-handoff" &&
      digest(e.summary) === summaryHash,
  );
}
