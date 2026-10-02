import { readFileSync, readdirSync } from "node:fs";
import { join, relative, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SECRET_PATTERNS,
  DANGEROUS_CODE_PATTERNS,
  HIDDEN_UNICODE_PATTERNS,
  EXFIL_HOST_PATTERNS,
  PROMPT_INJECTION_PATTERNS,
  SENSITIVE_PATH_PATTERNS,
  OBFUSCATION_PATTERNS,
  WORKFLOW_INJECTION_PATTERNS,
} from "./patterns.mjs";

const AUDITOR_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const IGNORED_DIRECTORIES = new Set([".git", "node_modules"]);
const TEXT_FILE = /\.(mjs|js|ts|sh|bash|py|json|md|txt|ya?ml)$/;

const segments = (path) => path.split(/[/\\]/);
const isCode = (path) => /\.(mjs|js|ts|sh|bash|py)$/.test(path);
const isProse = (path) => /\.(md|txt)$/.test(path);
const isWorkflow = (path) => /\.github[/\\]workflows[/\\].+\.ya?ml$/.test(path);
const isManifest = (path) => /(?:^|[/\\])\.claude-plugin[/\\][^/\\]+\.json$/.test(path);
const always = () => true;

// "Model-facing" content = skill instructions + plugin/marketplace manifests: the text
// that reaches the model or ships to consumers. Repo meta-docs (README, docs/) are not
// model-facing, so instruction-style checks skip them — otherwise documenting the
// patterns would flag the documentation itself.
const isModelFacing = (path) =>
  (isProse(path) || path.endsWith(".json")) && (segments(path)[0] === "plugins" || isManifest(path));

// Each rule binds a pattern set to the file class it applies to and a severity.
// Add a check by adding a row — nothing else changes.
const SCAN_RULES = [
  { kind: "SECRET", severity: "fail", patterns: SECRET_PATTERNS, applies: always },
  { kind: "HIDDEN-UNICODE", severity: "fail", patterns: HIDDEN_UNICODE_PATTERNS, applies: always },
  { kind: "DANGEROUS", severity: "fail", patterns: DANGEROUS_CODE_PATTERNS, applies: isCode },
  { kind: "EXFIL", severity: "fail", patterns: EXFIL_HOST_PATTERNS, applies: isCode },
  { kind: "EXFIL", severity: "flag", patterns: EXFIL_HOST_PATTERNS, applies: isModelFacing },
  { kind: "PROMPT-INJECTION", severity: "flag", patterns: PROMPT_INJECTION_PATTERNS, applies: isModelFacing },
  { kind: "SENSITIVE-PATH", severity: "flag", patterns: SENSITIVE_PATH_PATTERNS, applies: isModelFacing },
  { kind: "OBFUSCATION", severity: "flag", patterns: OBFUSCATION_PATTERNS, applies: (path) => isCode(path) || isModelFacing(path) },
  { kind: "WORKFLOW-INJECTION", severity: "flag", patterns: WORKFLOW_INJECTION_PATTERNS, applies: isWorkflow },
];

const walkFiles = (directory, collected = []) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (IGNORED_DIRECTORIES.has(entry.name)) continue;
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) walkFiles(fullPath, collected);
    else collected.push(fullPath);
  }
  return collected;
};

// Scans repo text files for leaked secrets and risky content. The auditor's own
// module directory is skipped so its detection patterns never flag themselves.
export const scanContents = (findings, root) => {
  for (const file of walkFiles(root)) {
    if (file.startsWith(AUDITOR_DIRECTORY + sep)) continue;
    if (!TEXT_FILE.test(file)) continue;
    scanFile(findings, relative(root, file), readFileSync(file, "utf8"));
  }
};

const scanFile = (findings, path, contents) => {
  for (const rule of SCAN_RULES) {
    if (!rule.applies(path)) continue;
    for (const [pattern, label] of rule.patterns)
      if (pattern.test(contents)) findings[rule.severity](`${rule.kind}: ${label} in ${path}`);
  }
};
