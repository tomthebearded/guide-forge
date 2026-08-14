# Milestone 2 · Step 05 of 05 — Verify
> Nav: [← Make the rail draggable](04_make-the-rail-draggable.md) · [Overview](00_overview.md) · [The saturation/value area →](../MILESTONE_3_the-saturation-value-area/00_overview.md)

## Before you start

Steps 01–04 done. `npm run build` has been run since your last edit, `npx http-server . -c-1` is running from
`color-picker-demo/`, and `http://127.0.0.1:8080/demo/` is open and **hard-reloaded**.

## Done when (milestone gate)

All four are read on the demo page.

1. **The rail sweeps the hue circle.** Press on the rail and drag slowly from the far left to the far right.
   The swatch passes through red, yellow, green, cyan, blue and magenta, in that order, and returns to red.
2. **Past either edge it pins at exactly `#ff0000`.** Drag past the right-hand end of the rail — keep the
   button down and move the pointer well beyond it — and the readout reads exactly `#ff0000`. Do the same past
   the left-hand end: the same `#ff0000`. This is the clamp, and it is deliberately an *edge* rather than a
   midpoint, because an edge is something you can hold a pointer against and a midpoint is half a pixel wide.
3. **Across the middle third the readout begins `#00`.** Drag anywhere between one third and two thirds of the
   rail's width: every reading in that span starts with `#00`, because between hue 120° and hue 240° the red
   channel is zero. Individual values will differ — that is the point of gating on the prefix rather than on a
   value you would have to land on exactly.
4. **A drag survives leaving the rail.** Press on the rail, drag down over the page background or outside the
   browser window entirely, then release. The picker holds the colour you dragged to. It does not freeze
   mid-gesture and does not snap back.

## Files after this milestone

### `color-picker/src/color.ts`

```ts
export interface HsvColor {
  hueDegrees: number;      // 0–360, the angle around the colour wheel
  saturationRatio: number; // 0–1
  valueRatio: number;      // 0–1, brightness
}

export interface RgbColor {
  red: number;   // 0–255
  green: number;
  blue: number;
}

/**
 * The hue circle is six 60° sectors. In every sector one channel sits at the
 * maximum, one at the minimum, and the third slides between them — which is
 * the whole conversion, once you know which channel is which.
 */
export function hsvToRgb(hsv: HsvColor): RgbColor {
  const sector = (hsv.hueDegrees % 360) / 60;  // 0–6: which sixth of the wheel
  const sectorIndex = Math.floor(sector);      // Math.floor rounds down to a whole number
  const sectorOffset = sector - sectorIndex;   // 0–1: how far through that sixth

  const maxChannel = hsv.valueRatio;
  const minChannel = hsv.valueRatio * (1 - hsv.saturationRatio);
  const rising = minChannel + (maxChannel - minChannel) * sectorOffset;
  const falling = maxChannel - (maxChannel - minChannel) * sectorOffset;

  const channelsBySector: [number, number, number][] = [
    [maxChannel, rising, minChannel],   //   0°– 60°  red    → yellow
    [falling, maxChannel, minChannel],  //  60°–120°  yellow → green
    [minChannel, maxChannel, rising],   // 120°–180°  green  → cyan
    [minChannel, falling, maxChannel],  // 180°–240°  cyan   → blue
    [rising, minChannel, maxChannel],   // 240°–300°  blue   → magenta
    [maxChannel, minChannel, falling],  // 300°–360°  magenta→ red
  ];

  const [red, green, blue] = channelsBySector[sectorIndex % 6];
  return {
    // Math.round turns a 0–1 ratio into one of the 256 values a channel can hold.
    red: Math.round(red * 255),
    green: Math.round(green * 255),
    blue: Math.round(blue * 255),
  };
}

// toString(16) writes a number in base 16; padStart(2, '0') makes sure a
// single-digit channel like 5 becomes "05" rather than "5".
function toHexByte(channel: number): string {
  return channel.toString(16).padStart(2, '0');
}

/** Lowercase six-digit hex, the form every gate in this guide quotes. */
export function rgbToHex(rgb: RgbColor): string {
  return `#${toHexByte(rgb.red)}${toHexByte(rgb.green)}${toHexByte(rgb.blue)}`;
}
```

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
```

### `color-picker/src/ColorPicker.tsx`

```tsx
import { useState, type PointerEvent } from 'react';
import { hsvToRgb, rgbToHex, type HsvColor } from './color';
import { horizontalRatio } from './drag';

export function ColorPicker() {
  // Saturation and value are pinned at 1 here, so the rail shows pure hues.
  // M3 gives them the square that moves them.
  const [color, setColor] = useState<HsvColor>({
    hueDegrees: 225,
    saturationRatio: 1,
    valueRatio: 1,
  });

  const rgb = hsvToRgb(color);
  const cssColor = `rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})`;
  const hexText = rgbToHex(rgb);

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

  return (
    <div className="panel">
      <div className="swatch" style={{ background: cssColor }} />
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
| The drag dies when the pointer leaves the rail | `setPointerCapture(event.pointerId)` missing from the pointer-down handler |
| The colour changes on hover, with no button pressed | The `hasPointerCapture` guard is missing from the pointer-move handler |
| The handle is offset from the pointer | `pointer-events: none` missing from `.handle` |
| The far end reads `#ff0004` instead of `#ff0000` | `horizontalRatio` is not returning `clampToUnitRange(...)` |
| The readout is uppercase | Something calls `.toUpperCase()`; every gate here compares lowercase |
| The rail is a flat colour, not a gradient | The CSS was pasted outside the `replaceSync` backticks |
| A rebuild changed nothing on screen | Cached bundle. Hard-reload; confirm `-c-1` on the server |

## Handoff

**You now have** everything from M1 — the bundle, the custom element, the shadow root, the demo page — plus a
real HSV colour model, an sRGB HSV→RGB conversion and a hex formatter written by hand, a reusable
0–1 pointer-ratio helper with pointer capture, and a hue rail that drives the colour with a drag.

**Open:** saturation and value are pinned at 1, so the picker can only produce fully-saturated, fully-bright
colours. Nothing outside the component can set or read the colour yet.

**Next:** [Milestone 3 — The saturation/value area](../MILESTONE_3_the-saturation-value-area/00_overview.md),
which is the point where the thing becomes an actual colour picker — and the guide's reality-check gate.

---
> Nav: [← Make the rail draggable](04_make-the-rail-draggable.md) · [Overview](00_overview.md) · [The saturation/value area →](../MILESTONE_3_the-saturation-value-area/00_overview.md)
