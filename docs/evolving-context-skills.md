# Evolving-context & self-updating skills

A pattern for skills whose context grows over time and is shared across the team —
the "option 3" from our design discussion. This is a sketch, **not yet built**.

## Three levels of skill memory

| Level             | Mechanism                | Scope        | Survives updates? |
| ----------------- | ------------------------ | ------------ | ----------------- |
| Stateless         | none (default)           | per run      | n/a               |
| Per-user          | `${CLAUDE_PLUGIN_DATA}`  | one machine  | yes               |
| Shared + evolving | external store + PR loop | whole team   | yes               |

`${CLAUDE_PLUGIN_DATA}` is a persistent directory Claude Code keeps across plugin
updates. A skill's scripts can read/write it for local memory. It is **not** shared
between teammates.

## Shared + evolving (the real ask)

Split a skill into two halves:

```
plugins/<plugin>/skills/<skill>/
  SKILL.md       # stable instructions — reviewed, changes rarely
  context.md     # accumulated learnings/examples — append-mostly, grows over time
```

- **Read path:** `SKILL.md` references `context.md`; the skill loads it each run.
- **Write path (the "auto-update"):** when the skill learns something useful, it
  appends to `context.md` and opens a PR to this marketplace. The same CI gate
  (`scripts/audit.mjs`) runs on it.
- **Propagation:** merge → consumers pull it via auto-update (commit-based versioning).

## The self-improving loop

```
run skill → capture a learning (what worked / failed)
          → append to context.md
          → open PR  ──►  CI audit  ──►  review / merge
          → next runs load the improved context
```

## Guardrails

- **Gate the write path.** Never let a skill mutate shared context unreviewed — route
  it through a PR so the audit (and optionally a human) sees it. Stops context poisoning.
- **Keep instructions and context separate.** `SKILL.md` stays clean and reviewed;
  `context.md` is the append-mostly memory.
- **No secrets / PII in context.** The audit scans for secrets and will fail the PR.
- **Timestamp + diff entries** so you can see what changed and roll back.
- **Cap growth.** Periodically distil `context.md` so it does not bloat the prompt.

## Where the store could live

- In-repo `context.md` — simplest, versioned, CI-gated. Recommended start.
- Notion page / DB / Langfuse dataset — if the context is large or cross-tool. The
  skill reads via API; the "commit back" becomes an API write, and you still PR a
  pointer/summary so the team sees the change.

## Status

Not implemented. Build when a specific skill needs it — e.g. `create-tickets` learning
your team's ticket conventions, or `critique-spec` accumulating a shared rubric.
