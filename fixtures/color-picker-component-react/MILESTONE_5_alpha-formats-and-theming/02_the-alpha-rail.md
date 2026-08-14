# Milestone 5 · Step 02 of 05 — The alpha rail
> Nav: [← Alpha in the colour model](01_alpha-in-the-color-model.md) · [Overview](00_overview.md) · [rgb, hsl and the format switch →](03_rgb-hsl-and-the-format-switch.md)

## Before you start

Step 01 done: the model carries alpha and `value="#3366ff80"` renders a translucent swatch.

## Why / design

The alpha rail is the third control and the least new: it is the hue rail's mechanism with a different track
and a different destination. What is worth attention is its background, which has to show two things at once —
the current colour fading to nothing, *and* what "nothing" looks like. That is the checkerboard from step 01
with a gradient laid over it.

The rail's gradient is built from the current colour, so it re-renders as the picker moves. That is deliberate:
a fixed grey-to-black alpha rail tells you the position but not the result.

## Do this

1. **Add the rail markup** to `src/ColorPicker.tsx`, directly below the hue rail's closing `</div>`.

   ```tsx
   // src/ColorPicker.tsx — inserted directly below the hue-rail closing </div>
   <div
     className="alpha-rail checkerboard"
     onPointerDown={handleAlphaPointerDown}
     onPointerMove={handleAlphaPointerMove}
     onPointerUp={commitColor}
   >
     <div className="alpha-rail-fill" style={{ background: alphaGradient }} />
     <div className="handle" style={{ left: `${color.alphaRatio * 100}%` }} />
   </div>
   ```

2. **Compute the gradient.** Add this below the existing `hueOnlyRgb` block.

   ```tsx
   // src/ColorPicker.tsx — added below the hueOnlyRgb / hueOnlyCssColor lines
   // Fully transparent on the left, the current colour on the right — so the rail
   // always previews the result rather than just reporting the position.
   const alphaGradient =
     `linear-gradient(to right, rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 0), ` +
     `rgb(${rgb.red}, ${rgb.green}, ${rgb.blue}))`;
   ```

3. **Add the handlers.** Insert them beside the other pointer handlers, above the `return (`.

   ```tsx
   // src/ColorPicker.tsx — inserted beside the other pointer handlers
   function applyAlphaFromPointer(track: HTMLElement, clientX: number) {
     applyColor({ ...color, alphaRatio: horizontalRatio(track, clientX) });
   }

   function handleAlphaPointerDown(event: PointerEvent<HTMLDivElement>) {
     event.currentTarget.setPointerCapture(event.pointerId);
     applyAlphaFromPointer(event.currentTarget, event.clientX);
   }

   function handleAlphaPointerMove(event: PointerEvent<HTMLDivElement>) {
     if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
     applyAlphaFromPointer(event.currentTarget, event.clientX);
   }
   ```

   `horizontalRatio` already returns 0–1, which is alpha's range exactly — no multiplication, unlike the hue
   rail's `* 360`.

4. **Add the styles.** In `src/styles.ts`, append these rules inside the template literal, after the
   `.hue-rail` rule.

   ```css
   /* src/styles.ts — appended inside the pickerStyleSheet.replaceSync template literal */
   .alpha-rail {
     position: relative;
     height: 16px;
     margin-top: 10px;
     border-radius: 8px;
     border: 1px solid rgba(255, 255, 255, 0.15);
     touch-action: none;
   }

   .alpha-rail-fill {
     position: absolute;
     inset: 0;
     border-radius: inherit;
     pointer-events: none;
   }
   ```

   `pointer-events: none` on the fill for the same reason it is on the handle: the track underneath has to
   receive every event, or the ratio is measured against the wrong box.

5. **Build and reload.**

   ```bash
   npm run build
   ```

## Done when (this step)

- A second rail sits below the hue rail, showing a checkerboard on the left fading to the current colour on
  the right, with the handle at its far right end (alpha is 1).
- Dragging the alpha rail left makes the swatch translucent and the checkerboard visible through it, and the
  readout grows from six digits to eight.
- Dragging past the **left** edge and holding: the readout ends in `00` and the swatch shows only the
  checkerboard. Dragging past the **right** edge: the readout returns to six digits, because alpha is exactly
  1 and `toWireHex` drops the byte.
- Changing the hue while alpha is part-way along redraws the alpha rail's gradient in the new colour.
- The event log fills with `input` lines during the drag and one `change` on release, carrying eight-digit hex.
- `npm run build` exits without printing an error.

## If it breaks

- **The alpha rail is a flat colour with no checkerboard.** The `checkerboard` class is missing from the
  track's `className` — it takes both: `"alpha-rail checkerboard"`.
- **The gradient does not fade.** The `rgba(..., 0)` end is missing its zero, or the two halves of the
  template string were joined without the trailing space before `rgb(`.
- **Dragging the alpha rail changes the hue.** The handlers on the new track are the hue rail's. Each track
  gets its own pair.
- **The readout never reaches eight digits.** `toWireHex` from step 01 is comparing `alphaRatio <= 1` rather
  than `< 1`, so the byte is never appended.

---
> Nav: [← Alpha in the colour model](01_alpha-in-the-color-model.md) · [Overview](00_overview.md) · [rgb, hsl and the format switch →](03_rgb-hsl-and-the-format-switch.md)
