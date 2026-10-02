#!/usr/bin/env node
// Entry point for the marketplace audit. Real logic lives in ./audit/.
// Usage: node scripts/audit.mjs [path-to-marketplace]   (defaults to cwd)
import { resolve } from "node:path";
import { runAudit } from "./audit/index.mjs";

process.exit(runAudit(resolve(process.argv[2] ?? ".")));
