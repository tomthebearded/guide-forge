# PLAN — A React colour picker that ships as a plain HTML tag

> The plan this guide is drafted from. Produced by GuideForge `plan-guide`. **Not the guide itself** — the
> ladder below is what the drafting pass expands into step files. Approve it before anything is drafted:
> fixing a rung costs minutes, re-drafting off a wrong rung costs the guide.

---

## 1. Brief & audience model

**The build.** A colour picker written as a React component and shipped as a **custom element** — a real HTML
tag. A site that has never heard of React drops one `<script>` on the page, writes
`<color-picker value="#3366ff">`, and gets a working picker: a saturation/value area, a hue rail, an alpha
rail, preset swatches, a switchable hex/rgb/hsl readout, and `input`/`change` events carrying the value.

**Observable end state.** A static `demo/index.html` — plain HTML, no framework, no bundler — served over
HTTP, showing the picker; dragging it updates a live readout and logs events; the host page restyles the
picker through `::part()` without touching its source.

**Where the facts came from.** Q1–Q3 and Q5–Q8 came from the Phase 0 interview. Q4 (the stack) was seeded
from the sibling fixture [`color-picker-component-angular/`](../color-picker-component-angular/PLAN.md),
which fixes the *product* — the same picker, the same end state, the same gates — and then re-verified from
scratch online, because the stack is the one thing a sibling guide cannot lend.

| # | Question | Answer |
|---|----------|--------|
| 1 | Per-topic expertise | See the matrix below |
| 2 | Granularity | **Standard** (default atomic step size) |
| 3 | Target end state | The plain-HTML demo page above, driven by hand in a browser |
| 4 | Stack | React 19 + Vite 8 + TypeScript — see §2 (verified online 2026-08-14) |
| 5 | Out of scope | Nothing excluded by name; the ladder holds the perimeter in Q3 and everything else lands in the advise-back list below |
| 6 | Hard constraints | Local `dist/` only — no npm publish, no CDN, no registry. Shadow DOM required. Author's shell is Windows PowerShell; every command must also run on bash |
| 7 | Size & writing language | 5 milestones, three sittings. Prose in **English** |
| 8 | Build-vs-borrow posture | **Balanced** — build what the guide set out to teach, borrow the plumbing. §2.5 puts every actual candidate to you one by one |

**Per-topic expertise matrix** — the single most important input, and the one that decides how long the guide
is:

| Topic | Level | Explanation depth the guide must use |
|-------|-------|--------------------------------------|
| Modern React — function components, `useState`/`useRef`/`useEffect`, `createRoot`, the render model | **New** | Define + doc link + short deep-dive callout + extra failure notes |
| Web Components — `customElements.define`, shadow DOM, attributes vs properties, `CustomEvent`, `observedAttributes` | **New** | Same as above — this is the guide's spine, taught from zero |
| Colour & input UI — HSV/HSL/RGB spaces, conversions, pointer-drag interaction | **New** | Same as above |
| JavaScript & TypeScript themselves — the language, its built-in methods, its type syntax | **Beginner** | Define on first use + a brief why. In practice: a built-in that does real work in a code block (`Math.round`, `padStart`, `parseInt`, `getBoundingClientRect`) gets an **inline comment on its line** — never a glossary entry, which holds words, not functions |
| Build tooling & distribution — bundlers, Vite config, npm mechanics, versioning | **Expert** | Name it, no definitions. No explaining what a bundle is, what `dist/` means, or why hashing exists |

> **Over-explaining an Expert topic is a defect, exactly as harmful as under-explaining a New one.** With this
> matrix, a step that explains what Rolldown does has failed; a step that writes `createRoot(mountNode)`
> without saying what a root *is* and who owns it has also failed.

### Assumptions recorded at the gate

The advise-back below was delivered and answered with **"continue"**. Two things are therefore assumed
explicitly rather than confirmed, and both are logged in `decision-log.md`:

- **No suggested feature was folded in.** The ladder stays at five milestones, mirroring the Angular fixture.
  Keyboard accessibility, form association, EyeDropper, automated tests and the React-consumes-the-element
  demo are all *declined for this guide*, not forgotten.
- **Every risk below is accepted as stated.** Each carries its mitigation in the writing contract (§6), which
  is where an accepted risk has to land if it is to survive drafting.

### Advise-back — suggestions and risks (Phase 0 gate)

**Capabilities commonly paired with this build, deliberately *not* in the ladder.**

- **Keyboard accessibility + ARIA.** The strongest candidate, exactly as in the Angular guide. This picker is
  drag-only: arrow keys do nothing, nothing is focusable, a screen reader announces nothing. Two `role`
  attributes and arrow-key handlers on the rails would close most of it. Recommended as a **sixth milestone**
  if the component ever has to be defensible in real use.
- **Automated tests — and here React is better placed than Angular was.** Vitest runs inside the Vite config
  the guide already has, and its browser mode could mount the real custom element and read the exact values
  the gates name. The Angular fixture could not afford that; this one could. Declined for this guide, but it
  is the cheapest route any GuideForge fixture has to a machine-checkable gate.
- **Form association (`ElementInternals` + `formAssociated`).** Makes `<color-picker name="brand">` submit
  inside a `<form>` like a native input. One step, and it is the difference between "a widget" and "a form
  control".
- **The EyeDropper API.** Pick a colour from anywhere on screen. Cheap, but browser support is uneven and it
  would need a capability check — a real teaching opportunity about progressive enhancement.
- **The element consumed back inside React.** React 19 passes the full Custom Elements Everywhere suite, so a
  second demo page using `<color-picker>` from a React app would close a circle the Angular guide cannot. Out
  of scope; the M4 contract is what would make it work.

**Long-run risks of these choices — all accepted.**

- **The hand-written bridge is ~60 lines the reader then owns**, against 1.36 KB gzipped of a verified,
  React-19-compatible library (§2.5, row 1). That is the accepted cost of the brief — the bridge *is* the
  lesson — but it gets said once, plainly, in a rule-3.7 callout naming the library and the swap condition.
- **React ships inside the bundle.** A React custom element carries `react` + `react-dom`; a plain-JS picker
  would be a fraction of the bytes. Same shape as the Angular guide's framework tax, different surface. The
  README says it once rather than letting the reader discover it from `dist/`.
- **StrictMode double-invokes effects, and rule 6.2 names that failure class by name.** A bridge that
  registers listeners or dispatches events from an effect fires them twice in development, so a gate reading
  "the log prints one `change`" reads two — correct code looking broken. Mitigation in §6: the element bundle
  contains no `StrictMode`, and every gate declares which environment it is watched in.
- **TypeScript 7.0 is GA while the scaffold pins TypeScript 6.** A reader who types `npm i -D
  typescript@latest` mid-guide swaps compilers underneath themselves. The guide pins and says so once.
- **Vite 8 is a bundler rewrite (Rolldown, March 2026), and library mode is where a regression would show.**
  As a repo fixture this guide stays **pinned** regardless: a fixture that drifts stops being a fixture.
- **No test suite means no regression net, and no machine-checkable guide.** Every gate here is a human
  looking at a browser. A future change to the colour maths can silently break M2's exact values and nothing
  will say so. Mitigation, and it is the reason §6 is strict: **every gate names exact values**, never "the
  colour looks right".
- **Hand-rolled colour maths is a correctness-critical hand-roll.** See §2.5 — the one row where the
  recommendation goes against the contract's usual default, on purpose, because the conversions are what you
  asked to be taught. The failure mode is not "it's wrong", it is "it's right for sRGB hex, and wrong the day
  someone pastes `oklch(70% 0.1 200)`". Mitigation: a rule-3.7 callout naming `chroma-js`, and a scope line in
  the glossary saying the picker is sRGB-only.
- **Shadow DOM buys isolation and costs reach.** The host page cannot style the picker except through the
  surface deliberately exposed, and a picker inside a `<form>` submits nothing. M5's `::part()` work answers
  the first; the second stays open (see form association above).

---

## 2. Verified stack

Checked online **2026-08-14**. Every version claim below carries a link; anything unverified is marked.

| Tool / library | Pinned | Latest stable (2026-08-14) | Official docs | Notes |
|---|---|---|---|---|
| React / `react-dom` | **19.2.x** — exact patch resolved at install time | `create-vite`'s `react-ts` template pins `^19.2.8`; [react.dev/versions](https://react.dev/versions) lists up to **19.2.7** (2026-06-01) | [React versions](https://react.dev/versions) · [`createRoot`](https://react.dev/reference/react-dom/client/createRoot) | No React 20 announced. The two sources disagree by one patch, which is why the pin is `19.2.x` and not a number |
| Vite | **8.2.x** | **8.2.1** — patches on `8.2`, backports to `7.3`/`8.1` | [releases](https://vite.dev/releases) · [build & library mode](https://vite.dev/guide/build) · [build options](https://vite.dev/config/build-options) | Vite 8 (2026-03) replaced esbuild+Rollup with **Rolldown**, one Rust bundler for dev and build |
| TypeScript | **~6.0.2** — installed by the scaffold | **7.0** is GA (native Go compiler) | [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) | Pinned by the template; the guide never chooses it and never upgrades it mid-way |
| Node.js | **24 (Active LTS)** | 24 Active LTS · 26 Current · 22 Maintenance | [previous releases](https://nodejs.org/en/about/previous-releases) | Vite states its floor as **"Node.js version 20.19+, 22.12+"** ([guide](https://vite.dev/guide/)) |
| Scaffold | `npm create vite@latest color-picker -- --template react-ts` | — | [Vite guide](https://vite.dev/guide/) | The current template also pins `@vitejs/plugin-react ^6.0.5`, `@types/node ^24.13.3` and **`oxlint`**, not ESLint |
| Custom elements | native — `customElements.define`, `attachShadow`, `observedAttributes` | — | [MDN: using custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements) | No library. This is the guide's spine, written by hand (§2.5 row 1) |
| Style delivery into the shadow root | `CSSStyleSheet` + `adoptedStyleSheets` | Baseline **widely available** since 2023-03 | [MDN `adoptedStyleSheets`](https://developer.mozilla.org/en-US/docs/Web/API/Document/adoptedStyleSheets) | Constructed sheets are adoptable by a `ShadowRoot`; only sheets constructed in the same `Document` may be adopted (else `NotAllowedError`) |
| `::part()` theming surface | native CSS | Baseline **widely available** since 2020-07 | [MDN `::part()`](https://developer.mozilla.org/en-US/docs/Web/CSS/::part) | Parts are visible to the **direct** parent DOM only; `::part(a)::part(b)` is invalid |
| Pointer capture | native — `setPointerCapture` | — | [MDN `setPointerCapture`](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture) | ~15 lines, reused by all three rails (§2.5 row 4) |
| Static file server for the demo | `npx http-server` | *version UNVERIFIED — deliberately unpinned* | — | Any static server works. It is **required**: an ES-module bundle cannot be loaded from a `file://` page |
| Colour conversion | **none — written by hand** | see §2.5 for the verified alternatives | — | A deliberate build decision, not an absence of options |

**Five facts the drafting pass must not get wrong** (each verified on the exact name, not on its family):

1. **`createRoot` is documented to take "A DOM element" — a `ShadowRoot` is not one.** The bridge attaches the
   shadow root, appends a plain mount `<div>` inside it, and passes **that** to `createRoot`. No step may write
   `createRoot(shadowRoot)`: it is undocumented on the API page, so the guide does not depend on it.
2. **Since React 17, React attaches its event listeners to the root container, not to `document`.** That is why
   pointer events work inside a shadow root with no retargeting shim. The widely-copied "events don't reach
   React in shadow DOM" advice is React 16-era and the guide must not repeat it — but it also must not claim
   more than the docs grant: what is verified is *where listeners attach*, and the M2 drag gate is what proves
   it end to end.
3. **Vite library mode emits a separate CSS file only if the library imports CSS.** The guide keeps its styles
   as a TypeScript template string handed to a constructed `CSSStyleSheet`, imports no `.css` at all, and so
   `dist/` holds exactly one `.js` and no `.css`. That is what makes one `<script>` tag enough — the exact
   counterpart of the Angular guide's "no polyfill bundle" fact, and M1's gate checks it.
4. **React only hoists a `<style>` to `document.head` when given both `href` and `precedence`.** Without them it
   renders in place. The guide never renders a React `<style>` at all — styles go in through
   `adoptedStyleSheets` — but a drafter who reaches for one must know the condition, because a hoisted style
   escapes the shadow root and silently un-encapsulates the component.
5. **The demo must be served over HTTP.** Double-clicking `demo/index.html` gives a `file://` page, and the
   browser refuses to load an ES module from it. This is the single most likely first-run failure and it gets
   its own step in M1, not a footnote.

**One fact deliberately left unverified.** Whether Vite's library mode bundles or externalises `react` and
`react-dom` by default is **not stated on the build-options page**, so it is not recorded here as fact. M1's
gate proves it empirically instead: the demo page loads one script, declares no React of its own, and the
picker renders. If it does not, the fix is `rollupOptions.external` — and that is a troubleshooting entry, not
a stack claim.

---

## 2.5 Build vs borrow

Every self-contained capability the ladder would otherwise hand-write, and the verified off-the-shelf
alternative. The ladder below is cut on the **Recommended** column — flipping a row before approval re-cuts
that milestone, which is cheap now and expensive after drafting.

| Capability | Where | Verified off-the-shelf option | What borrowing costs | What building teaches | Recommended | Your call |
|---|---|---|---|---|---|---|
| **The React → custom-element bridge** — shadow root, mount node, React root lifecycle, attributes→props, property accessors, events out | M1, M4 | [`@r2wc/react-to-web-component` 2.1.1](https://github.com/bitovi/react-to-web-component) — peer deps verified as `react: "^18.0.0 \|\| ^19.0.0"` from the published `package.json` | The guide's spine becomes a black box: M1 collapses to install-wrap-register and M4 loses its two best steps | Exactly what a framework's element bridge does for you — `attachShadow`, a React root you own and unmount, `observedAttributes` → `attributeChangedCallback`, property accessors on the class, and `dispatchEvent` for the way out | **build** | |
| **sRGB colour conversion** — HSV→RGB, RGB→hex (incl. 8-digit alpha), hex→RGB, RGB→HSV, RGB→HSL | M2, M3, M4, M5 | [`chroma-js` 3.2.0](https://www.npmjs.com/package/chroma-js) (last publish ~Dec 2025) · [`culori` 4.0.2](https://www.npmjs.com/package/culori) (2025-06-27) | A dependency in a bundle whose whole selling point is being one file; an API to learn on top of the maths | The actual model behind every colour picker ever: hue as an angle, saturation and value as the two axes of the square, and why the square looks different at every hue | **build** *(scoped — see below)* | |
| **The picker component itself** | all | [`react-colorful` 5.8.0](https://www.npmjs.com/package/react-colorful) — 3.1 KB, dependency-free, peer deps `react >=16.8.0`, last publish ~2026-07 | The entire guide | Everything | **build** — forced | |
| **Pointer-drag tracking** — press, follow outside the element, release, clamp to bounds | M2, M3 | [`@use-gesture/react` 10.3.1](https://use-gesture.netlify.app/) — peer dep `react >= 16.8.0`; *release freshness UNVERIFIED on this date* | A gesture library to drag a handle, and M2's gate stops proving anything the reader wrote | `setPointerCapture` and normalising a client coordinate into a 0–1 position: ~15 lines, reused by all three rails | **build** | |

**The row that deserves an argument.** The pedagogy contract says correctness-critical domains — colour spaces
among them, by name — default to **borrow** whatever the posture, *unless that domain is the guide's subject.
Here it is the subject*: you rated colour spaces a **New** topic to be taught from zero, and a picker whose
maths is `chroma.hsv(h,s,v).hex()` leaves M2 and M3 with no lesson in them. So the recommendation is build —
**scoped**: the guide writes exactly the four sRGB conversions it needs, and the step that writes them carries
the rule-3.7 callout naming `chroma-js` and the condition to swap it in (any wide-gamut, CSS Color 4, or
perceptual-space requirement). Flip this row and M2 loses one step, M3 is unchanged, M5's format switch
collapses to two lines.

**The row that differs most from the Angular fixture.** There, the bridge was **borrow** and it was not close:
`@angular/elements` is an in-house package versioned with the framework, and re-deriving it is a week of work.
React has no in-house equivalent, and the nearest thing — `@r2wc/react-to-web-component` — is a third-party
1.36 KB wrapper. That inverts the recommendation: the same capability is plumbing in one guide and the spine
of the other. Flip this row and M1 drops to three steps and M4 loses steps 03 and 04; what remains is a guide
about colour maths that happens to ship as a tag.

Every row lands in `foundation/decision-log.md` with its *why* and its revisit-if.

---

## 3. Foundation docs

| Doc | What it owns |
|---|---|
| `README.md` | Front door: objective, one-line stack summary, headline decisions, Updates log, "following this guide" note |
| `foundation/stack.md` | The §2 table verbatim — every step builds against these versions |
| `foundation/conventions.md` | File layout, naming, the canonical demo colour (§6), `Writing language: English`, the "gates are the demo page" rule |
| `foundation/glossary.md` | `### heading` per term: custom element, shadow DOM, shadow root, mount node, attribute vs property, `CustomEvent`, React root, function component, state, effect, StrictMode, HSV, hue, saturation, value, alpha, sRGB, pointer capture, constructed stylesheet, CSS part |
| `foundation/status.md` | Single source of truth for what is actually verified. **No milestone is ✅ until its gate has been watched in a browser** |
| `foundation/progress.md` | What the reader has executed, step by step — the ledger `amend-guide` reads |
| `foundation/decision-log.md` | D1 shadow DOM, and a mount `<div>` inside it rather than `createRoot(shadowRoot)` · D2 bridge built, not borrowed · D3 colour maths built, not borrowed · D4 styles as a constructed stylesheet, so no CSS file is emitted · D5 pointer-drag built, not borrowed · D6 the gates are a browser, not a test runner · D7 the picker itself built (forced) · D8 `dist/` only, no publish · D9 the accepted risks from §1. *(Corrected at scaffold time: this row originally guessed seven entries, but §2.5 has four rows and each is owed one — see the drift log in `foundation/status.md`.)* |
| `feedback-log.md` | Seeded empty by `scaffold-guide` |

---

## 4. Milestone ladder

Every gate is the plain-HTML demo page, open in a browser, served over HTTP. Every rung depends only on rungs
below it.

| # | Milestone | Proves (end state) | Depends on | Done-when (one line) |
|---|-----------|--------------------|------------|----------------------|
| **M1** | The tag on a page | The whole distribution path works before any colour logic exists | — | The demo page shows the component; `document.querySelector('color-picker').shadowRoot !== null` prints `true`; the page's own `.panel { background: #00ff00 }` does not reach inside it; and `dist/color-picker/` holds `color-picker.js` and **no `.css`** *(drafting correction: the gate originally probed with `* { border: … }`, which also matches the `<color-picker>` host element in the light DOM and would therefore prove nothing about the boundary — see M1's verify)* |
| **M2** | The hue rail | A pointer drag becomes a colour | M1 | Dragging the rail sweeps red→yellow→green→cyan→blue→magenta; dragging **past** either edge pins the handle and reads exactly `#ff0000`; across the middle third the readout begins `#00` |
| **M3** | **The saturation/value area** *(reality-check gate)* | The thing is a colour picker | M2 | At hue 0: top-right → `#ff0000`, top-left → `#ffffff`, anywhere along the bottom edge → `#000000` |
| **M4** | The host-page contract | A page that knows nothing about React can drive it and be driven by it | M3 | `<color-picker value="#3366ff">` renders that colour on load; dragging rewrites the `value` attribute live in the Elements panel; the log prints `input` while dragging and **one** `change` on release, each with `detail` `{"value":"#..."}`; `el.value = '#00ff00'` from the console moves the UI; a preset swatch does both |
| **M5** | Alpha, formats & theming | The public surface is complete and the host site can restyle it | M4 | With the tag at `value="#3366ff80"` the readout is `#3366ff80` / `rgba(51, 102, 255, 0.5)` / `hsla(225, 100%, 60%, 0.5)` as the format switch moves; `format="rgb"` on the tag picks the initial mode; the host page's `color-picker::part(panel) { border-radius: 0 }` squares the corners without touching the component *(drafting correction: the original gate asked the reader to drag the alpha rail to exactly 0.5, which is one position on a 240-pixel track and unhittable by hand — the alpha now arrives from the attribute, and the rail is gated at its clamped ends)* |

**Reality-check gate: end of M3.** That is the first point where the thing is genuinely a colour picker. Stop,
use it, and decide the design holds before building the public API on top of it.

**Sittings.** M1–M2 is one sitting (toolchain, bridge, first interaction). M3 is its own. M4–M5 is the third,
and the longest.

**Where this ladder is not the Angular one.** M1 is the widest divergence: Angular's M1 registers a bridge it
imports, this one writes it, so the rung carries roughly two extra steps. M4 gains a step for the same reason
— Angular Elements generates property accessors from a component's inputs, and here the class defines its own
`get value()` / `set value()`, which is also where the attribute-vs-property lesson finally lands. M2, M3 and
M5 are step-for-step equivalent, because from the React root inwards the two guides are solving the same
problem.

**Deferrals, written inline and once** — never as a standing "what this milestone does not do" section: M2's
value is hue-only and M2 says so on the line that computes it, pointing at M3; M4's preset list is hard-coded
and M4 says so where it is written.

---

## 5. Templates

The guide uses the canonical GuideForge layout unchanged: `NN_<slug>.md` step files with the nav line at top
and bottom, `00_overview.md` as a one-screen map per milestone, `NN_verify.md` carrying the milestone's single
Done-when gate, the file checkpoint, troubleshooting and the cumulative handoff. Step sections:
`## Glossary for this step` (index only) · `## Why / design` · `## Do this` (code interleaved under each
numbered action) · `## Done when (this step)` · `## If it breaks`.

Step counts **as drafted, after the first fix pass**: M1 6, M2 4, M3 3, M4 6, M5 4 — **23 steps plus 5 verify
files**. Every place this differs from the cut the plan first proposed is recorded in the drift log in
`foundation/status.md`; all of the differences have one cause, which is rule 4.4 meeting a TypeScript config
that treats an unused declaration as an error.

- **M1** — 01 create the workspace · 02 the panel component · 03 the custom element (shadow root, mount node,
  React root **and** the registration) · 04 the styles, as a constructed stylesheet · 05 the library build ·
  06 the demo page, served over HTTP. *(The plan proposed the class and the `customElements.define` call as
  two steps; an unregistered class leaves its step with nothing observable to gate on, so they are one.)*
- **M2** — 01 the colour model · 02 hex output · 03 draw the hue rail · 04 make the rail draggable.
- **M3** — 01 draw the square · 02 saturation and value from a position · 03 the square handle.
- **M4** — 01 read a colour in · 02 the `value` attribute · 03 the `value` property · 04 reflect the value out
  · 05 `input` and `change` events · 06 preset swatches.
- **M5** — 01 alpha in the colour model (the field, the parser, the formatter and every call site they break)
  · 02 the alpha rail · 03 rgb, hsl and the format switch · 04 the `::part()` theming surface. *(The plan
  proposed the rail first and the byte second; adding a required field to `HsvColor` cannot be split across
  two steps and still end green, so the whole model change is step 01. The conversions and the switch that
  calls them are one step for the same reason: a formatter with no caller does not compile.)*

---

## 6. Writing contract & verification design

The full pedagogy contract applies (P1–P7). Six points need deciding **here**, not at drafting time:

- **Rule 6.2 — the browser is an environment that lies, and this guide's every gate is watched in one.** Four
  specific masks, each designed against rather than discovered in the field. **(a)** A cached bundle — the
  build pins no output hashing, so the filename never changes and the browser will happily serve yesterday's
  code; every gate is therefore watched after a **hard reload**, the demo server runs with caching off
  (`npx http-server dist/color-picker -c-1`), and M1 teaches this as a step, not a troubleshooting note.
  **(b)** `file://` — an ES module will not load from it, so "nothing renders and the console says the module
  was blocked" is a *setup* failure that looks exactly like a *code* failure. M1 owns it. **(c)** DevTools open
  with "Disable cache" ticked hides (a) from the author and not from the reader — the guide says which state
  to be in. **(d)** **`StrictMode` double-invokes effects**, which would make M4's "one `change` event" gate
  read two. The element bundle therefore contains **no `StrictMode`**, and the step that writes the React root
  says why in one clause — this is a stack-specific mask the Angular guide never had to face.
- **Every gate names exact values, because nothing else checks them.** There is no test runner in this stack:
  the reader's eyes are the only assertion. So no gate may say "the colour updates" — it says `#ff0000`, at
  that position, in that readout.
- **Rule 3.5 — one canonical demo colour, computed once, quoted everywhere.** `#3366ff` appears in the markup,
  the prose, the gates and the glossary — the same colour the Angular fixture uses, so the two guides' gates
  are directly comparable. Its conversions are fixed here so no step can re-derive them differently: **hex
  `#3366ff` · `rgb(51, 102, 255)` · `hsl(225, 100%, 60%)` · HSV h=225°, s=0.80, v=1.00 · at alpha 0.5:
  `#3366ff80`, `rgba(51, 102, 255, 0.5)`, `hsla(225, 100%, 60%, 0.5)`.** The alpha byte rule is fixed with it:
  `round(alpha × 255)`, half up — `0.5 → 128 → 0x80`.
- **Rule 4.4 — every step ends on a green build.** TypeScript is a type-checker, so every step's Done-when ends
  with the build at 0 errors. A step that changes a prop's shape or a state type fixes every use in the
  **same** step, JSX included. No step may say an error is expected until a later one.
- **Rule 7.1 — every step declares which of two environments it is in.** `npm run dev` (Vite serving the
  workspace's own `index.html`, hot-reloading) or the built bundle behind `http-server` (what the demo page
  loads). "I edited and nothing changed" is this guide's #1 failure class, and it is always one of these two
  confused for the other. Steps M1/01–05 live in the first; M1/06 onwards gate in the second.
- **Cross-platform commands.** The author's shell is PowerShell; the guide also targets bash. Any command that
  differs gets both variants — paths in particular (`dist/color-picker` vs `dist\color-picker`).

Plus **rule 5.1** — each step names its likely error with the first thing to check. This stack's specific
list: a blank shadow root (the mount node appended after `createRoot`), `color-picker` rendering as an unknown
element (the module never loaded, or `customElements.define` never ran), the drag sticking when the pointer
leaves the rail (no `setPointerCapture`), styles landing in `document.head` instead of the shadow root, and a
second `.css` file appearing in `dist/` the moment someone adds a real `import './x.css'`.

---

## 7. Folder & file layout

```
color-picker-component-react/
├── README.md                              ← front door
├── PLAN.md                                ← this file
├── feedback-log.md
├── foundation/                            ← stack · conventions · glossary · status · progress · decision-log
├── MILESTONE_1_the-tag-on-a-page/
├── MILESTONE_2_the-hue-rail/
├── MILESTONE_3_the-saturation-value-area/
├── MILESTONE_4_the-host-page-contract/
└── MILESTONE_5_alpha-formats-and-theming/
```

The project the reader builds (`color-picker/` workspace + `demo/`) is **not** vendored here — the guide is
the artifact; the code is what the reader produces by following it.

---

## 8. First move

Approve this plan — spend the attention on **§4** and on the two flagged rows in **§2.5**, not on the prose.
Check four things mechanically: M1 is the thinnest runnable rung (the pipeline only, no colour logic); each
rung uses only what rungs below it introduced; each Done-when is something you can *watch happen* and reads a
named value; and no rung needs a symbol a later rung defines.

On approval: `scaffold-guide` stamps the skeleton and the six foundation docs, then `draft-milestone` writes
all five milestones in one pass, and `audit-guide` QAs the result.
