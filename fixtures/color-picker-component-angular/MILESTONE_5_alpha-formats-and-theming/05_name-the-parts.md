# M5 · Step 05 of 07 — Name the parts
> Nav: [← The format switch](04_the-format-switch.md) · [Overview](00_overview.md) · [Theme with custom properties →](06_theme-with-custom-properties.md)

## Glossary for this step

> New here: **[CSS part](../foundation/glossary.md#css-part)** (defined under *Why / design*).

## Why / design

The shadow root has kept every stylesheet on the internet out of your component since milestone 1. That was the
point. It also keeps out the one stylesheet that has a legitimate reason to be there: the host site's, trying
to make the picker look like the rest of its product.

> **New concept — CSS part.** A node inside a shadow tree marked `part="name"`, which the page outside can then
> style with `my-element::part(name)`. It is the deliberate hole in the encapsulation, and the browser keeps it
> narrow: the page can style parts you named and nothing else, cannot select *inside* a part, and cannot reach
> parts of a nested component unless you export them.
> ([MDN: `::part()`](https://developer.mozilla.org/en-US/docs/Web/CSS/::part))

Which is why this is one deliberate pass rather than an attribute added here and there as the markup grew. **A
part name is a promise.** Once a host page styles `::part(panel)`, renaming that node's part breaks their site
— not yours, and not visibly to you. So the surface is designed once, in full, and the names describe *what a
thing is* rather than what it currently looks like.

Seven names, each on a node someone would plausibly want to restyle: the outer frame, the four controls, the
readout, and the preset swatches.

## Before you start

Step 04 complete: the three format buttons work, and `hsl` shows `hsl(225, 100%, 60%)` for the canonical blue.

## Do this

1. In `src/color-picker.html`, add a `part` attribute to seven elements. They are additions to tags that
   already exist — nothing else on those lines changes.

   ```html
   <div class="panel" part="panel">
   ```

   ```html
   <div class="sv-area" part="area" [style.background-color]="hueOnlyHex()" (pointerdown)="onAreaPointerDown($event)" (pointermove)="onAreaPointerMove($event)" (pointerup)="onPointerUp()">
   ```

   ```html
   <div class="preview" part="preview">
   ```

   ```html
   <div class="hue-rail" part="hue" (pointerdown)="onHuePointerDown($event)" (pointermove)="onHuePointerMove($event)" (pointerup)="onPointerUp()">
   ```

   ```html
   <div class="alpha-rail" part="alpha" (pointerdown)="onAlphaPointerDown($event)" (pointermove)="onAlphaPointerMove($event)" (pointerup)="onPointerUp()">
   ```

   ```html
   <output class="readout" part="readout">{{ formattedValue() }}</output>
   ```

   And on the preset button, inside the `@for` block — every swatch shares one part name, which is allowed and
   is what you want: one rule from the host page reaches all six.

   ```html
   <button
     type="button"
     class="swatch"
     part="swatch"
     [style.background]="preset"
     [title]="preset"
     (click)="selectPreset(preset)"
   ></button>
   ```

   The format buttons are deliberately **not** parted. Their selected state is driven by a class the host page
   cannot see, so a page styling them would be able to restyle one state and not the other — a half-open door
   is worse than a closed one. That is a decision you can revisit later by adding a name; you cannot revisit
   taking one away.

2. In `demo/index.html`, add a second picker below the first, above the `<h2>Events</h2>` line. This one exists
   to be themed.

   ```html
   <h2>Themed by the host page</h2>
   <color-picker id="themed" value="#3366ff80" format="rgb"></color-picker>
   ```

3. In the same file, add the host-page rule inside the existing `<style>` block, below the `.panel` rule.

   ```css
   #themed::part(panel) {
     border-radius: 0;
     border-color: #1a1a1a;
   }
   ```

   Note what this is: a page that has never seen your source, reaching into a shadow root, and changing exactly
   the two properties you allowed it to reach. The `.panel` rule two lines above it — the hostile one from
   milestone 1 — still cannot touch the same element, because a class name is not a part name.

4. Rebuild and hard-reload.

   ```bash
   npm run build
   ```

## Done when (this step)

- [ ] `npm run build` exits **0** (bash: `echo $?` · PowerShell: `$LASTEXITCODE`).
- [ ] Two pickers on the page. The second opens **half-transparent** (its swatch shows the checkerboard
      through the blue) with **rgb** selected, and its readout reads `rgba(51, 102, 255, 0.5)`.
- [ ] The second picker's panel has **square corners and a near-black border**; the first still has 8px
      rounded corners and a light grey one.
- [ ] Everything else about the second picker is unstyled by the page: the square, the rails and the swatches
      look exactly like the first one's.
- [ ] Both pickers work independently — dragging one does not move the other.

## If it breaks

- **The second picker looks identical to the first** → the `part="panel"` attribute is missing, or the rule
  targets `#themed::part(.panel)`. A part name is written bare, with no dot.
- **Both pickers get square corners** → the rule is `color-picker::part(panel)` rather than
  `#themed::part(panel)`.
- **`#themed::part(panel):hover` or `::part(panel) .preview` does nothing** → both are outside what `::part()`
  allows. You can style the part itself and its own pseudo-classes; you cannot descend into it.
- **The second picker's event log entries mix with the first's** → they do not; the demo script listens to the
  first picker only, and that is why the second one is silent.

---
> Nav: [← The format switch](04_the-format-switch.md) · [Overview](00_overview.md) · [Theme with custom properties →](06_theme-with-custom-properties.md)
