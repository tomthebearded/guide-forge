# A React colour picker that ships as a plain HTML tag

> The front door to this guide. Skim this, then follow the milestones. **Progress lives in
> [foundation/status.md](foundation/status.md), not here** — this page describes intent; `status.md` states
> reality.

> _Generated with **GuideForge v1.15.0**._

## Objective

You'll build a colour picker as a React component and ship it as a **custom element** — a real HTML tag. A
site that has never heard of React drops one `<script>` on the page, writes
`<color-picker value="#3366ff">`, and gets a working picker: a saturation/value area, a hue rail, an alpha
rail, preset swatches, a switchable hex/rgb/hsl readout, and `input`/`change` events carrying the value.

"Done" is observable as a page: a static `demo/index.html` — plain HTML, no framework, no bundler — served
over HTTP, showing the picker, logging its events, and restyling it from the outside through `::part()`.

## Stack (summary)

React 19 · Vite 8 in library mode · TypeScript 6 · Node 24 LTS · native shadow DOM, with a custom-element
bridge you write by hand · no test framework and no database. Nothing to install permanently beyond Node: the
one thing that has to be *running* for every gate is a static file server, and it arrives through `npx`. Full
verified table with official docs and check date: **[foundation/stack.md](foundation/stack.md)**.

## Key decisions

- **The React → custom-element bridge is written by hand.** React has no in-house equivalent of Angular's
  `@angular/elements`, and that bridge is what this guide came to teach: a shadow root, a React root you own
  and unmount, attributes mapped to props, property accessors on the class, and events on the way out. The
  step that writes it names the library it is replacing. Recorded as D2 in
  [foundation/decision-log.md](foundation/decision-log.md).
- **The colour maths is written by hand too** — only the sRGB conversions the picker needs, and only because
  the conversions are what you came to learn. Recorded as D3.
- **The component lives behind a shadow root**, and React renders into a mount node *inside* it, never into
  the shadow root itself. Recorded as D1.
- **The styles never touch a `.css` file.** They are a TypeScript string handed to a constructed stylesheet,
  which is what keeps the build down to a single `.js` and one `<script>` tag. Recorded as D4.
- **The gates are a browser, not a test runner.** There is no test suite in this stack, so every Done-when
  names an exact value you can read on the page. See D6.

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
| 2026-08-14 | Fixed, both in M1: the library build needed `define: { 'process.env.NODE_ENV': … }` — without it Vite's library mode leaves the expression in the bundle and the demo page dies with `ReferenceError: process is not defined`, so M1 could not be completed at all; and step 01's gate quoted a `create-vite` demo page whose wording has since changed (`Get started`, `Count is 0`, no `vite-env.d.ts`). |
| 2026-08-14 | Fixed: three steps in M2 and one in M5 claimed a clean build while introducing a declaration before its first caller, which the template's `noUnusedLocals` setting rejects — `useState` now arrives in M2/04 where the drag needs it, and M5's two conversion steps are merged into one (M5/03). Also fixed: the `change` event could carry a colour one pointer-move behind the last `input` (M4/04). Plus six smaller contract defects — see the drift log in [foundation/status.md](foundation/status.md). |
| 2026-08-14 | Guide created with GuideForge v1.15.0. |
