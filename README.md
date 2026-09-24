# Pi Handoff Plugin

A Pi plugin that allows three successful native compactions, then replaces the
next compaction with an attributed Handoff in the same visible conversation.
Authorized active work continues automatically. Completed or cancelled work stays
stopped. Earlier messages and evidence remain available through original-history
search and bounded reads.

## Install

Supported runtime: **Pi 0.87.1**, Node **>=22.19.0**, Linux with persistent local
session storage outside the workspace. From a trusted local source checkout:

```sh
pi install /absolute/path/to/Context-handoff
```

Pi loads the package's TypeScript extension directly. It is a plugin, with no Skill
or Coffee Host prerequisite. Installing enables it in sessions that load the package.
This repository task does not activate it in the owner's production installation.

For a standalone artifact, build and pack, extract the tarball into a permanent
local directory, then install the extracted `package` directory with `pi install`:

```sh
npm ci --ignore-scripts
npm run check
npm pack
```

## Behavior and limits

- The fourth **would-compact** event triggers Handoff; nothing switches immediately
  after the third success. Manual successes count too.
- Original user constraints/corrections are retained as source inputs. Claims carry
  verified quotations, authority labels and supersession links.
- `handoff_evidence` searches original active-branch history and reads verified ranges.
- Preparation, retrieval and continuation have explicit budgets and failure states.
  Third-party asynchronous tools require the documented settlement event.
- Scripted-provider acceptance demonstrates orchestration and source integrity.
  Improved real-model comprehension has **not** been measured or claimed.

## Project documents

- [Specification](SPEC.md): authoritative revision 2.
- [Implementation and budgets](docs/plugin-design.md).
- [Acceptance and TDD evidence](docs/plugin-acceptance.md).
- [Domain vocabulary](CONTEXT.md).
- [Prior-art research](docs/billion-context-task-state-research.md).
- [Parent issue](http://192.168.100.1:3000/awangs/Context-handoff/issues/1).

The old `src/context`, integration snapshots and four packet tests are historical
Coffee references. The new package entry does not import them; their passing tests
are not new-plugin acceptance. [Historical status](docs/implementation-status.md)
and [provenance](provenance.json) remain available.
