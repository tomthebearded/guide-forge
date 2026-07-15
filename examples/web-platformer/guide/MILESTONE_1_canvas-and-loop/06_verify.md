# Milestone 1 · Step 06 of 6 — Verify
> Nav: [← Delta time](05_delta-time.md) · [Overview](00_overview.md) · [M2: Player & keyboard →](../MILESTONE_2_player-and-input/00_overview.md)

## Done-when gate (the milestone acceptance test)
Run all three by hand:

- [ ] **It draws and moves.** Open `index.html` → an 800×450 dark canvas is centered on the page, and a blue
      square glides left-to-right, wrapping back to the left edge, smoothly and forever. *No smear/trail.*
- [ ] **It's frame-rate independent.** The square moves at a steady real-world speed (~180 px/s). If you have
      access to a high-refresh screen, it looks the same speed there — because motion is `demoSpeed * dt`, not a
      per-frame constant. A quick proof on any screen: raise `demoSpeed` in `config.js`, reload, and the square
      speeds up predictably.
- [ ] **`dt` is visible.** DevTools **Console** (F12) prints a `dt` line each frame, e.g. `dt 0.0167` on a
      60 Hz display (≈1/60 second). The number stays small and roughly steady.

## Files after this milestone
Your project is exactly these four files:

```
shape-jumper/
  index.html
  style.css
  js/
    config.js
    main.js
```

### `index.html`
```html
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

  <!-- Classic scripts, loaded in dependency order. NOT type="module" (that breaks on file://). -->
  <script src="js/config.js"></script>
  <script src="js/main.js"></script>
</body>
</html>
```

### `style.css`
```css
/* style.css — all cosmetic; retune freely. */
html, body {
  margin: 0;
  height: 100%;
  background: #05070c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: system-ui, sans-serif;
}
#game {
  background: #10131a;
  border: 1px solid #2a2f3a;
}
```

### `js/config.js`
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

### `js/main.js`
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

## Troubleshooting recap
- **Smear/trail** → background repaint isn't first each frame.
- **Freezes after one frame** → missing `requestAnimationFrame(frame)` inside `frame`.
- **Speed tied to monitor** → you're not multiplying by `dt`.
- **`Game is not defined`** → `config.js` must load before `main.js` in `index.html`.
- **Big teleport after tab-switch** → the `maxDt` clamp is missing.

## Next
Once all three gate items pass, go to
**[M2 — Player & keyboard control](../MILESTONE_2_player-and-input/00_overview.md)**: replace the demo square
with a real player you steer with the keyboard. (Remember to update `foundation/status.md` — mark M1 ✅.)
