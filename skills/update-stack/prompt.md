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

This is a different job from its neighbours, and picking the wrong one produces the wrong edit:

| The guide… | Run |
|---|---|
| …is right, and **what you want built has changed** | `/amend-guide` |
| …failed a reader — a step is wrong, missing, or stale | `/report-issue` |
| …reads unclearly at one step, but does the right thing | `/clarify-step` |
| …**pins versions that have moved** since it was written | **this one** |

> ⚠️ **A bump rewrites the step that installs the tool — which is usually step 01 of milestone 01, executed
> long ago.** The reader's project is pinned to the old version until *they* upgrade it, so a rewritten step
> describes a state their machine is not in. Step 0 below establishes what has been executed, and you stop and
> ask before touching any of it.

## Modes
- **Default:** frontier gate → re-verify → rewrite `stack.md` → propagate into the guide → log the drift →
  refresh the README → audit.
- **Check-only** (say "check only" / "dry run"): do steps 1–2, report what *would* change, then **stop** —
  write nothing. **This is the gate's route A-preview**, and the right first call on a guide that is under way.
- **Subset:** if specific tools are named, only re-check and propagate those; leave the rest pinned.

---

## Step 0 — the frontier gate (before you rewrite anything)

Run the shared contract in [reference/frontier-gate.md](../../reference/frontier-gate.md), in full. In short:

1. **Read `guide/foundation/progress.md`** and find the frontier — the last `[x]` row. No ledger, or a ledger
   that contradicts `status.md`? **Stop and ask.**
2. **Do steps 1–3 below first** (re-verify online, rewrite `stack.md`) and scope the propagation — but write
   no step file until the gate is answered. `stack.md` itself is a foundation doc, not executed work; bumping
   it is always safe.
3. **Classify every step the propagation would touch:** ahead of the frontier (free), behind it but cosmetic
   (free, listed), behind it and **load-bearing** — an install command, a pinned version in code, a changed
   API call, a `Done-when` that quotes a version string, a file checkpoint.
4. **If anything is load-bearing and behind the frontier, STOP** and present the notice: the frontier, the
   bump (old→new + link), every executed step it would rewrite, and the three routes (**A** rewrite in place ·
   **B** rewrite + a superseded banner on each executed step and one consolidated *Before you continue —
   corrections* section ahead of the frontier, holding the upgrade the reader runs on their own project ·
   **C** defer the propagation, `stack.md` records the new version as *available, not adopted*). **Recommend
   B** — a version bump is precisely the change whose repair is a command the reader must run. Then wait.
5. **If nothing load-bearing sits behind the frontier**, say so in one line and carry on.

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
first use, say WHERE + WHY, exact values, complete (non-partial) code, nav line, Done-when, and its
`## Suggested commit` where the step changes the tree (rule 4.5; update the message only if the bump changed
what the step actually does). Leave every unaffected step alone.

**Steps behind the frontier follow the route agreed at Step 0**: rewritten in place (**A**), rewritten plus a
superseded banner with the upgrade collected into one *Before you continue — corrections* section at the top of
the first unexecuted step (**B** — `/amend-guide` §6 is the canonical form of both marks), or left untouched
with the new version recorded in `stack.md` as available-but-not-adopted (**C**). Steps ahead of the frontier
are rewritten in place under every route.

Under **B**, the corrections section closes with **one** `**Suggested commit:**` block for the whole upgrade
(rule 4.5) — `chore(deps): upgrade <tool> <old>→<new>` — not one commit per rewritten step: the reader runs the
upgrade on their project as a single change.

## 5. Log the drift (reality wins)
- **`status.md` drift log:** one row per change — `date · where · guide said (old) · reality is (new) ·
  action`. Name the **route** taken; under **A** list every executed step whose commands or code changed, in
  the order they must be re-applied, and under **C** mark the row `⚠️ **Deferred**`.
- **`progress.md`:** under **B**, mark every invalidated executed row `[!]`, naming the step that carries its
  correction. **Never tick or untick a step on the reader's behalf.**
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
Run `audit-guide` on the rewritten milestones, then report: **the frontier and the route taken** (and which
executed steps it did and did not touch), tools moved (old→new + link), steps rewritten, milestones now needing
re-verification, **what the reader must run on their own project to match the bumped guide**, and the audit
verdict. Leave changes in the working tree — don't commit. (That governs the edits *you* just made to the
guide; the `Suggested commit` blocks you wrote are instructions for the reader's own project.)
