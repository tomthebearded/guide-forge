# Milestone 3 · Step 01 of 04 — Draw the square
> Nav: — · [Overview](00_overview.md) · [Saturation and value →](02_saturation-and-value.md)

## Before you start

M2 complete: the hue rail drags and the readout shows hex.

## Why / design

The square is the other two thirds of the model. Its horizontal axis is **saturation**, its vertical axis is
**value**, and its base colour is the current hue at full saturation and full brightness. Every colour the
picker can produce at that hue is somewhere in this square — which is why it is the control people actually
reach for, and the rail is the one they set first.

The square is drawn as three layers stacked on top of each other, and the stack is the reason a picker's
square looks the way it does:

1. the pure hue, filling the box;
2. a white-to-transparent gradient across it, left to right — that is saturation falling to zero on the left;
3. a black-to-transparent gradient up it, bottom to top — that is value falling to zero along the bottom.

This step draws the square and wires only its base colour. Nothing responds to a pointer inside it yet.

## Do this

1. **Add the square's markup** to `src/ColorPicker.tsx`, between the swatch and the hue rail.

   ```tsx
   // src/ColorPicker.tsx — inserted between the swatch div and the hue-rail div
   <div
     className="sv-area"
     style={{ background: hueOnlyCssColor }}
   />
   ```

2. **Compute its base colour.** Add this line directly below the existing `const hexText = rgbToHex(rgb);`
   line.

   ```tsx
   // src/ColorPicker.tsx — added below `const hexText = rgbToHex(rgb);`
   // The square's base is the current hue at full saturation and brightness —
   // the corner of the square, which the gradients then fade away from.
   const hueOnlyRgb = hsvToRgb({ hueDegrees: color.hueDegrees, saturationRatio: 1, valueRatio: 1 });
   const hueOnlyCssColor = `rgb(${hueOnlyRgb.red}, ${hueOnlyRgb.green}, ${hueOnlyRgb.blue})`;
   ```

3. **Add the square's styles.** In `src/styles.ts`, append these rules inside the template literal, after the
   `.swatch` rule.

   ```css
   /* src/styles.ts — appended inside the pickerStyleSheet.replaceSync template literal */
   .sv-area {
     position: relative;
     height: 140px;
     margin-top: 10px;
     border-radius: 6px;
     border: 1px solid rgba(255, 255, 255, 0.15);
     touch-action: none;
   }

   /* Layer 2: saturation. White on the left, transparent on the right. */
   .sv-area::before {
     content: '';
     position: absolute;
     inset: 0;
     border-radius: inherit;
     background: linear-gradient(to right, #ffffff, rgba(255, 255, 255, 0));
   }

   /* Layer 3: value. Black along the bottom, transparent at the top. */
   .sv-area::after {
     content: '';
     position: absolute;
     inset: 0;
     border-radius: inherit;
     background: linear-gradient(to top, #000000, rgba(0, 0, 0, 0));
   }
   ```

   `content: ''` is what makes a `::before` or `::after` exist at all — without it the browser renders
   nothing, whatever else the rule says. `inset: 0` is shorthand for top, right, bottom and left all at 0,
   which stretches each layer over the whole square. The `.sv-area` class name is **load-bearing**: steps 02
   and 03 both select on it.

4. **Build and reload.**

   ```bash
   npm run build
   ```

## Done when (this step)

- The demo page shows a 140 px square between the swatch and the rail: white in the top-left corner, the
  current hue in the top-right, and black along the whole bottom edge.
- Dragging the **hue rail** changes the square's colour — the top-right corner follows the rail while the
  top-left stays white and the bottom stays black.
- Pressing inside the square does nothing. That is correct; step 02 adds it.
- `npm run build` exits without printing an error.

## If it breaks

- **The square is a flat colour with no white or black corners.** The `::before` and `::after` rules are
  missing `content: ''`, so neither layer is being generated.
- **The square is the right colour but the whole panel is now taller than the shadow root's box.** Nothing is
  wrong — the panel grew by 140 px plus its margin. The `:host { display: inline-block }` rule from M1 makes
  the tag grow with it.
- **The gradients are there but the base colour never changes with the rail.** The `style` prop is reading
  `cssColor` rather than `hueOnlyCssColor`. The square must ignore the current saturation and value — that is
  what its gradients are for.
- **`npm run build` fails with `Block-scoped variable 'hueOnlyCssColor' used before its declaration`.** The
  two lines from action 2 must sit above the `return (`, with the other computed values, not below it.

---
> Nav: — · [Overview](00_overview.md) · [Saturation and value →](02_saturation-and-value.md)
