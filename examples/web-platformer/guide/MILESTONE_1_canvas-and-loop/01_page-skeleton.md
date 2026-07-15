# Milestone 1 · Step 01 of 6 — Create the project folder and the page skeleton
> Nav: — · [Overview](00_overview.md) · [Config namespace →](02_config-namespace.md)

> **This step touches 2 files, created together:** `index.html` and `style.css`.

## Glossary for this step
- **HTML** — the markup language that describes a web page's structure; the browser reads it top to bottom. See [MDN: HTML basics](https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics).
- **`<canvas>`** — an HTML element that is a blank rectangle you draw pixels onto with JavaScript. It's our game screen. See [MDN: Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API).
- **element `id`** — a unique name on an HTML element so JavaScript can find it later with `document.getElementById`. Our canvas's id is **load-bearing**. See [glossary](../foundation/glossary.md).
- **`file://`** — the address scheme the browser shows when you open an `.html` file straight from disk (no web server). It's why this guide can't use ES modules: modules only load over `http(s)://`. See [decision D1](../foundation/decision-log.md#d1--zero-build-classic-scripts-not-es-modules).

## Why / design
Everything starts with a page. We need exactly one `<canvas>` for the game to draw on, and a place to hang our
scripts. We keep the page dead simple: one canvas, a stylesheet to center it, and (later) script tags. There is
**no build step and no server** — you'll open this file straight from disk (see [decision D1](../foundation/decision-log.md#d1--zero-build-classic-scripts-not-es-modules)).

## Do this
1. **Create a folder** for the project somewhere you can find it — name it **`shape-jumper`** (the folder name
   is cosmetic; call it anything). Inside it, create a subfolder **`js`** (this name is referenced by the
   script tags below — keep it).
2. **Create the file `index.html`** in the `shape-jumper` folder with the exact contents in the Code block
   below.
   - **WHERE / WHAT:** the `<canvas id="game">` line is the game screen. The **`id="game"` is load-bearing** —
     `main.js` finds the canvas by this exact string. Renaming it breaks the game.
   - The single `<script src="js/config.js">` tag loads our first script. We add more script tags as later
     milestones add files — always in dependency order (see [conventions](../foundation/conventions.md#structure--architecture)).
   - **Leave at default:** the `<meta>` tags — they're standard boilerplate; you don't need to touch them.
3. **Create the file `style.css`** in the same folder with the contents below. This just centers the canvas on
   a dark page. Every value here is **cosmetic** — change colors and sizing freely.
4. **Do not open it yet** — there's no `config.js` for the script tag to load. That's the next step.

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

  <!-- Classic scripts, loaded in dependency order. NOT type="module" (that breaks on file://). -->
  <script src="js/config.js"></script>
  <script src="js/main.js"></script>
</body>
</html>
```

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

## Done when (this step)
- [ ] The folder `shape-jumper/` exists with `index.html`, `style.css`, and an empty `js/` subfolder inside it.
- [ ] `index.html` contains a `<canvas id="game">` and a `<script src="js/config.js">` tag.

## If it breaks
- **Nothing to run yet** — opening the page now would log a 404 for `js/config.js` in the console. That's
  expected; the next step creates that file.
- **The `<script>` tag has `type="module"`** — remove it. Modules fail under `file://` with no server; we use
  plain classic scripts on purpose (see [decision D1](../foundation/decision-log.md#d1--zero-build-classic-scripts-not-es-modules)).
