// Only bounded, validator-checked field changes are admitted.
import { validate, bytes, selectSources, type Source, type TaskState } from './task-state.js';
import type { ProcedureStep } from './grounding.js';
import type { ExtensionContext } from '@earendil-works/pi-coding-agent';
import type { registerPolicy } from './config.js';
type Generation = ReturnType<ReturnType<typeof registerPolicy>['generation']>;

const afterInstruction = (source: Source | undefined) =>
  source?.role === 'user' &&
  /after.{0,100}(handoff|fourth context maintenance boundary)/i.test(source.text);
const timedSearch = (step: ProcedureStep, originals: Source[]) =>
  /search.*handoff_evidence/i.test(step.text) &&
  afterInstruction(originals.find(s => s.id === step.authorization?.source));

export const missingTimedSearch = (candidate: TaskState, originals: Source[]) =>
  candidate.status === 'active' && (candidate.steps?.some(step => timedSearch(step, originals) &&
    (step.phase !== 'after_handoff' || step.status !== 'pending')) ?? false);

export const omittedTimedSearch = (candidate: TaskState, originals: Source[]) => {
  if (candidate.status !== 'active') return false;
  const authorized = originals.some(source => source.role === 'user' &&
    /after.{0,100}(handoff|fourth context maintenance boundary)/i.test(source.text) &&
    /search\s+handoff_evidence/i.test(source.text));
  return authorized && !candidate.steps?.some(step => timedSearch(step, originals));
};

export function atomicizeSearch(candidate: TaskState, originals: Source[]) {
  if (candidate?.status !== 'active' || !Array.isArray(candidate.steps) ||
      candidate.steps.length >= 12) return candidate;
  const index = candidate.steps.findIndex(step => step.status === 'pending');
  if (index < 0) return candidate;
  const step = candidate.steps[index];
  if (step.phase !== 'after_handoff' || !Array.isArray(step.completion) ||
      step.completion.length) return candidate;
  const match = /^Search handoff_evidence for ([A-Z0-9][A-Z0-9._:-]{3,}) and ([A-Z0-9][A-Z0-9._:-]{3,})\.?$/i.exec(step.text);
  if (!match) return candidate;
  const [, first, second] = match;
  const source = originals.find(item => item.id === step.authorization?.source &&
    item.role === 'user');
  if (!source || !source.text.includes(first) || !source.text.includes(second) ||
      !step.authorization?.quote?.includes(first) ||
      !step.authorization.quote.includes(second)) return candidate;
  const secondId = `${step.id}-second`;
  if (candidate.steps.some(item => item.id === secondId)) return candidate;
  const oldAction = candidate.nextAction;
  const firstAction = `Search handoff_evidence for ${first}`;
  const secondAction = `Search handoff_evidence for ${second}`;
  candidate.steps.splice(index, 1,
    {...step, text:firstAction}, {...step, id:secondId, text:secondAction});
  candidate.nextAction = firstAction;
  for (const claim of candidate.claims ?? [])
    if (claim.kind === 'nextAction' && claim.text === oldAction)
      claim.text = firstAction;
  return candidate;
}

const systemPrompt = `PI_HANDOFF_FIELD_PATCH
The Task State validator rejected the supplied candidate. Return JSON with EXACTLY two keys: exactValueSplits and stepChanges. Each is an array of CHANGED indexes only. Do not copy whole records, long quotations, the rest of Task State, markdown or commentary.
exactValueSplits entries have only index, label and separator. The program preserves field, value, source and quote. quote must equal label + separator + existing value. A nonempty label needs a separator containing a NON-WHITESPACE character. For quote "Its official language is English" and value "English", use label "Its official language" and separator " is ".
stepChanges entries have only index, phase and status. The program preserves id, text and authorization. Examine EVERY step. If the original user required a search AFTER the upcoming Handoff, a similar search completed BEFORE it does not count: change that search step to phase after_handoff and status pending. The program clears pre-Handoff completion and sets nextAction to the first pending step. Only read-only evidence search may change from completed to pending. Also correct pending steps marked before_handoff when original user authorization says after.
Use candidate and original sources. If no safe patch exists, return {"exactValueSplits":[],"stepChanges":[]}.`;

export async function repairTaskState(candidate: TaskState, originals: Source[], firstError: unknown, ctx: ExtensionContext, generation: Generation, signal: AbortSignal, timingOriginals = originals) {
  if (!ctx.model) throw Error("Handoff repair requires a selected model");
  const validationErrors = [String(firstError)];
  try { validate({ ...structuredClone(candidate), exactValues: [] }, originals); }
  catch (error) {
    if (!validationErrors.includes(String(error))) validationErrors.push(String(error));
  }
  const requiredSearchIndexes = candidate.steps?.map((step, index) =>
    timedSearch(step, timingOriginals) ? index : -1).filter(index => index >= 0) ?? [];
  for (const index of requiredSearchIndexes) {
    const step = candidate.steps[index];
    if (step.phase !== 'after_handoff' || step.status !== 'pending')
      validationErrors.push(`Step ${index} must search original evidence after this Handoff; pre-Handoff search does not satisfy it`);
  }
  const maxTokens = Math.min(8192, generation.outputTokens);
  const selected = selectSources(originals, Math.min(94000,
    ctx.model.contextWindow - bytes(systemPrompt) - maxTokens - bytes(candidate) - 12000));
  const input = JSON.stringify({validationErrors, requiredSearchIndexes,
    candidate, sources:selected.selected, coverage:selected.coverage});
  if (bytes(input) > 98304 ||
      bytes(input) + bytes(systemPrompt) + maxTokens + 8192 > ctx.model.contextWindow)
    throw Error('Handoff field repair exceeds preparation input budget');
  const response = await ctx.modelRegistry.streamSimple(ctx.model, {
    systemPrompt,
    messages: [{ role: 'user', content: input, timestamp: Date.now() }],
  }, { maxTokens,
    reasoning: generation.reasoning, signal }).result();
  if (signal.aborted) throw Error('Handoff repair deadline or cancellation');
  if (response.stopReason !== 'stop')
    throw Error(`Handoff field repair did not finish: ${response.stopReason}`);
  const content = response.content.filter(c => c.type === 'text')
    .map(c => c.text).join('').trim();
  const fenced = /^```(?:json)?\s*\n([\s\S]*?)\n```$/.exec(content);
  const patch = JSON.parse(fenced ? fenced[1] : content);
  if (!Array.isArray(patch.exactValueSplits) || !Array.isArray(patch.stepChanges) ||
      Object.keys(patch).length !== 2)
    throw Error('Invalid Handoff field-patch shape');
  const fixed = structuredClone(candidate);
  const exactSeen = new Set(), stepSeen = new Set();
  for (const part of patch.exactValueSplits) {
    if (!Number.isInteger(part.index) || part.index < 0 ||
        part.index >= fixed.exactValues.length || exactSeen.has(part.index) ||
        Object.keys(part).sort().join(',') !== 'index,label,separator' ||
        typeof part.label !== 'string' || typeof part.separator !== 'string')
      throw Error('Invalid exact-value field patch');
    exactSeen.add(part.index);
    fixed.exactValues[part.index].label = part.label;
    fixed.exactValues[part.index].separator = part.separator;
  }
  for (const part of patch.stepChanges) {
    if (!Number.isInteger(part.index) || part.index < 0 ||
        part.index >= fixed.steps.length || stepSeen.has(part.index) ||
        Object.keys(part).sort().join(',') !== 'index,phase,status' ||
        !['before_handoff', 'after_handoff', 'anytime'].includes(part.phase) ||
        !['pending', 'completed', 'uncertain'].includes(part.status))
      throw Error('Invalid step field patch');
    stepSeen.add(part.index);
    const before = candidate.steps[part.index];
    const source = timingOriginals.find(s => s.id === before.authorization?.source);
    if ((before.phase !== part.phase || before.status !== part.status) &&
        (!afterInstruction(source) || part.phase !== 'after_handoff'))
      throw Error('Step timing change lacks original after-Handoff authorization');
    if (before.status !== part.status) {
      if (before.status !== 'completed' || part.status !== 'pending' ||
          !requiredSearchIndexes.includes(part.index))
        throw Error('Only pre-Handoff read-only search may return to pending');
      fixed.steps[part.index].completion = [];
    }
    fixed.steps[part.index].phase = part.phase;
    fixed.steps[part.index].status = part.status;
  }
  const firstPending = fixed.steps.find(step => step.status === 'pending');
  if (fixed.status === 'active' && firstPending && fixed.nextAction !== firstPending.text) {
    const oldAction = fixed.nextAction;
    fixed.nextAction = firstPending.text;
    for (const claim of fixed.claims)
      if (claim.kind === 'nextAction' && claim.text === oldAction)
        claim.text = firstPending.text;
  }
  const state = validate(fixed, originals);
  for (const index of requiredSearchIndexes) {
    const step = state.steps[index];
    if (step.phase !== 'after_handoff' || step.status !== 'pending')
      throw Error('Post-Handoff evidence search still not pending');
  }
  return state;
}
