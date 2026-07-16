# Milestone 1 · Step 04 of 6 — Animate it with `requestAnimationFrame`
> Nav: [← Canvas context](03_canvas-context.md) · [Overview](00_overview.md) · [Delta time →](05_delta-time.md)

## Glossary for this step
- **game loop** — the repeating "update the world, then draw it" cycle that runs many times per second to produce motion. See [glossary](../foundation/glossary.md).
- **frame** — one pass through the loop: clear, update, draw once. See [glossary](../foundation/glossary.md).
- **`requestAnimationFrame(fn)`** — asks the browser to call `fn` once, right before the next screen repaint (≈60 times/second on a 60 Hz screen). Calling it again inside `fn` makes a loop. See [MDN: requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame).
- **`clearRect` (via `fillRect`)** — repainting the background each frame erases the previous frame; without it, the square would smear a trail. See [MDN: clearRect](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/clearRect).

## Why / design
A still square isn't a game. To animate, we run a **loop**: every frame we (1) repaint the background to erase
the last frame, (2) move the square, (3) draw it, then (4) ask for the next frame. `requestAnimationFrame` is
the right timer for this — it syncs to the display's refresh and pauses when the tab is hidden.

> **New concept — the loop is the heartbeat.** `requestAnimationFrame(frame)` runs `frame` once; the last line
> *inside* `frame` calls `requestAnimationFrame(frame)` again, so it repeats forever. This "call myself again
> at the end" is the entire engine. We'll refine *how far* to move each frame in the next step. See [decision D2](../foundation/decision-log.md#d2--delta-time-loop-clamped-dt).

## Do this
1. **Open `js/main.js`** and **replace its entire contents** with the Code block below. (We keep the canvas/
   context setup and turn the one-shot draw into a repeating `frame` function.)
2. **WHAT changed:**
   - The drawing moved *inside* a function called `frame`.
   - `boxX` is a variable we increase each frame (naively, by a fixed 3 pixels) so the square drifts right.
   - When the square runs off the right edge, we wrap it back to the left.
   - The last line of `frame`, `requestAnimationFrame(frame)`, schedules the next frame.
   - The last line of the file kicks off the very first frame.
3. **Save and reload `index.html`.** The square should now slide to the right and wrap around.
4. **Read this carefully — it has a bug on purpose:** moving "3 pixels per frame" ties speed to the refresh
   rate. On a 144 Hz screen it moves ~2.4× faster than on 60 Hz. The next step fixes that. This is the single
   most important lesson in the guide, so we let you *see* the wrong version first.

## Code
```js
// js/main.js — the animation loop (naive fixed-step version; fixed in the next step).
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = Game.config.width;
canvas.height = Game.config.height;

// Demo box state (replaced by the real player in Milestone 2).
let boxX = 0;
const boxY = 200;
const boxSize = 40;

function frame() {
  // Update: move right by a fixed 3 pixels, wrap at the edge.
  boxX += 3;
  if (boxX > canvas.width) boxX = -boxSize;

  // Draw: repaint the background (erases last frame), then the square.
  ctx.fillStyle = Game.config.colors.sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = Game.config.colors.player;
  ctx.fillRect(boxX, boxY, boxSize, boxSize);

  // Ask for the next frame — this is what makes it a loop.
  requestAnimationFrame(frame);
}

// Kick off the first frame.
requestAnimationFrame(frame);
```

## Done when (this step)
- [ ] Reloading `index.html` shows the blue square **sliding left-to-right** and wrapping back to the left edge, smoothly and forever.
- [ ] No trail/smear follows the square (the background repaint each frame erased the last position).

## If it breaks
- **The square smears a solid blue trail** — you're not repainting the background each frame. The
  `ctx.fillRect(0, 0, …)` sky fill must run **first**, every frame, inside `frame`.
- **It draws once and freezes** — the `requestAnimationFrame(frame)` line inside `frame` is missing, so the
  loop never repeats.
- **Nothing moves / immediate error** — check the Console. `boxX` must be declared with `let` (it changes);
  `boxY`/`boxSize` with `const` is fine.

---
> Nav: [← Canvas context](03_canvas-context.md) · [Overview](00_overview.md) · [Delta time →](05_delta-time.md)
