# Milestone 4 · Step 01 of 4 — Create `level.js`: platforms as data, and draw them
> Nav: — · [Overview](00_overview.md) · [Collision →](02_collision.md)

> **This step touches 3 files, edited together:** `js/level.js` (new), `index.html` (add a script tag), `js/render.js` (edit).

## Glossary for this step
- **entity** — an object with a position and size `{x, y, w, h}`. Platforms are entities; so are the player, coins, and goal. See [glossary](../foundation/glossary.md).
- **the level is data** — the shape of the level lives in an array of plain objects, not in code branches. Adding a platform = adding one object. See [conventions](../foundation/conventions.md#data-vs-code).
- **`for (const x of arr)` (the `for…of` loop)** — runs the loop body once for each item in an array, binding that item to `x` each pass. `for (const plat of Game.level.platforms)` means "for every platform in the list, do this." It recurs throughout the physics and render code. See [MDN: for...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of).

## Why / design
A platformer needs platforms. We author them as **data** — an array of `{x, y, w, h}` boxes — in `level.js`.
This step just *draws* them; the next step makes them **solid**. Note the array includes a **floor** (bottom)
and a **ceiling** (top): the ceiling looks useless now, but M6's gravity flip lands the player on it.

> **New concept — the level is a list of boxes.** Every platform is `{ x, y, w, h }`: top-left corner plus
> width and height. The renderer loops over the list and draws each; the physics (next step) loops over the
> same list and collides with each. One data source, two consumers. See [conventions](../foundation/conventions.md#data-vs-code).

## Do this
1. **Create `js/level.js`** with the Code block below — five platforms: a full-width floor, a full-width
   ceiling, and three ledges climbing up-and-right.
   - The positions are **cosmetic** — retune freely — but keep at least one jumpable path upward (each ledge
     is within a jump's ~107 px of the one below), and keep the floor and ceiling.
2. **Open `index.html`** and add the `level.js` script tag **after `physics.js`, before `render.js`**
   (see the Code block). Order: `config, state, input, physics, level, render, main`.
3. **Open `js/render.js`.** **Replace its contents** with the Code block below — instead of drawing one floor
   band from `floorY`, it now loops over `Game.level.platforms` and draws each. (We'll delete `floorY` from
   `config` in the next step, when physics stops using it.)
4. **Save and open `index.html`.** You'll see the floor, a thin ceiling strip, and three ledges. The player
   still only rests on the *floor* for now (collision with the ledges comes next step) — that's expected.

## Code
```js
// js/level.js — the level as DATA: solid boxes the player collides with.
Game.level = {
  platforms: [
    { x: 0,   y: 420, w: 800, h: 30 },  // floor
    { x: 0,   y: 0,   w: 800, h: 16 },  // ceiling (used once gravity can flip, M6)
    { x: 140, y: 330, w: 150, h: 18 },  // ledge 1
    { x: 360, y: 250, w: 150, h: 18 },  // ledge 2
    { x: 560, y: 170, w: 150, h: 18 },  // ledge 3
  ],
};
```

```html
<!-- index.html — script tags only; the rest is unchanged. -->
  <script src="js/config.js"></script>
  <script src="js/state.js"></script>
  <script src="js/input.js"></script>
  <script src="js/physics.js"></script>
  <script src="js/level.js"></script>
  <script src="js/render.js"></script>
  <script src="js/main.js"></script>
```

```js
// js/render.js — draw the scene each frame. Reads state; never mutates it.
Game.draw = function () {
  const ctx = Game.ctx;
  const cfg = Game.config;
  const p = Game.state.player;

  // Background.
  ctx.fillStyle = cfg.colors.sky;
  ctx.fillRect(0, 0, cfg.width, cfg.height);

  // Platforms (from the level data).
  ctx.fillStyle = cfg.colors.platform;
  for (const plat of Game.level.platforms) {
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
  }

  // Player.
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
- [ ] The canvas shows a floor, a thin ceiling strip at the top, and three ledges rising toward the right.
- [ ] The player still falls and rests on the floor (the ledges aren't solid *yet* — next step).
- [ ] No Console errors.

## If it breaks
- **`Game.level is undefined`** — the `level.js` script tag is missing or in the wrong place. It must load
  before `render.js` and `main.js`.
- **Platforms don't appear** — `render.js` still draws the old single floor. Confirm you replaced it with the
  `for (const plat of Game.level.platforms)` loop.
- **`floorY` error** — `render.js` shouldn't reference `floorY` anymore; it draws from the platforms array now.

---
> Nav: — · [Overview](00_overview.md) · [Collision →](02_collision.md)
