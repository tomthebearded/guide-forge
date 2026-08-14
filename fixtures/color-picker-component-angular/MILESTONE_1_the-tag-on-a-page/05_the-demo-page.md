# M1 · Step 05 of 06 — The demo page
> Nav: [← Point the build where the demo can reach it](04_the-build-output.md) · [Overview](00_overview.md) · [Verify →](06_verify.md)

## Why / design

This page is the guide's instrument. Every gate from here to the end is read off it, so it is built to be as
unlike an Angular app as possible: raw HTML, no build step, no framework, opened in a browser like any page on
the web. If the picker works here, it works on a stranger's site.

It also carries a **hostile stylesheet** from the very first version. The page defines `.panel` — the same
class name your component uses inside its shadow root — and paints it black. If the encapsulation from step 02
is real, the page's own box turns black and the component's panel does not. That is a boundary you can *see*,
which is worth more than a claim in a decision log.

Two facts about the page decide how you open it:

- **The bundle is an ES module**, which the browser refuses to load from a `file://` page. Double-clicking
  `demo/index.html` gets you a blank page and a console error — a *setup* failure that looks exactly like a
  *code* failure. It has to be served over HTTP.
- **The bundle's filename never changes** (step 04), so the browser will happily reuse a cached copy after you
  rebuild. The server below is started with caching switched off, and every gate in this guide is read after a
  hard reload.

## Before you start

Step 04 complete: `dist/color-picker/main.js` exists. Node is on your `PATH` — the static server below runs
through `npx`, so there is nothing to install first.

## Do this

1. Create `demo/index.html`, **one level up from the workspace** — a sibling of `color-picker/`, not inside it.
   The full path from the project root is `angular-color-picker/demo/index.html`.

   ```html
   <!doctype html>
   <html lang="en">
     <head>
       <meta charset="utf-8" />
       <title>color-picker demo</title>
       <style>
         body {
           font-family: system-ui, sans-serif;
           margin: 32px;
         }
         .panel {
           background: #000000;
           color: #ffffff;
           padding: 12px;
         }
       </style>
     </head>
     <body>
       <h1>color-picker demo</h1>
       <div class="panel">This box is in the page, not in the component.</div>
       <color-picker></color-picker>
       <script type="module" src="../color-picker/dist/color-picker/main.js"></script>
     </body>
   </html>
   ```

   Three things here are **load-bearing**: the `.panel` rule (it is the encapsulation test, not decoration),
   `type="module"` on the script (the bundle is an ES module and will not run without it), and the `src` path,
   which resolves from `demo/` up to the project root and back down into the workspace's output. If step 04's
   listing showed a bundle name other than `main.js`, that name is the one to write here — and the one to
   substitute wherever a later step or checkpoint prints this line. The heading
   text and the margins are cosmetic.

   The `<color-picker>` tag sits **above** the script that defines it, deliberately. The browser parses it as
   an unknown element, and upgrades it the moment `customElements.define` runs — the *upgrading* behaviour from
   step 03. A host page never has to care about script order, and yours proves it.

2. Start a static server **from the project root** — `angular-color-picker/`, the folder that holds both
   `color-picker/` and `demo/`. Open a second terminal for this and leave it running.

   ```bash
   npx --yes http-server . -c-1
   ```

   `-c-1` disables caching. It is not a convenience: with a filename that never changes, a cached bundle is the
   single most likely reason a later gate lies to you.

3. Open the URL the server printed, with `/demo/` on the end — typically
   **`http://127.0.0.1:8080/demo/`**. Read the address from the server's own output rather than assuming the
   port: `http-server` moves to 8081 and upward when 8080 is taken.

4. Hard-reload the page, every time, for the rest of this guide.

   - Windows / Linux: `Ctrl` + `Shift` + `R`
   - macOS: `Cmd` + `Shift` + `R`

## Done when (this step)

- [ ] The page at `http://127.0.0.1:8080/demo/` shows the heading, a **black box** with white text, and below
      it a **white panel with a rounded blue swatch** — the swatch is `#3366ff`. The panel's CSS `width` is
      `240px`, which is its *content* box: measure the element in DevTools and you get about **266px**,
      because the 12px of padding on each side and the 1px border sit outside that width.
- [ ] The white panel is **not** black. The page's `.panel { background: #000000 }` matched its own box and
      stopped at the shadow boundary.
- [ ] The browser console (F12 → Console) is **empty** — no red errors.

## If it breaks

- **A blank page, and the console says the module was blocked by CORS / cannot be loaded from `file://`** →
  you opened the file directly instead of through the server. The address bar must start with `http://`, not
  `file:///`.
- **`404` on `main.js` in the Network tab** → either the server was started somewhere other than the project
  root, or the filename in the `<script src>` is not the one step 04 listed. Both are visible in the same
  Network row: it shows the full URL that missed.
- **The picker's panel is black too** → `encapsulation: ViewEncapsulation.ShadowDom` is missing from
  `src/color-picker.ts`, or the bundle was rebuilt without it. Fix step 02, run `npm run build`, hard-reload.
- **Nothing changes after a rebuild** → a cached bundle. Confirm the server was started with `-c-1`, then hard
  reload. If it persists, open the browser's DevTools and tick *Disable cache* while they are open.
- **The tag renders nothing at all, and the console is clean** → `customElements.define` never ran. Check that
  the script tag has `type="module"`.

---
> Nav: [← Point the build where the demo can reach it](04_the-build-output.md) · [Overview](00_overview.md) · [Verify →](06_verify.md)
