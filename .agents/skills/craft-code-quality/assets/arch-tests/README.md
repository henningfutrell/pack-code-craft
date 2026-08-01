# Architecture-test templates

Copy the directory matching the target stack into the substrate repo, replace the
placeholder package/namespace names (`com.example.app`, `Example.App`, `example_app`,
`example.com/app`, `src/domain`) with the real ones, and wire the tool into CI. These
encode the architecture and test-boundary rules from `craft-code-quality/SKILL.md` and
`craft-tdd/SKILL.md` as machine rules — see `references/enforcement.md` for the
ENFORCED/PARTIAL/REVIEW classification these implement.

| Template | Enforces | Baseline story |
| --- | --- | --- |
| `kotlin-archunit/` | Domain-not-depending-on-infrastructure, layered architecture (UI segregated at the edge), mock-boundary rule on domain tests | `FreezingArchRule.freeze()` — automatic, purpose-built |
| `dotnet-netarchtest/` | Same three rule shapes via `NetArchTest.Rules`, plus a banned-symbols list (`BannedSymbols.txt`) and a reflection-based `InternalsVisibleTo` assertion | None in NetArchTest or BannedApiAnalyzers — use the ratchet's diff-scoping |
| `typescript-dependency-cruiser/` | Domain/infrastructure/UI dependency direction (`.dependency-cruiser.js`), plus layer and banned-import rules via ESLint (`eslint-boundaries-snippet.js`) | `--ignore-known` (dependency-cruiser) — automatic; ESLint's own `eslint-suppressions.json` — automatic, `"error"`-only rules |
| `python-import-linter/` | Layered architecture (`.importlinter` `layers` contract), domain-tests-no-data-layer and no-mocking-in-domain-tests (`forbidden` contracts), plus Ruff banned-api (`ruff-banned-api-snippet.toml`) | `ignore_imports` — hand-maintained allowlist, no generate step; Ruff has none |
| `go-depguard/` | Domain-package deny rules (`depguard`), banned concrete types (`forbidigo`), noted alternative `go-arch-lint` | No store — `--new`/`--new-from-rev`/`--new-from-merge-base` diff-scoping only |

## Prove the TypeScript UI/domain rule fails

After adapting `typescript-dependency-cruiser/.dependency-cruiser.js` to the target paths,
temporarily add a resolvable import from `src/ui/` to `src/domain/`, then run:

```sh
npx depcruise src --config .dependency-cruiser.js
```

It must fail and name `ui-must-not-depend-on-domain`; remove the canary import and confirm
the command passes again. UI code must consume application-owned DTOs or ports and map them
to UI-owned view models, rather than importing domain models directly.

## Baseline-support ranking

The axis that matters most for ratcheting into an existing repo (`ratchet.md`): can the
tool snapshot today's violations and gate only on new ones, or does every existing
violation have to be cleared by hand before the rule can be turned on at all.

1. **ArchUnit `FreezingArchRule`** — purpose-built for this, strongest: automatic
   snapshot, automatic pruning as violations are fixed.
2. **dependency-cruiser `--ignore-known`** and **ESLint suppressions** — genuinely
   automatic (generate once, gate on new only), though ESLint's only covers rules set to
   `"error"`.
3. **golangci-lint** — diff-scoped (`--new-from-rev`, etc.), not a persisted store: no
   memory between runs, entirely dependent on which git ref is passed.
4. **import-linter `ignore_imports`** and **go-arch-lint**'s legalize/todo-marker
   workflow — a baseline exists, but it is a manual, hand-maintained allowlist with no
   generate step.
5. **NetArchTest, ArchUnitNET, BannedApiAnalyzers, Ruff `TID251`** — none. Turning any of
   these on in a repo with existing violations means clearing them first, or leaning on
   the ratchet's diff-scoping instead of anything the tool itself provides.

## The canary rule

A rule that does not fire is worse than no rule — it manufactures confidence that
nothing is checking. Layer rules pointed at the wrong package name, and banned-symbol
lists with a typo'd entry, both fail silently and look green.

So after wiring any template here: introduce the smallest possible violation, run the
check, **confirm it fails and names the right rule**, then revert and confirm it passes
again. Never trust a green gate that has not personally been seen going red. Where the
check is cheap to keep, promote the canary into a permanent fixture the tooling is
expected to reject, so a later config refactor cannot silently disarm the rule.
