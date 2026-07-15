# Milestone 1 · Step 03 of 6 — Grab the 2D context and draw one static square
> Nav: [← Config namespace](02_config-namespace.md) · [Overview](00_overview.md) · [Animation loop →](04_animation-loop.md)

## Glossary for this step
- **2D context** — the object returned by `canvas.getContext('2d')`; it's the "pen" you call drawing methods on (`fillRect`, later `arc`). See [MDN: getContext](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext).
- **`fillRect(x, y, w, h)`** — paints a filled rectangle at `(x, y)` with width `w`, height `h`, using the current `fillStyle` color. See [MDN: fillRect](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillRect).
- **y-down coordinates** — on a canvas, `(0, 0)` is the **top-left** and **y increases downward**. So a bigger `y` is *lower* on screen. See [glossary](../foundation/glossary.md).

## Why / design
Before we animate anything, prove we can draw *one* frame. This step gets the canvas element, sizes it,
gets its 2D context, and paints a background plus a single square. If a static square shows up, drawing works —
then the next step makes it move.

> **New concept — the 2D context is your only drawing tool.** You never set pixels directly; you set a color
> (`ctx.fillStyle`), then call a shape method (`ctx.fillRect(...)`). Our whole game is `fillRect`, `arc`, and
> `fillText` calls. See [MDN: Canvas tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial).

## Do this
1. **Create the file `js/main.js`** with the contents below. It's loaded **last** (its `<script>` tag is
   already after `config.js` in `index.html`), so `Game.config` already exists when it runs.
2. **WHAT the code does, line by line:**
   - `document.getElementById('game')` — finds the canvas by the **load-bearing** id `game`. **WHERE:** it
     matches `<canvas id="game">` from step 01.
   - `canvas.getContext('2d')` — gets the 2D pen; we store it in `ctx`.
   - `canvas.width` / `canvas.height` — set the canvas's **drawing resolution** from `Game.config`. (Setting
     these in JS, not CSS, keeps 1 canvas pixel = 1 drawing unit — important so shapes aren't stretched.)
   - The two `fillRect` calls paint the sky background, then a square near the top-left.
3. **Open `index.html`** in your browser (double-click it, or drag it into a browser window).

## Code
```js
// js/main.js — grabs the canvas + 2D context, sizes it, draws one frame.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Size the canvas's drawing surface from config (do this in JS, not CSS).
canvas.width = Game.config.width;
canvas.height = Game.config.height;

// Draw the background, then a square.
ctx.fillStyle = Game.config.colors.sky;
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.fillStyle = Game.config.colors.player;
ctx.fillRect(40, 200, 40, 40); // x=40, y=200, 40x40 square
```

## Done when (this step)
- [ ] Opening `index.html` shows an **800×450 dark rectangle** (the canvas) centered on a near-black page.
- [ ] A **blue 40×40 square** sits near the left, partway down (at x=40, y=200).
- [ ] The DevTools Console shows **no errors**.

## If it breaks
- **Blank white page, no dark canvas** — the canvas has no size, or CSS didn't load. Confirm `canvas.width`/
  `height` are set in `main.js` and `style.css` is linked.
- **`Cannot read properties of null (reading 'getContext')`** — `getElementById('game')` returned `null`: the
  canvas id doesn't match. It must be exactly `game` in both `index.html` and `main.js`.
- **`Game is not defined`** — `config.js` isn't loading before `main.js`. Check the `<script>` tag order in
  `index.html` (config first).
