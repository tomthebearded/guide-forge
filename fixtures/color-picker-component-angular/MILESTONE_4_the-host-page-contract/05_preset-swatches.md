# M4 · Step 05 of 06 — Preset swatches
> Nav: [← `input` and `change` events](04_input-and-change-events.md) · [Overview](00_overview.md) · [Verify →](06_verify.md)

## Why / design

A row of one-click colours is the most-used part of most pickers, and here it is also a test. A preset sets the
colour **the same way the host page does** — by handing a hex string to `applyIncomingValue` — so if the
swatches work, the way in works. Two paths into the same state would be two places to fix every future bug;
there is one, and this step is what demonstrates it.

The list is hard-coded. Making it configurable from the host page would mean a second attribute, a parser for
it, and a decision about what an invalid entry does — a milestone's worth of surface for a feature the ladder
did not ask for.

A preset emits **both** events: `input` because the colour changed, and `change` because the interaction is
already over. A click has no drag to end.

## Before you start

Step 04 complete: the log fills with `input:` lines while dragging and one `change:` line on release.

## Do this

1. In `src/color-picker.ts`, add the list directly below `readonly valueRatio = signal(1);`.

   ```ts
   readonly presetHexValues = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#3366ff', '#ffcc00'];
   ```

   Six values, lower-case, in the same form `rgbToHex` produces — anything else would round-trip through the
   guards as a different string and reflect back rewritten. `#3366ff` is in the list because it is this guide's
   canonical colour and having it one click away makes every later gate quicker to reach.

2. Add the click handler below `emitColorInput`.

   ```ts
   selectPreset(hex: string): void {
     this.applyIncomingValue(hex);
     this.emitColorInput();
     this.colorChange.emit({ value: this.hexValue() });
   }
   ```

3. In `src/color-picker.html`, add the row directly below the `<output class="readout">…</output>` line, as the
   last child of `.panel`.

   ```html
   <div class="presets">
     @for (preset of presetHexValues; track preset) {
       <button
         type="button"
         class="swatch"
         [style.background]="preset"
         [title]="preset"
         (click)="selectPreset(preset)"
       ></button>
     }
   </div>
   ```

   > **New concept — `@for`.** Angular's built-in loop, written in the template rather than as an attribute.
   > `track preset` tells Angular how to identify each item across re-renders so it can reuse DOM nodes instead
   > of rebuilding the row; it is required, and for a list of unique strings the string itself is the natural
   > key.
   > ([Control flow guide](https://angular.dev/guide/templates/control-flow))

   `type="button"` is **load-bearing**: a `<button>` inside a form defaults to `type="submit"`, and a swatch
   that submits the host page's form when clicked is a bug you would hear about from someone else's users.

4. In `src/color-picker.css`, add the two rules at the end of the file.

   ```css
   .presets {
     display: flex;
     gap: 6px;
     margin-top: 12px;
   }

   .swatch {
     width: 24px;
     height: 24px;
     padding: 0;
     border: 1px solid #d0d0d0;
     border-radius: 4px;
     cursor: pointer;
   }
   ```

   `padding: 0` and the explicit border are not cosmetic: a `<button>` arrives with the browser's own padding
   and a 3D border, and without resetting them a 24px swatch renders as a 40-odd-pixel grey lozenge with a
   coloured centre.

5. Rebuild and hard-reload.

   ```bash
   npm run build
   ```

## Done when (this step)

- [ ] `npm run build` exits **0** (bash: `echo $?` · PowerShell: `$LASTEXITCODE`).
- [ ] A row of **six 24px swatches** sits at the bottom of the panel: black, white, red, green, blue, amber.
- [ ] Clicking the blue swatch sets the readout to **`#3366ff`**, moves both handles, and writes **one
      `input:` and one `change:`** line to the log — both `{"value":"#3366ff"}`.
- [ ] Clicking it a second time logs the same pair again and moves nothing.
- [ ] Clicking **black** sets the readout to `#000000`, drops the circle to the bottom of the square — and
      sends the hue handle back to the left edge. A grey has no hue to recover; the conversion in step 01 says
      so and this is what it looks like.
- [ ] The `value` attribute in the Elements panel follows every click.

## If it breaks

- **The swatches are all grey** → `[style.background]="preset"` is missing, or written as `style="preset"`
  without the brackets, which sets the literal text.
- **`NG5002: @for loop must have a "track" expression`** → the `track preset` clause is missing.
- **Clicking a swatch reloads the page** → `type="button"` is missing and the demo page has wrapped the picker
  in a form.
- **The swatches are far bigger than 24px** → the `padding: 0` reset is missing from `.swatch`.
- **Clicking logs `change` but not `input`** → `selectPreset` is calling `colorChange.emit` twice; the first
  call must be `emitColorInput()`.

---
> Nav: [← `input` and `change` events](04_input-and-change-events.md) · [Overview](00_overview.md) · [Verify →](06_verify.md)
