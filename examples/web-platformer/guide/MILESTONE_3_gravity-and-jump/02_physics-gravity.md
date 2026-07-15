# Milestone 3 · Step 02 of 5 — Create `physics.js`: velocity + gravity (the player falls)
> Nav: [← Config & state](01_config-and-state.md) · [Overview](00_overview.md) · [Floor & grounded →](03_floor-and-grounded.md)

> **This step touches 3 files, edited together:** `js/physics.js` (new), `js/main.js` (edit), `index.html` (add a script tag).

## Glossary for this step
- **integrator** — the two-line pattern that turns forces into motion each frame: add acceleration to velocity, then add velocity to position (each scaled by `dt`). See [glossary](../foundation/glossary.md).
- **gravity** — a constant acceleration applied to `vy` every frame; over time it makes things fall faster and faster. See [glossary](../foundation/glossary.md).

## Why / design
We move all player motion into a dedicated **`physics.js`** so `main.js` stays a thin conductor. This step
gives the player gravity: each frame we add `gravity * gravitySign * dt` to `vy`, then add `vy * dt` to `y`.
With no floor yet, the player will **fall off the bottom** — that's expected, and we catch it in the next step.

> **New concept — the integrator.** Motion under a force is always the same two lines:
> `velocity += acceleration * dt;` then `position += velocity * dt;`. Gravity is the acceleration. We already
> did `position += velocity * dt` for horizontal movement in M2; now we add the vertical half plus the
> acceleration line. Multiplying gravity by `gravitySign` is what keeps it flippable (decision [D3](../foundation/decision-log.md#d3--gravity-sign-aware-physics)).

## Do this
1. **Create `js/physics.js`** with the Code block below. It defines `Game.updatePlayer(dt)`, which now owns the
   horizontal movement (moved out of `main.js`) **and** the new gravity + vertical integration.
2. **Open `index.html`** and add the `physics.js` script tag **after `input.js` and before `render.js`**
   (see the Code block). Order: `config, state, input, physics, render, main`.
3. **Open `js/main.js`** and **replace the `Game.update` function** so it just calls `Game.updatePlayer(dt)`
   (the horizontal logic now lives in `physics.js`). The loop at the bottom is unchanged. The Code block shows
   the whole file.
4. **Save and open `index.html`.** The player should **fall straight down and off the bottom edge**. That's
   correct for this step — the floor comes next.

## Code
```js
// js/physics.js — motion + gravity. Gravity is SIGN-AWARE from the start.
Game.updatePlayer = function (dt) {
  const cfg = Game.config;
  const s = Game.state;
  const p = s.player;
  const input = Game.input;

  // Horizontal: velocity straight from held keys, then integrate position.
  let dir = 0;
  if (input.left)  dir -= 1;
  if (input.right) dir += 1;
  p.vx = dir * cfg.moveSpeed;
  p.x += p.vx * dt;

  // Vertical: gravity changes velocity (gravitySign picks direction), then integrate.
  p.vy += cfg.gravity * s.gravitySign * dt;
  p.y += p.vy * dt;
};
```

```html
<!-- index.html — script tags only; the rest of the file is unchanged. -->
  <script src="js/config.js"></script>
  <script src="js/state.js"></script>
  <script src="js/input.js"></script>
  <script src="js/physics.js"></script>
  <script src="js/render.js"></script>
  <script src="js/main.js"></script>
```

```js
// js/main.js — the loop now delegates all player motion to physics.js.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = Game.config.width;
canvas.height = Game.config.height;

Game.ctx = ctx;

Game.update = function (dt) {
  Game.updatePlayer(dt);
};

let lastTime = null;
function frame(timestamp) {
  if (lastTime === null) lastTime = timestamp;
  let dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  if (dt > Game.config.maxDt) dt = Game.config.maxDt;

  Game.update(dt);
  Game.draw();

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
```

## Done when (this step)
- [ ] Opening `index.html`, the player **accelerates downward** and falls off the bottom of the canvas.
- [ ] Left/right still steer it while it falls.
- [ ] No Console errors.

## If it breaks
- **Player doesn't fall** — `physics.js` isn't loaded or `main.js` still has the old inline movement. Confirm
  the script tag order and that `Game.update` calls `Game.updatePlayer(dt)`.
- **Player falls instantly off-screen in one frame** — you added `gravity` to `y` directly instead of to `vy`,
  or forgot a `* dt`. Gravity goes into `vy`; `vy` goes into `y`; both scaled by `dt`.
- **`Game.updatePlayer is not a function`** — `physics.js` loads *after* `main.js`. It must come before `main.js`.
