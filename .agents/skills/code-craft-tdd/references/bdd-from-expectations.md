# BDD from expectations — the request, made executable

*Read this when a user states an expectation, files a bug, or hands over acceptance criteria;
when writing or reviewing a Gherkin feature; or when deciding what an acceptance test is
allowed to touch.*

**The prompts and the user's stated expectations are the specification.** Not a paraphrase of
one, not a ticket derived from one — the sentences themselves, turned into scenarios that
execute against the running system. An expectation that lives only in a conversation is a
requirement nobody can verify; the same expectation as a scenario is a requirement the build
checks on every commit.

That is the whole point of this file. Everything below is how to do it without producing an
acceptance suite that certifies something no user can reach.

## Where a scenario comes from

Every scenario has a traceable origin. There are four, and no fifth:

| Origin | Becomes |
| --- | --- |
| A user request ("it should let me…") | a scenario per stated behavior |
| A bug report | a scenario reproducing it, from outside, before the fix |
| A stated expectation about how the system behaves | a scenario asserting it |
| An acceptance criterion on a work item | one scenario per criterion |

**Preserve the requester's language.** The scenario's title and its Given/When/Then steps use
the words the expectation was stated in, spelled the way the glossary spells them. This is not
a separate discipline: it is the propagation rule `code-craft-ubiquitous-language` already
applies to types, events, and test names, applied to the one artifact where the domain's words
originate. Read that skill for the rule and the glossary format; do not re-derive it here. Where
the requester's word and the glossary's word differ, that is a glossary finding to raise, not a
silent translation to perform.

**Record the provenance in the feature file.** The `Feature:` description block names where the
expectation came from — the request, the bug report, the work item. Six months on, the question
asked of a failing scenario is always "who wanted this, and is it still true"; a scenario that
cannot answer it gets deleted or, worse, weakened until it passes.

## The boundary — API only, and this is the rule that gets broken

**A scenario drives the system exclusively through a user-side driving adapter.** The HTTP API.
A CLI invocation. A message the system consumes. The same entry point a real client uses, over
the real transport, against the composed application.

A scenario therefore never:

- constructs a service, use-case handler, domain object, aggregate, or repository;
- resolves one out of the container to call it;
- injects or replaces a collaborator inside the system;
- asserts on interior state — a field, an in-memory aggregate, a row read behind the adapter's
  back, a log line standing in for an outcome.

The system under test is a black box with a real boundary. **The scenario is one of its
clients**, and it has exactly the access a client has: it sends what a client can send and
observes what a client can observe.

**The concrete failure mode, because it is not hypothetical.** A scenario that calls
`OrderService.Place(...)` directly passes while the HTTP route that every real client uses is
unrouted, misauthorized, rejecting the content type, or serializing a field the client cannot
parse. The suite is green. The feature does not work. That scenario certifies a path no user can
reach, and it does it while displaying the user's own sentence as its title — which is why this
failure is worse than an absent test. It is a false statement about the thing the user asked
for.

The same failure in miniature: asserting on interior state. A scenario that reads the aggregate
to confirm the order was placed passes when the response the client actually receives says
nothing of the kind.

**The one legitimate double at that boundary** is an external unmanaged dependency behind its
own seam — the payment gateway, the third-party API, the vendor SDK. That is the pack's existing
EUD rule and it is unchanged here: mock the interface, never the logic behind it, and register
the double in the container so it is transparent to the application. `references/integration-testing.md`
carries the seam rules, the stub/spy/bomb shapes, and the real-infrastructure requirement — a
container-backed database is real infrastructure, not an EUD, and a scenario never mocks it.
`code-craft-quality`'s `references/ui-model-boundary.md` carries why the boundary exists at all:
HTTP, gRPC, and local public methods are alternate transports for one ports-and-adapters seam,
and UI always sits behind an API boundary. A scenario drives that seam from the outside, exactly
as the UI does.

**Consequence worth stating plainly:** if a behavior cannot be reached through a driving adapter,
the scenario does not get a shortcut — the missing adapter is the finding. Either the behavior is
not actually user-facing and does not want a scenario, or the system has no way for a user to
reach it, which is a CODE FLAG (`references/enforcement.md`), not a testing inconvenience.

## What makes a scenario honest

- **Given/When/Then names observable behavior at the outermost seam.** Given a state a client
  could establish, When a request a client could send, Then an outcome a client could see.
- **Steps are written in the domain's language, not the transport's.** `When the customer
  submits the order` — the HTTP verb, the route, and the payload live in the step definition,
  which is the adapter-facing layer. A scenario that reads `When I POST /api/v1/orders` has
  leaked the transport into the specification and will be rewritten by the next routing change,
  for no behavioral reason.
- **A scenario asserting that a mock was called is the BDD form of coverage theatre.** It proves
  the test's own wiring. Assert the outcome the client observes. The general prohibition is in
  `code-craft-quality`'s `references/coverage-destination.md`; whether an assertion is
  load-bearing at all is what the mutation score measures
  (`code-craft-quality`'s `references/mutation-testing.md`). Both apply to scenarios; neither is
  restated here.
- **One expectation per scenario.** A scenario that asserts four things reports one failure and
  hides three.
- **No scenario depends on another's leftover state.** Each one establishes what it needs through
  the adapter and runs against a cold start — the initial-state principle in
  `references/principles.md` applies with full force, because acceptance suites are where
  order-dependence hides best.

## Ordering — scenarios do not replace the failing test

**The scenario is written first and passes last.** It does not substitute for the failing
unit or integration test this skill already requires.

1. **The scenario, first, and red.** Written from the expectation before any production code
   exists. It is the definition of done for the request, in the requester's words, and it stays
   red across the whole change.
2. **Then the inner loop, per increment.** Failing unit or integration test → implementation →
   pass → triangulate, as `SKILL.md` mandates, repeated as many times as the change needs.
3. **The scenario goes green last.** When it does, the request is satisfied — end to end, through
   the boundary a user reaches.

Why both, and not just the scenario: a scenario proves one path through the assembled system.
It cannot carry the Boundaries and Corner-case principles — zero, one, many, null, empty, max, bad
input, concurrency, loss — without becoming an unreadable combinatorial suite that takes an hour
to run. Those belong to the inner loop, and the inner loop is where coverage and mutation gates
are actually met. Why not just the inner loop: a full inner suite can be green while nothing a
user touches works. **Neither layer detects the other's failure mode.** That is the entire
argument for keeping both.

Corollary for a bug: the reproduction goes at the boundary if the reported symptom is at the
boundary. A user reporting "the API returns 500" gets a scenario, not only a unit test — the unit
test proves the cause is fixed, the scenario proves the symptom is gone.

## Where the files live

One convention, so two repos do not invent two. Adapt the paths to the ecosystem's defaults in
the table below; do not adapt the structure.

- **The acceptance suite is its own source set, project, or top-level test directory** — named
  for what it is (`acceptance`), separate from unit and integration tests. It is slow and
  out-of-process; it must be schedulable on its own.
- **One feature file per user-facing capability**, named in the domain's words with the glossary's
  spelling, in the ecosystem's file-naming style. Not one per endpoint, and not one per sprint.
- **Step definitions sit in that same acceptance source set and contain only adapter calls** —
  an HTTP client, a CLI process invocation, a message publish, plus assertions on what comes
  back. A step definition that imports a domain type, a handler, or a repository is the boundary
  violation from the section above, in the one place it is easy to spot and easy to gate.
- **Shared client helpers go in a driver object**, not copied across step files. The driver is
  the scenario's HTTP/CLI client; it is the only thing in the suite that knows the transport.
- **Nothing in the acceptance suite is on the production code's compile path.** It depends on the
  deployable, the way a client does.

## Tooling, per ecosystem

Verified against each project's own repository, docs, and package registry on **2026-08-11**;
re-verify before trusting an entry that is more than a year old. Named tools are current; the
dead ones are named too, because the reason to avoid them is not obvious from search results.

| Ecosystem | Tool | Coordinates | Run by | Feature files |
| --- | --- | --- | --- | --- |
| JVM (Java/Kotlin) | **Cucumber-JVM** 7.34.6 | `io.cucumber:cucumber-java` + `io.cucumber:cucumber-junit-platform-engine` + `org.junit.platform:junit-platform-suite`; pin the set with `io.cucumber:cucumber-bom` | `mvn test` / `gradle test` via a suite class: `@Suite @IncludeEngines("cucumber") @SelectPackages(..) @ConfigurationParameter(key = GLUE_PROPERTY_NAME, ..)` | archetype convention: `src/test/resources/<package as path>/*.feature`; glue and runner in the matching Java/Kotlin package |
| .NET | **Reqnroll** 3.3.4 | `Reqnroll.xUnit`, `Reqnroll.NUnit`, `Reqnroll.MsTest`, or `Reqnroll.TUnit` | plain `dotnet test` | convention: a `Features/` folder in the test project, sub-folders allowed |
| Python | **pytest-bdd** 8.1.0 — default choice | `pytest-bdd` | plain `pytest`, with `scenarios("…")` or `@scenario(…)` binding | resolved relative to the test module; set `bdd_features_base_dir` to fix one root |
| Python | **behave** 1.3.3 — when a standalone Gherkin runner is wanted | `behave` | `behave` | `features/`, steps in `features/steps/`, hooks in `features/environment.py` |
| JS/TS | **Cucumber.js** 13.2.1 | `@cucumber/cucumber` | `npx cucumber-js`; TypeScript steps via `tsx` (`--require-module tsx/cjs`, or an ESM `--import` register shim) | default glob `features/**/*.{feature,feature.md}`; support code defaults to the whole `features` tree, not `features/step_definitions/` |

**Prefer pytest-bdd in Python** unless the repo wants a Gherkin-first runner with no pytest
coupling. It is a pytest plugin, so it inherits fixtures, parametrization, marker selection,
xdist, and the reporting the repo already has, and it adds no second test-discovery convention.
Its cost is real and worth knowing: the repository is maintained but the last PyPI release is
8.1.0 (2024-12-05), so fixes on master are unshipped. behave is the opposite shape — genuinely
revived after a seven-year gap (1.2.6 in 2018 → 1.3.0 in 2025-08 → 1.3.3 in 2025-09) and
shipping, but it is a second runner in the repo.

**Do not name these:**

- **SpecFlow is end-of-life.** Tricentis announced it in December 2024 with an EOL date of
  **2024-12-31**; the SpecFlow GitHub repositories were deleted, and NuGet stalls at 3.9.74
  (2022-05-03, .NET 7 maximum). The packages are still *listed*, so an existing build keeps
  restoring and looks fine — which is exactly why this needs stating. **Reqnroll is the live
  community fork.** Migrating is a rename across namespaces, package ids, and config
  (`specflow.json` → `reqnroll.json`); `Reqnroll.SpecFlowCompatibility` reduces but does not
  remove the work. SpecFlow+ LivingDoc was never open source and has no Reqnroll equivalent.
- **`io.cucumber:cucumber-junit` (the JUnit 4 `@RunWith(Cucumber.class)` runner) is deprecated**
  and JUnit 4 is in maintenance mode. It is still published on the current version train, so it
  installs cleanly and every stale tutorial shows it. Use the JUnit Platform engine.
- **The unscoped npm `cucumber` package** is historical; the current name is `@cucumber/cucumber`.

Two wiring notes that cost an afternoon each: Surefire and Gradle still cannot discover
non-class-based tests, which is *why* Cucumber-JVM needs the `@Suite` class (or the JUnit Platform
Console Launcher, or Gradle's `cucumber-companion` plugin) — it is a workaround, not the ideal.
And set `cucumber.junit-platform.naming-strategy=long` or reports show bare scenario names.

## Enforcement

`code-craft-quality`'s `references/enforcement.md` owns the ENFORCED/PARTIAL/REVIEW verdict for
every rule on this page — the five acceptance-scenario rows sit in its `code-craft-tdd` catalog.
Read them there rather than here.

**The load-bearing one is the boundary gate**, and it is genuinely ENFORCED: an
import/dependency-boundary rule on the acceptance source set, forbidding domain, application, and
persistence types in step definitions. Same mechanism as every other layer rule in this pack,
pointed at test code. It is the only mechanism that catches the failure mode described above, so
wire it before the suite has more than one scenario in it.

Prove the boundary rule the way the canary rule requires: add one import of a domain type into a
step definition, confirm the check fails naming that rule, revert. A boundary gate never seen red
is unverified, and this is the gate whose silent failure produces the false-confidence scenario
described above.
