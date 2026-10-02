import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SEMVER_PREFIX = /^\d+\.\d+\.\d+/;
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

// Validates marketplace.json and every referenced plugin.json. Returns the
// discovered local plugins as { name, directory, manifest } for skill/component checks.
export const validateManifests = (findings, root) => {
  const marketplacePath = join(root, ".claude-plugin", "marketplace.json");
  if (!existsSync(marketplacePath)) {
    findings.fail("missing .claude-plugin/marketplace.json");
    return [];
  }
  const marketplace = readJson(marketplacePath);
  validateMarketplaceFields(findings, marketplace);
  if (!Array.isArray(marketplace.plugins)) {
    findings.fail("marketplace.json: plugins must be an array");
    return [];
  }
  return collectLocalPlugins(findings, root, marketplace.plugins);
};

const validateMarketplaceFields = (findings, marketplace) => {
  if (!marketplace.name) findings.fail("marketplace.json: missing name");
  else if (!KEBAB_CASE.test(marketplace.name))
    findings.fail(`marketplace.json: name "${marketplace.name}" is not kebab-case`);
  if (!marketplace.owner?.name) findings.fail("marketplace.json: missing owner.name");
};

const collectLocalPlugins = (findings, root, pluginEntries) => {
  const plugins = [];
  const seenNames = new Set();
  for (const entry of pluginEntries) {
    const plugin = resolvePluginEntry(findings, root, entry, seenNames);
    if (plugin) plugins.push(plugin);
  }
  return plugins;
};

const resolvePluginEntry = (findings, root, entry, seenNames) => {
  if (!entry.name) {
    findings.fail("plugin entry: missing name");
    return null;
  }
  if (!KEBAB_CASE.test(entry.name)) findings.fail(`plugin "${entry.name}": name is not kebab-case`);
  if (seenNames.has(entry.name)) findings.fail(`duplicate plugin name "${entry.name}"`);
  seenNames.add(entry.name);
  return resolveLocalSource(findings, root, entry);
};

// Remote sources (github/npm/url) are fetched + validated by Claude Code at install;
// here we only resolve local relative-path plugins that live inside this repo.
const resolveLocalSource = (findings, root, entry) => {
  if (typeof entry.source !== "string") return null;
  if (entry.source.includes("..")) {
    findings.fail(`plugin "${entry.name}": source contains ".."`);
    return null;
  }
  const directory = join(root, entry.source);
  if (!existsSync(directory)) {
    findings.fail(`plugin "${entry.name}": source "${entry.source}" not found`);
    return null;
  }
  const manifest = validatePluginManifest(findings, entry.name, directory);
  return { name: entry.name, directory, manifest };
};

const validatePluginManifest = (findings, name, directory) => {
  const manifestPath = join(directory, ".claude-plugin", "plugin.json");
  if (!existsSync(manifestPath)) {
    findings.flag(`plugin "${name}": no plugin.json`);
    return null;
  }
  const manifest = readJson(manifestPath);
  if (!manifest.name) findings.fail(`${name}/plugin.json: missing name`);
  if (manifest.version && !SEMVER_PREFIX.test(manifest.version))
    findings.flag(`${name}/plugin.json: version "${manifest.version}" is not semver`);
  return manifest;
};
