# Milestone 2 — The hue rail
> Foundation · milestone 2 of 5 · prev: [The tag on a page](../MILESTONE_1_the-tag-on-a-page/00_overview.md) · next: [The saturation/value area](../MILESTONE_3_the-saturation-value-area/00_overview.md) · start: [The colour model](01_the-color-model.md)

## Goal

Turn a pointer drag into a colour. By the end the component holds a real colour model instead of a hard-coded
string, converts it to the hex text you read on the page, and a horizontal rail sweeps the whole hue circle as
you drag along it — including when the pointer leaves the rail.

## Prerequisite

M1 complete: the tag renders on the demo page from the built bundle, served over HTTP. For each step, run
`npm run build` in `color-picker/` and hard-reload the demo page — the gates are read there, never on the dev
server. If you closed it, restart the server with `npx http-server . -c-1` from `color-picker-demo/`.

## Steps at a glance

**One sitting (01–05)**
1. [The colour model](01_the-color-model.md)
2. [Hex output](02_hex-output.md)
3. [Draw the hue rail](03_draw-the-hue-rail.md)
4. [Make the rail draggable](04_make-the-rail-draggable.md)
5. [Verify](05_verify.md)

## Design / decisions folded in

- The colour maths is written by hand rather than taken from a library — [step 01](01_the-color-model.md), recorded as D3 in [../foundation/decision-log.md](../foundation/decision-log.md).
- The picker is sRGB-only, and that is a scope limit, not an oversight — [step 01](01_the-color-model.md), recorded as D3.
- Pointer-drag tracking is written by hand on Pointer Events — [step 04](04_make-the-rail-draggable.md), recorded as D5.
- Identifiers carry their unit, because degrees and ratios are exactly what this component invites you to mix up — [../foundation/conventions.md](../foundation/conventions.md).

---
> Foundation · milestone 2 of 5 · prev: [The tag on a page](../MILESTONE_1_the-tag-on-a-page/00_overview.md) · next: [The saturation/value area](../MILESTONE_3_the-saturation-value-area/00_overview.md) · start: [The colour model](01_the-color-model.md)
