# Milestone 1 — The tag on a page
> Foundation · milestone 1 of 5 · prev: — · next: [The hue rail](../MILESTONE_2_the-hue-rail/00_overview.md) · start: [Create the workspace](01_create-the-workspace.md)

## Goal

Get a `<color-picker>` tag rendering on a plain HTML page that knows nothing about React — before a single
line of colour logic exists. By the end the whole distribution path is proven end to end: a React component is
mounted by a custom-element class you wrote yourself, Vite builds it into one self-registering bundle, a
static page loads that bundle over HTTP, and the component's styles sit behind a shadow root the host page
cannot reach into.

## Prerequisite

Node 24 LTS installed and on your `PATH` (`node --version` prints `v24.` something). Nothing else — Vite
arrives with the first command of step 01.

## Steps at a glance

**Sitting 1 — a React component in a shadow root (01–04)**
1. [Create the workspace](01_create-the-workspace.md)
2. [The panel component](02_the-panel-component.md)
3. [The custom element](03_the-custom-element.md)
4. [The styles](04_the-styles.md)

**Sitting 2 — the bundle and the page that loads it (05–07)**
5. [The library build](05_the-library-build.md)
6. [The demo page](06_the-demo-page.md)
7. [Verify](07_verify.md)

## Design / decisions folded in

- React renders into a mount `<div>` inside the shadow root, never into the shadow root itself — [step 03](03_the-custom-element.md), recorded as D1 in [../foundation/decision-log.md](../foundation/decision-log.md).
- The bridge is written by hand rather than taken from a library — [step 03](03_the-custom-element.md), recorded as D2.
- The styles are a TypeScript string, so the build emits no `.css` file — [step 04](04_the-styles.md), recorded as D4.
- The demo page lives outside the Vite workspace and is never built by Vite — [step 06](06_the-demo-page.md), recorded in [../foundation/conventions.md](../foundation/conventions.md).
- The bundle filename never changes, so the browser cache is this guide's most convincing liar — [step 06](06_the-demo-page.md).

---
> Foundation · milestone 1 of 5 · prev: — · next: [The hue rail](../MILESTONE_2_the-hue-rail/00_overview.md) · start: [Create the workspace](01_create-the-workspace.md)
