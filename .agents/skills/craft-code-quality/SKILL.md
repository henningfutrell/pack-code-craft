---
name: craft-code-quality
description: >-
  Production code-quality doctrine: small cohesive modules with per-language LOC budgets,
  mandatory lint/static analysis, ports-and-adapters architecture with seams at every
  external dependency, pragmatic SOLID/DDD, no implicit fallbacks, required observability
  (logs, telemetry, domain events, audit trails), coverage destination, pragmatic MVP-CQRS.
  Includes a ratcheting path for repos starting far from these standards, tightening pass by
  pass instead of in one sweep. Use when writing/refactoring production code, reviewing a
  diff or PR, deciding where a module boundary goes, judging whether a file or function is
  too large, raising quality in a repo with little or no tooling, or checking whether a
  change is done.
---

# craft-code-quality

## Precedence

Defaults, not supremacy:

1. **A bound repo's own law wins inside its boundaries** (`AGENTS.CORE.md`, bind law) — read
   its `AGENTS.md`, linter configs, existing patterns first.
2. **This workflow's overlay wins over these defaults** — if
   `.agents/craft/craft-code-quality.local.md` exists, read it; it wins on conflict. Records
   the derivation's own budgets, stack conventions, exemptions.
3. **Where both are silent, this applies in full force.**

Hedged once. The rest of this file is imperative on purpose.

## Owned vs bound

| | Owned repos | Bound substrate |
| --- | --- | --- |
| Missing lint config | blocker — wire it | finding — surface, propose, never install uninvited |
| Conflicting standard | change it deliberately | the repo's standard is the standard |
| Over-budget file | decompose | flag, don't worsen |

**Surface, don't suppress.** Never proceed as though a missing standard did not matter.

## Headline rules — do not violate these unknowingly

- **Small, cohesive modules.** Many small files beat large multi-purpose ones; a 4k LOC file
  is an architecture smell. Budgets by language: `references/loc-budgets.md`.
- **Lint and static analysis are part of done, not a follow-up.** Run the repo's setup; its
  rules are the rules. None found → surface the gap; wire it before feature work in owned
  repos. Build fails on violations — on regressions only where legacy debt blocks the gate
  (`references/ratchet.md`).
- **Ports and adapters by default.** Domain core carries no framework/UI/transport/persistence
  dependency. Every EUD (external unmanaged dependency) gets a seam — the only place tests
  inject doubles. UI always sits behind an API boundary.
- **No implicit fallbacks.** One source of truth per service. Missing value → the caller's
  explicit default, or fail loud, never a silent secondary source. Only exception: a
  documented contract (retry, circuit breaker). Registration order must never carry meaning.
- **Required observability.** Structured logs, correlation IDs, telemetry, domain events,
  audit trails: part of done, not polish (`references/observability.md`).

Extended SOLID/DDD, architecture/lint detail, clean-code, refactoring: `references/solid-ddd.md`.

## References

| File | Read when |
| --- | --- |
| [loc-budgets.md](references/loc-budgets.md) | per-language size limits, lint tooling |
| [ratchet.md](references/ratchet.md) | repo far from standards: ladder, baselines |
| [coverage-destination.md](references/coverage-destination.md) | ratcheting coverage, 90/90 |
| [ui-model-boundary.md](references/ui-model-boundary.md) | UI-to-core boundaries, view-models |
| [repositories.md](references/repositories.md) | repository boundaries, aggregate persistence |
| [mvp-cqrs.md](references/mvp-cqrs.md) | commands, queries, presenter boundaries |
| [enforcement.md](references/enforcement.md) | wiring rules into the build, class map |
| [solid-ddd.md](references/solid-ddd.md) | SOLID/DDD, architecture/lint detail |
| [observability.md](references/observability.md) | logs, telemetry, events, audit |

## Ratcheting — when the repo is nowhere near these standards

Assume it isn't: zero static analysis, thin tests, a 5k LOC file doing six jobs is the normal
start. **These standards are the destination, not the entry fee** — stopping at
"non-compliant" is worth nothing, and one heroic pass to compliance produces an unreviewable
diff that gets reverted. Arrive by ratchet: **baseline, freeze, tighten each pass**, one turn
per commit, never bundled with a feature change. Invariants: machine-enforced, monotone,
new-code-clean, must actually turn. Pass ladder, baselines, exit criterion:
`references/ratchet.md`.

**Standing expectation:** every turn holds ratchet position, meets the day-one 90/90 coverage
destination for non-UI code, reports the gap, never lowers a floor
(`references/coverage-destination.md`).

## Enforcement — wired rules beat remembered rules

A remembered rule applies as often as someone remembers it; a wired rule applies regardless.
Push every mandate to the strongest mechanism available. Three classes, never conflated:
**ENFORCED** (a machine decides it), **PARTIAL** (mechanical case caught, residue needs
judgment), **REVIEW** (no mechanism exists). Prove every wired rule fires: smallest
violation, confirm the check fails on the right rule, revert. `references/enforcement.md`.

## Done criteria

In a repo still ratcheting, "done" means the current ratchet position, not the full mandate —
full compliance is the ratchet's exit criterion, not the bar for every change.

- File/function sizes within `references/loc-budgets.md`, or justified in writing.
- Non-UI changed code at 90/90 (`references/coverage-destination.md`); gap reported, no floor
  lowered.
- Lint and static analysis run and passing, or the gap surfaced as a finding.
- Tooling installed, version-pinned, config in version control; no policy-violation warnings.
- Architecture intact: domain free of framework/transport/persistence, seams at every EUD, UI
  behind the API boundary.
- Observability expectations met (`references/observability.md`).
- Tests written first and passing (see `craft-tdd`).

## Related

- `craft-tdd` — test-first; a CODE FLAG there is usually a boundary defect from here.
