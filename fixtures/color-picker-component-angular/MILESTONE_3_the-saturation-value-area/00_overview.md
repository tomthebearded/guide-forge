# Milestone 3 — The saturation/value area
> Core · milestone 3 of 5 · prev: [The hue rail](../MILESTONE_2_the-hue-rail/00_overview.md) · next: [The host-page contract](../MILESTONE_4_the-host-page-contract/00_overview.md) · start: [Draw the square](01_draw-the-square.md)

## Goal

Add the two-axis square — saturation across, value down — and combine it with the hue from milestone 2. By the
end you reach any sRGB colour with two drags, and the three corners the maths guarantees read exactly
`#ffffff`, `#ff0000` and `#000000`.

**This is the reality-check rung** — its gate ends in a short design review, in
[step 04](04_verify.md), before the public API gets built on top.

## Prerequisite

[Milestone 2](../MILESTONE_2_the-hue-rail/00_overview.md) complete: the hue rail drags, the readout reads
`#ff0000` at rest, and `pointerRatiosWithin` clamps a drag that leaves the element.

**The static server has to be running for every gate in this milestone.** If you closed the terminal, start it
again at the project root — `npx --yes http-server . -c-1`.

## Steps at a glance

**One sitting (01–04)**
1. [Draw the square](01_draw-the-square.md)
2. [Saturation and value](02_saturation-and-value.md)
3. [The square's handle](03_the-square-handle.md)
4. [Verify](04_verify.md)

## Design / decisions folded in

- The square's surface is two CSS gradients over a hue-coloured background — taught in [step 01](01_draw-the-square.md).
- The same clamping pointer helper drives both axes, which is why the corners are exactly reachable — [step 02](02_saturation-and-value.md), recorded as D4 in [../foundation/decision-log.md](../foundation/decision-log.md).
- HSV *value* is not HSL *lightness*; the square's vertical axis is the first — [step 02](02_saturation-and-value.md), indexed in [../foundation/glossary.md](../foundation/glossary.md).

---
> Core · milestone 3 of 5 · prev: [The hue rail](../MILESTONE_2_the-hue-rail/00_overview.md) · next: [The host-page contract](../MILESTONE_4_the-host-page-contract/00_overview.md) · start: [Draw the square](01_draw-the-square.md)
