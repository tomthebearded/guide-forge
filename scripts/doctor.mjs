#!/usr/bin/env node
// doctor.mjs — is the developer's INSTALLED plugin cache stale vs the working tree?
//
// Diagnostic only: always exits 0. It compares the working tree against the installed
// cache for the current plugin.json version and tells the dev to reinstall if they differ.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const version = JSON.parse(readFileSync(path.join(ROOT, '.claude-plugin/plugin.json'), 'utf8')).version;
const cacheBase = path.join(os.homedir(), '.claude', 'plugins', 'cache', 'guide-forge', 'guide-forge');
const cache = path.join(cacheBase, version);

if (!existsSync(cache)) {
  console.log(`No installed cache for guide-forge ${version} at:`);
  console.log('  ' + cache);
  let siblings = [];
  try {
    siblings = readdirSync(cacheBase).filter((n) => existsSync(path.join(cacheBase, n)));
  } catch {
    /* base dir absent too */
  }
  if (siblings.length) {
    console.log('Other installed version dirs found (possibly stale):');
    for (const s of siblings) console.log(`  - ${s}`);
  } else {
    console.log('No installed guide-forge cache found at all.');
  }
  process.exit(0);
}

// Compare each file IN THE CACHE (the published subset that's actually running) against the working
// tree — NOT the whole tree against the cache. The working tree also holds dev-only paths never
// published (scripts/, package.json, node_modules, tasks/); diffing the whole tree would
// flag all of them and report STALE even when every shipped file matches.
function walkFiles(dir, rel, acc) {
  for (const e of readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const r = rel ? path.join(rel, e.name) : e.name;
    if (e.isDirectory()) walkFiles(dir, r, acc);
    else if (e.isFile()) acc.push(r);
  }
}

// Normalize line endings before comparing: the cache is a copy, so trivial CRLF/LF differences
// aren't real staleness.
const norm = (buf) => buf.toString('utf8').replace(/\r\n/g, '\n');

const cacheFiles = [];
walkFiles(cache, '', cacheFiles);

const diffs = [];
for (const rel of cacheFiles) {
  const treePath = path.join(ROOT, rel);
  if (!existsSync(treePath)) {
    diffs.push(`- ${rel} (in cache, absent from working tree)`);
    continue;
  }
  if (norm(readFileSync(path.join(cache, rel))) !== norm(readFileSync(treePath))) {
    diffs.push(`~ ${rel} (differs)`);
  }
}

if (diffs.length) {
  console.log(
    `STALE: ${diffs.length} published file(s) differ between the installed cache and your working ` +
      `tree — run /plugin reinstall so the plugin reflects your edits:`,
  );
  // Every differing file, uncapped: this output is read once before a reinstall, and a truncated list
  // would mean re-running the command to see the rest.
  for (const d of diffs) console.log('  ' + d);
} else {
  console.log(`cache in sync (guide-forge ${version}, ${cacheFiles.length} published files checked)`);
}

process.exit(0);
