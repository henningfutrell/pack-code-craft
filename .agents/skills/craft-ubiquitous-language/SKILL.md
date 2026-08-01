---
name: craft-ubiquitous-language
description: Ubiquitous language doctrine for DDD work — the glossary as the single source of a domain's terms, one language per bounded context, and the rules for keeping code, tests, events, and UI in step with it. Use when starting or reviewing a domain model, naming a type or module, adding a term to a codebase, renaming a domain concept, finding two words for one idea or one word for two, deciding whether a word belongs to the domain or the infrastructure, or setting up a glossary for an application that has none.
---

# craft-ubiquitous-language

**Precedence.** A bound repo's own law wins inside its boundaries. Then this workflow's
overlay at `.agents/craft/craft-ubiquitous-language.local.md`. Then these defaults, in
full force wherever the first two are silent. Where a repo has a standard, detect it and
apply it; where it has none, say so as a finding. Never proceed as though a missing
standard did not matter.

**This governs the workflow repo too**, not only the substrate it stewards. The system's
own terms are in `GLOSSARY.md`; a derivation's are in `GLOSSARY.local.md` at its root.
See `AGENTS.CORE.md` "DDD, applied to a workflow repo".

## The rule

**One language, shared by the domain experts and the code, bounded by one context.**

The domain's words are the code's words. A concept named one thing in conversation and
another in a type is two concepts as far as the code is concerned, and the gap is where
defects live. Translation between the domain and the model is not a service the code
performs. It is a defect the code carries.

## The glossary

Every application under DDD keeps a glossary. It is the single source of its terms.

- **It lives in the repo it governs** — `docs/glossary.md` in an application, unless that
  repo's law says otherwise; `GLOSSARY.local.md` at a workflow repo's root. The code must
  obey it, so it sits with the code. A glossary kept outside the repo it governs drifts
  within one session.
- **One glossary per bounded context.** The same word in two contexts is two entries, in
  two glossaries. Never one compromise definition that fits neither.
- **A term enters when it enters the code**, not afterward. A pull request that
  introduces a domain word and no glossary entry is incomplete.
- **Entries are definitions, not descriptions.** State what the term *is*, what it is
  not, and — where the distinction has cost time — the near-synonym it is not.

Format and worked examples: `references/glossary-format.md`.

## Propagation

A term's spelling is the same everywhere it appears:

| Surface | Obeys the glossary |
|---------|--------------------|
| Types, classes, modules, files | yes |
| Domain events and commands | yes — via `/craft-event-naming` |
| Test names and fixtures | yes |
| API fields, wire contracts | yes |
| UI copy | yes, unless the repo's law states a separate product vocabulary |
| Infrastructure and framework vocabulary | no — not domain language |

**A rename is one change.** Glossary, code, tests, events, and UI move together. A rename
landed in the code and deferred in the glossary has created a second language.

## Drift

Two directions, both reportable:

- **A domain word in the code with no glossary entry** — the language grew without being
  agreed. Add the entry, or rename the code to a term that exists.
- **A glossary entry with no code** — the term is aspirational or dead. Say which. A
  glossary that accumulates unused words stops being trusted, and an untrusted glossary
  is not a source of truth.

Surface both as findings. Do not silently reconcile: which side is wrong is a domain
decision, not an editorial one.

## What this refuses

- **Synonyms "for readability".** Two words for one concept is the failure this doctrine
  exists to prevent.
- **"We will align the names later."** Later is a rename across every surface above.
- **Technical vocabulary in the glossary.** `Repository`, `cache`, `handler` are how the
  solution is built, not what the domain means.
