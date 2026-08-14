# M1 · Step 03 of 06 — Register it as a custom element
> Nav: [← Write the component](02_the-component.md) · [Overview](00_overview.md) · [Point the build where the demo can reach it →](04_the-build-output.md)

## Glossary for this step

> New here: **[custom element](../foundation/glossary.md#custom-element)** and
> **[custom-element registry](../foundation/glossary.md#custom-element-registry)** (defined under *Do this* 2),
> and **[injector](../foundation/glossary.md#injector)** (defined under *Do this* 2 as well).

## Why / design

This is the bridge, and it is the reason the guide is built on Angular rather than around it. Three lines turn
a component into a tag:

1. **Create an Angular environment** without rendering anything into the page. A normal Angular app bootstraps
   a root component into a `<div id="app">`; you have no such div and no such root — you have a tag that may be
   used zero or fifty times, by a page you did not write.
2. **Wrap the component in a class the browser understands** — one that extends `HTMLElement` and knows how to
   construct your component, feed its inputs from attributes, and re-dispatch its outputs as DOM events.
3. **Register that class under a tag name.**

Only the middle one is hard, and you are not writing it: `@angular/elements` ships it. That is decision D3 in
[../foundation/decision-log.md](../foundation/decision-log.md) — hand-rolling the bridge means owning an
`ApplicationRef`, the attribute-to-input mapping and the output re-dispatch, which is a week of work to
re-derive a package that comes with the framework.

The same step deletes the app scaffolding the CLI generated. It has to be the same step: `src/main.ts` imports
from `src/app/`, so deleting that folder without rewriting `main.ts` leaves you with a project that does not
build.

## Before you start

Step 02 complete: the three `src/color-picker.*` files exist and `npm run build` exits 0.

## Do this

1. Replace the **entire contents** of `src/main.ts`. The CLI wrote a file there that bootstraps the generated
   demo app; none of it survives.

   ```ts
   import { createCustomElement } from '@angular/elements';
   import { createApplication } from '@angular/platform-browser';
   import { ColorPicker } from './color-picker';

   createApplication().then((app) => {
     const ColorPickerElement = createCustomElement(ColorPicker, { injector: app.injector });
     customElements.define('color-picker', ColorPickerElement);
   });
   ```

   `src/main.ts` is the build's entry point — the file named by the `browser` option in `angular.json`, and the
   only file the bundler starts from. Its path is **load-bearing**; do not rename it.

2. Read what each of those three calls does, because you will not meet them again.

   > **New concept — `createApplication()`.** Creates the Angular environment — the dependency-injection tree,
   > the change-detection scheduler — and bootstraps **no component**. It returns a `Promise<ApplicationRef>`,
   > which is why the registration sits inside `.then()`. Its sibling `bootstrapApplication()` is what a normal
   > app calls, and it is wrong here: it would render a component into the page the moment your script loads.
   > ([`createApplication`](https://angular.dev/api/platform-browser/createApplication))
   >
   > **New concept — injector.** The object Angular resolves dependencies from. `createCustomElement` needs one
   > so the component it wraps can be constructed with whatever services it asks for; `app.injector` is the
   > environment you just created. Pass a different injector and you get a component wired to a different
   > application.
   >
   > **New concept — custom element.** A tag name you register yourself, backed by a class. Once
   > `customElements.define` has run, **every** `<color-picker>` on the page is upgraded to an instance of that
   > class — including tags that were already in the HTML before your script loaded. The browser calls this
   > *upgrading*, and it is why the demo page in step 05 can write the tag above the `<script>` that defines it.
   > ([MDN: using custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements))
   >
   > **New concept — the custom-element registry.** `window.customElements` is a page-wide table of tag name to
   > class. A name may be registered **once** per page; a second `define` with the same name throws. That is
   > the one thing to know before you ship a self-registering bundle: loading it twice on the same page is an
   > error, not a no-op.

   `'color-picker'` is the most load-bearing string in this guide — it is the tag every host page writes. The
   hyphen is not style: the spec **requires** a dash in a custom element name, so that no future HTML element
   can ever collide with yours. `<colorpicker>` throws.

3. Delete the app scaffolding the CLI generated. Nothing imports it any more.

   ```bash
   rm -rf src/app
   ```

   ```powershell
   Remove-Item -Recurse -Force src/app
   ```

4. Build.

   ```bash
   npm run build
   ```

   Your component is now reachable from the entry point, so this is the first build whose output actually
   contains it.

## Done when (this step)

- [ ] `npm run build` exits **0** (bash: `echo $?` · PowerShell: `$LASTEXITCODE`).
- [ ] `ls src` contains `main.ts` and the three `color-picker.*` files, and **no `app` folder**. Whatever else
      `ng new` left in there — `index.html`, `styles.css` — is untouched and fine.
- [ ] The build's output is **smaller** than it was in step 02, not larger — and that is the expected
      direction. Your component reached the bundle for the first time, but the same step deleted `src/app`,
      and what left with it (the CLI's generated welcome page, plus the router `app.config.ts` pulled in)
      outweighs what arrived. The exact figures move with the patch version; the direction does not. There is
      still nothing to look at — step 05 builds the page.

## If it breaks

- **`Cannot find module '@angular/elements'`** → the install in step 01 action 3 ran in the wrong folder.
  Re-run `npm install @angular/elements@22` inside `color-picker/`.
- **`Cannot find module './app/app'` (or similar)** → you deleted `src/app` before replacing `main.ts`. Paste
  the file from action 1 and rebuild.
- **`Property 'injector' does not exist on type …`** → the `.then((app) => …)` wrapper is missing and you are
  reading `injector` off the `Promise` rather than the `ApplicationRef` it resolves to.

---
> Nav: [← Write the component](02_the-component.md) · [Overview](00_overview.md) · [Point the build where the demo can reach it →](04_the-build-output.md)
