---
name: craft-tdd
description: >-
  Test-first delivery discipline: write the failing test before the production code, prove
  hypotheses with reproducible tests, prefer integration tests against real infrastructure,
  never mock business logic, mock only external unmanaged dependencies at their seams. Covers
  ratcheting into legacy code that has no suite, via characterization tests and diff-scoped
  coverage. Use when a bug is reported, a feature is requested, before writing or changing
  production code, when writing or fixing tests, when working in a repo with thin or no
  tests, when debugging behavior, or when validating acceptance criteria.
---

# craft-tdd

## Precedence

Defaults, not supremacy:

1. **A bound repo's own law wins inside its boundaries** (`AGENTS.CORE.md`, bind law) — read
   its `AGENTS.md` and its test conventions first.
2. **This workflow's overlay wins over these defaults** — if
   `.agents/craft/craft-tdd.local.md` exists, read it; where it conflicts with this file, it
   wins.
3. **Where both are silent, everything below applies in full force.**

Hedged once, here. The rest of this file is imperative on purpose.

## The protocol

Test first. Not optional. It is the mechanism by which assumptions get validated.

**Sequence, always: rules → failing test → implementation → pass → triangulate.**

- A bug is reported, or a feature is requested → the **first** step is a failing test that
  proves the problem exists or defines the expected behavior.
- For a new addition, **flesh out the test concepts first** — enumerate what needs proving
  before writing any single test. This is a design step, distinct from writing one failing
  test, and it is where the shape of the work gets decided.
- Do not write production code until a test fails. Acknowledging this rule and then going
  straight to implementation is a violation of it, not a shortcut through it.
- Without a test you are speculating. Speculation is not engineering.

Apply it to everything that admits a test. Bug report → failing test. Feature → failing
test. Refactor → cover the existing behavior *before* touching it. Performance concern →
benchmark test. Rationale for why this is worth the cost: `references/rationale.md`.

**Five working principles** — PoC or GTFO (no reproducible test, no actualized claim);
Target (make the failing test pass, narrowly, nothing more); Triangulate (prove the fix
isn't overfit); Boundaries (zero, one, many, null, empty, max); Corner cases (bad input,
concurrency, loss — consider all considerations). In depth, with output-handling and
assertion rules: `references/principles.md`.

## Composition

- **Never mock business logic. Never mock handlers. Never mock routing. Never mock the
  database.** Test against a real database — in integration tests only.
- A mock is used only where required, never by default.
- **Always resolve test objects through dependency injection.** Do not construct them
  inline; register them in the container or produce them from a helper factory. Hand-built
  test objects drift from what the application actually composes.

## Integration by default

Prefer integration tests over unit tests: exercise a **running application**, hosted in the
fixture, against **real infrastructure** (containers, not in-memory fakes). The only
legitimate mock target is an **external unmanaged dependency (EUD)** — mock its interface,
never the logic behind it. Full seam guidance, the real-boundary table, container rules, and
the thin-poller pattern for hard-to-test polling: `references/integration-testing.md`.

## Before committing

Run the tests locally first. Never commit and push untested. If CI fails on something that
passed locally, investigate the environment difference — do not retry blindly. Pushing
untested code burns CI and blocks deployments. **This is non-negotiable.**

## Legacy substrate — no suite to build on

Test-first still governs new work even where the repo has thin or no tests; it cannot
retroactively cover what already exists. Changing untested legacy code needs
characterization tests first, and coverage ratchets on the diff toward a 90% line / 90%
branch destination. Full procedure, the coverage covenant, and the CODE FLAGS that mean the
seam is in the wrong place: `references/legacy-and-coverage.md` and
`references/enforcement.md`.

## References

Load a `references/` file when you reach the step that needs it. Keep this page thin.

- `references/rationale.md` — why test-first earns its cost, for when someone pushes back.
- `references/principles.md` — the five principles in depth, output-analysis discipline
  (run once, grep many), assertion rules.
- `references/integration-testing.md` — fixture-first integration testing, real
  infrastructure, mocking precisely (stub/spy/bomb), the thin-poller pattern.
- `references/legacy-and-coverage.md` — ratcheting into a repo with no suite, the coverage
  covenant in full.
- `references/enforcement.md` — CODE FLAGS (architecture problems testing surfaces) and the
  honest enforced/partial/unenforceable split for CI wiring.

## Related

- `craft-code-quality` — the architecture rules that make code testable in the first place
  (ports and adapters, seams at every EUD, LOC budgets). Testability problems usually
  surface there first. Its `references/enforcement.md` covers wiring these test rules into the
  build; its `references/ratchet.md` covers arriving there in a repo with no suite.
