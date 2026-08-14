# M3 · Step 03 of 04 — The square's handle
> Nav: [← Saturation and value](02_saturation-and-value.md) · [Overview](00_overview.md) · [Verify →](04_verify.md)

## Why / design

The picker currently forgets where you put it the moment you let go. The state is right, the swatch is right,
and there is no mark on the square saying *here*. That is not decoration: without it you cannot make a small
adjustment, because you cannot see what you are adjusting from.

The handle's position is the inverse of the mapping in step 02 — state back to screen coordinates:

- `left` is `saturationRatio` as a percentage, straight across;
- `top` is `1 - valueRatio` as a percentage, because the axis is inverted going in and has to be inverted
  coming back out.

Two computed values, one element, no new mechanism.

## Before you start

Step 02 complete: pressing and dragging inside the square changes the colour, and dragging outside it clamps.

## Do this

1. In `src/color-picker.ts`, add the two computed values below `hueOnlyHex`.

   ```ts
   readonly areaHandleLeftPercent = computed(() => this.saturationRatio() * 100);
   readonly areaHandleTopPercent = computed(() => (1 - this.valueRatio()) * 100);
   ```

2. In `src/color-picker.html`, add the handle as the only child of `.sv-area` — between its opening and
   closing tags, which are currently empty.

   ```html
   <div
     class="sv-handle"
     [style.left.%]="areaHandleLeftPercent()"
     [style.top.%]="areaHandleTopPercent()"
   ></div>
   ```

3. In `src/color-picker.css`, add the rule at the end of the file.

   ```css
   .sv-handle {
     position: absolute;
     width: 14px;
     height: 14px;
     margin: -7px 0 0 -7px;
     border: 2px solid #ffffff;
     border-radius: 50%;
     box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25);
     pointer-events: none;
   }
   ```

   Three of these are load-bearing, for reasons the hue handle already showed:

   - `position: absolute` against the square's `position: relative`, so the percentages mean "inside the
     square";
   - `margin: -7px 0 0 -7px` — half the width and half the height — so the circle is **centred** on the picked
     colour rather than hanging below and to the right of it;
   - `pointer-events: none`, so the handle never becomes the target of a press. Without it, pressing the mark
     you are trying to adjust would start a drag on a 14px element rather than the square, and the colour would
     jump.

   The white ring with a dark outline is a picker convention worth copying: it stays visible against both a
   white corner and a black one.

4. Rebuild and hard-reload.

   ```bash
   npm run build
   ```

## Done when (this step)

- [ ] `npm run build` exits **0** (bash: `echo $?` · PowerShell: `$LASTEXITCODE`).
- [ ] At rest the circle sits at the **top-right corner** of the square, half of it outside the square's
      bounds — saturation 1, value 1.
- [ ] Pressing anywhere in the square moves the circle **to the pointer**, centred on it, on the press.
- [ ] Dragging past an edge pins the circle to that edge, and the colour stops changing on that axis.
- [ ] Dragging the hue rail leaves the circle exactly where it was — hue does not move saturation or value.

## If it breaks

- **The circle sits low and to the right of the pointer** → the negative `margin` is missing; the element is
  positioned by its top-left corner.
- **The circle never moves** → the two bindings are on `left`/`top` without the `.%` suffix, so Angular is
  writing `left: 42` with no unit and the browser is ignoring it.
- **Pressing the circle makes the colour jump** → `pointer-events: none` is missing from `.sv-handle`.
- **The circle is a square** → `border-radius: 50%` is missing, or a later rule overrides it.

---
> Nav: [← Saturation and value](02_saturation-and-value.md) · [Overview](00_overview.md) · [Verify →](04_verify.md)
