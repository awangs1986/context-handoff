# Context Handoff maintenance

Read README.md, SPEC.md, CONTEXT.md and docs/implementation-status.md before changes.
Use Chinese for owner discussion and English for maintained documentation.

- SPEC.md is the behavioral authority for this repository. Separate accepted
  direction, proposed engineering choices, implemented behavior and evidence.
- Keep Pi core unmodified. Folding, native summary compaction and Handoff are
  separate mechanisms; Coffee P7 is a Host rollover implementation.
- Keep the integration reference pinned; do not silently edit snapshot files.
  Changes to runnable imported code must be documented against provenance.json.
- Do not treat this import as authorization to activate a candidate, deploy Coffee,
  change production models, or rerun real-model evaluations.
- Keep original transcripts, evidence bodies, credentials and generated runtime
  packets out of Git. Only synthetic fixtures belong in this repository.
- For behavioral changes, test the public interface and run npm run check.
  Preserve failures and report the actual check scope; do not equate packet
  integrity with correct task continuation.
- Attribute any copied/adapted third-party source and retain its original license.
