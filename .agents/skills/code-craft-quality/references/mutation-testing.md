# Mutation testing — proving the assertions are load-bearing

*Read this when wiring a repo's test gates, when a suite is at target coverage and defects
still ship, or when deciding whether a test is worth the line it occupies.*

Coverage answers "did a test execute this line". Mutation testing answers the question that
actually matters: **"would a test have noticed if this line's behavior changed?"** Those are
different questions, and only the second one is what a suite is for.

## What a mutation score is

A mutation tool compiles the production code, then generates **mutants** — small, individually
plausible semantic changes: flip `<` to `<=`, negate a condition, replace a return value with a
default, remove a void call, change a boolean constant. For each mutant it runs the tests.

| Outcome | Meaning |
| --- | --- |
| **Killed** | at least one test failed. The suite noticed the behavior change. |
| **Survived** | every test passed. **A behavior change no test noticed.** |
| **No coverage** | no test executed the mutated line at all. |
| **Timeout** | the mutant made the suite hang; counted as killed by most tools. |

**Mutation score = killed ÷ mutants generated.** A surviving mutant is a concrete, reproducible
statement about the suite: here is a way the code could be wrong, and the build would stay green.

## Why coverage cannot substitute for it

`coverage-destination.md` forbids coverage theatre — tests that execute lines without proving
behavior — and that prohibition is correct, but nothing in a coverage report can detect a
violation of it. **A line executed by a test that asserts nothing about it is indistinguishable,
in a coverage report, from a line executed by a test that pins its behavior exactly.** Delete
every assertion from a suite and its coverage is unchanged. That is not a hypothetical: it is the
mechanical consequence of what coverage measures.

Mutation testing is the only available measurement that separates the two, and its verdict is not
a statistic to interpret — it is a list of specific behavior changes the suite would have let
through, each one reproducible and each one either a missing assertion or an argued exception.

**The structural relationship, because it constrains the destination number:** a mutant on a line
no test executes survives automatically. So **the mutation score is bounded above by line
coverage.** The two gates are complementary in exactly the way `ratchet.md` describes for line
and branch coverage — coverage buys the ceiling, mutation testing measures how much of the space
below it the assertions actually hold.

**Report the score, not "test strength".** PIT and others also publish a second figure —
killed ÷ (killed + survived), excluding no-coverage mutants — variously called *test strength* or
*mutation coverage of covered code*. It answers a narrower question and it flatters a thin suite:
a repo at 20% coverage with a handful of excellent tests can post 95% test strength. It is useful
diagnostically, to tell "we do not test this" from "we test it badly". **Gate on the mutation
score.** Neither figure substitutes for the other, and quoting the flattering one without the
other is the same failure as quoting line coverage without branch coverage.

## Destination

Hold authored **non-UI production code** — the same population, with the same explicit,
narrow, version-controlled exclusions as `coverage-destination.md`; that reference owns the
denominator and this one does not restate it — to a mutation score of **at least 80%**.

**Why 80 and not 90.** The coverage destination is 90/90 because 100% line and branch coverage is
reachable in principle: every authored line is executable and every branch is takeable. A mutation
score of 100% is **not** reachable in principle, because equivalent mutants exist by construction
— mutants whose behavior no possible input distinguishes from the original, and which therefore no
test can kill (see the next section). The remaining distance to 100 is not test debt; it is a
property of the technique. 80% on a population already held to 90% line coverage means roughly
nine in ten behavior changes are caught within the code the tests reach, with the balance argued
rather than assumed. Above that, effort shifts from writing assertions to arguing about
equivalence, which produces documents rather than defect detection.

**Day-one gate: 80% on changed code.** Mutants generated from new or changed in-scope lines meet
80%, from the first commit, in a repo whose whole-repo score is unknown or terrible. This is the
same shape and the same reasoning as the diff-coverage gate in `ratchet.md`: it is enforceable
immediately, it reflects current work, and it stops the repo getting worse without touching a line
of legacy.

**Diff-scoped is the requirement; whole-repo is the report.** A whole-repo mutation run costs
roughly *mutants × test-suite duration*. It is far too slow to gate a pull request on, and a gate
people disable is not a gate. So:

- **Per change:** mutants from changed code only, in CI, blocking.
- **Scheduled (nightly or weekly):** the whole-repo run, non-blocking, publishing the score that
  the floor is ratcheted against.
- **The whole-repo floor never decreases**, and rises as a consequence of work done — the same
  monotonicity rule coverage floors obey. Raising it as a quota produces mutation-score theatre,
  which is coverage theatre with a longer build time.

**Do not narrow the mutator set to raise the score.** Run the tool's default mutator group; where
a repo adds or removes mutators, that set lives in version-controlled config and is reported with
the result. Silently dropping the mutators a suite is bad at is the exact analogue of excluding
authored logic from the coverage denominator, and `coverage-destination.md` already forbids that
move.

## Equivalent mutants, and the escape hatch

Some survivors are legitimate. **Every one of them gets named in writing.** That sentence is the
whole rule; the rest of this section is what a legitimate survivor looks like and what "named"
means.

### What a legitimate survivor looks like

| Shape | Example |
| --- | --- |
| **Genuinely equivalent** | a mutant no input distinguishes from the original: a boundary flipped where an upstream invariant already excludes the boundary value; reordered operands of a side-effect-free short-circuit; a mutated constant in a branch made unreachable by an earlier guard |
| **Not an observable outcome** | a mutated log message argument, metric label, span attribute, `toString`, `hashCode`, cache-size hint, or a retry/timeout value the suite has no way to distinguish |
| **Infeasible for the suite** | code reachable only from an environment the suite cannot produce — a platform branch, a vendor error code the protocol-level fake does not emit |
| **Compiler-generated junk** | mutants in constructs the author never wrote: null-check intrinsics, destructuring, coroutine state machines, autogenerated accessors, synthetic bridge methods. Not survivors that mean anything — see the Kotlin note in the tooling section |

Two of those shapes are load-bearing signals, not free passes. **A mutated timeout or retry count
that nothing can distinguish means there is no test for what happens when it expires** — often
that is the missing test, not an equivalent mutant. And **a survivor whose only possible kill
would require reaching interior state is a CODE FLAG**, not an exception: the seam is in the wrong
place (`code-craft-tdd`'s `references/enforcement.md`).

### What "named in writing" means

- **First, read the survivor as a statement about the test, not the code.** Most survivors are a
  missing assertion, and the fix is one line in a test. Reach for the escape hatch only after that
  reading fails.
- **A named survivor carries its reason, its owner, and its date** — in the change's PR body for a
  one-off, or in the tool's own suppression mechanism with the reason in the entry. An unowned,
  undated suppression is indistinguishable from an accepted standard within a quarter; that is
  already an anti-pattern in `ratchet.md` and it applies here unchanged.
- **Never launder a survivor into a silent exclusion.** Widening an exclude glob, dropping a
  mutator, or excluding the class is the move that converts a measurement into a suppression file,
  and it is the same defining failure as regenerating a baseline to turn a red build green.
- **Three survivors of the same shape are not three exceptions — they are one missing test.** The
  accounting is per-mutant precisely so that pattern becomes visible instead of being averaged
  away by the score.

On changed code the two requirements compose: the 80% score is the machine gate, and every
survivor above it is killed or named. That combination is what stops 80% from meaning "one line in
five may be silently wrong".

## Tooling, per ecosystem

Verified against each project's own repository, official docs, and package registry on
**2026-08-11**; re-verify before trusting an entry more than a year old. The commercial and dead
options are named explicitly, because which is which is not visible from a search result.

| Ecosystem | Tool | Coordinates | Invocation | Changed-code scoping |
| --- | --- | --- | --- | --- |
| Java / JVM | **PIT (pitest)** 1.25.9 | `org.pitest:pitest-maven`; Gradle plugin id `info.solidsoft.pitest` 1.19.0 | `mvn org.pitest:pitest-maven:mutationCoverage` / `gradle pitest` | free: history-file incremental analysis (`historyInputFile`/`historyOutputFile`, or `withHistory=true`). Genuine git scoping is **commercial** — see below |
| JUnit 5 on the JVM | **`pitest-junit5-plugin`** 1.2.3 | `org.pitest:pitest-junit5-plugin` | added to the **pitest tool** classpath (a nested `<dependency>` of `pitest-maven`; Gradle `pitest { junit5PluginVersion = '1.2.3' }`) — not the project classpath | n/a |
| .NET | **Stryker.NET** 4.16.0 | dotnet tool `dotnet-stryker` | `dotnet stryker` (`dotnet stryker init` scaffolds config) | **`--since:<committish>`**; config `since.target` (default `master`), `since.enabled`, `since.ignore-changes-in` |
| JS / TS | **StrykerJS** 9.6.1 | `@stryker-mutator/core` plus a runner: `@stryker-mutator/{vitest,jest,mocha,karma,jasmine,cucumber,tap}-runner`, all 9.6.1 | `npx stryker run` | **`--incremental`** (+ `--incrementalFile`, `--force`). **There is no `--since` in StrykerJS** — that flag is Stryker.NET only. Scope files with `--mutate` globs, which accept `path.ts:1-100` spans |
| Python | **mutmut** 3.7.0 — default choice | PyPI `mutmut` | `mutmut run`, then `mutmut browse`, `mutmut apply <mutant>` | implicit: per-function result caching re-tests only changed functions; `use_git_change_detection`, `on_dependency_change`. No diff flag |
| Python | **cosmic-ray** 8.7.0 — for distributed runs | PyPI `cosmic-ray` | `cosmic-ray new-config c.toml` → `init c.toml s.sqlite` → `baseline` → `exec` → **`cr-report s.sqlite`** / `cr-html` (separate binaries, not `cosmic-ray report`) | none built in |
| Rust | **cargo-mutants** 27.1.0 | `cargo-mutants` | `cargo mutants` | **`--in-diff DIFF_FILE`**, composes with `--package` / `--regex` |
| Go | **gremlins** 0.6.0 — thin ice | `github.com/go-gremlins/gremlins` | `gremlins unleash` | none documented |

**Python default is mutmut**, on evidence rather than taste: steady cadence (3.3 → 3.7 across
2025-05 to 2026-07), one-command invocation, and incremental caching built in. Know its 3.x
breaks before adopting: 3.0 switched to mutation schemata for parallelism, became **pytest-only**,
and **stopped mutating code outside functions** (upstream directs those users back to mutmut 2).
It needs `fork()`, so on Windows it runs under WSL. cosmic-ray is alive (8.7.0, 2026-08-09) and is
the right pick when you need distributed execution or a durable session database; its cost is a
four-command workflow plus separate report binaries.

**Kotlin under PIT is the trap in this table, and it is not the one you would guess.** The problem
is not scoping — `targetClasses` and `mutableCodePaths` are ordinary knobs, and the Gradle plugin
sets `mutableCodePaths` for you. The problem is that Kotlin's compiler-generated constructs
(null-check intrinsics, safe casts, destructuring, coroutines, `lateinit`, autogenerated
accessors, unmatched `when` branches) produce **junk mutants that do not map to source the author
wrote**, and that **inline functions have their bytecode copied into every call site**, so their
mutants are attributed to the wrong class and the original function is never itself executed.
Cleaning that up is what `com.arcmutate:pitest-kotlin-plugin` (1.5.1) does, and **it is commercial,
licence-file gated**. So: on Kotlin, either budget for the licence or expect to spend real effort
triaging noise — and scope `targetClasses` narrowly at first for that reason, not because scoping
is the fix. Do not present free Kotlin mutation testing as a solved problem.

**PIT's changed-code story has the same split.** The free path is *incremental analysis*, which
PIT's own documentation labels experimental and admits can be wrong, because it considers only
superclass and outer-class dependency changes. Genuine git-ref scoping is
`com.arcmutate:pitest-git-plugin` (2.3.3, commercial, needs PIT ≥ 1.22.0 and
`arcmutate-licence.txt` at the repo root), invoked as
`mvn -DextraFeatures="+GIT(from[master], scope[class])"`. On the JVM, therefore, treat the
diff-scoped gate as PARTIAL unless the licence is bought.

**Do not name these:**

- **`go-mutesting` is dead** — last release v1.2 (2021-06-10), last push 2024, dozens of open
  issues. `gremlins` is the only credible Go option and it had a two-year release gap before
  v0.6.0 (2025-12-06). In Go, wire mutation testing deliberately or not at all; do not pretend
  the ecosystem is served.
- **Gradle plugin versions do not track PIT versions.** `info.solidsoft.pitest` 1.19.0 is not
  PIT 1.19.0, and its own notes disclaim feature parity. It defaults to PIT 1.22.1, so **pin
  `pitestVersion` explicitly** or you silently run a version several months behind.
- **`search.maven.org`'s search index is stale** for these artifacts (it reported PIT 1.19.1).
  Read `repo1.maven.org/.../maven-metadata.xml` for JVM version truth.

## Enforcement

[enforcement.md](enforcement.md) owns the ENFORCED/PARTIAL/REVIEW verdict for every rule on this
page — the four mutation rows sit in its `code-craft-tdd` catalog beside the coverage rows, with
the per-ecosystem reason the diff-scoped gate is only PARTIAL outside .NET and Rust. Read it
there.

What belongs here is the canary, because a mutation gate has its own way of failing open.

Prove the gate the way the canary rule requires: introduce one deliberately unasserted test over a
conditional, confirm the mutation gate fails and names the surviving mutant, revert. A mutation
gate reading an empty or stale report is green in exactly the way a coverage gate reading an empty
report is green.

## Where this sits in the ratchet

`ratchet.md` owns the pass ladder and places this step; it is Pass 1 material, after diff coverage
and before the whole-repo floor. The reason for that order is the ceiling argument above — a
mutation score gathered before coverage is diff-gated mostly reports no-coverage mutants and
teaches nothing about assertions.
