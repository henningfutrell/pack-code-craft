# Coverage destination

Hold authored **non-UI production code** to **at least 90% line coverage and 90% branch
coverage**. Measure both; neither percentage substitutes for the other.

## What counts

Include in the denominator:

- Domain code: aggregates, entities, value objects, policies, invariants, domain services,
  domain events, and business data models.
- Application code: use cases, commands, queries, handlers, orchestration, validation, and
  authorization decisions.
- Meaningful backend adapters: persistence mappings and repositories, transport handlers,
  integrations, serializers where behavior exists, and failure/retry/translation logic.

Exclude only code that is not authored executable behavior:

- UI code: views, components, presenters/controllers, view models, styling, and client-side
  rendering glue.
- Generated code.
- Migration snapshots and one-way migration artifacts.
- Schemas and IDL declarations.
- Framework-mandated declarative glue with no business decision: registration manifests,
  annotations, route declarations, and equivalent metadata.

Do not use an exclusion to hide authored logic. Extract business rules, transformations, and
decision-making from UI or declarative glue into covered non-UI code; then include that code in
the denominator.

## Gates and denominator discipline

- **Destination and exit criterion:** the repo-wide denominator reaches 90% line and 90%
  branch coverage.
- **Day-one changed-code gate:** every new or changed in-scope line and branch meets 90/90,
  even while legacy code is being ratcheted upward.
- Calculate repo-wide floors and changed-code coverage over the same in-scope population.
  Configure exclusions explicitly, narrowly, and in version control; report them with the
  coverage result.
- Never lower an overall coverage floor. Raise it monotonically toward 90/90 as the ratchet
  recovers legacy code.

Forbid coverage theatre. Tests must assert observable behavior, decisions, outcomes, and failure
paths; executing a line without proving its behavior does not satisfy this covenant.
