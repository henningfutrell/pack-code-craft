# MVP Model — lightweight CQRS, deliberate event sourcing

*Read this when designing an MVP Model, defining application use cases, or deciding whether
event sourcing belongs in the domain. This is an on-demand `craft-code-quality` reference, not
a new framework mandate.*

## Make the Model a CQRS boundary

Build **MVP**. The **Model** owns business behavior and application use cases; the View owns
view models and rendering; the Presenter coordinates the interaction without becoming the
business layer.

At the Model's **application/use-case boundary**, split work into two explicit paths:

- **Commands** express an intent to change business state. Validate the request, load the
  relevant domain state, execute business rules, persist the result, and emit the applicable
  domain events.
- **Queries** read and shape state for a caller. They do not change business state, invoke
  command behavior, or hide a write behind a getter.

Name and type the paths so the split is visible: `CreateOrder`, `ApproveInvoice`, and
`ChangeAddress` are commands; `GetOrder`, `ListOpenInvoices`, and `FindCustomer` are queries.
Separate methods, handler types, or use-case types are sufficient. Choose the smallest shape
that keeps reads and writes unmistakable.

Do not install ceremony to prove the separation. **Do not require MediatR or any mediator,
separate read/write databases, microservices, an event bus, or a distributed topology.** A
modular monolith with ordinary application methods is CQRS when command and query responsibilities
are separate. Sharing a transactional database is normal unless a demonstrated read-model or
scale constraint says otherwise.

Do not make the split performative:

- Do not route every trivial property access through a handler framework.
- Do not copy a read model merely because it is called CQRS; create a projection only when its
  caller, shape, performance, authorization, or isolation need is real.
- Do not let a query mutate state for convenience. Cache refreshes, last-seen timestamps, and
  similar side effects are explicit commands or infrastructure concerns, never hidden query
  behavior.
- Do not use command handlers as controllers, repositories, or a dumping ground for domain
  logic. Keep domain decisions in the domain model and I/O behind ports.

## Default to CQRS without event sourcing

CQRS separates application intent from reads. It does **not** require event sourcing. The default
Model persists current state through the appropriate persistence port and publishes domain events
for meaningful business changes. That is enough for most domains.

Use **CQRS/ES** only when the domain earns its operational cost. Choose event sourcing when one or
more of these are central domain requirements:

- **Temporal history** — answer what the business believed, decided, or held at a point in time.
- **Auditability** — retain an authoritative, explainable sequence of business facts rather than
  a mutable final row plus incidental logs.
- **Replay** — rebuild projections or derive new read models from the historical event stream.
- **Event-native invariants** — business rules depend on a sequence of facts, causation, or
  state transitions that current-state persistence obscures.

If those criteria are absent, do not adopt ES. Reporting needs, integration messages, generic
"future flexibility," and a desire to use an event bus are not sufficient.

When ES is warranted, accept the whole contract: append-only domain facts, stable event schemas
and evolution policy, projection rebuilds, idempotent consumers, concurrency control, retention
and privacy handling, and operational tooling to inspect and repair projections. If the team
cannot operate that contract, it has not justified ES.

Keep events and commands distinct. A command asks for a change and may be rejected. An event
records a business fact that occurred. Never treat an unvalidated command as an event, and never
use an event stream as a vague substitute for application commands.

## Review questions

- Can a reviewer identify the command path and query path from the application API without
  inferring it from implementation details?
- Does every query remain observably non-mutating?
- Is the chosen mechanism no more elaborate than the use case requires?
- If ES is proposed, which explicit temporal, audit, replay, or event-native invariant cannot be
  served adequately by current-state persistence plus domain events?
- Has the proposal funded the operational contract, rather than only the event store?
