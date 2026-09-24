# Pi Handoff acceptance — SPEC revision 2

Date: 2026-09-24. Scope: PH-01–PH-08 (Gitea child issues #2–#9).
The owner authorized TDD at the whole Pi conversation seam. The parent issue #1
is not modified or closed by this implementation.

## Reproduction

```sh
npm ci --ignore-scripts
npm run check
npm pack
```

Use Node >=22.19.0; the recorded environment uses Node 22.23.2, npm and Linux.
The lockfile pins Pi 0.87.1 and package dependencies. No production credentials,
real model calls, deployed default changes or public registry publication are used.
Provider fixtures bind to loopback, run the real Pi RPC process, capture actual
outgoing requests and use isolated workspaces/session stores. Fault tests use real
filesystem permissions, cancellation and process termination. Run the permission
cases as an ordinary user, as in the recorded environment.

**Recorded result:** `npm run check` passed: TypeScript build and **30 tests in
2 files** (63.97 seconds). This includes **26 new plugin conversation cases** and
four unchanged historical packet cases. The latter are reported separately and
are not plugin acceptance. `git diff --check` also passed.

## Ticket evidence

| Ticket | Accepted engineering behavior | Conversation evidence |
| --- | --- | --- |
| PH-01 / #2 | New plugin; native successes 1–3; next boundary Handoff; automatic continuation in one Conversation | Stable session ID, original user history, actual continuing provider request; shipped scenario performs a real `read` tool action |
| PH-02 / #3 | Success ledger survives failures/restart/model selection/fork; repeated cycles; manual and auto counting | Two cycles, failures excluded, explicit forks before and after Handoff, three actual automatic native compactions |
| PH-03 / #4 | Original requirements, old corrections, quoted provenance, supersession, bounded generation | Older later-paragraph constraint retained; fake source rejected; tool observation cannot create owner authority; next action needs its own original authorization; oversized history has explicit omissions; stalled provider times out |
| PH-04 / #5 | Current project observations and exact facts; stale verification remains historical; changes invalidate | Current `protected.txt` content and exact `E_CASE_42` enter synthesis; modifying checkout or original history during synthesis prevents commit |
| PH-05 / #6 | Single bounded original search/read tool across two Handoffs | Narrative omits a rare fact, search finds it, exact read restores it; foreign and changed anchors and split UTF-8 reads are rejected; later requests retain valid tool pairing |
| PH-06 / #7 | New input, cancellation, settlement and one continuation | Concurrent correction arrives once; cancellation during preparation and after commit; completed task suppresses threshold/overflow continuation; delegated work must settle |
| PH-07 / #8 | Coherent local commit and conservative recovery | Journal directory denial; native session-file denial; hard process exit after commit; corrupt journal; recovered installed context cannot be mislabeled as the old context when journal update fails |
| PH-08 / #9 | Installable Pi package and assembled contract | Tarball loaded by Pi package discovery in a clean agent environment, two cycles and actual file read; source checkout works without `dist`; original admitted image and instructions retained; request/output headroom checked |

## Preserved red → green observations

Tests were added incrementally against the public seam. Representative failures
that drove implementation, preserved here instead of discarding them:

1. Missing new extension: `Extension path does not exist`.
2. Fourth-boundary baseline: expected one Handoff, received zero.
3. Older corrections: continuing request lacked `Never publish credentials.`.
4. Current project facts: synthesis lacked `CURRENT_REVISION ... E_CASE_42`.
5. Original recovery: Pi returned `Tool handoff_evidence ...` rather than evidence.
6. Concurrent input: expected no stale Handoff, received one committed Handoff.
7. Delegated work: compaction resolved while the independent operation was running.
8. Journal write failure: compaction incorrectly resolved rather than rejecting.
9. Corrupt journal: new input was appended instead of being blocked for repair.
10. Long observation history: compaction cancelled rather than selecting bounded
    optional observations while retaining all owner constraints.
11. Valid tool quotation promoted into authority: compaction incorrectly resolved.
12. Unattributed next action: an active destructive next action incorrectly passed.
13. Fork after Handoff: valid inherited history was reported as a missing journal.
14. Original transcript changed during preparation: stale context still committed.
15. Overflow after a completed task: an extra provider request occurred.
16. Native append failure: writing a subsequent error produced an orphan history
    chain; restored active messages contained errors but lost `Continue inspection.`.
    Reporting via Pi UI instead preserved the previous committed active context.
17. Cancel after commit: the next user input caused 12 total requests instead of 11,
    exposing an old queued continuation. Moving continuation to Pi's public
    `agent_before_settle` draft interface removed the leftover queued work.
18. Full request headroom: a replacement was accepted despite oversized real
    instructions; the installed-context budget now includes instructions/tools/tail.
19. Source installation: package discovery found no Handoff without `dist`.
    The Pi manifest now points to the shipped TypeScript entry.
20. Recovery journal still unwritable: an installed checkpoint was incorrectly
    reported as "previous context retained". Recovery now distinguishes absent
    commit from failure updating the journal after a verified installed commit.

Some acceptance cases already passed through an earlier vertical slice (for
example initial persistent counting); they were retained as regression evidence,
not presented as additional red cycles. Fixture corrections are also distinct
from product fixes: Pi rejects immediate re-compaction of an unchanged compacted
session; pressure must be on the final assistant response rather than a preceding
tool call; a malformed PNG was rejected at Pi ingress and was replaced by a valid
synthetic image. The tests preserve **admitted** media, never resurrect rejected
media. No historical Coffee test result was substituted for these cases.

## Meaning of the result

The suite demonstrates deterministic orchestration, lifecycle boundaries, source
identity/quotation checks, packaging and conservative failure handling through the
real supported Pi public interfaces. It does not establish that a real model always
understands goals, quotations, supersession or completion correctly. In particular,
source hashing and scripted synthesis are not evidence of improved semantic
fidelity over native compaction. A separately authorized real-model evaluation
with independent expected outcomes remains necessary for that claim.

See [design and limits](plugin-design.md) for exact budgets, supported synchronous
work and the delegated-work adapter contract. Unknown asynchronous host state,
other Pi versions, remote filesystem durability and other provider protocols are
not silently advertised as tested. Original history beyond the bounded scan or
mandatory requirements beyond the preparation budget causes an explicit stop.
