# Milestone 1 · Step 07 of 07 — Verify
> Nav: [← The demo page](06_the-demo-page.md) · [Overview](00_overview.md) · [The hue rail →](../MILESTONE_2_the-hue-rail/00_overview.md)

## Before you start

Steps 01–06 done. `npm run build` has been run since your last edit, `npx http-server . -c-1` is running from
`color-picker-demo/`, and the demo page is open and **hard-reloaded**.

## Done when (milestone gate)

Read all five on `http://127.0.0.1:8080/demo/` — the demo page, over HTTP, after a hard reload. Not the dev
server.

1. **The tag renders.** The page shows the dark 240 px panel with a blue band and the monospaced text
   `#3366ff` beneath it.
2. **The shadow root exists.** In the Console:

   ```js
   document.querySelector('color-picker').shadowRoot !== null
   ```

   prints `true`.
3. **The host page cannot reach inside it.** The panel's background is `#1e1e1e` (dark), **not** `#00ff00`
   (green), even though `demo/index.html` carries a `.panel { background: #00ff00 }` rule.
4. **The bundle is one file.** `ls dist/color-picker` in the workspace shows `color-picker.js` present, and
   nothing whose name ends in `.css`. Read it as one presence and one absence — a build may legitimately write
   other files, and the claim this gate makes is not that the folder is empty of everything else.
5. **The page needs nothing else.** `demo/index.html` contains exactly one `<script>` and no `<link
   rel="stylesheet">`, and the Console is empty of errors.

## Files after this milestone

### `color-picker/src/ColorPicker.tsx`

```tsx
export function ColorPicker() {
  const hexText = '#3366ff';

  return (
    <div className="panel">
      <div className="swatch" style={{ background: hexText }} />
      <div className="readout">{hexText}</div>
    </div>
  );
}
```

### `color-picker/src/styles.ts`

```ts
export const pickerStyleSheet = new CSSStyleSheet();

// replaceSync parses the text and replaces every rule in the sheet, synchronously.
pickerStyleSheet.replaceSync(`
  :host {
    display: inline-block;
    font-family: system-ui, sans-serif;
  }

  .panel {
    width: 240px;
    padding: 12px;
    border-radius: 10px;
    background: #1e1e1e;
    color: #f5f5f5;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
  }

  .swatch {
    height: 48px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .readout {
    margin-top: 10px;
    font-family: ui-monospace, monospace;
    font-size: 14px;
    letter-spacing: 0.04em;
  }
`);
```

### `color-picker/src/color-picker-element.tsx`

```tsx
import { createRoot, type Root } from 'react-dom/client';
import { ColorPicker } from './ColorPicker';
import { pickerStyleSheet } from './styles';

export class ColorPickerElement extends HTMLElement {
  // `#` means a real private field: unreachable from outside the class, even at runtime.
  #mountNode: HTMLDivElement;
  #reactRoot: Root | null = null;

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets = [pickerStyleSheet];
    this.#mountNode = document.createElement('div');
    shadowRoot.append(this.#mountNode);
  }

  connectedCallback() {
    this.#reactRoot = createRoot(this.#mountNode); // one React root per element instance
    this.#reactRoot.render(<ColorPicker />);
  }

  disconnectedCallback() {
    this.#reactRoot?.unmount(); // tear the tree down so a removed tag leaks nothing
    this.#reactRoot = null;
  }
}

// Registering here, at module scope, is what makes one <script> tag enough for a host page.
customElements.define('color-picker', ColorPickerElement);
```

### `color-picker/vite.config.ts`

```ts
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

### `color-picker-demo/demo/index.html`

```html
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

## Pre-existing files modified

### `color-picker/index.html` — the dev harness

Two regions changed. Everything else the template wrote is untouched.

Replacing the `<title>` line:

```html
<title>color-picker — dev harness</title>
```

Replacing the whole `<body>` element:

```html
<body>
  <color-picker></color-picker>
  <script type="module" src="/src/color-picker-element.tsx"></script>
</body>
```

## Files deleted this milestone

`src/App.tsx`, `src/App.css`, `src/index.css`, `src/assets/`, `src/main.tsx` — all from the Vite template.

## Troubleshooting

| Symptom | First thing to check |
|---|---|
| The tag is empty, Console reports `ReferenceError: process is not defined` | The `define` line is missing from `vite.config.ts`. Library mode leaves `process.env.NODE_ENV` in the output and a plain page has no `process`, so the module throws before it can register the tag |
| The tag is empty, Console reports a blocked module | The page is on `file://`. Serve it: `npx http-server . -c-1` from `color-picker-demo/` |
| 404 on `color-picker.js` | `http-server` started from the wrong folder, or `npm run build` not run since the config change |
| The panel is green | The shadow root is not attached — check `attachShadow` is in the constructor |
| A rebuild changed nothing on screen | Cached bundle. Hard-reload; confirm `-c-1` on the server |
| `ls dist/color-picker` shows files you did not expect | Only two things are asserted: `color-picker.js` is present, nothing ends in `.css`. Other files are not a failure |
| `NotSupportedError: "color-picker" has already been used` | The module ran twice — one full page reload clears it |
| `Could not resolve entry module` | `build.lib.entry` must be `src/color-picker-element.tsx`, with the extension |

## Handoff

**You now have** a Vite workspace that builds a React component into a single self-registering ES module, a
hand-written custom-element class that owns a shadow root and a React root, a stylesheet delivered without a
CSS file, and a static demo page that loads the whole thing with one `<script>` over HTTP.

**Open:** the panel shows one hard-coded colour. There is no colour model, no interaction, and nothing the
host page can set or read.

**Next:** [Milestone 2 — The hue rail](../MILESTONE_2_the-hue-rail/00_overview.md), which proves that a pointer
drag becomes a colour.

---
> Nav: [← The demo page](06_the-demo-page.md) · [Overview](00_overview.md) · [The hue rail →](../MILESTONE_2_the-hue-rail/00_overview.md)
