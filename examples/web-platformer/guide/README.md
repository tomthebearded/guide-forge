# Shape Jumper — build a browser platformer from rectangles and circles

> The front door to this guide. Skim this, then follow the milestones. **Progress lives in
> [foundation/status.md](foundation/status.md), not here** — this page describes intent; `status.md` states reality.

## Objective
You'll build a small but complete 2D platformer that runs in any modern browser by **double-clicking
`index.html`** — no npm, no server, no framework, no build step. Every graphic is a plain Canvas shape (the
player is a rounded rectangle, platforms are rectangles, coins are circles, the goal is a rectangle flag).
When you're done you can run left/right and jump with the keyboard, land on platforms, collect coins for
score, survive **random gravity flips** (the twist — gravity inverts, telegraphed a second ahead, then flips
back), reach the goal to win, hear synthesized beeps for jump/coin/win, and see your completion time and a
**best time that survives a page reload**. Press **R** to restart with a freshly randomized flip schedule.

## Stack (summary)
Vanilla JavaScript · HTML5 Canvas 2D · zero dependencies (no npm, no build, no server) — the whole "stack" is
browser web-platform APIs, all Baseline "Widely available". Full verified table + check date:
**[foundation/stack.md](foundation/stack.md)**.

## Key decisions
- **Classic `<script>` tags + one global `Game` object, NOT ES modules** — modules break under `file://` with
  no server, so a "just open the file" game can't use them. → [foundation/decision-log.md](foundation/decision-log.md#d1--zero-build-classic-scripts-not-es-modules)
- **Frame-rate-independent motion via delta time** — every move is scaled by `dt` (seconds since last frame),
  clamped, so the game runs the same speed on a 60 Hz and a 144 Hz screen. → [foundation/decision-log.md](foundation/decision-log.md#d2--delta-time-loop-clamped-dt)
- **Gravity is a signed value through one integrator** — written direction-agnostic from M3, so the M6 twist
  is a two-line change, not a rewrite. → [foundation/decision-log.md](foundation/decision-log.md#d3--gravity-sign-aware-physics)

## Updates
- 2026-07-11 — Re-audit + fixes: corrected M4's Done-when gate, added New-tier first-use glosses (`addEventListener`, `preventDefault`, `includes`, ternary, `rgba()`, `Math.sin`/`abs`, gain envelope, `file://`), and small consistency/clarity tidy-ups. Still awaiting browser verification by a person.
- 2026-07-11 — Audit-fix pass: blessed the fragment-plus-verify code convention (new decision D7), glossed `switch`/`for…of`, backfilled the glossary, tidied the whole-game gate and a decision-log link. Still awaiting browser verification by a person.
- 2026-07-10 — Whole guide drafted (M1–M7). Awaiting browser verification by a person (see [status](foundation/status.md)).
- 2026-07-10 — Guide created.

## Following this guide
1. Read **[foundation/status.md](foundation/status.md)** first — the single source of truth for what's done and verified.
2. Start at **[Milestone 1](MILESTONE_1_canvas-and-loop/00_overview.md)**; do the milestones in order (each builds on the last).
3. **Type the code — don't paste it.** The complete files are included so you always have an authoritative
   copy to diff against, *not* so you can paste blindly. You'll learn far more by typing each file, reading it
   as you go, and predicting a step's expected output *before* you run it. Reach for paste only to unstick
   yourself when something won't work.
4. If you're following this a while after it was written, run the **review-before-follow** gate first —
   re-check the stack's Baseline notes and reconcile any drift before executing (reality wins).
