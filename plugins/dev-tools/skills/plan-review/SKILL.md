---
name: plan-review
description: >
  Creates an implementation plan for the current task, then spawns a review
  subagent to critique the plan for duplication, clean code, architecture,
  security, scalability, and test coverage. Invoke after branch-setup when
  ready to plan the implementation.
disable-model-invocation: true
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Plan Review

Create an implementation plan and have it reviewed by an independent subagent.

## Arguments

`$ARGUMENTS` can be a Linear ticket ID (e.g., `ABC-123`) or a description of the task. If no argument is provided, infer the task from the current branch name and any scaffolded acceptance tests.

## Steps

### 1. Gather context

1. If a ticket ID is provided, fetch it via the Linear MCP tool `get_issue` to get the full description and acceptance criteria.
2. Read `CLAUDE.md` to understand project conventions, architecture, and design principles.
3. Check for scaffolded acceptance tests from `/branch-setup` (look in `tests/` for files matching the ticket ID).
4. Scan the codebase for related files using Glob and Grep — understand the areas that will be touched by this change.

### 2. Create the plan

Write a plan document to `docs/plans/<ticket-id>-plan.md` (create the `docs/plans/` directory if it does not exist).

The plan must include these sections:

#### Summary

What is being built and why. Reference the ticket.

#### Files to create/modify

List every file path that will be created or modified, with a one-line description of the change.

#### Interface design

Define the public interfaces before implementation:

- Function signatures with parameter and return types
- New TypeScript types/interfaces
- Component props
- API route request/response shapes (with Zod schemas)
- Service method signatures

#### Data flow

Describe how data moves through the system for this feature. From user action → component → API route → service → DAL → database (and back).

#### Testing strategy

- Which unit tests will be written (file paths, key scenarios)
- How the scaffolded acceptance tests will be implemented
- Boundary conditions to cover
- Error paths to test

#### Migration/deployment notes

Any database migrations, environment variables, or deployment steps required.

### 3. Review the plan with a subagent

Launch a **Plan subagent** (using `context: fork` and `agent: Plan`) to independently review the plan. The subagent must evaluate:

#### Duplication check

Search the codebase with Glob and Grep to verify that the plan does not propose functions, types, or components that already exist. Report any overlaps.

#### Clean code review

Does the plan follow the black-box architecture principles from CLAUDE.md?

- Minimal public interfaces
- No leaky abstractions (returning raw DB rows, exposing internals)
- Each module independently testable and replaceable
- Functions do one thing (~10 lines target)

#### Architecture review

Does the plan fit existing patterns?

- Extract each architecture rule from CLAUDE.md (layering, base classes, required imports, directory layout, auth + validation on API routes, component typing) and check the plan against it
- New code lives where similar existing code lives

#### Security review

- Are there auth checks on all new API routes?
- Is user input validated before processing?
- Are external API credentials handled securely?
- Any new client-side state that could leak sensitive data?

#### Scalability review

- N+1 query risks in new DAL functions?
- Unnecessary re-renders in new client components?
- Large data sets handled with pagination?
- Background jobs for long-running operations (via the project's job runner)?

#### Testing review

- Is the testing strategy adequate?
- Are boundary conditions covered?
- Does it follow F.I.R.S.T. principles (Fast, Independent, Repeatable, Self-validating, Timely)?
- Are error paths tested?

### 4. Present the review

Display the subagent's findings organised by category with a verdict for each:

```
| Category      | Verdict | Notes                        |
|---------------|---------|------------------------------|
| Duplication   | PASS    | No overlapping functions found|
| Clean Code    | WARN    | Two functions exceed 15 lines|
| Architecture  | PASS    | Follows service layer pattern|
| Security      | PASS    | All new routes call the auth guard |
| Scalability   | WARN    | Potential N+1 in listing query|
| Testing       | FAIL    | Missing error path tests     |
```

For WARN and FAIL verdicts, include specific recommendations.

### 5. Iterate or exit

If the review identifies FAIL verdicts:

1. Revise the plan document to address the findings
2. Ask the user if they want to re-run the review subagent
3. If yes, spawn a new review subagent with the updated plan

**Exit paths:**

- **All PASS**: The plan is ready. Print the path to the plan document and proceed to implementation.
- **User accepts WARNs**: The plan is ready with acknowledged trade-offs. Document the accepted WARNs in the plan file.
- **User wants to abandon**: If the review reveals the approach is fundamentally flawed, tell the user and suggest starting over with a different approach. Delete the plan document to avoid confusion.
- **Maximum 3 iterations**: If the plan still has FAILs after 3 review cycles, stop and present the remaining issues to the user for a decision — either accept the risks or rethink the approach entirely.
