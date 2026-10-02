---
name: code-health
description: >
  Runs a comprehensive code health analysis using multiple research subagents.
  Checks security posture, clean code adherence, test coverage, dependency
  health, and architecture compliance. Produces a severity-ranked report with
  improvement recommendations. Schedule via Desktop Scheduled Tasks for
  weekly Friday runs.
disable-model-invocation: true
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Code Health Audit

Run a comprehensive code health analysis across five dimensions using parallel research subagents.

## Steps

### 1. Read project conventions

Read `CLAUDE.md` to understand the project's standards for code quality, architecture, naming, testing, and file size. These standards define what "healthy" looks like for this codebase.

### 2. Spawn parallel research subagents

Launch **5 Explore subagents in parallel** (using `context: fork`, `agent: Explore`), each with a specific research focus:

#### Subagent A: Security Audit

Search the codebase for security issues:

- **Hardcoded secrets**: Grep for API keys, tokens, passwords, connection strings in source files (exclude `.env*` files)
- **Missing auth**: Check all API route handlers — flag any that skip the project's auth guard (see `CLAUDE.md`)
- **Auth configuration**: Read the auth module and verify token signing/encryption and cookie settings (HttpOnly, Secure, SameSite)
- **Dependency vulnerabilities**: Run the package manager's audit (`npm audit --json`, `pnpm audit --json`, `bun audit`) and summarise findings
- **Unsafe HTML rendering**: Search for unsafe inner HTML patterns in React components
- **Client-side secrets**: Check `'use client'` files for `process.env` references to sensitive variables

#### Subagent B: Clean Code Metrics

Measure code quality against CLAUDE.md standards:

- **File size**: Find all source files exceeding the file-size guideline in `CLAUDE.md` (300 lines if none is set). Report the top 10 largest files.
- **Function size**: Find functions exceeding the function-size guideline in `CLAUDE.md` (40 lines if none is set). Sample 20 files across services, components, and utilities.
- **Parameter count**: Find functions with more than 3 parameters.
- **Type safety**: Count `any` types, `as` casts, and `@ts-ignore`/`@ts-expect-error` usage across the codebase.
- **Dead code**: Look for exported functions/types that are not imported anywhere else.
- **Naming violations**: Check for abbreviated variable names (`p`, `prev`, `img`, `i`, `e`, `err`, `res`, `req`) in recently modified files.
- **Commented-out code**: Search for blocks of commented-out code (3+ consecutive commented lines).

#### Subagent C: Architecture Compliance

Verify adherence to the project's architecture patterns:

- **Stated rules**: Extract every architectural rule from `CLAUDE.md` (layering, base classes, required imports, directory layout, API request/response shape, component typing, path aliases) and check the codebase against each one. Report violations with file references.
- **Cross-module dependencies**: Check for services importing from other service internals rather than public interfaces.

#### Subagent D: Test Coverage Analysis

Assess testing health:

- **Coverage map**: List all production source files and check whether each has a corresponding `.test.ts` file. Calculate the percentage of files with tests.
- **Untested services**: Flag any service or domain module without unit tests.
- **Untested API routes**: Flag any API route without corresponding tests.
- **Test quality sampling**: Read 5 random test files and check for:
  - Build-Operate-Check structure (Arrange-Act-Assert)
  - One concept per test
  - Descriptive test names
  - Boundary condition testing
- **E2E coverage**: If the project uses page objects, list them and check which have corresponding E2E test files.

#### Subagent E: Dependency Health

Assess package health:

- **Outdated packages**: Run the package manager's outdated check (e.g., `npm outdated --json`) and categorise by severity (major/minor/patch updates available).
- **Vulnerabilities**: Run the package manager's audit and summarise by severity.
- **Unpinned versions**: If `CLAUDE.md` requires exact versions, check `package.json` for any dependencies using `^` or `~` ranges.
- **Unused dependencies**: Cross-reference `package.json` dependencies against actual imports in the source tree. Flag packages that appear unused.
- **Bundle size concerns**: Flag particularly large dependencies that might affect client bundle size.

### 3. Aggregate results

Collect all subagent outputs and produce a unified report organised by category.

For each finding, assign a severity:

- **Critical** — security vulnerability, data exposure risk, broken functionality
- **High** — significant code quality issue, missing tests for critical paths, architectural violation
- **Medium** — moderate deviation from standards, missing tests for non-critical paths
- **Low** — minor style issue, improvement opportunity

### 4. Write the report

Create the report at `docs/code-health/YYYY-MM-DD-code-health.md` (create the directory if needed). Use today's date.

**Scoring guide:** Start at 10 and deduct: -3 per Critical, -2 per High, -1 per Medium, -0.5 per Low. Minimum score is 0. Overall score is the average of all category scores.

Report structure:

```markdown
# Code Health Report — YYYY-MM-DD

## Executive Summary

| Category          | Score | Critical | High | Medium | Low |
| ----------------- | ----- | -------- | ---- | ------ | --- |
| Security          | X/10  | N        | N    | N      | N   |
| Clean Code        | X/10  | N        | N    | N      | N   |
| Architecture      | X/10  | N        | N    | N      | N   |
| Test Coverage     | X/10  | N        | N    | N      | N   |
| Dependency Health | X/10  | N        | N    | N      | N   |
| **Overall**       | X/10  | N        | N    | N      | N   |

## Trend (if previous reports exist)

Compare scores against the most recent previous report in this directory.

## Detailed Findings

### Security

[findings...]

### Clean Code

[findings...]

### Architecture

[findings...]

### Test Coverage

[findings...]

### Dependency Health

[findings...]

## Top 5 Recommendations

Prioritised list of the highest-impact improvements, with effort estimates (small/medium/large).

## Model Evaluation

- Current model in use: [model name from session]
- New models available since last report: [check if newer Claude models exist]
- Recommendation: describe a manual eval process — take 5 representative prompts
  from recent team usage (branch-setup, plan-review, commit-push-pr, code-review),
  run them against any newly available model, and compare output quality
```

### 5. Report summary

Print:

- Overall health score
- Count of findings by severity
- Top 3 recommendations
- Path to the full report file

---

## Scheduling

This skill is designed to run weekly. Set up a **Desktop Scheduled Task**:

1. Open Claude Code Desktop app
2. Go to **Schedule** > **New task** > **New local task**
3. Configure:
   - **Name**: `code-health-check`
   - **Prompt**: `Run /code-health for the weekly code health audit. Commit the report and push to the current branch.`
   - **Frequency**: Weekly, Friday, 9:00 AM
   - **Worktree**: Enabled (isolated Git worktree per run)
4. First run: click "Run now" and approve permissions — future runs will auto-approve

**Note**: Desktop Scheduled Tasks are stored in `~/.claude/scheduled-tasks/` (user home directory), not in the repository. Each team member must set up their own scheduled task.
