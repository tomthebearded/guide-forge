#!/usr/bin/env node
/**
 * Token & cost tracker — Claude Code Stop / SubagentStop hook.
 *
 * Bundled with the GuideForge plugin. On every finished request the harness runs this
 * script. It scans the project's transcript tree, tallies token usage deduped by
 * `message.id` (the same id repeats across content-block lines and must be counted once),
 * prices each message per model, fetches the live USD->EUR rate, and rewrites a
 * **per-guide** `TOKEN_USAGE.md`.
 *
 * Attribution (the important part):
 *   - A guide is an `examples/<name>/` folder. Each session is attributed to the guide its
 *     tool calls reference most (session -> dominant `examples/<name>`); a session's whole
 *     usage is credited to that one guide.
 *   - The metered ledger is the single `TOKEN_USAGE.md` written INSIDE the guide folder:
 *     `examples/<name>/guide/TOKEN_USAGE.md`. It is the one cost ledger per guide. The hook is
 *     authoritative and rewrites the whole file each run; if a skill appended an estimate row
 *     (the fallback when the hook is inactive), that row is transient and gets replaced here.
 *   - Sessions that touch no `examples/<name>/` path — e.g. work on the GuideForge tooling
 *     itself (skills, hook, README) — are INTENTIONALLY DROPPED. Building the plugin is not a
 *     guide, so it gets no ledger. There is no project-root catch-all in a repo that has an
 *     `examples/` folder.
 *   - Fallback: a plain single-guide project (no `examples/` dir at all) is treated as one
 *     guide; its ledger is `<project>/guide/TOKEN_USAGE.md` when a `guide/` dir exists, else the
 *     project-root `TOKEN_USAGE.md` (preserves behaviour for non-GuideForge layouts).
 *
 * The tracker is a plain script and costs zero Claude tokens, so there is no "tool cost" section.
 * Figures are REAL (read from transcript usage records), not estimates.
 *
 * Usage:
 *   (hook)      printf '<hook-json>' | node track-tokens.js
 *   (backfill)  node track-tokens.js --backfill "<project transcripts dir>"
 *
 * Always exits 0 and prints nothing, so it can never block or delay Claude.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// --- Pricing: USD per 1,000,000 tokens. Base input/output rates per model. -------------------
// Cache multipliers applied to the base INPUT rate: read 0.1x, 5m-write 1.25x, 1h-write 2x.
const MODEL_RATES = [
  { match: 'opus-4-8', in: 5, out: 25 },
  { match: 'sonnet-4-6', in: 3, out: 15 },
  { match: 'haiku-4-5', in: 1, out: 5 },
  // Sensible fallbacks for other current tiers (kept generic; flagged in the log if unknown).
  { match: 'opus', in: 5, out: 25 },
  { match: 'sonnet', in: 3, out: 15 },
  { match: 'haiku', in: 1, out: 5 },
];
const CACHE_READ_MULT = 0.1;
const CACHE_WRITE_5M_MULT = 1.25;
const CACHE_WRITE_1H_MULT = 2.0;

const FX_URL = 'https://api.frankfurter.app/latest?from=USD&to=EUR';
const FX_TIMEOUT_MS = 1500;
const DEFAULT_RATE = 0.92;

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const STATE_PATH = path.join(PROJECT_DIR, '.claude', '.token-usage-state.json');
const EXAMPLES_DIR = path.join(PROJECT_DIR, 'examples');

// Sentinel guide key for the single-guide (no `examples/`) fallback. Real guide names come from
// the `examples/<name>` regex and can never collide with this.
const ROOT_GUIDE = '__root__';

// --- Helpers ---------------------------------------------------------------------------------

function rateFor(model) {
  const m = (model || '').toLowerCase();
  const hit = MODEL_RATES.find((r) => m.includes(r.match));
  return hit ? { in: hit.in, out: hit.out, known: true } : { in: 0, out: 0, known: false };
}

function shortModel(model) {
  return (model || 'unknown').replace(/^claude-/, '');
}

/** USD cost for one message's usage object. */
function costUsd(usage, rate) {
  const input = usage.input_tokens || 0;
  const output = usage.output_tokens || 0;
  const read = usage.cache_read_input_tokens || 0;
  const cc = usage.cache_creation || null;
  let w5m;
  let w1h;
  if (cc && (cc.ephemeral_5m_input_tokens != null || cc.ephemeral_1h_input_tokens != null)) {
    w5m = cc.ephemeral_5m_input_tokens || 0;
    w1h = cc.ephemeral_1h_input_tokens || 0;
  } else {
    w5m = usage.cache_creation_input_tokens || 0; // no breakdown -> treat as 5m
    w1h = 0;
  }
  return (
    (input * rate.in +
      output * rate.out +
      read * rate.in * CACHE_READ_MULT +
      w5m * rate.in * CACHE_WRITE_5M_MULT +
      w1h * rate.in * CACHE_WRITE_1H_MULT) /
    1e6
  );
}

/** Token buckets for one usage object (for the Totals counters). */
function buckets(usage) {
  const cc = usage.cache_creation || null;
  let write;
  if (cc && (cc.ephemeral_5m_input_tokens != null || cc.ephemeral_1h_input_tokens != null)) {
    write = (cc.ephemeral_5m_input_tokens || 0) + (cc.ephemeral_1h_input_tokens || 0);
  } else {
    write = usage.cache_creation_input_tokens || 0;
  }
  return {
    input: usage.input_tokens || 0,
    output: usage.output_tokens || 0,
    cacheWrite: write,
    cacheRead: usage.cache_read_input_tokens || 0,
  };
}

/** Walk up from a transcript path to the `.../projects/<encoded>` root. */
function deriveRoot(transcriptPath) {
  let dir = path.dirname(path.resolve(transcriptPath));
  for (let i = 0; i < 8; i++) {
    if (path.basename(path.dirname(dir)) === 'projects') return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.dirname(path.resolve(transcriptPath));
}

/** Recursively list *.jsonl files under a directory. */
function listJsonl(root) {
  let entries;
  try {
    entries = fs.readdirSync(root, { recursive: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => typeof e === 'string' && e.endsWith('.jsonl'))
    .map((e) => path.join(root, e));
}

/**
 * Collect unique assistant messages (by message.id) from a transcript tree.
 * Returns Map<messageId, {model, usage, sessionId, timestamp}>.
 */
function collectMessages(root) {
  const byId = new Map();
  for (const file of listJsonl(root)) {
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const line of text.split(/\r?\n/)) {
      if (!line) continue;
      let o;
      try {
        o = JSON.parse(line);
      } catch {
        continue;
      }
      const msg = o && o.message;
      if (!msg || !msg.usage || !msg.id) continue;
      if (o.type !== 'assistant' && msg.role !== 'assistant') continue;
      if (byId.has(msg.id)) continue; // dedupe: same id repeats across content-block lines
      byId.set(msg.id, {
        model: msg.model || 'unknown',
        usage: msg.usage,
        sessionId: o.sessionId || 'unknown',
        timestamp: o.timestamp || null,
      });
    }
  }
  return byId;
}

/** True when this project has an `examples/` directory (dogfooding repo of many guides). */
function isExamplesMode() {
  try {
    return fs.statSync(EXAMPLES_DIR).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Map each session id to the guide (`examples/<name>`) its transcript references most.
 * A file is one session (filename stem == sessionId). Returns Map<sessionId, name|null>.
 */
function sessionGuides(root) {
  const map = new Map();
  for (const file of listJsonl(root)) {
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const sid = path.basename(file).replace(/\.jsonl$/i, '');
    const counts = new Map();
    // A guide is a *directory* `examples/<name>/…`, so the captured name MUST be followed by a
    // separator — otherwise a reference to the index *file* `examples/README.md` would mint a
    // phantom guide named `readme.md`. `[\\/]+` on both sides also matches Windows JSON paths,
    // where separators are double-escaped (`examples\\name\\…`).
    const re = /examples[\\/]+([a-z0-9][a-z0-9._-]*)[\\/]+/gi;
    let m;
    while ((m = re.exec(text))) {
      const name = m[1].toLowerCase();
      if (name === 'readme.md') continue; // never a guide; index file, not a folder
      counts.set(name, (counts.get(name) || 0) + 1);
    }
    let best = null;
    let bestN = 0;
    for (const [n, c] of counts) {
      if (c > bestN) {
        best = n;
        bestN = c;
      }
    }
    map.set(sid, best);
  }
  return map;
}

function loadState() {
  try {
    const s = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    // New schema: { seen, lastRate, guides: { <name>: { rows, totals } } }.
    // An old-schema file (top-level rows/totals) is migrated: keep `seen`/`lastRate` so live
    // runs don't double-count, but drop the old rows/totals (they lumped un-attributable
    // tooling work into a single root ledger and can't be re-attributed).
    return {
      seen: s.seen || {},
      lastRate: s.lastRate || null,
      guides: s.guides || {},
    };
  } catch {
    return { seen: {}, lastRate: null, guides: {} };
  }
}

function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state));
}

/** Get (creating if needed) the per-guide sub-state. */
function getGuideState(state, guide) {
  if (!state.guides[guide]) {
    state.guides[guide] = {
      rows: [],
      totals: { input: 0, output: 0, cacheWrite: 0, cacheRead: 0, usd: 0 },
    };
  }
  return state.guides[guide];
}

/**
 * Where a guide's metered ledger is written: a single `TOKEN_USAGE.md` INSIDE the guide folder.
 *   - examples mode: `examples/<name>/guide/TOKEN_USAGE.md`.
 *   - root fallback: `<project>/guide/TOKEN_USAGE.md` when a `guide/` dir exists (the canonical
 *     GuideForge layout), else `<project>/TOKEN_USAGE.md` (a non-GuideForge single-guide project).
 */
function guideOutPath(guide) {
  if (guide === ROOT_GUIDE) {
    const inGuide = path.join(PROJECT_DIR, 'guide');
    try {
      if (fs.statSync(inGuide).isDirectory()) return path.join(inGuide, 'TOKEN_USAGE.md');
    } catch {
      /* no guide/ dir -> project root */
    }
    return path.join(PROJECT_DIR, 'TOKEN_USAGE.md');
  }
  return path.join(EXAMPLES_DIR, guide, 'guide', 'TOKEN_USAGE.md');
}

function guideTitle(guide) {
  return guide === ROOT_GUIDE ? 'development' : guide;
}

async function fetchRate() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FX_TIMEOUT_MS);
    const res = await fetch(FX_URL, { signal: ctrl.signal });
    clearTimeout(t);
    const data = await res.json();
    const r = data && data.rates && data.rates.EUR;
    if (typeof r === 'number' && r > 0) return { rate: r, live: true };
  } catch {
    /* fall through */
  }
  return null;
}

function fmtInt(n) {
  return Math.round(n).toLocaleString('en-US');
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function fmtLocal(date) {
  const d = date || new Date();
  return (
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ` +
    `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
  );
}

function renderMarkdown(gs, rate, rateLive, title) {
  const t = gs.totals;
  const eur = (usd) => usd * rate;
  const lines = [];
  lines.push(`# Token Usage & Cost — ${title}`);
  lines.push('');
  lines.push(
    'Real metered usage for **this guide**, written by the bundled GuideForge hook ' +
      '(`hooks/track-tokens.js`). Anthropic bills in USD; EUR uses the live USD→EUR rate fetched at ' +
      'each update. Cache-write priced at 1.25× (5-min) / 2× (1-hour). The tracker is a hook script ' +
      'and costs no tokens. Work not attributable to a guide (building the plugin itself) is not tracked.',
  );
  lines.push('');
  lines.push('## Totals');
  lines.push(`- Updated:        ${fmtLocal()}`);
  lines.push(`- USD→EUR rate:   ${rate.toFixed(4)} ${rateLive ? '(live)' : '(estimated)'}`);
  lines.push(`- Input tokens:   ${fmtInt(t.input)}`);
  lines.push(`- Output tokens:  ${fmtInt(t.output)}`);
  lines.push(`- Cache write:    ${fmtInt(t.cacheWrite)}`);
  lines.push(`- Cache read:     ${fmtInt(t.cacheRead)}`);
  lines.push(`- Cost:           $${t.usd.toFixed(2)}  ·  €${eur(t.usd).toFixed(2)}`);
  lines.push('');
  lines.push('## Per-request log');
  lines.push(
    '| # | Time (local) | Model | Input | Output | Cache W | Cache R | USD | EUR | Rate |',
  );
  lines.push('|---|---|---|---|---|---|---|---|---|---|');
  for (const r of gs.rows) {
    lines.push(
      `| ${r.n}${r.mark || ''} | ${r.time} | ${r.model} | ${fmtInt(r.input)} | ` +
        `${fmtInt(r.output)} | ${fmtInt(r.cacheW)} | ${fmtInt(r.cacheR)} | ` +
        `${r.usd.toFixed(4)} | ${(r.usd * r.rate).toFixed(4)} | ${r.rate.toFixed(4)} |`,
    );
  }
  lines.push('');
  lines.push('_Rows marked `*` were backfilled (one per past session, shared day rate);');
  lines.push('rows marked `~` used an estimated rate (FX fetch failed)._');
  lines.push('');
  return lines.join('\n');
}

/** Aggregate a list of message records into one summed row payload. */
function aggregate(records, rate) {
  const sum = { input: 0, output: 0, cacheW: 0, cacheR: 0, usd: 0 };
  const models = new Set();
  let unknown = false;
  for (const rec of records) {
    const r = rateFor(rec.model);
    if (!r.known) unknown = true;
    const b = buckets(rec.usage);
    sum.input += b.input;
    sum.output += b.output;
    sum.cacheW += b.cacheWrite;
    sum.cacheR += b.cacheRead;
    sum.usd += costUsd(rec.usage, r);
    models.add(shortModel(rec.model));
  }
  const model = models.size === 1 ? [...models][0] : `mixed(${models.size})`;
  return { ...sum, rate, model: unknown ? `${model}?` : model };
}

function applyRowToTotals(gs, payload) {
  gs.totals.input += payload.input;
  gs.totals.output += payload.output;
  gs.totals.cacheWrite += payload.cacheW;
  gs.totals.cacheRead += payload.cacheR;
  gs.totals.usd += payload.usd;
}

function lastTs(recs) {
  return recs.map((r) => r.timestamp).filter(Boolean).sort().pop() || '';
}

function writeLedger(guide, gs, rate, rateLive) {
  const out = guideOutPath(guide);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, renderMarkdown(gs, rate, rateLive, guideTitle(guide)));
}

async function main() {
  const args = process.argv.slice(2);
  const backfillIdx = args.indexOf('--backfill');
  const isBackfill = backfillIdx !== -1;

  let root;
  if (isBackfill) {
    root = args[backfillIdx + 1] || PROJECT_DIR;
  } else {
    const input = await readStdin();
    let hook = {};
    try {
      hook = JSON.parse(input || '{}');
    } catch {
      hook = {};
    }
    if (!hook.transcript_path) return; // nothing to do
    root = deriveRoot(hook.transcript_path);
  }

  const state = loadState();
  const all = collectMessages(root);

  // Keep only messages we haven't already counted.
  const fresh = [];
  for (const [id, rec] of all) {
    if (!state.seen[id]) fresh.push({ id, ...rec });
  }
  if (fresh.length === 0) return; // no change -> no write, no row

  // Attribute each fresh message to a guide (or drop it).
  const examplesMode = isExamplesMode();
  const sg = examplesMode ? sessionGuides(root) : null;
  const guideOf = (rec) => {
    if (!examplesMode) return ROOT_GUIDE;
    const g = sg.get(rec.sessionId);
    return g == null ? null : g;
  };

  const attributed = [];
  for (const rec of fresh) {
    const guide = guideOf(rec);
    if (guide == null) continue; // non-guide/tooling work -> intentionally dropped
    attributed.push({ ...rec, guide });
  }

  // Mark ALL fresh messages seen (even dropped ones) so we never re-scan them.
  for (const rec of fresh) state.seen[rec.id] = 1;
  if (attributed.length === 0) {
    saveState(state);
    return;
  }

  const fx = await fetchRate();
  const rate = fx ? fx.rate : state.lastRate || DEFAULT_RATE;
  const rateLive = !!fx;
  if (fx) state.lastRate = rate;

  // Build row(s), grouped per guide.
  const rowsByGuide = new Map();
  const pushRow = (guide, row) => {
    if (!rowsByGuide.has(guide)) rowsByGuide.set(guide, []);
    rowsByGuide.get(guide).push(row);
  };

  if (isBackfill) {
    // One row per (guide, session), oldest first.
    const byKey = new Map();
    for (const rec of attributed) {
      const key = `${rec.guide} ${rec.sessionId}`;
      if (!byKey.has(key)) byKey.set(key, { guide: rec.guide, recs: [] });
      byKey.get(key).recs.push(rec);
    }
    const groups = [...byKey.values()].sort((a, b) => {
      const ta = lastTs(a.recs);
      const tb = lastTs(b.recs);
      return ta < tb ? -1 : ta > tb ? 1 : 0;
    });
    for (const { guide, recs } of groups) {
      const last = lastTs(recs);
      const payload = aggregate(recs, rate);
      pushRow(guide, {
        ...payload,
        time: last ? fmtLocal(new Date(last)) : fmtLocal(),
        mark: rateLive ? '*' : '*~',
      });
    }
  } else {
    // Live: one row per guide (normally just one — a session is one guide).
    const byGuide = new Map();
    for (const rec of attributed) {
      if (!byGuide.has(rec.guide)) byGuide.set(rec.guide, []);
      byGuide.get(rec.guide).push(rec);
    }
    for (const [guide, recs] of byGuide) {
      const payload = aggregate(recs, rate);
      pushRow(guide, { ...payload, time: fmtLocal(), mark: rateLive ? '' : '~' });
    }
  }

  // Commit: append rows to per-guide state, update its totals, rewrite its ledger.
  for (const [guide, rows] of rowsByGuide) {
    const gs = getGuideState(state, guide);
    for (const row of rows) {
      applyRowToTotals(gs, row);
      gs.rows.push({ n: gs.rows.length + 1, ...row });
    }
    writeLedger(guide, gs, rate, rateLive);
  }

  saveState(state);
}

function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve('');
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(data));
  });
}

main()
  .catch(() => {})
  .finally(() => process.exit(0));
