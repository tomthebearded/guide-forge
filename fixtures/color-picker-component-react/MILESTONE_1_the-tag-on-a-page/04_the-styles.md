# Milestone 1 · Step 04 of 07 — The styles
> Nav: [← The custom element](03_the-custom-element.md) · [Overview](00_overview.md) · [The library build →](05_the-library-build.md)

## Before you start

Step 03 done: `<color-picker>` renders the panel inside an open shadow root.

## Glossary for this step

- [constructed stylesheet](../foundation/glossary.md#constructed-stylesheet) — defined under *Do this*, action 1.

## Why / design

The panel needs a size and a shape, and the CSS that gives it one has to end up **inside** the shadow root —
a `<link>` in the host page's `<head>` cannot reach in, which is the whole point of the shadow root.

There are two ways to get it there. The obvious one is a `.css` file that Vite bundles. This guide takes the
other one: the CSS is a TypeScript string, attached with a constructed stylesheet. The reason is mechanical
rather than aesthetic — [Vite's library mode](https://vite.dev/guide/build) bundles any imported CSS "as a
single CSS file besides the built JS files", and a second file beside the bundle would mean the demo page
needs a second `<link>`. One `<script>` and nothing else is the promise this milestone exists to prove, and a
stylesheet that lives in JavaScript is what keeps it. Recorded as D4 in
[`../foundation/decision-log.md`](../foundation/decision-log.md).

## Do this

1. **Create `src/styles.ts`** with the whole file below.

   > **New concept — a constructed stylesheet.** `new CSSStyleSheet()` makes an empty stylesheet object in
   > JavaScript; `replaceSync(cssText)` fills it; assigning it into `shadowRoot.adoptedStyleSheets` applies it
   > to that shadow tree. One sheet object can be adopted by many shadow roots, so every `<color-picker>` on a
   > page shares this one rather than each parsing its own copy. Baseline widely available since March 2023.
   > ([MDN `adoptedStyleSheets`](https://developer.mozilla.org/en-US/docs/Web/API/Document/adoptedStyleSheets))

   ```ts
   // src/styles.ts — the whole file
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

   `:host` is the selector for the element the shadow root is attached to — the `<color-picker>` tag itself,
   which lives in the host page's DOM. It is the one rule here that styles something *outside* the shadow
   tree, and `display: inline-block` is doing real work: a custom element defaults to `display: inline`, which
   would give the tag no height of its own.

   The class names `panel`, `swatch` and `readout` must match the ones step 02 wrote in `ColorPicker.tsx`
   exactly. Every value in the block — the `240px`, the `#1e1e1e`, the radii — is **illustrative**: change any
   of them and the milestone gate still passes. The **structure** is what matters.

2. **Adopt the sheet in the element's constructor.** In `src/color-picker-element.tsx`, add the import at the
   top and one line inside `constructor()`, directly after the `attachShadow` line.

   ```tsx
   // src/color-picker-element.tsx — added to the imports at the top
   import { pickerStyleSheet } from './styles';
   ```

   ```tsx
   // src/color-picker-element.tsx — inside constructor(), directly after `const shadowRoot = this.attachShadow(...)`
   shadowRoot.adoptedStyleSheets = [pickerStyleSheet];
   ```

3. **Look at the page.** The panel now has a dark background, rounded corners and a fixed width, with a blue
   band across the top of it.

## Done when (this step)

- The dev page shows a dark rounded panel, 240 px wide, containing a blue (`#3366ff`) band 48 px tall and the
  monospaced text `#3366ff` beneath it.
- In DevTools' Elements panel, selecting the `<div class="panel">` inside the shadow root and reading the
  **Styles** pane shows the rules coming from a source labelled as a constructed or adopted stylesheet — not
  from a `.css` file, because there isn't one.
- `npm run build` exits without printing an error.

## If it breaks

- **Nothing is styled and the Console shows `Failed to construct 'CSSStyleSheet'`.** The sheet is being
  constructed in a different document from the one adopting it — this happens when the element is used inside
  an `<iframe>` that has its own document. Only sheets constructed in the same `Document` may be adopted; the
  browser throws `NotAllowedError` otherwise.
- **The panel is styled but the tag has no height and overlaps the text after it.** The `:host` rule is
  missing or misspelled. It is `:host`, with one colon.
- **The panel is unstyled and there is no error.** The class names in `ColorPicker.tsx` and `styles.ts` have
  drifted apart. They are `panel`, `swatch`, `readout` in both files.

---
> Nav: [← The custom element](03_the-custom-element.md) · [Overview](00_overview.md) · [The library build →](05_the-library-build.md)
