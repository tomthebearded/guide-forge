# M2 · Step 04 of 05 — Make the rail draggable
> Nav: [← Draw the hue rail](03_draw-the-hue-rail.md) · [Overview](00_overview.md) · [Verify →](05_verify.md)

## Glossary for this step

> New here: **[pointer capture](../foundation/glossary.md#pointer-capture)** (defined under *Do this* 2).

## Why / design

A drag is not a click. The reader presses inside the rail, moves — often *past* the end of it, because that is
what people do when they want the last value — and releases somewhere you do not control. Three things have to
be true for that to feel right:

1. Moves are only followed **after** a press, not whenever the cursor wanders over the rail.
2. The rail keeps receiving moves **after the pointer has left it**.
3. A position outside the rail **clamps** to the nearest end instead of producing a hue of 470°.

The browser has an answer for the middle one, and it is the only non-obvious piece here. The first and third
are four lines each.

This is decision D4 in [../foundation/decision-log.md](../foundation/decision-log.md): the drag is written by
hand because turning a pointer position into a ratio is the mechanism a picker *is*, and because the same
fifteen lines serve all three controls by the end of the guide.

## Before you start

Step 03 complete: the rail is drawn, the readout says `#ff0000`, and the handle sits at the left edge.

## Do this

1. Create `src/pointer-ratio.ts`.

   ```ts
   /** Where a pointer landed inside an element, measured from its top-left corner as ratios 0–1. */
   export interface PointerRatios {
     xRatio: number;
     yRatio: number;
   }

   export function pointerRatiosWithin(element: HTMLElement, event: PointerEvent): PointerRatios {
     const bounds = element.getBoundingClientRect(); // the element's position and size, in viewport pixels
     return {
       xRatio: clampToUnit((event.clientX - bounds.left) / bounds.width),
       yRatio: clampToUnit((event.clientY - bounds.top) / bounds.height), // [M3] the square's vertical axis
     };
   }

   function clampToUnit(ratio: number): number {
     return Math.min(1, Math.max(0, ratio)); // outside the element → the nearest edge
   }
   ```

   `event.clientX` is the pointer's position relative to the **viewport**, and `bounds.left` is the element's,
   in the same frame — subtracting one from the other gives the position inside the element, and dividing by
   the width turns pixels into a ratio that does not care how wide the rail is.

   This file returns **both** axes even though the hue rail only reads `xRatio`. That is not gold-plating: it
   is one function for one question ("where in this box did the pointer land?"), and milestone 3's square asks
   the same question about both axes.

2. In `src/color-picker.ts`, add the import and the three methods. The import joins the two already at the top:

   ```ts
   import { pointerRatiosWithin } from './pointer-ratio';
   ```

   The methods go inside the class, below `huePositionPercent`:

   ```ts
   onHuePointerDown(event: PointerEvent): void {
     const rail = event.currentTarget as HTMLElement;
     rail.setPointerCapture(event.pointerId); // every later move for this pointer comes here
     this.setHueFromPointer(rail, event);
   }

   onHuePointerMove(event: PointerEvent): void {
     const rail = event.currentTarget as HTMLElement;
     if (!rail.hasPointerCapture(event.pointerId)) {
       return; // a hover, not a drag
     }
     this.setHueFromPointer(rail, event);
   }

   private setHueFromPointer(rail: HTMLElement, event: PointerEvent): void {
     const { xRatio } = pointerRatiosWithin(rail, event);
     this.hueDegrees.set(xRatio * 360);
   }
   ```

   > **New concept — pointer capture.** `setPointerCapture(event.pointerId)` tells the browser to deliver every
   > subsequent event for *that pointer* to *this element*, wherever the pointer actually is — over another
   > element, outside the window, anywhere. The browser releases it automatically on `pointerup`.
   > ([MDN: pointer capture](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events#pointer_capture))
   >
   > Without it, a drag stops the instant the cursor slides off the rail — which is precisely what happens when
   > someone drags to the far end, because the rail is 14 pixels tall. `hasPointerCapture` then does duty as
   > the "am I dragging?" flag, so there is no boolean to keep in sync.

   `event.currentTarget` is the element the handler is *attached to* — the rail. Its sibling `event.target` is
   the element the pointer actually hit, which may be a child, and reading that one instead is how a drag
   starts measuring against the wrong box.

3. In `src/color-picker.html`, add the two event bindings to the `.hue-rail` element. Replace its opening tag:

   ```html
   <div class="hue-rail" (pointerdown)="onHuePointerDown($event)" (pointermove)="onHuePointerMove($event)">
   ```

   `(pointerdown)="..."` is Angular's event binding: the parentheses mean "listen", and `$event` is the DOM
   event object. Pointer events cover mouse, touch and pen with one set of handlers — there is no separate
   touch path to write.

4. Rebuild and hard-reload.

   ```bash
   npm run build
   ```

## Done when (this step)

- [ ] `npm run build` exits **0** (bash: `echo $?` · PowerShell: `$LASTEXITCODE`).
- [ ] Pressing anywhere on the rail moves the handle there **immediately**, on the press — not on the first
      move afterwards.
- [ ] Dragging left to right sweeps the swatch through red → yellow → green → cyan → blue → magenta → red, and
      the readout changes as it goes.
- [ ] Dragging **past** the left or right edge of the rail keeps the drag alive and pins the handle to that
      edge. Release outside the window, come back, and the picker is not stuck mid-drag.
- [ ] Hovering over the rail without pressing changes nothing.

## If it breaks

- **The drag dies the moment the cursor leaves the rail** → `setPointerCapture` is missing from
  `onHuePointerDown`, or it was called on `event.target` rather than `event.currentTarget`.
- **The handle jumps to a position the cursor is not at** → the element passed to `pointerRatiosWithin` is not
  the rail. Both handlers must read `event.currentTarget`.
- **Hovering moves the handle** → the `hasPointerCapture` guard is missing from `onHuePointerMove`.
- **On a phone or a touchscreen laptop the page scrolls instead** → `touch-action: none` is missing from
  `.hue-rail` (step 03, action 4).
- **`Property 'setPointerCapture' does not exist on type 'EventTarget'`** → the `as HTMLElement` cast is
  missing. `currentTarget` is typed as the broader `EventTarget`.

---
> Nav: [← Draw the hue rail](03_draw-the-hue-rail.md) · [Overview](00_overview.md) · [Verify →](05_verify.md)
