# M1 · Step 02 of 06 — Write the component
> Nav: [← Create the workspace](01_create-the-workspace.md) · [Overview](00_overview.md) · [Register it as a custom element →](03_register-the-element.md)

> This step touches **three files, committed together**: `src/color-picker.ts`, `src/color-picker.html` and
> `src/color-picker.css`. They are one unit — a component's class, template and styles are useless apart.

## Glossary for this step

> New here: **[shadow DOM](../foundation/glossary.md#shadow-dom)** and
> **[shadow root](../foundation/glossary.md#shadow-root)** (both defined under *Do this* 1).

## Why / design

This is the component the rest of the guide grows. Right now it draws one thing — a swatch of the guide's
canonical colour, `#3366ff` — because the point of milestone 1 is the *path* from a component to a tag on a
page, and a picker with no picking in it makes that path easy to see.

The one decision that matters here is **encapsulation**. Angular gives a component three ways to keep its CSS
to itself, and the default is not the one you want for a tag other sites will use:

| Setting | What it does |
|---|---|
| `Emulated` (the default) | Rewrites your selectors with a generated attribute. Your styles stay in, but the **host page's styles still come in** — its `input { width: 100% }` reaches your markup. |
| `ShadowDom` | Asks the browser for a real shadow root. Nothing crosses in either direction, except inherited properties like `color` and whatever you expose on purpose. |
| `None` | No isolation at all. |

`ShadowDom` is the only one that survives being dropped on a site you have never seen, which is the whole
promise of this build. It is recorded as D1 in
[../foundation/decision-log.md](../foundation/decision-log.md), and milestone 5 is where you re-open the
boundary deliberately, on your terms.

## Before you start

Step 01 complete: `angular-color-picker/color-picker/` exists, `npm install @angular/elements@22` has run, and
`npm run build` exits 0. Every path below is relative to the workspace folder `color-picker/`.

## Do this

1. Create `src/color-picker.ts` — the component class.

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

   > **New concept — shadow DOM.** A second, private DOM tree hanging off an element. The browser renders it in
   > place of the element's own children, and it is a **boundary**: CSS selectors written outside do not match
   > nodes inside it, and CSS written inside does not leak out. `ViewEncapsulation.ShadowDom` is you asking
   > Angular to call the browser's `attachShadow()` for this component instead of emulating the effect with
   > attributes.
   > ([ViewEncapsulation](https://angular.dev/api/core/ViewEncapsulation) ·
   > [MDN: using shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM))
   >
   > **New concept — shadow root.** The root node of that private tree. From outside you reach it as
   > `element.shadowRoot`, and `null` means there isn't one — which is exactly how you will prove in step 06
   > that this line took effect.

   Two of these four options are **load-bearing** and two are not. `templateUrl` and `styleUrl` must match the
   filenames you create next, and `encapsulation` is the decision above. `selector` is **cosmetic here** — a
   component reached through `@angular/elements` is never placed by an Angular template, so nothing reads it;
   it is written to match the tag name because a mismatch would confuse the next person. Note the option is
   `styleUrl`, singular — the plural `styleUrls` still exists and takes an array.

2. Create `src/color-picker.html` — the template.

   ```html
   <div class="panel">
     <div class="preview"></div>
   </div>
   ```

   `panel` and `preview` are **load-bearing class names**: the CSS in the next action selects them, and from
   milestone 5 the host page can address them by their part names. Every step that adds markup adds it inside
   `.panel`.

3. Create `src/color-picker.css` — the styles.

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

   > **New concept — `:host`.** Inside a shadow tree, `:host` is the one selector that reaches *out* by exactly
   > one node: it matches the element the shadow root is attached to — your `<color-picker>` tag itself. You
   > need it because a custom element has **no default display**: without `display: inline-block` the browser
   > lays your tag out as `display: inline`, and its 240px panel will overlap whatever follows it on the page.
   > ([MDN: `:host`](https://developer.mozilla.org/en-US/docs/Web/CSS/:host))

   `#3366ff` is this guide's canonical demo colour, fixed once in
   [../foundation/conventions.md](../foundation/conventions.md) along with every other form of it. It is
   hard-coded here; milestone 2 replaces it with the colour the hue rail computes.

4. Build, to type-check what you just wrote.

   ```bash
   npm run build
   ```

   Nothing imports these three files yet, so none of them reaches the bundle. TypeScript still checks every
   `.ts` file under `src/`, which is why a typo here fails **now** rather than surprising you in step 03.

## Done when (this step)

- [ ] `ls src` lists `color-picker.ts`, `color-picker.html` and `color-picker.css`.
- [ ] `npm run build` exits **0** (bash: `echo $?` · PowerShell: `$LASTEXITCODE`).
- [ ] Nothing visible has changed — there is no page yet. The bundle is byte-for-byte the one step 01 built.

## If it breaks

- **`Could not resolve "./color-picker.html"`** → `templateUrl`/`styleUrl` and the real filenames disagree, or
  the two files landed somewhere other than `src/`. Both paths are relative to `color-picker.ts`.
- **`Property 'ShadowDom' does not exist on type …`** → `ViewEncapsulation` is missing from the `@angular/core`
  import list on line 1.
- **`'ColorPicker' is declared but its value is never read`** → not an error, and not yours to fix: nothing
  imports the class until step 03.

---
> Nav: [← Create the workspace](01_create-the-workspace.md) · [Overview](00_overview.md) · [Register it as a custom element →](03_register-the-element.md)
