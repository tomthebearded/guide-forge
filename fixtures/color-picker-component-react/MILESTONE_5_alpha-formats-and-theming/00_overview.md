# Milestone 5 — Alpha, formats and theming
> Polish · milestone 5 of 5 · prev: [The host-page contract](../MILESTONE_4_the-host-page-contract/00_overview.md) · next: — · start: [Alpha in the colour model](01_alpha-in-the-color-model.md)

## Goal

Complete the public surface. By the end the picker carries alpha end to end — in the model, in the swatch, on
the wire and back in through the `value` attribute — its readout switches between hex, rgb and hsl, the
`format` attribute picks the initial mode, and the host page can restyle named parts of the component through
`::part()` without touching its source.

## Prerequisite

M4 complete: the `value` attribute, the `value` property and both events work from the demo page. For each
step, run `npm run build` in `color-picker/` and hard-reload the demo page — the gates are read there, never
on the dev server. If you closed it, restart the server with `npx http-server . -c-1` from
`color-picker-demo/`.

## Steps at a glance

**One sitting, the longest in the guide (01–05)**
1. [Alpha in the colour model](01_alpha-in-the-color-model.md)
2. [The alpha rail](02_the-alpha-rail.md)
3. [rgb, hsl and the format switch](03_rgb-hsl-and-the-format-switch.md)
4. [Name the parts](04_name-the-parts.md)
5. [Verify](05_verify.md)

## Design / decisions folded in

- Alpha travels as a **byte** in an eight-digit hex, `round(alpha × 255)` rounding half up — [step 01](01_alpha-in-the-color-model.md), fixed in [../foundation/conventions.md](../foundation/conventions.md).
- Adding a field to the colour type breaks every call site, and they are all fixed in the step that breaks them — [step 01](01_alpha-in-the-color-model.md).
- The format switch changes the **readout only**; the `value` attribute and both events always carry hex — [step 03](03_rgb-hsl-and-the-format-switch.md).
- Two conversions and the switch that uses them are one step, because a formatter with no caller does not compile — [step 03](03_rgb-hsl-and-the-format-switch.md).
- `::part()` is a deliberate hole in the encapsulation and therefore a public promise, designed once as a contract rather than accreted node by node — [step 04](04_name-the-parts.md), recorded as D1 in [../foundation/decision-log.md](../foundation/decision-log.md).

---
> Polish · milestone 5 of 5 · prev: [The host-page contract](../MILESTONE_4_the-host-page-contract/00_overview.md) · next: — · start: [Alpha in the colour model](01_alpha-in-the-color-model.md)
