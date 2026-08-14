# M1 · Step 06 of 06 — Verify
> Nav: [← The demo page](05_the-demo-page.md) · [Overview](00_overview.md) · [The hue rail →](../MILESTONE_2_the-hue-rail/00_overview.md)

## Done when (milestone gate)

Run all of it in one sitting, in this order. The environment is part of the gate: a page served over HTTP by a
server started with `-c-1`, hard-reloaded before you read anything.

1. **Rebuild and serve.** In the workspace (`color-picker/`): `npm run build` → exits **0**. In a second
   terminal, at the project root (`angular-color-picker/`): `npx --yes http-server . -c-1`.
2. **Open** the URL the server printed, plus `/demo/` — typically `http://127.0.0.1:8080/demo/` — and hard
   reload (`Ctrl`/`Cmd` + `Shift` + `R`).
3. **The page renders three things**, top to bottom: the heading *color-picker demo*; a **black box** with
   white text; and a **white panel with 8px rounded corners**, holding a **`#3366ff` blue swatch** with 4px
   rounded corners. Read the colours and the corners, not a width: the panel's `width: 240px` is its content
   box, so the element measures about 266px once its padding and border are counted.
4. **The boundary held.** The white panel is white. The page's own `.panel { background: #000000 }` matched
   its own box and nothing inside the component.
5. **The console is clean.** F12 → Console shows no red errors.
6. **The element is registered.** In that console:

   ```js
   customElements.get('color-picker')
   ```

   → a **function** (the console prints `class ... extends HTMLElement` or `ƒ ...`), never `undefined`.

7. **The shadow root is real.** In the same console:

   ```js
   document.querySelector('color-picker').shadowRoot
   ```

   → a **`ShadowRoot`**, never `null`. `null` here means the encapsulation setting did not take, and points at
   `src/color-picker.ts`.

8. **The bundle needs no companion.** `ls dist/color-picker` contains **`main.js`**, and **no file whose name
   starts with `polyfills`** — the workspace is zoneless, so there is nothing to load beside your code. Read
   those two facts, not the whole listing: `index.html` is also there, and a production build may write
   `3rdpartylicenses.txt` too. Both are expected.

## Files after this milestone

Complete contents of every file this milestone wrote. Diff against these if anything above disagreed.

**`color-picker/src/color-picker.ts`**

```ts
import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'color-picker',
  templateUrl: './color-picker.html',
  styleUrl: './color-picker.css',
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class ColorPicker {}
```

**`color-picker/src/color-picker.html`**

```html
<div class="panel">
  <div class="preview"></div>
</div>
```

**`color-picker/src/color-picker.css`**

```css
:host {
  display: inline-block;
  font-family: system-ui, sans-serif;
}

.panel {
  width: 240px;
  padding: 12px;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  background: #ffffff;
}

.preview {
  height: 32px;
  border-radius: 4px;
  background: #3366ff;
}
```

**`color-picker/src/main.ts`**

```ts
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { ColorPicker } from './color-picker';

createApplication().then((app) => {
  const ColorPickerElement = createCustomElement(ColorPicker, { injector: app.injector });
  customElements.define('color-picker', ColorPickerElement);
});
```

**`demo/index.html`**

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

### Pre-existing files modified

**`color-picker/angular.json`** — three values under `projects` → `color-picker` → `architect` → `build`:
`outputPath` **added** (the CLI writes none), `styles` emptied, `outputHashing` switched. Shown as the changed
regions only; the rest of the file is the CLI's and stays untouched.

In `options`:

```json
"outputPath": {
  "base": "dist/color-picker",
  "browser": ""
},
```

```json
"styles": [],
```

In `configurations` → `production`:

```json
"outputHashing": "none",
```

**`color-picker/package.json`** — gained one dependency, `@angular/elements` at `22.x`, from
`npm install @angular/elements@22`.

### Deleted

`color-picker/src/app/` — the demo app the CLI generated. Nothing imports it after step 03.

## Troubleshooting

| Symptom | Usual cause | First thing to check |
|---|---|---|
| Blank page, console mentions CORS or `file://` | The page was opened by double-clicking it | The address bar starts with `http://`, not `file:///` |
| `404` on `main.js` | Server started in the wrong folder, or the filename differs | The Network tab shows the URL that missed; the server must run from `angular-color-picker/` |
| `shadowRoot` is `null` | `encapsulation` missing or misspelled | `src/color-picker.ts` — `ViewEncapsulation.ShadowDom`, then rebuild |
| `customElements.get('color-picker')` is `undefined` | The bundle never ran | Script tag has `type="module"`; console shows no load error |
| Component's panel is black like the page's box | Encapsulation is `Emulated` (the default) | Same as `shadowRoot` being `null` — they are the same defect |
| A rebuild changes nothing on screen | Cached bundle | Server started with `-c-1`; hard reload; DevTools *Disable cache* |
| `dist/color-picker/browser/` appears again | The wrong `outputPath` was edited | It is the one under `architect` → `build` → `options` |
| Step 04 said "replace" and there was nothing there | Nothing is wrong | `ng new` writes no `outputPath`; the builder defaults to `dist/<project-name>`. Step 04 action 1 has you **add** the object |
| The listing has files this guide never mentions | Nothing is wrong | A production build also writes `index.html` and may write `3rdpartylicenses.txt`. The gate reads two facts — `main.js` is there, no `polyfills*` is — not the length of the listing |

## Handoff

**You now have** an Angular 22 workspace whose build emits a single self-registering ES-module bundle at
`color-picker/dist/color-picker/main.js`; a `ColorPicker` component behind a native shadow root, rendering a
fixed `#3366ff` swatch in a 240px panel; the `color-picker` tag registered with the browser through
`@angular/elements`; and a plain-HTML demo page at `demo/index.html`, served over HTTP with caching off, that
proves the style boundary holds.

**Open:** the picker cannot pick anything. Nothing reads a pointer, nothing computes a colour, and the swatch
is a hard-coded hex string in a stylesheet.

**Next:** [Milestone 2 — The hue rail](../MILESTONE_2_the-hue-rail/00_overview.md) turns a pointer drag into a
colour: the HSV model, the first two conversions written by hand, and a rail whose far left reads `#ff0000` and
whose midpoint reads `#00ffff`.

---
> Nav: [← The demo page](05_the-demo-page.md) · [Overview](00_overview.md) · [The hue rail →](../MILESTONE_2_the-hue-rail/00_overview.md)
