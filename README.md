# pack-craft — engineering doctrine, as a pack

Four skills a workflow repo composes in when it wants opinions about how code is
written. Install:

```sh
.agents/skills/workflow-template-sync/template-sync.sh add <this-repo>
```

Remove it and the workflow repo still works. Nothing in the core depends on this pack —
that is the point of it being one.

| Skill | What it carries |
|---|---|
| `/craft-tdd` | test-first protocol: failing test first, integration focus, seams at unmanaged dependencies, never mock business logic |
| `/craft-code-quality` | module size budgets, mandatory lint/static analysis, ports and adapters, pragmatic SOLID/DDD, no implicit fallbacks, required observability, and the ratchet for substrate that starts nowhere near any of it |
| `/craft-event-naming` | canonical event/command naming and progressive omission |
| `/craft-ubiquitous-language` | the glossary as a domain's single source of terms |

## Precedence

Every skill here declares the same ladder, and it is not decorative:

1. **A bound repo's own law wins inside its boundaries.** A pack never claims authority
   over substrate it does not own.
2. **Then the workflow's overlay**, `.agents/craft/<skill-name>.local.md` — unmanaged,
   committed by the workflow repo, never touched by an update. Where the overlay
   conflicts with the skill, the overlay wins.
3. **Then the skill's defaults**, in full force only where the first two are silent.

## Contributing back

Fix doctrine here, bump `version:` in `pack.yaml`, and every workflow repo picks it up
on its next `template-sync.sh update`. A correction made inside an installed copy is
drift: it is overwritten on the next update.
