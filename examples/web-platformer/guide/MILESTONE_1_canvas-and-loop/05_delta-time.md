# Milestone 1 · Step 05 of 6 — Make it frame-rate independent with delta time
> Nav: [← Animation loop](04_animation-loop.md) · [Overview](00_overview.md) · [Verify →](06_verify.md)

## Glossary for this step
- **delta time (`dt`)** — the number of **seconds** since the previous frame. Multiplying motion by `dt` makes speed depend on *time*, not on how often the browser draws. See [glossary](../foundation/glossary.md).
- **timestamp** — `requestAnimationFrame` passes your function a high-precision time in **milliseconds** (from `performance.now()`); subtracting the previous timestamp gives the gap between frames. See [MDN: requestAnimationFrame callback](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame).
- **clamp** — force a value to stay under a maximum; here we cap `dt` so one giant frame can't teleport the square. See [glossary](../foundation/glossary.md).
- **`Number.toFixed(n)`** — formats a number as a **string** with exactly `n` digits after the decimal point (e.g. `(0.0167).toFixed(4)` → `"0.0167"`). Purely for a readable log here; you'll see it again formatting the timer in M7. See [MDN: toFixed](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toFixed).

## Why / design
This is the fix for the previous step's deliberate bug. Instead of "move 3 pixels **per frame**," we move
"`demoSpeed` pixels **per second**," scaled by how long the frame actually took. Now a 144 Hz screen draws more
frames, but each frame's `dt` is smaller, so the square covers the *same distance per second* everywhere.

> **New concept — always scale motion by `dt`.** MDN is explicit: use the callback's timestamp to compute
> progress, or your animation runs faster on high-refresh-rate screens. Every moving thing in this game
> multiplies its speed by `dt`. Memorize the shape: `position += velocity * dt`. See [MDN note](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) and [decision D2](../foundation/decision-log.md#d2--delta-time-loop-clamped-dt).

> **New concept — clamp `dt`.** If you switch tabs, the next frame's `dt` could be *seconds*, hurling
> the square across the screen (and, later, straight through a platform). We cap `dt` at `Game.config.maxDt`
> (1/30 s). This one line prevents a whole class of collision bugs in M4.

## Do this
1. **Open `js/main.js`** and **replace its entire contents** with the Code block below.
2. **WHAT changed vs the previous step:**
   - `frame` now receives a **`timestamp`** parameter (the browser passes it automatically).
   - We compute `dt = (timestamp - lastTime) / 1000` — the `/1000` converts milliseconds to **seconds**.
   - `lastTime` remembers the previous frame's timestamp; on the very first frame we seed it so `dt` starts at 0.
   - We **clamp**: `if (dt > Game.config.maxDt) dt = Game.config.maxDt;`.
   - Movement is now `boxX += Game.config.demoSpeed * dt;` — pixels-per-second × seconds = pixels.
   - `console.log('dt', dt.toFixed(4))` prints the gap each frame so you can *see* it.
3. **Save, reload `index.html`, and open the Console (F12 → Console tab).** You'll see a stream of `dt` values
   around `0.0167` on a 60 Hz screen. The square glides at a steady, sensible speed.
4. **Load-bearing takeaway:** every future movement — the player, gravity, the jump — uses `* dt`. If motion
   ever feels tied to your monitor, this is the first thing to check.

## Code
```js
// js/main.js — the frame-rate-independent loop (delta time + clamp).
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = Game.config.width;
canvas.height = Game.config.height;

// Demo box state (replaced by the real player in Milestone 2).
let boxX = 0;
const boxY = 200;
const boxSize = 40;

let lastTime = null; // timestamp of the previous frame, in ms

function frame(timestamp) {
  // First frame: no previous time yet, so dt = 0 this once.
  if (lastTime === null) lastTime = timestamp;
  let dt = (timestamp - lastTime) / 1000; // ms -> seconds
  lastTime = timestamp;

  // Clamp: never simulate a huge jump (e.g. after the tab was hidden).
  if (dt > Game.config.maxDt) dt = Game.config.maxDt;

  console.log('dt', dt.toFixed(4)); // watch this in the Console

  // Update: move demoSpeed pixels PER SECOND, scaled by dt. Wrap at the edge.
  boxX += Game.config.demoSpeed * dt;
  if (boxX > canvas.width) boxX = -boxSize;

  // Draw: background first (erase), then the square.
  ctx.fillStyle = Game.config.colors.sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = Game.config.colors.player;
  ctx.fillRect(boxX, boxY, boxSize, boxSize);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
```

## Done when (this step)
- [ ] The square still glides smoothly, but now at a speed set by `demoSpeed` (≈180 px/s), independent of frame rate.
- [ ] The Console prints a `dt` line every frame — a small number like `0.0167` (≈1/60 s) on a 60 Hz display.
- [ ] Changing `demoSpeed` in `config.js` and reloading visibly changes the square's speed.

## If it breaks
- **The square jumps a big gap on the first move or after tab-switching** — your clamp is missing or wrong;
  confirm `if (dt > Game.config.maxDt) dt = Game.config.maxDt;` runs *before* you use `dt`.
- **The square doesn't move** — you're multiplying by `dt` while `lastTime` never updates, so `dt` stays 0.
  Ensure `lastTime = timestamp;` runs every frame *after* computing `dt`.
- **`dt` logs `NaN`** — `frame` isn't receiving `timestamp`. It must be `function frame(timestamp)` and be
  called by `requestAnimationFrame` (which supplies the argument), not called directly with no argument.

---
> Nav: [← Animation loop](04_animation-loop.md) · [Overview](00_overview.md) · [Verify →](06_verify.md)
