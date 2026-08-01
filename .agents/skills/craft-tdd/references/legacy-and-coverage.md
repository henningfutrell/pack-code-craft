# Legacy substrate and the coverage covenant

## Legacy substrate — no suite to build on

Most repos this will be applied to have thin tests or none. The protocol in `SKILL.md` is
not suspended by that, but it cannot retroactively cover what already exists. Ratchet
instead — see `craft-code-quality`'s ratcheting section and its `references/ratchet.md`.

- **Test-first still governs new work.** A bug reported today gets a failing test today,
  regardless of what the rest of the repo looks like. The absence of a suite is not a
  licence; it is the reason the next test matters more than usual.
- **Changing untested legacy → characterization tests first.** Write tests that capture what
  the code *currently does*, including behavior you believe is wrong. They are not
  correctness assertions; they are a tripwire that tells you whether a refactor changed
  observable behavior. Once they pass, refactor safely — then fix the wrongness as its own
  change, with its own failing test.
- **This is not a contradiction of test-first.** For a bug or a new feature, the test fails
  first. For a refactor of untested code, the characterization tests pass first — which is
  exactly what "refactoring → cover the behavior before touching it" already means.
- **Coverage ratchets on the diff, not the repo.** Every new or changed in-scope line **and
  branch** meets 90% line and 90% branch coverage from day one. Overall floors never decrease;
  raise them monotonically toward the 90/90 destination. Chasing a global percentage produces
  tests written to touch lines rather than to prove behavior, which is worse than no test — it
  reports safety that is not there.
- **Testing legacy code usually requires a seam that does not exist yet.** Introducing it is
  an architecture change, not a test change (`craft-code-quality`). If the only way to test
  something is a visibility escape or probing internal state, that is a CODE FLAG (see
  `references/enforcement.md`), not a technique.

## Coverage covenant

The destination and exit criterion is a repo-wide denominator of at least **90% line coverage
and 90% branch coverage** for authored **non-UI production code**. Measure both; neither
substitutes for the other. The denominator includes domain and application code plus meaningful
backend adapter behavior. Views, components, presenters/controllers, view models, styling, and
client-rendering glue — along with generated code, migration artifacts, schemas/IDL, and
framework declarative glue with no business decision — are outside it.

Do not exclude authored logic to improve a number. Extract business rules, transformations, and
decisions from UI or declarative glue into covered non-UI code. Calculate repo-wide floors and
changed-code coverage over the same explicit, narrow, version-controlled in-scope population;
report exclusions with the result. Tests must prove observable behavior, decisions, outcomes, and
failure paths. Merely executing a line is coverage theatre, not evidence.
