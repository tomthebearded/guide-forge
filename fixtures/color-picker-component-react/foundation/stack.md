# Verified stack

> Every version below was checked online on **2026-08-14** and carries an official link. Every step in this
> guide builds against these exact versions — if a command or a code block anywhere disagrees with this table,
> this table wins and the step is a defect.

| Tool / library | Pinned | Latest stable (2026-08-14) | Official docs | Notes |
|---|---|---|---|---|
| React / `react-dom` | **19.2.x** — exact patch resolved at install time | `create-vite`'s `react-ts` template pins `^19.2.8`; [react.dev/versions](https://react.dev/versions) lists up to **19.2.7** (2026-06-01) | [React versions](https://react.dev/versions) · [`createRoot`](https://react.dev/reference/react-dom/client/createRoot) | No React 20 announced. The two sources disagree by one patch, which is why the pin is `19.2.x` and not a number |
| Vite | **8.2.x** | **8.2.1** — patches on `8.2`, backports to `7.3` and `8.1` | [releases](https://vite.dev/releases) · [build & library mode](https://vite.dev/guide/build) · [build options](https://vite.dev/config/build-options) · [`define`](https://vite.dev/config/shared-options#define) | Vite 8 (2026-03) replaced esbuild + Rollup with **Rolldown**, one Rust bundler for dev and build. **Library mode does not substitute `process.env.NODE_ENV`** — it leaves it for the consuming bundler, so a bundle loaded by a plain HTML page throws `ReferenceError: process is not defined`. M1/05 sets it with `define` |
| TypeScript | **~6.0.2** — installed by the scaffold | **7.0** is GA (native Go compiler) | [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) | Pinned by the template; this guide never chooses it and never upgrades it mid-way |
| Node.js | **24** — Active LTS | 24 Active LTS · 26 Current · 22 Maintenance | [previous releases](https://nodejs.org/en/about/previous-releases) | Vite states its floor as **"Node.js version 20.19+, 22.12+"** ([guide](https://vite.dev/guide/)) |
| Scaffold | `npm create vite@latest color-picker -- --template react-ts` | — | [Vite guide](https://vite.dev/guide/) | The current template also pins `@vitejs/plugin-react ^6.0.5`, `@types/node ^24.13.3` and **`oxlint`**, not ESLint |
| Custom elements | native — `customElements.define`, `attachShadow`, `observedAttributes` | — | [MDN: using custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements) | No library. The bridge is this guide's spine and is written by hand (D2) |
| Style delivery into the shadow root | `CSSStyleSheet` + `adoptedStyleSheets` | Baseline **widely available** since 2023-03 | [MDN `adoptedStyleSheets`](https://developer.mozilla.org/en-US/docs/Web/API/Document/adoptedStyleSheets) | Constructed sheets are adoptable by a `ShadowRoot`; only sheets constructed in the same `Document` may be adopted, else `NotAllowedError` |
| `::part()` theming surface | native CSS | Baseline **widely available** since 2020-07 | [MDN `::part()`](https://developer.mozilla.org/en-US/docs/Web/CSS/::part) | Parts are visible to the **direct** parent DOM only; `::part(a)::part(b)` is invalid |
| Pointer capture | native — `setPointerCapture` | — | [MDN `setPointerCapture`](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture) | Roughly fifteen lines, reused by all three rails (D5) |
| Static file server for the demo | `npx http-server` | *version UNVERIFIED — deliberately unpinned* | — | Any static server works. It is **required**: an ES-module bundle cannot be loaded from a `file://` page |
| **Target OS / shell(s)** | **Windows + PowerShell** (the author's) **and** bash | — | — | Every command in every step and gate must run on **both**. Where they differ — deleting a folder, reading an exit code, writing a path — the step gives both variants |
| Browser | any current Chromium, Firefox or Safari | — | — | Every gate is read in DevTools, so the reader needs one that has them |
| Colour conversion | **none — written by hand** | [`chroma-js` 3.2.0](https://www.npmjs.com/package/chroma-js) · [`culori` 4.0.2](https://www.npmjs.com/package/culori) are the verified alternatives | — | A deliberate build decision (D3), not an absence of options |

## Five facts this guide is built on

Each was verified on the exact name, not on its family.

1. **`createRoot` is documented to take "A DOM element" — a `ShadowRoot` is not one.** The bridge attaches the
   shadow root, appends a plain mount `<div>` inside it, and passes **that** to `createRoot`. No step writes
   `createRoot(shadowRoot)`: it is undocumented on the API page, so this guide does not depend on it.
2. **Since React 17, React attaches its event listeners to the root container, not to `document`.** That is why
   pointer events work inside a shadow root with no retargeting shim. The widely-copied "events don't reach
   React in shadow DOM" advice is React 16-era and does not apply here — but what is *verified* is only where
   listeners attach; M2's drag gate is what proves the rest end to end.
3. **Vite library mode emits a separate CSS file only if the library imports CSS.** This guide keeps its styles
   as a TypeScript template string handed to a constructed `CSSStyleSheet`, imports no `.css` at all, and so
   `dist/` holds exactly one `.js` and no `.css`. That is what makes one `<script>` tag enough, and M1's gate
   checks it.
4. **React only hoists a `<style>` to `document.head` when given both `href` and `precedence`.** Without them it
   renders in place. This guide never renders a React `<style>` at all — but the condition matters, because a
   hoisted style escapes the shadow root and silently un-encapsulates the component.
5. **The demo must be served over HTTP.** Double-clicking `demo/index.html` gives a `file://` page, and the
   browser refuses to load an ES module from it. This is the most likely first-run failure in the whole guide,
   which is why M1 gives it a step rather than a footnote.

## One fact deliberately left unverified

Whether Vite's library mode bundles or externalises `react` and `react-dom` by default is **not stated on the
build-options page**, so it is not recorded above as fact. M1's gate proves it empirically instead: the demo
page loads one script, declares no React of its own, and the picker renders. If it does not, the fix is
`rollupOptions.external` — and that is a troubleshooting entry, not a stack claim.
