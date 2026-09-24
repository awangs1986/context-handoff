# Context folding and task handoff

Revision 1 — 2026-09-24.

Status: **selective context-fold learning/adaptation direction accepted; existing
Coffee Handoff imported; combined runtime and semantic improvements not implemented.**

## 1. Purpose and evidence limits

Reduce context growth while preserving the task's effective requirements,
corrections, progress and recoverable evidence. Model-generated compaction is
lossy; repeated compaction can carry forward omissions and errors. Neither a
fixed number of compactions nor creating a fresh session guarantees continuity.
Handoff quality depends on source selection and reconciliation with current facts.

The owner selected learning from context-fold and selectively reusing useful
mechanisms, combined with improving Coffee's independent Handoff. Wholesale
adoption of upstream defaults is not selected. This repository is the requested
home for that specification and existing handoff code.

The earlier proposal to replace native summary compaction entirely has not been
ratified. The latest discussed combination is ingress limits, same-session
evidence folding, native summary compaction when necessary, and Handoff at a
selected boundary. Coffee currently retains native compaction as its release
baseline; the combined candidate remains future work.

## 2. Separate mechanisms

| Mechanism | Responsibility | Current status |
| --- | --- | --- |
| Ingress limits | Admit useful bounded results; keep accepted evidence outside main context | Existing Coffee behavior; reference source imported, not a standalone implementation here |
| Folding | Compact stale evidence while retaining references and current working material | Selected adaptation direction; absent from this runtime |
| Summary compaction | Reduce broader conversation history when needed | Pi-native Coffee baseline |
| Handoff packet | Carry attributed task state and recoverable selected evidence | Existing bounded core imported |
| Session rollover | Commit a successor under one stable Conversation | Coffee P7 implementation imported as integration reference |

context-fold, Matt Pocock's Handoff Skill, and Coffee Handoff are distinct.
Coffee Handoff is not an improved version of the context-fold package. The Skill
informed content organization; it does not implement the runtime transition.

## 3. What to learn from context-fold

Inspected source: `context-fold@0.5.1`,
[Middlewatch/context-fold](https://github.com/Middlewatch/context-fold).
The original Coffee lockfile pins its npm tarball and integrity value. This is
the inspected version, not a statement about the latest upstream release.

| ID | Selected mechanism and source | Required adaptation | Acceptance |
| --- | --- | --- | --- |
| CF-01 | Stale tool-output masking: `src/core/policy/fold-ladder.ts`, `src/core/apply.ts` | Replace eligible old tool-result bodies in the outgoing projection; retain durable sources and action/result identity. Skip content whose identity or recoverability is uncertain. | Old evidence is smaller in the actual provider request; stored source is unchanged and recoverable. |
| CF-02 | Exact lexical index: `src/core/index/seed-index.ts`, `docs/SEED_INDEX_SPEC.md` | Keep exact paths, commands, symbols, versions, numbers and error excerpts with source anchors. Mark bounded selection and omissions. Historical errors must not be represented as current blockers without evidence. | A fixture recovers an old exact identifier/error spelling; an older failed check is distinguishable from a later pass and from unverified current code. |
| CF-03 | Bounded retrieval and verification: `src/adapters/pi/unfold-tool.ts`, `ledger.ts`, `store.ts` | One small recovery interface for search and scoped reads across authorized history/evidence. Preserve existing accepted-evidence storage and legacy recall. Verify source identity, range and integrity; expose missing or unverified sources. | Bounded search finds an original source across a successor boundary; scoped retrieval succeeds and altered, missing or foreign sources fail explicitly. |
| CF-04 | Discrete fold events and frozen layers: `src/core/policy/fold-ladder.ts`, `src/adapters/pi/store.ts` | Batch worthwhile folds and keep committed substitution bytes stable between events. Measure outgoing bytes; distinguish estimated savings from provider-reported cache costs. | Identical old context remains byte-stable between fold events; a later event does not silently rewrite already frozen records. No cache-efficiency claim from estimates alone. |
| CF-05 | Protected working tail and tool pairing: `src/core/contract.ts`, `src/core/block.ts`, `src/core/apply.ts` | Preserve user requirements, recent working material and action/result structure. Newly produced results must reach the model in their ingress-approved form at least once before folding. Keep media and provider-specific reasoning constraints explicit. | A fresh result is delivered before eligibility; multi-tool responses remain paired; media and signed/opaque reasoning are preserved or explicitly rejected through a supported provider path. |

"Delivered once" means the result approved by ingress policy, not an unlimited raw
tool dump. Folding must not undo rejection before persistence for invalid search
results. It must not create a competing search-evidence store or duplicate large
evidence bodies already held in Conversation-owned artifacts.

Learning these mechanisms does not require retaining context-fold as a complete
runtime dependency. Dependency strategy is an implementation choice to resolve
after identifying reusable interfaces. Do not modify installed node_modules as a
delivery mechanism. Copy/adapt only identified source with source pins, a change
inventory and the original MIT license (Copyright 2026 Jake Gardner).

## 4. Upstream behavior not adopted by default

- Deterministic hard-compaction interception: upstream defaults to rendering a
  bounded seed index in place of Pi's model summary. Exact extraction alone does
  not establish the current objective, effective corrections or task progress.
- User-message first lines as task state: later paragraphs and older corrections
  may be essential; first-line extraction is insufficient.
- Sticky full `unfold`: default recovery should return bounded temporary detail,
  not permanently repopulate the standing context.
- Upstream manual session switching: Coffee Host owns Conversation/session binding.
- Blind reuse of thresholds, token estimates or reasoning masking: upstream's
  character estimate omits image cost and does not establish provider compatibility.
- Global local-session fold codes as successor handles: source-session identity
  must travel with the reference; transformed request text may differ from ledger
  text, so identity/hash checks must establish which original is recoverable.

No guarantee of better task outcomes is inferred from upstream efficacy claims.

## 5. Handoff semantic improvements required

| ID | Requirement | Existing gap |
| --- | --- | --- |
| HF-01 | Select relevant original owner requirements and corrections, including important older decisions; expose missing coverage | Current extension selects the first user message, recent 15 user messages and recent 8 assistant messages; earlier middle history can be omitted |
| HF-02 | Preserve effective and superseded constraints with individual provenance; do not promote evidence instructions or model guesses to owner authority | Current schema has general source IDs and completed-item citations, but no per-constraint supersession relation |
| HF-03 | Reconcile task claims with current authoritative project artifacts, checkout and observed verification evidence | Current checkout fingerprint detects changes; it does not independently verify a claimed implementation or passing test |
| HF-04 | Recover original evidence across successive handoffs without depending only on generated briefs | Current successor carries selected redacted/truncated source excerpts, not complete originals or a general history search |
| HF-05 | Make uncertainty and incomplete coverage explicit; validate task continuation separately from byte integrity | Current validation confirms shape and known source IDs, not that the cited evidence supports the generated claim |

Task-state extraction timing remains open. Generating it on every fold event was
an earlier assistant suggestion, not an accepted requirement. Continuous task
notes or a general memory framework are not authorized. The current implementation
uses a bounded model call at handoff preparation; its selection and validation
require improvement before semantic benefit can be claimed.

## 6. Trigger, mode and failure constraints

The existing Coffee P7 candidate uses three successful native Work compactions,
then hands off at the next settled threshold-pressure boundary. It does not
switch immediately after success three. Failed/cancelled attempts and Chat
compactions do not increment the Work count. A committed successor starts at zero.

Three is the existing policy and proposed engineering starting point, not a proven
safe maximum or an optimum. Same-session folds do not count as model-summary
compactions. Detecting semantic drift automatically or changing the trigger based
on it is not implemented. Exact fold thresholds and headroom margins remain open.

Existing scope is main Work sessions; Chat retains native compaction. Expanding
folding or Handoff into Chat is not approved by this import. Pi core remains
unmodified. Preserve Host lifetime across browser disconnects, Conversation and
Workspace identity, main/child distinction, and existing evidence ownership.

Prepare only at a safe point with tools and children settled. Concurrent input,
cancellation or changed code invalidates preparation. Persist and establish the
successor binding before retiring the predecessor. Never replay uncertain side
effects or claim a failed transition succeeded. Report ambiguous commits and
missing sources explicitly. The current successor starts idle; autonomous
continuation after rollover requires a separately specified behavior.

## 7. Minimal delivery stages

1. **Import and specification (this change):** preserve runnable handoff core,
   Coffee integration sources, original tests and revision/hash provenance. Build
   and check the extracted core; keep historical P7 results separately attributed.
2. **Folding and recovery candidate:** implement CF-01 through CF-05 behind Pi's
   public extension interfaces, preserving ingress policy and native-only fallback
   configuration. Start with stale tool results; do not enable opaque reasoning
   transformations without provider-specific support. Keep the candidate opt-in.
3. **Handoff content improvement:** implement HF-01 through HF-05 with bounded
   source selection and explicit evidence coverage. Choose task-state timing and
   schema before changing behavior; use original project sources rather than a
   chain of generated summaries.
4. **Combined integration:** coordinate folding, native compaction and Handoff in
   Coffee; ensure competing hooks cannot run both strategies at one boundary.
   Define failure/fallback behavior explicitly before enabling the combination.

For stages 2–4, use focused synthetic public-interface acceptance for payload
reduction, recent-result protection, exact retrieval, revised requirements, stale
tests, interrupted transitions and source scope. A passing integrity or lifecycle
test does not prove correct model continuation. Any future real-model evaluation
requires separate authorization and uses `eidolon/gpt-5.6-terra`; do not repeat
the inconclusive P7 pilot as part of this import.

Production default changes, P8 deployment, model changes and public package/GitHub
publication are outside this change. Publishing these requested files to the
owner's Context-handoff Gitea repository does not activate them in Coffee.

## 8. Evidence and remaining choices

See [implementation status](docs/implementation-status.md) and
[import verification](docs/import-verification.md). Historical P7 completed 16
attempts with no complete successful pair due to budget failures/timeouts; it
does not demonstrate semantic superiority over native compaction.

Open choices: task-state timing and extraction schema; exact source-coverage and
retrieval budgets; selected context-fold dependency/source reuse; fold thresholds
and provider support; combined failure/fallback semantics; future activation and
distribution license. Record decisions here before claiming them implemented.
