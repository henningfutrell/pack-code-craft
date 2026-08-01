# Integration testing, in depth

## Prefer integration tests, and prioritize the fixture

- Integration tests exercise a **running application**.
- The application is hosted **in the fixture**.
- Override services in the fixture — not in individual tests.
- Use context and configuration that let the application itself serve as the fixture.

**Test at the real boundary:**

| Subject | Driven by |
| --- | --- |
| Event-driven service | emitting events through the stack's own emission mechanism |
| Endpoint | calling the endpoint |

## Real infrastructure

- Integration tests use production technology (e.g. the actual database engine) via
  container-based test infrastructure — Testcontainers or the stack's equivalent.
- Prefer containers whenever available. Do **not** silently skip container-backed tests
  because a container runtime is missing — a container runtime is an expected part of the
  test environment. A missing one is a finding to surface, not a test to skip.
- For production infrastructure that cannot run in a container, stand up a protocol-level
  fake (WireMock or equivalent).

## Mocking, precisely

- The only legitimate mock target is an **external unmanaged dependency (EUD)**.
- Every EUD has an interface. That interface **is** the seam. Mock the interface, never the
  logic behind it.
- Mock shapes: **stub** (supplies input), **spy** (records output), **bomb** (fails on
  demand).
- Register mocks in the container so they are transparent to both the test suite and the
  application.
- Testing **output to** an EUD → use a spy.
- Testing **input from** an EUD → use a stub with randomized data and validation.

## Hard-to-test shapes: polling

Polling services are hard to test. The better design is usually an endpoint driven by a
scheduler, which is testable at the endpoint.

Where a polling service is used anyway, separate the concerns:

**Thin poller + testable emitter.**

1. **Poller** — a timer that calls the emitter on an interval. ~10-15 logical LOC in its
   execute body. No business logic. Not registered in tests (exclude hosted services in the
   fixture).
2. **Emitter** — holds all the logic for reading data and emitting events. Internal class
   behind a public interface, because it adapts an external system (a change-data-capture
   feed, a third-party queue, a vendor API). That external adapter role is *why* the
   interface is public, not a style preference. Registered in the container so tests
   resolve it and call it directly.

Rules: pollers emit events; pollers are not tested directly; the **handling** of emitted
events is what gets tested; a poller manages polling and nothing else.
