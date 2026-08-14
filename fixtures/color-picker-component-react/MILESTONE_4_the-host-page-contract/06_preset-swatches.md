# Milestone 4 · Step 06 of 07 — Preset swatches
> Nav: [← `input` and `change` events](05_input-and-change-events.md) · [Overview](00_overview.md) · [Verify →](07_verify.md)

## Before you start

Step 05 done: dragging streams `input` events and one `change` on release.

## Why / design

A row of preset swatches is a small feature that exercises the whole contract at once: a click has to set the
state, move both handles, rewrite the attribute and fire both events — in a single interaction, with no drag
to spread them over. If the presets work, the surface built in steps 01–05 is coherent.

There is one detail worth doing deliberately. A preset already *is* a hex string, so the events emit that
string directly rather than converting it to HSV and back. Round-tripping would usually return the same text,
but not always — `#ffffff` has no hue to preserve — and a host page that stored `#ffffff` and got back a
different string would be right to call it a bug.

## Do this

1. **Declare the presets** at the top of `src/ColorPicker.tsx`, below the imports and above the
   `ColorPickerProps` interface.

   ```tsx
   // src/ColorPicker.tsx — added below the imports, above the props interface
   // Hard-coded here. Letting a host page supply its own would mean another observed
   // attribute, and the ladder does not give this component one.
   const PRESET_HEXES = ['#3366ff', '#e51c23', '#00c853', '#ffd600', '#111111', '#ffffff'];
   ```

2. **Add the click handler.** Insert it below `commitColor`, inside the component function.

   ```tsx
   // src/ColorPicker.tsx — inserted below commitColor
   function choosePreset(presetHex: string) {
     const rgb = parseHex(presetHex);
     if (rgb === null) return;
     setColor(rgbToHsv(rgb));
     // Emit the preset's own text, not a re-derived one: a colour with no hue
     // would not survive the round trip through HSV unchanged.
     lastPublishedHex.current = presetHex;
     onValueInput?.(presetHex);
     onValueCommit?.(presetHex);
   }
   ```

3. **Add the swatch row** to the returned markup, directly below the readout `<div>`.

   ```tsx
   // src/ColorPicker.tsx — inserted directly below the readout div
   <div className="presets">
     {PRESET_HEXES.map((presetHex) => (
       <button
         key={presetHex}
         type="button"
         className="preset"
         style={{ background: presetHex }}
         title={presetHex}
         onClick={() => choosePreset(presetHex)}
       />
     ))}
   </div>
   ```

   `.map` turns the array of strings into an array of elements, and React renders an array as a list of
   siblings. The `key` prop is required on every element in such a list — React uses it to match an element
   across renders instead of guessing by position. The hex string is a good key here because no two presets
   repeat. ([Rendering lists](https://react.dev/learn/rendering-lists))

   `type="button"` is not decoration: a `<button>` inside a `<form>` defaults to `type="submit"`, and a
   preset that submitted the host page's form would be a memorable defect.

4. **Add the swatch styles.** In `src/styles.ts`, append these rules inside the template literal, after the
   `.readout` rule.

   ```css
   /* src/styles.ts — appended inside the pickerStyleSheet.replaceSync template literal */
   .presets {
     display: flex;
     gap: 6px;
     margin-top: 10px;
   }

   .preset {
     flex: 1;
     height: 22px;
     padding: 0;
     border-radius: 4px;
     border: 1px solid rgba(255, 255, 255, 0.25);
     cursor: pointer;
   }
   ```

5. **Build and reload.**

   ```bash
   npm run build
   ```

## Done when (this step)

- A row of six swatches sits below the readout: blue, red, green, yellow, near-black and white.
- Clicking the **green** swatch makes the readout read exactly `#00c853`, moves both handles, and — with
  `<color-picker>` selected in the Elements panel — rewrites the attribute to `value="#00c853"`.
- The same click adds exactly two lines to the event log: one `input {"value":"#00c853"}` and one
  `change {"value":"#00c853"}`.
- Clicking the **white** swatch reads exactly `#ffffff`, and the rail's handle jumps to the far left. That is
  correct and not a bug: white has no hue, so `rgbToHsv` returns 0° — the same behaviour step 01 named.
- Hovering a swatch shows its hex in the browser's tooltip.
- `npm run build` exits without printing an error.

## If it breaks

- **The Console warns `Each child in a list should have a unique "key" prop`.** The `key={presetHex}` is
  missing from the `<button>`.
- **Clicking a swatch changes the colour but fires no events.** `choosePreset` is calling `setColor` only —
  it must also call both callbacks.
- **The swatches are all the same colour.** `style={{ background: presetHex }}` is being passed the loop
  variable of an outer scope, or the map's parameter is shadowed. Each button gets its own `presetHex`.
- **Clicking a swatch reloads the demo page.** `type="button"` is missing and something has wrapped the tag
  in a form.

---
> Nav: [← `input` and `change` events](05_input-and-change-events.md) · [Overview](00_overview.md) · [Verify →](07_verify.md)
