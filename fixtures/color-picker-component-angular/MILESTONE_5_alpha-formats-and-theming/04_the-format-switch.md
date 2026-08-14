# M5 · Step 04 of 07 — The format switch
> Nav: [← HSL conversion](03_hsl-conversion.md) · [Overview](00_overview.md) · [Name the parts →](05_name-the-parts.md)

## Why / design

Three buttons and one attribute, over a decision worth stating plainly: **the format changes what the readout
shows, and nothing else.** The `value` attribute and both events stay hex, always.

The alternative — emitting `rgb(51, 102, 255)` when the format is rgb — sounds friendlier and is a trap. It
would mean `parseHex` had to become a parser for every CSS colour form, because whatever the component emits it
must also accept back; it would mean a host page's stored value changing meaning when a reader clicked a
button; and it would mean the guard in `applyIncomingValue` comparing strings that are equal as colours and
different as text. One canonical wire format, one display format, is the whole of D8 in
[../foundation/decision-log.md](../foundation/decision-log.md).

The `format` attribute sets the **initial** mode, and the buttons change it afterwards. That needs two pieces
of state, not one: an input is read-only — the page writes it, you cannot — so the buttons write to a signal of
their own that starts out mirroring the input.

## Before you start

Step 03 complete: `rgbToHsl` is exported and `npm run build` exits 0.

## Do this

1. In `src/color-math.ts`, add the type and the formatter at the **end** of the exported section — below
   `rgbToHsl` and above the private helpers.

   ```ts
   export type ColorFormat = 'hex' | 'rgb' | 'hsl';

   export function formatColor(color: RgbColor, format: ColorFormat): string {
     const alpha = Math.round(color.alphaRatio * 100) / 100; // two decimals: 128/255 → 0.5

     switch (format) {
       case 'rgb':
         return alpha < 1
           ? `rgba(${color.red}, ${color.green}, ${color.blue}, ${alpha})`
           : `rgb(${color.red}, ${color.green}, ${color.blue})`;
       case 'hsl': {
         const hsl = rgbToHsl(color);
         return alpha < 1
           ? `hsla(${hsl.hueDegrees}, ${hsl.saturationPercent}%, ${hsl.lightnessPercent}%, ${alpha})`
           : `hsl(${hsl.hueDegrees}, ${hsl.saturationPercent}%, ${hsl.lightnessPercent}%)`;
       }
       default:
         return rgbToHex(color);
     }
   }
   ```

   Rounding alpha to two decimals is what makes the output readable *and* exact: the byte `80` is
   `128 / 255 = 0.50196…`, and printing that raw would give `rgba(51, 102, 255, 0.5019607843137255)`. Two
   decimals shows `0.5`, and the hex form still round-trips through the byte unchanged.

   The `alpha < 1` split matches `rgbToHex` from step 01: a solid colour is printed in the three-argument form
   a person expects, and only a see-through one grows the fourth.

2. In `src/color-picker.ts`, extend the import from `./color-math`:

   ```ts
   import { ColorFormat, formatColor, hsvToRgb, parseHex, rgbToHex, rgbToHsv } from './color-math';
   ```

3. Add the input directly below `readonly value = input('');`, and the two fields below
   `readonly alphaRatio = signal(1);`.

   ```ts
   readonly formatAttribute = input<ColorFormat>('hex', { alias: 'format' });
   ```

   ```ts
   readonly selectedFormat = signal<ColorFormat>('hex');
   readonly formats: readonly ColorFormat[] = ['hex', 'rgb', 'hsl'];
   ```

   The alias is what the page writes: `<color-picker format="rgb">`. The field is called `formatAttribute`
   because `format` is taken by the signal the buttons drive, and naming them apart is what keeps the next
   action readable.

4. Add the computed value below `alphaGradient`.

   ```ts
   readonly formattedValue = computed(() => formatColor(this.rgb(), this.selectedFormat()));
   ```

5. Add a third effect to the constructor, below the two already there.

   ```ts
   effect(() => this.selectedFormat.set(this.formatAttribute()));
   ```

   It runs once at startup, copying the attribute into the signal, and again if the page ever changes the
   attribute — which is the behaviour you want: the page's instruction wins, and until it changes, a click on
   the buttons stands.

6. Add the click handler below `selectPreset`.

   ```ts
   selectFormat(format: ColorFormat): void {
     this.selectedFormat.set(format);
   }
   ```

   It emits nothing. Changing how a colour is *written* is not changing the colour, and a page that saved on
   every `change` event would otherwise record a write that altered nothing.

7. In `src/color-picker.html`, point the readout at the formatted string. Replace the `<output …>` line:

   ```html
   <output class="readout">{{ formattedValue() }}</output>
   ```

8. In the same file, add the button row directly **below** the `<output …>` line and above `<div class="presets">`.

   ```html
   <div class="formats">
     @for (format of formats; track format) {
       <button
         type="button"
         class="format-button"
         [class.is-selected]="selectedFormat() === format"
         (click)="selectFormat(format)"
       >
         {{ format }}
       </button>
     }
   </div>
   ```

   `[class.is-selected]="…"` adds or removes that one class as the expression flips — Angular's class binding,
   and the reason no code touches `classList` by hand.

9. In `src/color-picker.css`, add the two rules at the end of the file.

   ```css
   .formats {
     display: flex;
     gap: 6px;
     margin-top: 8px;
   }

   .format-button {
     flex: 1;
     padding: 4px 0;
     border: 1px solid #d0d0d0;
     border-radius: 4px;
     background: #ffffff;
     font: inherit;
     font-size: 12px;
     cursor: pointer;
   }

   .format-button.is-selected {
     border-color: #1a1a1a;
     background: #1a1a1a;
     color: #ffffff;
   }
   ```

   `font: inherit` is the one that matters: a `<button>` does **not** inherit the page's font by default, and
   without it the three labels render in the browser's own UI font while everything around them uses the
   panel's.

10. Rebuild and hard-reload.

    ```bash
    npm run build
    ```

## Done when (this step)

- [ ] `npm run build` exits **0** (bash: `echo $?` · PowerShell: `$LASTEXITCODE`).
- [ ] Three buttons — **hex · rgb · hsl** — sit under the readout, with **hex** dark-filled and the other two
      white.
- [ ] With the picker on `#3366ff`, clicking **rgb** shows `rgb(51, 102, 255)` and clicking **hsl** shows
      `hsl(225, 100%, 60%)`. Clicking **hex** returns to `#3366ff`.
- [ ] Clicking a format button logs **nothing** in the event log, and leaves the `value` attribute at
      `#3366ff`.
- [ ] Set `document.querySelector('color-picker').value = '#3366ff80'` in the console, then click through the
      three buttons: `#3366ff80` · `rgba(51, 102, 255, 0.5)` · `hsla(225, 100%, 60%, 0.5)`.
- [ ] Adding `format="rgb"` to the tag in `demo/index.html` and reloading opens on the rgb form.

## If it breaks

- **The readout still shows hex in every mode** → the `<output>` binding is still `hexValue()`.
- **`NG0100: Expression has changed after it was checked`** → the format effect is writing during rendering
  because it was placed in a `computed` rather than in the constructor's `effect`.
- **The buttons show `hex` but the selected one never changes** → `[class.is-selected]` compares against the
  wrong signal, or the class name in the CSS and the binding differ.
- **The alpha in the rgb form has fifteen decimal places** → the rounding line in `formatColor` is missing.
- **The buttons render in a different font from the readout** → `font: inherit` is missing from
  `.format-button`.

---
> Nav: [← HSL conversion](03_hsl-conversion.md) · [Overview](00_overview.md) · [Name the parts →](05_name-the-parts.md)
