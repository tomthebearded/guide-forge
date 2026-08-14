# Milestone 3 · Step 02 of 04 — Saturation and value
> Nav: [← Draw the square](01_draw-the-square.md) · [Overview](00_overview.md) · [The square handle →](03_the-square-handle.md)

## Before you start

Step 01 done: the square is drawn and its base colour follows the hue rail.

## Why / design

One drag, two numbers. The horizontal position gives saturation directly; the vertical position gives value
**inverted**, because the top of the square is the bright end and a vertical ratio counts downwards from the
top. That single subtraction — `1 - ratio` — is the whole difference between a picker that feels right and
one that feels upside down.

The drag itself reuses M2's mechanism unchanged: pointer capture on press, a clamped 0–1 ratio, and the same
guard on move. Only the axis is new.

This step also moves the picker's starting colour to `#3366ff`. Until now the state could not express it —
saturation was pinned at 1 and `#3366ff` needs 0.80. This is the first milestone that can hold the guide's
canonical colour, so this is where it arrives.

## Do this

1. **Add the vertical ratio** to `src/drag.ts`, below `horizontalRatio`.

   ```ts
   // src/drag.ts — appended below horizontalRatio
   /** Where down a track's height a pointer sits: 0 at the top edge, 1 at the bottom. */
   export function verticalRatio(track: HTMLElement, clientY: number): number {
     const bounds = track.getBoundingClientRect();
     return clampToUnitRange((clientY - bounds.top) / bounds.height);
   }
   ```

2. **Import it** in `src/ColorPicker.tsx`.

   ```tsx
   // src/ColorPicker.tsx — replacing the existing import from './drag'
   import { horizontalRatio, verticalRatio } from './drag';
   ```

3. **Move the starting colour to `#3366ff`.** Replace the `useState` call's initial object.

   ```tsx
   // src/ColorPicker.tsx — replacing the object passed to useState
   const [color, setColor] = useState<HsvColor>({
     hueDegrees: 225,
     saturationRatio: 0.8,
     valueRatio: 1,
   });
   ```

   Those three numbers are `#3366ff` in HSV, and they are fixed once for the whole guide in
   [`../foundation/conventions.md`](../foundation/conventions.md). Do not re-derive them anywhere else.

4. **Add the square's drag handlers.** Insert them beside the rail handlers, above the `return (`.

   ```tsx
   // src/ColorPicker.tsx — inserted above the `return (` line, beside the rail handlers
   function applySaturationValueFromPointer(track: HTMLElement, clientX: number, clientY: number) {
     setColor((current) => ({
       ...current,
       saturationRatio: horizontalRatio(track, clientX),
       // The square's top edge is value 1 and its bottom edge is value 0, so the
       // vertical ratio is inverted on the way in.
       valueRatio: 1 - verticalRatio(track, clientY),
     }));
   }

   function handleAreaPointerDown(event: PointerEvent<HTMLDivElement>) {
     event.currentTarget.setPointerCapture(event.pointerId);
     applySaturationValueFromPointer(event.currentTarget, event.clientX, event.clientY);
   }

   function handleAreaPointerMove(event: PointerEvent<HTMLDivElement>) {
     if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
     applySaturationValueFromPointer(event.currentTarget, event.clientX, event.clientY);
   }
   ```

   Note what the spread does here: `...current` carries `hueDegrees` through untouched, exactly as the rail's
   updater carries saturation and value through. Neither control has to know the other exists.

5. **Wire the handlers to the square.** Replace the `.sv-area` element in the returned markup.

   ```tsx
   // src/ColorPicker.tsx — replacing the whole `<div className="sv-area" ... />` element
   <div
     className="sv-area"
     style={{ background: hueOnlyCssColor }}
     onPointerDown={handleAreaPointerDown}
     onPointerMove={handleAreaPointerMove}
   />
   ```

6. **Build and reload.**

   ```bash
   npm run build
   ```

## Done when (this step)

- On load, the readout reads exactly `#3366ff` and the swatch is that blue.
- Pressing anywhere in the square changes the colour immediately, and dragging inside it keeps changing it.
- Dragging towards the **left** edge washes the colour out towards white or grey; dragging towards the
  **bottom** edge darkens it towards black. Dragging up and right returns to the pure hue.
- Dragging out of the square and releasing leaves the picker on the colour you dragged to, exactly as the rail
  does.
- `npm run build` exits without printing an error.

## If it breaks

- **The square works upside down — dragging up darkens it.** The `1 -` is missing from `valueRatio`.
- **The colour changes only while the pointer is inside the square.** `setPointerCapture` is missing from
  `handleAreaPointerDown`.
- **Pressing in the square also moves the hue.** The handlers were attached to the wrong element — the square
  gets `handleAreaPointerDown` / `handleAreaPointerMove`, the rail keeps `handleRailPointerDown` /
  `handleRailPointerMove`.
- **The readout on load is `#0040ff`, not `#3366ff`.** The `useState` initial object was not replaced;
  `saturationRatio` is still 1.
- **`npm run build` fails with `Cannot find name 'verticalRatio'`.** The import in action 2 replaces the whole
  existing `from './drag'` line rather than being added beside it.

---
> Nav: [← Draw the square](01_draw-the-square.md) · [Overview](00_overview.md) · [The square handle →](03_the-square-handle.md)
