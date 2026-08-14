# Milestone 3 · Step 03 of 04 — The square handle
> Nav: [← Saturation and value](02_saturation-and-value.md) · [Overview](00_overview.md) · [Verify →](04_verify.md)

## Before you start

Step 02 done: dragging inside the square changes saturation and value.

## Why / design

The square changes the colour but never shows you *where* the colour is. That matters for a reason beyond
polish: without a handle you cannot tell "the picker is at the top-right corner" from "the picker is
somewhere near the top-right", and the milestone's gate asks you to read exact values at exact corners.

The handle's position is the inverse of the maths in step 02 — saturation across, value up — which is a
useful thing to see written next to it.

## Do this

1. **Add the handle inside the square.** The `.sv-area` element is currently self-closing; give it children.

   ```tsx
   // src/ColorPicker.tsx — replacing the whole `<div className="sv-area" ... />` element
   <div
     className="sv-area"
     style={{ background: hueOnlyCssColor }}
     onPointerDown={handleAreaPointerDown}
     onPointerMove={handleAreaPointerMove}
   >
     <div
       className="handle"
       style={{
         left: `${color.saturationRatio * 100}%`,
         // Inverted on the way out, exactly as it was inverted on the way in.
         top: `${(1 - color.valueRatio) * 100}%`,
       }}
     />
   </div>
   ```

   This reuses the `.handle` class the rail's handle already uses. The rail's stylesheet rule sets
   `top: 50%`, and this inline `top` overrides it — inline styles beat a stylesheet rule, which is exactly
   what you want here and is worth knowing before you go looking for a second class name.

2. **Build and reload.**

   ```bash
   npm run build
   ```

## Done when (this step)

- On load, a round white handle sits inside the square at 80% across and 0% down — near the top-right corner,
  because `#3366ff` is saturation 0.80 and value 1.00.
- Dragging inside the square moves the handle under your pointer.
- Dragging past a corner pins the handle in that corner and it stays there while you keep dragging outwards.
- The rail's handle still sits on the rail and still moves independently.
- `npm run build` exits without printing an error.

## If it breaks

- **The handle sits in the middle of the square vertically, whatever you do.** The inline `top` is missing, so
  the stylesheet's `top: 50%` is winning. Both `left` and `top` must be set inline here.
- **The handle swallows the drag and the colour stops changing near it.** `pointer-events: none` was removed
  from `.handle`. It must stay: the square underneath has to receive every event.
- **The handle appears outside the square.** `.sv-area` lost `position: relative`, so the handle is
  positioning against the panel instead.

---
> Nav: [← Saturation and value](02_saturation-and-value.md) · [Overview](00_overview.md) · [Verify →](04_verify.md)
