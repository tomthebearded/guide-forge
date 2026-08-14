# Decision log

> The non-obvious choices and *why* they were made — so you learn the reasoning, not just the result.

### D1 — The component lives behind a native shadow root, and React renders into a mount node inside it

**Decision.** The custom-element class calls `attachShadow({ mode: 'open' })`, appends a plain `<div>` to the
shadow root, and passes **that div** to `createRoot`. Never `createRoot(shadowRoot)`.

**Why.** Two reasons, and they are different. The shadow root is there because the whole promise of this build
is "drop the tag on **any** site": a site you have never seen has a stylesheet you have never read, and
`input { width: 100% }` somewhere in it would otherwise reach inside your picker and break it. The mount
`<div>` is there because [`createRoot`](https://react.dev/reference/react-dom/client/createRoot) is documented
to accept *"A DOM element"*, and a `ShadowRoot` is a `DocumentFragment`, not an element. Passing one may work;
it is not what the API promises, and a teaching guide does not build its spine on an undocumented capability.

**What it costs.** The isolation cuts both ways: the host page cannot style the picker at all, which is why M5
exposes `::part()` names on purpose. A second cost is not fixed here — a `<color-picker>` inside a `<form>`
submits nothing, because it is not a form-associated element. That needs `ElementInternals`, which is out of
scope.

**Revisit if** you need the host page's fonts or theme tokens to cascade in unchanged.

### D2 — Build vs borrow: the React → custom-element bridge is written by hand

**Decision.** The guide writes its own `HTMLElement` subclass — shadow root, mount node, React root lifecycle,
`observedAttributes` → `attributeChangedCallback` → props, `get value()` / `set value()` accessors, and
`dispatchEvent` on the way out — instead of taking
[`@r2wc/react-to-web-component` 2.1.1](https://github.com/bitovi/react-to-web-component).

**Why.** This is the row where React parts company with the sibling Angular guide, and it is worth being
precise about it. There, the same capability was **borrowed** and it was not close: `@angular/elements` is an
in-house package versioned with the framework. React has no in-house equivalent, and the nearest thing is a
third-party 1.36 KB wrapper. So the same capability is incidental plumbing in one guide and the **spine** of
the other — and a capability named in the objective is built, not borrowed. The step that writes it carries
the rule-3.7 callout naming the library.

**Note on the library's own README.** It still says *"the latest version of this package only works with the
React 18"*. That line is stale: the published `package.json` for 2.1.1 declares
`"react": "^18.0.0 || ^19.0.0"`. It was verified on the manifest, not the prose, on 2026-08-14.

**What it costs.** Roughly sixty lines you then own and maintain, against a dependency that is already written
and tested.

**Revisit if** you stop wanting to teach the bridge — for a second component on the same stack, borrowing it is
the right call and costs you nothing you have not already learned here.

### D3 — Build vs borrow: the colour maths is written by hand

**Decision.** The guide writes exactly the sRGB conversions the picker needs — HSV→RGB, RGB→hex (including the
8-digit alpha form), hex→RGB, RGB→HSV and RGB→HSL — instead of taking
[`chroma-js` 3.2.0](https://www.npmjs.com/package/chroma-js) or
[`culori` 4.0.2](https://www.npmjs.com/package/culori).

**Why.** This is a deliberate exception to a standing rule. Colour spaces are a correctness-critical domain,
and the GuideForge contract says those default to **borrow** whatever the posture — *unless the domain is the
guide's subject*. Here it is: the audience model rates colour spaces and conversions a topic to teach from
zero, and a picker whose maths is one library call leaves M2 and M3 with nothing in them. The step that writes
the conversions carries the rule-3.7 callout naming the library it replaces.

**What it costs.** These functions are right for sRGB hex and wrong the day someone hands the picker
`oklch(70% 0.1 200)` or expects a wide-gamut display to round-trip. The picker is sRGB-only, and the glossary
says so.

**Revisit if** you need any of: wide-gamut output, CSS Color 4 parsing, perceptual spaces (Oklab/Oklch),
colour-difference or contrast maths. All four are the point at which a library stops being a shortcut and
starts being the correct answer.

### D4 — The styles are a TypeScript string, so the build emits no CSS file

**Decision.** The component's CSS lives in a template literal in `src/`, handed to a constructed
`CSSStyleSheet` and pushed onto `shadowRoot.adoptedStyleSheets`. No `.css` file, no `import './x.css'`, no
bundler CSS plugin.

**Why.** [Vite's library mode](https://vite.dev/guide/build) bundles imported CSS "as a single CSS file besides
the built JS files". A second file beside the bundle would mean the demo page needs a second `<link>`, and the
one-`<script>` promise — the thing M1 exists to prove — would be gone. Keeping the styles in JavaScript is what
makes the output a single file, and it is the exact counterpart of the Angular guide's "no polyfill bundle to
load". `adoptedStyleSheets` is Baseline widely available since 2023-03.

**What it costs.** No CSS tooling: no nesting via PostCSS, no autoprefixing, no editor CSS language support
inside the string. For one component's stylesheet that is a fair trade; for an application it would not be.

**Revisit if** the component grows past a screenful of CSS, or you need a preprocessor. At that point
`import styles from './picker.css?inline'` gives you the string back with tooling attached, at the cost of a
Vite-specific import suffix.

### D5 — Build vs borrow: pointer-drag tracking is written by hand

**Decision.** Press, follow, release and clamp are implemented directly on Pointer Events with
`setPointerCapture`, rather than with
[`@use-gesture/react` 10.3.1](https://use-gesture.netlify.app/).

**Why.** It is roughly fifteen lines, shared by all three rails, and it is half the lesson in M2 and M3:
turning a client coordinate into a 0–1 ratio *is* what a picker does. Borrowing here would also hide M2's own
gate — the milestone would prove a library works, not that you built a drag.

**Revisit if** you add multi-touch, inertia or pinch gestures — none of which this picker has.

### D6 — The gates are a browser, not a test runner

**Decision.** Every milestone's Done-when is watched by a person on the plain-HTML demo page. There is no
Vitest, no Playwright anywhere in this guide.

**Why.** It was the explicit choice at plan approval: the audience wants to see the thing work in the setting
it will actually be used in — a page that knows nothing about React — rather than in a harness.

**What it costs, and this is the honest part.** A gate a person has to perform is a gate that quietly stops
being performed, and there is no regression net at all: a change to the colour maths can silently break M2's
values and nothing will say so. Two mitigations are in force — every gate names an exact value, and every gate
names the environment it is watched in (see [conventions.md](conventions.md)), because a cached bundle makes
fixed code look broken and broken code look fixed.

**Revisit if** the picker ever leaves teaching use — and note that this stack makes that cheap. Vitest runs
inside the Vite config this guide already writes, and its browser mode could mount the real custom element and
read the exact values these gates name. That is a shorter route to machine-checkable gates than the sibling
Angular guide has.

### D7 — Build vs borrow: the picker component itself is built

**Decision.** The picker is written from scratch, not assembled from
[`react-colorful` 5.8.0](https://www.npmjs.com/package/react-colorful) — 3.1 KB, dependency-free, accessible,
peer dep `react >=16.8.0`, and by every measure the thing you would reach for at work.

**Why.** Borrowing it is the entire guide. This row is in the table because the contract says an existing
solution is *named*, never quietly ignored — not because it was a live choice.

**Revisit if** you need a picker in a product rather than a lesson. `react-colorful` is the answer, and it is
already keyboard-accessible, which this build is not.

### D8 — `dist/` only: no npm publish, no CDN, no registry

**Decision.** The build produces a self-registering bundle in `dist/color-picker/`, and the demo loads it with
a relative `<script src>`. Nothing is packaged or published.

**Why.** The constraint at plan approval. The bundle *is* the artifact you would publish, so this is a
deferred decision rather than a rework: adding a `package.json` `exports` map later changes nothing about the
component.

### D9 — Accepted risks (recorded at plan approval)

The plan's advise-back was delivered and answered with "continue", so **no suggested feature was folded in**
and **every risk below was accepted as stated**. Both are assumptions, not confirmations, and they are
recorded here because that is where an assumption has to live to survive the session it was made in.

- **The hand-written bridge is ~60 lines you then own.** See D2.
- **React ships inside the bundle.** A React custom element carries `react` + `react-dom`; a plain-JS picker
  would be a fraction of the bytes. Accepted as the cost of the brief — but the guide says it once, plainly,
  rather than letting you discover it from `dist/`.
- **`StrictMode` double-invokes effects**, which would make M4's "one `change` event" gate read two. Mitigated
  by keeping `StrictMode` out of the element bundle entirely (see [conventions.md](conventions.md)).
- **TypeScript 7.0 is GA while the scaffold pins TypeScript 6.** Typing `npm i -D typescript@latest` mid-guide
  swaps compilers underneath you. The guide pins and says so once.
- **Vite 8 is a bundler rewrite (Rolldown, 2026-03), and library mode is where a regression would show.** As a
  repo fixture this guide stays pinned regardless: a fixture that drifts stops being a fixture.
- **No test suite.** See D6.
- **Hand-rolled colour maths in a correctness-critical domain.** See D3.
- **Shadow DOM removes form participation.** See D1.
- **The element supports being added and removed, not relocated.** Moving the tag to a different parent fires
  `disconnectedCallback` then `connectedCallback`, and React refuses a container that has already hosted a
  root. Supporting a move would need a fresh mount node per reconnect — machinery no host page in this guide
  exercises. Named in M1 step 03 rather than left to be discovered. **Revisit if** the component ever ships
  somewhere a framework re-parents DOM nodes.
- **No keyboard access or ARIA.** The picker is drag-only: nothing is focusable, arrow keys do nothing, a
  screen reader announces nothing. This is the one exclusion that would be a defect in real use, and it was
  recorded as such when the plan was approved. A sixth milestone would close it.
