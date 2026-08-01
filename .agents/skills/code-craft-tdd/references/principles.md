# Principles, in depth

## The five

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
