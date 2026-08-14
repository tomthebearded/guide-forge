# M5 · Step 02 of 07 — The alpha rail
> Nav: [← Alpha in the colour model](01_alpha-in-the-color-model.md) · [Overview](00_overview.md) · [HSL conversion →](03_hsl-conversion.md)

## Why / design

A third control, built from parts you already have: the same signal-and-clamped-ratio pattern as the hue rail,
the same pointer capture, the same handle.

What is new is that **transparency has to be visible**. A half-transparent blue drawn on a white panel is a
pale blue, and a pale blue is what saturation 0.5 looks like too — you cannot tell the two apart.
Every picker solves this the same way: draw a **checkerboard** behind anything that can be see-through, so
"you can see what is underneath" is the thing on screen rather than a colour that happens to be lighter.

That applies to the swatch as much as to the rail, so both get the same treatment: a checkerboard element with
the colour painted on a child that covers it. The child is needed because the CSS `background` shorthand — what
`[style.background]` writes — resets `background-image`, and the checkerboard *is* a background image. One
element cannot hold both.

The rail's own fill is a gradient from fully transparent to fully opaque **in the current colour**, so it
always previews what the drag will do.

## Before you start

Step 01 complete: both interfaces carry `alphaRatio`, and `npm run build` exits 0 with the page looking
exactly as milestone 4 left it.

## Do this

1. In `src/color-picker.ts`, add the signal directly below `readonly valueRatio = signal(1);`.

   ```ts
   readonly alphaRatio = signal(1);
   ```

2. Connect it to the colour. In the `rgb` computed, replace the `alphaRatio: 1,` line step 01 left there:

   ```ts
   readonly rgb = computed(() =>
     hsvToRgb({
       hueDegrees: this.hueDegrees(),
       saturationRatio: this.saturationRatio(),
       valueRatio: this.valueRatio(),
       alphaRatio: this.alphaRatio(),
     }),
   );
   ```

3. Accept it from the host page. In `applyIncomingValue`, add one line after
   `this.valueRatio.set(hsv.valueRatio);`:

   ```ts
   this.alphaRatio.set(hsv.alphaRatio);
   ```

   With that line, `value="#3366ff80"` in the markup opens the picker half-transparent, and the reflection
   from milestone 4 writes eight digits back out whenever alpha is below 1.

4. Add the two computed values below `areaHandleTopPercent`.

   ```ts
   readonly alphaPositionPercent = computed(() => this.alphaRatio() * 100);
   readonly alphaGradient = computed(() => {
     const { red, green, blue } = this.rgb();
     return `linear-gradient(to right, rgba(${red}, ${green}, ${blue}, 0), rgb(${red}, ${green}, ${blue}))`;
   });
   ```

   The gradient is built as a string because both of its stops depend on the current colour. It reads `rgb()`
   rather than `hexValue()` deliberately: it needs the channels as numbers, and going through hex would mean
   formatting them only to parse them again.

5. Add the handlers below `setSaturationAndValueFromPointer`. This is the third instance of the same shape —
   press, capture, follow, clamp — and the last one.

   ```ts
   onAlphaPointerDown(event: PointerEvent): void {
     const rail = event.currentTarget as HTMLElement;
     rail.setPointerCapture(event.pointerId);
     this.setAlphaFromPointer(rail, event);
   }

   onAlphaPointerMove(event: PointerEvent): void {
     const rail = event.currentTarget as HTMLElement;
     if (!rail.hasPointerCapture(event.pointerId)) {
       return; // a hover, not a drag
     }
     this.setAlphaFromPointer(rail, event);
   }

   private setAlphaFromPointer(rail: HTMLElement, event: PointerEvent): void {
     const { xRatio } = pointerRatiosWithin(rail, event);
     this.alphaRatio.set(xRatio);
     this.emitColorInput();
   }
   ```

6. In `src/color-picker.html`, give the swatch a fill child. Replace the whole `<div class="preview" …>` line:

   ```html
   <div class="preview">
     <div class="preview-fill" [style.background]="hexValue()"></div>
   </div>
   ```

7. In the same file, add the rail directly below the closing `</div>` of the hue rail and above the
   `<output class="readout">` line.

   ```html
   <div class="alpha-rail" (pointerdown)="onAlphaPointerDown($event)" (pointermove)="onAlphaPointerMove($event)" (pointerup)="onPointerUp()">
     <div class="alpha-rail-fill" [style.background-image]="alphaGradient()"></div>
     <div class="alpha-handle" [style.left.%]="alphaPositionPercent()"></div>
   </div>
   ```

8. In `src/color-picker.css`, replace the `.preview` rule with the checkerboard version and add its fill:

   ```css
   .preview {
     position: relative;
     overflow: hidden;
     height: 32px;
     margin-top: 12px;
     border-radius: 4px;
     background-image: repeating-conic-gradient(#c0c0c0 0% 25%, #ffffff 0% 50%);
     background-size: 12px 12px;
   }

   .preview-fill {
     position: absolute;
     inset: 0;
   }
   ```

   `repeating-conic-gradient` with two colours at quarter turns is the shortest checkerboard CSS has: one
   12×12 tile holding two grey squares and two white ones, repeated by `background-size`.
   `overflow: hidden` keeps the tiles inside the rounded corners.

9. Extend the handle rule so the alpha handle looks like the hue one. Find `.hue-handle {` — it occurs once —
   and replace that selector line with:

   ```css
   .hue-handle,
   .alpha-handle {
   ```

10. Add the rail's two rules at the end of the file.

    ```css
    .alpha-rail {
      position: relative;
      overflow: hidden;
      height: 14px;
      margin-top: 12px;
      border-radius: 7px;
      touch-action: none;
      background-image: repeating-conic-gradient(#c0c0c0 0% 25%, #ffffff 0% 50%);
      background-size: 12px 12px;
    }

    .alpha-rail-fill {
      position: absolute;
      inset: 0;
    }
    ```

11. Rebuild and hard-reload.

    ```bash
    npm run build
    ```

## Done when (this step)

- [ ] `npm run build` exits **0** (bash: `echo $?` · PowerShell: `$LASTEXITCODE`).
- [ ] A second rail sits below the hue rail: a **grey-and-white checkerboard** with the current colour fading
      across it from left to right, and a handle at its **right** end.
- [ ] Dragging it left makes the swatch fade towards the checkerboard behind it; the readout grows to **eight**
      hex digits.
- [ ] Dragging **past the left edge** and holding: the readout reads exactly **`#3366ff00`** when the colour is
      the canonical blue — alpha 0, and the swatch is a pure checkerboard.
- [ ] Dragging **past the right edge**: the readout returns to exactly **`#3366ff`**, six digits.
- [ ] Reloading with `value="#3366ff"` in the markup opens fully opaque, and the alpha handle is at the right
      end.
- [ ] In the console, `document.querySelector('color-picker').value = '#3366ff80'` sets the alpha handle to the
      **middle** of the rail and the attribute reflects back as `#3366ff80`.

## If it breaks

- **The swatch has no checkerboard** → the `[style.background]` binding is still on `.preview` itself. The
  shorthand wipes the checkerboard; it belongs on the `.preview-fill` child.
- **The alpha rail is a flat colour with no fade** → `[style.background-image]` is bound on the rail rather
  than on `.alpha-rail-fill`, where it would be painted under the checkerboard instead of over it.
- **The alpha handle is invisible** → step 9's selector edit is missing, so `.alpha-handle` has no rule at all.
- **The readout never grows past six digits** → `rgb` is still constructed with `alphaRatio: 1` (action 2).
- **`value="#3366ff80"` opens opaque** → the line in `applyIncomingValue` (action 3) is missing.
- **The checkerboard shows through the corners** → `overflow: hidden` is missing from `.preview` or
  `.alpha-rail`.

---
> Nav: [← Alpha in the colour model](01_alpha-in-the-color-model.md) · [Overview](00_overview.md) · [HSL conversion →](03_hsl-conversion.md)
