#!/usr/bin/env node
// check-consistency.mjs — deterministic structural checks over the plugin repo.
//
// Facts are derived from the filesystem (skill folders, prompt.md presence, link targets)
// so the checks stay correct as skills/rules change. Exits 1 if any finding, else "consistency ok".

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const findings = [];

function read(abs) {
  return readFileSync(abs, 'utf8');
}
function isDir(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

// --- Discover skill folders (dirs containing SKILL.md). ---------------------------------------
const SKILLS_DIR = path.join(ROOT, 'skills');
const skillNames = readdirSync(SKILLS_DIR).filter((n) =>
  existsSync(path.join(SKILLS_DIR, n, 'SKILL.md')),
);

// --- Check 1: frontmatter `name:` equals folder name. -----------------------------------------
for (const name of skillNames) {
  const skillMd = read(path.join(SKILLS_DIR, name, 'SKILL.md'));
  const fm = skillMd.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const nameLine = fm && fm[1].match(/^name:\s*(.+?)\s*$/m);
  if (!nameLine) {
    findings.push(`[frontmatter] skills/${name}/SKILL.md has no \`name:\` in frontmatter`);
  } else if (nameLine[1] !== name) {
    findings.push(
      `[frontmatter] skills/${name}/SKILL.md name is "${nameLine[1]}" but folder is "${name}"`,
    );
  }
}

// --- Check 2: a skill with a prompt.md must inline it via the cat-injection line. -------------
const INJECT = '!`cat "${CLAUDE_SKILL_DIR}/prompt.md"`';
for (const name of skillNames) {
  const hasPrompt = existsSync(path.join(SKILLS_DIR, name, 'prompt.md'));
  if (!hasPrompt) continue; // self-contained skill (e.g. pre-pr-check) — nothing to inline
  const skillMd = read(path.join(SKILLS_DIR, name, 'SKILL.md'));
  if (!skillMd.includes(INJECT)) {
    findings.push(
      `[inject] skills/${name}/SKILL.md has a prompt.md but is missing the cat-injection line`,
    );
  }
}

// --- Check 3: stated skill count (near the word "skills") matches the folder count. -----------
// The word list is complete for 1–99, not a hand-picked window: a repo that grows past an arbitrary ceiling
// must not silently stop being checked.
const UNITS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19,
};
const TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
// "twenty-one" / "twenty one" / "twenty" / "seven" / "42" — anything a human would plausibly write.
const NUMWORD_SRC = `(?:${Object.keys(TENS).join('|')})(?:[- ](?:${Object.keys(UNITS).slice(0, 9).join('|')}))?|${Object.keys(UNITS).join('|')}|\\d+`;
function parseCount(raw) {
  const s = raw.toLowerCase().trim();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const [tens, unit] = s.split(/[- ]/);
  if (TENS[tens] !== undefined) return TENS[tens] + (unit ? UNITS[unit] ?? 0 : 0);
  return UNITS[s];
}
const actualCount = skillNames.length;
// Only match a number DIRECTLY adjacent to "skills" (lenient, avoids false positives).
const countRe = new RegExp(`\\b(${NUMWORD_SRC})\\s+skills\\b`, 'gi');
for (const rel of ['README.md', '.claude-plugin/marketplace.json']) {
  const txt = read(path.join(ROOT, rel));
  let m;
  while ((m = countRe.exec(txt))) {
    const stated = parseCount(m[1]);
    if (Number.isFinite(stated) && stated !== actualCount) {
      findings.push(
        `[skill-count] ${rel} states "${m[1]} skills" but there are ${actualCount} skill folders`,
      );
    }
  }
}

// --- Check 3b: rule-id integrity + every rule reference resolves. -----------------------------
// The docs deliberately do NOT advertise a principle *count* — the principles are cited by id (P1…Pn,
// rules `N.N`), never counted in prose, so there is no number to keep in sync and no count check here.
// What must hold is that every id cited anywhere resolves to a real heading in the canonical file.
const rulesFile = path.join(ROOT, 'reference', 'pedagogy-rules.md');
if (existsSync(rulesFile)) {
  const rulesTxt = read(rulesFile);
  // Files that cite rule ids. (CHANGELOG/CONTRIBUTING excluded: historical entries legitimately cite
  // ids from older revisions of the contract.)
  const CITING_FILES = [
    'README.md', 'EXPLAINER.md', 'reference/pedagogy-rules.md',
    'templates/step.md', 'templates/verify.md',
  ];
  for (const name of skillNames) {
    for (const f of ['SKILL.md', 'prompt.md']) {
      const rel = `skills/${name}/${f}`;
      if (existsSync(path.join(ROOT, rel))) CITING_FILES.push(rel);
    }
  }
  // Guard every read: a base file being renamed/deleted should surface as a finding elsewhere, not
  // crash this script with an uncaught ENOENT.
  const presentFiles = CITING_FILES.filter((rel) => existsSync(path.join(ROOT, rel)));

  // Catches a mis-mapped or dangling id (e.g. "rule 3.9" that doesn't exist, a duplicate heading, or a
  // rule whose principle prefix has no `## P#` header) — the exact failure mode of a hand-applied
  // re-home. Canonical rule headings look like `### 1.1 — …`.
  const ruleIdList = (rulesTxt.match(/^###\s+(\d+\.\d+)\s+—/gm) || []).map((h) => h.match(/(\d+\.\d+)/)[1]);
  const ruleIds = new Set(ruleIdList);
  const principleNums = new Set(
    (rulesTxt.match(/^##\s+P(\d+)\s+—/gm) || []).map((h) => h.match(/P(\d+)/)[1]),
  );
  if (ruleIdList.length !== ruleIds.size) {
    findings.push('[rule-id] reference/pedagogy-rules.md has duplicate rule-id headings');
  }
  for (const id of ruleIds) {
    if (!principleNums.has(id.split('.')[0])) {
      findings.push(`[rule-id] pedagogy-rules.md rule ${id} has no matching principle header P${id.split('.')[0]}`);
    }
  }
  // Every rule reference across the plugin's own docs must resolve to a real canonical id. Cover the
  // three citation forms actually used: `rule 3.1`; a plural/range list `rules 2.1, 3.1, 4.1` /
  // `rule 3.1–3.5`; and the audit enumeration's bare parenthetical `(1.1)`. (A trailing clause letter
  // like `1.1c` is fine — only the `N.N` is checked.) Bare `(N.N)` is safe in these files: every
  // paren-wrapped dotted number here is a rule id, not a version/decimal.
  const listRe = /\brules?\s+(\d+\.\d+[a-z]?(?:\s*(?:,|and|&|\/|–|-)\s*\d+\.\d+[a-z]?)*)/gi;
  const parenRe = /\((\d+\.\d+)[a-z]?\)/g;
  const idRe = /\d+\.\d+/g;
  for (const rel of presentFiles) {
    const txt = read(path.join(ROOT, rel));
    const reported = new Set();
    const check = (id) => {
      if (!ruleIds.has(id) && !reported.has(id)) {
        reported.add(id);
        findings.push(`[rule-id] ${rel} references rule ${id} — not a rule in reference/pedagogy-rules.md`);
      }
    };
    let r;
    while ((r = listRe.exec(txt))) for (const id of r[1].match(idRe) || []) check(id);
    while ((r = parenRe.exec(txt))) check(r[1]);
  }

  // --- Check 3c: the contract mirrors enumerate EVERY canonical rule. -------------------------
  // Check 3b proves the forward direction — every id cited somewhere resolves to a real rule. This
  // one proves the reverse, which is the failure the sync set actually produces: a rule added or
  // re-homed in the canonical file and then missed in one of the standalone paste-twins, which keeps
  // passing every other check while silently teaching an older contract.
  //
  // Only files that claim to enumerate the WHOLE contract are listed. README.md and the templates
  // cite rules selectively by design (a storefront summary, a per-section reminder), so requiring
  // full coverage there would be wrong. Coverage is deliberately measured with a permissive scan for
  // any `N.N` token rather than the strict citation forms of check 3b: the mirrors legitimately write
  // ids as `**1.1** explain …` with no `rule` prefix and no parentheses. A stray decimal can only make
  // this check MORE lenient (a false pass), never fail a mirror that is actually complete.
  const CONTRACT_MIRRORS = [
    'skills/plan-guide/prompt.md',
    'skills/draft-milestone/prompt.md',
    'skills/clarify-step/prompt.md',
    'skills/audit-guide/prompt.md',
    'EXPLAINER.md',
  ];
  for (const rel of CONTRACT_MIRRORS) {
    const abs = path.join(ROOT, rel);
    if (!existsSync(abs)) {
      findings.push(`[rule-coverage] ${rel} is listed as a contract mirror but does not exist`);
      continue;
    }
    const mentioned = new Set(read(abs).match(/\d+\.\d+/g) || []);
    const missing = [...ruleIds].filter((id) => !mentioned.has(id)).sort();
    if (missing.length) {
      findings.push(
        `[rule-coverage] ${rel} never mentions rule${missing.length > 1 ? 's' : ''} ${missing.join(', ')} — the contract mirrors must each state the whole contract (see the sync set in reference/pedagogy-rules.md)`,
      );
    }
  }
}

// --- Check 3d: package.json must NOT carry a version, and must keep its `test` script. --------
// The version already lives in three places (plugin.json, README badge, top CHANGELOG header) and
// release.mjs moves all three atomically. A fourth copy here would be invisible to release.mjs and
// silently drift, so the repo's package.json is `private` and version-less by design. The `test`
// script is what CONTRIBUTING and /pre-pr-check tell contributors to run — losing it breaks the gate.
const pkgPath = path.join(ROOT, 'package.json');
if (existsSync(pkgPath)) {
  let pkg = null;
  try {
    pkg = JSON.parse(read(pkgPath));
  } catch {
    findings.push('[package] package.json is not valid JSON');
  }
  if (pkg && pkg.version !== undefined) {
    findings.push(
      `[package] package.json declares "version": "${pkg.version}" — a fourth version stamp release.mjs does not update. Remove it (the package is private).`,
    );
  }
  if (pkg && !pkg.scripts?.test) {
    findings.push('[package] package.json has no "test" script, but CONTRIBUTING tells contributors to run `npm test`');
  }
}

// --- Check 4: dead relative markdown links + dead #anchors. -----------------------------------
// The anchor half is the same discipline the guide contract demands of generated guides: a step's
// glossary block deep-links `../glossary.md#slug`, and a term written as a bullet instead of a
// `### heading` has no anchor, so the link silently lands at the top of the page instead of failing
// loudly. This repo asks for that and shipped its own anchors unverified; now both are checked.
const DOC_DIRS = ['skills', 'reference', 'templates', 'examples'];
const ROOT_DOCS = ['README.md', 'EXPLAINER.md', 'CONTRIBUTING.md', 'CHANGELOG.md'];

function walkMd(dir, acc) {
  if (!isDir(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      walkMd(full, acc);
    } else if (entry.name.toLowerCase().endsWith('.md')) {
      acc.push(full);
    }
  }
}

const mdFiles = [];
for (const d of DOC_DIRS) walkMd(path.join(ROOT, d), mdFiles);
for (const f of ROOT_DOCS) {
  const p = path.join(ROOT, f);
  if (existsSync(p)) mdFiles.push(p);
}

// Strip fenced code blocks (```...```) and inline code spans (`...`) before scanning: text
// inside code is a literal illustration, not a markdown link the reader can click.
function stripCode(txt) {
  return txt
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]*`/g, '');
}

// A link target that only ever resolves INSIDE a generated guide — never in the plugin repo itself.
// The pedagogy rules and templates use these as illustrations (`05_delta-time.md`, `../MILESTONE_1_api/…`)
// or as post-stamp paths (`foundation/status.md`), so they are never real dead links here.
function isGuideInternalExample(target) {
  const t = target.split('#')[0].trim();
  if (/MILESTONE_/.test(t)) return true;                 // e.g. ../MILESTONE_1_api/00_overview.md
  if (/(^|\/)foundation\//.test(t)) return true;         // e.g. foundation/status.md (resolved post-stamp)
  const base = t.split('/').pop() || '';
  if (/^(\d{2}|NN)_.+\.md$/i.test(base)) return true;    // step/verify/overview files: 00_overview.md, NN_verify.md
  return false;
}

// GitHub's heading-slug rules, as far as they matter here: lowercase, drop punctuation, then turn
// EACH space into a hyphen (a run of spaces becomes a run of hyphens — "Credits & inspiration"
// slugs to "credits--inspiration", not "credits-inspiration"). Letters/digits are matched by
// Unicode class, not \w, so an accented heading keeps its characters the way GitHub keeps them.
function slugify(headingText) {
  return headingText
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // link text survives, the URL doesn't
    .replace(/[*_`]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .trim()
    .replace(/ /g, '-');
}

const anchorCache = new Map();
function anchorsOf(abs) {
  if (anchorCache.has(abs)) return anchorCache.get(abs);
  const set = new Set();
  if (existsSync(abs)) {
    // Headings inside fenced code are illustrations, not targets — strip fences first.
    const txt = read(abs).replace(/```[\s\S]*?```/g, '');
    for (const h of txt.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)) set.add(slugify(h[1]));
    // Explicit HTML anchors count too.
    for (const a of txt.matchAll(/<a\s+(?:id|name)="([^"]+)"/g)) set.add(a[1].toLowerCase());
  }
  anchorCache.set(abs, set);
  return set;
}

const linkRe = /\[[^\]]*\]\(([^)]+)\)/g;
for (const file of mdFiles) {
  const txt = stripCode(read(file));
  let m;
  while ((m = linkRe.exec(txt))) {
    const target = m[1].trim();
    // Ignore absolute URLs.
    if (/^(https?:|mailto:)/i.test(target)) continue;
    // Ignore paths that only exist inside a generated guide (illustrative or post-stamp).
    if (isGuideInternalExample(target)) continue;
    // Ignore template placeholders like <slug>/<next> IN THE TARGET ITSELF. Test only the target,
    // never the whole line: prose lines routinely contain `<`/`>` (e.g. "values > 5", "<br>"), and
    // a line-wide exemption would silently hide a real dead link that happens to share such a line.
    // A template nav line's non-placeholder segment (e.g. `00_overview.md`) is already covered by
    // isGuideInternalExample above, so target-only is safe here.
    if (/[<>]/.test(target)) continue;

    const hashAt = target.indexOf('#');
    const filePart = (hashAt === -1 ? target : target.slice(0, hashAt)).trim();
    const fragment = hashAt === -1 ? '' : target.slice(hashAt + 1).trim();

    // A missing file part means a same-page anchor (`#quick-start`), so the page is this file.
    let resolved = file;
    if (filePart) {
      if (!filePart.toLowerCase().endsWith('.md')) continue; // only verify .md links
      resolved = path.resolve(path.dirname(file), filePart);
      if (!existsSync(resolved)) {
        findings.push(`[dead-link] ${path.relative(ROOT, file)} -> ${target} (missing)`);
        continue; // the file is gone; its anchors are not a separate finding
      }
    }
    if (!fragment) continue;
    if (!anchorsOf(resolved).has(fragment.toLowerCase())) {
      findings.push(
        `[dead-anchor] ${path.relative(ROOT, file)} -> ${target} (no heading in ${filePart || 'this file'} slugs to "${fragment}")`,
      );
    }
  }
}

// --- Report. ----------------------------------------------------------------------------------
if (findings.length) {
  const groups = {
    frontmatter: [], inject: [], 'skill-count': [], 'rule-id': [], 'rule-coverage': [],
    package: [], 'dead-link': [], 'dead-anchor': [],
  };
  for (const f of findings) {
    const tag = f.match(/^\[([^\]]+)\]/)[1];
    (groups[tag] ||= []).push(f);
  }
  console.error('CONSISTENCY FINDINGS:');
  for (const [tag, list] of Object.entries(groups)) {
    if (!list.length) continue;
    console.error(`\n  ${tag}:`);
    for (const f of list) console.error('    - ' + f.replace(/^\[[^\]]+\]\s*/, ''));
  }
  process.exit(1);
}

console.log(`consistency ok (${actualCount} skills, ${mdFiles.length} markdown files scanned)`);
process.exit(0);
