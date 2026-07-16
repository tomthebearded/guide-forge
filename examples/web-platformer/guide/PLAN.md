# PLAN — Shape Jumper: a browser platformer built from rectangles and circles

> **Stage-1 deliverable** (GuideForge `/plan-guide`). This is the plan the guide will be drafted from — the
> whole guide, in one drafting pass, after approval. It is **not** the guide. Nothing here is scaffolded yet
> except this file.
>
> **Status: awaiting approval.** On approval → `/scaffold-guide` stamps the skeleton, then `/draft-milestone`
> drafts the whole guide (M1→M7 in one pass).

---

## 1. Brief & audience model

### What we're building
A single-screen **2D platformer that runs in any modern browser with zero build tooling** — you literally
double-click `index.html` and play. Every graphic is a **plain shape drawn on an HTML5 Canvas**: the player
is a rounded rectangle, platforms are rectangles, coins are circles, the goal is a rectangle "flag." No
images, no sprites, no framework, no npm, no server. The reader writes **vanilla JavaScript** and learns the
whole game-programming toolkit from scratch: the game loop, frame-rate-independent motion, gravity, jumping,
box collision, collectibles, a win state, sound, and persistence.

**The twist (added at the reader's request):** gravity **randomly flips** during play. At a random interval
(telegraphed one second ahead so it's fair) "down" becomes "up" — the player falls to the *ceiling*, jumps
away from it, and platforms become things you stand on from below. It flips back a few seconds later. This is
the iconic platformer twist and it teaches `Math.random`-driven timing plus a single sign-flip on a
gravity value — which is *cheap* precisely because we write the physics gravity-direction-agnostic from M3.

**Observable end state:** open `index.html` in a browser → a titled canvas appears with a level of rectangle
platforms, circle coins, and a goal flag → press **←/→** (or **A/D**) to run, **Space** (or **↑**) to jump →
the player square obeys gravity, lands on platforms, and can't pass through them → touching a coin removes it,
bumps the score, and plays a beep → at random moments a telegraph flashes and **gravity flips**, inverting
up/down until it flips back → reaching the goal flag shows a **WIN** overlay with your completion **time** and
your **best time** (saved across reloads via `localStorage`) → press **R** to restart with a freshly
randomized flip schedule. Developed and played on Windows in a desktop browser (Chrome/Edge/Firefox).

### Audience model (per-topic expertise → explanation-depth policy)

| Topic | Level | Depth policy applied in the guide |
|-------|-------|-----------------------------------|
| JavaScript (the language: variables, functions, objects, arrays, `const`/`let`, arrow functions) | **New** | Define on first use + MDN link + a short "New concept" callout + failure notes. The reader is new to programming — no construct is assumed. |
| The browser as a runtime (HTML `<script>` load order, the DOM, opening a file with `file://`, DevTools console) | **New** | Same fullest tier — teach how the page, the scripts, and the console fit together from zero. |
| HTML5 Canvas 2D drawing (`getContext('2d')`, `fillRect`, `arc`, `roundRect`, clearing each frame, y-down coordinates) | **New** | Full definitions + MDN link + deep-dive callouts. This is the "screen" — taught thoroughly. |
| The game loop & frame-rate independence (`requestAnimationFrame`, delta time, `performance.now`) | **New — deepest tier** | The load-bearing mental model of the whole guide; taught with the fullest care and repeated at each use. |
| Game physics from scratch (velocity, acceleration, gravity, jump impulse, AABB collision + resolution, "grounded") | **New — deepest tier** | Every concept defined and derived; the mental model ("everything is a box") repeated where it recurs. |
| Keyboard input (`keydown`/`keyup`, `KeyboardEvent.code`, an input-state object) | **New** | Define the event model + why we track held state rather than react per-event; MDN link + failure notes. |
| Web Audio API (`AudioContext`, `OscillatorNode`, the autoplay-gesture rule) | **New** | Teach the oscillator→gain→destination chain from zero; flag the "context must start on a user gesture" trap. |
| `localStorage` persistence (`setItem`/`getItem`, strings-only, `JSON` round-trip) | **New** | Teach the read/parse/guard/write pattern from scratch; note the strings-only and quota caveats. |

**Granularity: Highly granular / tutorial.** The smallest atomic steps, every sub-action spelled out, nothing
assumed. This composes with the matrix: because *every* topic is **New**, essentially every step carries real
teaching — this is a from-absolute-zero guide, and its length reflects that.

### Scope boundaries (out of scope — deliberately)
- **Build tooling of any kind** — no npm, Node, bundler, Vite, TypeScript, or dev server. The finish line is a
  folder of files you open directly. (This is *the* defining constraint — see Hard constraints.)
- **A scrolling camera / large levels.** The whole level fits one fixed canvas; no viewport math. (Biggest
  scope-saver for a beginner.)
- **Enemies, AI, hazards, lives/health, damage.** The only antagonist is the gravity twist.
- **Sprites, images, textures, animation frames.** Shapes only — that is the whole aesthetic premise.
- **Multiple levels, a level editor, or level loading from files.** One hand-authored level (with a
  *randomized* twist schedule and coin jitter), not a level system.
- **Touch / mobile / gamepad controls.** Desktop keyboard only (per Q-controls).
- **Networking, accounts, leaderboards.** `localStorage` best-time is the only persistence.
- **A physics engine or game library** (no Matter.js, Phaser, Kaboom). We write the ~150 lines of physics
  ourselves — that's the point of the guide.

### Hard constraints
- **Zero build, zero install, no server.** The reader's only tool is a text editor and a browser. This forces
  a concrete architectural rule: **classic `<script>` tags, NOT ES modules** — ES-module `import` fails under
  the `file://` protocol, so a "just open the file" game cannot use modules. All scripts share one global
  namespace object. (See conventions; this is load-bearing and is *why* the file layout looks the way it does.)
- **Shapes only** — every visible thing is a `fillRect`, `roundRect`, or `arc`. No asset pipeline.
- **Desktop browser, Windows** for development; the game itself is cross-browser (all APIs are Baseline —
  see Verified stack).
- **One canvas, fixed size** (e.g. 800×450) — no responsive/resize handling in scope.

### Accepted feature additions (from the advise-back)
- **A telegraph before every gravity flip** (a 1-second visual warning) — not requested, but without it a
  random flip is *unfair* and reads as a bug to a beginner. Folded into **M6** as a required part of the twist.
- **A `Game.config.twistEnabled` flag** to switch the twist off — lets the reader build and verify M1–M5
  physics calmly, then turn the chaos on in M6, and toggle it while debugging. Folded into **M6**.
- **A visible on-canvas HUD** (score + timer text via `fillText`) — the cheapest way to make coins, the timer,
  and best-time *observable*, which every Done-when gate needs. Folded into **M5/M7**.
- **A one-key restart (`R`) and a proper game-state machine** (`title` / `playing` / `won`) — makes the win
  loop replayable and gives the twist a fresh random schedule each run. Folded into **M7**.

### Acknowledged long-run risks (logged so the *why* survives → `decision-log.md`)
1. **`file://` + ES modules is a trap.** A reader who "modernizes" this into `import`/`export` will hit
   silent CORS failures with no server. **Mitigation:** we commit to classic scripts + one global `Game`
   object, and the guide states *why* at M1 and flags it in the troubleshooting sheet. The upgrade path (add a
   tiny static server, switch to modules) is noted as an explicit "later" — not done here.
2. **Variable-timestep physics can tunnel/jitter.** With delta-time motion, a huge `dt` (after the tab sleeps)
   can shove the player through a platform in one frame. **Mitigation (MDN-endorsed):** clamp `dt` to a max
   each frame, and keep per-frame movement smaller than the thinnest platform. Taught at M1, enforced in M4.
3. **The gravity twist doubles physics complexity if bolted on late.** Direction-aware "grounded" detection,
   jump impulse, and ceiling collision are the hard part. **Mitigation — the load-bearing design decision:**
   write the M3/M4 physics **gravity-sign-aware from the start** (gravity is a signed value; "grounded" means
   "touching a surface on the gravity-facing side"). Then M6's twist is genuinely a *small* change — flip the
   sign + add a telegraph — not a rewrite. This is the guide's spine and is repeated at each physics step.
4. **Web Audio won't make a sound until a user gesture.** Browsers block an `AudioContext` that starts before
   the user interacts. A beginner will think M7 is broken. **Mitigation:** create/resume the context on the
   first keypress and put an explicit failure-note in the audio step.
5. **`localStorage` is strings-only and can throw.** In private-mode or with storage disabled, `setItem` can
   throw; `getItem` returns `null` when unset. **Mitigation:** teach the parse/guard pattern and wrap writes
   in a `try/catch`, so a missing/blocked store degrades to "no best time" rather than a crash.
6. **"Zero build" caps how far this scales.** No modules/bundler means the codebase can't grow past a handful
   of files gracefully. That's an accepted teaching trade-off (approachability now over scalability later),
   logged so a reader who outgrows it knows the next step is a real toolchain.

---

## 2. Verified stack  *(Phase 0.5 — checked 2026-07-10)*

There are **no installed dependencies, no package manager, and no versioned toolchain** — the entire "stack"
is the browser's built-in web-platform APIs plus the JavaScript language. So the table below pins **browser
API baselines** (the thing that could actually differ across a reader's browser) rather than library versions.
Every API the guide uses is **Baseline "Widely available"** — safe on current Chrome, Edge, Firefox, and
Safari with no polyfills.

| Tool / API | "Version" (baseline floor) | Baseline status (as of 2026-07-10) | Official docs | Notes |
|------------|----------------------------|------------------------------------|---------------|-------|
| JavaScript (ES2015+ syntax: `const`/`let`, arrow fns, classes-free objects) | ES2015+ | Universal | https://developer.mozilla.org/en-US/docs/Web/JavaScript | We stay in plain, widely-taught JS — no bleeding-edge syntax. |
| HTML Canvas 2D (`getContext('2d')`, `fillRect`, `arc`, `fillText`, `clearRect`) | — | Widely available (since 2015) | https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API | The core drawing surface. |
| `CanvasRenderingContext2D.roundRect()` | — | **Widely available (reached "widely" 2025-10-11; cross-browser since Apr 2023)** | https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/roundRect | Used for the rounded-rectangle player. Chrome/Edge 99+, Firefox 112+, Safari 16.4+. If a reader's browser predates it, fall back to `fillRect` — noted in the step. |
| `Window.requestAnimationFrame()` | — | Widely available | https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame | The game-loop driver. **MDN rule the guide honors:** always use the callback's timestamp to compute progress, or motion runs faster on high-refresh screens. |
| `performance.now()` | — | Widely available | https://developer.mozilla.org/en-US/docs/Web/API/Performance/now | Used (via the rAF timestamp) for `dt`; more precise than `Date.now()` and the MDN-recommended time source for frame deltas. |
| `KeyboardEvent.code` | — | Widely available | https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code | **MDN-recommended for games** — physical key position, layout-independent (so WASD works on AZERTY). We use `code`, not `key`. |
| Web Audio: `AudioContext` + `OscillatorNode` | — | Widely available (Oscillator since 2015; `new` constructors since 2021) | https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode | Synth beeps — no audio files. **Autoplay rule:** the context must be created/resumed inside a user-gesture handler. |
| `Window.localStorage` (`setItem`/`getItem`) | — | Widely available (since 2015) | https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage | Best-time persistence. **Strings only** — round-trip through `JSON.stringify`/`parse`; wrap writes in `try/catch`. |

**Reference pages the milestones lean on (deep-linked, from the check above):**
- Canvas tutorial (drawing shapes, the drawing loop) — https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial
- `requestAnimationFrame` + delta-time note — https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
- Desktop mouse & keyboard controls (games) — https://developer.mozilla.org/en-US/docs/Games/Techniques/Control_mechanisms/Desktop_with_mouse_and_keyboard
- Web Audio API — https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- Using the Web Storage API — https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API

**Verified facts steps must honor (load-bearing):**
- Compute motion from the **rAF timestamp** (`dt` in seconds), never assume a fixed 60 fps.
- Read held keys via **`event.code`** (`"ArrowLeft"`, `"ArrowRight"`, `"KeyA"`, `"KeyD"`, `"Space"`,
  `"ArrowUp"`, `"KeyR"`) — not `event.key`.
- **Create/resume the `AudioContext` inside the first keydown handler**, or no sound plays.
- `localStorage` stores **strings only**; a missing key returns **`null`**; a write can **throw** — guard both.
- Canvas Y grows **downward**; positive gravity moves the player **down**. The twist flips the *sign* of gravity.

---

## 3. Foundation docs (the cross-cutting layer — `/scaffold-guide` stamps these)

- **README** (guide front door) — objective/observable end state, the one-line stack summary ("zero-build
  vanilla JS + Canvas, no dependencies"), the 3 headline decisions (classic scripts + one global `Game` object;
  frame-rate-independent delta-time loop; gravity-sign-aware physics so the twist is cheap), an **Updates** log,
  and a "**Following this guide**" note (type the code, don't paste; the complete files are a reference to diff
  against). Links to the detail docs; does not duplicate them.
- **`foundation/stack.md`** — the Verified-stack table above + the load-bearing API facts. Every step imports
  its API spellings and the baseline claims from here.
- **`foundation/audience.md`** — the per-topic matrix (all **New**) + the Highly-granular setting, as the
  guide's north star.
- **`foundation/conventions.md`** — the code/architecture rules (below), referenced everywhere so no step
  re-argues them.
- **`foundation/glossary.md`** — running plain-language definitions: canvas & 2D context, y-down coordinates,
  frame, game loop, `requestAnimationFrame`, delta time (`dt`), velocity, acceleration, gravity, jump impulse,
  AABB (axis-aligned bounding box), collision resolution, penetration/overlap, "grounded", entity,
  collectible, game-state machine, telegraph, oscillator/gain node, `localStorage`, `JSON` round-trip. Grows
  as milestones introduce terms.
- **`foundation/status.md`** — the single source of truth for what is actually built and **verified** (vs. what
  the guide intends). Reconciled after every milestone.
- **`foundation/decision-log.md`** — non-obvious choices + rationale, seeded with the 6 acknowledged risks and
  the 4 accepted feature additions above.

### Conventions the code will follow (`conventions.md`)
- **Zero build, classic scripts, one global namespace.** `index.html` loads a fixed, ordered list of
  `<script>` tags (no `type="module"`). The **first** script declares `const Game = {}`; every later script
  attaches to it (`Game.config = …`, `Game.state = …`, `Game.update = function(){…}`). This is the entire
  "module system" — and it's the reason the game runs from `file://` with no server.
- **`config` vs `state` split.** `Game.config` = tuning constants that don't change during play (gravity
  magnitude, move speed, jump strength, canvas size, colors, flip interval range). `Game.state` = everything
  that mutates each frame (player position/velocity, coins remaining, game mode, timer, next-flip time,
  gravity **sign**). Keeps "what I tweak" separate from "what changes at runtime."
- **Everything is a box for physics.** Player, platforms, coins, and goal each have `{x, y, w, h}`. Coins draw
  as circles but collide as boxes — simpler, and the reader learns one collision routine, not two.
- **Gravity is a signed number, applied through one integrator.** `Game.state.gravitySign` is `+1` (down) or
  `-1` (up); all vertical physics multiplies by it. "Grounded" = resolved a vertical overlap on the
  gravity-facing side this frame. **No step hard-codes "down"** — this is what makes the M6 twist a two-line
  change.
- **One update, one draw, per frame.** `main.js` owns the loop: `update(dt)` mutates `Game.state`; `draw()`
  reads it and paints. No drawing inside update, no state changes inside draw.
- **Load-bearing names** (must match exactly — flagged at first use): the `Game` global, the canvas element
  `id`, the `config`/`state` key names shared across files, the `event.code` strings, the `localStorage` key.
  **Cosmetic** (free to rename): all colors, the canvas pixel size, shape dimensions, the page title.
- **Naming:** `camelCase` for variables/functions, `SCREAMING_CASE` avoided (use `Game.config.X` instead of
  loose globals), files `kebab-or-lowercase.js` loaded in dependency order.

---

## 4. Milestone ladder

Order is strict-by-dependency; each milestone is a runnable vertical slice with an observable **Done-when**
gate. The **reality-check gate is M4** — the first point the thing is a real, playable platformer worth
finishing.

| # | Milestone | Proves (end state) | Depends on | Done-when (one line) |
|---|-----------|--------------------|------------|----------------------|
| **M1** | Canvas & the game loop | A canvas renders and a shape moves at a speed independent of the monitor's refresh rate | — | Open `index.html` → a square glides across the canvas at the *same* speed on a 60 Hz and a 144 Hz screen; the console logs `dt` |
| **M2** | Player & keyboard control | Held keys move the player square left/right | M1 | Hold ←/→ (or A/D) → the square moves that way; release → it stops; two keys at once resolve sanely |
| **M3** | Gravity & jumping *(sign-aware)* | The player accelerates downward, rests on a floor line, and jumps once | M2 | The square falls to the floor and stops; Space/↑ launches it up and it falls back; no double-jump while airborne |
| **M4** ⭐ *reality-check gate* | Platforms & AABB collision | Solid rectangles you can stand on, land on, and bump into from any side | M3 | The player lands on every platform, can't pass through their tops/sides/undersides; **stop and actually play it for a minute** |
| **M5** | Coins, goal, HUD & win state | Collect circle coins (score goes up) and reach the goal flag to win | M4 | Touching a coin removes it and increments an on-canvas score; touching the goal switches to a WIN state and freezes play |
| **M6** | The random twist — gravity flips | Gravity randomly inverts (telegraphed), and platforming works upside-down | M5 | At a random interval a 1 s telegraph flashes, then gravity flips: the player falls to the ceiling and can jump off it; it flips back later; `twistEnabled=false` disables it |
| **M7** | Sound, timer, best time & restart | Audio feedback + a completion timer + a persisted best time + one-key restart | M6 | Jump/coin/win each beep; the WIN overlay shows this run's time and the best time; best time **survives a reload**; pressing **R** restarts with a new random flip schedule |

### Sittings (natural pause points inside the larger milestones)
- **M1** — (a) `index.html` + `style.css` + the canvas + `const Game = {}`; (b) grab the 2D context, draw one
  static square; (c) the rAF loop with `clearRect` each frame; (d) add `dt` from the timestamp and move the
  square by `speed * dt`, clamp `dt`.
- **M3** — (a) give the player velocity + a one-line integrator; (b) add signed gravity so it falls; (c) a
  floor line + stop-on-floor + set `grounded`; (d) the jump impulse gated on `grounded`.
- **M4** — (a) the platform data array + drawing them; (b) the AABB overlap test; (c) resolve the overlap on
  the smaller axis and set `grounded` on the gravity-facing side; (d) run against all platforms each frame;
  (e) **reality-check**: play it, decide it's fun enough to finish.
- **M5** — (a) the coin array + circle drawing + box collision to collect; (b) the score + HUD text; (c) the
  goal flag + the `won` state + freeze; (d) a "you win" overlay.
- **M6** — (a) the randomized flip schedule (`Math.random` interval) + `twistEnabled`; (b) the 1 s telegraph;
  (c) flip `gravitySign` and re-point "grounded"; (d) a visual cue (background tint / rotated player) so the
  flipped state is obvious.
- **M7** — (a) lazy `AudioContext` on first keydown + a `beep(freq, ms)` helper; (b) wire beeps to
  jump/coin/win; (c) the run timer; (d) `localStorage` best-time read/guard/write; (e) the `R` restart + the
  `title`/`playing`/`won` state machine.

---

## 5. Templates

### Per-step template (Highly-granular tuning)
```
# <Milestone> · Step NN of <TOTAL> — <single action title>
> Nav: [← prev](PREV.md) · [Milestone overview](00_overview.md) · [next →](NEXT.md)   ← MUST be line 2, no blank line under the H1

## Glossary for this step        (only terms THIS step introduces; omit if none)
## Why / design                  (the rationale the reader needs; omit only if pure mechanics)
## Do this                       (numbered atomic actions — every sub-action spelled out; each says WHERE + WHAT + WHY)
## Code                          (new-file steps: the complete file. edit steps: a precisely-placed fragment — see code-presentation rule below; omit if no code this step)
## Done when (this step)         (the sub-slice of the milestone gate this step satisfies, with the EXACT observable result)
## If it breaks                  (the most likely error + first thing to check)
```

**Code-presentation rule (edit-steps use fragment-plus-verify).** Because the game is split into small
classic-script files (per conventions), a **new-file step shows the complete file**. An **edit-step** (one that
changes a file already created in an earlier step) may instead show a **precisely-placed fragment** — the lines
being added or replaced, with explicit placement ("ADD this function after `X`", "REPLACE `checkGoal` with
this", "add this `<script>` tag before `render.js`") — rather than re-printing the whole file. This keeps
New-tier steps short and puts the reader's eye on exactly what changed. The **authoritative full contents of
every file the milestone touched are rendered in that milestone's `NN_verify.md`**, so the reader always has a
complete copy to diff against at the checkpoint. In every case the "Do this" section names exactly what changed
and why. (Logged as decision **D7** in `foundation/decision-log.md`.)

### Milestone-overview template (`00_overview.md`)
```
# <Milestone N> — <title>
Goal · Scope discipline (what this milestone deliberately does NOT do) · Prerequisite (prior gate green) ·
Steps-at-a-glance (grouped into the sittings above) · Design/decisions folded in ·
Done-when gate (aggregated, observable) · Handoff (what now exists · open issues · pointer to next milestone)
```

---

## 6. Writing contract

### Pedagogical rules (every step must satisfy these)
1. **Explain every concept on first use — at the New-tier depth** (the whole matrix is New): define inline or
   in a "New concept" callout on its own line above the code line it lands on, with an MDN link from the
   Verified stack, and a brief *why*. Never a bare unfamiliar term. (This is a from-zero guide — even
   `const`, an array, and an event handler get a first-use gloss.)
2. **Every action says WHERE** — which file, which line region, which browser action (open the file, open
   DevTools, press a key). Never assume the reader knows where a thing goes.
3. **Every action says WHAT it does and WHY** — the reader finishes understanding the mechanism (why `dt`,
   why clamp it, why resolve the smaller overlap axis), not just having copied it.
4. **Be exact where the outcome depends on it** — concrete config numbers (canvas 800×450, gravity, jump
   speed), exact `event.code` strings, the exact `localStorage` key; say explicitly where a value is free to
   change (colors, sizes) vs. load-bearing.
5. **Separate MANDATORY from ILLUSTRATIVE** — what the Done-when gate needs vs. an embellishment (extra
   platforms, a nicer color, a second coin) marked as optional.
6. **State which fields to change and which to LEAVE AT DEFAULT** — exhaustive for each file edit and each
   `Game.config` value, so the reader never wonders "was I supposed to touch something else?"
7. **Teach the recurring mental models at point of use** — (a) *the loop: clear → update(dt) → draw, every
   frame*; (b) *everything is a box; a collision is two boxes overlapping; resolve along the smaller overlap*;
   (c) *gravity is a signed number through one integrator — that's why the twist is cheap*. Repeat each at the
   step where it recurs, not just once.
8. **Flag load-bearing names vs cosmetic** before the reader types (the `Game` global, canvas `id`,
   `config`/`state` keys, `event.code` strings, the storage key are load-bearing; colors/sizes/title are not).
9. **Sequences are numbered lists, never arrow-chains** — arrows only for a single navigation path within one
   action.
10. **Name the common failure + its usual cause** — blank canvas (context not grabbed / script order / wrong
    canvas id), motion too fast (used a fixed step, not `dt`), player falls through platforms (`dt` not
    clamped / moved farther than a platform is thick), no sound (AudioContext not started on a gesture),
    best time never saves (`localStorage` value not `JSON`-stringified or write threw), modules-over-`file://`
    CORS error (used `type="module"` — don't).

### Verification design (Phase 5)
- **Every gate shows expected output** — not "it works" but the exact observable: the square's on-screen
  motion, the console `dt` value, the player resting *on* a platform edge (with coordinates), the score text
  incrementing, the WIN overlay text, the persisted best-time number after a reload, the audible beep.
- **Frame-rate-independence check** — M1's gate is explicitly tested by reasoning about (or, if available,
  running on) two refresh rates; the guide explains how to sanity-check with the `dt` log.
- **Consistency check before ship** — every code block uses the same `Game.config` names and `event.code`
  spellings; the `<script>` load order in `index.html` matches the dependency order every step assumes; no
  step reintroduces a fixed 60 fps assumption or hard-codes gravity direction.
- **Troubleshooting sheet** — the first-timer traps from rule 10, each with the one-line fix, plus the
  `file://` module caveat and the `roundRect` fallback for old browsers.
- **Reconcile-before-follow** — if followed on a browser that has drifted (e.g. `roundRect` unavailable, an
  autoplay-policy change), **reality wins**: patch the step and log the drift in `status.md`.
  (`/review-before-follow` + `/update-stack` support this.)

---

## 7. Folder / file layout (canonical skeleton — filled with real slugs)

```
examples/web-platformer/
  guide/
    PLAN.md                           ← THIS FILE (the only thing written now)
    README.md                         ← front door (scaffold)
    TOKEN_USAGE.md                    ← the one cost ledger (metered by the hook; scaffold seeds row 1 from the cost line below)
    feedback-log.md                   ← reader-friction log (scaffold)
    foundation/
      stack.md  audience.md  conventions.md  glossary.md  status.md  decision-log.md
    MILESTONE_1_canvas-and-loop/          00_overview.md … NN_verify.md
    MILESTONE_2_player-and-input/
    MILESTONE_3_gravity-and-jump/
    MILESTONE_4_platforms-and-collision/
    MILESTONE_5_coins-goal-win/
    MILESTONE_6_gravity-twist/
    MILESTONE_7_sound-timer-persistence/
```

The game the reader builds (created *inside* the steps, not scaffolded now) lives in their own folder — a flat
set of zero-build files:
```
shape-jumper/
  index.html          ← the canvas + the ordered <script> tags (no type="module")
  style.css           ← center the canvas, page background
  js/
    config.js         ← const Game = {}; Game.config = { …tuning constants… }
    state.js          ← Game.state = { …player, coins, mode, timer, gravitySign, nextFlipAt… }
    input.js          ← keydown/keyup → Game.input held-key flags (event.code); starts the AudioContext
    audio.js          ← Game.beep(freq, ms) via AudioContext + OscillatorNode
    storage.js        ← Game.loadBest() / Game.saveBest() via localStorage (+ JSON + try/catch)
    physics.js        ← integrate velocity, signed gravity, AABB overlap + resolution, grounded
    level.js          ← the platform/coin/goal boxes + the randomized gravity-flip schedule
    render.js         ← draw(): clearRect + fillRect/roundRect/arc/fillText
    main.js           ← the loop: requestAnimationFrame, dt (clamped), update(dt), draw()
```
`index.html` loads them in exactly this order: `config → state → input → audio → storage → physics → level →
render → main` (dependencies before dependents). That order is load-bearing and is stated in M1.

---

## 8. First move

`/draft-milestone` drafts the **whole guide in one pass** — every milestone M1→M7 in ladder order,
back-to-back — so you have the finished guide before you build. Once it's drafted I reconcile `status.md` +
the README Updates log + `examples/README.md` and run a dead-link check. You then follow the guide, building
each milestone and verifying its Done-when gate as you go (M1's "square glides at frame-rate-independent
speed" gate is the first checkpoint; M4 is the reality-check where you actually play it).

**Do not draft yet.** This plan is the deliverable. Next steps in order:
1. You approve (or adjust) this plan.
2. `/scaffold-guide` stamps the README + 5 foundation docs + milestone overview placeholders.
3. `/draft-milestone` drafts the whole guide (M1→M7).

---

*Planning cost (est.): 2026-07-10 ~14:20 UTC · `plan-guide` · ~48k tokens in / ~7k out ≈ 55k total ·
rough est. (Claude can't meter its own tokens mid-run) — `/scaffold-guide` seeds `TOKEN_USAGE.md` row 1 from
this line.*
