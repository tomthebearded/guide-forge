# Milestone 2 — The hue rail
> Foundation · milestone 2 of 5 · prev: [The tag on a page](../MILESTONE_1_the-tag-on-a-page/00_overview.md) · next: [The saturation/value area](../MILESTONE_3_the-saturation-value-area/00_overview.md) · start: [The colour model](01_the-color-model.md)

## Goal

Turn a pointer drag into a colour. This milestone introduces the HSV model and writes the first two sRGB
conversions by hand, then draws the hue rail and makes dragging it repaint the picker. By the end the far left
of the rail reads `#ff0000` and its exact midpoint reads `#00ffff`.

## Prerequisite

[Milestone 1](../MILESTONE_1_the-tag-on-a-page/00_overview.md) complete: the tag renders on the demo page and
`document.querySelector('color-picker').shadowRoot` is a `ShadowRoot`.

**The static server has to be running for every gate in this milestone.** If you closed the terminal from
milestone 1, start it again at the project root — `npx --yes http-server . -c-1` — before the first
`npm run build`.

## Steps at a glance

**Sitting 1 — the maths (01–02)**
1. [The colour model](01_the-color-model.md)
2. [Hex output](02_hex-output.md)

**Sitting 2 — the rail (03–05)**
3. [Draw the hue rail](03_draw-the-hue-rail.md)
4. [Make the rail draggable](04_make-the-rail-draggable.md)
5. [Verify](05_verify.md)

## Design / decisions folded in

- The colour maths is written by hand, not borrowed from `chroma-js` — taught in [step 01](01_the-color-model.md), recorded as D2 in [../foundation/decision-log.md](../foundation/decision-log.md).
- Signals and `computed` as the component's whole state model — taught in [step 03](03_draw-the-hue-rail.md).
- Pointer capture, so a drag survives the cursor leaving the rail — taught in [step 04](04_make-the-rail-draggable.md), recorded as D4.
- Hue is stored in degrees and a rail position is a ratio 0–1; the names say which is which — [../foundation/conventions.md](../foundation/conventions.md).

---
> Foundation · milestone 2 of 5 · prev: [The tag on a page](../MILESTONE_1_the-tag-on-a-page/00_overview.md) · next: [The saturation/value area](../MILESTONE_3_the-saturation-value-area/00_overview.md) · start: [The colour model](01_the-color-model.md)
