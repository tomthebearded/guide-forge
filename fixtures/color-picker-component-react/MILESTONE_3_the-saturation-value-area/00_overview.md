# Milestone 3 — The saturation/value area
> Core · milestone 3 of 5 · prev: [The hue rail](../MILESTONE_2_the-hue-rail/00_overview.md) · next: [The host-page contract](../MILESTONE_4_the-host-page-contract/00_overview.md) · start: [Draw the square](01_draw-the-square.md)

## Goal

Make it a colour picker. By the end a square sits above the hue rail with its base colour driven by the
current hue, dragging inside it sets saturation and value together, and a handle shows where in that square
the current colour lives.

## Prerequisite

M2 complete: dragging the hue rail changes the readout. For each step, run `npm run build` in `color-picker/`
and hard-reload the demo page — the gates are read there, never on the dev server. If you closed it, restart
the server with `npx http-server . -c-1` from `color-picker-demo/`.

## Steps at a glance

**One sitting (01–04)**
1. [Draw the square](01_draw-the-square.md)
2. [Saturation and value](02_saturation-and-value.md)
3. [The square handle](03_the-square-handle.md)
4. [Verify](04_verify.md)

## Design / decisions folded in

- The square's two axes are the two remaining HSV numbers, which is why the model was HSV in the first place — [step 01](01_draw-the-square.md), taught against the model from [M2 step 01](../MILESTONE_2_the-hue-rail/01_the-color-model.md).
- The vertical axis is inverted — the top of the square is value 1, not 0 — [step 02](02_saturation-and-value.md).
- The canonical demo colour `#3366ff` becomes the picker's starting colour here, because this is the first milestone that can express it — [step 02](02_saturation-and-value.md), fixed in [../foundation/conventions.md](../foundation/conventions.md).
- Pointer-drag tracking stays hand-written and is now reused on a second axis — [step 02](02_saturation-and-value.md), recorded as D5 in [../foundation/decision-log.md](../foundation/decision-log.md).

---
> Core · milestone 3 of 5 · prev: [The hue rail](../MILESTONE_2_the-hue-rail/00_overview.md) · next: [The host-page contract](../MILESTONE_4_the-host-page-contract/00_overview.md) · start: [Draw the square](01_draw-the-square.md)
