// Detection patterns. These are scanned AGAINST other files - never executed.
// The content scanner skips this whole directory, so the auditor never flags itself.
// Each entry is [regExp, humanLabel]. Severity + file scope are bound in content-scan.mjs.

// Leaked credentials committed to the repo. (Subset of gitleaks' high-confidence keys.)
export const SECRET_PATTERNS = [
  [/AKIA[0-9A-Z]{16}/, "AWS access key"],
  [/gh[pousr]_[A-Za-z0-9]{20,}/, "GitHub token"],
  [/sk-[A-Za-z0-9]{20,}/, "API key (sk-...)"],
  [/sk_live_[0-9a-zA-Z]{24}/, "Stripe live key"],
  [/AIza[0-9A-Za-z_-]{35}/, "Google API key"],
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, "private key"],
  [/xox[baprs]-[A-Za-z0-9-]{10,}/, "Slack token"],
];

// Code that fetches and runs remote payloads or opens reverse shells.
export const DANGEROUS_CODE_PATTERNS = [
  [/curl\s+[^|]*\|\s*(?:ba)?sh/, "curl | sh (remote code execution)"],
  [/wget\s+[^|]*\|\s*(?:ba)?sh/, "wget | sh (remote code execution)"],
  [/\beval\s*\(/, "eval()"],
  [/child_process|execSync|spawnSync/, "shell execution"],
  [/rm\s+-rf\s+[~/]/, "destructive rm -rf"],
  [/\/dev\/(?:tcp|udp)\//, "/dev/tcp|udp reverse shell"],
  [/\b(?:nc|netcat)\s+-[a-z]*e\b/, "netcat -e reverse shell"],
  [/\bbash\s+-i\b/, "interactive reverse shell (bash -i)"],
  [/0>&1\b/, "reverse-shell redirect (0>&1)"],
  [/(?:cat|less|head)\s+[^\n]*(?:\.env|\.ssh|id_rsa|credentials)/, "reading secrets/credentials"],
];

// Hidden text used to smuggle instructions past a human reviewer
// (zero-width spaces, bidi overrides, word-joiner, BOM). Built from code points
// so this file stays plain ASCII and never contains the characters it detects.
const HIDDEN_CODE_POINTS = [0x200b, 0x200c, 0x200d, 0x200e, 0x200f, 0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2060, 0xfeff];
const HIDDEN_UNICODE = new RegExp(`[${HIDDEN_CODE_POINTS.map((codePoint) => String.fromCharCode(codePoint)).join("")}]`);
export const HIDDEN_UNICODE_PATTERNS = [[HIDDEN_UNICODE, "hidden / zero-width / bidi Unicode"]];

// Hosts commonly used to relay or exfiltrate data. FAIL in code, WARN in prose.
export const EXFIL_HOST_PATTERNS = [
  [/https?:\/\/(?:[a-z0-9-]+\.)*(?:webhook\.site|requestbin\.\w+|burpcollaborator\.\w+|pipedream\.net|transfer\.sh|0x0\.st)/i, "data relay / exfil host"],
  [/https?:\/\/(?:[a-z0-9-]+\.)*(?:ngrok\.(?:io|app)|pastebin\.com|hastebin\.com)/i, "tunneling / paste host"],
  [/https?:\/\/\d{1,3}(?:\.\d{1,3}){3}\b/, "raw IP URL"],
];

// Instruction-subversion markers in skill / agent / tool-description prose.
export const PROMPT_INJECTION_PATTERNS = [
  [/ignore\s+(?:all\s+|the\s+|your\s+)?(?:previous|prior|above|earlier|preceding)\s+(?:instructions|prompts|context|rules)/i, "instruction override"],
  [/disregard\s+(?:the\s+)?(?:system\s+prompt|previous\s+instructions|everything\s+above)/i, "instruction override"],
  [/do\s+not\s+(?:tell|mention|inform|reveal|notify)\b[^.\n]{0,24}\buser/i, "action hidden from the user"],
  [/\b(?:secretly|silently|covertly)\s+(?:send|upload|post|transmit|exfiltrate)/i, "covert exfiltration"],
  [/<\/?(?:IMPORTANT|SYSTEM)>/, "fake system pseudo-tag"],
];

// References to credential file paths - an MCP / tool-poisoning signal.
export const SENSITIVE_PATH_PATTERNS = [
  [/~\/\.ssh\/id_[a-z]+/i, "SSH private key path"],
  [/~\/\.aws\/credentials/i, "AWS credentials path"],
  [/~\/\.(?:cursor|claude|config)\/[^\s"']*mcp\.json/i, "MCP config path"],
];

// Long opaque blobs that may hide a payload.
export const OBFUSCATION_PATTERNS = [
  [/[A-Za-z0-9+/]{220,}={0,2}/, "long base64 blob"],
  [/(?:\\x[0-9a-fA-F]{2}){20,}/, "long hex-escaped blob"],
];

// Untrusted GitHub event data interpolated into a workflow (Actions injection).
export const WORKFLOW_INJECTION_PATTERNS = [
  [/\$\{\{\s*github\.(?:event\.(?:issue|pull_request|comment|review|review_comment|pages|commits|head_commit|discussion)[.\w]*|head_ref)\s*\}\}/, "github.event.* in workflow - confirm it is not in a run: step"],
];
