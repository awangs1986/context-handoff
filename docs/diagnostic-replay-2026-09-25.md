# Frozen-request diagnostics for Handoff (2026-09-25)

This follow-up separates two model decisions that the earlier full Pi pilot
combined: generating a valid Task State at the fourth boundary, and choosing
the correct original-evidence tool after a search. It identifies candidate
product changes. A frozen request tests one decision; it is **not** a full Pi
acceptance run or a new ConFiQA score.

## Method

The inputs were captured, unmodified model requests from the previous
[ConFiQA-derived Pi pilot](confiqa-derived-pilot-2026-09-25.md). Both source
items remained outside Git. The same `gemini-3.8-flash` model and `high`
reasoning setting were retained. For each replay, only the named experimental
surface changed:

1. **Evidence-tool choice:** freeze the request immediately after Pi had
   returned search matches for the corrected source. Compare the current
   `handoff_evidence` tool, the same tool with action-specific required fields,
   and separate `handoff_evidence_search` / `handoff_evidence_read` tools. The
   independent oracle is a real tool call reading the original user anchor
   from that search result. Plain text describing a call and a search with an
   anchor are failures. Run two repetitions per item and variant.
2. **Task State generation:** freeze each original synthesis source packet.
   Compare its existing developer prompt with an appended field/phase checklist.
   Parse the model JSON and run the plugin's actual `validate` function against
   the captured original sources. Transport failure, output truncation, JSON
   parsing and validation are separate outcomes. This isolates generation;
   it cannot establish continuation fidelity.
3. **Full Pi gate:** put the split-tool interface in an isolated, unmerged
   experimental checkout and run the same four-turn Pi scenario. Observe the
   actual three native compactions, fourth boundary, committed Handoff, answer,
   original read and session identity. A second experiment also added the
   checklist and raised synthesis output capacity to 32,768 tokens. These
   experimental changes are not the product's default implementation.
4. **Validator-feedback patch:** replay parseable but rejected Task States.
   A small model response names only array indexes and corrected exact-value
   label/separator or evidence-step phase/status. The program keeps original
   values, source IDs, quotes, authorizations and unrelated claims unchanged,
   rejects side-effect status rollback, recomputes the first pending next
   action, and runs `validate` again. A separate oracle requires the original
   post-Handoff search to remain pending. This tests a repair candidate, not a
   production repair path.

Frozen request SHA-256 values (raw requests remain outside Git):

| Decision / item | Captured request SHA-256 |
| --- | --- |
| Evidence choice, QA 7 | `632d88ac2bd15d0b0130a01ba20edaa51d2393b16f7ae47e8dacdeea43cdee72` |
| Evidence choice, MC 5 | `8311ca4fd57ecfa8e6c81d70e77d304da816d766ad87e8ffeef831f226644af5` |
| Synthesis, QA 7 | `610ac4af6b2232c89e140645280f4ec4952155b9d0485bfa31b213526dc4becb` |
| Synthesis, MC 5 | `6f4406bc1a482dafcba262b5d26c918897394a6ef082327dba833df4070ad041` |

`scripts/replay-evidence-call.mjs`, `scripts/replay-synthesis.mjs`,
`scripts/replay-synthesis-repair.mjs` and
`scripts/replay-synthesis-field-patch.mjs` implement the diagnostics. They require
captured request/response paths and a new output directory outside Git;
credentials are read only from `PI_HANDOFF_EVAL_API_KEY`. Raw replay requests,
responses and per-run scores remain outside Git. They are opt-in paid tests and
are not part of `npm test`.
For a known timing requirement, set `PI_HANDOFF_REQUIRED_POST_SEARCH` to its
exact marker when running the field-patch diagnostic. Set
`PI_HANDOFF_REPLAY_RESPONSE_PATH` to rescore a saved response without another
provider call.

## Evidence-tool choice

All 12 predeclared calls returned HTTP 200 with usage and `high` reasoning.
The two repeats of each item produced:

| Tool schema | QA 7 correct reads | MC 5 correct reads | Total | Mean reported tokens per request |
| --- | ---: | ---: | ---: | ---: |
| Current combined tool | 0/2 | 0/2 | **0/4** | 3,556 |
| Combined tool with action-specific required fields | 1/2 | 2/2 | **3/4** | 3,549 |
| Separate search and read tools | 2/2 | 2/2 | **4/4** | 3,520 |

The baseline repeatedly sent an anchor and byte range with `action: search`.
One required-fields replay emitted a textual pseudo-call instead of a real
tool call. The split interface selected the exact corrected-source anchor in
all four replays. The token means are descriptive; four correlated replays of
two selected prompts cannot establish a general cost or success-rate change.

## Task State generation and full Pi gate

The prior QA Handoff failed validation because a labeled exact value had an
empty separator; its pending post-Handoff steps were also marked
`before_handoff`. Offline validation of the captured output confirms that
dropping the optional malformed exact-value records exposes the second error.
After also correcting the pending phases, the same state passes validation.
This is diagnostic only: the product must not silently rewrite authorization
or action timing on the basis of these manual edits.

A new baseline synthesis replay of that QA packet passed validation, whereas
the original full Pi generation failed. The checklist replay timed out once
before receiving a response and passed on retry. For the MC packet, baseline
and checklist replays both passed. These observations do **not** show a reliable
checklist advantage. An earlier unscored QA baseline replay timed out at
150 seconds; that batch was stopped and its failed artifact retained outside
Git. A separate one-attempt repair using the original rejected
QA state and the validator error ended at the 16,384-token output limit with
incomplete JSON. Raising the output limit or requesting another model turn
has a substantial cost and is not yet a demonstrated fix.

The isolated full Pi experiment kept the original synthesis prompt while
exposing only split evidence tools to the model. QA 7 again failed the exact-
value validator before any Handoff was committed. MC 5 ended synthesis at the
16,384-token limit, also with no Handoff. In a further QA 7 run, adding the
checklist and raising synthesis capacity to 32,768 tokens still failed the
exact-value validator. These are **three failed full-session attempts**; none
supports an end-to-end improvement claim for the combined prototype. The
split-tool result remains a strong local diagnosis of the continuation-tool
interface, conditional on reaching a valid Handoff.

## Validator-feedback patch follow-up

The first repair replay asked the model to regenerate the entire Task State;
it exhausted its 16,384-token cap with incomplete JSON. A second design asked
for complete replacement arrays and was also fragile: one result used an
invalid whitespace-only separator and another damaged a long quoted tool
result. A narrow indexed patch avoided copying original quotes or evidence.

The final diagnostic requested only changed `exactValueSplits` and
`stepChanges`. The program admitted only label/separator edits that kept each
original exact value and quote, and only evidence-step timing changes supported
by an original user instruction. Rolling a completed step back to pending was
allowed solely for a read-only evidence search originally required after this
Handoff; its pre-Handoff completion evidence was cleared. The first pending
step and attributed next-action claim were reconciled, then the normal
validator and a separate post-Handoff-search oracle both ran. A single,
otherwise empty JSON code fence was stripped in one saved response; extra
prose or unrelated fields would still fail.

| Captured invalid QA Task State | Structural validation | Post-Handoff search pending | Repair tokens | Repair time |
| --- | --- | --- | ---: | ---: |
| Original pilot | Pass | Yes | 9,548 | 11.1 s |
| Split-tool full Pi experiment | Pass | Yes | 11,405 | 35.2 s |
| Split + checklist/cap full Pi experiment | Pass after strict fence parsing | Yes | 14,177 | 74.9 s |

These are **3/3 successful frozen repairs of selected, parseable invalid
states**, including the actual QA failure seen in the original pilot. Earlier
draft repair attempts remain in the raw artifacts as failures. This does not
cover truncated synthesis, unparseable original JSON, conflicting owner
instructions or side-effect replay. The model's repair costs are substantial
and must be included in any future product comparison.

An isolated Pi experiment wired this constrained repair after normal
validation. Its first run stopped before the fourth boundary when an upstream
response stream timed out during native compaction, so it says nothing about
repair. The retry completed four boundaries and passed the full QA acceptance
checks: committed Handoff, same session, post-boundary search and read,
correct answer. **No repair request occurred** in that successful run; the
original synthesis happened to validate. It establishes integration did not
block that run, but cannot attribute its success to repair. The prototype was
not merged into the implementation branch.

## Product direction

1. **First, make Task State production dependable.** Keep fail-closed
   validation. A tightly bounded *indexed* validator-feedback patch is the
   strongest repair candidate so far: it preserved exact values and original
   authorization and passed three frozen invalid states. Add an independent
   timing oracle; structural validation alone accepted a state that treated a
   required post-Handoff search as already completed. Test forced repair in
   the public Pi lifecycle before adopting it. The checklist, larger cap and
   whole-state retry did not solve the full-session failure; parseable-invalid
   and truncated outputs need separate paths.
2. **Then split evidence search and read.** Two small tools with their own
   required arguments are the best-supported interface candidate: 4/4
   correct next calls versus 0/4 for the current combined tool on frozen
   requests. The API change needs normal compatibility review, public Pi
   tests and a full live cohort with committed Handoffs before defaulting it.
3. **Keep separate acceptance gates.** A correct final answer from retained
   context is semantic success, not proof of Handoff. Report synthesis validity,
   committed boundary, autonomous continuation, exact original read, final
   answer and total provider usage as separate metrics. Preserve failed and
   timed-out requests; do not exclude them from future cohort summaries.

The current product code was not changed by this diagnostic. The experimental
checkout is separate from the implementation branch. The observed positive
result is a narrow tool-selection effect, and the dominant product bottleneck
in these full conversations remains Task State generation reliability.
