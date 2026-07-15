# Milestone 3 · Step 01 of 5 — Add gravity constants and vertical state
> Nav: — · [Overview](00_overview.md) · [Physics: gravity →](02_physics-gravity.md)

> **This step touches 2 files, edited together:** `js/config.js` and `js/state.js`.

## Glossary for this step
- **acceleration** — how fast a velocity changes per second. Gravity is a constant downward acceleration. See [glossary](../foundation/glossary.md).
- **`vy` (vertical velocity)** — speed up/down in px/second. In y-down coordinates, **positive `vy` = moving down**. See [glossary](../foundation/glossary.md).
- **`grounded`** — a flag that's `true` when the player is resting on a surface (the only time a jump is allowed). See [glossary](../foundation/glossary.md).
- **`gravitySign`** — `+1` = gravity pulls down (normal), `-1` = up (the M6 twist). All vertical physics multiplies by it. See [conventions](../foundation/conventions.md#language--framework-specifics).

## Why / design
Before writing physics, we add the numbers it needs (`gravity`, `jumpSpeed`, `floorY`) to `config`, and the
per-frame values it changes (`vy`, `grounded`, and the world-level `gravitySign`) to `state`.

> **New concept — why a *sign* instead of just "down"?** We could hard-code gravity as "always increase `y`."
> But the whole twist in M6 is flipping gravity's direction. If we bake in a `gravitySign` now (+1 today,
> flippable later) and multiply every vertical force by it, the twist becomes a one-line sign change instead of
> a rewrite. This is decision [D3](../foundation/decision-log.md#d3--gravity-sign-aware-physics) — the guide's spine.

## Do this
1. **Open `js/config.js`.** **Replace its contents** with the Code block below.
   - **WHAT's new:** `gravity` (downward acceleration magnitude, px/s²), `jumpSpeed` (launch speed, px/s),
     `floorY` (the y of the floor's top edge — **load-bearing**: `physics.js` and `render.js` both read it),
     and a `platform` color for drawing the floor.
   - The values (`1800`, `620`, `420`) are tuned so the player can jump ~107 px high — enough to reach the
     platforms in M4. Retune to taste, but keep `floorY` under `height` (450).
2. **Open `js/state.js`.** **Replace its contents** with the Code block below.
   - **WHAT's new:** the player gains `vy: 0` and `grounded: false`; the state gains `gravitySign: 1`.
3. **Load-bearing names:** `vy`, `grounded`, `gravitySign`, `floorY`, `gravity`, `jumpSpeed` — spelled exactly
   as here everywhere they recur. The numbers are free to retune.

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
    platform: '#3a4256',
  },

  maxDt: 1 / 30,

  player: { w: 28, h: 36 },
  moveSpeed: 240,   // horizontal run speed, px/second

  gravity: 1800,    // downward acceleration magnitude, px/second^2
  jumpSpeed: 620,   // jump launch speed, px/second
  floorY: 420,      // y of the floor's top edge (px from the top)
};
```

```js
// js/state.js — everything that MUTATES during play.
Game.state = {
  player: {
    x: 40,
    y: 200,
    w: Game.config.player.w,
    h: Game.config.player.h,
    vx: 0,
    vy: 0,          // vertical velocity (px/s); +y is down
    grounded: false // resting on a surface?
  },

  gravitySign: 1,   // +1 = gravity pulls down (normal); -1 = up (M6 twist)
};
```

## Done when (this step)
- [ ] `config.js` has `gravity`, `jumpSpeed`, `floorY`, and `colors.platform`.
- [ ] `state.js` player has `vy` and `grounded`; state has `gravitySign: 1`.
- [ ] The page still runs as it did in M2 (nothing reads the new values yet — that's the next step).

## If it breaks
- **Player vanished / errors** — a typo in the objects (missing comma or brace). Check the Console; objects are
  comma-separated `key: value` pairs.
- **You changed `floorY` above `height`** — the floor would be off-screen. Keep `floorY` < `height`.
