# Principles, in depth

## The six

1. **PoC or GTFO.** If you cannot construct a failing test around a hypothesis, the
   hypothesis is false. A claim without a reproducible test is not actualized — applies to
   every assumption, bug report, and feature request.
2. **Target.** Given a failing test, make it pass **only** through a narrow, focused
   implementation. Until the test passes, the fix does not exist.
3. **Triangulate.** Add tests that modify the scenario, proving the implementation is not
   overfit to the first case.
4. **Boundaries.** Two is many; nulls are expected. Test zero, one, many, null, empty, max.
5. **Corner cases.** Null is expected, comms will be lost, nothing is guaranteed. What
   happens on enormous unexpected input? Under concurrent access? Consider all
   considerations.
6. **Initial state.** A test that runs in the state prior work already left behind proves
   less than it appears to. Test from cold start, and against the composed configuration
   the system actually runs. Below.

## Initial state — what the test was standing in

**A suite that only ever observes the system in the state prior work left it in is
measuring its own history.** Every principle above varies the *input*. This one varies
what the system was sitting in when the input arrived — and it is the variable a
developer machine silently pins, because the machine accumulates exactly the state that
makes the defect invisible.

Two shapes recur. Cover both deliberately; neither appears by accident.

**(a) Cold start.** Nothing built, nothing cached, nothing pre-created, no prior run's
artifacts. Every test passes on a machine that already holds the built images, the
populated cache, the migrated database, the directory some earlier command created. The
first user has none of that.

- Test the empty case as a first-class case: zero records, zero configured identities,
  zero plugins. **Zero is a supported state and it is a different code path.**
- Where the system produces artifacts (images, bundles, generated code, schema),
  construct at least one test that runs against a workspace with none of them, and prove
  the build step is reached rather than assumed. A missing local artifact frequently does
  not fail loudly — it falls through to a remote fetch and fails much later, with an
  error naming the wrong subsystem.
- Ask, explicitly and out loud: *has anyone run this from empty?* A green suite is not an
  answer to that question.

**(b) Composed configuration.** The layered, merged, templated, or environment-overridden
form the system actually runs — not one layer read alone. A test that reads the overlay
file by itself exercises a simpler configuration than production ever has, and the merge
is where the defect lives.

- Assert on the **rendered, composed** result: template plus overlay, defaults plus
  environment, base manifest plus every fragment.
- A conditional in the composer and a conditional in the template are two rules that must
  agree. Nothing checks that they do except a test that renders both together.

Evidence — two production defects that a fully green suite did not catch, and the second
is why this is a principle rather than an anecdote:

| Defect | Why the suite missed it |
| --- | --- |
| A platform's `up` command could not start from a fresh clone: the build step was gated on a non-empty collection while the generated compose file referenced the built image unconditionally. Zero was a supported state; the runtime fell through to a registry pull of a local-only reference and exited 125. | Every dev machine already held the image from earlier work. |
| A configuration render emitted a split, invalid document. | Every render test read the overlay alone instead of composing it with the tracked template. |

## Run the suite once; analyze the stored output many times

- Redirect test output to a file. Analyze the file.
- To find failures, `grep`/`rg` the output file. Do not re-run the suite.
- For counts, error messages, or stack traces: grep the output, or read the structured
  reports the stack emits (JUnit XML, HTML reports, coverage output) under whatever
  directory the build writes them to.
- Re-running a full suite to extract different information from the same run is waste. Run
  once, analyze many times.

## Assertions

- Never assert against magic values.
- A stub that introduced data owns a store; assert against that store.
- Randomize all data where possible. Randomization is what proves the assertion tests
  behavior rather than a hardcoded coincidence.
