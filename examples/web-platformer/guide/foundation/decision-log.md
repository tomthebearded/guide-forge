# Decision log — Shape Jumper

> Why the guide is the way it is. Each entry: the decision, the reasoning, and what it rules out.
> Seeded from the approved plan's acknowledged risks and accepted feature additions.

## D1 — Zero build, classic scripts, not ES modules
- **Date:** 2026-07-10
- **Source:** the audience interview (reader chose "zero-build vanilla JS — just open index.html").
- **Decision:** ship the game as plain `<script>` tags loaded in a fixed order, all attaching to one global
  `const Game = {}`. No `type="module"`, no `import`/`export`, no bundler, no server.
- **Why:** ES-module `import` fails under the `file://` protocol (CORS), so a game that must run by
  double-clicking `index.html` cannot use modules without asking the reader to run a server — which violates
  the zero-install premise. One global namespace is the simplest thing that works from a file.
- **Rules out / trade-off:** the codebase can't grow past a handful of files gracefully; no tree-shaking, no
  per-file scope isolation. Accepted: approachability now over scalability later.
- **Revisit if:** the reader outgrows a single folder — the upgrade path is "add a tiny static server (e.g.
  `python -m http.server` or a Live Server editor extension) and switch to ES modules."

## D2 — Delta-time loop, clamped `dt`
- **Date:** 2026-07-10
- **Source:** the Phase 0.5 web check (MDN `requestAnimationFrame` guidance).
- **Decision:** drive the loop with `requestAnimationFrame`, compute `dt` (seconds) from the callback
  timestamp, scale every movement by `dt`, and **clamp `dt`** to a small maximum each frame.
- **Why:** without `dt`, motion runs faster on high-refresh-rate monitors (MDN's explicit warning). Clamping
  prevents a huge `dt` after the tab sleeps from moving the player farther than a platform is thick in one
  frame (tunnelling through solids).
- **Rules out / trade-off:** true fixed-timestep determinism (physics can differ slightly frame-to-frame).
  Accepted: variable timestep is far simpler for a beginner and clamping covers the dangerous case.
- **Revisit if:** the game needs reproducible/deterministic physics or networked play — then move to a
  fixed-timestep accumulator.

## D3 — Gravity-sign-aware physics
- **Date:** 2026-07-10
- **Source:** the audience interview (mid-plan request to "add a random twist") + design.
- **Decision (so the twist is cheap):** from M3 onward, gravity is a **signed** value (`gravitySign` = `+1` down / `-1` up) applied
  through a single integrator, and "grounded" means "resolved a vertical overlap on the gravity-facing side."
  No physics code hard-codes "down."
- **Why:** the M6 twist (random gravity flips) then becomes a two-line change — flip the sign and add a
  telegraph — instead of a rewrite of jumping, grounding, and ceiling collision.
- **Rules out / trade-off:** the M3/M4 physics is marginally more abstract than a hard-coded-down version
  (readers meet the sign concept earlier). Accepted: it's the guide's spine and pays off directly in M6.
- **Revisit if:** the twist is ever dropped — the sign could be collapsed to a constant, but there's no reason
  to.

## D4 — The gravity flip is telegraphed and toggleable
- **Date:** 2026-07-10
- **Source:** advise-back (accepted feature addition).
- **Decision:** every flip is preceded by a ~1-second visual **telegraph**, and a `Game.config.twistEnabled`
  flag can switch the twist off entirely.
- **Why:** an untelegraphed random flip reads as an unfair bug to a beginner; the telegraph makes it a
  mechanic. The toggle lets the reader build and verify M1–M5 physics calmly, then enable the chaos in M6, and
  disable it while debugging.
- **Rules out / trade-off:** slightly more state (`nextFlipAt`, a telegraph timer). Trivial cost.
- **Revisit if:** never expected to; the telegraph is core to the twist feeling fair.

## D5 — Single fixed-size canvas, no scrolling camera
- **Date:** 2026-07-10
- **Source:** the audience interview (scope) + Phase 2 scope discipline.
- **Decision:** the whole level fits one fixed canvas (e.g. 800×450). No viewport/camera math, no responsive
  resize.
- **Why:** a scrolling camera is the single biggest source of coordinate-transform complexity in a beginner
  platformer, and it isn't needed to teach the loop, physics, collision, or the twist.
- **Rules out / trade-off:** large/scrolling levels. Accepted: out of scope by design.
- **Revisit if:** the reader wants bigger levels — that's a follow-on project (add a camera offset applied at
  draw time).

## D6 — HUD, restart, and a small state machine
- **Date:** 2026-07-10
- **Source:** advise-back (accepted feature additions).
- **Decision:** draw an on-canvas HUD (score + timer via `fillText`), add a `title`/`playing`/`won` state
  machine, and bind **R** to restart with a freshly randomized flip schedule.
- **Why:** the Done-when gates need score, timer, and best-time to be *observable*; a win state needs a way
  back to play; and a fresh random schedule per run makes the twist feel alive.
- **Rules out / trade-off:** a hair more state and branching in `main.js`. Accepted — it's what makes the game
  a loop rather than a one-shot.
- **Revisit if:** adding menus/levels — the state machine is the natural place to extend.

## D7 — Edit-steps use fragment-plus-verify, not full-file-per-edit
- **Date:** 2026-07-11
- **Source:** audit-fix pass (S1) — the original plan (§5) required every edit-step to re-print the whole file,
  but the drafted guide shows precisely-placed fragments for edits and renders the full files in each
  `NN_verify.md`. This decision blesses the convention the guide actually uses and resolves the contradiction.
- **Decision:** a step that **creates a new file** shows the complete file; a step that **edits an
  already-created file** may show a **precisely-placed fragment** (the added/replaced lines, with explicit
  "ADD/REPLACE … before/after X" placement) instead of the whole file — **provided** the milestone's
  `NN_verify.md` renders the complete current contents of every file that milestone touched.
- **Why:** every topic here is New-tier, so steps are already long with teaching; re-printing an entire file
  for a one-line change buries the change and pads the step. The fragment shows *what changed*; the verify
  checkpoint keeps the *authoritative full file* the reader diffs against. Best of both.
- **Rules out / trade-off:** the reader can't see the whole file at the moment of a mid-milestone edit — they
  rely on the fragment's placement instructions until the verify step. Accepted: placement is stated
  explicitly, and the verify file is never more than a few steps away.
- **Revisit if:** a file's edits ever become large or scattered enough that a fragment is more confusing than a
  full reprint — then that specific step should show the whole file.
