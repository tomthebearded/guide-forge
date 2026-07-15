# Milestone 1 · Step 02 of 6 — Create `config.js`, the `Game` namespace
> Nav: [← Page skeleton](01_page-skeleton.md) · [Overview](00_overview.md) · [Canvas context →](03_canvas-context.md)

## Glossary for this step
- **`const`** — declares a name whose *binding* never changes; here `const Game = {}` means "the name `Game` always points at this one object." (You can still add properties to that object.) See [MDN: `const`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const).
- **object `{}`** — a bag of named values (`key: value`). `Game.config.width` reads the `width` key. See [MDN: objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects).
- **namespace** — one global object (`Game`) that everything else hangs off, so we don't scatter dozens of loose global variables. See [conventions](../foundation/conventions.md#structure--architecture).

## Why / design
Because we're using **classic scripts with no modules** (see [decision D1](../foundation/decision-log.md#d1--zero-build-classic-scripts-not-es-modules)),
every script shares one global space. To keep that tidy, the **first** script declares a single object,
`Game`, and every later file attaches to it (`Game.config`, later `Game.state`, `Game.update`, …). That one
object *is* our "module system."

> **New concept — top-level `const` is shared across classic scripts.** A `const` declared at the top level of
> one classic `<script>` is visible to every *later* `<script>` on the page. That's exactly why load order
> matters and why `config.js` (which declares `Game`) must load first. See [conventions](../foundation/conventions.md#structure--architecture).

We also put **tuning constants** here — the canvas size, colors, and the delta-time clamp — separated from
anything that changes during play. Constants live in `Game.config`; the moving stuff will live in `Game.state`
later (see [conventions](../foundation/conventions.md#structure--architecture)).

## Do this
1. **Create the file `js/config.js`** with the contents in the Code block.
2. **WHAT each field is:**
   - `width` / `height` — the canvas pixel size. **Cosmetic** — change freely.
   - `colors` — a small palette. **Cosmetic.**
   - `maxDt` — the delta-time **clamp** (max seconds simulated in one frame). `1 / 30` ≈ 0.0333 s. This is
     **load-bearing for correctness** later (it stops the player tunnelling through platforms after the tab
     sleeps — see [decision D2](../foundation/decision-log.md#d2--delta-time-loop-clamped-dt)). Keep it small.
   - `demoSpeed` — how fast the M1 demo square moves, in **pixels per second**. Temporary; goes away in M2.
3. **Load-bearing name:** the object **must** be named `Game` (later files reference `Game.*` by this exact
   name). Everything else here is a value you can retune.

## Code
```js
// js/config.js — the FIRST script. Declares the one global namespace, then tuning constants.
const Game = {};

Game.config = {
  // Canvas size in pixels (cosmetic — change freely).
  width: 800,
  height: 450,

  // Palette (cosmetic).
  colors: {
    sky: '#10131a',
    player: '#4cc2ff',
  },

  // Delta-time clamp: never simulate more than this many seconds in one frame.
  // 1/30 s protects against a huge jump after the tab is backgrounded.
  maxDt: 1 / 30,

  // Speed of the M1 demo square, in pixels per second (removed in M2).
  demoSpeed: 180,
};
```

## Done when (this step)
- [ ] `js/config.js` exists and declares `const Game = {}` followed by `Game.config = { … }`.
- [ ] Opening `index.html` and then the DevTools Console (F12) shows **no error** for `config.js` (the 404 for
      `main.js` is still expected — that's the next step).

## If it breaks
- **`Uncaught SyntaxError`** — check for a missing comma between object fields or a missing closing `}`. Objects
  are comma-separated `key: value` pairs.
- **Console says `Game is not defined` (later)** — `config.js` isn't loading *first*, or its `<script>` tag is
  missing/misspelled in `index.html`. It must be the first game script.
