# M3 · Step 02 of 04 — Saturation and value
> Nav: [← Draw the square](01_draw-the-square.md) · [Overview](00_overview.md) · [The square's handle →](03_the-square-handle.md)

## Why / design

Two literals become two signals, and the square starts driving them. The mapping is where the care goes:

| Pointer | Ratio | State |
|---|---|---|
| across, left → right | `xRatio` 0 → 1 | `saturationRatio` 0 → 1 |
| down, top → bottom | `yRatio` 0 → 1 | `valueRatio` **1 → 0** |

The vertical axis is inverted, and it has to be. Screens measure downward from the top-left corner; brightness
reads upward. `valueRatio = 1 - yRatio` is the one line where those two conventions meet, and getting it
backwards produces a picker that looks right until you notice black is at the top.

> **New concept — HSV *value* is not HSL *lightness*.** Both answer "how bright", and they answer it
> differently: at value 1 a colour is at its most vivid (pure red), while at lightness 1 every colour is white.
> That is why this square's top edge is a rainbow rather than a white band. The distinction becomes visible in
> milestone 5, where the same colour is printed in both models side by side.
> ([MDN: colour value types](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value))

## Before you start

Step 01 complete: the square renders, repaints with the hue, and does nothing when you press it.

## Do this

1. In `src/color-picker.ts`, add the two signals directly below `readonly hueDegrees = signal(0);`.

   ```ts
   readonly saturationRatio = signal(1);
   readonly valueRatio = signal(1);
   ```

   They start at 1 so that nothing on screen changes when you reload: the picker opens on the fully saturated,
   fully bright version of its hue, which is where milestone 2 left it.

2. In the same file, replace the `rgb` computed — the comment about M3 goes with it, because this is M3.

   ```ts
   readonly rgb = computed(() =>
     hsvToRgb({
       hueDegrees: this.hueDegrees(),
       saturationRatio: this.saturationRatio(),
       valueRatio: this.valueRatio(),
     }),
   );
   ```

   `hueOnlyHex` keeps its literal `1`s. That is the divergence step 01 warned about: the backdrop stays at full
   saturation and value while the picked colour moves anywhere inside it.

3. Add the two handlers and their shared setter, below `setHueFromPointer`. They are the same shape as the
   rail's, deliberately — one press-and-follow pattern, three controls by the end of the guide.

   ```ts
   onAreaPointerDown(event: PointerEvent): void {
     const area = event.currentTarget as HTMLElement;
     area.setPointerCapture(event.pointerId);
     this.setSaturationAndValueFromPointer(area, event);
   }

   onAreaPointerMove(event: PointerEvent): void {
     const area = event.currentTarget as HTMLElement;
     if (!area.hasPointerCapture(event.pointerId)) {
       return; // a hover, not a drag
     }
     this.setSaturationAndValueFromPointer(area, event);
   }

   private setSaturationAndValueFromPointer(area: HTMLElement, event: PointerEvent): void {
     const { xRatio, yRatio } = pointerRatiosWithin(area, event);
     this.saturationRatio.set(xRatio);
     this.valueRatio.set(1 - yRatio); // the screen measures down, brightness reads up
   }
   ```

4. In `src/color-picker.html`, add the two bindings to the `.sv-area` element. Replace its opening tag:

   ```html
   <div class="sv-area" [style.background-color]="hueOnlyHex()" (pointerdown)="onAreaPointerDown($event)" (pointermove)="onAreaPointerMove($event)">
   ```

5. Rebuild and hard-reload.

   ```bash
   npm run build
   ```

## Done when (this step)

- [ ] `npm run build` exits **0** (bash: `echo $?` · PowerShell: `$LASTEXITCODE`).
- [ ] At rest, nothing has changed: red swatch, readout `#ff0000`.
- [ ] Pressing **anywhere in the square** changes the swatch and the readout on the press.
- [ ] Dragging towards the **left** washes the colour out to white; towards the **bottom** darkens it to
      black; the **top-right** returns to the pure hue.
- [ ] Dragging **out of the square and back** keeps the drag alive, and the colour pins to the nearest edge
      while you are outside.
- [ ] You cannot see *where* the picked colour sits inside the square. That is step 03.

## If it breaks

- **The square is upside down — black at the top** → `valueRatio` was set to `yRatio` instead of `1 - yRatio`.
- **The square fades itself out as you drag left** → the `[style.background-color]` binding is on `hexValue()`;
  it must be `hueOnlyHex()`.
- **Pressing the square changes nothing** → the two bindings landed on the wrong element, or on the `.panel`.
  They belong on the element with `class="sv-area"`.
- **The colour jumps when you press near the edge** → the handlers are reading `event.target` rather than
  `event.currentTarget`; step 03's handle is a child, and the difference becomes visible the moment it exists.

---
> Nav: [← Draw the square](01_draw-the-square.md) · [Overview](00_overview.md) · [The square's handle →](03_the-square-handle.md)
