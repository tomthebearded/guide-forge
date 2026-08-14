# Milestone 4 — The host-page contract
> Public surface · milestone 4 of 5 · prev: [The saturation/value area](../MILESTONE_3_the-saturation-value-area/00_overview.md) · next: [Alpha, formats and theming](../MILESTONE_5_alpha-formats-and-theming/00_overview.md) · start: [Read a colour in](01_read-a-color-in.md)

## Goal

Give the tag a public surface that a page which knows nothing about React can drive and be driven by. By the
end `<color-picker value="#3366ff">` renders that colour on load, `el.value` reads and writes it from the
console, dragging reflects the current colour back to the attribute, `input` and `change` events carry it out,
and a row of preset swatches does both at once.

## Prerequisite

M3 complete: the square and the rail together produce any colour, and the reality-check gate has been passed.
For each step, run `npm run build` in `color-picker/` and hard-reload the demo page — the gates are read
there, never on the dev server. If you closed it, restart the server with `npx http-server . -c-1` from
`color-picker-demo/`.

## Steps at a glance

**Sitting 1 — in (01–03)**
1. [Read a colour in](01_read-a-color-in.md)
2. [The `value` attribute](02_the-value-attribute.md)
3. [The `value` property](03_the-value-property.md)

**Sitting 2 — out (04–07)**
4. [Reflect the value out](04_reflect-the-value-out.md)
5. [`input` and `change` events](05_input-and-change-events.md)
6. [Preset swatches](06_preset-swatches.md)
7. [Verify](07_verify.md)

## Design / decisions folded in

- Attributes and properties are two separate things, and keeping them in step is code you write — [step 02](02_the-value-attribute.md) and [step 03](03_the-value-property.md). Angular's element bridge would have generated the accessors; here you write them, which is the point of D2 in [../foundation/decision-log.md](../foundation/decision-log.md).
- The element writes the `value` attribute itself, so it needs a way to tell its own writes from the host's — [step 02](02_the-value-attribute.md) and [step 04](04_reflect-the-value-out.md).
- The wire format is always hex, whatever the readout shows — [step 05](05_input-and-change-events.md), and it is what makes M5's format switch a display choice rather than a change to the contract.
- `input` fires continuously, `change` once on release — the same split every native input uses — [step 05](05_input-and-change-events.md).

---
> Public surface · milestone 4 of 5 · prev: [The saturation/value area](../MILESTONE_3_the-saturation-value-area/00_overview.md) · next: [Alpha, formats and theming](../MILESTONE_5_alpha-formats-and-theming/00_overview.md) · start: [Read a colour in](01_read-a-color-in.md)
