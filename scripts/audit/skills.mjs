import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const FRONTMATTER = /^---\n([\s\S]*?)\n---/;
const HAS_DESCRIPTION = /\bdescription:\s*\S/;

// Every skill in a plugin must have a SKILL.md with `description` frontmatter —
// the description is what Claude uses to decide when to invoke the skill.
export const validateSkills = (findings, plugin) => {
  const skillsDirectory = join(plugin.directory, "skills");
  if (!existsSync(skillsDirectory)) return;
  for (const entry of readdirSync(skillsDirectory, { withFileTypes: true })) {
    if (entry.isDirectory()) validateSkill(findings, plugin.name, join(skillsDirectory, entry.name), entry.name);
  }
};

const validateSkill = (findings, pluginName, skillDirectory, skillName) => {
  const skillFile = join(skillDirectory, "SKILL.md");
  if (!existsSync(skillFile)) {
    findings.fail(`${pluginName}/${skillName}: missing SKILL.md`);
    return;
  }
  validateFrontmatter(findings, `${pluginName}/${skillName}/SKILL.md`, readFileSync(skillFile, "utf8"));
};

const validateFrontmatter = (findings, label, contents) => {
  const frontmatter = contents.match(FRONTMATTER);
  if (!frontmatter) {
    findings.fail(`${label}: missing YAML frontmatter`);
    return;
  }
  if (!HAS_DESCRIPTION.test(frontmatter[1]))
    findings.fail(`${label}: frontmatter missing required "description"`);
};
