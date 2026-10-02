# Audit checks

What `scripts/audit/` enforces on every PR. **FAIL** blocks the merge; **WARN** is
surfaced for human review and never blocks.

## Module layout

| Module             | Responsibility                                                  |
| ------------------ | --------------------------------------------------------------- |
| `index.mjs`        | orchestrates the checks, prints results, returns the exit code  |
| `findings.mjs`     | collects errors (`fail`) and warnings (`flag`)                  |
| `manifests.mjs`    | marketplace.json + plugin.json schema, kebab-case, `..` blocking |
| `skills.mjs`       | every skill has a `SKILL.md` with a `description`               |
| `components.mjs`   | flags hooks / MCP servers for sign-off                          |
| `content-scan.mjs` | walks text files and applies the pattern rules                  |
| `patterns.mjs`     | the detection patterns (single source of truth)                 |

## Checks

| Check                                                                              | Severity                    | Scope        |
| --------------------------------------------------------------------------------- | --------------------------- | ------------ |
| Leaked secrets (AWS, GitHub, Stripe, Google, Slack, private keys)                 | FAIL                        | all text     |
| Dangerous code (`curl\|sh`, `eval`, `/dev/tcp`, `bash -i`, `0>&1`, `nc -e`)        | FAIL                        | scripts      |
| Hidden / zero-width / bidi Unicode                                                | FAIL                        | all text     |
| Exfil hosts (webhook.site, ngrok, pastebin, raw IPs)                              | FAIL in code / WARN in prose | text         |
| Prompt injection (override, hide-from-user, covert exfil, fake `<SYSTEM>` tags)   | WARN                        | prose + JSON |
| Credential-path references (`~/.ssh/id_rsa`, `~/.aws/credentials`, `mcp.json`)    | WARN                        | prose + JSON |
| GitHub Actions injection (`github.event.*` in a workflow)                         | WARN                        | workflows    |
| Obfuscation (long base64 / hex blobs)                                             | WARN                        | code + prose |

Instruction-style checks (prompt-injection, credential paths, obfuscation, prose exfil
hosts) run only on **model-facing content** — skill files under `plugins/` and plugin /
marketplace manifests — not on repo docs like this one. Secrets, dangerous code, and
hidden Unicode are scanned everywhere.

Hooks and MCP servers are legitimate but high-impact, so they are flagged for a human
sign-off (via CODEOWNERS) rather than blocked.

## Why prompt-injection is WARN, not FAIL

Our own skills (`review-pr`, `code-health`) perform security review and may legitimately
quote phrases like "ignore previous instructions". Auto-blocking would break them, so
instruction-subversion is surfaced for a human to judge instead.

## Sources

Patterns adapted from [gitleaks](https://github.com/gitleaks/gitleaks),
[mcp-scan / Invariant Labs](https://github.com/invariantlabs-ai/mcp-scan),
[GitHub Security Lab](https://securitylab.github.com/resources/github-actions-untrusted-input/),
Anthropic's `security-guidance` plugin, and skill-security write-ups (Repello, PolicyLayer).

## Run it

```bash
node scripts/audit.mjs             # audit the current directory
node scripts/audit.mjs /some/path  # audit another checkout
```
