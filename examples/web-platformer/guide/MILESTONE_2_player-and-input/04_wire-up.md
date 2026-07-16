# Milestone 2 · Step 04 of 5 — Wire it up: `index.html` script tags + split `main.js`
> Nav: [← Render](03_render.md) · [Overview](00_overview.md) · [Verify →](05_verify.md)

> **This step touches 2 files, edited together:** `index.html` (add script tags) and `js/main.js` (rewrite).

## Glossary for this step
- **`update(dt)`** — the function that advances the world by `dt` seconds (moves the player, later applies gravity/collision). Changes `Game.state`. See [conventions](../foundation/conventions.md#structure--architecture).
- **`draw()`** — the function that paints the current state. Reads state, changes nothing. See [glossary](../foundation/glossary.md).

## Why / design
Now we connect the pieces. `index.html` must load the three new scripts **in dependency order**
(`state → input → render`, all before `main`), and `main.js` becomes the conductor: each frame it computes
`dt`, calls `Game.update(dt)` to move the world, then `Game.draw()` to paint it. This **update-then-draw** split
is the shape of every future frame.

> **New concept — one update, one draw, per frame.** `main.js` owns the loop and calls exactly two things:
> `update(dt)` (change the world) then `draw()` (show it). No drawing inside update, no state changes inside
> draw. Keeping them apart is what stops a growing game from turning into spaghetti. See [conventions](../foundation/conventions.md#structure--architecture).

## Do this
1. **Open `index.html`.** **Replace the two script tags** at the bottom with the **five** in the Code block —
   order matters: `config → state → input → render → main`.
   - **WHY this order:** each file uses names defined by an earlier one. `state.js` uses `Game.config`;
     `render.js` uses `Game.state`; `main.js` uses all of them. Wrong order = `undefined` errors.
2. **Open `js/main.js`.** **Replace its entire contents** with the Code block below.
   - **WHAT changed vs M1:** the demo box is gone. We set `Game.ctx = ctx` so `render.js` can draw. We add
     `Game.update(dt)` which reads `Game.input` and sets the player's `vx`, then moves `x` by `vx * dt`. The
     loop now calls `Game.update(dt)` then `Game.draw()`.
   - **WHAT the direction math does:** `dir` is `-1` (left held), `+1` (right held), or `0` (neither, or both —
     they cancel). `vx = dir * moveSpeed`. So both-held → `dir 0` → stands still.
3. **Save and open `index.html`.** Hold ←/→ (or A/D) to move the player.

## Code
```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Shape Jumper</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <canvas id="game"></canvas>

  <!-- Load order = dependency order. NOT type="module". -->
  <script src="js/config.js"></script>
  <script src="js/state.js"></script>
  <script src="js/input.js"></script>
  <script src="js/render.js"></script>
  <script src="js/main.js"></script>
</body>
</html>
```

```js
// js/main.js — the LAST script. Owns the loop: dt -> update -> draw.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = Game.config.width;
canvas.height = Game.config.height;

Game.ctx = ctx; // render.js draws through this

// Advance the world by dt seconds. (Horizontal movement only, for now.)
Game.update = function (dt) {
  const p = Game.state.player;
  const input = Game.input;

  // Direction from held keys: -1 left, +1 right, 0 if neither or both.
  let dir = 0;
  if (input.left)  dir -= 1;
  if (input.right) dir += 1;

  p.vx = dir * Game.config.moveSpeed;
  p.x += p.vx * dt; // pixels/second * seconds = pixels
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
- [ ] The player rectangle is drawn and holding ←/→ (or A/D) moves it smoothly at ~240 px/s.
- [ ] Releasing all keys stops it; holding both left and right keeps it still.

## If it breaks
- **`Game.state is undefined` / `Game.input is undefined`** — the `<script>` tags are out of order or one is
  missing. The order must be `config, state, input, render, main`.
- **Player draws but won't move** — `main.js` isn't reading input or not multiplying by `dt`. Confirm
  `p.x += p.vx * dt` and that `Game.input.left/right` are the names `input.js` sets.
- **Player moves but the screen smears** — `Game.draw()` isn't repainting the background first; check
  `render.js` paints the sky before the player.
- **Arrow keys scroll the page instead of moving** — harmless here (the page doesn't scroll); we add
  `preventDefault` for jump keys in M3.

---
> Nav: [← Render](03_render.md) · [Overview](00_overview.md) · [Verify →](05_verify.md)
