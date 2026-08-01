# Ratcheting — getting from a non-compliant repo to the mandates

*Read this when the substrate is far from the standards in the parent SKILL.md: no static
analysis, thin or absent tests, files well over budget. It is the procedure for arriving
there incrementally. The four invariants it serves are stated in the parent's "Ratcheting"
section — machine-enforced, monotone, new-code-clean, and the ratchet must actually turn.*

## Before anything: whose repo is this

In a repo the workflow **owns**, execute the ladder below.

In **bound substrate**, the ratchet is a **proposal, not a unilateral act.** Wiring CI,
adding config files, and committing a baseline are changes to how everyone else on that repo
works. Present Pass 0 with the measured gap, get agreement, then execute. Never install
tooling into someone else's repo uninvited — that is the parent skill's rule and it applies
with full force here, where the change is process-wide rather than local.

Where the state lives:

- **Machine-checkable ratchet state belongs in the substrate repo** — the baseline file, the
  frozen counts, the threshold values in lint config. That is the whole point of invariant 1.
- **The workflow's overlay** (`.agents/craft/craft-code-quality.local.md`) records only what
  differs from default: a target other than the standard budgets, or an agreed cadence. It
  never holds the current position — that would put the ratchet back into memory.

## Measure the gap first

You cannot ratchet toward a number you have not measured. Before Pass 0:

- Run the language's analyzer with the mandated rule set at **warn**, and count violations by
  rule and by file.
- List every file over its file budget, with its current logical LOC.
- Record current coverage — overall, and on recently changed lines if the tooling can scope it.

Write the numbers down in the pass-0 commit or PR body. They are the denominator for every
later claim of progress, and without them "we improved" is unfalsifiable.

## The pass ladder

Each pass is a separate commit. Each one ends with CI enforcing something it did not enforce
before.

### Pass 0 — Instrument and freeze

**No code changes.** This pass buys the ratchet itself, before any quality.

The recipe depends on whether the language's tooling has a real baseline mechanism — check
the table below first, because the two shapes are not interchangeable:

**Tool has a baseline** (RuboCop, Detekt, ESLint, SwiftLint):

1. Install the tooling and configure the mandated rule set **at its real severity** — see the
   ESLint trap below; a rule parked at `warn` may not be suppressible at all.
2. Generate the baseline, capturing every existing violation.
3. Wire CI to fail on anything **not** in the baseline.
4. Commit baseline + config together.

**Tool has no baseline** (.NET analyzers, mypy, PMD, SpotBugs — and Ruff, whose only baseline
is inline `# noqa` comments written into your source):

1. Install the tooling with the mandated rule set at **warning** severity.
2. Freeze the violation **count** as the gate, or scope the strict rule set to paths that are
   already clean and grow that scope.
3. Lean harder on Pass 1 — diff-scoped enforcement does the work a baseline file would have.

Either way, do this first and separately. Without a freeze, every gain from later passes
silently leaks back out, and you will not notice until the next audit.

### Pass 1 — Diff-scope the mandate

Full strictness on new and changed code; existing code still baselined.

- Turn on diff-scoped enforcement — new-code-only linting, changed-files-only checks, diff
  coverage.
- The standards in the parent skill now apply **in full** to anything you write.

This is where most of the long-term value sits: the repo stops getting worse, immediately,
without touching a line of legacy. Everything after this is recovery of existing debt, which
is slower and less urgent than stopping the bleeding.

### Pass 2 — Promote rule classes, one class per pass

Move rules from warn to error in this order:

| Order | Class | Why here |
| --- | --- | --- |
| 1 | Formatting / style | Mechanically auto-fixable, zero design judgment, and it makes every later diff readable |
| 2 | Correctness / bug-risk | Highest value per fix; each one is a real defect |
| 3 | Complexity | Requires refactoring, but local in scope |
| 4 | Size (LOC budgets) | Requires design work and module boundaries — hardest, so last |

Auto-fixable classes get a **pure mechanical commit that changes nothing else.** A
reformatting commit mixed with logic changes is unreviewable, and it poisons `git blame` for
no benefit.

### Pass 3 — Walk the numbers down

For each numeric threshold, step it from its baselined value toward the budget in
`loc-budgets.md`.

Each step: tighten the threshold → shrink the baseline → fix the newly-failing set → commit.

Choose the step size so each one lands in a **reviewable diff.** A step that produces 200
failures is not a step. If the distance is large, more smaller steps — the number of passes
is not the cost being minimized here.

### Pass 4 — Decompose the oversized files

For the 5k LOC file:

- **Record its current logical LOC as a ceiling.** The ceiling only ever decreases. Enforce it
  the same way as any other threshold, so CI catches growth.
- **Extract on touch.** Every visit removes at least one coherent slice — the parent skill's
  rule. Cover the slice with characterization tests before moving it (`craft-tdd`, "Legacy
  substrate").
- **New behavior goes into new modules**, never into the file. Route through the existing
  entry point if callers depend on it; the file shrinks as behavior migrates out.
- **No wholesale rewrite.** It produces an unreviewable diff, and it silently discards years
  of embedded bug fixes whose reasons are not written down anywhere. The extraction path is
  slower and it works.

A file at hard-max that is genuinely cohesive and stable is a lower priority than a
mid-sized file that changes every week. Rank by churn × size, not size alone.

### Pass 5 — Retire the scaffolding

When a baseline reaches empty: **delete it**, set the rule to the mandated value, and apply it
repo-wide rather than to the diff. Remove the diff-scoping for that rule class.

The ratchet is complete when no baseline files remain, every threshold equals its budget, and
enforcement is repo-wide. At that point the parent skill applies plainly and this file stops
being relevant.

## Sequencing rules

- **One turn per commit.** Never bundle a threshold change with a feature change — when
  something breaks you need to know which one did it.
- **Never bundle a mechanical reformat with a logic change.**
- **Do not open a new rule class while the previous class's baseline is still growing.** A
  growing baseline means the freeze is not holding; fix that before adding scope.
- **Report the gap every pass** — violations remaining, files over budget, coverage. Progress
  that is not reported is indistinguishable from no progress.
- **Never lower a standard the repo already meets.** The ratchet is one-way by construction;
  a "temporary" loosening is how it dies.

## Anti-patterns

Name these when you see them:

| Anti-pattern | Why it is fatal |
| --- | --- |
| **Regenerating the baseline to turn a red build green** | The defining failure of this technique. It converts a ratchet into a suppression file and destroys every guarantee above. If CI fails on a regression, fix the regression. |
| File-level suppression where line-level exists | Loses granularity and silently hides *new* violations in that file — the one thing the freeze was for |
| Suppressions with no owner and no date | Indistinguishable from an accepted standard within a quarter |
| Coverage theatre | Tests that execute lines without asserting behavior. Worse than no test: it reports safety that is not there. Ratchet coverage on the diff, never a global percentage |
| Big-bang "quality PR" | Unreviewable, so it gets rubber-stamped or reverted. Either way the standards are discredited |
| Ratcheting a rule nobody agreed to | In bound substrate this is imposing process on other people's work. Propose, agree, then execute |
| Treating the ratchet as the goal | A baseline that never shrinks is technical debt with better branding |

## Per-language mechanisms

Verified against current official docs. Where a tool has **no** baseline, that is stated
rather than papered over — it changes the Pass 0 recipe.

| Language | Baseline: generate → file | Diff-scoped | Threshold to walk |
| --- | --- | --- | --- |
| **Ruby** | `rubocop --auto-gen-config` → `.rubocop_todo.yml` (auto-adds `inherit_from`) | — | `Max:` per cop in the todo file |
| **Kotlin** | `detekt --create-baseline --baseline <path>` → `baseline.xml` | — | `build: maxIssues:` in `detekt.yml` (1.23.x) |
| **TS / JS** | `eslint --suppress-all` (or `--suppress-rule <name>`) → `eslint-suppressions.json` | flat-config `files`/`ignores` to scope strict rules to clean paths | `--max-warnings <n>`, frozen then decreased |
| **Swift** | `swiftlint --write-baseline <path>`, then `--baseline <path>` | — | per-rule `warning:`/`error:` pairs; global `warning_threshold` |
| **Go** | none | `--new-from-merge-base`, `--new-from-rev <rev>`, `--new-from-patch <path>`, `--new`; add `--whole-files` | grow the enabled-linter list |
| **Python (Ruff)** | no external file — `--add-noqa` writes `# noqa` into source | — | `select` (replaces) vs `extend-select` (adds); `per-file-ignores` |
| **Python (mypy)** | none first-party | — | `[[tool.mypy.overrides]]` per-module strictness in `pyproject.toml` |
| **C# / .NET** | **none first-party** | — | `.editorconfig` severities, escalated per directory |
| **Java** | Checkstyle `suppressions.xml` via `SuppressionFilter`; SpotBugs `exclude.xml`; PMD `excludeFromFailureFile` — **all hand-authored, none auto-generated** | — | Error Prone `-Xep:<Check>:OFF\|WARN\|ERROR` |

### Per-tool notes that change how you use them

- **ESLint — only `error`-level rules are suppressible.** A rule left at `warn` is silently
  *not* suppressed. This is the trap that breaks the naive Pass 0: set the rule to `error`,
  then suppress. Use `--prune-suppressions` to drop stale entries as violations get fixed —
  that pruning *is* the ratchet turning. `--pass-on-unpruned-suppressions` exists; using it
  routinely defeats the purpose.
- **RuboCop — regenerate with `--regenerate-todo`, never a bare `--auto-gen-config`.** The
  former replays the original generation options recorded in the todo file's header; the
  latter re-runs with whatever flags you happen to pass and can silently change scope or
  mutate `.rubocop.yml`. Note `--exclude-limit` defaults to **15**: above that many offending
  files, the cop is **disabled entirely** rather than excluded file-by-file — a silent, total
  loss of coverage for that rule. Check for it. `--auto-gen-only-exclude` emits `Exclude:`
  lists instead of raised `Max:` values, which keeps the number honest.
- **Detekt — `maxIssues` is going away.** It is a `build:` key in current stable 1.23.x, but
  2.0.0 (alpha) removes it entirely in favor of per-rule `Info`/`Warning`/`Error` severities
  and failing on any `Error`. Do not build a long-lived ratchet on `maxIssues` alone.
- **Go — `--whole-files` matters.** Without it, a violation inside a file you changed is
  dropped unless it sits on a changed *line*. With it, touching a file means cleaning it. That
  is a stronger ratchet and a bigger per-change cost; choose deliberately. `nolintlint` flags
  unused `//nolint` directives, but does not catch them for linters disabled in config.
- **SwiftLint — the baseline is line-anchored.** Move a violating line and the violation
  re-surfaces. Effectively a boy-scout rule enforced by the tool; expect churn when files get
  reformatted.
- **Ruff — `--add-noqa` puts the baseline *in your source*.** Unlike an external file, this
  is visible in every diff and in review, which is an advantage for a ratchet: the debt is
  greppable and deleting a `# noqa` is a legible unit of progress. Seed one rule at a time
  with `--select`.
- **.NET has no baseline command — this is a real gap** versus RuboCop/Detekt/SwiftLint. The
  ratchet is severity escalation instead: `dotnet_diagnostic.<ID>.severity` for one rule,
  `dotnet_analyzer_diagnostic.category-<category>.severity` for a whole category, in a
  `.editorconfig` per directory — nested files override their parent, so a directory that is
  already clean can be held to the mandate while the rest of the tree catches up. That
  per-directory override is the closest thing .NET has to diff-scoping, and it is worth using
  deliberately. `.editorconfig` severity takes precedence over `TreatWarningsAsErrors`.
  `GlobalSuppressions.cs` with `[assembly: SuppressMessage(...)]` holds legacy exceptions
  outside the source. Gate formatting with `dotnet format --verify-no-changes`.
- **Java — every suppression file is hand-authored.** There is no generate-from-current-state
  command for Checkstyle, PMD, or SpotBugs, so Pass 0 is manual and the practical route is
  Error Prone severity flags (`-XepDisableAllChecks` then selectively re-enable) plus
  diff-scoping. (PMD for Java has no baseline concept at all; do not confuse it with PHPMD,
  a different tool, which does.)

### Architecture rules baseline separately — and one tool is built for it

The table above covers *lint* baselines. Architecture and dependency rules are a different axis
with different tooling, catalogued in [enforcement.md](enforcement.md). The one thing to know
here, because it changes Pass 0:

**ArchUnit's `FreezingArchRule.freeze(rule)` is purpose-built for this** — a persistent violation
store where the first run always passes, later runs fail only on *new* violations, and fixed
violations are auto-pruned. That is the ratchet, implemented by the tool. On the JVM you can
therefore switch every architecture rule on in a single Pass 0 commit.

dependency-cruiser (`--ignore-known`) and ESLint's `eslint-suppressions.json` are the next-best,
genuinely automatic. golangci-lint gives diff-scoping rather than a store. **import-linter and
go-arch-lint offer only hand-maintained allowlists, and NetArchTest, ArchUnitNET,
BannedApiAnalyzers and Ruff's banned-api have no baseline at all** — there, scope the rule to
already-clean directories and grow the scope, recording it in config so it cannot quietly shrink.

Architecture rules produce the largest initial violation count of anything in these skills, so
check the tool's baseline story *before* committing to a Pass 0 shape.

## Coverage, specifically

The destination is stated in [coverage-destination.md](coverage-destination.md): authored
non-UI production code reaches **at least 90% line coverage and 90% branch coverage**. Measure
both over that reference's explicit in-scope denominator; neither substitutes for the other.
Ratchet to it:

- **Day one: 90/90 diff coverage.** Every new or changed in-scope line and branch must meet
  90% line / 90% branch coverage. This is enforceable from day one in a repo at 4% coverage,
  and it is the coverage number that reflects current work.
- **Overall floors never decrease.** Freeze the current line and branch figures separately.
  Raise each floor monotonically as legacy code is recovered; calculate those floors over the
  same in-scope population as the changed-code gate.
- Raise the floors **as a consequence** of work done, not as quotas to be filled. A quota
  produces coverage theatre.
- The ratchet exits only when the **repo-wide non-UI denominator** reaches 90% line and 90%
  branch coverage. Until then, changed-code 90/90 and non-decreasing overall floors are
  complementary gates, not alternatives.

The two gates are complementary, not alternatives — every ecosystem surveyed needs both:

| Gate | Tooling |
| --- | --- |
| Diff coverage on changed lines | `diff-cover coverage.xml --fail-under=<n>` — consumes Cobertura, Clover, JaCoCo XML, LCov |
| Overall floor that only rises | pytest-cov `--cov-fail-under=<n>`; coverlet `--threshold <n> --threshold-type line\|branch\|method --threshold-stat Minimum\|Total`; JaCoCo violation rules scoped `BUNDLE`/`PACKAGE`/`CLASS`/`METHOD` |

Caveats worth knowing before trusting a number: `diff-cover` maps diff lines to report lines,
so multi-line statements can map imperfectly. JaCoCo has **no** native changed-class scoping —
that needs a third-party plugin, so pair it with `diff-cover` rather than assuming its rules
are diff-aware.

## Naming

Call it a **ratchet** — the term in current use, and the metaphor carries the invariant:
movement in one direction only. SonarQube implements the same idea under its own name,
**"Clean as You Code"**, gated on a configurable *New Code* definition (since a date, since a
version, or since a branch diverged from its reference) — that definition is exactly the
diff-scope of Pass 1. If the substrate already runs Sonar, use its New Code gate instead of
building a parallel mechanism.

The legacy-test technique in `craft-tdd` is Michael Feathers' **characterization test**, from
*Working Effectively with Legacy Code* — a test that pins down what the code *actually does*
rather than what it should do. Related and distinct: the **boy scout rule** (leave code better
than you found it — the per-touch obligation in Pass 4) and **strangler fig** (incremental
replacement by routing new behavior around the old, which is how an oversized file empties
out).
