# Milestone 4 — The host-page contract
> Public surface · milestone 4 of 5 · prev: [The saturation/value area](../MILESTONE_3_the-saturation-value-area/00_overview.md) · next: [Alpha, formats and theming](../MILESTONE_5_alpha-formats-and-theming/00_overview.md) · start: [Read a colour in](01_read-a-color-in.md)

## Goal

Open the component to the page around it. A `value` attribute sets the colour from markup and from plain
JavaScript; the picked colour is written back out to that attribute as it changes; `input` and `change` events
carry it to any listener. Preset swatches drive the same path from the inside, which is how you prove there is
one path and not two.

## Prerequisite

[Milestone 3](../MILESTONE_3_the-saturation-value-area/00_overview.md) complete: two drags reach any sRGB
colour, and dragging past the square's corners reads exactly `#ffffff`, `#ff0000` and `#000000`.

**The static server has to be running for every gate in this milestone.** If you closed the terminal, start it
again at the project root — `npx --yes http-server . -c-1`.

## Steps at a glance

**Sitting 1 — in and out (01–03)**
1. [Read a colour in](01_read-a-color-in.md)
2. [The `value` attribute](02_the-value-attribute.md)
3. [Reflect the value out](03_reflect-the-value-out.md)

**Sitting 2 — telling the page, and driving it from inside (04–06)**
4. [`input` and `change` events](04_input-and-change-events.md)
5. [Preset swatches](05_preset-swatches.md)
6. [Verify](06_verify.md)

## Design / decisions folded in

- Angular maps attribute → property; property → attribute is code you write — fact 3 in [../foundation/stack.md](../foundation/stack.md), built in [step 03](03_reflect-the-value-out.md).
- Outputs arrive at the page as `CustomEvent`s whose payload sits on `detail` — fact 2 in [../foundation/stack.md](../foundation/stack.md), built in [step 04](04_input-and-change-events.md).
- `input` while dragging, one `change` on release — the split native range inputs use, [step 04](04_input-and-change-events.md).
- A grey has no hue to recover, so a grey coming in resets the rail to 0° — named in [step 01](01_read-a-color-in.md).

---
> Public surface · milestone 4 of 5 · prev: [The saturation/value area](../MILESTONE_3_the-saturation-value-area/00_overview.md) · next: [Alpha, formats and theming](../MILESTONE_5_alpha-formats-and-theming/00_overview.md) · start: [Read a colour in](01_read-a-color-in.md)
