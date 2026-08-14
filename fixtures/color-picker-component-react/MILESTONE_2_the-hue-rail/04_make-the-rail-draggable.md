# Milestone 2 · Step 04 of 05 — Make the rail draggable
> Nav: [← Draw the hue rail](03_draw-the-hue-rail.md) · [Overview](00_overview.md) · [Verify →](05_verify.md)

## Before you start

Step 03 done: the rail is drawn and the handle sits at 62.5% of its width.

## Glossary for this step

- [state](../foundation/glossary.md#state) — defined under *Do this*, action 2.
- [pointer capture](../foundation/glossary.md#pointer-capture) — defined under *Do this*, action 3.

## Why / design

A drag is three questions, and each has an exact answer:

1. **Where along the rail is the pointer?** The rail's box in viewport pixels, the pointer's `clientX`, and a
   subtraction — giving a 0–1 ratio.
2. **What happens when the pointer leaves the rail?** Without help, the events stop and the drag dies
   mid-gesture. Pointer capture is the answer.
3. **What happens past the ends?** The ratio is clamped to 0–1, so the handle pins at the edge and the colour
   stops changing. That clamp is what makes the milestone gate readable: at either end you get exactly
   `#ff0000`, and you can hold it there.

> **Build vs borrow — [`@use-gesture/react` 10.3.1](https://use-gesture.netlify.app/)** does this in
> production: you're writing it by hand here because turning a client coordinate into a 0–1 ratio *is* what a
> picker does, and borrowing it would leave this milestone proving that a library works rather than that you
> built a drag. Swap it in when you need multi-touch, inertia or pinch gestures. Recorded as D5 in
> [../foundation/decision-log.md](../foundation/decision-log.md).

## Do this

1. **Create `src/drag.ts`** with the whole file below.

   ```ts
   // src/drag.ts — the whole file
   /** Clamp any number into the 0–1 range every track in this picker works in. */
   export function clampToUnitRange(ratio: number): number {
     // Math.max lifts anything below 0 up to 0; Math.min pulls anything above 1 down to 1.
     return Math.min(1, Math.max(0, ratio));
   }

   /** Where along a track's width a pointer sits: 0 at the left edge, 1 at the right. */
   export function horizontalRatio(track: HTMLElement, clientX: number): number {
     // getBoundingClientRect gives the element's position and size in viewport pixels,
     // which is the same coordinate space clientX is measured in.
     const bounds = track.getBoundingClientRect();
     return clampToUnitRange((clientX - bounds.left) / bounds.width);
   }
   ```

2. **Turn the colour into state.** Until now `color` has been a plain `const`, because nothing changed it.
   Something is about to.

   > **New concept — state.** `useState` gives a component a value React re-renders on when it changes. It
   > returns a pair: the current value, and a function that replaces it. Calling that function is the only way
   > to change it — assigning to the variable does nothing, because the next render gets a fresh one, and that
   > re-render is exactly the mechanism that puts the new colour on screen.
   > ([`useState`](https://react.dev/reference/react/useState))

   ```tsx
   // src/ColorPicker.tsx — added as the first import line, above the import from './color'
   import { useState, type PointerEvent } from 'react';
   ```

   ```tsx
   // src/ColorPicker.tsx — replacing the whole `const color: HsvColor = { … };` declaration
   const [color, setColor] = useState<HsvColor>({
     hueDegrees: 225,
     saturationRatio: 1,
     valueRatio: 1,
   });
   ```

   `PointerEvent` on that import line is React's own event type, not the browser's global one of the same
   name. React wraps every DOM event, and the wrapper is what your handlers receive.

3. **Add the drag handlers to `src/ColorPicker.tsx`.** Add the import, then the handler pair above the
   `return`.

   ```tsx
   // src/ColorPicker.tsx — added below the import from './color'
   import { horizontalRatio } from './drag';
   ```

   > **New concept — pointer capture.** `track.setPointerCapture(event.pointerId)` tells the browser to keep
   > delivering this pointer's events to `track`, even once the pointer has moved outside it. It is released
   > automatically when the pointer goes up. Without it a drag that wanders off the rail — which every real
   > drag does — simply stops receiving events halfway through.
   > ([MDN `setPointerCapture`](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture))

   ```tsx
   // src/ColorPicker.tsx — inserted above the `return (` line
   function applyHueFromPointer(track: HTMLElement, clientX: number) {
     setColor((current) => ({ ...current, hueDegrees: horizontalRatio(track, clientX) * 360 }));
   }

   function handleRailPointerDown(event: PointerEvent<HTMLDivElement>) {
     event.currentTarget.setPointerCapture(event.pointerId);
     applyHueFromPointer(event.currentTarget, event.clientX);
   }

   function handleRailPointerMove(event: PointerEvent<HTMLDivElement>) {
     // hasPointerCapture is how you tell a drag apart from a pointer merely passing over.
     if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
     applyHueFromPointer(event.currentTarget, event.clientX);
   }
   ```

   `setColor((current) => ({ ...current, hueDegrees: ... }))` is the updater form: React hands you the current
   value and you return the new one. The `...current` spread copies `saturationRatio` and `valueRatio` through
   unchanged — which is why M3 can add the square without touching this function.

4. **Wire the handlers to the rail.** Replace the rail's opening tag in the returned markup.

   ```tsx
   // src/ColorPicker.tsx — replacing the `<div className="hue-rail">` opening tag
   <div
     className="hue-rail"
     onPointerDown={handleRailPointerDown}
     onPointerMove={handleRailPointerMove}
   >
   ```

   A note on why this works at all inside a shadow root: since React 17, React attaches its event listeners to
   the **root container** it was given — here, the mount node inside the shadow root — rather than to
   `document`. That is why pointer events reach these handlers with no retargeting shim, and why the advice
   you will find online about React and shadow DOM being incompatible is describing React 16.

5. **Build and reload.**

   ```bash
   npm run build
   ```

## Done when (this step)

- Pressing on the rail jumps the handle under your pointer and changes the swatch and readout immediately.
- Dragging left to right sweeps red → yellow → green → cyan → blue → magenta and back to red.
- Dragging **past** the right-hand end and holding there: the handle pins at the edge and the readout stays
  exactly `#ff0000`. Same past the left-hand end.
- Releasing outside the rail — over the page background, or outside the browser window — leaves the picker on
  the colour you dragged to, rather than stuck mid-gesture.
- `npm run build` exits without printing an error.

## If it breaks

- **The drag stops the moment the pointer leaves the rail.** `setPointerCapture` is missing from the
  pointer-down handler, or it was called on `event.target` instead of `event.currentTarget` — `target` can be
  the handle, `currentTarget` is always the element the handler is attached to.
- **The colour changes when you merely move the mouse across the rail, without pressing.** The
  `hasPointerCapture` guard is missing from the pointer-move handler.
- **The handle lands slightly to one side of the pointer.** The ratio is being measured against the wrong
  element. Check `pointer-events: none` is on `.handle` — otherwise a press that lands on the handle is
  measured against the handle's 14 px box.
- **The far-right end reads `#ff0004` or similar, not `#ff0000`.** The clamp is not applied: `horizontalRatio`
  must return `clampToUnitRange(...)`, not the raw division.
- **`npm run build` fails with `Cannot find name 'PointerEvent'` or complains the type takes no arguments.**
  The import in action 2 was not applied, so TypeScript is resolving the browser's global `PointerEvent`,
  which is not generic. The line must read `import { useState, type PointerEvent } from 'react';`.
- **The colour changes in the console but the screen never updates.** `color` is still a plain `const` —
  action 2 replaces it with `useState`. Re-assigning a `const` is not something React can see, and it would
  not compile either.

---
> Nav: [← Draw the hue rail](03_draw-the-hue-rail.md) · [Overview](00_overview.md) · [Verify →](05_verify.md)
