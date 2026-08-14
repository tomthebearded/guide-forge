# Milestone 1 · Step 05 of 07 — The library build
> Nav: [← The styles](04_the-styles.md) · [Overview](00_overview.md) · [The demo page →](06_the-demo-page.md)

## Before you start

Step 04 done: the panel is styled inside the shadow root. You can stop the dev server here — from this step
onwards the thing that matters is the **built** bundle, and every gate in the rest of this guide is read
against it.

## Glossary for this step

- [library mode](../foundation/glossary.md#library-mode) — defined under *Do this*, action 1.

## Why / design

By default Vite builds an *application*: it reads `index.html`, and emits a hashed bundle plus a copy of that
HTML. A host page cannot use that — it already has its own HTML, and it needs a filename that does not change
every build so its `<script src>` keeps working.

Library mode is the switch. You give Vite an entry module instead of an HTML file, and it emits exactly that
module's bundle.

## Do this

1. **Replace `vite.config.ts`** with the whole file below. It sits at the root of `color-picker/`, beside
   `package.json`.

   > **New concept — library mode.** `build.lib` tells Vite to build a distributable bundle from an entry
   > module rather than an application from an `index.html`. `entry` is the module it starts from, `formats`
   > lists the output module formats, and `fileName` names the file.
   > ([Vite: library mode](https://vite.dev/guide/build))

   ```ts
   // color-picker/vite.config.ts — the whole file, replacing what the template wrote
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';

   export default defineConfig({
     plugins: [react()],
     // React reads process.env.NODE_ENV at module scope, and library mode does not
     // replace it. Without this line the bundle throws on a plain HTML page. See below.
     define: { 'process.env.NODE_ENV': JSON.stringify('production') },
     build: {
       outDir: 'dist/color-picker',
       lib: {
         entry: 'src/color-picker-element.tsx',
         formats: ['es'],
         // The function form pins the exact filename. The string form would let Vite
         // pick the extension, and the demo page's <script src> has to know it.
         fileName: () => 'color-picker.js',
       },
     },
   });
   ```

   Three of those values are **load-bearing**, because step 06's `<script src>` spells all three:

   - `outDir: 'dist/color-picker'` — where the bundle lands.
   - `formats: ['es']` — one output, an ES module. The default would also emit a UMD build, which would need a
     `name` and which nothing here loads.
   - `fileName: () => 'color-picker.js'` — the filename, fixed. Nothing hashes it, which is deliberate and
     also why the browser cache becomes a problem in step 06.

   > **The `define` line is the fourth, and it is the one that is easy to leave out.** An application build
   > substitutes `process.env.NODE_ENV` for you; **a library build deliberately does not** — it leaves the
   > expression in the output for the bundler of whoever installs your library to substitute. That is right for
   > a package published to npm and wrong for everything this guide is doing, because the consumer here is a
   > static HTML page with no bundler at all, where `process` simply does not exist. React reads that variable
   > while its module is evaluating, so without the line the bundle throws
   > `ReferenceError: process is not defined` the moment the browser loads it — before `customElements.define`
   > ever runs, which means the tag is never registered and the page shows nothing.
   >
   > The symptom lands in **step 06**, one step after the cause, on a page you have only just written. So if
   > you skip this line, the thing that looks broken is your demo page. `define` replaces the text at build
   > time, everywhere it appears. ([Vite: `define`](https://vite.dev/config/shared-options#define))

   Everything else in the config stays at its default. In particular: **do not add a `rollupOptions.external`
   entry.** React must be *inside* this bundle — a host page that has never heard of React is not going to
   provide it.

2. **Delete the stale application build** from step 02's build check, so what you list next is only what this
   config produced.

   ```bash
   # bash
   rm -rf dist
   ```

   ```powershell
   # PowerShell
   Remove-Item -Recurse -Force dist
   ```

3. **Build.**

   ```bash
   npm run build
   ```

   The `build` script the template wrote is `tsc -b && vite build`: the type-checker runs first, and Vite only
   runs if it passes.

4. **List what came out.**

   ```bash
   ls dist/color-picker
   ```

## Done when (this step)

- `npm run build` finishes without printing an error.
- `ls dist/color-picker` shows a file named exactly `color-picker.js`, and **nothing whose name ends in
  `.css`**. The absence is the point of step 04: no CSS file means the demo page needs no `<link>`.
- The bundle is not tiny. `color-picker.js` is on the order of a few hundred kilobytes, because React is
  inside it — that is the framework tax this build accepts, and seeing the number now is better than
  discovering it later. On the pinned stack it is about **260 kB**. A number roughly three times that —
  around 770 kB — is the `define` line missing: both of React's branches survived into the output because
  nothing resolved `process.env.NODE_ENV`, and the bundle will throw in step 06.

## If it breaks

- **The output is `color-picker.mjs`, not `color-picker.js`.** The `fileName` value is being read as a string
  rather than a function, so Vite is choosing the extension. It must be `fileName: () => 'color-picker.js'`.
- **`dist/` contains hashed files and an `index.html`.** The `build.lib` block is missing or misplaced — it
  goes inside `build`, not beside it. Vite fell back to an application build.
- **`npm run build` fails with `Could not resolve entry module`.** The `entry` path is wrong. It is
  `src/color-picker-element.tsx`, relative to the workspace root, with the `.tsx` extension.
- **The build emits a `.css` file.** Something imported a stylesheet — check that nothing in `src/` has an
  `import './something.css'` line left over from the template.
- **The build succeeds and the bundle is around 770 kB rather than 260 kB.** The `define` line is missing or
  misspelled. `npm run build` cannot tell you — the expression is valid JavaScript and only fails in a browser
  — so the size is the signal you get at this step, and `ReferenceError: process is not defined` is the one
  you get at the next.

---
> Nav: [← The styles](04_the-styles.md) · [Overview](00_overview.md) · [The demo page →](06_the-demo-page.md)
