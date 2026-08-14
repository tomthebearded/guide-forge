# M3 · Step 01 of 04 — Draw the square
> Nav: — · [Overview](00_overview.md) · [Saturation and value →](02_saturation-and-value.md)

## Why / design

The square is the control every colour picker is recognised by, and it is drawn rather than computed: three
layers stacked in one element.

1. **The bottom layer** is a flat fill of the current hue at full saturation and value — pure red, pure cyan,
   whatever the rail is pointing at.
2. **Over it, white fading to transparent, left to right.** The left edge is washed out to white; the right
   edge is untouched. That axis *is* saturation.
3. **Over both, black fading to transparent, bottom to top.** The bottom edge is black whatever else is
   underneath; the top edge is untouched. That axis *is* value.

Which is why the corners are not a matter of opinion: top-left is always `#ffffff`, bottom is always
`#000000`, and top-right is the pure hue. The maths in `hsvToRgb` produces the same three answers, and the two
agreeing is what makes the square honest — you are not looking at a picture of a colour space, you are looking
at the colour space.

Only the bottom layer changes, so only it is bound. The two gradients are fixed CSS.

## Before you start

Milestone 2 complete: `src/color-picker.ts` holds `hueDegrees`, `rgb`, `hexValue` and `huePositionPercent`, and
the rail drags.

## Do this

1. In `src/color-picker.ts`, add one computed value below `huePositionPercent`. It is the pure hue, ignoring
   whatever saturation and value are doing.

   ```ts
   readonly hueOnlyHex = computed(() =>
     rgbToHex(hsvToRgb({ hueDegrees: this.hueDegrees(), saturationRatio: 1, valueRatio: 1 })),
   );
   ```

   It looks like a duplicate of `rgb` and it is not: `rgb` is *the colour you picked*, and this is *the
   backdrop you picked it from*. They diverge the moment the next step makes saturation draggable, and
   binding the square to the wrong one is a bug you would spend an afternoon on — the square would fade itself
   out as you dragged into it.

2. In `src/color-picker.html`, add the square as the **first child** of `.panel`, above the existing
   `<div class="preview" …>` line.

   ```html
   <div class="sv-area" [style.background-color]="hueOnlyHex()">
   </div>
   ```

   `[style.background-color]` sets only the flat fill. The two gradients live in the stylesheet as
   `background-image`, and the two properties stack without fighting: image over colour, always.

3. In `src/color-picker.css`, give the swatch some air. The `.preview` rule was the panel's first child until a
   moment ago and needs the same 12px gap the rail already has. Replace the `.preview` rule with:

   ```css
   .preview {
     height: 32px;
     margin-top: 12px;
     border-radius: 4px;
   }
   ```

4. In `src/color-picker.css`, add the new rule at the end of the file.

   ```css
   .sv-area {
     position: relative;
     height: 140px;
     border-radius: 4px;
     touch-action: none;
     background-image:
       linear-gradient(to top, #000000, rgba(0, 0, 0, 0)),
       linear-gradient(to right, #ffffff, rgba(255, 255, 255, 0));
   }
   ```

   The order of the two gradients is **load-bearing**: in CSS the first layer listed is the topmost, so black
   sits over white. Swap them and the bottom-left corner turns grey instead of black, and the gate in step 04
   fails for a reason that is invisible if you do not know this rule.

   Both gradients fade to a **fully transparent version of their own colour** — `rgba(0, 0, 0, 0)` rather than
   the keyword `transparent`. They mean the same thing to a modern browser, and writing the channels out says
   which colour is fading, which is the thing you will want to know when you read this in a year.

   `touch-action: none` is here for the same reason as on the rail: without it a drag on a touchscreen scrolls
   the page.

5. Rebuild and hard-reload.

   ```bash
   npm run build
   ```

## Done when (this step)

- [ ] `npm run build` exits **0** (bash: `echo $?` · PowerShell: `$LASTEXITCODE`).
- [ ] The panel now shows, top to bottom: a **140px square**, the swatch, the hue rail, the readout.
- [ ] At rest the square is **red at the top-right, white at the top-left, black along the whole bottom edge**.
- [ ] Dragging the hue rail **repaints the square** — its top-right corner follows the rail while the swatch
      and the readout follow it too.
- [ ] Clicking or dragging **inside the square** does nothing yet. That is step 02.

## If it breaks

- **The square is a flat colour with no white or black corners** → the `background-image` declaration is
  missing or misspelled, or a `background:` shorthand elsewhere in the rule is resetting it.
- **The bottom-left corner is grey rather than black** → the two gradients are in the wrong order. Black is
  listed first.
- **The square does not repaint when the rail moves** → it is bound to `hexValue()` instead of `hueOnlyHex()`.
- **The square is 0px tall** → the `height` declaration is missing; an empty `<div>` has no height of its own.

---
> Nav: — · [Overview](00_overview.md) · [Saturation and value →](02_saturation-and-value.md)
