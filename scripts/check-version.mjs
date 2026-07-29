#!/usr/bin/env node
// check-version.mjs — verify version stamps agree AND that a released version is real (tagged).
//
// Checks:
//   1. .claude-plugin/plugin.json "version" is the source of truth.
//   2. README.md badge token `vX.Y.Z` matches it.
//   3. CHANGELOG.md first *released* header `## [X.Y.Z]` matches it
//      (a leading `## [Unreleased]` block is allowed and skipped).
//   4. Git-tag arm: if this is a git repo, a tag `vX.Y.Z` or `X.Y.Z` must exist
//      (catches a "released" version that was never tagged/shipped). No git -> warn only.
//
// Exits non-zero with "VERSION DRIFT:" + bullets on any mismatch; else "version ok: <v>".

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
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

// 4. Git-tag arm.
let tags = null;
try {
  execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: ROOT, stdio: 'pipe' });
  tags = execFileSync('git', ['tag'], { cwd: ROOT, stdio: 'pipe' })
    .toString()
    .split(/\r?\n/)
    .map((t) => t.trim())
    .filter(Boolean);
} catch {
  tags = null; // not a git repo, or git unavailable
}

if (tags === null) {
  console.log('warning: no git — skipping the released-version tag check');
} else {
  const wanted = [`v${pluginVersion}`, pluginVersion];
  if (!tags.some((t) => wanted.includes(t))) {
    errors.push(`No git tag for ${pluginVersion} — released version was never tagged/shipped`);
  }
}

if (errors.length) {
  console.error('VERSION DRIFT:');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

console.log('version ok: ' + pluginVersion);
process.exit(0);
