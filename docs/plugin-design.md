# Pi Handoff implementation

Implements SPEC revision 3 as a new Pi package. The Coffee import remains unchanged
and is not linked by the package entry. Supported and tested runtime: Pi 0.87.1,
Node 22.23.2, Linux, persistent local session storage outside the workspace.

## Public integration

`session_before_compact` reads successful native compactions from the active
branch. The configured count (default three) is allowed; the next preparation is replaced by an attributed
Handoff summary. Failed attempts have no committed native entry and do not count.
A plugin compaction starts a new cycle. Existing native history is counted, rather
than guessing a process-local counter. Pi owns its pairing-safe cut point, session
identity, original history, system instructions, tool schemas and selected model.
No Pi core patch or Coffee Host is involved.

Synthesis uses `ctx.modelRegistry.streamSimple()` with the selected provider,
including its request-time authentication and Pi thinking level via the provider-neutral `reasoning` option. Budget settings are captured for each attempt; a thinking-level change during generation invalidates the result. It is separate from native synthesis.
Manual compaction aborts the active run in Pi; this plugin does not restart that
manually stopped run. Threshold Handoff prepares one continuation at
`agent_before_settle`, using a hidden custom-message draft and `continue: true`.
It does **not** leave a follow-up queued after cancellation. Overflow uses Pi's
existing retry, with no second continuation. Completed/stopped/uncertain states
suppress automatic retry. The ordinary Pi compaction indicator may still appear;
there is no new conversation or user handoff ceremony.

## Attributed Task State and original sources

All original user messages are mandatory synthesis inputs, including older
corrections and later paragraphs. Current bounded project observations are also
mandatory. Optional assistant/tool observations are ranked by exact identifiers
and recency to fit the remaining budget. Source coverage and omissions are
explicit. Synthesis cannot claim omitted observations were verified. Critical
unresolved conflicts must produce `uncertain`, which stops automatic continuation.
There is no recursive summary ladder and no continuously maintained notes.

The model returns at most 12 claims of 512 characters each, using source IDs instead of reproducing quotations and metadata. The program binds source IDs to original hashes and observation timestamps. Legacy quoted evidence is still accepted and checked literally. Validation checks source existence, claim kinds and replacement targets. Tool/assistant evidence alone cannot become an objective, owner constraint,
correction or accepted decision. An active next action must itself be attributed
to original user evidence. Authority labels are computed by the plugin.

**These checks establish attribution, not entailment.** A model can still
misinterpret a quote, mistake a quotation within a user message for an instruction,
or misjudge completion. Whole-message source IDs establish attribution, not statement-level entailment. The synthesis prompt explicitly addresses those cases;
only a separately authorized semantic evaluation can measure the remaining error.
There is no claim of zero drift or a proven safe three-compaction interval.

Project inspection hashes bounded current files and the Git revision. It records
paths, modification times and read scope, and provides bounded text. Large/binary
files and symlinks are explicitly unverified. It runs only read-only Git inspection,
never tests or user commands. Historical verification is not current verification.
Changed history bytes, checkout observations, branch leaf, input, model or tool
loadout invalidate preparation before context installation.

## Original recovery

The single model tool, `handoff_evidence`, offers exact lexical search and scoped
UTF-8 byte reads over original admitted messages on the active branch. Anchors
contain session ID, entry ID and SHA-256 of the original message representation,
including its media metadata. Reads compare the anchor with the persisted source.
Foreign, missing, changed, out-of-branch and split-UTF-8 requests return explicit
errors. Search previews include role and discovery anchors; compact indexes may
omit entries but the original-history search can still find them.

Recovered tool bodies remain available across intermediate tool calls in the same
user turn, within a 32 KiB content window (newest first). A new user turn or window
pressure replaces expired bodies with a short retrieval reminder. Original tool
history remains stored, and tool-call/result pairing is preserved. Media admitted by Pi remains in its native history. Textual
recovery reports that images were retained without claiming visual understanding.
Rejected or omitted-at-ingress media is not recreated by the plugin.

## Budgets

| Work | Limit |
| --- | --- |
| Original history integrity/recovery scan | 8 MiB |
| Mandatory + selected synthesis source payload | 96 KiB, further reduced for model capacity |
| Generated Task State | 12 claims / 512 characters per claim and next action; installed state 12 KiB |
| Provider output (including reasoning) | Default 16,384 with reasoning, 4,096 off; configurable 1,024–65,536, capped by model and half-context capacity |
| Compact evidence index | 8 KiB plus coverage/discovery metadata |
| Installed Handoff summary | 24 KiB |
| Synthesis deadline / automatic synthesis retries | Default 120 seconds with reasoning, 60 seconds off; configurable 100–300,000 ms / zero |
| Project inventory / file bytes | 1,024 paths / 8 MiB |
| Project text / individual inline file | 32 KiB / 8 KiB |
| Each read-only Git operation | 3 seconds |
| Recovery search page / read / total result | 8 matches / 4 KiB / 8 KiB |
| Request headroom | 8,192 units reserved beyond a conservative UTF-8 byte estimate of summary, retained messages, instructions and tools |

The request estimate is deliberately conservative and is **not** provider token
usage. Provider usage is not inferred from saved packet size. Oversized required
owner/project coverage fails visibly; the plugin does not promise infinite usable
history or silently discard mandatory constraints. Filesystem operations assume
local storage; a remote filesystem can have different latency/durability behavior.

## Work settlement and cancellation

Pi's tool lifecycle tracks in-flight calls. Extensions owning delegated work must
emit the following public event before returning an asynchronous tool result, and
again when its complete result has been admitted to the owning conversation:

```ts
pi.events.emit('pi-handoff:work', {
  id: 'stable-operation-id',
  tool: 'owning_tool_name',
  status: 'running' // later 'settled', or 'unknown' if outcome is uncertain
});
```

Status observations persist in the native conversation. Unknown custom tools
without a settlement report block Handoff. The owner of an operation must not
report `settled` before its result is available. Ordinary synchronous built-in
Pi tools are supported. Uninstrumented background work outside Pi is not observable
through this interface; such hosts need an adapter before claiming seamless
settlement. No delegation subsystem is included.

Queued new input invalidates preparation and remains in Pi's queue exactly once.
Cancellation is checked throughout synthesis and before commit. A new user message
also invalidates a pending continuation. Routine success requires no attention;
failures produce a bounded visible status without a fourth native fallback.

## Persistence and recovery

The native compaction entry is the canonical installed context. A sibling
`<session-file>.handoff.json` records a checksummed preparation/installation phase,
summary identity and continuation ownership. It contains bounded metadata, not a
second transcript. Journal writes use a private temporary file, file fsync, rename
and directory fsync. Before continuation, the native entry is read back and synced.

A normal restart restores the native branch count. An explicit Pi fork inherits
its committed checkpoint with fresh continuation ownership; unrelated branches do
not share source scope. A crash after installation with uncertain continuation
shows recovery status and does not replay work. Corrupt/missing required journal
state blocks new input until repaired and reloaded. Storage failure during native
append blocks execution and reports through Pi UI notifications, avoiding additional
entries attached to an unpersisted parent. Restart uses the previous committed
history. Local fsync sequencing is tested; arbitrary hardware/filesystem failure
is not claimed to be impossible.

## Packaging and provenance

The `pi.extensions` manifest points at the new TypeScript entry, which Pi loads
natively. Both source checkouts and packaged tarballs work without Coffee or a Skill.
`npm run build` also emits declarations/JavaScript. The Pi peer version is pinned to
0.87.1; runtime TypeBox is pinned to 1.3.7. Other Pi/provider versions have not been
accepted by this suite. Native RPC lifecycle is the acceptance seam; this is not a
separate graphical TUI automation test.

No upstream source was copied into `src/plugin`. Selective conceptual learning:
context-fold 0.5.1 (exact lexical anchors, integrity and bounded recovery), and
billion-context-pi 0.1.77 at `fd8095e69ca3317b52fb58adccf9745a3dc18dfa`
(original-history search, scoped recovery and goal evolution). See the research
note. Existing Coffee snapshots/provenance/licenses are unchanged and excluded
from the shipped plugin files. New plugin distribution remains private/UNLICENSED.

## Program-owned evidence record

Native history remains the original-message store. Each committed Handoff's native
compaction details contain the deterministic source manifest (ID, role, hash,
timestamp), history fingerprint and bounded read-only project snapshot. The model
never generates that record. Active context contains concise state, current project
observation time/revision and a compact index, not the full archived project bodies.
`handoff_evidence` searches/reads project snapshots from committed Handoffs on the
active branch with a `historical-project-observation` role. Their anchors identify
the compaction and source index and hash actual stored bytes. They confer neither
owner authority nor verification of a later workspace revision.

The model's 12-claim budget makes omission possible; complete original owner input
remains in synthesis and original recovery stays available. Hash/reference checks
cannot prove coverage or semantic correctness. Fidelity must be checked against
independent expected outcomes after automatic continuation.
