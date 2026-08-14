# Milestone 1 · Step 06 of 07 — The demo page
> Nav: [← The library build](05_the-library-build.md) · [Overview](00_overview.md) · [Verify →](07_verify.md)

## Before you start

Step 05 done: `dist/color-picker/color-picker.js` exists. The dev server is not needed and can stay stopped.

## Why / design

Everything so far has been watched inside a Vite-served page — a page that imports TypeScript, understands
JSX, and knows what React is. None of that proves the thing this milestone claims. The proof is a page with
none of it: static HTML, one `<script>`, no build step.

That page also has to be **served over HTTP**. Double-clicking it gives a `file://` page, and a browser
refuses to load an ES module from `file://` — the tag stays empty and the Console reports a CORS or module
error that looks exactly like a bug in your code. This is the single most likely first-run failure in the
whole guide, which is why it gets a step rather than a footnote.

## Do this

1. **Create `demo/index.html`.** It goes in `color-picker-demo/demo/` — a sibling of `color-picker/`, **not**
   inside it. Vite must never see this file.

   ```html
   <!-- color-picker-demo/demo/index.html — the whole file -->
   <!doctype html>
   <html lang="en">
     <head>
       <meta charset="utf-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1" />
       <title>color-picker demo</title>
       <style>
         body {
           margin: 0;
           padding: 32px;
           background: #f4f4f5;
           font-family: system-ui, sans-serif;
         }
         /* This rule is a probe, not decoration: it targets the component's own class
            name from outside. If the shadow root works, it changes nothing. */
         .panel {
           background: #00ff00;
         }
       </style>
     </head>
     <body>
       <h1>color-picker demo</h1>
       <color-picker></color-picker>
       <script type="module" src="../color-picker/dist/color-picker/color-picker.js"></script>
     </body>
   </html>
   ```

   The `<script>` path is relative and spells out every choice from step 05: `color-picker/` is the workspace,
   `dist/color-picker/` is `outDir`, `color-picker.js` is `fileName`. `type="module"` is required — the bundle
   is an ES module.

   The `.panel { background: #00ff00 }` rule is the milestone's actual test of encapsulation. A green panel
   means the host page reached inside the shadow root and the isolation failed.

2. **Serve the outer folder over HTTP.** Run this from `color-picker-demo/` — the parent of both `demo/` and
   `color-picker/`, because the page and the bundle it loads live in different subtrees.

   ```bash
   npx http-server . -c-1
   ```

   `-c-1` disables caching. This matters more here than it looks: the bundle filename never changes, so
   without it the browser will happily keep serving you yesterday's build after you rebuild, and you will
   debug code that is not running.

3. **Open the demo.** `http://127.0.0.1:8080/demo/`, unless `http-server` printed a different port because
   8080 was taken — it lists every URL it is serving on, so read the port from the terminal rather than
   assuming it.

4. **Hard-reload the page.** <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd>, or
   <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd> on macOS. Do this every time you rebuild, for the rest of the
   guide. If you keep DevTools open with **Disable cache** ticked, you will not see the caching problem — and
   neither will you see what a reader without DevTools sees.

## Done when (this step)

- `http://127.0.0.1:8080/demo/` shows the heading `color-picker demo` on a light grey page, with the dark
  240 px panel beneath it: a blue `#3366ff` band and the monospaced text `#3366ff`.
- The panel's background is dark (`#1e1e1e`), **not** green. The host page's `.panel` rule did not reach in.
- The browser Console is empty — no module, CORS or 404 error.

## If it breaks

- **The tag is empty and the Console reports `Uncaught ReferenceError: process is not defined`.** The bundle
  threw while it was loading, so `customElements.define` never ran and the browser is treating `<color-picker>`
  as an unknown tag — `document.querySelector('color-picker').shadowRoot` is `null` and
  `customElements.get('color-picker')` is `undefined`. Nothing on this page is at fault: the `define` line in
  step 05's `vite.config.ts` is missing, React's `process.env.NODE_ENV` survived into the output, and there is
  no `process` on a plain HTML page. Add the line, `npm run build`, hard-reload.
- **The tag is empty and the Console reports the module was blocked, or a CORS error naming `file://`.** The
  page was opened by double-clicking instead of over HTTP. Go back to action 2.
- **404 for `color-picker.js`.** Either `http-server` was started from the wrong folder — it must be
  `color-picker-demo/`, not `demo/` and not `color-picker/` — or step 05's build has not been run.
- **The panel is green.** The shadow root is not in place: check that `attachShadow` runs in the constructor
  and that the panel markup sits under `#shadow-root (open)` in the Elements panel.
- **You changed something, rebuilt, and the page looks identical.** A cached bundle. Hard-reload; if that
  fails, confirm `http-server` was started with `-c-1`.

---
> Nav: [← The library build](05_the-library-build.md) · [Overview](00_overview.md) · [Verify →](07_verify.md)
