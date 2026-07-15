# Milestone 4 · Step 02 of 4 — Solid collision: the AABB test + resolution
> Nav: [← Level data](01_level-data.md) · [Overview](00_overview.md) · [Reality-check →](03_reality-check.md)

> **This step touches 2 files, edited together:** `js/physics.js` (rewrite) and `js/config.js` (remove `floorY`).

## Glossary for this step
- **AABB (axis-aligned bounding box)** — a non-rotated rectangle used as a collision shape; two AABBs collide when they overlap on **both** the x and y axes. See [glossary](../foundation/glossary.md).
- **collision resolution** — after detecting an overlap, moving the player out so solids stay solid. See [glossary](../foundation/glossary.md).
- **separate-axis resolution** — move on X and resolve, then move on Y and resolve, handling one axis at a time. This is the simplest reliable approach. See [glossary](../foundation/glossary.md).
- **`Math.sign(n)`** — returns `-1` if `n` is negative, `+1` if positive, `0` if zero; we use it to compare a velocity's *direction* to `gravitySign`. See [MDN: Math.sign](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sign).

## Why / design
Now we make platforms **solid**. We add one reusable test, `Game.overlaps(a, b)`, and rewrite the movement so
that after moving on each axis we push the player back out of anything it overlaps. Doing X and Y **separately**
makes it easy to know *which way* to push and *when the player has landed*.

> **New concept — the AABB overlap test.** Two boxes overlap only if they overlap on **both** axes at once:
> `a.x < b.x + b.w && a.x + a.w > b.x` (x overlap) **and** the same for y. If either axis has a gap, they don't
> touch. This one function is the heart of all collision — we reuse it for coins and the goal later. See [MDN: 2D collision detection](https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection).

> **New concept — resolve by axis, and that tells you "grounded".** We move on X, then for each platform we
> overlap we shove the player to the platform's left or right face (based on which way it was moving) and zero
> `vx`. Then we move on Y and do the same vertically. The key trick: when the vertical hit is on the side
> gravity pulls toward (`Math.sign(p.vy) === gravitySign`), the player has **landed** → `grounded = true`. That
> single comparison is why landing on a *ceiling* (gravity up, M6) will just work. See decision [D3](../foundation/decision-log.md#d3--gravity-sign-aware-physics).

## Do this
1. **Open `js/config.js`** and **remove the `floorY` line** — the floor is now just `platforms[0]`, so nothing
   should reference `floorY` anymore. The full file is in the Code block.
2. **Open `js/physics.js`.** **Replace its entire contents** with the Code block below. Read the comments — the
   structure is:
   1. jump (unchanged from M3);
   2. horizontal: set `vx`, move `x`, then **resolve X** against every platform, then clamp to the canvas;
   3. vertical: apply gravity, move `y`, then **resolve Y** against every platform, setting `grounded` on the
      gravity-facing side.
3. **WHAT the resolution does, precisely:**
   - **X:** if `vx > 0` (moving right) the player hit a platform's **left** face → set `p.x = plat.x - p.w`.
     If `vx < 0` (moving left) it hit the **right** face → `p.x = plat.x + plat.w`. Zero `vx`.
   - **canvas clamp:** keep `p.x` within `[0, width - w]` so the player can't leave the screen sideways.
   - **Y:** if `vy > 0` (moving down) it landed on a **top** face → `p.y = plat.y - p.h`. If `vy < 0` (moving
     up) it bonked a **bottom** face → `p.y = plat.y + plat.h`. If `Math.sign(p.vy) === s.gravitySign`, set
     `grounded = true`. Zero `vy`.
4. **Save and open `index.html`.** The player now lands on every ledge, is blocked by their sides, bonks its
   head on undersides, and can't leave the screen.

## Code
```js
// js/config.js — tuning constants (floorY removed; the floor is now a platform).
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
  moveSpeed: 240,

  gravity: 1800,
  jumpSpeed: 620,
};
```

```js
// js/physics.js — motion + gravity + AABB collision. Sign-aware throughout.

// Do two boxes {x,y,w,h} overlap? (Axis-Aligned Bounding Box test.)
Game.overlaps = function (a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
};

Game.updatePlayer = function (dt) {
  const cfg = Game.config;
  const s = Game.state;
  const p = s.player;
  const input = Game.input;

  // Jump: only if grounded. Launch AGAINST gravity.
  if (input.jumpQueued && p.grounded) {
    p.vy = -cfg.jumpSpeed * s.gravitySign;
    p.grounded = false;
  }
  input.jumpQueued = false;

  // --- Horizontal: move, then resolve X against platforms, then clamp to canvas. ---
  let dir = 0;
  if (input.left)  dir -= 1;
  if (input.right) dir += 1;
  p.vx = dir * cfg.moveSpeed;
  p.x += p.vx * dt;

  for (const plat of Game.level.platforms) {
    if (Game.overlaps(p, plat)) {
      if (p.vx > 0)      p.x = plat.x - p.w;      // hit left face
      else if (p.vx < 0) p.x = plat.x + plat.w;   // hit right face
      p.vx = 0;
    }
  }
  if (p.x < 0) p.x = 0;
  if (p.x + p.w > cfg.width) p.x = cfg.width - p.w;

  // --- Vertical: gravity, move, then resolve Y against platforms. ---
  p.vy += cfg.gravity * s.gravitySign * dt;
  p.y += p.vy * dt;

  p.grounded = false;
  for (const plat of Game.level.platforms) {
    if (Game.overlaps(p, plat)) {
      if (p.vy > 0)      p.y = plat.y - p.h;       // landed on a top face
      else if (p.vy < 0) p.y = plat.y + plat.h;    // bonked a bottom face
      // Grounded only when the surface is on the side gravity pulls toward.
      if (Math.sign(p.vy) === s.gravitySign) p.grounded = true;
      p.vy = 0;
    }
  }
};
```

## Done when (this step)
- [ ] The player lands and rests on **every** platform (floor + three ledges).
- [ ] Walking into a platform's **side** stops the player (it can't slide through).
- [ ] Jumping into a platform's **underside** stops upward motion (a head-bonk), then the player falls.
- [ ] The player cannot walk off the **left or right** edge of the canvas.

## If it breaks
- **Player passes through ledges** — `physics.js` still has the old `floorY` clamp instead of the platform
  loops, or `Game.overlaps` is misdefined. Both axis loops must run after their respective moves.
- **Player sticks to walls / can't fall past a side** — that's usually fine (separate-axis snags at exact
  corners are rare); if it's constant, check your X-resolution uses `p.vx` sign, not `p.vy`.
- **Player can jump but never lands (falls forever)** — the Y loop isn't running, or `grounded` isn't set.
  Confirm `if (Math.sign(p.vy) === s.gravitySign) p.grounded = true;` is inside the overlap branch.
- **`floorY is not defined`** — something still references the deleted constant. Search your files for `floorY`
  and remove the last use.
