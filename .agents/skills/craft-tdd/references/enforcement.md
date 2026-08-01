# CODE FLAGS and what a machine can enforce

## CODE FLAGS

Any of these is an **architecture** flag, not a testing inconvenience. Surface it; do not
work around it silently:

- Requiring a module- or assembly-level visibility escape so tests can reach internals
  (`InternalsVisibleTo` in .NET; whatever the stack's equivalent is, where one exists at
  all).
- Widening an individual type's visibility in order to test it.
- Probing internal state instead of using a spy.
- Domain or unit tests that require the data layer.
- **Business logic living in the UI.** Views render; presenters shape owned view models;
  controllers translate and dispatch; UI-state containers hold presentation state. View models
  are legitimate UI-owned presentation shapes, not renamed domain models. Eligibility,
  authorization, pricing, lifecycle decisions, invariant enforcement, domain validation, and
  domain calculations hidden in UI conditionals, selectors, reducers, effects, handlers, or
  controller branches belong in a domain module or application use case, then flow through an
  explicit mapper or DTO adapter.

Each means the seam is in the wrong place. Report it with the test that exposed it.

## Which of these a machine can enforce

Several rules in `SKILL.md` and these references are machine-checkable and are worth wiring
rather than remembering — 90/90 line-and-branch coverage on changed in-scope code, monotone
overall coverage floors, domain tests not depending on the data layer, UI packages not
importing domain/core types, container-backed tests not silently skipping, the thin-poller LOC
budget, tests running before commit. Whether a UI conditional is business policy remains a
review judgment; do not pretend a coverage or import metric can decide it.

Others are only *approximable*. "Never mock business logic" is enforceable as an import-boundary
rule — forbid the mocking library from domain test packages — but no tool in any mainstream
ecosystem inspects what type is passed to `mock()`. Wire it anyway; it catches the accidental
case, which is the common one. Do not call it enforced.

And some are permanently unenforceable: test-first ordering is a process property, and every
static proxy for it is gameable. No tool detects assertions against magic values or
non-randomized test data either — confirmed, not assumed.

The full rule → tool → rule-id map, the honest enforced/partial/review split, and templates are
in `craft-code-quality`'s `references/enforcement.md` and `assets/arch-tests/`.
