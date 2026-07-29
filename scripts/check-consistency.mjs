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
const NUMWORDS = {
  nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
};
const actualCount = skillNames.length;
// Only match a number DIRECTLY adjacent to "skills" (lenient, avoids false positives).
const countRe = /\b(nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|\d+)\s+skills\b/gi;
for (const rel of ['README.md', '.claude-plugin/marketplace.json']) {
  const txt = read(path.join(ROOT, rel));
  let m;
  while ((m = countRe.exec(txt))) {
    const raw = m[1].toLowerCase();
    const stated = NUMWORDS[raw] ?? parseInt(raw, 10);
    if (Number.isFinite(stated) && stated !== actualCount) {
      findings.push(
        `[skill-count] ${rel} states "${m[1]} skills" but there are ${actualCount} skill folders`,
      );
    }
  }
}

// --- Check 3b: stated pedagogy-PRINCIPLE count matches the canonical rules file. --------------
// The contract is re-inlined across ~5 prompts (paste-prompt self-containment); this catches a
// half-applied change (e.g. regrouping into 7 principles but missing a "14 rules" straggler that
// should now read "7 principles"). We count principles (the advertised unit), not leaf rules.
const rulesFile = path.join(ROOT, 'reference', 'pedagogy-rules.md');
if (existsSync(rulesFile)) {
  const rulesTxt = read(rulesFile);
  // Canonical principle headers look like `## P1 — Explain what's new`.
  const actualPrinciples = (rulesTxt.match(/^##\s+P\d+\s+—/gm) || []).length;
  // Files that STATE a principle count. (CHANGELOG/CONTRIBUTING excluded: historical entries and
  // prose legitimately mention old counts / transition text like "10 -> 14".)
  const COUNT_FILES = [
    'README.md', 'EXPLAINER.md', 'reference/pedagogy-rules.md',
    'templates/step.md', 'templates/verify.md',
  ];
  for (const name of skillNames) {
    for (const f of ['SKILL.md', 'prompt.md']) {
      const rel = `skills/${name}/${f}`;
      if (existsSync(path.join(ROOT, rel))) COUNT_FILES.push(rel);
    }
  }
  // Guard every read: a base file being renamed/deleted should surface as a finding elsewhere, not
  // crash this script with an uncaught ENOENT.
  const presentFiles = COUNT_FILES.filter((rel) => existsSync(path.join(ROOT, rel)));

  // A number (worded or digits) bound to "principle(s)" — "7 principles", "7 pedagogy principles",
  // "7-principle …", "seven core principles". Not "principle 7" (reversed) and not an ordinal like
  // "Step 3 principles". The gap is `(?:\s+|-+)` — a run of whitespace (which spans NEWLINES, so a
  // line-wrapped count is caught) OR a run of hyphens, but NOT a mix, so "5\n- principles" (a number
  // ending a line above a bullet list) can't false-match across the boundary. An optional adjective
  // word may sit between the number and "principles".
  const countRe = /(?<!(?:phase|step|part|section|milestone|pillar)\s)\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)(?:\s+|-+)(?:(?:pedagogy|writing|core|named|teaching|key)\s+)?principles?\b/gi;
  const WORDS1 = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
  for (const rel of presentFiles) {
    const txt = read(path.join(ROOT, rel));
    let m;
    while ((m = countRe.exec(txt))) {
      const raw = m[1].toLowerCase();
      const stated = WORDS1[raw] ?? NUMWORDS[raw] ?? parseInt(raw, 10);
      if (Number.isFinite(stated) && stated !== actualPrinciples) {
        findings.push(
          `[principle-count] ${rel} states "${m[0].replace(/\s+/g, ' ').trim()}" but reference/pedagogy-rules.md defines ${actualPrinciples} principles`,
        );
      }
    }
  }

  // --- Check 3c: rule-id integrity + every rule reference resolves. ----------------------------
  // Stronger than the count: catches a mis-mapped or dangling id (e.g. "rule 3.9" that doesn't
  // exist, a duplicate heading, or a rule whose principle prefix has no `## P#` header) — the exact
  // failure mode of a hand-applied re-home. Canonical rule headings look like `### 1.1 — …`.
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
}

// --- Check 4: dead relative markdown links (.md targets that don't exist). --------------------
const DOC_DIRS = ['skills', 'reference', 'templates'];
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

const linkRe = /\[[^\]]*\]\(([^)]+)\)/g;
for (const file of mdFiles) {
  const txt = stripCode(read(file));
  let m;
  while ((m = linkRe.exec(txt))) {
    let target = m[1].trim();
    // Ignore absolute URLs and pure anchors.
    if (/^(https?:|mailto:)/i.test(target)) continue;
    if (target.startsWith('#')) continue;
    // Ignore paths that only exist inside a generated guide (illustrative or post-stamp).
    if (isGuideInternalExample(target)) continue;
    // Ignore template placeholders like <slug>/<next> IN THE TARGET ITSELF. Test only the target,
    // never the whole line: prose lines routinely contain `<`/`>` (e.g. "values > 5", "<br>"), and
    // a line-wide exemption would silently hide a real dead link that happens to share such a line.
    // A template nav line's non-placeholder segment (e.g. `00_overview.md`) is already covered by
    // isGuideInternalExample above, so target-only is safe here.
    if (/[<>]/.test(target)) continue;
    target = target.split('#')[0].trim();
    if (!target) continue;
    if (!target.toLowerCase().endsWith('.md')) continue; // only verify .md links
    const resolved = path.resolve(path.dirname(file), target);
    if (!existsSync(resolved)) {
      findings.push(`[dead-link] ${path.relative(ROOT, file)} -> ${m[1].trim()} (missing)`);
    }
  }
}

// --- Report. ----------------------------------------------------------------------------------
if (findings.length) {
  const groups = { frontmatter: [], inject: [], 'skill-count': [], 'principle-count': [], 'rule-id': [], 'dead-link': [] };
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
