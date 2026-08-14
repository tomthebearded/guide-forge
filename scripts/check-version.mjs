#!/usr/bin/env node
// check-version.mjs — verify the version stamps agree across the three files that carry one.
//
// Checks:
//   1. .claude-plugin/plugin.json "version" is the source of truth.
//   2. README.md badge token `vX.Y.Z` matches it.
//   3. CHANGELOG.md first *released* header `## [X.Y.Z]` matches it
//      (a leading `## [Unreleased]` block is allowed and skipped).
//
// Tagging is NOT checked here. The tag can only exist once the release commit does, so a check
// running on the push that introduces that commit could never see it — the arm failed structurally
// on every release rather than catching a real defect. `git push origin main v<x.y.z>` (CONTRIBUTING)
// is what keeps the two in step.
//
// Exits non-zero with "VERSION DRIFT:" + bullets on any mismatch; else "version ok: <v>".

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

function read(rel) {
  return readFileSync(path.join(ROOT, rel), 'utf8');
}

// 1. Source of truth.
let pluginVersion;
try {
  pluginVersion = JSON.parse(read('.claude-plugin/plugin.json')).version;
} catch (e) {
  console.error('VERSION DRIFT:\n  - cannot read .claude-plugin/plugin.json: ' + e.message);
  process.exit(1);
}
if (!pluginVersion || !/^\d+\.\d+\.\d+$/.test(pluginVersion)) {
  console.error('VERSION DRIFT:\n  - plugin.json version is missing or not semver: ' + pluginVersion);
  process.exit(1);
}

// 2. README badge. Anchor to the actual badge LINE (the one carrying `MIT License` + a version
// token), not the first `vX.Y.Z` token anywhere — a historical "upgrading from `v1.1.0`" mention
// earlier in the README would otherwise be read as the badge. Keep this anchor identical in
// release.mjs.
const readme = read('README.md');
const badgeLine = readme
  .split(/\r?\n/)
  .find((l) => /MIT License/.test(l) && /`v\d+\.\d+\.\d+`/.test(l));
const badgeMatch = badgeLine && badgeLine.match(/`v(\d+\.\d+\.\d+)`/);
if (!badgeMatch) {
  errors.push('README.md: no version badge token `vX.Y.Z` found on the badge line (with `MIT License`)');
} else if (badgeMatch[1] !== pluginVersion) {
  errors.push(`README.md badge is v${badgeMatch[1]} but plugin.json is ${pluginVersion}`);
}

// 3. CHANGELOG first released header (skip a leading [Unreleased]).
const changelog = read('CHANGELOG.md');
const relMatch = changelog.match(/^##\s*\[(\d+\.\d+\.\d+)\]/m);
if (!relMatch) {
  errors.push('CHANGELOG.md: no released version header `## [X.Y.Z]` found');
} else if (relMatch[1] !== pluginVersion) {
  errors.push(`CHANGELOG.md first released version is ${relMatch[1]} but plugin.json is ${pluginVersion}`);
}

if (errors.length) {
  console.error('VERSION DRIFT:');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

console.log('version ok: ' + pluginVersion);
process.exit(0);
