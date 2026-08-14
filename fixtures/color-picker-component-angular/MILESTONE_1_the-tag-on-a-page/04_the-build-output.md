# M1 · Step 04 of 06 — Point the build where the demo can reach it
> Nav: [← Register it as a custom element](03_register-the-element.md) · [Overview](00_overview.md) · [The demo page →](05_the-demo-page.md)

## Why / design

Three edits to `angular.json`, all of them build configuration you already understand. What matters is *why*
each one is here, because two of them exist to keep a later gate honest rather than to make the build work.

- **Flatten the output.** The application builder writes into a `browser/` subfolder by default, which exists
  to separate the browser bundle from a server bundle. There is no server bundle here, and the extra segment
  only makes the demo page's `<script src>` longer.
- **Stop hashing the filename.** A hashed name is the right default for a deployed app and the wrong one for a
  page you are hand-editing: every rebuild would change the name your `<script src>` points at.
- **Drop the global stylesheet.** Every style this component has lives inside its shadow root. A global
  `styles.css` would be emitted next to the bundle and loaded by nothing.

Killing the hash has a consequence you will meet in step 05 and every step after it: the filename never
changes, so **the browser cache can serve you yesterday's code forever**. That is this guide's most convincing
liar — it makes a fix look broken and a break look fixed. Step 05 sets up the server so it cannot happen.

## Before you start

Step 03 complete: `src/main.ts` registers the element and `npm run build` exits 0. `angular.json` sits at the
root of the `color-picker/` workspace.

## Do this

1. In `angular.json`, open the `options` block — it occurs once, under `projects` → `color-picker` →
   `architect` → `build` → `options` — and make `outputPath` read:

   ```json
   "outputPath": {
     "base": "dist/color-picker",
     "browser": ""
   },
   ```

   **`ng new` most likely wrote no `outputPath` line at all**, and that is the normal case rather than a sign
   something went wrong: the option is optional, and with it absent the builder falls back to
   `dist/<project-name>` — which is why step 01's build already produced `dist/color-picker`. So *add* the
   block above to `options`, as a new first property; only if your file already carries an
   `"outputPath": "dist/color-picker",` string does this replace that line.

   The option takes either a string or this object, whose `browser` property names the subfolder and defaults
   to `"browser"`. Setting it to the empty string writes straight into `base`.
   ([Workspace configuration](https://angular.dev/reference/configs/workspace-config))

2. In the same `options` block, find `"styles": [` and replace the whole array — the property and its one
   entry — with an empty one:

   ```json
   "styles": [],
   ```

3. Find `"outputHashing": "all",` — it occurs once, in the `production` configuration a few lines below — and
   change the value:

   ```json
   "outputHashing": "none",
   ```

   `ng build` runs the `production` configuration by default, which is why this is the copy that matters. The
   allowed values are `all`, `bundles`, `media` and `none`. ([`ng build`](https://angular.dev/cli/build))

   If your `production` block has no `outputHashing` line at all, add the one above to it.

4. Delete the previous output and rebuild, so what you list next is only what this configuration produced.

   ```bash
   rm -rf dist
   npm run build
   ```

   ```powershell
   Remove-Item -Recurse -Force dist
   npm run build
   ```

## Done when (this step)

- [ ] `npm run build` exits **0** (bash: `echo $?` · PowerShell: `$LASTEXITCODE`).
- [ ] `ls dist/color-picker` contains **`main.js`** — unhashed, and **not** inside a `browser/` folder.
- [ ] The same listing contains **no `styles.css`** and **no file whose name starts with `polyfills`**. Those
      two absences are the gate; what else is present is not. `index.html` is there, and a production build
      may also write `3rdpartylicenses.txt` — both are expected and neither is your concern.
- [ ] The name is stable: run `npm run build` a second time and `main.js` is still `main.js`.

> Read the filename from that listing rather than trusting this page: `main.js` is what the builder emits for
> an entry point at `src/main.ts`. If your listing shows a different name, that is the name step 05's
> `<script src>` must use — the file the CLI wrote wins over the file this guide expected.

## If it breaks

- **There is no `"outputPath"` line to replace** → expected; see action 1. A workspace the CLI just generated
  usually has none, because the builder defaults to `dist/<project-name>`. Add the object rather than hunting
  for a line to change.
- **`Schema validation failed … outputPath`** → the object landed with a trailing comma inside it, or `base`
  and `browser` are not both strings. JSON has no trailing commas; the comma goes *after* the closing brace.
- **`dist/color-picker/browser/` still exists after the rebuild** → the `outputPath` you edited was the one in
  a different project or a different architect target. It is the one under `architect` → `build` → `options`.
- **A hashed `main-XXXXXXX.js` appears anyway** → you edited a `development` configuration, or added
  `outputHashing` to `options` while `production` still overrides it with `"all"`. The value that wins is the
  one in the configuration the command selects.

---
> Nav: [← Register it as a custom element](03_register-the-element.md) · [Overview](00_overview.md) · [The demo page →](05_the-demo-page.md)
