---
name: review-pr
description: >
  Reviews the current branch's pull request using a 3-stage subagent pipeline:
  code review, security review, and a critic that refines the findings.
  Publishes results as PR comments. Can be run standalone or as part of
  /commit-push-pr.
disable-model-invocation: true
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Review PR

Review the pull request for the current branch using a 3-stage subagent review pipeline, then post findings as PR comments.

## Steps

### 1. Get the PR details

Fetch the PR for the current branch using the GitHub MCP tool `pull_request_read` with method `get`:

- PR number, title, body, base branch
- If no PR exists, tell the user and stop.

### 2. Get the full diff

Use `pull_request_read` with method `get_diff` to get the complete diff against the base branch.

Also get the list of changed files using `pull_request_read` with method `get_files`.

### 3. Read project conventions

Read `CLAUDE.md` to understand project conventions, architecture, and coding standards. This context is essential for accurate reviews.

### 4. Code review (Subagent 1)

Spawn a forked subagent using the `code-reviewer` agent definition (`.claude/agents/code-reviewer/AGENT.md`).

Provide it with:

- The full PR diff
- The list of changed files

The code-reviewer will evaluate: bugs, convention violations, error handling, type safety, performance, testing gaps, and architecture compliance.

### 5. Security review (Subagent 2)

Spawn a forked subagent using the `security-reviewer` agent definition (`.claude/agents/security-reviewer/AGENT.md`).

Provide it with:

- The full PR diff
- The list of changed files

The security-reviewer will evaluate: auth bypasses, injection risks, secrets exposure, input validation, external API security, and data handling.

Run subagents 1 and 2 **in parallel** — they are independent.

### 6. Review critique (Subagent 3)

After both reviews complete, spawn a forked subagent using the `review-critic` agent definition (`.claude/agents/review-critic/AGENT.md`).

Provide it with:

- The code review findings
- The security review findings
- The full PR diff

The review-critic will: verify accuracy of findings, calibrate severities, filter false positives, identify missed issues, and produce a refined final review.

### 7. Publish review comments

Using the GitHub MCP tools, post the refined review:

1. **Summary review**: Use `pull_request_review_write` to post the overall review body. Choose the appropriate event:
   - `REQUEST_CHANGES` if there are BUG or CRITICAL findings
   - `COMMENT` if there are only SUGGESTION or WARNING findings
   - `APPROVE` if the review is clean

2. **Inline comments**: For each finding with a specific file and line number, post an inline comment on the PR using the GitHub MCP tools.

Use severity prefixes in comments: `[Bug]`, `[Security]`, `[Warning]`, `[Suggestion]`, `[Nit]`

### 8. Report summary

Print:

- PR title and number
- Review verdict (approved / changes requested / commented)
- Count of findings by severity (confirmed, rejected, additional)
- List of files with findings
