---
name: plan-sub-issues
description: >
  Takes a parent Linear ticket (typically produced by `/create-tickets`),
  drafts 2-3 implementation options grounded in the codebase and any
  architecture docs (local or Notion), reviews each option with parallel specialised
  subagents (duplication, clean code & architecture, security, scalability,
  testing), presents tradeoffs, and on approval breaks the chosen approach
  into ordered sub-issues attached to the parent in Linear.
disable-model-invocation: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - get_issue
  - save_issue
  - list_teams
  - notion-search
  - notion-fetch
---

# Plan Sub-Issues

For a parent Linear ticket, design the implementation, get an independent review of the design, and on approval write the work back as sub-issues attached to that parent.

## Arguments

`$ARGUMENTS` should be a Linear ticket ID (e.g., `ABC-123`). If no argument is provided, ask the user for the ticket ID. Do not guess.

---

## Step 1 — Fetch the parent ticket

Call `get_issue` with the ticket ID, `includeRelations: true`. Capture:

- Title, description, acceptance criteria
- Team and initiative (needed when creating sub-issues)
- Any existing sub-issues (avoid duplicating work already broken down)
- Linked attachments (Figma, specs)

If the ticket already has sub-issues, list them and ask the user whether to append to or replace the existing breakdown before proceeding.

---

## Step 2 — Gather context

Read in parallel:

1. **`CLAUDE.md`** — conventions, black-box principles, naming rules, testing standards. This is the rubric reviewers will hold the plan against.
2. **`README.md`** — high-level project context.
3. **The codebase areas the ticket will touch.** Use Glob to enumerate, then Grep for the domain nouns/verbs in the ticket title. Read full files for the most relevant matches (do not work from snippets alone).
4. **Architecture docs in Notion** (only if a Notion MCP is connected). Call `notion-search` with the ticket's domain terms (e.g., "pricing", "publishing", "session"). If `CLAUDE.md` names a Notion page for architecture docs, scope the search to it via `page_url`. For each strong hit, call `notion-fetch` with the result's `id`. Capture relevant ADRs, system diagrams, and integration contracts.
5. **`docs/architecture-decision-record.md`** if present — local copy of architecture decisions.

If Notion is not connected or returns nothing after one broadened query, proceed without it and note the gap in the options document.

---

## Step 3 — Draft 2-3 implementation options

Write to `docs/plans/<ticket-id>-options.md`. Generate **2 options** when the design space is narrow (one obvious approach plus one alternative), **3 options** when there are genuinely distinct architectural choices. Never pad with a strawman.

Each option must include:

```
## Option [N] — [Short descriptive name]

### Approach
[2-4 sentences: what shape the solution takes — which existing modules are extended, what new modules/services/components are introduced, where the integration boundary sits.]

### Modules touched
- **New:** [module/service/component names — describe by purpose, not file path]
- **Modified:** [existing modules by name]
- **Reused:** [existing functions/types/constants this approach builds on — name them precisely]

### Data flow
[One paragraph: user action → component → API route → service → DAL → database, and back. Reference real layers from CLAUDE.md, not invented ones.]

### Why this option
[The strength: which constraint or principle it satisfies best.]

### Why not this option
[The weakness: what it trades away.]
```

Apply the **durability rule** from `/create-tickets`: describe modules and contracts by purpose, not specific file paths or line numbers. The plan should remain accurate after a refactor.

---

## Step 4 — Parallel subagent reviews

For **each option**, spawn **5 forked subagents in parallel** (`context: fork`, `agent: Plan`). Give each subagent: the full options document, `CLAUDE.md`, and a list of the changed-area file paths from Step 2.

### Subagent A — Duplication & reuse

Search the codebase with Glob and Grep for functions, types, constants, components, or DAL helpers that overlap with what this option proposes to add. Specifically check:

- Service methods that already exist for the proposed operation
- Existing validation schemas that match the proposed request/response shapes
- Existing data-access functions covering the queries
- Existing UI primitives and shared components
- Existing shared constants and config

Report each overlap with the existing symbol's location and an assessment: **reuse**, **extend**, or **genuinely new**.

### Subagent B — Clean code & architecture

Hold the option to the black-box principles in `CLAUDE.md`. Specifically:

- Are public interfaces minimal and described before implementation?
- Does it follow each architecture rule stated in `CLAUDE.md` (base classes, required imports, directory layout, component typing)?
- Are functions and files within the size guidelines in `CLAUDE.md`?
- Any leaky abstractions (raw DB rows escaping the DAL, third-party types leaking through service boundaries)?
- Any cross-module reaches into another module's internals?

### Subagent C — Security

Hold the option against the project's API and auth conventions:

- Do all new API routes call the project's auth guard?
- Are request bodies schema-validated before processing?
- Are external API credentials kept on the server (no `'use client'` references to secret env vars)?
- Are user-controlled inputs passed to `fetch()` (SSRF) or to shell execution?
- Are queries scoped to the authenticated user's data (no horizontal privilege escalation)?
- Does any new client-side state hold sensitive data?

### Subagent D — Scalability

Check for performance footguns:

- N+1 query risks in new DAL functions — would a join or batch load be needed?
- Unbounded result sets — should pagination be planned in?
- Long-running operations on the request path — should this be a background job?
- Unnecessary client re-renders or hydration cost in new components?
- Synchronous calls to slow external APIs (legacy XML/SOAP, third-party marketplaces) without batching or retry?

### Subagent E — Testing

Assess the testability of the proposed interfaces:

- Can each new module be tested through its public interface without touching internals?
- Are there clear boundary conditions to cover (empty, null, max, off-by-one)?
- Are error paths reachable from tests?
- Does the option define seams for replacing external dependencies (payment, marketplace, AI providers) in unit tests?
- For Feature-level work, are E2E acceptance tests scaffoldable via the project's existing E2E pattern (page objects, fixtures)?

Each subagent must return its findings as: **verdict** (PASS / WARN / FAIL), **2-5 specific findings with file references where applicable**, and **one-line recommendation per finding**.

---

## Step 5 — Synthesise tradeoffs

Aggregate the 5 × N subagent reports into a single comparison table:

```
| Option | Duplication | Clean code | Security | Scalability | Testing |
|--------|-------------|------------|----------|-------------|---------|
| 1      | PASS        | WARN       | PASS     | PASS        | PASS    |
| 2      | PASS        | PASS       | PASS     | WARN        | PASS    |
| 3      | FAIL        | PASS       | PASS     | PASS        | WARN    |
```

Then for each option, distil the subagent findings into:

- **Pros** (3-5 bullets, grounded in subagent findings)
- **Cons** (3-5 bullets, grounded in subagent findings)
- **Critical risks** (any FAIL verdicts — must be resolved before selecting this option)

Append the comparison and the per-option pros/cons to `docs/plans/<ticket-id>-options.md`.

---

## Step 6 — Present and recommend

Show the user:

1. The comparison table
2. The pros/cons for each option
3. A **recommendation**: which option to take and why, in 2-3 sentences. The recommendation must reference the specific tradeoffs (e.g., "Option 2 trades some implementation effort for clearer module boundaries — the FAIL on Option 3 around duplication outweighs its simplicity").

Then ask:

> "Which option would you like to proceed with — 1, 2, or 3? Or do you want me to revise an option, or generate a new one?"

If the user requests revisions, update the options document and re-run Step 4 for the changed option(s) only. Maximum 3 revision cycles before stopping to ask whether to abandon and rethink.

---

## Step 7 — Decompose the chosen option into sub-issues

Once the user picks an option, break it into atomic implementation sub-issues. Apply the same atomicity and ordering rules as `/create-tickets`:

- Each sub-issue is independently shippable — it can land without breaking the app
- Each sub-issue is a thin vertical slice where possible; horizontal layer-only slices are only acceptable for setup work (e.g., DB migration as a Chore)
- One concern per sub-issue
- Dependency order: data layer → service layer → API surface → UI
- Size guide: **S** (≤1 day), **M** (1-2 days), **L** (2-3 days). Split anything larger than L
- Merge any two sub-issues that would always ship together

Sub-issue types: **Feature** (user-visible change), **Chore** (no user-visible change — migrations, refactors), **Bug** (defect this work explicitly fixes), **Spike** (timeboxed investigation with a defined output artefact).

### Sub-issue template (implementation-focused)

```
**Type:** Feature | Chore | Bug | Spike
**Size:** S | M | L
**Depends on:** [sub-issue numbers from this set, or None]

### Summary
[One active-voice sentence: what this sub-issue delivers.]

### Implementation outline
[2-4 sentences: which modules/services/components are extended or added, where the integration boundary sits. Describe by purpose, not file path.]

### Reused from existing code
[Bullet list of existing functions/types/constants this sub-issue builds on. If none, "None".]

### Definition of done
- [ ] [Verifiable completion criterion — e.g. "CategoryService exposes `fetchTopLevelCategories()` returning `Category[]`"]
- [ ] [Verifiable completion criterion — e.g. "Unit tests cover the empty-categories and API-failure cases"]
- [ ] [Verifiable completion criterion]

### Suggested places to test
- **Unit:** [Module(s) and the specific behaviours to cover — name the function/class and the scenarios. E.g. "`PricingService.calculate()`: rounding, currency conversion, missing-condition fallback."]
- **Integration / E2E:** [User flow(s) to verify, mapped to existing page objects where possible. E.g. "`PricingPage`: user adjusts price → sees recalculated total."]
- **Manual:** [Anything that needs eyes-on (visual regression, third-party side-effects, production-only behaviour). "None" if not applicable.]

### Risks and edge cases
- [Specific risk or edge case the implementer must handle — e.g. "Upstream API returns 500 mid-batch: partial state must be recoverable."]
- [Specific risk or edge case — e.g. "Concurrent updates from two browser tabs: define whether last-write-wins is acceptable."]
- [Specific risk or edge case — e.g. "Empty result from upstream service: distinguish 'no data yet' from 'genuinely empty'."]

### Linked acceptance criterion
[Reference the specific scenario(s) from the parent ticket that this sub-issue contributes to, by scenario name. "None" only if this is a pure Chore with no user-visible behaviour.]
```

For Spike sub-issues additionally require: **Question to answer**, **Output artefact**, **Timebox**. Spike sub-issues may omit "Suggested places to test" if the spike output is a document rather than code, but must still list **Risks and edge cases** the investigation should surface.

---

## Step 8 — Quality gates

Do not proceed to Step 9 if any of the following are true:

- A sub-issue's Definition of done item is vague or unverifiable
- A sub-issue bundles investigation with implementation (split into a Spike + a follow-on)
- A dependency cycle exists between sub-issues
- A Spike has no concrete output artefact
- A sub-issue is larger than L (split it)
- Two sub-issues would always ship together (merge them)
- A Feature or Bug sub-issue's **Suggested places to test** section is missing or only restates the DoD (it must name modules and behaviours, not just "add tests")
- A sub-issue's **Risks and edge cases** section is missing, empty, or generic (e.g. "handle errors gracefully" — name the specific failure mode)
- No sub-issue references the parent ticket's acceptance criteria via the **Linked acceptance criterion** field (Chores excepted)

Name the specific sub-issue and the specific failure, then return to Step 7 to fix.

---

## Step 9 — Show the breakdown and ask for approval

Present the full sub-issue list to the user. Ask:

> "Here's the breakdown for Option [N]. Read it as a developer seeing it for the first time. Anything missing, wrong, or that should be split or merged before I push to Linear?"

Incorporate feedback. Do not push to Linear until the user approves.

---

## Step 10 — Save sub-issues to Linear

On approval:

1. Call `list_teams` once to resolve the team ID from the parent ticket's team name (already captured in Step 1).
2. For each sub-issue **in dependency order** (no-dependency sub-issues first), call `save_issue` with:
   - `team`: the parent ticket's team
   - `parentId`: the parent ticket ID from `$ARGUMENTS`
   - `title`: the sub-issue title
   - `description`: the full sub-issue body in Markdown (use literal newlines — do not escape)
   - Inherit the parent's `project` and `initiative` if known
3. Capture the assigned Linear ID returned by each `save_issue` call.
4. After all sub-issues are created, make a second pass to wire `blockedBy` relations — for each sub-issue with a `Depends on:` list, call `save_issue` again with `id` set to the new sub-issue's Linear ID and `blockedBy` set to the Linear IDs of its dependencies.

Update `docs/plans/<ticket-id>-options.md` with a final section appending each sub-issue's Linear ID next to its title.

---

## Step 11 — Report

Print:

> **Parent ticket:** [Linear ID — Title]
>
> **Selected option:** Option [N] — [name]
>
> **Sub-issues created (in order):**
>
> - [Linear ID] — [Title] ([Type], [Size])
> - ...
>
> **Plan document:** `docs/plans/<ticket-id>-options.md`
>
> **Next step:** Run `/branch-setup [first sub-issue ID]` to begin implementation.

If any FAIL verdicts were accepted as risks during Step 5, list them under a **Risks accepted** heading so they remain visible.
