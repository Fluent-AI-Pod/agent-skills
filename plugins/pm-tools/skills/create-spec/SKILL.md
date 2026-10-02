---
name: create-spec
description: >
  Shapes a rough feature idea, meeting notes, or brief into a structured product spec
  ready for stakeholder review and ticket generation. Use when a PM mentions a feature
  they want to build, says "let's spec this up", shares meeting notes or a Slack thread
  about a new idea, or has an existing draft they want to sharpen — even if they don't
  explicitly say "spec" or "PRD". Also triggers on: "I've been thinking about a feature
  where...", "we need to build X", "can you help me think through Y", or any description
  of user pain that implies a build response. Do NOT use for retrospectives, strategy
  decks, OKR setting, bug reports, or ticket generation from an existing spec.
---

# create-spec

Shapes a feature idea into a well-formed product spec, ready for stakeholder review and
the ticket generation pipeline. Works conversationally with the PM, reads product context
docs, asks targeted questions to fill gaps, scores the spec against a quality rubric, and
writes the final file to `docs/product/specs/[feature-name].md`.

---

## When to use

- A PM has a rough idea, meeting notes, a Slack thread, or a feature name
- An existing draft needs sharpening before it goes to dev
- A stakeholder has described user pain and wants it turned into a build plan

## When NOT to use

- The spec already exists and needs reviewing → use `critique-spec` instead
- Tickets need generating from an approved spec → use the ticket generation skill
- The request is strategic (vision, roadmap, OKRs) → use `product-strategy`
- The request is a bug report or chore

---

## Step 1 — Orient

Read the following context files in full before asking anything:

- `docs/product/strategy.md` — what the product is, who it's for, how it's differentiated
- `docs/product/personas.md` — the actual users and their capabilities
- `CLAUDE.md` — architecture, conventions, technical constraints
- `docs/ticket-creation-context.md` — the service layer, data model, and vocabulary

Also check if `docs/iterations/current.md` exists. If it does, read it for awareness of
work currently in flight — not to constrain the spec, but to flag dependencies or
conflicts. Specs are forward-looking; the current iteration is background context only.

Note which files are missing and continue with whatever context is available.

Then ask the PM: **"What are we speccing up?"**

Accept their answer in any form — a rough idea, meeting notes, a feature name, a
paragraph. Do not ask for more at this stage.

---

## Step 2 — Frame check (internal, do not show)

Before gap analysis, silently assess the proposed shape of the spec and present a
brief structural framing to the PM:

> "Before we dive in — here's how I'm thinking about the shape of this spec:
>
> - [Problem this solves in one phrase]
> - [Primary persona affected]
> - [Rough scope boundary]
> - [Any in-flight work this likely touches]
>
> Does that framing feel right, or is there a different angle you want to take?"

Wait for confirmation or correction before proceeding to gap analysis.

---

## Step 3 — Gap analysis (internal, do not show)

Silently assess what you have against every quality criterion below. Identify every gap.
Then group questions — ask no more than four at a time, ordered by importance. Never ask
for information you can reasonably infer from context.

**Hard-numeric rules — these are non-negotiable:**

- Problem statement: exactly 1 sentence
- Out-of-scope items: ≥2 explicit items (zero is never acceptable)
- Acceptance criteria: 3–6 total (more than 6 signals scope creep)
- Assumptions: ≥1 stated (a spec with zero assumptions is hiding something)
- Open questions: 0–5 max (more than 5 means the spec is not ready)
- Technical constraints: ≥1 named, or an explicit "no known constraints"

**Quality criteria a passing spec must meet:**

### Problem & purpose

- [ ] The problem being solved is stated in one sentence
- [ ] There is a clear "why now" — why this, at this point in the product
- [ ] The business or user outcome is named, not just the feature

### Users

- [ ] The persona(s) affected are identified using names from `personas.md`
- [ ] Their current pain or workaround is described
- [ ] Edge case users or non-users are noted where relevant

### Scope

- [ ] What is explicitly IN scope is listed
- [ ] ≥2 items are explicitly OUT of scope (even obvious ones)
- [ ] Phasing is clear if this is part of a larger initiative
- [ ] Vertical slice test: if this shipped alone, would a user observe value?
      If no, flag it as an enabler story — it needs different framing.

### Acceptance criteria

- [ ] 3–6 ACs numbered AC-1 through AC-N
- [ ] Each is independently testable without human interpretation
- [ ] Written in GIVEN/WHEN/THEN format (or unambiguous boolean checklist)
- [ ] At least one AC covers the unhappy path (error, failure, empty state)

### Technical & design

- [ ] ≥1 named technical constraint, or explicit "no known constraints"
- [ ] Any in-flight work this spec touches is flagged
- [ ] Figma designs exist, are planned, or are explicitly not needed
- [ ] Impact on existing flows is considered

### Assumptions

- [ ] ≥1 assumption is stated explicitly as a held belief
- [ ] The riskiest assumption is identifiable

### Open questions

- [ ] 0–5 questions max
- [ ] Each is tagged 🟢 / 🟡 / 🔴 by confidence (see below)
- [ ] Any 🔴 question is flagged — it may block the quality gate

---

## Step 4 — Conversational shaping

Ask grouped questions (max 4 per round). Wait for PM responses. After each round:

1. Update internal gap analysis
2. If gaps remain, ask the next most important group
3. If substantially complete, move to Step 5

Keep tone direct and collaborative. If the PM's answer reveals a new problem or
contradicts something earlier, name it. If scope is creeping, flag it. If a decision
is being assumed rather than made, surface it.

Suggest answers based on context docs where possible:

> "Based on `personas.md`, the primary user here is probably [X] — does that match your
> thinking?"

Do not write the spec file until Step 6.

---

## Step 5 — Quality score (internal, do not show)

Score each section 0–2 before drafting:

- **0** — Missing or too vague to act on
- **1** — Present but incomplete or ambiguous
- **2** — Clear, specific, independently verifiable

| Section             | Score   |
| ------------------- | ------- |
| Problem & purpose   | /2      |
| Users               | /2      |
| Scope               | /2      |
| Acceptance criteria | /2      |
| Technical notes     | /2      |
| Assumptions         | /2      |
| Open questions      | /2      |
| **Total**           | **/14** |

**If total < 10, return to Step 4.** Do not draft until score ≥ 10.

If the spec fails the quality gate, tell the PM which sections scored below 2 and why,
then continue the conversation.

---

## Step 6 — Draft and confirm

When score ≥ 10, say:

> "I think we have enough to write the spec. Let me draft it."

Write the spec using the template below. Write it as if the reader is a **competent
junior developer who has never seen this product area** — no abbreviations, no assumed
context, no internal jargon. If a term needs defining, define it inline.

Then say:

> "Here's the draft — read it as if you're a developer seeing this for the first time.
> Anything missing, wrong, or unclear?"

Incorporate feedback, then ask:

> "Happy to lock this? I'll write it to `docs/product/specs/[feature-name].md`."

On confirmation, write the file.

---

## Step 7 — Write the spec file

Write to `docs/product/specs/[feature-name].md` using kebab-case for the filename
(e.g. `docs/product/specs/unauthenticated-access.md`).

If a file already exists at that path, update it in place. Add a `Last updated:`
timestamp at the top.

Once tickets have been created from this spec, the file should be moved to
`docs/archive/specs/[feature-name].md` — either manually by the PM or by the ticket
generation skill after generating tickets.

---

## Spec template

```markdown
# [Feature name]

Last updated: [date]
Status: Draft | Ready | Ticketed
Tickets: (fill in once created, e.g. ABC-421, ABC-422)

---

## Problem statement

[One sentence: what problem does this solve and for whom]

## Why now

[Why this is the right thing to build at this point in the product — 2–3 sentences.
Weak answer: "users have been asking for it." Strong answer: names a specific trigger,
metric, or strategic moment.]

## Users affected

[Persona names from personas.md, with a brief note on how each is affected.
Include non-users or edge-case users if relevant.]

## Background

[Current situation, workaround, or pain point — 2–4 sentences. What does the user do
today? Why is that insufficient?]

---

## Scope

### In scope

- [Bullet list of what this spec covers]

### Out of scope

- [≥2 explicit exclusions — even obvious ones. "We are not building X" is useful.]

### Phasing (if applicable)

- Phase 1: [this spec]
- Phase 2: [future work, linked or described briefly]

### Vertical slice check

[One sentence: if this feature shipped alone with nothing else, what would a user be
able to do that they cannot do today? If the answer is "nothing yet", this is an
enabler story — flag it clearly.]

---

## Figma

[Link to designs, or "Designs to be created before build" / "No designs needed — reason"]

---

## Acceptance criteria

[Number each AC. The ticket generation skill will reference these by number (AC-1, AC-2…).
Include at least one unhappy path.]

**AC-1**
GIVEN [precondition]
WHEN [action]
THEN [expected outcome]

**AC-2**
GIVEN [precondition]
WHEN [action]
THEN [expected outcome]

**AC-3 (unhappy path)**
GIVEN [precondition — error state, empty state, or failure condition]
WHEN [action]
THEN [expected outcome — error message, fallback behaviour, or graceful degradation]

---

## Assumptions

[State each assumption as a held belief. If an assumption is wrong, the spec needs
revisiting. The riskiest one should be obvious.]

- [e.g., "Users are authenticated before reaching this flow"]
- [e.g., "The existing email service can handle transactional triggers without changes"]

---

## Technical notes

[≥1 named constraint or "No known technical constraints at time of writing."
Note affected services, components, or data model changes — briefly.
Developers will fill in detail during plan-review. Do not include file paths or
line numbers; describe modules, behaviours, and contracts instead.]

---

## Open questions

[0–5 questions max. More than 5 means this spec is not ready.
Tag each with confidence level — 🔴 items may block build.]

- 🔴 [Question that, if wrong, invalidates the spec] — owner if known
- 🟡 [Question with a working assumption we're proceeding on] — owner if known
- 🟢 [Question we know the answer to but are documenting] — owner if known

---

## Before you build

**Decisions made:**

- [Key scope or design decision locked in this spec]
- [e.g., "We will not support bulk actions in Phase 1"]

**Riskiest assumption:**
[Single sentence naming the one assumption most likely to cause a rework if wrong]

**Next step:**
[e.g., "Design review with [name] before tickets are created" /
"Ready for ticket generation — no blockers"]
```

---

## Quality gate — do not proceed to ticket generation if:

- Any AC cannot be written in GIVEN/WHEN/THEN or as an unambiguous boolean check
- Fewer than 2 items are listed as out of scope
- There are more than 5 open questions
- Any 🔴 open question would block implementation
- The "why now" is missing or is just "users asked for it"
- No persona is identified
- The vertical slice check is not answered
- Quality score is below 10/14

If the spec fails the gate, name which criteria failed and return to Step 4.

---

## Notes on tone

- **Be direct.** "This scope is too vague to write tickets from" is more useful than
  "perhaps we could consider clarifying the scope a little."
- **Be fast.** Don't ask questions you can answer from context.
- **Be honest about uncertainty.** If you're unsure whether something is in scope, say so.
- **One goal:** a junior developer reads this spec and builds the right thing first time.
