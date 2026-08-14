# An Angular colour picker that ships as a plain HTML tag

> The front door to this guide. Skim this, then follow the milestones. **Progress lives in
> [foundation/status.md](foundation/status.md), not here** — this page describes intent; `status.md` states
> reality.

> _Generated with **GuideForge v1.15.0**._

## Objective

You'll build a colour picker as an Angular component and ship it as a **custom element** — a real HTML tag. A
site that has never heard of Angular drops one `<script>` on the page, writes
`<color-picker value="#3366ff">`, and gets a working picker: a saturation/value area, a hue rail, an alpha
rail, preset swatches, a switchable hex/rgb/hsl readout, and `input`/`change` events carrying the value.

"Done" is observable as a page: a static `demo/index.html` — plain HTML, no framework, no bundler — served
over HTTP, showing the picker, logging its events, and restyling it from the outside through `::part()`.

## Stack (summary)

Angular 22 (LTS to 2028-06) · `@angular/elements` for the custom-element bridge · zoneless change detection ·
native shadow DOM · Node 24 LTS · no test framework, no database, no service to install. Full verified table
with official docs and check date: **[foundation/stack.md](foundation/stack.md)**.

## Key decisions

- **The colour maths is written by hand.** Only the five sRGB conversions the picker needs, and only because
  the conversions are what you came to learn. The step that writes them names the library it is replacing.
  Recorded as D2 in [foundation/decision-log.md](foundation/decision-log.md).
- **The component lives behind a shadow root.** The host page cannot break its styling, and cannot restyle it
  either except through the surface M5 exposes on purpose. Recorded as D1.
- **The gates are a browser, not a test runner.** There is no test suite in this stack, so every Done-when
  names an exact value you can read on the page. See D5.

Full rationale, including the risks accepted when the plan was approved:
[foundation/decision-log.md](foundation/decision-log.md).

## Following this guide

**Type the code, don't paste it.** Each step says *where* a fragment goes and *why* it's there, and that
context is the thing you're here for. The complete file contents rendered in each milestone's `NN_verify.md`
are an authoritative reference to diff against when you suspect you've drifted — not an invitation to paste
your way to the end.

Commit at the end of every step. Every step is cut so the project still builds when it ends, which makes each
step boundary a free restore point.

Start at [Milestone 1](MILESTONE_1_the-tag-on-a-page/00_overview.md).

## Updates

| Date | What changed |
|------|--------------|
| 2026-08-14 | Fixed, all in M1 and all about the toolchain rather than the picker: step 04 told you to replace an `outputPath` line that `ng new` does not write (it is **added** now, with a fallback note); step 03's gate predicted a **bigger** bundle where deleting `src/app` makes it smaller; and two gates plus an M2 note quoted CSS widths as if they were measured ones (`240px` content box vs ~266px element, and the rail is 240px, not 216px). |
| 2026-08-14 | Fixed: three gates asserted an **exhaustive** `dist/` listing, which a production build can legitimately exceed — they now read the presence of `main.js` and the absence of a polyfills file (M1/04, M1/06, M5/07). Plus two wrong export counts, a stale "four conversions" claim, the guide-follower addressed in the third person in 9 steps, and the static server declared only once (M1–M5). |
| 2026-08-14 | Guide created with GuideForge v1.15.0. |
