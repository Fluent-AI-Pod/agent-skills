---
name: critique-spec
description: >
  Reviews an existing product spec and returns a scored, annotated critique with
  specific improvement suggestions. Use when a PM wants a second opinion on a spec
  before it goes to stakeholders or dev, says "can you review this", "does this look
  solid", "what am I missing", or pastes a spec and asks if it's ready — even if they
  don't use the word "critique". Also triggers when a spec is about to feed a ticket
  generation pipeline and the PM wants to sanity-check it first. Do NOT use for
  creating a spec from scratch (use create-spec), generating tickets (use ticket
  generation skill), or reviewing code or designs.
---

# critique-spec

Takes an existing product spec and returns a structured critique: a section-by-section
score, specific annotations on what is weak or missing, a list of the highest-risk
issues, and an optional revised draft incorporating the suggested fixes.

This is a **context-dump skill** — the PM provides the spec as input and the skill
returns an annotated critique without a conversational warm-up. It runs four passes in
sequence: gap analysis, edge-case coverage, measurability, and testability. It then
scores each section 0–3 and produces a prioritised fix list.

---

## When to use

- The PM has a draft spec and wants a second opinion before sharing with stakeholders
- A spec is about to feed ticket generation and needs a final sanity check
- A spec has been revised and the PM wants to verify the gaps from the last review
  are closed
- A spec came from someone else and the PM wants an independent read

## When NOT to use

- There is no spec yet → use `create-spec` to build one from scratch
- The spec is approved and tickets need generating → use the ticket generation skill
- The request is about code, designs, or strategy documents → use a different skill

---

## Input

The PM provides the spec in one of three ways:

1. Pastes it directly into the chat
2. References a file path (e.g. `docs/product/specs/feature-name.md`)
3. References a file by name and asks the skill to find it

If a file path is given, read the file before proceeding. If the file does not exist,
tell the PM and ask them to provide the content directly.

Also read the following context files if they exist, before running the critique:

- `docs/product/personas.md` — to verify persona references in the spec
- `docs/product/strategy.md` — to check alignment with product direction
- `CLAUDE.md` — to cross-reference technical constraints

---

## Four critique passes

Run all four passes internally before producing output. Do not show intermediate
workings — produce the final critique report only.

---

### Pass 1 — Gap analysis

Check each required section against the quality criteria below.

**Hard-numeric rules — flag any violation:**

| Rule                  | Threshold                    |
| --------------------- | ---------------------------- |
| Problem statement     | Exactly 1 sentence           |
| Out-of-scope items    | ≥2 explicit items            |
| Acceptance criteria   | 3–6 total                    |
| Assumptions           | ≥1 stated                    |
| Open questions        | 0–5 max                      |
| Technical constraints | ≥1 named, or explicit "none" |

**Per-section quality criteria:**

**Problem & purpose**

- Problem stated in one sentence
- "Why now" is present and specific (not just "users asked for it")
- Business or user outcome is named, not just the feature

**Users**

- Persona names match those in `personas.md` (or are clearly defined if no file exists)
- Current pain or workaround is described
- Edge-case users or non-users are considered

**Scope**

- In-scope items are listed
- ≥2 out-of-scope items are listed (even obvious ones)
- Phasing is clear if this is part of a larger initiative
- Vertical slice check is answered: what can a user do after this ships?

**Acceptance criteria**

- Numbered AC-1 through AC-N
- Each is independently testable without human interpretation
- Written in GIVEN/WHEN/THEN or as unambiguous boolean checks
- At least one unhappy path is covered (error, failure, empty state)
- None are vague enough to pass multiple interpretations

**Assumptions**

- ≥1 held belief is stated explicitly
- The riskiest assumption is identifiable

**Technical notes**

- ≥1 constraint named, or explicit "no known constraints"
- No file paths or line numbers (these couple to current layout; describe
  modules and behaviours instead)

**Open questions**

- 0–5 questions
- Each is tagged or clearly differentiated by severity
- No 🔴 / blocking question is being silently assumed away

**Before you build section** (if present)

- Decisions made are listed
- Riskiest assumption is named
- Next step is specific (not "TBD")

---

### Pass 2 — Edge case coverage

For each acceptance criterion, ask: is there a corresponding edge case or failure mode
that is not covered? Common gaps to check:

- **Empty state** — what happens if there is no data, no results, or a first-time user?
- **Concurrent action** — what if two users act on the same record simultaneously?
- **Permission boundary** — what if the user lacks the required role or access?
- **Partial failure** — what if only part of an operation succeeds?
- **Input extremes** — very long text, zero, negative numbers, special characters
- **Offline / slow network** — if the feature touches async operations
- **Re-entry** — what if the user completes the flow a second time?

Flag any edge case that is entirely absent from the spec. Do not flag every possible
edge case — flag only the ones that could plausibly cause a production incident or
significant user confusion.

---

### Pass 3 — Measurability

Check whether the spec is measurable:

- Is there a success metric — even a proxy one? (e.g. "adoption by X% of active users
  within 30 days of launch")
- Is the "why now" backed by a number, a trend, or a strategic trigger — or is it just
  a narrative?
- Are any of the acceptance criteria measurable post-launch? (e.g. "error rate stays
  below 1%" rather than "errors are handled gracefully")
- Is there a way to know, 60 days after launch, whether this feature succeeded?

Flag: missing success metric, vague "why now", unmeasurable ACs, no definition of done
beyond shipping.

Note: a spec does not need full instrumentation design to pass this check. The bar is
that someone reading the spec could write a dashboard for it.

---

### Pass 4 — Testability

Check whether a QA engineer or developer could write tests from this spec alone:

- Can each AC be expressed as a test case title? (If yes, it's testable. If the title
  would need qualification, it's ambiguous.)
- Are the GIVEN conditions specific enough to set up in a test environment?
- Is the WHEN action unambiguous — one clear trigger?
- Is the THEN outcome verifiable without subjective interpretation?
- Are there ACs that require "the system behaves reasonably" or "the user is not
  confused" — these are not testable and must be rewritten.

Flag: ACs that cannot be automated, outcomes that require human judgment, preconditions
that cannot be reproduced in a test environment.

---

## Scoring

Score each section 0–3:

| Score | Meaning                                                           |
| ----- | ----------------------------------------------------------------- |
| **3** | Solid — specific, independently verifiable, passes all criteria   |
| **2** | Adequate — present and usable, minor gaps only                    |
| **1** | Weak — present but too vague, incomplete, or missing key elements |
| **0** | Missing or unusable — blocks build or ticket generation           |

| Section             | Max    | Score | Notes |
| ------------------- | ------ | ----- | ----- |
| Problem & purpose   | 3      |       |       |
| Why now             | 3      |       |       |
| Users               | 3      |       |       |
| Scope               | 3      |       |       |
| Acceptance criteria | 3      |       |       |
| Assumptions         | 3      |       |       |
| Technical notes     | 3      |       |       |
| Open questions      | 3      |       |       |
| **Total**           | **24** |       |       |

**Thresholds:**

- **20–24** — Ready for stakeholders and ticket generation
- **14–19** — Needs targeted fixes before handoff; see priority fix list
- **Below 14** — Substantial rework needed; recommend returning to `create-spec`

---

## Output format

Produce the critique report in the following structure. Do not show the four passes
as separate sections — synthesise findings into the report.

```markdown
# Spec critique: [Feature name]

Reviewed: [date]
File: [path if applicable, otherwise "provided inline"]
Overall score: [N]/24 — [Ready / Needs fixes / Substantial rework]

---

## Summary

[2–4 sentences. What is the spec trying to do? What is its overall quality?
What is the single most important thing to fix before this goes anywhere?]

---

## Section scores

| Section             | Score | Headline finding |
| ------------------- | ----- | ---------------- |
| Problem & purpose   | /3    | [One phrase]     |
| Why now             | /3    | [One phrase]     |
| Users               | /3    | [One phrase]     |
| Scope               | /3    | [One phrase]     |
| Acceptance criteria | /3    | [One phrase]     |
| Assumptions         | /3    | [One phrase]     |
| Technical notes     | /3    | [One phrase]     |
| Open questions      | /3    | [One phrase]     |

---

## Priority fix list

[Ordered by severity. Address these before the spec goes to stakeholders or dev.
Each item names the section, states what is wrong, and gives a specific fix suggestion.]

### 🔴 Must fix (blocks build or stakeholder sign-off)

**[Section]: [What is wrong]**
Suggestion: [Specific rewrite or addition — ideally a complete sentence or AC the PM
can drop in directly]

### 🟡 Should fix (weakens spec quality or ticket accuracy)

**[Section]: [What is wrong]**
Suggestion: [Specific improvement]

### 🟢 Nice to fix (minor gaps, low risk)

**[Section]: [What is wrong]**
Suggestion: [Quick improvement]

---

## Edge case gaps

[List only the edge cases whose absence is a genuine production risk or would cause
significant user confusion. For each, suggest where in the spec it should be added —
usually as an additional AC.]

- **[Edge case]** — missing from ACs. Suggest adding:
  AC-[N+1]: GIVEN [setup] / WHEN [action] / THEN [outcome]

---

## Testability issues

[List ACs that cannot be tested as written. Provide a rewrite for each.]

- **AC-[N]** as written requires subjective judgment ("the user is not confused").
  Suggested rewrite:
  GIVEN [specific precondition]
  WHEN [specific action]
  THEN [verifiable outcome]

---

## Missing success metric

[If no success metric exists, flag it and suggest one.]
Suggested metric: [e.g. "X% of [persona] complete the flow without hitting an error
state within 30 days of launch"]

---

## Revised draft (optional)

[Only include if the PM asked for a revised version, or if the score is below 14 and
a full redraft would be faster than a fix list.]
```

---

## After the critique

If the PM asks for a revised draft based on the critique findings, produce one using
the `create-spec` spec template format.

If the PM confirms the spec is ready after fixes, confirm:

> "This spec looks solid. Next step: run the ticket generation skill against
> `docs/product/specs/[feature-name].md`."

If the spec is below 14/24, recommend:

> "This spec has enough gaps that a redraft is likely faster than targeted fixes.
> Want to run `create-spec` and use the existing content as a starting point?"

---

## Quality gate — do not mark a spec as ready if:

- Any AC cannot be expressed as an unambiguous test case
- Fewer than 2 items are listed as out of scope
- More than 5 open questions remain
- A 🔴 open question would block implementation
- No persona is identified
- The "why now" is absent or generic
- Score is below 20/24

---

## Notes on tone

- **Be specific.** "AC-2 cannot be tested because 'loads correctly' has no pass/fail
  criterion" is useful. "The acceptance criteria could be clearer" is not.
- **Be constructive.** Every flagged issue should come with a concrete fix suggestion,
  not just an observation.
- **Be honest about severity.** Not every gap is a blocker. Distinguish clearly between
  what must be fixed and what is a nice-to-have.
- **Respect the PM's judgment.** The spec is theirs. The critique surfaces blind spots —
  it does not rewrite the spec without being asked.
