# Verified stack

> Every version below was checked online on **2026-08-14** and carries an official link. Every step in this
> guide builds against these exact versions — if a command or a code block anywhere disagrees with this table,
> this table wins and the step is a defect.

| Tool / library | Pinned | Latest stable (2026-08-14) | Official docs | Notes |
|---|---|---|---|---|
| Angular | **22.x** — exact patch resolved at `ng new` time | v22 released **2026-06-03**; active support to 2027-06, LTS to **2028-06** | [releases & support](https://angular.dev/reference/releases) | From v22 Angular is on a **12-month** major cadence (it was 6) |
| `@angular/elements` | **22.x** — versioned with Angular | same | [custom elements guide](https://angular.dev/guide/elements) · [`createCustomElement`](https://angular.dev/api/elements/createCustomElement) | The whole bridge: `createCustomElement(Component, {injector})` returns a class for `customElements.define` |
| `@angular/platform-browser` → `createApplication` | **22.x** | same | [`createApplication`](https://angular.dev/api/platform-browser/createApplication) | Stable. `createApplication(options?) => Promise<ApplicationRef>` — creates the Angular environment **without** rendering a component, which is exactly what an element bundle needs |
| Node.js | **24 (Krypton)** — Active LTS | 24 Active LTS · 26 Current · 22 Maintenance | [previous releases](https://nodejs.org/en/about/previous-releases) | Angular 22 accepts `^22.22.3 \|\| ^24.15.0 \|\| ^26.0.0` |
| TypeScript | **>=6.0.0 <6.1.0** — installed by `ng new` | same | [version compatibility](https://angular.dev/reference/versions) | Pinned by Angular 22; this guide never chooses it |
| Angular CLI / `@angular/build:application` | **22.x** | same | [`ng build`](https://angular.dev/cli/build) · [workspace config](https://angular.dev/reference/configs/workspace-config) | `outputHashing` takes `all \| bundles \| media \| none`; `outputPath` takes a **string or an object** `{base, browser, server, media}` where `browser` defaults to `"browser"` |
| Change detection | **zoneless** (the v21+ default) | same | [zoneless guide](https://angular.dev/guide/zoneless) | "Zoneless is the default in Angular v21+ so you do not need to do anything to enable it." No `zone.js` in `polyfills` — which is why the bundle has no polyfill file to load |
| Style encapsulation | **`ViewEncapsulation.ShadowDom`** | same | [`ViewEncapsulation`](https://angular.dev/api/core/ViewEncapsulation) | Native `attachShadow`. v22 also ships `ExperimentalIsolatedShadowDom` (blocks inherited and external styles too) — **not used here**: it is marked experimental |
| `::part()` theming surface | native CSS | Baseline **widely available** since 2020-07 | [MDN `::part()`](https://developer.mozilla.org/en-US/docs/Web/CSS/::part) | Parts are visible to the **direct** parent DOM only; `::part(a)::part(b)` is invalid |
| Static file server for the demo | `npx http-server` | *version UNVERIFIED — deliberately unpinned* | — | Any static server works. It is **required**: an ES-module bundle cannot be loaded from a `file://` page |
| **Target OS / shell(s)** | **Windows + PowerShell** (the author's) **and** bash | — | — | Every command in every step and gate must run on **both**. Where they differ — deleting a folder, reading an exit code — the step gives both variants |
| Browser | any current Chromium, Firefox or Safari | — | [Angular browser support](https://angular.dev/reference/versions) | Angular 22 uses the "widely available" Baseline, dated 2026-05-07. Every gate is read in DevTools, so the reader needs one that has them |
| Colour conversion | **none — written by hand** | [`chroma-js` 3.2.0](https://www.npmjs.com/package/chroma-js) · [`culori` 4.0.2](https://github.com/Evercoder/culori/releases) are the verified alternatives | — | A deliberate build decision (D2), not an absence of options |

## Five facts this guide is built on

Each was verified on the exact name, not on its family.

1. **Zoneless is the default.** Do **not** add `provideZonelessChangeDetection()` — the docs scope that to v20
   users — and do not add `zone.js` to `polyfills`. A v22 element build with no lazy routes therefore has no
   polyfill bundle to load, which is what makes one `<script>` tag enough.
2. **Inputs become dash-case attributes; outputs become `CustomEvent`s.** An input aliased `myInputProp` is
   set from the `my-input-prop` attribute; an output aliased `myClick` dispatches an event named `myClick`
   with its payload on `event.detail`.
3. **Nothing reflects back.** Angular maps attribute → property. Writing the current value **out** to the host
   attribute is this guide's own code (M4), not a framework behaviour.
4. **`outputPath` is an object when you want to lose the `browser/` subfolder.**
   `{"base": "dist/color-picker", "browser": ""}` puts the bundle where the demo's `<script src>` expects it.
5. **The demo must be served over HTTP.** Double-clicking `demo/index.html` gives a `file://` page, and the
   browser refuses to load an ES module from it. This is the most likely first-run failure in the whole guide,
   which is why M1 gives it a step rather than a footnote.
