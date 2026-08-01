---
name: craft-event-naming
description: >-
  Naming method for domain events and commands: a canonical, fully-qualified template plus
  progressive-omission rules for simplifying it to something pragmatic. Use when naming a
  domain event or command, designing an event-sourced or CQRS system, reviewing event names
  in a diff or PR, deciding whether an event needs an actor (`By`) or trigger (`Via`)
  qualifier, resolving inconsistent event names across bounded contexts, naming a policy or
  event/command handler, or versioning an event whose contract changed.
---

# craft-event-naming

## Precedence

Defaults, not supremacy:

1. **A bound repo's own law wins inside its boundaries** (`AGENTS.CORE.md`, bind law) — read
   its `AGENTS.md` and any existing event/command naming convention before applying anything
   here.
2. **This workflow's overlay wins over these defaults** — if
   `.agents/craft/craft-event-naming.local.md` exists, read it; where it conflicts with this
   file, it wins. That file is where a derivation records *its* execution-context vocabulary
   and *its* standardized omissions — instance data, not method.
3. **Where both are silent, everything below applies in full force.**

Hedged once, here. The rest of this file is imperative on purpose.

## The canonical templates

Event (past tense — something that happened):

`[Resource][TransitiveVerb][In][ExecutionContext][From][Source][By][Actor][Via][Trigger]`

Command (imperative — a request to make something happen):

`[ImperativeVerb][Resource][In][ExecutionContext][From][Source][By][Actor][Via][Trigger]`

Both share the same four qualifier slots (`In`, `From`, `By`, `Via`) and the same
simplification machinery below. Full part-by-part description, the command template's worked
example, the command→event mapping, and handler naming are in
[references/command-event-handlers.md](references/command-event-handlers.md).

## Method: iterate every part, then simplify

1. **Walk every part in order, in full**, even parts you expect to drop. The canonical,
   fully-qualified name comes first, always — do not shortcut straight to a guessed
   simplification.
2. **Apply progressive omission**, one part at a time, only when a part is redundant or
   obvious in context. Never omit for brevity alone — every omission must be recoverable: a
   reader who knows the domain can reconstruct the dropped part from what remains.
3. **Stop simplifying the moment an omission would cost real information** — ambiguity between
   two otherwise-identical names is disqualifying.

## The decision rule, per part

| Part | Keep when | Omit when |
| --- | --- | --- |
| `In[ExecutionContext]` | The action occurs in a **named external system**, not this domain | The action occurs in this domain — the default context, assumed for every internal event |
| `From[Source]` | The data's origin differs from the execution context, or matters for tracing/debugging | The source is the same domain the event is already scoped to (rare — usually the most durable, load-bearing qualifier) |
| `By[Actor]` | Actor is a human, an external system, or audit/cross-team visibility requires it | Actor is the single obvious internal agent for this event type (a specific background service, a handler that is the only emitter) |
| `Via[Trigger]` | The trigger mechanism changes semantics — timing (real-time vs batch), routing, retry/SLA behavior | The trigger is the unremarkable default for that actor (a sync job's background trigger, a UI action's click) |

Full tables, the worked progressive-omission walkthrough
(`UserUpdatedInOurSystemFromIamBySyncServiceViaBackgroundJob` →
`UserUpdatedFromIam`), and further examples:
[references/omission-rules.md](references/omission-rules.md).

## Beyond the omission rules

- **Cross-bounded-context naming** — which side names the event, and how `From`/`In` resolve
  when producer and consumer disagree on "this domain".
- **Versioning a changed contract** — when to suffix a version vs. evolve additively.

Both are extensions past the source doctrine this skill derives from; see
[references/extensions.md](references/extensions.md) and treat them as guidance, not settled
law — record a derivation's actual answer in the overlay once it has one.

## Overlay

This skill reads `.agents/craft/craft-event-naming.local.md` on invocation if present. That
file is where a derivation writes what this skill cannot know on its own: its actual
execution-context names (`InIam`, `InOnboarding`, …), which actors and triggers it has
standardized as omittable, and any cross-context or versioning conventions it has settled on.
Where the overlay conflicts with this file, the overlay wins.

## Related

- `craft-code-quality` — domain events are part of its observability mandate (explicit, in
  ubiquitous language, versioned when contracts evolve); this skill is the naming method for
  satisfying that requirement, and for the commands that produce those events.
