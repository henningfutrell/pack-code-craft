# Omission rules, in full — worked example

*Read this when applying the progressive-omission method to a specific event name, or when the
one-line decision table in `SKILL.md` isn't enough to settle a borderline case.*

## Part-by-part description

| Part | Meaning | Example |
| --- | --- | --- |
| **Resource** | Primary entity | `User`, `Organization` |
| **TransitiveVerb** | Past-tense action on the resource | `Created`, `Updated`, `Imported`, `Detected` |
| **In[ExecutionContext]** | **Where** the action occurred | `InIam`, `InOnboarding`, `InLicensing` |
| **From[Source]** | **Where** the data originated | `FromIam`, `FromOnboarding` |
| **By[Actor]** | **Who/what** performed the action | `BySyncService`, `ByUser`, `ByStripe` |
| **Via[Trigger]** | **How** the action was triggered | `ViaWebhook`, `ViaBackgroundJob`, `ViaUi` |

The fully-qualified form is always constructible, and useful to write out once while naming,
even though it is rarely what ships:

`UserUpdatedInIamFromOnboardingByCompensationServiceViaTemporalWorkflow`

Fully qualifying every *internal* event is tedious and not pragmatic:

`UserUpdatedInOurSystemFromIamBySyncServiceViaBackgroundJob`

In most cases, simplify.

## Worked walkthrough

Start from the canonical form:

`UserUpdatedInOurSystemFromIamBySyncServiceViaBackgroundJob`

### 1. `In[ExecutionContext]` → omit the default context

> **Rule**: if the event is emitted or consumed within this domain, the execution context is
> "this domain" by default.

- `InOurSystem` adds zero runtime value.
- All internal events assume this.
- Omit always, for internal events.

→ `UserUpdatedFromIamBySyncServiceViaBackgroundJob`

### 2. `By[Actor]` → omit unless cross-service or auditable

> **Rule**: include the actor only when it is not the obvious internal agent, or when
> audit/cross-team visibility requires it.

| Case | Keep? | Why |
| --- | --- | --- |
| Internal sync job | Omit | `SyncService` is the only thing that emits this |
| External system (e.g. `ByStripe`) | Keep | Critical for tracing |
| Human user action | Keep | `ByUser123` or `BySupportAgent` |
| Background worker | Omit | Implied by event type |

→ omit `BySyncService` (internal, expected)

→ `UserUpdatedFromIamViaBackgroundJob`

### 3. `Via[Trigger]` → omit unless the trigger changes semantics

> **Rule**: include the trigger only when the mechanism affects behavior, routing, or retry
> logic.

| Trigger | Keep? | Why |
| --- | --- | --- |
| `ViaBackgroundJob` | Omit | Default for syncs — no surprise |
| `ViaWebhook` | Keep | Real-time, different SLA |
| `ViaUserClick` | Keep | UI-driven, may need confirmation |
| `ViaApiCall` | Keep | External integration |

→ omit `ViaBackgroundJob` (default, expected)

→ `UserUpdatedFromIam`

## Final simplified name

`UserUpdatedFromIam`

Meaning, fully recoverable from context:

- **Resource**: User
- **Action**: Updated
- **Execution context**: this domain (implied)
- **Data source**: Iam
- **Actor**: internal sync (implied)
- **Trigger**: background job (implied)

## Two contrasting simplified examples

### `UserCreatedFromIam`

Used when a user is created **in our system** using data **from IAM**, by an internal actor,
via an internal trigger. `From` establishes IAM as the *source* of the data; "our system" is
implied as the execution context.

### `UserCreatedInIam`

Used when a user is created **in the IAM system**. `In` establishes IAM as the *execution
context*; "our system" is implied as the source of the data.

These two names look similar and mean opposite things — `From` vs `In` is the single most
consequential word choice in this template. When both context and source could plausibly be
named, resolve the ambiguity by keeping whichever one differs from "this domain"; if both
differ, keep both.
