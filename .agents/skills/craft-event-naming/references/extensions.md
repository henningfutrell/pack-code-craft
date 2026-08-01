# Extensions beyond the source doctrine

*Read this when naming an event that crosses a bounded-context boundary, or when a contract
change forces a decision about versioning an event name. Both topics are thin or absent in the
doctrine this skill derives from — treat this file as reasoned guidance, not settled law, and
record a derivation's actual answer in `.agents/craft/craft-event-naming.local.md` once it has
one.*

## Cross-bounded-context event naming

The base template assumes a single vantage point: "this domain" is implicit, and `In`/`From`
are named only when they diverge from it. Crossing a bounded-context boundary breaks that
assumption — producer and consumer disagree about what "this domain" means.

- **The producer names the event from its own vantage point**, not the consumer's. An event
  published by IAM is `UserCreated` (or `UserCreatedFromOnboarding` if the data source is
  worth calling out), never `UserCreatedInIam` on IAM's own topic — `InIam` would be redundant
  in the context that *is* IAM.
- **The consumer does not rename the event.** A downstream context subscribing to IAM's
  `UserCreated` does not relabel it `UserCreatedInIam` locally; that reintroduces exactly the
  ambiguity the template exists to avoid — a name that means different things depending on
  which side reads it. If the consumer needs to disambiguate multiple upstream sources of a
  same-named event, that disambiguation belongs in the subscription/routing key or the
  handler's own naming (`command-event-handlers.md`), not in a second, locally-renamed copy of
  the event name.
- **`From[Source]` becomes load-bearing at the boundary.** Once an event is consumed outside
  its producing context, the consumer usually cannot omit `From` even where the producer could
  — the consumer's "this domain" is not the producer's, so the omission rule's default no
  longer holds for the consumer's own derived events (e.g. a local `UserProvisionedFromIam`
  triggered by the upstream `UserCreated`).
- **Shared/canonical event schemas** (a schema registry, a shared contracts package) should
  carry the producer's name verbatim. Translating names at contract boundaries defeats the
  purpose of a shared contract.

## Versioning an event name

The template has no built-in version slot, and none should be added routinely — most contract
evolution should be additive and backward-compatible (new optional fields, widened enums),
which needs no name change at all.

Version the *name* only when the change is breaking enough that old and new consumers cannot
share a name without one of them misinterpreting the payload:

- **Prefer schema versioning over name versioning** where the transport supports it (a version
  field in the envelope, a schema registry with compatibility modes). This keeps the semantic
  name (`UserUpdatedFromIam`) stable and lets infrastructure carry the version.
- **Suffix the name with a version only when the transport has no other place to put it**, and
  only for the breaking version onward — the original name is never retroactively renamed
  `V1`. Example: `UserUpdatedFromIam` (implicit v1) and `UserUpdatedFromIamV2` once a breaking
  shape change ships, both live simultaneously during migration.
- **A version bump is not a reason to re-run the omission analysis.** If `BySyncService` was
  correctly omitted in v1, it stays omitted in v2 unless the *reason* for omitting it changed
  (a new actor now emits the same event) — the version and the simplification decision are
  independent axes.
- **Retire, don't silently drop.** When the old version's consumers are gone, remove the
  producer's old-name emission as its own deliberate change, not as a side effect of the
  version bump.
