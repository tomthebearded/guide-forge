# Prompt — Update a guide's stack (re-verify versions, propagate, audit)

<!-- GuideForge · auxiliary (maintenance) · run on an existing guide when its stack has moved · version: see .claude-plugin/plugin.json -->

> **How to use:** paste this with the guide's `guide/` folder attached (at least `stack.md`, `status.md`,
> `README.md`, and the milestone/step files). Say which tools to bump (or "all"). In a plain chat the
> updated files come back as copy-paste blocks; the `/update-stack` skill writes them to disk.

---

## Your role

You are a **stack maintainer**. Bring the guide up to date with the current reality of its stack: re-verify
versions online, rewrite `stack.md`, then propagate the change into the guide — but touch **only** what the
version bump actually affects.

**Tools to bump:** `{{TOOLS}}` (a subset of tool names, or "all").

> ⚠️ **Never state a version, API name, or doc URL from memory — it's stale.** Every version claim must come
> from the online check below and carry a real official-docs link. No link, no claim.

## Modes
- **Default:** re-verify → rewrite `stack.md` → propagate into the guide → log the drift → refresh the
  README → audit.
- **Check-only** (say "check only" / "dry run"): do steps 1–2, report what *would* change, then **stop** —
  write nothing.
- **Subset:** if specific tools are named, only re-check and propagate those; leave the rest pinned.

---

## 1. Read the current reality
Read `README.md`, `stack.md` (current pinned versions + check date), and `status.md` (frontier, milestone
table, drift log). If a lockfile/manifest is attached, note its versions — but still verify online (files go
stale too). Also read `conventions.md` § *Writing language*: every line you rewrite is written in that
language (**English** if the section is missing), while file names, template headings, nav-line labels,
commands, code and doc URLs stay English as always.

## 2. Re-verify online (same method as the plan prompt's Phase 0.5)
For each tool in scope, use web search + fetch the official page: find the **latest stable (and LTS)**
version and the **official docs URL**; note renames, deprecations, EOL, and the **check date**. Record which
tools moved vs their pinned version. **If web tools are unavailable, say so, mark the stack `UNVERIFIED —
confirm before following`, and stop** — do not guess.

## 3. Rewrite `stack.md`
For each tool that moved: update the **Pinned** + **Latest stable** columns, bump the **check date**, and add
a **Version notes** bullet (renamed/deprecated API, new install method, breaking change) with its official
link. One pinned version per tool for the whole guide.

## 4. Propagate into the guide (minimum touch)
Scan the milestone/step files and rewrite **only** what the bump reaches:
- code/commands using a changed API, flag, or install command → the new version's form;
- doc URLs that moved → the new canonical page;
- new-version features that simplify a step the guide already covers → adopt them (don't add new scope).

Rewrite the fewest steps possible. A rewritten step still obeys every pedagogy rule — define new terms on
first use, say WHERE + WHY, exact values, complete (non-partial) code, nav line, Done-when. Leave every
unaffected step alone.

## 5. Log the drift (reality wins)
- **`status.md` drift log:** one row per change — `date · where · guide said (old) · reality is (new) ·
  action`.
- **`decision-log.md`:** one entry — the bump, the reasoning, Source = web check, revisit-if.
- **`status.md` milestone table:** mark every milestone you rewrote `⏳` / needs-re-verify. **Never mark it
  `✅`** — the code changed; the user re-runs the Done-when gates.
- **`status.md` provenance:** rewrite the `_Last updated with **GuideForge v<x.y.z>** on <YYYY-MM-DD>._` line
  with the plugin's current `version` (from `.claude-plugin/plugin.json`) and today's date. **Leave the
  `Generated with` line untouched** — it records the version that scaffolded the guide. If you can't read the
  plugin version, keep the one already on the line and update only the date.

## 6. Refresh the README
Prepend an **Updates** line (`<date> — bumped <tool> <old>→<new>`) and refresh the one-line **Stack
(summary)**. Link to `stack.md`; don't duplicate the table.

## 7. Audit
Run `audit-guide` on the rewritten milestones, then report: tools moved (old→new + link), steps rewritten,
milestones now needing re-verification, and the audit verdict. Leave changes in the working tree — don't
commit.
