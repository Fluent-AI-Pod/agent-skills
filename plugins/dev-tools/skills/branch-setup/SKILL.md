---
name: branch-setup
description: >
  Sets up a new feature branch from the base branch and scaffolds Playwright
  E2E acceptance tests based on the ticket's acceptance criteria. Invoke when
  starting work on a new ticket.
disable-model-invocation: true
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Branch Setup

Set up a new feature branch and scaffold acceptance tests for a Linear ticket.

## Arguments

`$ARGUMENTS` should be a Linear ticket ID (e.g., `ABC-123`). If no argument is provided, ask the user for the ticket ID.

## Steps

### 1. Fetch ticket details

Use the Linear MCP tool `get_issue` with the ticket ID from `$ARGUMENTS` to fetch:

- Title
- Description (including acceptance criteria)
- Git branch name (from the `gitBranchName` field)

If the ticket has no acceptance criteria in the description, ask the user to provide them.

### 2. Create the branch

Use the base branch named in `CLAUDE.md` or `AGENTS.md`. If none is named, use `staging` when `origin/staging` exists, otherwise the remote default branch (`git symbolic-ref --short refs/remotes/origin/HEAD`).

```bash
git fetch origin <base-branch>
git checkout -b <branch-name> origin/<base-branch>
```

Use the `gitBranchName` from the Linear ticket response as the branch name. If not available, derive it from the ticket ID + title in kebab-case (e.g., `abc-123-add-bulk-export`).

### 3. Learn the E2E test conventions

Before writing any tests, discover the project's E2E patterns:

1. `CLAUDE.md` / `AGENTS.md` — any stated E2E conventions
2. `playwright.config.*` — `testDir`, file naming (`.test.ts` vs `.spec.ts`), default device/project
3. Page objects or DSL classes under the test directory, including any base class and any facade that registers them
4. Shared step or fixture helpers (e.g., BDD-style GIVEN/WHEN/THEN wrappers, login fixtures)
5. One existing test file as a structural exemplar

Follow whatever the project already does. If the project has no Playwright setup, stop and ask the user how acceptance tests should be written.

### 4. Scaffold acceptance tests

Create `<testDir>/<ticket-id-kebab>-acceptance.<ext>` mirroring the exemplar's imports, setup, and helpers, with:

- A `test.describe` block named after the ticket title
- One `test()` per acceptance criterion from the ticket
- Each test structured as GIVEN/WHEN/THEN steps with descriptive names
- `TODO` bodies that point at the page object or helper the implementer should use

If the project has no step helper, use `test.step`:

```typescript
import { test } from "@playwright/test";

test.describe("Ticket Title", () => {
  test("Acceptance criterion description", async ({ page }) => {
    await test.step("GIVEN precondition", async () => {
      // TODO: implement
    });
    await test.step("WHEN action", async () => {
      // TODO: implement
    });
    await test.step("THEN outcome", async () => {
      // TODO: implement
    });
  });
});
```

### 5. Scaffold new page objects (if needed)

If the project uses page objects and the acceptance criteria reference UI pages not covered by existing ones:

1. Create a new class following the existing base class and file location
2. Implement any abstract methods the base class requires
3. Add stub methods for the interactions described in the acceptance criteria
4. Register the new class wherever existing page objects are registered (e.g., a facade class)

Run the new tests to verify they all fail initially.

### 6. Report summary

Print a summary including:

- Branch name created
- Ticket title and ID
- Number of acceptance tests scaffolded
- Any new page object classes created
- File paths of all created/modified files
