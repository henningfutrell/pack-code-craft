# Enforcement — making these rules machine-checkable

*Read this when wiring a repo's analysis, deciding what CI should gate, or asking "is this
rule actually enforced or do we just believe it?" The goal is to push as much of both craft
skills into machine rules as the tooling allows, and to label the remainder honestly.*

## Why

Doctrine an agent reads is the weakest form of enforcement: it applies exactly as often as
someone remembers it. A rule in the analyzer applies whether anyone remembers it or not. So
for every mandate in `craft-code-quality` and `craft-tdd`, the question is not "is this a good
rule" but **"what is the strongest mechanism available, and did we wire it?"**

This is the same invariant the ratchet rests on (`ratchet.md`, invariant 1). Enforcement is
where it gets cashed out.

## Three classes, and why the distinction is load-bearing

| Class | Meaning |
| --- | --- |
| **ENFORCED** | A machine rule decides it. No judgment required. If it is not wired, that is a gap with a known fix. |
| **PARTIAL** | A machine catches the mechanical case; a residue needs judgment. Both halves must be named — what the rule catches, and what it cannot. |
| **REVIEW** | No mechanism exists. It depends on design judgment or on process a static tool cannot observe. |

**An enforced rule and a review-only rule must never look alike in the doctrine.** That is the
single most important thing on this page. A codebase where "domain must not depend on
persistence" is a wired dependency rule and "prefer descriptive names" is an aspiration is in
good shape. A codebase where both are prose, and the build is green, has standards in name
only — and nobody can tell which is which without reading the CI config.

So: when applying either skill, know which class each rule you are relying on falls into. When
a rule is ENFORCED but not wired, say so as a gap. When a rule is REVIEW, do not imply the
build is checking it.

## The canary rule

**A rule that does not fire is worse than no rule** — it manufactures confidence that nothing
is checking. Banned-symbol lists with a typo'd symbol, layer rules pointed at the wrong package
name, and coverage gates reading an empty report all fail silently and all look green.

So every rule wired gets proved, once, at wiring time:

1. Introduce a deliberate violation — the smallest possible one.
2. Run the check. **Confirm it fails**, and that the message names the right rule.
3. Revert the violation. Confirm it passes.

Never trust a green gate you have not personally seen go red. Where the check is cheap to
keep, promote the canary into a permanent negative test — a fixture the tooling is expected
to reject — so a future config refactor cannot silently disarm the rule.

This applies with most force to the rules that matter most: architecture layering and banned
symbols are precisely the rules that fail open when misconfigured.

## Catalog — `craft-code-quality`

### Size and complexity

| Rule | Class | Mechanism |
| --- | --- | --- |
| Function/method LOC budget | ENFORCED | function-length rule per language |
| File LOC budget | ENFORCED | file-length rule per language |
| Cyclomatic / cognitive complexity | ENFORCED | complexity rule per language |
| Deep nesting | ENFORCED | max-depth / nesting rule |
| Logical LOC (exclude blanks and comments) | PARTIAL | some tools expose skip-blank/skip-comment options; where they do not, the raw count runs slightly conservative — acceptable, but do not claim exact parity with the budget definition |
| New work must not grow an over-limit file | ENFORCED | file-length ceiling + diff-scoping |
| Exceptions for generated code | ENFORCED | exclude globs in config |
| Soft max requires written rationale | PARTIAL | the tool flags the crossing; whether the rationale is adequate is REVIEW |
| One module, one reason to change | REVIEW | cohesion is not measurable by these tools |
| Organize by behavior, not technical bucket | REVIEW | — |

### Lint and analysis hygiene

| Rule | Class | Mechanism |
| --- | --- | --- |
| Lint config exists and runs | ENFORCED | presence check + CI step |
| Local and CI run the same checks | ENFORCED | one command invoked by both a hook and CI |
| Build fails on violations | ENFORCED | CI exit code |
| Tooling version-pinned | ENFORCED | lockfile / pinned version in config |
| Config committed to VCS | ENFORCED | presence check |
| Rule set is aggressive | PARTIAL | a minimum enabled-rule set is assertable; "aggressive enough" is REVIEW |
| Dead code eliminated | ENFORCED | unused-symbol detection |
| Duplication eliminated | ENFORCED | copy-paste detector |

### Architecture — the highest-value block

Most of hexagonal architecture is a dependency-direction question, which is exactly what
architecture-test tools decide. **These rules are enforceable and usually are not enforced.
That gap is the largest available win in this file.**

| Rule | Class | Mechanism |
| --- | --- | --- |
| Domain core must not depend on framework, transport, UI, or persistence | ENFORCED | layer/dependency rule |
| Dependency direction points inward | ENFORCED | layer rule |
| Adapters confined to the edge | ENFORCED | layer rule |
| UI/domain dependency direction | ENFORCED | layer rule: forbid UI packages from importing or type-referencing domain/core packages, and forbid domain/core dependencies on UI |
| UI contract leakage | PARTIAL | forbid domain types in UI-facing signatures, controller/presenter outputs, route payloads, and shared UI-contract packages; generated, reflective, and runtime-shaped paths still need review |
| Domain logic not in controllers/UI/adapters | PARTIAL | layer rules plus LOC budgets on adapter types catch the bulk; "is this logic domain logic" is REVIEW at the margin |
| Every EUD has a seam | PARTIAL | ban the concrete external types (HTTP clients, DB connections, vendor SDKs) outside adapter packages — that is the enforceable proxy for "a port exists" |
| Cross-boundary translation explicit (DTOs, not leakage) | PARTIAL | forbid domain types appearing in transport-layer signatures where the tool can inspect signatures |
| Wire dependencies in composition roots | PARTIAL | ban container/registration APIs outside a designated composition-root package |
| Repository port at the domain/application boundary; implementation in infrastructure | PARTIAL | dependency rules can require the port package to remain inward and adapters to implement it from infrastructure; whether an interface is a meaningful aggregate-level persistence port is REVIEW |
| No concrete database connection, context, session, query builder, ORM entity, or framework annotation in domain | ENFORCED | layer/dependency rule plus banned-symbol rules for the concrete persistence APIs and annotations |
| Ports are well-designed abstractions | REVIEW | — |
| Do not over-abstract | REVIEW | the counter-rule to "every EUD has a seam"; deliberately judgment, and no tool should be trusted to arbitrate it |
| Modular monolith, one deployable core | REVIEW | a deployment-topology decision |
| Transport change must not require domain rewrite | REVIEW | a consequence of the enforced layering rules, not separately checkable |

### SOLID and DDD

| Rule | Class | Mechanism |
| --- | --- | --- |
| Dependency Inversion | ENFORCED | it *is* the layering rule above |
| Interface Segregation | PARTIAL | interface member-count metrics are a weak proxy; treat as a smell signal, not a gate |
| Single Responsibility, Open/Closed, Liskov | REVIEW | — |
| Ubiquitous language / explicit domain modeling | REVIEW | — |
| Naming is descriptive | PARTIAL | convention and minimum-length rules catch the egregious cases only |

### No implicit fallbacks

| Rule | Class | Mechanism |
| --- | --- | --- |
| Registration must not depend on implicit ordering | PARTIAL | duplicate-registration detection where the container or an analyzer supports it |
| No silent fallback chains in services | REVIEW | banning null-coalescing chains produces far more false positives than findings. This one stays a review rule — flag it in review, do not gate it |

### Observability

| Rule | Class | Mechanism |
| --- | --- | --- |
| No ad-hoc console output; use the logging API | ENFORCED | banned-symbol rule on the language's print/console functions |
| Structured logs, not interpolated strings | PARTIAL | many analyzers flag interpolated log templates; stable event naming is REVIEW |
| Secrets never committed | ENFORCED | secret scanning in CI |
| Secrets never logged at runtime | REVIEW | banned-symbol rules catch known-bad call shapes at best |
| Correlation IDs, telemetry on critical paths, domain events, audit trails | REVIEW | presence is checkable per-feature by a human; no static rule decides whether coverage is adequate |

## Catalog — `craft-tdd`

| Rule | Class | Mechanism |
| --- | --- | --- |
| 90/90 line and branch coverage on changed in-scope code | ENFORCED | diff coverage gate configured for both line and branch coverage; version-control the same narrow exclusions used by the floor |
| 90/90 repo-wide line and branch coverage floor, ratcheted monotonically | ENFORCED | total-coverage thresholds for both measures; fail if either falls, and raise each threshold toward 90 rather than lowering it |
| Domain/unit tests must not depend on the data layer | ENFORCED | layer rule applied to test packages |
| Business logic must not live in the UI | REVIEW | a tool cannot reliably distinguish presentation behavior from business policy; review each conditional, calculation, and policy owner |
| No test-only visibility escape | ENFORCED | banned-symbol / config gate |
| Container-backed tests must not silently skip | ENFORCED | assert skipped-test count is zero in CI |
| Tests run before commit | ENFORCED | hook running the same command as CI |
| Thin poller (~10-15 logical LOC in the execute body) | ENFORCED | function-length rule; it is just a budget |
| Never mock business logic, handlers, or routing | PARTIAL | enforceable as an **import-boundary rule** — forbid the mocking library from domain test packages, or forbid mock construction against domain types where the tool inspects call targets. It is not a semantic check: a determined author can still mock a domain type through an indirection. Wire it anyway; it catches the accidental case, which is the common one |
| Only mock EUDs, at their interface | PARTIAL | same mechanism, stated positively |
| Never mock the database | PARTIAL | ban mock construction against the DB client/context types |
| Test objects resolved via DI, not constructed inline | PARTIAL | forbid constructor calls to registered types from test packages where the tool supports call-target rules |
| Widening a type's visibility to test it | REVIEW | intent-dependent; the visibility change itself is legitimate in other contexts |
| Probing internal state instead of using a spy | REVIEW | — |
| Failing test before production code | REVIEW | process, not structure. Commit ordering is a weak and gameable proxy — do not gate on it, and do not pretend a tool is watching |
| Integration tests exercise a running app via the fixture | REVIEW | — |
| Test at the endpoint / drive by emitting events | REVIEW | — |
| Assertions not against magic values | REVIEW | — |
| Test data randomized | REVIEW | — |
| Run the suite once, analyze stored output | REVIEW | agent behavior, not a property of the code |

### Application use-case boundaries

| Rule | Class | Mechanism |
| --- | --- | --- |
| CQRS command/query separation | PARTIAL | separate command/query packages or types and dependency rules can forbid query paths from invoking command paths; whether a query mutates state or a command contains the right business behavior remains REVIEW |
| Event sourcing is adopted only when temporal, audit, replay, or event-native requirements justify its full operational contract | REVIEW | an architecture and product decision; no static rule can establish that current-state persistence plus domain events is insufficient or that the team can operate ES |

## Reading the residue honestly

The REVIEW column is not a backlog. Several of those rules are **permanently** unenforceable
and should not be chased:

- "Do not over-abstract" is the deliberate counterweight to "every EUD has a seam." A tool
  that arbitrated it would be wrong in both directions.
- Test-first ordering is a process property. Any static proxy for it is gameable, and gating
  on a gameable proxy trains people to game it.
- Ubiquitous language, SRP, and naming quality are design judgment. Weak proxies here produce
  noise that erodes trust in the whole rule set — which costs more than the rule was worth.

The correct handling for a REVIEW rule is to raise it in review with a concrete instance, per
the parent skill's flag semantics. Not to invent a metric.

Conversely, the architecture block is where prose most often stands in for enforcement that is
readily available. If a repo claims hexagonal architecture and has no dependency rule wired,
the claim is unverified — treat it as a finding.

## Per-language mechanisms

Verified against official docs. Five languages — the ones present in this workflow's substrate.
Ruby and Swift: the budgets in `loc-budgets.md` apply, but no mechanism is documented here yet;
add one when a repo needs it rather than guessing now.

Ready-to-adapt templates for the architecture rules live in
[assets/arch-tests/](../assets/arch-tests/).

### Architecture and dependency rules

| Language | Tool | Config | Rule form |
| --- | --- | --- | --- |
| Kotlin/JVM | ArchUnit — `com.tngtech.archunit:archunit-junit5:1.4.2` | code, not config: `@AnalyzeClasses` + `@ArchTest` | `noClasses().that().resideInAPackage("..domain..").should().dependOnClassesThat().resideInAPackage("..infrastructure..")`; also `layeredArchitecture()` |
| .NET | `NetArchTest.Rules` 1.3.2 (or `TngTech.ArchUnitNET`) | code | `Types.InAssembly(a).That().ResideInNamespace(..).ShouldNot().HaveDependencyOn(..)` |
| TS/JS | `dependency-cruiser` | `.dependency-cruiser.js` | `forbidden: [{ from: { path }, to: { path, pathNot } }]`, regex backrefs supported |
| TS/JS | `eslint-plugin-boundaries` | flat config | rule `boundaries/dependencies`, options key `policies`; `settings['boundaries/elements']` |
| Python | `import-linter` 2.13 | `.importlinter`, `setup.cfg`, or `pyproject.toml` | contracts: `layers`, `forbidden`, `protected`, `independence`, acyclic-siblings |
| Go | `go-arch-lint` | `.go-arch-lint.yml` | `components`, `deps.<c>.mayDependOn` |
| Go | `depguard` (via golangci-lint) | `linters.settings.depguard.rules.<name>` | `list-mode`, `allow`, `deny: [{pkg, desc}]` |

### Banned symbols

| Language | Tool | Config | Notes |
| --- | --- | --- | --- |
| .NET | `Microsoft.CodeAnalysis.BannedApiAnalyzers` 5.6.0 | `BannedSymbols.txt` via `<AdditionalFiles>` | entries are `{DocCommentId}[;Reason]`, e.g. `T:System.Net.Http.HttpClient;Use the port`. Diagnostics **RS0030** banned API, **RS0031** duplicate entry, **RS0035** restricted-IVT |
| TS/JS | ESLint core | flat config | `no-restricted-imports` (`patterns` accepts objects with `group`, `importNames`, `allowTypeImports`), `no-restricted-syntax` |
| Go | `forbidigo` | `linters.settings.forbidigo.forbid` | `[{pattern, msg, pkg}]`; `pkg` needs `analyze-types: true` |
| Go | `importas` | `linters.settings.importas` | `no-unaliased`, `no-extra-aliases`, `alias: [{pkg, alias}]` |
| Python | Ruff `flake8-tidy-imports` | `[tool.ruff.lint.flake8-tidy-imports.banned-api]` | flat entries `"module.path" = "message"`; rules `TID251` banned-api, `TID252` relative-imports |
| Kotlin/JVM | ArchUnit | code | a dependency rule naming the banned package |

### Local + CI parity

`pre-commit` (`.pre-commit-config.yaml`) orchestrates any of the above as git hooks and runs the
same set in CI via `pre-commit run --all-files`. It is a hook runner, not a rule engine — the
rules stay in each tool's own config, which is what keeps local and CI identical.

## Baseline support — the axis that decides ratcheting order

Architecture rules produce the largest initial violation count of anything here, so whether a
tool can freeze existing violations determines whether you can turn the rule on at all. Support
varies enormously, and this is not obvious from the tools' marketing:

| Tier | Tool | Mechanism |
| --- | --- | --- |
| **Purpose-built** | ArchUnit `FreezingArchRule.freeze(rule)` | Persistent violation store. First run always passes; later runs fail only on **new** violations; fixed ones auto-pruned by default. Store: `archunit_store/` dir, `stored.rules` index, one file per rule. Tuned via `archunit.properties` (`freeze.store.default.path`, `.allowStoreCreation`, `.allowStoreUpdate`, `freeze.refreeze`, `freeze.lineMatcher`) |
| **Genuinely automatic** | dependency-cruiser | `--ignore-known` against a generated `.dependency-cruiser-known-violations.json` (produce via `--output-type baseline -f <file>`, or the `depcruise-baseline` binary). `--no-ignore-known` overrides |
| **Genuinely automatic** | ESLint — core rules, `no-restricted-imports`/`-syntax`, and `eslint-plugin-boundaries` alike | `eslint-suppressions.json` (v9.24.0+). **Only rules set to `error` are eligible** — a rule at `warn` is silently not suppressed |
| **Diff-scoped, not a store** | golangci-lint (all linters, incl. depguard/forbidigo) | `--new`, `--new-from-rev <REV>`, `--new-from-merge-base <ref>`, plus `--whole-files`. Functionally similar for ratcheting; conceptually different — nothing is persisted, so the gate moves with the git ref |
| **Manual allowlist** | import-linter | `ignore_imports` — hand-maintained per-contract list of `a.b -> c.d` lines, wildcards allowed. No generator |
| **Manual allowlist** | go-arch-lint | informal hand-maintained "legalize"/todo marker workflow. Not automatic |
| **None** | NetArchTest.Rules, ArchUnitNET, BannedApiAnalyzers, Ruff `TID251` | Ruff's absence is a tracked open upstream request (ruff#1149); `--add-noqa` is the nearest substitute. For the .NET tools, use diff-scoping and per-directory `.editorconfig` severity instead |

**Consequence for sequencing:** on the JVM you can switch every architecture rule on in a single
Pass 0 commit, because freeze absorbs the existing violations and the ratchet turns as they get
fixed. In .NET and Python you cannot — there you scope the rule to already-clean directories
(nested `.editorconfig`, or a narrow `containers=`) and grow the scope, which is slower and needs
the scope recorded in config so it cannot quietly shrink.

## Gaps worth knowing about

Three places where the doctrine wants a mechanism that does not exist. Recorded so nobody spends
a day looking:

- **No analyzer bans `InternalsVisibleTo`.** Checked Meziantou.Analyzer, StyleCop.Analyzers,
  Roslynator, SonarAnalyzer.CSharp — nothing, first-party or well-known community. The options
  are a custom Roslyn analyzer or an assembly-attribute assertion in an architecture test.
  BannedApiAnalyzers' RS0035 concerns *restricted* IVT, which is a different thing.
- **No tool detects assertions against magic values, or non-randomized test data**, in any of
  these five ecosystems. SonarQube's S109 (magic numbers) is general-purpose, excludes -1/0/1,
  and per SonarSource cannot be configured differently for test versus main paths. This is why
  those two rules are REVIEW above — confirmed by search, not assumed.
- **"Tests must not mock domain types" has no semantic implementation anywhere.** No tool
  inspects what class is passed to `mock()`/`Mockito.mock()`/`jest.mock()`. Every available
  mechanism is an import/dependency-boundary rule: import-linter's `forbidden` contract naming
  `unittest.mock`, ESLint `no-restricted-imports` scoped to domain test dirs, or an ArchUnit
  dependency rule on `org.mockito..` (which does catch `Mockito.mock(DomainClass.class)` as a
  side effect of bytecode-level class references — sound from documented mechanics, but not a
  published pattern). Wire it; it catches the accidental case. Do not describe it as enforced.

## Wiring order

This maps onto `ratchet.md`'s pass ladder rather than replacing it:

1. **Size, complexity, dead code, duplication** — Pass 0/2 material. Purely mechanical, and
   every language's standard linter already has the rules.
2. **Banned symbols** — cheap, high signal, and the canary is trivial to write. Do these early.
3. **Architecture / layering rules** — the biggest win and the biggest initial violation count.
   Baseline or freeze them (support varies by tool — see below), then ratchet.
4. **Test-boundary rules** (no mocking domain types, tests not touching the data layer) — same
   mechanism as 3, applied to test source sets.
5. **Coverage gates** — diff-scoped first, floor second (`ratchet.md`).

In bound substrate, all of this is a proposal before it is a change — wiring CI alters how
everyone on that repo works.
