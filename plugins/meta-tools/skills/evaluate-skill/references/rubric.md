# Skill evaluation rubric

Criteria from Anthropic's *Complete Guide to Building Skills for Claude*. The bundled
`scripts/lint-skill.mjs` covers the deterministic rows; judge the qualitative rows yourself.

## Deterministic (the linter checks these)

| Criterion    | Rule                                                          |
| ------------ | ------------------------------------------------------------ |
| Folder name  | kebab-case, no spaces / underscores / capitals               |
| SKILL.md     | named exactly `SKILL.md` (case-sensitive)                    |
| Frontmatter  | `---` delimiters, valid YAML                                  |
| `name`       | kebab-case, matches folder, no `claude` / `anthropic`        |
| `description`| present, under 1024 chars, no `<`/`>`, states WHEN to use    |
| README       | no `README.md` inside the skill folder                       |
| Size         | SKILL.md under 5000 words (move detail to `references/`)      |

## Qualitative (you judge these)

**Description quality** - the single most important field.

- States BOTH what it does AND when to use it, with real trigger phrases users would say.
- Names relevant file types if applicable.
- Adds negative triggers if it risks over-triggering ("Do NOT use for ...").
- Specific, not generic.

Good:

> Analyzes Figma design files and generates developer handoff documentation. Use when the
> user uploads .fig files, asks for "design specs", "component documentation", or
> "design-to-code handoff".

Bad:

> Helps with projects.   (too vague - no triggers, no specifics)

**Instructions**

- Specific and actionable: concrete commands, not "validate the data properly".
- Critical rules near the top; use `## Important` / `## Critical` where it matters.
- Includes error handling / troubleshooting (Error / Cause / Solution).
- Provides examples (User says -> Actions -> Result).

**Structure / progressive disclosure**

- SKILL.md stays focused on core instructions; detail lives in `references/`.
- Composable: does not assume it is the only skill loaded.

## Triggering tests to generate

From the skill's stated purpose, produce:

- 3 **should-trigger** queries (include at least one paraphrase).
- 3 **should-NOT-trigger** queries (adjacent topics it must stay out of).

These become the skill's triggering eval (positive / negative fixtures).

## Verdict

- **Ready to publish** - no FAILs; description strong; has examples + error handling.
- **Needs work** - no FAILs but qualitative gaps (weak triggers, no examples).
- **Not ready** - any deterministic FAIL.
