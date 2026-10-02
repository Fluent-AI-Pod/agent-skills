---
name: evaluate-skill
description: Evaluates a Claude skill against Anthropic's skill-building best practices and returns a scored, criterion-by-criterion critique with concrete fixes and generated triggering tests. Use when the user asks to review, score, critique, lint, or improve a skill, points at a SKILL.md, asks "is this skill good" or "is it ready to publish", or before adding a skill to the marketplace.
---

# Evaluate Skill

Reviews a target skill against the rubric in `references/rubric.md` (derived from
Anthropic's *Complete Guide to Building Skills for Claude*) and reports exactly what to
fix before publishing.

## Instructions

### Step 1 - Locate the target skill

Identify the skill directory to evaluate (the folder containing its `SKILL.md`). If the
user has not named one, ask which skill before continuing.

### Step 2 - Run the deterministic checks

Run the bundled linter and treat its output as ground truth - do not re-judge these by eye:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/evaluate-skill/scripts/lint-skill.mjs" <skill-directory>
```

It reports PASS/WARN/FAIL for the mechanical rules: folder naming, `SKILL.md` spelling,
frontmatter delimiters, `name`, `description` length + XML tags + trigger phrasing,
absence of `README.md`, and the SKILL.md word count.

### Step 3 - Judge the qualitative criteria

Read `references/rubric.md` and assess what the script cannot: description specificity and
trigger quality, instruction actionability, error handling, examples, and progressive
disclosure. Quote the skill to justify each verdict.

### Step 4 - Report

Produce, in order:

1. **Findings table** - `Criterion | PASS/WARN/FAIL | Finding | Fix`. Merge the linter's
   deterministic rows with your qualitative rows.
2. **Verdict** - one of: *Ready to publish* / *Needs work* / *Not ready*.
3. **Generated triggering tests** - 3 should-trigger queries (include one paraphrase) and
   3 should-NOT-trigger queries, derived from the skill's stated purpose. These feed the
   marketplace's triggering eval.

## Rules

- Every WARN/FAIL must carry a specific, actionable fix - quote the offending line and give
  the replacement.
- Do not inflate verdicts: a vague description ("Helps with projects") is a FAIL, not a WARN.
- Judge against the rubric only; do not invent criteria.
