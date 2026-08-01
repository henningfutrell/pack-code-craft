# UI model boundary — presentation stops at the edge

*Read this when designing or reviewing a UI boundary, a presenter/controller, a UI-state
container, or a public contract between UI and core.*

## Own the shapes

- **UI owns view models.** They are presentation shapes: display labels, formatted values,
  selection state, enabled/disabled state, pagination, view-specific grouping, and fields the
  screen needs to render.
- **Core/domain owns data and domain models.** They express business concepts, invariants,
  value objects, aggregate state, commands, results, and domain events in ubiquitous language.
- A view model is not a renamed domain model. Similar fields do not make the types
  interchangeable. Each side owns and evolves its own shape.
- Never expose a domain model as a UI contract: not in component props, page state, presenter
  outputs, controller responses consumed by UI, route payloads, or shared `common` packages
  used to bypass the boundary.

## Translate explicitly

Translate at the UI/core boundary with named mappers or DTO adapters. The mapper makes
projection, formatting, redaction, field renaming, nullability, and versioning visible.

```
core result / domain data model -> UI DTO adapter or mapper -> view model -> view
UI intent / input model -> command DTO adapter or mapper -> application command -> core
```

Keep translation at the adapter boundary. Do not distribute it through template expressions,
components, presenters, controllers, or reducers. A transport boundary may serialize a DTO;
serialization does not turn a domain model into a UI contract.

The UI boundary is mandatory even for an in-process modular monolith. HTTP, gRPC, and local
public methods are alternate transports for the same ports-and-adapters boundary. A transport
change must not require a domain rewrite.

## Keep business rules in core

Views render. Presenters shape view models. Controllers translate and dispatch. UI state
containers hold presentation state. None decides business policy.

Do not put these in UI code:

- eligibility, authorization, pricing, discount, tax, quota, workflow-transition, or lifecycle
  decisions;
- invariant enforcement, aggregate mutation policy, domain validation, or cross-record business
  rules;
- domain calculations hidden in selectors, computed properties, template expressions, reducers,
  effects, event handlers, or controller branches.

Put the rule in a domain module or application use case, expose the result through a port, then
map it to the view model. UI-only behavior stays in UI: focus, layout, local input state,
formatting, animation, and rendering choices.

Carving business logic out of UI is integral work, not optional cleanup. Finding the distinction
is part of the change: trace each UI conditional or calculation to its policy owner. When it
changes a business outcome rather than only its presentation, move it inward.

## Enforce what a machine can decide

| Covenant | Class | Gate |
| --- | --- | --- |
| UI packages do not import domain/core types | ENFORCED | Dependency-direction rule; forbid imports and type references from UI packages to domain packages. |
| Domain/core packages do not depend on UI | ENFORCED | Layer rule: dependencies point inward. |
| UI receives owned view-model/input DTO contracts | PARTIAL | Forbid domain types in UI-facing signatures and public UI-contract packages; inspect generated or reflective paths separately. |
| Business logic does not live in views, presenters, controllers, or UI state | REVIEW | A tool cannot reliably decide whether a conditional is presentation behavior or business policy. Review the concrete rule and its owner. |

Wire the ENFORCED rules into architecture tests or import-boundary analysis. Prove each rule
fires: add the smallest forbidden UI-to-domain import, confirm the gate fails with the correct
rule, then revert it. A green dependency gate never demonstrated red is unverified.

Do not downgrade a REVIEW judgment into a fake metric. Use the boundary rule to catch structural
leakage; use review to identify disguised business logic and move it into the domain or
application layer.
