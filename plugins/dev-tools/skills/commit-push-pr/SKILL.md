---
name: commit-push-pr
description: >
  Breaks current changes into logical commits, pushes the branch, creates a
  PR using the project template with acceptance criteria mapping and manual
  test recommendations, then runs a 3-stage review pipeline with code review,
  security review, and a critic that refines the findings. Publishes results
  as PR comments. Optionally verifies Figma designs via Claude in Chrome.
disable-model-invocation: true
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Commit, Push & PR

Break changes into logical commits, create a PR, and run a multi-stage review pipeline.

## Arguments

`$ARGUMENTS` can be a Linear ticket ID (e.g., `ABC-123`). If not provided, infer from the current branch name.

---

## Phase 1: Smart Commits

### 1. Analyse all changes

```bash
git status
git diff --stat
git diff
git diff --cached
```

Understand every change — staged, unstaged, and untracked files.

### 2. Group into logical commits

Analyse the diff and group changes into atomic commits by concern. Common groupings:

- **Database schema** — migrations, schema changes
- **Service layer** — new or modified services
- **API routes** — new or modified route handlers
- **UI components** — new or modified React components
- **Tests** — unit tests and E2E tests
- **Configuration** — environment, build, or tooling changes

Each commit should be independently meaningful. A reviewer reading the commit history should understand the progression of the feature.

### 3. Create commits

For each logical group:

1. Stage the specific files: `git add <file1> <file2> ...`
2. Commit with a descriptive message following the project's convention:
   - Prefix with ticket ID when applicable (e.g., `ABC-123: add pricing service`)
   - Use imperative mood ("add", "fix", "update", not "added", "fixed", "updated")
   - One concise sentence summarising the change

Check the recent commit history with `git log --oneline -20` to match the existing style.

### 4. Push

```bash
git push -u origin <branch-name>
```

If push fails due to network errors, retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s).

---

## Phase 2: PR Creation

### 5. Fetch ticket details

Use the Linear MCP tool `get_issue` with the ticket ID to get:

- Title and description
- Acceptance criteria
- Any linked Figma designs (check attachments)

### 6. Read the PR template

```bash
cat .github/PULL_REQUEST_TEMPLATE.md
```

Read the template dynamically — do not hardcode its structure.

### 7. Create the PR body

Populate every section of the PR template:

- **Motivation and Context**: Derived from the ticket description. Explain _why_ this change is needed.
- **How has this been tested**: Check the appropriate boxes:
  - `[x] Unit Tests` if unit tests were added/modified
  - `[x] E2E Tests` if E2E tests were added/modified
  - `[x] Manual Tests` with a description of what was manually verified
- **Types of changes**: Infer from the diff (bug fix, new feature, breaking change)
- **Checklist**: Pre-check items that are verifiably done

Add two custom sections after the template:

#### Acceptance Criteria Mapping

For each acceptance criterion from the ticket, describe which specific code changes and tests address it:

```markdown
## Acceptance Criteria Mapping

| Criterion                 | Implementation                         | Tests                                          |
| ------------------------- | -------------------------------------- | ---------------------------------------------- |
| User can upload images    | `src/components/ImageUpload.tsx`       | `tests/image-upload.test.ts`                   |
| Images are analysed by AI | `src/services/imageAnalysis.ts`        | `src/services/imageAnalysis.test.ts`           |
```

#### Recommended Manual Tests

Concrete steps a reviewer should follow to manually verify the changes:

```markdown
## Recommended Manual Tests

1. Navigate to the dashboard
2. Click "New Item"
3. Upload 3 images — verify preview thumbnails appear
4. Verify AI analysis completes within 10 seconds
5. Check that pricing suggestions are within expected range
```

### 8. Create the PR

Use the GitHub MCP tool `create_pull_request` with:

- **title**: Short, descriptive (under 70 characters), prefixed with ticket ID
- **body**: The populated PR template
- **base**: `staging` (or the appropriate base branch)

---

## Phase 3: Automated PR Review

### 9. Run the review pipeline

Invoke the `/review-pr` skill, which runs a 3-stage subagent review pipeline:

1. **Code reviewer** — bugs, conventions, error handling, type safety, performance, testing gaps, architecture
2. **Security reviewer** — auth, injection, secrets, input validation, external API security
3. **Review critic** — verifies accuracy, filters false positives, calibrates severities, produces refined findings

The `/review-pr` skill handles all subagent orchestration and publishes the refined review as PR comments with severity prefixes (`[Bug]`, `[Security]`, `[Warning]`, `[Suggestion]`, `[Nit]`).

See `.claude/skills/review-pr/SKILL.md` for the full pipeline details.

---

## Phase 4: Design Verification (Claude in Chrome)

### 10. Check for Figma designs

If the ticket has linked Figma designs (check attachments from the Linear ticket or URLs in the description):

1. **Check Chrome availability**: Verify that Claude in Chrome is connected. If not, prompt the user: "Design verification requires Claude in Chrome. Run `/chrome` to enable it, or skip this step."

2. **If Chrome is available**:
   - Ensure the dev server is running (`npm run dev`)
   - Navigate to the relevant page on `localhost:3000`
   - Take a screenshot of the implementation
   - Open the Figma design link (the user's browser session provides Figma authentication)
   - Compare layout, spacing, colors, and typography
   - Report any discrepancies with specific CSS properties and component references

3. **If Chrome is not available**: Print the Figma link and dev server URL, and ask the user to verify manually.

### 11. Final summary

Report:

- PR URL (link to the created PR)
- Number of commits created
- Review verdict (approved / changes requested / commented)
- Count of findings by severity
- Design verification result (if applicable)
