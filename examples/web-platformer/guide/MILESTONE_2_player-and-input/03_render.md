# Milestone 2 · Step 03 of 5 — Create `render.js`, draw the player
> Nav: [← Input](02_input.md) · [Overview](00_overview.md) · [Wire it up →](04_wire-up.md)

## Glossary for this step
- **`roundRect(x, y, w, h, r)`** — a Canvas path method that outlines a rectangle with rounded corners of radius `r`; you then `fill()` it. See [MDN: roundRect](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/roundRect).
- **path** — some Canvas shapes (like `roundRect` and circles) are drawn by *describing* a path with `beginPath()`, then painting it with `fill()`. Simple rectangles (`fillRect`) skip this. See [MDN: Canvas paths](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes).

## Why / design
Drawing gets its own file. `render.js` holds **`Game.draw()`**, which paints the whole scene each frame by
*reading* `Game.state` — it never changes state (that's `update`'s job; see [conventions](../foundation/conventions.md#structure--architecture)).
Keeping "change the world" and "draw the world" in separate functions is what keeps the game understandable as
it grows.

> **New concept — `roundRect` is recent; guard it.** `roundRect` only became broadly available in browsers in
> 2023 (Baseline "widely available" as of Oct 2025 — see [stack.md](../foundation/stack.md)). On an older
> browser it won't exist, so we check `if (ctx.roundRect)` and fall back to a plain `fillRect`. The player is a
> rounded rectangle where supported, a sharp one otherwise — purely cosmetic.

## Do this
1. **Create `js/render.js`** with the Code block below.
2. **WHAT it does:**
   - Reads `Game.ctx` (the 2D context — `main.js` will set this in step 04) and `Game.state.player`.
   - Paints the sky background first (this erases the previous frame — same idea as M1).
   - Draws the player: a rounded rectangle if `roundRect` exists, else a plain rectangle.
   - **WHERE the color comes from:** `Game.config.colors.player`. Cosmetic.
3. **Load-bearing names:** `Game.draw` and `Game.ctx` (set by `main.js` next step). The corner radius `6` and
   colors are cosmetic.

## Code
```js
// js/render.js — draw the whole scene each frame. Reads state; never mutates it.
Game.draw = function () {
  const ctx = Game.ctx;
  const cfg = Game.config;
  const p = Game.state.player;

  // Background first (erases the previous frame).
  ctx.fillStyle = cfg.colors.sky;
  ctx.fillRect(0, 0, cfg.width, cfg.height);

  // Player: a rounded rectangle where supported, else a sharp one.
  ctx.fillStyle = cfg.colors.player;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, p.h, 6);
    ctx.fill();
  } else {
    ctx.fillRect(p.x, p.y, p.w, p.h);
  }
};
```

## Done when (this step)
- [ ] `js/render.js` exists and defines `Game.draw` that paints the sky then the player.
- [ ] (It won't run until step 04 sets `Game.ctx` and calls `Game.draw()`.)

## If it breaks
- **Later: `Cannot read properties of undefined (reading 'fillStyle')`** — `Game.ctx` isn't set. `main.js`
  sets `Game.ctx = ctx;` in step 04; confirm that line exists and `render.js` loads before `main.js` calls draw.
- **The player is a sharp rectangle** — that's the fallback path; your browser predates `roundRect`. It's fine
  (cosmetic). Update your browser if you want the rounded look.
