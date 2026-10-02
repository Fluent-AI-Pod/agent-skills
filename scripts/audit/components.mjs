import { existsSync } from "node:fs";
import { join } from "node:path";

// Flags powerful components that warrant a human sign-off before merge. Hooks and
// MCP servers are legitimate but high-impact (auto-execution / external connections),
// so they are surfaced as warnings rather than silently allowed.
export const auditComponents = (findings, { name, directory, manifest }) => {
  if (manifest?.hooks || existsSync(join(directory, "hooks", "hooks.json")))
    findings.flag(`SIGN-OFF: plugin "${name}" declares HOOKS — auto-runs on events, needs human review`);
  if (manifest?.mcpServers || existsSync(join(directory, ".mcp.json")))
    findings.flag(`SIGN-OFF: plugin "${name}" declares MCP servers — external connections, needs human review`);
};
