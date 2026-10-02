---
name: create-tickets
description: >
  Translates a finished product spec into an ordered, typed set of Linear tickets.
  Use this skill when a PM says "create tickets", "break this into tickets",
  "generate Linear issues from this spec", or hands over a spec file and asks
  what to build — even if they don't use the word "tickets". Do NOT use for
  drafting specs, refining PRDs, or when the spec still has unresolved open
  questions (return to create-spec first).
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - mcp__claude_ai_Linear__list_teams
  - mcp__claude_ai_Linear__list_initiatives
  - mcp__claude_ai_Linear__save_issue
  - mcp__claude_ai_Linear__get_issue
---

# Create Tickets

Translate a finished product spec into an ordered set of Linear tickets.

## Arguments

`$ARGUMENTS` should be the path to a spec file (e.g., `docs/product/specs/unauthenticated-access.md`).
If not provided, list the files in `docs/product/specs/` and ask the PM which spec to work from.

---

## Step 1 — Orient

Read the following in full before doing anything else:

1. The spec file from `$ARGUMENTS` (or the one the PM selects)
2. `docs/product/personas.md` — to use correct persona names in JTBD statements

Note the following from the spec for use throughout:

- **Initiative:** The `Initiative:` field in the spec frontmatter. This will be used to
  link all tickets to the correct Linear initiative in Step 7. If the spec has no
  `Initiative:` field, flag this after Step 2 and ask the PM before proceeding — do
  not create tickets without an initiative assignment.
- **Entry/exit points:** Any navigation flows described in the spec — which screens or
  pages are involved, where the user comes from, and where they land after. These will
  inform the Gherkin `Given` clauses and the navigation context fields in every Feature
  ticket.

Also check if `docs/iterations/current.md` exists. If it does, read it and note any
in-flight work the new tickets would touch — flag those as dependencies or conflicts
during decomposition.

Do not show any output yet.

---

## Step 2 — Close open questions

Scan the spec for any unresolved questions, ambiguities, or fields marked TBD.

If any are found, **stop and present them to the PM before proceeding**:

> "Before I can write these tickets, I need a few things resolved:
>
> 1. [Question — why it blocks a specific ticket]
> 2. [Question — why it blocks a specific ticket]
>
> Once these are answered I'll move straight to the ticket breakdown."

Do not proceed to Step 3 until all questions are answered and recorded. If the PM cannot
answer a question immediately, a **Spike** ticket is the correct output — but the spike's
scope must be defined before proceeding.

---

## Step 3 — Decompose (internal, do not show)

Silently map the spec into an ordered set of atomic tickets. Apply these rules:

### Atomicity

- Each ticket must be independently shippable without breaking the app.
- Each ticket is a thin **vertical slice** that cuts through all integration layers
  end-to-end, not a horizontal slice of one layer. Ask: "If this ticket ships alone,
  does the user (or the system) observe a change in behaviour?" If not, reconsider the
  split — the ticket is likely a horizontal layer slice and should be merged upward or
  reframed.
- One concern per ticket — don't bundle unrelated changes even if small.
- Never combine "find the problem" with "fix the problem" in a single ticket.
  Investigation and implementation are always separate concerns — if the approach is
  unknown, a Spike is correct.

### Ticket types

Assign every ticket exactly one type:

| Type        | When to use                                                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Feature** | Net-new user-facing capability or behaviour                                                                                         |
| **Bug**     | A known defect the spec explicitly fixes                                                                                            |
| **Chore**   | Work with no visible change to users — migrations, refactoring, infrastructure                                                      |
| **Spike**   | Time-boxed investigation required before implementation can begin — only when the _approach_ is genuinely unknown, not just complex |

Additional rules:

- DB migrations are always **Chore**, always first in the dependency chain
- A Spike must have a defined output artefact — if it doesn't, return to Step 2 to define it
- Never create a Spike just because work is complex

### Dependency ordering

Default order: data layer → service layer → API surface → UI. Adjust only where the spec
genuinely requires it.

### Size guide

- **S** — up to 1 day
- **M** — 1–2 days
- **L** — 2–3 days

If a ticket feels larger than L, split it. If two tickets would always ship together, merge them.

---

## Step 4 — Propose ticket breakdown

Present the proposed ticket set as a numbered list. For each ticket:

- **Title** — active verb, one line
- **Type** — Feature / Bug / Chore / Spike
- **Size** — S / M / L
- **Depends on** — ticket numbers from this list, or None
- **One-sentence scope description**

Also state the initiative that all tickets will be linked to.

Then ask:

> "Here's the proposed breakdown under initiative [Name] — does this look right? Any
> splits, merges, reorderings, or missing tickets before I write the full descriptions?"

Incorporate all feedback. Do not draft full ticket descriptions until the PM approves
the breakdown.

---

## Step 5 — Draft all tickets

### Durability rule

Do not include specific file paths, line numbers, or implementation details that couple
to current code layout. Describe modules, behaviours, and contracts instead. Every ticket
should remain useful and accurate even after a major refactor.

This applies to all fields — Summary, Context, Navigation context, and scenarios alike.

### Acceptance criteria format — Gherkin

All acceptance criteria are written as Gherkin scenarios. This format captures full
navigation and user context in every criterion, and maps directly 1-to-1 to E2E tests.

```
**Scenario: [Short descriptive scenario name]**
Given [the user is on a specific page or in a specific state]
When [they take a specific action]
Then [observable outcome]
And [additional observable outcome, if needed]
```

Rules for writing Gherkin scenarios:

- `Given` must always name the specific page, screen, or user state — never write
  `Given the user is logged in` without also specifying where they are (e.g.
  `Given the user is on the Billing settings page`)
- `When` must be a single discrete action — one click, one form submit, one navigation
  event. If you need two actions, split into two scenarios or use `And`
- `Then` and `And` must describe what the user observes — not what the system does
  internally (e.g. `Then they see a success banner` not `Then the record is updated`)
- Each Feature ticket needs at minimum: one happy-path scenario, one failure/error
  scenario, and one edge-case scenario
- Scenario names should read like test case names: descriptive, unique, written in
  plain language

---

Write each ticket using the template for its type. Every field must be populated — no
placeholders, no TBD. Omit sections marked optional where they genuinely don't apply.

---

### Feature template

```
---

## [N]. [Ticket title]

**Type:** Feature
**Size:** S | M | L
**Initiative:** [Linear initiative name]
**Depends on:** [ticket numbers or None]

### Summary
[One active-voice sentence: what capability this ticket delivers]

### Job to be done
When [situation/trigger], [persona] needs to [desired outcome], so they can [goal].

### Navigation context
**Entry point(s):** [The specific page(s) or flow(s) the user navigates from to reach
this feature. Be precise — e.g. "Settings → Billing tab" or "Onboarding step 3 of 4".]
**Exit point(s):** [Where the user lands after completing the action — e.g. "Returns to
the dashboard with a success toast" or "Proceeds to step 4 of onboarding".]
**Screen/component:** [The specific page, modal, drawer, or component this work lives on.]

### Context
[Why this matters now. What signals or decisions led here. 2-4 sentences max.]

### Designs
[Figma link, "Designs to be created", or "No designs needed"]

### Acceptance criteria

**Scenario: [Happy path name]**
Given [user is on specific page/state]
When [specific action]
Then [observable outcome]
And [additional outcome if needed]

**Scenario: [Failure or error case]**
Given [user is on specific page/state]
When [specific action that triggers a failure]
Then [observable failure state the user sees — error message, disabled state, etc.]

**Scenario: [Edge case]**
Given [specific edge-case state]
When [specific action]
Then [observable outcome]

### Out of scope
[Explicit list of related things this ticket deliberately excludes]
```

---

### Bug template

```
---

## [N]. [Ticket title]

**Type:** Bug
**Size:** S | M | L
**Initiative:** [Linear initiative name]
**Depends on:** [ticket numbers or None]

### Summary
[One sentence: what is broken and for whom]

### Navigation context
**Where it occurs:** [Specific page, screen, or flow where the bug manifests]
**Entry path:** [How the user gets to the point of failure — step by step if the path
is non-obvious]

### Steps to reproduce
1.
2.
3.

### Impact
[Who is affected, how often, severity — use persona names where applicable]

### Acceptance criteria

**Scenario: [Bug no longer occurs]**
Given [user is on the affected page/state]
When [the action that previously triggered the bug]
Then [the correct behaviour the user now observes]

**Scenario: [Related edge case that must also hold]**
Given [related state]
When [action]
Then [correct outcome]
```

---

### Chore template

```
---

## [N]. [Ticket title]

**Type:** Chore
**Size:** S | M | L
**Initiative:** [Linear initiative name]
**Depends on:** [ticket numbers or None]

### Summary
[One sentence: what technical work this does]

### Why now
[What this enables or unblocks. If it's pure maintenance, say what risk it mitigates.]

### Definition of done
- [ ] [Verifiable completion criterion]
- [ ] [Verifiable completion criterion]
```

---

### Spike template

```
---

## [N]. [Ticket title]

**Type:** Spike
**Size:** S | M | L
**Initiative:** [Linear initiative name]
**Depends on:** [ticket numbers or None]

### Summary
[One sentence: what question this spike answers]

### Question to answer
[The specific decision or uncertainty this spike resolves]

### Output artefact
[Exactly what gets produced: an ADR, a decision recorded in [file], a prototype, a
follow-on ticket with a defined approach. Must be concrete.]

### Timebox
[Maximum time before a decision is forced, even if inconclusive]

### What we already know
[Constraints, prior attempts, existing signals that narrow the space]

### Definition of done
- [ ] The output artefact exists and is shared
- [ ] A follow-on ticket or explicit decision is recorded
```

---

After drafting all tickets, show them in full and ask:

> "Here are the full ticket drafts — read them as a developer seeing them for the first time.
> Anything missing, wrong, or unclear? Pay particular attention to whether the navigation
> context and Gherkin scenarios reflect the actual user flow."

Incorporate feedback before moving to Step 6.

---

## Step 6 — Quality gates

Do not proceed to Step 7 if any of the following are true:

- Any Gherkin `Given` clause does not name a specific page, screen, or user state
- Any Gherkin `Then` or `And` clause describes internal system behaviour rather than
  what the user observes
- Any Feature or Bug ticket is missing a failure/error scenario
- Any Feature or Bug ticket is missing a Navigation context section
- Any acceptance criterion describes _how_ to build rather than _what the user can observe_
- Any ticket has a missing or vague acceptance criterion
- A Spike has no concrete output artefact
- A dependency cycle exists
- Any open question from Step 2 remains unresolved
- Any ticket bundles investigation and implementation in the same scope
- No initiative has been assigned

Name the specific ticket and the specific failure. Return to Step 5 to fix it.

---

## Step 7 — Save and post to Linear

On PM approval:

1. **Resolve initiative** — call `list_initiatives` to get the Linear initiative ID
   matching the initiative named in the spec. If more than one initiative matches,
   present the options to the PM and wait for confirmation before proceeding.

2. **Save ticket file** — write all drafts to `docs/product/specs/[feature-name]-tickets.md`:

   ```
   # [Feature name] — Tickets
   Generated: [date]
   Spec: docs/product/specs/[feature-name].md
   Initiative: [initiative name]
   ```

3. **Create in Linear** — call `list_teams` to resolve team ID, then `save_issue` for
   each ticket in dependency order (no-dependency tickets first), passing:
   - `teamId`
   - `initiativeId`
   - `title`
   - `description` (full drafted body)
   - `type`: Feature / Chore / Bug / Spike

4. **Stamp IDs** — after each `save_issue`, get the assigned Linear ID and update
   `[feature-name]-tickets.md` with the ID next to each title.

5. **Update the spec** — in the original spec file:
   - Change `Status: Ready` → `Status: Ticketed`
   - Fill `Tickets:` with comma-separated Linear IDs

6. **Report** — close with the following summary:

   > **Initiative:** [Name — Linear initiative ID]
   >
   > **Tickets created:** [Linear ID — Title] for each ticket, in order
   >
   > **File saved:** [path to tickets file]
   >
   > **Assumptions made during decomposition:** [Any calls made silently in Step 3
   >
   > > without PM input — e.g. "Treated the auth check as a Chore rather than part of
   > > the Feature ticket, as it has no user-visible change." If none, say "None."]
   >
   > **Recommended next step:** [e.g. "Review the Spike output before the downstream
   >
   > > Feature tickets can begin" or "All tickets are unblocked — ready for sprint
   > > planning."]

---

## Note for spec authors

For this skill to wire tickets to the correct Linear initiative automatically, specs
must include an `Initiative:` field in their frontmatter. Example:

```
Initiative: Q3 — Seller Onboarding
```

If your specs don't include this yet, add it to the spec template as a required field.
The create-spec skill should prompt for initiative assignment at spec creation time —
this is the right upstream place to make that decision, not here.
