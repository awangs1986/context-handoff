# Context Handoff

Selective context folding and attributed task handoff for Pi/Coffee.

The current delivery contains the existing Coffee handoff packet/resolver code,
its four original tests, and a pinned snapshot of Coffee's Host integration.
The context-fold mechanisms in [SPEC.md](SPEC.md) are planned work, not implemented
features. This is not a fork of context-fold and is not yet an installable Pi extension.

## Read first

- [SPEC.md](SPEC.md): agreed direction, mechanisms to learn, limitations and delivery gates.
- [CONTEXT.md](CONTEXT.md): domain terms.
- [Implementation status](docs/implementation-status.md): current code and known gaps.
- [Coffee integration](integrations/pi-coffee/README.md): Host-dependent P7 sources.
- [Provenance](provenance.json): original revision and hashes for every imported file.

## Build and check

Requires Node >= 22.19.0, npm and Git on PATH.

```sh
npm ci
npm run check
```

The check builds the packet/resolver and runs four existing synthetic tests. It
does not run Coffee Host integration tests, start a Pi session, contact a model,
or deploy anything. The integration reference is deliberately outside the build.

The library exports `prepareHandoff`, `readHandoff` and
`resolveHandoffEvidence`. Callers supply their own bounded synthesis function
and Conversation scope. Preparation requires a committed Git checkout and a
separate existing data root; it is disabled unless explicitly enabled.

The existing recovery CLI is available after build at
`dist/src/context/handoff-cli.js`. It requires `PI_COFFEE_ROOT_SESSION` and
`PI_COFFEE_DATA_ROOT`, runs from the original checkout, and accepts packet ID,
anchor ID, optional byte offset and optional length (maximum 4096 bytes).

## Status and ownership

Source baseline: Coffee `03ba7ea83e49cf94fab8a2ed317863b0f27be2ad`.
Coffee does not yet consume this repository as a dependency. Its current runtime
and deployment remain independently controlled. See the [import record](docs/import-verification.md)
for checks performed on this extraction, separately from historical Coffee evidence.

No license grant for Coffee-derived code is invented by this import; the source
repository had no top-level LICENSE at the pinned revision. Owner distribution
licensing remains to be selected. Upstream context-fold code has not been copied;
future source reuse must retain its MIT notice and record provenance.
