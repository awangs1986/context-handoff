# Pi Handoff Plugin

A new Pi plugin for automatic, invisible task Handoff after three successful
native summary compactions. The next compaction boundary performs Handoff and
continues authorized work inside the same visible Conversation.

**Status: specification ready; new plugin not implemented.**

## Project entry points

- [SPEC.md](SPEC.md): revision 2, the authoritative new-plugin specification.
- [CONTEXT.md](CONTEXT.md): domain vocabulary.
- [Research](docs/billion-context-task-state-research.md): source-based comparison with context-fold.
- [Implementation Issue #1](http://192.168.100.1:3000/awangs/Context-handoff/issues/1): `ready-for-agent`, scope and acceptance.
- [Historical import status](docs/implementation-status.md): earlier Coffee code and limitations.

The source and integration trees currently contain the earlier Coffee import.
They are historical reference material, not a partially completed implementation
of the new specification. The owner requested a fresh design. In particular, the
old idle successor does not satisfy automatic continuation, and Coffee Host is
not required as the new architecture.

## Historical code checks

Node >= 22.19.0, npm and Git are required. `npm ci` followed by `npm run check`
builds the old imported packet/resolver and runs its four synthetic tests only.
It does not validate the new plugin, run the Coffee integration snapshot, or call
a model. [Import verification](docs/import-verification.md) records that limited
result; [provenance.json](provenance.json) records the original source hashes.

No new plugin distribution license is selected here. Future copied/adapted
third-party code must preserve its original license and provenance.
