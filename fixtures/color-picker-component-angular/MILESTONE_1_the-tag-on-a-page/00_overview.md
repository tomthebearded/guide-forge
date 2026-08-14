# Milestone 1 — The tag on a page
> Foundation · milestone 1 of 5 · prev: — · next: [The hue rail](../MILESTONE_2_the-hue-rail/00_overview.md) · start: [Create the workspace](01_create-the-workspace.md)

## Goal

Get a `<color-picker>` tag rendering on a plain HTML page that knows nothing about Angular — before a single
line of colour logic exists. By the end the whole distribution path is proven end to end: an Angular component
becomes a custom element, the CLI builds it into one self-registering bundle, a static page loads that bundle
over HTTP, and the component's styles sit behind a shadow root the host page cannot reach into.

## Prerequisite

Node 24 LTS installed and on your `PATH`. Nothing else — the Angular CLI arrives with the first command of
step 01.

## Steps at a glance

**Sitting 1 — the workspace and the element (01–03)**
1. [Create the workspace](01_create-the-workspace.md)
2. [Write the component](02_the-component.md)
3. [Register it as a custom element](03_register-the-element.md)

**Sitting 2 — the build output and the page that loads it (04–06)**
4. [Point the build where the demo can reach it](04_the-build-output.md)
5. [The demo page](05_the-demo-page.md)
6. [Verify](06_verify.md)

## Design / decisions folded in

- Shadow DOM over Angular's emulated encapsulation — taught in [step 02](02_the-component.md), recorded as D1 in [../foundation/decision-log.md](../foundation/decision-log.md).
- `@angular/elements` rather than a hand-written `HTMLElement` subclass — taught in [step 03](03_register-the-element.md), recorded as D3.
- The demo page lives outside the Angular workspace and is never built by the CLI — [step 05](05_the-demo-page.md), recorded in [../foundation/conventions.md](../foundation/conventions.md).
- The bundle filename never changes, so the browser cache is this guide's most convincing liar — [step 04](04_the-build-output.md).

---
> Foundation · milestone 1 of 5 · prev: — · next: [The hue rail](../MILESTONE_2_the-hue-rail/00_overview.md) · start: [Create the workspace](01_create-the-workspace.md)
