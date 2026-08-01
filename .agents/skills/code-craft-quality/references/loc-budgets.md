# LOC budgets and static analysis — reference numbers

*Read this file only when you need the concrete per-language numbers. The parent
SKILL.md carries the principle and the duty to check them; this file carries the
numbers themselves.*

## Authority and scope — read this first

These are **defaults that apply where the substrate declares no limits of its own.**
A workflow operates on substrate repos it does not own; the governing constitution
(`AGENTS.CORE.md`) is explicit that a bound repo's own law wins inside that repo's
boundaries. LOC budgets and lint rules are exactly that kind of law. Sequence:

1. **Check for the substrate's own config first.** Any of these present in the repo
   overrides the tables below — read it, do not assume:
   - `.eslintrc*`, `eslint.config.*` (TS/JS)
   - `.golangci.yml` (Go)
   - `pyproject.toml` / `ruff.toml` / `.pylintrc` (Python)
   - `.rubocop.yml` (Ruby)
   - `.swiftlint.yml` (Swift)
   - `detekt.yml` (Kotlin)
   - `.editorconfig`, Roslyn ruleset / `.editorconfig` severities (C#/.NET)
2. **If none exists, the tables below are the applicable defaults.** Apply them the
   same as if the repo had declared them.
3. **Never install tooling into a repo uninvited.** Wiring lint/static-analysis config
   is the repo owner's decision. Detect → apply-or-surface:
   - Locate the repo's lint setup and run it; its rules are the rules.
   - If absent, surface the gap and propose wiring it. Do not silently write unlinted
     code, and do not install tooling without being asked.
   - Exception: in repos the workflow itself owns, missing lint config is a blocker —
     wire it before feature work.
   - If the repo is far enough from these numbers that turning them on would fail
     everywhere, do not skip them and do not weaken them — ratchet toward them. See
     [ratchet.md](ratchet.md).
4. **Crossing a hard max is never something to silently produce.** If circumstances
   force it, flag it explicitly as a violation with a decomposition plan — do not
   just write the file and move on.
5. **Crossing a soft max requires** an explicit rationale and a follow-up
   decomposition plan, stated where the work is reviewed (PR description, commit body,
   or equivalent).
6. **New work must not increase an over-limit file** without extracting at least one
   coherent slice out of it.
7. **Exceptions** (rare, explicit): generated code, migration snapshots, protocol
   schemas, framework-mandated glue.

## Measurement rules

- Budgets apply to **logical LOC** — exclude blank lines and comment-only lines.
- For wrapped fluent chains, object literals, and markup attributes: count logical
  statements, not formatter artifacts (a chain reformatted across 10 lines by a
  formatter is still the statements it contains, not 10 LOC).

## Industry baseline reference points

For calibration only — the project policy below is deliberately stricter.

| Tool | Rule | Default |
|---|---|---|
| ESLint | `max-lines-per-function` | 50 |
| ESLint | `max-lines` | 300 (docs cite common guidance of 100-500) |
| SwiftLint | `function_body_length` | warning 50, error 100 |
| golangci-lint | `funlen` | 60 lines, 40 statements |
| RuboCop | `Metrics/MethodLength` | 10 |
| .NET analyzer | `CA1502` (cyclomatic complexity) | 25 |

## Project policy (defaults, stricter than baselines)

Function/method and file LOC budgets, applied where the substrate has no config of
its own (see Authority and scope above). These are intentionally stricter than the
baselines above, and exist to **force decomposition early** — while a split is still
cheap — rather than to describe what existing code happens to measure.

| Language | Function/method soft | Function/method hard | File soft | File hard |
|---|---|---|---|---|
| C# / .NET | 50 | 75 | 150 | 250 |
| Go | 40 | 60 | 150 | 250 |
| TypeScript / JavaScript | 35 | 55 | 140 | 220 |
| Python | 30 | 50 | 130 | 220 |
| Ruby | 20 | 35 | 120 | 200 |
| Swift | 40 | 75 | 150 | 250 |
| Kotlin / Java | 40 | 70 | 150 | 250 |

## Markup-integrated files (JSX/TSX/Razor/Vue/Svelte)

These files are prone to artificial bloat from formatting and declarative markup.

- Split container logic, view-model mapping, and presentational markup into separate
  units.
- Component/controller logic keeps the host-language budget (TS/JS/C#) unchanged —
  no special allowance for logic just because it sits in a markup-integrated file.
- Markup templates may exceed host-language line counts only when logic is already
  extracted out of them.
- If a markup-integrated file exceeds **220 logical LOC**, split by component
  boundary.
- Never hide excessive logic in template expressions to bypass function limits.

## Required tooling by language

Applies once a language's lint setup is being wired (see step 3 above) — this is
what "wired" means for each language, again subject to overrides already present in
the substrate.

| Language | Required tooling |
|---|---|
| C# / .NET | Roslyn analyzers, `dotnet format`, severity rules in `.editorconfig`; prefer analyzer-backed LOC/complexity rules where available |
| TypeScript / JavaScript | ESLint (with TypeScript support where relevant), Prettier, strict TypeScript checks |
| Go | `golangci-lint` with `funlen`, complexity, duplication, and error-handling linters enabled |
| Python | Ruff (or Pylint + Black + isort when Ruff is not viable), rule set committed to repo |
| Ruby | RuboCop with Metrics cops enabled and configured |
| Swift | SwiftLint with function/file size and complexity rules enabled |
| Kotlin / Java | Detekt/ktlint (Kotlin) and Checkstyle/PMD/SpotBugs (Java) as applicable |

## Minimum rule mapping

The specific rule each language's lint setup must enforce, once wired.

| Language | Rules to enforce |
|---|---|
| C# / .NET | Complexity (`CA1502`); analyzer warnings configured as policy violations treated as errors |
| TypeScript / JavaScript | `max-lines-per-function` and `max-lines`, with logical-line options |
| Go | `funlen` line/statement limits; complexity (`gocognit`/`cyclop`) |
| Python | Function and module size plus complexity, through Ruff/Pylint config |
| Ruby | `Metrics/MethodLength`; class/module length cops |
| Swift | `function_body_length` and related complexity rules |
| Kotlin / Java | Function length and complexity via Detekt/PMD/Checkstyle |

## Enforcement topology

Where the substrate is being wired for lint (step 3, missing-config case), or where
the workflow owns the repo (step 3 exception):

- Run linters pre-commit or pre-push for fast feedback.
- Run the full lint/static-analysis suite in CI on every PR.
- Keep configuration in version control; pin tool versions for reproducibility.
- Map language-specific rules to the LOC budgets above explicitly in that config.
- If a tool cannot express a policy directly, enforce via custom rules/scripts in CI.
