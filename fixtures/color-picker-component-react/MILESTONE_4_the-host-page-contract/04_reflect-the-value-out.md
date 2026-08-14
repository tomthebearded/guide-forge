# Milestone 4 · Step 04 of 07 — Reflect the value out
> Nav: [← The `value` property](03_the-value-property.md) · [Overview](00_overview.md) · [`input` and `change` events →](05_input-and-change-events.md)

## Before you start

Step 03 done: `el.value` reads and writes the colour.

## Glossary for this step

- [ref](../foundation/glossary.md#ref) — defined under *Do this*, action 2.

## Why / design

Everything so far flows inwards. Drag the picker and the `value` attribute still says whatever the host page
last set — the tag lies about its own state, and a page that reads `el.value` after a drag gets the old
colour.

Fixing it needs two things:

1. **The component has to report its colour outwards.** React state is private to React; the element cannot
   read it. So the component takes a callback prop and calls it whenever the colour changes.
2. **The element has to tell its own writes apart from the host's.** Reflecting means calling `setAttribute`,
   which fires `attributeChangedCallback`, which bumps the version counter and re-renders — pushing a
   just-quantised colour back into a drag that is still in progress. A flag set for the duration of the write
   is what stops it.

This step also needs the four pointer handlers to change shape, and that change is worth understanding rather
than just typing. Until now they used React's updater form — `setColor(current => ...)` — which hands the new
colour to React and to nobody else. Reporting outwards needs the new colour **as a value**, here, now. So each
handler builds the next colour explicitly and passes it to one place that both stores and publishes it. All
four move together, in this step, because a half-converted set would leave the component reporting some drags
and not others.

## Do this

1. **Add the callback props** to `src/ColorPicker.tsx`.

   ```tsx
   // src/ColorPicker.tsx — replacing the ColorPickerProps interface
   export interface ColorPickerProps {
     /** The colour the host page asked for, as hex. Undefined means "you choose". */
     hostValue?: string;
     /** Increments on every write from outside, so a repeated value still re-syncs. */
     hostValueVersion?: number;
     /** Called on every change while a drag is in progress. */
     onValueInput?: (hexText: string) => void;
     /** Called once, when a drag ends. */
     onValueCommit?: (hexText: string) => void;
   }
   ```

   ```tsx
   // src/ColorPicker.tsx — replacing the `export function ColorPicker({ hostValue, hostValueVersion }: ColorPickerProps) {` line
   export function ColorPicker({
     hostValue,
     hostValueVersion,
     onValueInput,
     onValueCommit,
   }: ColorPickerProps) {
   ```

2. **Add one place that stores and publishes.** Two things go in: a box that remembers the last hex published,
   and the pair of functions that publish.

   > **New concept — a ref.** `useRef(initial)` gives a component a mutable box — read and written as
   > `boxName.current` — that survives every render and, unlike state, **does not cause one** when you write
   > to it. That is what is wanted here: remembering what was last published is bookkeeping, not something the
   > screen shows. ([`useRef`](https://react.dev/reference/react/useRef))

   ```tsx
   // src/ColorPicker.tsx — replacing the existing `import { useEffect, useState, type PointerEvent } from 'react';` line
   import { useEffect, useRef, useState, type PointerEvent } from 'react';
   ```

   ```tsx
   // src/ColorPicker.tsx — inserted above applyHueFromPointer
   // The hex most recently published. commitColor re-emits this instead of
   // re-deriving it, so `change` always carries the same value as the `input`
   // that preceded it.
   const lastPublishedHex = useRef<string | null>(null);

   function applyColor(nextColor: HsvColor) {
     setColor(nextColor);
     const hexText = rgbToHex(hsvToRgb(nextColor));
     lastPublishedHex.current = hexText;
     onValueInput?.(hexText);
   }

   function commitColor() {
     if (lastPublishedHex.current === null) return; // nothing published yet
     onValueCommit?.(lastPublishedHex.current);
   }
   ```

   The `?.` before the parentheses calls the function only if it was passed — both props are optional, and the
   component still has to work when nothing is listening.

   **Why `commitColor` does not simply read `color`.** That would be the obvious line to write, and it would
   be wrong. `color` inside a handler is the value from the **last render React committed**, and a
   `pointermove` is a low-priority event whose state update React need not have committed by the time
   `pointerup` fires. Read `color` there and the `change` event can carry a colour one pointer-move behind the
   last `input` — a host page listening only to `change` would store a value the picker never displayed.
   Re-emitting the hex that was actually published removes the question instead of making it unlikely.

3. **Convert the two hue handlers.** Replace `applyHueFromPointer` in full.

   ```tsx
   // src/ColorPicker.tsx — replacing the whole applyHueFromPointer function
   function applyHueFromPointer(track: HTMLElement, clientX: number) {
     applyColor({ ...color, hueDegrees: horizontalRatio(track, clientX) * 360 });
   }
   ```

4. **Convert the square handler.** Replace `applySaturationValueFromPointer` in full.

   ```tsx
   // src/ColorPicker.tsx — replacing the whole applySaturationValueFromPointer function
   function applySaturationValueFromPointer(track: HTMLElement, clientX: number, clientY: number) {
     applyColor({
       ...color,
       saturationRatio: horizontalRatio(track, clientX),
       // The square's top edge is value 1 and its bottom edge is value 0, so the
       // vertical ratio is inverted on the way in.
       valueRatio: 1 - verticalRatio(track, clientY),
     });
   }
   ```

   Both now spread `color` — the value from this render — instead of the `current` an updater would have
   handed them. That is the trade this step makes, and it is the reason both had to change together.

5. **Report the end of a drag.** Add `onPointerUp` to both tracks in the returned markup.

   ```tsx
   // src/ColorPicker.tsx — added to the `<div className="sv-area" ...>` opening tag
   onPointerUp={commitColor}
   ```

   ```tsx
   // src/ColorPicker.tsx — added to the `<div className="hue-rail" ...>` opening tag
   onPointerUp={commitColor}
   ```

6. **Add the write guard and the reflection** to `src/color-picker-element.tsx`.

   ```tsx
   // src/color-picker-element.tsx — added below `#hostValueVersion = 0;`
   // True only for the instant this element is writing its own `value` attribute.
   #isReflecting = false;
   ```

   ```tsx
   // src/color-picker-element.tsx — replacing the body of attributeChangedCallback
   attributeChangedCallback(_name: string, _oldValue: string | null, _newValue: string | null) {
     if (this.#isReflecting) return; // our own write, not the host's
     this.#hostValueVersion += 1;
     this.#render();
   }
   ```

   ```tsx
   // src/color-picker-element.tsx — added as a new method above #render()
   #reflect(hexText: string) {
     // setAttribute calls attributeChangedCallback synchronously, so the flag is
     // guaranteed to still be true when the callback checks it.
     this.#isReflecting = true;
     this.setAttribute('value', hexText);
     this.#isReflecting = false;
   }
   ```

7. **Pass the callbacks down.** Replace the `render` call inside `#render`.

   ```tsx
   // src/color-picker-element.tsx — replacing the contents of #render()
   #render() {
     this.#reactRoot?.render(
       <ColorPicker
         hostValue={this.getAttribute('value') ?? undefined}
         hostValueVersion={this.#hostValueVersion}
         onValueInput={(hexText) => this.#reflect(hexText)}
         onValueCommit={(hexText) => this.#reflect(hexText)}
       />,
     );
   }
   ```

   Both callbacks do the same thing for now. Step 05 is where they stop being the same.

8. **Build and reload.**

   ```bash
   npm run build
   ```

## Done when (this step)

- With `<color-picker>` selected in the Elements panel, drag the square. The `value` attribute in the panel
  rewrites itself continuously, tracking the readout character for character.
- The drag stays smooth. It does not stutter, snap back, or reset its hue when you cross the left edge of the
  square — all three would be the reflection feeding back into the drag, which is what the flag prevents.
- After a drag, typing `document.querySelector('color-picker').value` in the Console prints the colour you
  dragged to, not the one the page started with.
- Setting `picker.value = '#00ff00'` from the Console still moves the picker. The guard did not break the
  inward path.
- `npm run build` exits without printing an error.

## If it breaks

- **The drag stutters or fights you, and the hue jumps when saturation reaches zero.** The `#isReflecting`
  guard is missing or is being reset before `setAttribute` returns. It must be set, then `setAttribute`, then
  cleared — in that order, in the same function.
- **`npm run build` fails with `'lastPublishedHex' is declared but its value is never read`.** `commitColor`
  is still reading `color`. Both halves of action 2 go in together: the ref is written by `applyColor` and
  read by `commitColor`.
- **The attribute never updates.** The callbacks are not reaching the element — check `#render` passes
  `onValueInput` and `onValueCommit`, and that the component calls `onValueInput?.()` inside `applyColor`.
- **The attribute updates but the picker no longer responds to `picker.value = ...`.** The guard is being left
  `true`. It is cleared on the line after `setAttribute`, unconditionally.
- **`npm run build` fails with `Cannot find name 'color'` inside `commitColor`.** `commitColor` must be
  declared inside the component function, below the `useState` call — not above it and not outside.

---
> Nav: [← The `value` property](03_the-value-property.md) · [Overview](00_overview.md) · [`input` and `change` events →](05_input-and-change-events.md)
