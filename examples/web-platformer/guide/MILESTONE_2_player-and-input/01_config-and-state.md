# Milestone 2 · Step 01 of 5 — Update `config.js` and create `state.js`
> Nav: — · [Overview](00_overview.md) · [Input →](02_input.md)

> **This step touches 2 files, edited/created together:** `js/config.js` (edit) and `js/state.js` (new).

## Glossary for this step
- **entity** — any game object with a position and size, stored as `{x, y, w, h}`. The player is our first entity. See [glossary](../foundation/glossary.md).
- **`vx` (horizontal velocity)** — how fast the player moves sideways, in **pixels per second**. Positive = right, negative = left. See [glossary](../foundation/glossary.md).
- **`config` vs `state`** — `config` holds constants that never change during play; `state` holds everything that mutates each frame. See [conventions](../foundation/conventions.md#structure--architecture).

## Why / design
The demo square kept its position in a loose `boxX` variable. That doesn't scale. From here on, **all mutable
game data lives in one place, `Game.state`**, and all tuning constants live in `Game.config`. This split is a
convention the whole guide leans on: when you wonder "where does the player's position live?", the answer is
always `Game.state.player`.

## Do this
1. **Open `js/config.js`.** **Replace its entire contents** with the Code block below.
   - **WHAT changed:** removed `demoSpeed` (the demo is gone), added `player: { w, h }` (the player's size,
     **cosmetic**) and `moveSpeed` (the run speed in **pixels per second** — retune to taste).
2. **Create `js/state.js`** with the Code block below.
   - `Game.state.player` is the player entity: position `x, y`, size `w, h` (pulled from `config` so there's
     one source of truth for the size), and `vx` (horizontal velocity, starts at 0).
   - **WHERE the size comes from:** `Game.config.player.w` — note `config.js` loads *before* `state.js`, so
     `Game.config` already exists. That load order is **load-bearing** (see [conventions](../foundation/conventions.md#structure--architecture)).
3. **Load-bearing names:** `Game.state`, `Game.state.player`, and the keys `x, y, w, h, vx` are referenced by
   `input.js`, `render.js`, and `main.js` by these exact names. The numeric values (start position, speed) are
   free to change.

## Code
```js
// js/config.js — tuning constants (no runtime state here).
const Game = {};

Game.config = {
  width: 800,
  height: 450,

  colors: {
    sky: '#10131a',
    player: '#4cc2ff',
  },

  maxDt: 1 / 30, // delta-time clamp (seconds)

  player: { w: 28, h: 36 }, // player size in pixels (cosmetic)
  moveSpeed: 240,           // horizontal run speed, pixels per second
};
```

```js
// js/state.js — everything that MUTATES during play.
Game.state = {
  player: {
    x: 40,   // starting position
    y: 200,
    w: Game.config.player.w,
    h: Game.config.player.h,
    vx: 0,   // horizontal velocity, px/second (0 = standing still)
  },
};
```

## Done when (this step)
- [ ] `js/config.js` has `player` and `moveSpeed`, and no longer mentions `demoSpeed`.
- [ ] `js/state.js` exists and defines `Game.state.player` with `x, y, w, h, vx`.
- [ ] The page doesn't error yet on these two files (it still references the *old* `main.js`, which we fix in step 04 — a transient broken state is fine until then).

## If it breaks
- **`Cannot read properties of undefined (reading 'w')` in `state.js`** — `config.js` isn't loading before
  `state.js`. We add the `state.js` script tag in step 04; until then this file isn't loaded, so this error
  only appears once wiring is done — check script order then.
- **You reloaded and the demo square froze or vanished** — expected and transient: the *old* `main.js` still references the `demoSpeed` you just removed, so its motion math becomes `NaN` (the page won't throw an error, the square just stops or disappears). Step 04 replaces `main.js` and it comes back to life.
- **You deleted `moveSpeed` by accident** — the player won't move in step 04. It must be a number of pixels per second.
