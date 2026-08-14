# M4 · Step 01 of 06 — Read a colour in
> Nav: — · [Overview](00_overview.md) · [The `value` attribute →](02_the-value-attribute.md)

> Build vs borrow — **chroma-js 3.2.0** does this in production
> (<https://www.npmjs.com/package/chroma-js>): you're writing it by hand here to learn how a colour gets back
> into the three numbers the controls are positioned from. Swap it in when you need to accept anything beyond
> a hex string — `rgb()`, `hsl()`, named colours, `oklch()` — because that is a parser, not a conversion, and
> it is where a hand-rolled version stops being small.

## Why / design

Everything so far runs one way: you drag, the maths produces a colour. This milestone runs it
backwards. When the page says `value="#3366ff"`, the component has to answer a harder question — *which hue,
saturation and value would have produced this?* — because those three numbers are where the handles live.

So this step adds the two functions that go the other way:

- **`parseHex`** turns `#3366ff` into `RgbColor`, and returns `null` for anything it does not recognise. A
  host page will hand you rubbish eventually; the type says so out loud, and the caller decides what to do.
- **`rgbToHsv`** turns those channels back into `HsvColor`.

One property of the second is worth knowing before you rely on it: **a grey has no hue.** Black, white and
every grey between them have `saturationRatio` 0, and there is no angle left in the numbers to recover. The
function returns 0° — red — and the hue rail jumps to its left edge. That is not a bug you can fix inside the
conversion; it is what the model says, and every picker on the web behaves this way.

## Before you start

Milestone 3 complete: `src/color-math.ts` exports `HsvColor`, `RgbColor`, `hsvToRgb` and `rgbToHex`, and the
private helpers `normalizeDegrees` and `channelsForSector` sit at the bottom of the file.

## Do this

1. In `src/color-math.ts`, add `parseHex` directly below the closing brace of `rgbToHex` and above
   `function normalizeDegrees`.

   ```ts
   export function parseHex(text: string): RgbColor | null {
     const match = /^#?([0-9a-f]{6})$/i.exec(text.trim()); // optional '#', then exactly six hex digits
     if (match === null) {
       return null;
     }
     const digits = match[1];
     return {
       red: parseInt(digits.slice(0, 2), 16),
       green: parseInt(digits.slice(2, 4), 16),
       blue: parseInt(digits.slice(4, 6), 16),
     };
   }
   ```

   The pattern is deliberately narrow. It accepts `#3366ff` and `3366FF` and nothing else — no three-digit
   shorthand, no `rgb(...)`, no named colours. Narrow is the right default for a public entry point: every
   form you accept is one you have to keep accepting, and `null` gives the caller somewhere to put "I don't
   know what this is".

2. Add `rgbToHsv` directly below `parseHex`.

   ```ts
   export function rgbToHsv(color: RgbColor): HsvColor {
     const red = color.red / 255;
     const green = color.green / 255;
     const blue = color.blue / 255;
     const largest = Math.max(red, green, blue); // this is 'value'
     const smallest = Math.min(red, green, blue);
     const span = largest - smallest; // this is chroma, back out of the channels

     return {
       hueDegrees: hueFromChannels(red, green, blue, largest, span),
       saturationRatio: largest === 0 ? 0 : span / largest, // black would divide by zero
       valueRatio: largest,
     };
   }
   ```

   It is `hsvToRgb` read backwards: the largest channel *is* the value, the gap between largest and smallest
   *is* the chroma, and saturation is that gap as a fraction of the value.

3. Add the hue helper at the bottom of the file, next to the other private helpers.

   ```ts
   function hueFromChannels(
     red: number,
     green: number,
     blue: number,
     largest: number,
     span: number,
   ): number {
     if (span === 0) {
       return 0; // a grey has no hue to recover
     }
     if (largest === red) {
       return normalizeDegrees(60 * (((green - blue) / span) % 6));
     }
     if (largest === green) {
       return normalizeDegrees(60 * ((blue - red) / span + 2));
     }
     return normalizeDegrees(60 * ((red - green) / span + 4));
   }
   ```

   The `+ 2` and `+ 4` are the sector offsets from step 01 of milestone 2, in reverse: green's sector starts at
   120° (2 × 60) and blue's at 240° (4 × 60). Wrapping every branch in `normalizeDegrees` is what turns the
   negative result the red branch can produce — `-30°` for a colour just below red — into `330°`.

4. Build.

   ```bash
   npm run build
   ```

## Done when (this step)

- [ ] `npm run build` exits **0** (bash: `echo $?` · PowerShell: `$LASTEXITCODE`).
- [ ] `src/color-math.ts` exports six names: `HsvColor`, `RgbColor`, `hsvToRgb`, `rgbToHex`, `parseHex`,
      `rgbToHsv`.
- [ ] The demo page is unchanged — nothing calls either function yet. Step 02 does.

## If it breaks

- **`Cannot find name 'hueFromChannels'`** → it landed outside the module, or below a stray closing brace.
  Private helpers are top-level functions in the same file, not nested inside `rgbToHsv`.
- **`Object is possibly 'null'` at a call site in a later step** → that is `parseHex` doing its job. The caller
  must check for `null` before using the result.
- **A colour just below red comes back at a negative hue** → a branch is missing its `normalizeDegrees`
  wrapper.

---
> Nav: — · [Overview](00_overview.md) · [The `value` attribute →](02_the-value-attribute.md)
