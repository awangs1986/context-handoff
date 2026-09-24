# Context Handoff

Vocabulary for retaining a task's meaning while reducing its active context.

**Folding**:
Replacing older evidence in active context with a compact record and a reference
to recoverable source material.
_Avoid_: lossless understanding, summary compaction

**Summary Compaction**:
Replacing a broader portion of active conversation history with a shorter
model-generated account. Information selection makes this lossy.
_Avoid_: folding, Handoff

**Handoff**:
Preparing attributed current-task material for a successor session to continue
the same authorized work.
_Avoid_: context-fold, generic memory

**Task State**:
The current objective, effective constraints and corrections, confirmed decisions,
completed and remaining work, uncertainties and next action.
_Avoid_: keyword index, transcript

**Evidence Anchor**:
A reference identifying the original source and the exact extent of evidence
that can be recovered and checked.
_Avoid_: proof of semantic correctness

**Conversation**:
The stable user-facing task, retaining its workspace and history across native
session segments.
_Avoid_: individual model request

**Session Segment**:
A native Pi session contributing to one Conversation before or after a Handoff.
_Avoid_: new task, new checkout
