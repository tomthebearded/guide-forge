# Milestone 5 — Alpha, formats and theming
> Polish · milestone 5 of 5 · prev: [The host-page contract](../MILESTONE_4_the-host-page-contract/00_overview.md) · next: — · start: [Alpha in the colour model](01_alpha-in-the-color-model.md)

## Goal

Finish the public surface. Alpha runs through the colour model and gets its own rail over a checkerboard; a
third conversion and a `format` switch let the readout speak hex, rgb or hsl; and the shadow root gets a
deliberate hole in it — `::part()` names and CSS custom properties — so a host site can restyle the picker
without touching its source.

## Prerequisite

[Milestone 4](../MILESTONE_4_the-host-page-contract/00_overview.md) complete: `<color-picker value="#3366ff">`
opens on that colour, the attribute follows every drag, and the demo page logs `input` and `change` with their
`detail`.

**The static server has to be running for every gate in this milestone.** If you closed the terminal, start it
again at the project root — `npx --yes http-server . -c-1`.

## Steps at a glance

**Sitting 1 — alpha (01–02)**
1. [Alpha in the colour model](01_alpha-in-the-color-model.md)
2. [The alpha rail](02_the-alpha-rail.md)

**Sitting 2 — formats (03–04)**
3. [HSL conversion](03_hsl-conversion.md)
4. [The format switch](04_the-format-switch.md)

**Sitting 3 — the theming surface (05–07)**
5. [Name the parts](05_name-the-parts.md)
6. [Theme with custom properties](06_theme-with-custom-properties.md)
7. [Verify](07_verify.md)

## Design / decisions folded in

- Adding a field to a shared type breaks every construction site, and the same step fixes all of them — [step 01](01_alpha-in-the-color-model.md).
- The alpha byte is `round(alpha × 255)`, half up, fixed once in [../foundation/conventions.md](../foundation/conventions.md).
- `format` changes the readout only; the stored value and both events stay hex — [step 04](04_the-format-switch.md), recorded as D8 in [../foundation/decision-log.md](../foundation/decision-log.md).
- A part name is a public promise, so the whole theming surface is named in one pass — [step 05](05_name-the-parts.md), recorded as D1.

---
> Polish · milestone 5 of 5 · prev: [The host-page contract](../MILESTONE_4_the-host-page-contract/00_overview.md) · next: — · start: [Alpha in the colour model](01_alpha-in-the-color-model.md)
