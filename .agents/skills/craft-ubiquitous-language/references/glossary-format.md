# Glossary format

One file, one bounded context, alphabetical. Flat — no nesting, no categories. A reader
looking up a word must find it in one step.

## Entry shape

```markdown
### <Term>

<What it is, in one or two sentences. Present tense. No hedging.>

**Is not:** <the near-synonym or adjacent concept it is confused with, and why they
differ.> *(Only where the confusion has actually cost time. Omit otherwise.)*

**In code:** `<TypeName>`, `<eventName>` — where the term appears, so a reader can go
from the word to the thing.
```

## Worked examples

```markdown
### Sticky

A single element placed on a board: an event, a command, an actor, a policy, a read
model, or a system. The unit a person drags.

**Is not:** an *element* of the compiled definition. A sticky carries canvas position
and draft state; an element carries neither. The compiler turns the first into the
second and discards the rest.

**In code:** `Sticky`, `PolicySticky` (`src/ui/board/`), `ElementId` (`src/domain/`)

### Deferred policy

A policy whose command is issued after a delay rather than on the triggering event.

**Is not:** a *scheduled* command. A schedule fires on a cadence with no triggering
event; a deferred policy always has one, and carries its causation forward.

**In code:** `PolicyDef.delay`, `PolicyRunResult.deferred` (`src/domain/`, `src/engine/`)
```

## Rules the format enforces

- **Definitions, not descriptions.** "A sticky is a single element placed on a board" is
  a definition. "Stickies are how users interact with the board" is a description and
  settles nothing.
- **`Is not:` earns its place.** Add it the first time two people, or two sessions, use
  the words interchangeably. Not before — a glossary padded with hypothetical confusions
  is skimmed instead of read.
- **`In code:` is a pointer, not an inventory.** One or two identifiers so the reader can
  jump. Do not list every usage; that list rots.
- **No status fields.** A term is in the glossary or it is not. "Proposed", "deprecated",
  and "draft" turn a source of truth into a discussion.

## Starting one for an application that has none

Do not write the whole glossary. Write the terms that have already caused a
misunderstanding, and add each new term as it enters the code. A glossary produced in one
sitting from an existing codebase records the code's vocabulary, which is the thing the
glossary was supposed to correct.
