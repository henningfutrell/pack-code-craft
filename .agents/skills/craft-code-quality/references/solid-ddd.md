# SOLID and DDD, pragmatic

*Read this when shaping class/module boundaries, aggregate design, or reviewing whether a
proposed abstraction earns its keep. The parent SKILL.md's headline is "small cohesive
modules, ports and adapters" — this is the extended reasoning behind that headline, not a
separate mandate.*

## Core standard

- Prefer many small, cohesive modules over large multi-purpose files.
- A 4k LOC file is an architecture smell, not a neutral implementation detail.
- Optimize for readability, testability, and safe change over short-term speed.
- Aim toward SOLID, DDD, TDD, and Clean Code **without dogma**. Use judgment — but do not
  let convenience become long-term entropy.

## SOLID, pragmatic

| Principle | In practice |
| --- | --- |
| Single Responsibility | one clear purpose per class/module |
| Open/Closed | extend by composition and new modules, not risky edits everywhere |
| Liskov Substitution | abstractions are genuinely swappable |
| Interface Segregation | small, task-specific interfaces |
| Dependency Inversion | depend on domain abstractions, not concrete infrastructure |

## DDD and boundaries

- Model business concepts explicitly in ubiquitous language.
- Domain logic lives in domain modules — not controllers, not UI, not adapters.
- I/O, HTTP, database, and messaging concerns stay in adapter layers.
- Cross-boundary translation is explicit (DTOs, mappers). Never implicit leakage.
- Choose persistence abstractions and aggregate boundaries using
  [repositories.md](repositories.md); keep repository concerns outside the domain model.
- For presentation/application flow, apply the pragmatic command-query and presenter guidance
  in [mvp-cqrs.md](mvp-cqrs.md) without collapsing UI into domain code.

## Modularity and size

- One module, one reason to change.
- Use **per-language** budgets, never a one-size-fits-all limit — the numbers are in
  [loc-budgets.md](loc-budgets.md). Before calling work done, check the file and function
  sizes you touched against the budgets for that language.
- Those budgets are deliberately stricter than common linter defaults. The point is to
  **force decomposition early**, while splitting is still cheap — not to describe what
  existing code happens to measure.
- Soft max crossed → explicit written rationale plus a decomposition plan.
- Hard max crossed → do not produce it. If circumstances force it, flag it as a violation
  with the plan to split, never as an accepted state.
- New work must not grow an already-over-limit file without extracting at least one coherent
  slice. This is the file-size ratchet: the oversized file's line count becomes a ceiling
  that only ever decreases. Do not rewrite it wholesale — extract on touch (`ratchet.md`).
- Organize by behavior and domain boundary, not by arbitrary technical bucket.
- Rare, explicit exceptions: generated code, migration snapshots, protocol schemas,
  framework-mandated glue.

## Clean code

- Descriptive names over comments that explain unclear code.
- Short, intention-revealing functions.
- Avoid deep nesting — guard clauses and small composable helpers.
- Eliminate dead code and duplication when touching related areas.
- Fail fast with clear error messages at boundaries.

## Refactoring triggers

Any one of these is sufficient reason to stop adding and start extracting:

- Duplicate logic in 2+ places.
- A function exceeds clear mental scope.
- A module mixes responsibilities (domain + transport + persistence).
- A new feature requires touching too many unrelated files.

## Architecture, extended

Default to **hexagonal architecture (ports and adapters)**.

- The domain core does not depend on frameworks, UI, transport, or persistence.
- Ports (interfaces) are defined at the application/domain boundary.
- Adapters live at the edge: database, HTTP, queues, files, third-party APIs.
- Wire dependencies in composition roots. Dependency direction points inward.
- New features arrive as vertical slices that preserve the boundary.
- **Every external unmanaged dependency (EUD) has a seam — a port — at the boundary.** Seams
  are the only place tests inject mocks, stubs, or spies (see `craft-tdd`).
- Do not over-abstract. Seams exist for real external boundaries, not for speculative
  indirection and not for internal objects.

**Deployment shape:** the default target is a modular monolith — one deployable core with
explicit internal module boundaries. One module or many, still one coherent monolith.

**UI boundary is mandatory** regardless of deployment model. Always segregate UI from a core
API boundary. That boundary may be HTTP, gRPC, or in-process public methods in a local
assembly — transport changes must not require a domain rewrite. For UI model ownership and
the exact boundary rules, read [ui-model-boundary.md](ui-model-boundary.md).

## Lint and static analysis, extended

Part of done, not a follow-up. **Linting and analysis are aggressive by intent** — a rule
set tuned to pass everything already written buys nothing. Where the workflow chooses the
configuration, choose the strict end.

- Locate the repo's lint setup before writing code — configs, CI invocation, editor
  settings. If it has one: **run it, and its rules are the rules**, not this file's.
- If it has none: surface the gap and propose wiring it (tooling and rule mappings in
  [loc-budgets.md](loc-budgets.md)). In owned repos, wire it before feature work.
- Local and CI must run the same checks. Keep configuration in version control and pin tool
  versions.
- Warnings that encode a policy violation are treated as errors.
- **The build fails on lint violations.** In owned repos, wire it that way. In bound
  substrate, check whether the repo's build already enforces it — if it does not, that is a
  finding to surface, not a licence to ship violations past a green build.
- If the repo carries too many existing violations to turn that on in one move, the build
  still fails — on **regressions**, per `ratchet.md`. Existing debt is a reason to ratchet,
  never a reason to leave the gate open.
- Run linters pre-commit or pre-push for fast feedback; run the full suite in CI on every PR.
- Where a tool cannot express a policy directly, enforce it with a custom rule or script.
- Never silently write unlinted code. Never install tooling into a repo uninvited — that is
  the repo owner's decision, made once and deliberately, not smuggled in per-change.
