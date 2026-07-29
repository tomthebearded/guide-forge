#!/usr/bin/env node
// release.mjs — the ONLY intended way the version moves.
//
//   node scripts/release.mjs <newversion> [date]
//
// Updates: plugin.json version, README `vX.Y.Z` badge token, and renames the top
// `## [Unreleased]` CHANGELOG header to `## [<newversion>] — <date>`.
// Never commits or tags — it prints what changed and reminds you to tag yourself.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const newVersion = process.argv[2];
const date = process.argv[3] || process.env.RELEASE_DATE || new Date().toISOString().slice(0, 10);

if (!newVersion || !/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error('usage: node scripts/release.mjs <newversion X.Y.Z> [YYYY-MM-DD]');
  console.error('  (got: ' + (newVersion ?? '<nothing>') + ')');
  process.exit(1);
}

const p = (rel) => path.join(ROOT, rel);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Read all three files, compute every edit in memory, VALIDATE, then write all-or-none. A partial
// write (bump plugin.json, then fail on README) would leave the repo half-released, so nothing is
// written until every edit is known-good. Idempotent: re-running with a version already applied is
// a no-op per file, not an error (distinguishes "pattern absent" from "value already current").
const pluginPath = p('.claude-plugin/plugin.json');
const readmePath = p('README.md');
const clPath = p('CHANGELOG.md');

const pluginRaw = readFileSync(pluginPath, 'utf8');
const readmeRaw = readFileSync(readmePath, 'utf8');
const clRaw = readFileSync(clPath, 'utf8');

const errors = [];
const writes = [];
const changed = [];

// 1. plugin.json version.
const verRe = /("version"\s*:\s*")(\d+\.\d+\.\d+)(")/;
const pm = pluginRaw.match(verRe);
if (!pm) {
  errors.push('plugin.json: no "version" field found');
} else {
  writes.push([pluginPath, pluginRaw.replace(verRe, `$1${newVersion}$3`)]);
  changed.push(
    pm[2] === newVersion
      ? `.claude-plugin/plugin.json: already ${newVersion} (unchanged)`
      : `.claude-plugin/plugin.json: ${pm[2]} -> ${newVersion}`,
  );
}

// 2. README badge — anchored to the `MIT License` badge line (identical anchor to check-version.mjs),
// not the first `vX.Y.Z` token anywhere (which could be a historical mention).
const lines = readmeRaw.split(/\r?\n/);
const badgeIdx = lines.findIndex((l) => /MIT License/.test(l) && /`v\d+\.\d+\.\d+`/.test(l));
if (badgeIdx === -1) {
  errors.push('README.md: no badge line (`MIT License` + `vX.Y.Z`) found');
} else {
  lines[badgeIdx] = lines[badgeIdx].replace(/`v\d+\.\d+\.\d+`/, `\`v${newVersion}\``);
  writes.push([readmePath, lines.join('\n')]);
  changed.push(`README.md: badge -> v${newVersion}`);
}

// 3. CHANGELOG: promote `## [Unreleased]` -> `## [<newversion>] — <date>` and re-seed a fresh empty
// `## [Unreleased]` above it. If a `## [<newversion>]` header already exists, the release already
// happened — skip without error (idempotent; avoids a duplicate header on a re-run).
const unreleasedRe = /^##\s*\[Unreleased\][^\n]*$/m;
if (new RegExp(`^##\\s*\\[${escapeRe(newVersion)}\\]`, 'm').test(clRaw)) {
  changed.push(`CHANGELOG.md: already has [${newVersion}] (unchanged)`);
} else if (unreleasedRe.test(clRaw)) {
  writes.push([clPath, clRaw.replace(unreleasedRe, `## [Unreleased]\n\n## [${newVersion}] — ${date}`)]);
  changed.push(`CHANGELOG.md: [Unreleased] -> [${newVersion}] — ${date} (fresh [Unreleased] re-seeded)`);
} else {
  errors.push('CHANGELOG.md: no `## [Unreleased]` header to promote');
}

if (errors.length) {
  console.error('release aborted — NOTHING written:');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

// Every edit validated — now write (all-or-none).
for (const [fp, content] of writes) writeFileSync(fp, content);

console.log('Released ' + newVersion + '. Changed:');
for (const c of changed) console.log('  - ' + c);
console.log('');
console.log('NOT committed or tagged (by design). Next steps you run yourself:');
console.log('  git add -A && git commit -m "release ' + newVersion + '"');
console.log('  git tag v' + newVersion);
console.log('  git push && git push --tags');
process.exit(0);
