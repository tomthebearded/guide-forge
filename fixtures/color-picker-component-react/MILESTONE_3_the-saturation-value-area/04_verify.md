# Milestone 3 · Step 04 of 04 — Verify
> Nav: [← The square handle](03_the-square-handle.md) · [Overview](00_overview.md) · [The host-page contract →](../MILESTONE_4_the-host-page-contract/00_overview.md)

## Before you start

Steps 01–03 done. `npm run build` has been run since your last edit, `npx http-server . -c-1` is running from
`color-picker-demo/`, and `http://127.0.0.1:8080/demo/` is open and **hard-reloaded**.

## Done when (milestone gate)

Set the hue to 0 first: press on the hue rail and drag past its **left** edge, then release. The readout's
first channel is now `ff`. All four readings below are taken at that hue, on the demo page.

1. **Top-right corner → `#ff0000`.** Press inside the square and drag past its top-right corner. The readout
   reads exactly `#ff0000`. That is saturation 1, value 1 — the pure hue.
2. **Top-left corner → `#ffffff`.** Drag past the top-left corner. The readout reads exactly `#ffffff`.
   Saturation 0 at full value is white, whatever the hue is.
3. **Anywhere along the bottom edge → `#000000`.** Drag past the bottom edge and move left and right along it.
   The readout reads exactly `#000000` the whole way. Value 0 is black regardless of hue and saturation —
   which is why this reading works anywhere on the edge rather than at one point.
4. **The starting colour is the canonical one.** Hard-reload the page. The readout reads exactly `#3366ff`,
   the swatch is that blue, the square's handle sits near the top-right corner and the rail's handle sits over
   the blue part of the gradient.

Each corner reading is taken by dragging **past** the corner, not by landing on it: the clamp pins the ratio
at 0 or 1 and holds it there, which is what makes an exact value something you can read rather than something
you have to hit.

## Reality check

This is the first point where the thing is genuinely a colour picker rather than a demonstration of a
pipeline. Stop here and use it for a minute — pick a few colours you actually want, and decide whether the
layout, the sizes and the feel of the two drags are what you want to build a public API on top of. M4 turns
this component's surface into promises a host page depends on, and changing the design after that costs more
than changing it now.

## Files after this milestone

### `color-picker/src/drag.ts`

```ts
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

/** Where down a track's height a pointer sits: 0 at the top edge, 1 at the bottom. */
export function verticalRatio(track: HTMLElement, clientY: number): number {
  const bounds = track.getBoundingClientRect();
  return clampToUnitRange((clientY - bounds.top) / bounds.height);
}
```

### `color-picker/src/ColorPicker.tsx`

```tsx
import { useState, type PointerEvent } from 'react';
import { hsvToRgb, rgbToHex, type HsvColor } from './color';
import { horizontalRatio, verticalRatio } from './drag';

export function ColorPicker() {
  const [color, setColor] = useState<HsvColor>({
    hueDegrees: 225,
    saturationRatio: 0.8,
    valueRatio: 1,
  });

  const rgb = hsvToRgb(color);
  const cssColor = `rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})`;
  const hexText = rgbToHex(rgb);
  // The square's base is the current hue at full saturation and brightness —
  // the corner of the square, which the gradients then fade away from.
  const hueOnlyRgb = hsvToRgb({ hueDegrees: color.hueDegrees, saturationRatio: 1, valueRatio: 1 });
  const hueOnlyCssColor = `rgb(${hueOnlyRgb.red}, ${hueOnlyRgb.green}, ${hueOnlyRgb.blue})`;

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

  return (
    <div className="panel">
      <div className="swatch" style={{ background: cssColor }} />
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
      <div
        className="hue-rail"
        onPointerDown={handleRailPointerDown}
        onPointerMove={handleRailPointerMove}
      >
        <div className="handle" style={{ left: `${(color.hueDegrees / 360) * 100}%` }} />
      </div>
      <div className="readout">{hexText}</div>
    </div>
  );
}
```

### `color-picker/src/styles.ts`

```ts
export const pickerStyleSheet = new CSSStyleSheet();

// replaceSync parses the text and replaces every rule in the sheet, synchronously.
pickerStyleSheet.replaceSync(`
  :host {
    display: inline-block;
    font-family: system-ui, sans-serif;
  }

  .panel {
    width: 240px;
    padding: 12px;
    border-radius: 10px;
    background: #1e1e1e;
    color: #f5f5f5;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
  }

  .swatch {
    height: 48px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .sv-area {
    position: relative;
    height: 140px;
    margin-top: 10px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    touch-action: none;
  }

  /* Layer 2: saturation. White on the left, transparent on the right. */
  .sv-area::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(to right, #ffffff, rgba(255, 255, 255, 0));
  }

  /* Layer 3: value. Black along the bottom, transparent at the top. */
  .sv-area::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(to top, #000000, rgba(0, 0, 0, 0));
  }

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

  .readout {
    margin-top: 10px;
    font-family: ui-monospace, monospace;
    font-size: 14px;
    letter-spacing: 0.04em;
  }
`);
```

## Troubleshooting

| Symptom | First thing to check |
|---|---|
| The square darkens when you drag up | The `1 -` is missing from `valueRatio` |
| The square is flat, with no white or black corners | `content: ''` missing from `::before` / `::after` |
| The bottom edge does not read exactly `#000000` | You are on the edge but not past it — drag below the square and hold |
| The top-left does not read exactly `#ffffff` | Same: drag past the corner, not onto it |
| The square's handle sits at 50% vertically | The inline `top` is missing and the stylesheet's `top: 50%` is winning |
| Pressing near the handle does nothing | `pointer-events: none` was removed from `.handle` |
| The starting readout is `#0040ff` | The `useState` initial object still has `saturationRatio: 1` |

## Handoff

**You now have** everything from M1 and M2 — the bundle, the element, the shadow root, the demo page, the HSV
model, the hex formatter, the drag helper and the hue rail — plus a saturation/value square with its own
handle, and a picker whose starting colour is the guide's canonical `#3366ff`.

**Open:** the component is a closed box. A host page cannot set the colour, cannot read it, and is not told
when it changes. Alpha does not exist and the readout has one format.

**Next:** [Milestone 4 — The host-page contract](../MILESTONE_4_the-host-page-contract/00_overview.md), which
gives the tag a public surface a page that knows nothing about React can drive and be driven by.

---
> Nav: [← The square handle](03_the-square-handle.md) · [Overview](00_overview.md) · [The host-page contract →](../MILESTONE_4_the-host-page-contract/00_overview.md)
