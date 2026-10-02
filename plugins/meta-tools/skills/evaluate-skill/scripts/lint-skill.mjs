#!/usr/bin/env node
// Deterministic checks for a single skill, per Anthropic's skill-building guide.
// Usage: node lint-skill.mjs <skill-directory>
import { existsSync, readFileSync } from "node:fs";
import { join, basename } from "node:path";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DESCRIPTION_MAX = 1024;
const SKILL_WORD_MAX = 5000;

const results = [];
const record = (status, label, fix) => results.push({ status, label, fix: status === "PASS" ? "" : fix });
const must = (label, ok, fix) => record(ok ? "PASS" : "FAIL", label, fix);
const should = (label, ok, fix) => record(ok ? "PASS" : "WARN", label, fix);

const lintName = (front, folder) => {
  const name = (front.match(/^name:\s*(.+)$/m)?.[1] || "").trim();
  must("name present", !!name, "add a name: field");
  if (!name) return;
  must("name is kebab-case", KEBAB.test(name), `rename "${name}" using lowercase + hyphens`);
  must("name avoids reserved words", !/(claude|anthropic)/i.test(name), "names cannot contain claude/anthropic");
  should("name matches folder", name === folder, `name "${name}" should match folder "${folder}"`);
};

// Reads the description value, handling inline text and YAML block scalars
// (`description: >` / `|`), where the content is the indented lines that follow.
const extractDescription = (front) => {
  const lines = front.split("\n");
  const index = lines.findIndex((line) => /^description:/.test(line));
  if (index === -1) return "";
  const inline = lines[index].replace(/^description:\s*/, "");
  if (!/^[>|][+-]?\s*$/.test(inline)) return inline.replace(/^["']|["']$/g, "").trim();
  const body = [];
  for (let i = index + 1; i < lines.length && /^(\s|$)/.test(lines[i]); i += 1) body.push(lines[i].trim());
  return body.join(" ").trim();
};

const lintDescription = (front) => {
  const description = extractDescription(front);
  must("description present", !!description, "add a description: field stating what + when");
  if (!description) return;
  must(`description under ${DESCRIPTION_MAX} chars`, description.length < DESCRIPTION_MAX, `trim it (${description.length} chars)`);
  must("description has no XML tags", !/[<>]/.test(description), "remove < and > characters");
  should("description states WHEN to use", /\b(when|use for)\b/i.test(description), 'state trigger conditions ("Use when the user ...")');
};

const lintSkillFile = (text, folder) => {
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---/);
  must("frontmatter has --- delimiters", !!frontmatter, "wrap the YAML block in --- ... ---");
  const front = frontmatter ? frontmatter[1] : "";
  lintName(front, folder);
  lintDescription(front);
  const words = text.replace(/```[\s\S]*?```/g, " ").split(/\s+/).filter(Boolean).length;
  should("SKILL.md under 5000 words", words < SKILL_WORD_MAX, `move detail to references/ (about ${words} words)`);
};

const lintSkill = (skillDir) => {
  const folder = basename(skillDir);
  must("folder is kebab-case", KEBAB.test(folder), `rename "${folder}" using lowercase + hyphens`);
  must("no README.md in skill folder", !existsSync(join(skillDir, "README.md")), "move docs into SKILL.md or references/");
  const skillFile = join(skillDir, "SKILL.md");
  const exists = existsSync(skillFile);
  must("SKILL.md exists (exact case)", exists, "file must be named exactly SKILL.md");
  if (exists) lintSkillFile(readFileSync(skillFile, "utf8"), folder);
};

const report = () => {
  const width = Math.max(...results.map((result) => result.label.length));
  for (const result of results)
    console.log(`[${result.status}] ${result.label.padEnd(width)}${result.fix ? "  -> " + result.fix : ""}`);
  const fails = results.filter((result) => result.status === "FAIL").length;
  const warns = results.filter((result) => result.status === "WARN").length;
  console.log(`\n${fails} fail, ${warns} warn`);
  return fails ? 1 : 0;
};

const skillDir = (process.argv[2] || "").replace(/\/+$/, "");
if (!skillDir) {
  console.error("usage: lint-skill.mjs <skill-directory>");
  process.exit(2);
}
lintSkill(skillDir);
process.exit(report());
