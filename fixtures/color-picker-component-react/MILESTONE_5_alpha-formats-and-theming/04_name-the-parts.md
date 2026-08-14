# Milestone 5 · Step 04 of 05 — Name the parts
> Nav: [← rgb, hsl and the format switch](03_rgb-hsl-and-the-format-switch.md) · [Overview](00_overview.md) · [Verify →](05_verify.md)

## Before you start

Step 04 done: the format buttons switch the readout and `format="rgb"` seeds it.

## Glossary for this step

- [CSS part](../foundation/glossary.md#css-part) — defined under *Do this*, action 1.

## Why / design

M1 closed the component off from the host page's CSS, and every milestone since has depended on that. This
step opens exactly the holes you choose, and no others.

That framing matters more than the syntax. A part name is a **public promise**: a host page that writes
`color-picker::part(panel)` is now depending on a node existing with that name and being the thing that draws
the panel. Rename it later and you break that page silently, with no build error anywhere. So the surface is
designed once, here, as a contract — seven names, chosen for what a host site would plausibly want to restyle
— rather than accreted a node at a time as needs come up.

## Do this

1. **Add the `part` attributes** to `src/ColorPicker.tsx`. Seven edits, all to opening tags in the returned
   markup; nothing else about the elements changes.

   > **New concept — a CSS part.** A node inside a shadow root marked `part="name"` can be styled from
   > outside with `host-selector::part(name)`. It is the one sanctioned way through the shadow boundary. Two
   > limits worth knowing before you design a surface on it: parts are visible only to the **direct** parent
   > DOM — they do not tunnel through a second shadow root — and `::part(a)::part(b)` is invalid, so a part
   > cannot be reached "inside" another part. Baseline widely available since July 2020.
   > ([MDN `::part()`](https://developer.mozilla.org/en-US/docs/Web/CSS/::part))

   ```tsx
   // src/ColorPicker.tsx — the panel div's opening tag
   <div className="panel" part="panel">
   ```

   ```tsx
   // src/ColorPicker.tsx — the swatch div's opening tag
   <div className="swatch checkerboard" part="swatch">
   ```

   ```tsx
   // src/ColorPicker.tsx — added as an attribute on the sv-area div's opening tag
   part="area"
   ```

   ```tsx
   // src/ColorPicker.tsx — added as an attribute on the hue-rail div's opening tag
   part="hue-rail"
   ```

   ```tsx
   // src/ColorPicker.tsx — added as an attribute on the alpha-rail div's opening tag
   part="alpha-rail"
   ```

   ```tsx
   // src/ColorPicker.tsx — the readout div's opening tag
   <div className="readout" part="readout">
   ```

   ```tsx
   // src/ColorPicker.tsx — added as an attribute on the preset button's opening tag, inside the map
   part="preset"
   ```

   Two things to notice about that last one. Every preset button carries the **same** part name, and that is
   deliberate: `::part(preset)` should style all six, because a host page theming the component wants the row
   to match. And `part` is a plain HTML attribute, so React passes it through to the DOM as written — unlike
   `class`, it needs no React-specific spelling.

   The handles are deliberately **not** parts. They are positioned from state on every render, and a host page
   that restyled them could break the geometry the milestone gates read. A surface you did not open cannot be
   depended on.

2. **Theme it from the host page.** In `demo/index.html`, add these rules inside the existing `<style>` block.

   ```css
   /* color-picker-demo/demo/index.html — added inside the existing <style> block */
   color-picker::part(panel) {
     border-radius: 0;
   }

   color-picker::part(readout) {
     font-size: 18px;
   }
   ```

   These are the host page reaching in — the same page whose `.panel { background: #00ff00 }` rule from M1 is
   still there and still does nothing. That contrast is the whole lesson: the class name is invisible, the
   part name is a promise.

3. **Build and reload.**

   ```bash
   npm run build
   ```

## Done when (this step)

- The picker's panel has **square** corners. The `border-radius: 10px` from the component's own stylesheet has
  been overridden from outside, without touching `src/`.
- The readout's text is visibly larger than the format buttons' labels.
- The panel's background is still dark (`#1e1e1e`), not green. The M1 probe still fails, because a class name
  is not a part.
- In DevTools' Elements panel, the panel `<div>` inside the shadow root carries both `class="panel"` and
  `part="panel"`.
- Everything from steps 01–04 still works: both rails drag, the format buttons switch, the presets fire two
  events.
- `npm run build` exits without printing an error.

## If it breaks

- **The corners are still rounded.** The selector must name the host element, not the part alone:
  `color-picker::part(panel)`, never `::part(panel)` on its own.
- **The rule applies but is overridden.** A `::part()` rule and the component's own rule for the same property
  are resolved by normal specificity, and the component's `.panel` class selector can win. Raising the host
  rule's specificity — `body color-picker::part(panel)` — settles it without `!important`.
- **React strips the attribute.** It does not, for `part` — but it does warn about unknown *camelCase* props.
  The attribute is lowercase `part`, exactly as written.
- **Nothing on the page changed at all.** The demo page was not rebuilt — `demo/index.html` is not built by
  Vite, so a change there needs only a hard reload, but a change in `src/` needs `npm run build` first.

---
> Nav: [← rgb, hsl and the format switch](03_rgb-hsl-and-the-format-switch.md) · [Overview](00_overview.md) · [Verify →](05_verify.md)
