import { createFindings } from "./findings.mjs";
import { validateManifests } from "./manifests.mjs";
import { validateSkills } from "./skills.mjs";
import { auditComponents } from "./components.mjs";
import { scanContents } from "./content-scan.mjs";

// Runs every audit check against the marketplace at `root` and prints the result.
// Returns an exit code: 0 = clean (warnings allowed), 1 = blocking errors found.
export const runAudit = (root = process.cwd()) => {
  const findings = createFindings();

  const plugins = validateManifests(findings, root);
  for (const plugin of plugins) {
    validateSkills(findings, plugin);
    auditComponents(findings, plugin);
  }
  scanContents(findings, root);

  return report(findings);
};

const report = ({ errors, warnings }) => {
  for (const warning of warnings) console.log(`⚠ ${warning}`);
  for (const error of errors) console.error(`✖ ${error}`);
  if (errors.length) {
    console.error(`\n${errors.length} error(s) — audit failed.`);
    return 1;
  }
  console.log(`\n✔ audit passed${warnings.length ? ` (${warnings.length} warning(s) to review)` : ""}.`);
  return 0;
};
