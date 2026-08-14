# Milestone 2 · Step 03 of 05 — Draw the hue rail
> Nav: [← Hex output](02_hex-output.md) · [Overview](00_overview.md) · [Make the rail draggable →](04_make-the-rail-draggable.md)

## Before you start

Step 02 done: the readout shows `#0040ff`.

## Why / design

The rail is a horizontal strip showing the whole hue circle, with a handle sitting at the current hue. It
does nothing yet when you touch it — this step is the drawing, step 04 is the dragging, and splitting them
means you can tell a broken layout apart from a broken drag.

The rail's position and its handle's position both come from the **same** number, `hueDegrees`, expressed as
a fraction of 360. That is the mental model the rest of the picker repeats: a control is a track, a position
along it is a 0–1 ratio, and the ratio maps to one number in the colour model.

## Do this

1. **Add the rail markup** to `src/ColorPicker.tsx`, between the swatch and the readout.

   ```tsx
   // src/ColorPicker.tsx — inserted between the swatch div and the readout div
   <div className="hue-rail">
     <div className="handle" style={{ left: `${(color.hueDegrees / 360) * 100}%` }} />
   </div>
   ```

   `left` is a percentage of the rail's width, so the handle tracks the hue at any rail size. The class names
   `hue-rail` and `handle` are **load-bearing** — the stylesheet in action 2 selects on them, and M3 reuses
   `handle`.

2. **Add the rail's styles.** In `src/styles.ts`, append these rules inside the template literal, after the
   `.swatch` rule.

   ```css
   /* src/styles.ts — appended inside the pickerStyleSheet.replaceSync template literal */
   .hue-rail {
     position: relative;
     height: 16px;
     margin-top: 10px;
     border-radius: 8px;
     border: 1px solid rgba(255, 255, 255, 0.15);
     background: linear-gradient(
       to right,
       #ff0000 0%,
       #ffff00 16.6667%,
       #00ff00 33.3333%,
       #00ffff 50%,
       #0000ff 66.6667%,
       #ff00ff 83.3333%,
       #ff0000 100%
     );
     touch-action: none;
   }

   .handle {
     position: absolute;
     top: 50%;
     width: 14px;
     height: 14px;
     border-radius: 50%;
     border: 2px solid #ffffff;
     box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5);
     transform: translate(-50%, -50%);
     pointer-events: none;
   }
   ```

   Four of those declarations are doing real work rather than decorating:

   - **The seven gradient stops are the six sectors of `hsvToRgb`**, at the hues where each sector begins:
     0°, 60°, 120°, 180°, 240°, 300° and back to 0°. They are hard-coded here and they must agree with the
     conversion, because your eye compares them: the strip shows the colour, the readout names it.
   - **`position: relative` on the rail and `absolute` on the handle** are what make `left: 45%` mean "45% of
     the rail" rather than "45% of the page".
   - **`pointer-events: none` on the handle** means the handle never receives a pointer event — the rail
     underneath it always does. Without it, a drag that starts on the handle would be delivered to the handle
     and step 04's maths would measure against the wrong element.
   - **`touch-action: none` on the rail** stops the browser treating a drag as a scroll gesture on a
     touchscreen, which would swallow the events before your code sees them.

3. **Build and reload.**

   ```bash
   npm run build
   ```

## Done when (this step)

- The demo page shows a 16 px rail below the swatch, running red → yellow → green → cyan → blue → magenta →
  red from left to right.
- A round white handle sits on the rail at 62.5% of its width — that is `225 / 360`, over the blue part of the
  gradient, matching the `#0040ff` in the readout.
- Dragging the rail does nothing yet. That is correct: step 04 adds the behaviour.
- `npm run build` exits without printing an error.

## If it breaks

- **The handle sits at the far left, on the red.** The `left` style is not being applied — check it is a
  template string with a `%`, `` `${(color.hueDegrees / 360) * 100}%` ``, and not a bare number.
- **The handle floats somewhere on the page instead of on the rail.** `.hue-rail` is missing
  `position: relative`.
- **The rail has no height.** The rules were pasted outside the backticks in `styles.ts` — everything between
  `replaceSync(\`` and the closing `` `); `` is the stylesheet, and anything after it is JavaScript.

---
> Nav: [← Hex output](02_hex-output.md) · [Overview](00_overview.md) · [Make the rail draggable →](04_make-the-rail-draggable.md)
