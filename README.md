# agent-skills

Claude Code skills for taking work from idea to merged PR: shape a spec, critique it,
turn it into tickets, plan the implementation, set up the branch, review, and ship.

## Install

```bash
/plugin marketplace add Fluent-AI-Pod/agent-skills
/plugin install pm-tools@agent-skills
/plugin install dev-tools@agent-skills
/plugin install meta-tools@agent-skills
```

Update later with:

```bash
/plugin marketplace update agent-skills
```

## Plugins

### pm-tools

| Skill | What it does |
| --- | --- |
| `create-spec` | Turns a rough idea, meeting notes, or a brief into a structured product spec |
| `critique-spec` | Scores an existing spec and lists specific improvements |
| `create-tickets` | Breaks a finished spec into ordered, typed Linear tickets |
| `plan-sub-issues` | Drafts 2-3 implementation options for a ticket, reviews them with parallel subagents, and writes the chosen plan back as Linear sub-issues |

### dev-tools

| Skill | What it does |
| --- | --- |
| `branch-setup` | Creates a branch for a Linear ticket and scaffolds Playwright acceptance tests from its criteria |
| `plan-review` | Reviews an implementation plan for duplication, architecture fit, security, scalability, and testing |
| `commit-push-pr` | Commits, pushes, and opens a PR that maps each acceptance criterion to code and tests |
| `review-pr` | Reviews a PR against the project's conventions |
| `code-health` | Runs a scored health audit across security, clean code, architecture, tests, and dependencies |

### meta-tools

| Skill | What it does |
| --- | --- |
| `evaluate-skill` | Lints and scores a Claude skill against a rubric |

## Requirements

- **`CLAUDE.md` in your project.** The dev and planning skills read it for your architecture rules, naming, size limits, and testing standards. The more specific it is, the sharper the reviews.
- **Linear MCP** for the ticket-based skills (`create-tickets`, `plan-sub-issues`, `branch-setup`).
- **GitHub MCP** or the `gh` CLI for `commit-push-pr` and `review-pr`.
- **Notion MCP** (optional) lets `plan-sub-issues` pull in architecture docs.
- **Playwright** for the test scaffolding in `branch-setup`.

## Layout

```
.claude-plugin/marketplace.json   # catalog of plugins
plugins/<domain>/                 # one plugin per domain
  .claude-plugin/plugin.json      # name, description, author
  skills/<name>/SKILL.md          # a skill
```

## Contributing

1. Add or edit `plugins/<domain>/skills/<name>/SKILL.md`. The frontmatter `description` is required; it is what triggers the skill.
2. Keep supporting files inside the skill directory (no `../`; plugins run from a cache copy).
3. Run the audit locally:
   ```bash
   node scripts/audit.mjs .
   claude plugin validate .
   ```
4. Open a PR. CI runs the same audit.

The audit validates manifests and scans every text file for secrets, dangerous shell patterns, prompt injection, hidden Unicode, exfiltration hosts, and GitHub Actions injection. See [docs/audit-checks.md](docs/audit-checks.md).

Plugins use commit-based versioning, so every merge to `main` is a new version.

## Further reading

- [docs/evolving-context-skills.md](docs/evolving-context-skills.md): a pattern for skills whose context grows over time.

## License

[MIT](LICENSE)
