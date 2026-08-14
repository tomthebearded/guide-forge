# M2 · Step 03 of 05 — Draw the hue rail
> Nav: [← Hex output](02_hex-output.md) · [Overview](00_overview.md) · [Make the rail draggable →](04_make-the-rail-draggable.md)

## Glossary for this step

> New here: **[signal](../foundation/glossary.md#signal)** (defined under *Do this* 1).

## Why / design

The component gets its first piece of state — the hue — and its first computed values. Nothing is draggable
yet: this step is about the wiring being visible before it moves. When it is done the swatch is red rather than
blue, and a readout underneath says `#ff0000`, because hue 0 with saturation and value at their maximum *is*
red.

Saturation and value are hard-coded to `1` in this step. [Milestone 3](../MILESTONE_3_the-saturation-value-area/00_overview.md)
turns them into the two axes of the square; writing them as literals here keeps the drag mechanics and the
colour model from arriving in the same step.

The rail's stripe is a plain CSS gradient with six stops. It is **not** computed from `hsvToRgb` — it is
scenery, and a gradient the browser interpolates is both cheaper and smoother than anything you would paint.
What the code computes is the *colour under the handle*, which is the only part you take away.

## Before you start

Step 02 complete: `src/color-math.ts` exports `hsvToRgb` and `rgbToHex`. The server from milestone 1 is still
running at the project root.

## Do this

1. In `src/color-picker.ts`, replace the whole file. It grows a state field and three computed values.

   ```ts
   import { Component, ViewEncapsulation, computed, signal } from '@angular/core';
   import { hsvToRgb, rgbToHex } from './color-math';

   @Component({
     selector: 'color-picker',
     templateUrl: './color-picker.html',
     styleUrl: './color-picker.css',
     encapsulation: ViewEncapsulation.ShadowDom,
   })
   export class ColorPicker {
     readonly hueDegrees = signal(0);

     // Saturation and value are fixed at 1 here; M3 makes them the two axes of the square.
     readonly rgb = computed(() =>
       hsvToRgb({ hueDegrees: this.hueDegrees(), saturationRatio: 1, valueRatio: 1 }),
     );
     readonly hexValue = computed(() => rgbToHex(this.rgb()));
     readonly huePositionPercent = computed(() => (this.hueDegrees() / 360) * 100);
   }
   ```

   > **New concept — signal.** A value you read by *calling* it — `this.hueDegrees()` — and write with `.set()`.
   > Reading a signal inside a template or a `computed` records the dependency, so when the value changes
   > Angular re-renders exactly what read it and nothing else. This is the whole reason the workspace needs no
   > `zone.js`: nothing has to guess what changed, because reading is how you declare it.
   > ([Signals guide](https://angular.dev/guide/signals))
   >
   > `computed(...)` builds a signal derived from other signals. It caches: `hexValue()` re-runs only when
   > `rgb()` actually produced something new, and `rgb()` only when `hueDegrees()` changed. The chain here is
   > three links long and it stays that shape for the rest of the guide — state at the top, everything else
   > derived.

   `readonly` applies to the *field*, not the value: you can still call `.set()` on the signal, you just cannot
   point `hueDegrees` at a different signal. Every state field in this component is written this way.

2. In `src/color-picker.html`, replace the whole template.

   ```html
   <div class="panel">
     <div class="preview" [style.background]="hexValue()"></div>
     <div class="hue-rail">
       <div class="hue-handle" [style.left.%]="huePositionPercent()"></div>
     </div>
     <output class="readout">{{ hexValue() }}</output>
   </div>
   ```

   Three bindings, three different jobs. `[style.background]="hexValue()"` sets one inline CSS property from a
   signal. `[style.left.%]` is the same thing with a unit appended — Angular writes `left: 42%` from the bare
   number, which is why `huePositionPercent` returns `42` and not `'42%'`. `{{ hexValue() }}` is
   *interpolation*: the signal's value as text.

   `<output>` is the HTML element for a value a page computed rather than one typed into it. It is
   **cosmetic** here — a `<span>` would render the same — and it is used because it says what the box is.

3. In `src/color-picker.css`, delete the `background: #3366ff;` line from the `.preview` rule. The inline
   binding supplies the colour now, and a dead declaration underneath it is a lie waiting for the next reader.

   ```css
   .preview {
     height: 32px;
     border-radius: 4px;
   }
   ```

4. In `src/color-picker.css`, add the three new rules at the end of the file.

   ```css
   .hue-rail {
     position: relative;
     height: 14px;
     margin-top: 12px;
     border-radius: 7px;
     touch-action: none;
     background-image: linear-gradient(
       to right,
       #ff0000 0%,
       #ffff00 16.67%,
       #00ff00 33.33%,
       #00ffff 50%,
       #0000ff 66.67%,
       #ff00ff 83.33%,
       #ff0000 100%
     );
   }

   .hue-handle {
     position: absolute;
     top: -3px;
     width: 6px;
     height: 20px;
     margin-left: -3px;
     border: 2px solid #ffffff;
     border-radius: 3px;
     box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25);
     pointer-events: none;
   }

   .readout {
     display: block;
     margin-top: 12px;
     font-family: ui-monospace, monospace;
     font-size: 14px;
   }
   ```

   Four of these declarations are **load-bearing** and the rest are looks:

   - `position: relative` on the rail plus `position: absolute` on the handle is what makes `left: 42%` mean
     "42% across the rail" rather than 42% across the page.
   - `margin-left: -3px` is half the handle's width, so the handle is centred on its position rather than
     starting there.
   - `pointer-events: none` on the handle stops it from swallowing the drag in step 04 — without it, the
     pointer would land on the handle instead of the rail the moment they overlap, which is always.
   - `touch-action: none` tells the browser not to interpret a drag on the rail as a scroll gesture. On a
     touchscreen, leaving it out means the page scrolls and the rail never sees the move.

   The six gradient stops are the corners of the hue wheel at 60° intervals: `100 / 6 = 16.67`. They are
   scenery, so their precision matters only to the eye.

5. Rebuild and hard-reload the page.

   ```bash
   npm run build
   ```

## Done when (this step)

- [ ] `npm run build` exits **0** (bash: `echo $?` · PowerShell: `$LASTEXITCODE`).
- [ ] After a hard reload, the panel shows: a **red** swatch (not the blue one from milestone 1), a rainbow
      rail below it, and a readout reading **`#ff0000`**.
- [ ] The handle sits **hard against the left edge** of the rail — `hueDegrees` is 0, so `left: 0%`.
- [ ] Dragging the rail does nothing yet. That is step 04.

## If it breaks

- **The swatch is still blue** → a cached bundle. Hard-reload; confirm the server is running with `-c-1`.
- **The readout shows `[object Object]`** → the template is interpolating `rgb()` instead of `hexValue()`.
- **The handle is at the far left but *outside* the rail, or sits at the page's top-left** → `position:
  relative` is missing from `.hue-rail`, so the absolutely-positioned handle is measuring against the page.
- **`NG0950: Input is required but no value is available`** or a template error naming `hexValue` → the
  `computed` fields are declared after the template refers to them by a different name; the three names in the
  class and the three in the template must match exactly.

---
> Nav: [← Hex output](02_hex-output.md) · [Overview](00_overview.md) · [Make the rail draggable →](04_make-the-rail-draggable.md)
