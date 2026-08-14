# PLAN — An Angular colour picker that ships as a plain HTML tag

> The plan this guide is drafted from. Produced by GuideForge `plan-guide`. **Not the guide itself** — the
> ladder below is what the drafting pass expands into step files. Approve it before anything is drafted:
> fixing a rung costs minutes, re-drafting off a wrong rung costs the guide.

---

## 1. Brief & audience model

**The build.** A colour picker written as an Angular component and shipped as a **custom element** — a real
HTML tag. A site that has never heard of Angular drops one `<script>` on the page, writes
`<color-picker value="#3366ff">`, and gets a working picker: a saturation/value area, a hue rail, an alpha
rail, preset swatches, a switchable hex/rgb/hsl readout, and `input`/`change` events carrying the value.

**Observable end state.** A static `demo/index.html` — plain HTML, no framework, no bundler — served over
HTTP, showing the picker; dragging it updates a live readout and logs events; the host page restyles the
picker through `::part()` without touching its source.

**Where the facts came from.** Every answer below came from the Phase 0 interview. No spec, repo or design
doc was supplied, so nothing here is source-derived.

| # | Question | Answer |
|---|----------|--------|
| 1 | Per-topic expertise | See the matrix below |
| 2 | Granularity | **Standard** (default atomic step size) |
| 3 | Target end state | The plain-HTML demo page above, driven by hand in a browser |
| 4 | Stack | Angular 22 + `@angular/elements` — see §2 (verified online 2026-08-14) |
| 5 | Out of scope | Nothing excluded by name; the ladder holds the perimeter in Q3 and everything else lands in the advise-back list below |
| 6 | Hard constraints | Local `dist/` only — no npm publish, no CDN, no registry. Shadow DOM required. Author's shell is Windows PowerShell; every command must also run on bash |
| 7 | Size & writing language | 5 milestones, three sittings. Prose in **English** |
| 8 | Build-vs-borrow posture | **Not asked — assumed `Balanced`**: build what the guide set out to teach, borrow the plumbing. §2.5 puts every actual candidate to you one by one |

**Per-topic expertise matrix** — the single most important input, and the one that decides how long the guide
is:

| Topic | Level | Explanation depth the guide must use |
|-------|-------|--------------------------------------|
| Modern Angular — standalone components, signals, `@if`/`@for`, the CLI | **New** | Define + doc link + short deep-dive callout + extra failure notes |
| Web Components — `customElements.define`, shadow DOM, attributes vs properties, `CustomEvent`, `@angular/elements` | **New** | Same as above — this is the guide's spine, taught from zero |
| Colour & input UI — HSV/HSL/RGB spaces, conversions, pointer-drag interaction | **New** | Same as above |
| Build tooling & distribution — bundlers, CLI config, npm mechanics, versioning | **Expert** | Name it, no definitions. No explaining what a bundle is, what `dist/` means, or why hashing exists |

> **Over-explaining an Expert topic is a defect, exactly as harmful as under-explaining a New one.** With this
> matrix, a step that explains what esbuild does has failed; a step that writes `createCustomElement(...)`
> without saying what class it returns and who registers it has also failed.

### Advise-back — suggestions and risks (Phase 0 gate)

**Capabilities commonly paired with this build, deliberately *not* in the ladder.** Take or leave each; what
you reject is recorded in the decision log so the *why* survives.

- **Keyboard accessibility + ARIA.** The strongest candidate. A colour picker is an input widget, and this one
  is drag-only: arrow keys do nothing, nothing is focusable, a screen reader announces nothing. Two `role`
  attributes and arrow-key handlers on the two rails would close most of it. Recommended as a **sixth
  milestone** if you want the component to be defensible in real use.
- **Form association (`ElementInternals` + `formAssociated`).** Makes `<color-picker name="brand">` submit
  inside a `<form>` like a native input. One step, and it's the difference between "a widget" and "a form
  control". Currently out of scope.
- **The EyeDropper API.** Pick a colour from anywhere on screen. Cheap to add, but browser support is uneven
  and the feature would need a capability check — a real teaching opportunity about progressive enhancement.
- **Automated tests.** Excluded by your gate choice (§6). Worth knowing what it costs — see the risks below.
- **React/Vue interop, SSR.** Both are consequences of doing custom elements right rather than features you
  build. Out of scope; the M4 contract is what makes them work.
- **npm packaging.** Excluded by constraint. The `dist/` bundle the guide produces is already the artifact you
  would publish, so this is a later decision, not a rework.

**Long-run risks of these choices.**

- **No test suite means no regression net, and no machine-checkable guide.** Every gate here is a human
  looking at a browser. A future change to the colour maths can silently break M2's exact values and nothing
  will say so. Mitigation, and it is the reason §6 is strict: **every gate names exact values**, never "the
  colour looks right". If you later want the guide machine-verifiable, one Playwright milestone would do it.
- **Hand-rolled colour maths is a correctness-critical hand-roll.** See §2.5 — it is the one row where the
  recommendation goes against the usual default, on purpose, because you asked to be taught the conversions.
  The failure mode is not "it's wrong", it's "it's right for sRGB hex, and wrong the day someone pastes
  `oklch(70% 0.1 200)`". Mitigation: a rule-3.7 callout naming the library, and a scope line in the glossary
  saying the picker is sRGB-only.
- **Shadow DOM buys isolation and costs reach.** The host page cannot style the picker at all except through
  the surface you deliberately expose, and a picker inside a `<form>` submits nothing. M5's `::part()` work is
  the answer to the first; the second stays open (see the form-association suggestion above).
- **Angular pays for a small component.** An Angular custom element carries the framework runtime; a plain-JS
  picker would be a fraction of the bytes. That is the accepted cost of the brief — but the guide should say
  it once, plainly, rather than let a reader discover it from the build output.
- **Angular's release cadence changed at v22 — 12-month majors, 24 months of support.** v22 is supported to
  **2028-06**, so nothing here goes stale soon. As a repo fixture this guide stays **pinned** regardless: a
  fixture that drifts stops being a fixture.

---

## 2. Verified stack

Checked online **2026-08-14**. Every version claim below carries a link; anything unverified is marked.

| Tool / library | Pinned | Latest stable (2026-08-14) | Official docs | Notes |
|---|---|---|---|---|
| Angular | **22.x** — exact patch resolved at `ng new` time | v22 released **2026-06-03**; active support to 2027-06, LTS to **2028-06** | [releases & support](https://angular.dev/reference/releases) | From v22 Angular is on a **12-month** major cadence (it was 6) |
| `@angular/elements` | **22.x** — versioned with Angular | same | [custom elements guide](https://angular.dev/guide/elements) · [`createCustomElement`](https://angular.dev/api/elements/createCustomElement) | The whole bridge: `createCustomElement(Component, {injector})` → a class for `customElements.define` |
| `@angular/platform-browser` → `createApplication` | **22.x** | same | [`createApplication`](https://angular.dev/api/platform-browser/createApplication) | Stable. `createApplication(options?) => Promise<ApplicationRef>` — bootstraps the Angular environment **without** rendering a component, which is exactly what an element bundle needs |
| Node.js | **24 (Krypton)** — Active LTS | 24 Active LTS · 26 Current · 22 Maintenance | [previous releases](https://nodejs.org/en/about/previous-releases) | Angular 22 accepts `^22.22.3 \|\| ^24.15.0 \|\| ^26.0.0` |
| TypeScript | **>=6.0.0 <6.1.0** — installed by `ng new` | same | [version compatibility](https://angular.dev/reference/versions) | Pinned by Angular 22; the guide never chooses it |
| Angular CLI / `@angular/build:application` | **22.x** | same | [`ng build`](https://angular.dev/cli/build) · [workspace config](https://angular.dev/reference/configs/workspace-config) | `outputHashing` takes `all \| bundles \| media \| none`; `outputPath` takes a **string or an object** `{base, browser, server, media}` where `browser` defaults to `"browser"` |
| Change detection | **zoneless** (the v21+ default) | same | [zoneless guide](https://angular.dev/guide/zoneless) | "Zoneless is the default in Angular v21+ so you do not need to do anything to enable it." No `zone.js` in `polyfills` — which is why the bundle has no polyfill file to load |
| Style encapsulation | **`ViewEncapsulation.ShadowDom`** | same | [`ViewEncapsulation`](https://angular.dev/api/core/ViewEncapsulation) | Native `attachShadow`. v22 also ships `ExperimentalIsolatedShadowDom` (blocks inherited/external styles too) — **not used**: it is marked experimental |
| `::part()` theming surface | native CSS | Baseline **widely available** since 2020-07 | [MDN `::part()`](https://developer.mozilla.org/en-US/docs/Web/CSS/::part) | Parts are visible to the **direct** parent DOM only; `::part(a)::part(b)` is invalid |
| Static file server for the demo | `npx http-server` | *version UNVERIFIED — deliberately unpinned* | — | Any static server works. It is **required**: an ES-module bundle cannot be loaded from a `file://` page |
| Colour conversion | **none — written by hand** | see §2.5 for the verified alternatives | — | A deliberate build decision, not an absence of options |

**Five facts the drafting pass must not get wrong** (each verified on the exact name, not on its family):

1. **Zoneless is the default.** Do **not** add `provideZonelessChangeDetection()` — the docs scope that to v20
   users — and do not add `zone.js` to `polyfills`. A v22 element build with no lazy routes therefore has no
   polyfill bundle to load, which is what makes one `<script>` tag enough.
2. **Inputs become dash-case attributes; outputs become `CustomEvent`s.** An input aliased `myInputProp` is
   set from the `my-input-prop` attribute; an output aliased `myClick` dispatches an event named `myClick`
   with the payload on `event.detail`. The drafting pass picks aliases deliberately and states the mapping.
3. **Nothing reflects back.** Angular maps attribute → property. Writing the current value **out** to the host
   attribute is the guide's own code (M4), not a framework behaviour. No step may imply otherwise.
4. **`outputPath` is an object when you want to lose the `browser/` subfolder.** `{"base": "dist/color-picker",
   "browser": ""}` puts the bundle where the demo's `<script src>` expects it. Verified on the workspace-config
   page.
5. **The demo must be served over HTTP.** Double-clicking `demo/index.html` gives a `file://` page, and the
   browser refuses to load an ES module from it. This is the single most likely first-run failure and it gets
   its own step in M1, not a footnote.

---

## 2.5 Build vs borrow

Every self-contained capability the ladder would otherwise hand-write, and the verified off-the-shelf
alternative. The ladder below is cut on the **Recommended** column — flipping a row before approval re-cuts
that milestone, which is cheap now and expensive after drafting.

| Capability | Where | Verified off-the-shelf option | What borrowing costs | What building teaches | Recommended | Your call |
|---|---|---|---|---|---|---|
| **sRGB colour conversion** — HSV→RGB, RGB→hex (incl. 8-digit alpha), hex→RGB, RGB→HSV, RGB→HSL | M2, M3, M4, M5 | [`chroma-js` 3.2.0](https://www.npmjs.com/package/chroma-js) (last publish ~Dec 2025) · [`culori` 4.0.2](https://github.com/Evercoder/culori/releases) | A dependency in a bundle whose whole selling point is being one file; an API to learn on top of the maths | The actual model behind every colour picker ever: hue as an angle, saturation and value as the two axes of the square, and why the square looks different at every hue | **build** *(scoped — see below)* | |
| **The picker component itself** | all | Prior art exists — [`vanilla-picker` 2.12.3](https://www.npmjs.com/package/vanilla-picker), [`@thednp/color-picker` 2.0.4](https://www.npmjs.com/package/@thednp/color-picker) — *release freshness UNVERIFIED on this date* | The entire guide | Everything | **build** — forced | |
| **The Angular → custom-element bridge** | M1 | [`@angular/elements`](https://angular.dev/guide/elements) 22.x | One in-house package, already versioned with Angular | Hand-writing an `HTMLElement` subclass that owns an `ApplicationRef`, maps attributes to inputs and re-dispatches outputs — a week of work to re-derive `createCustomElement` | **borrow** | |
| **Pointer-drag tracking** — press, follow outside the element, release, clamp to bounds | M2, M3 | Gesture libraries exist, but none were verified against Angular 22 on this date, so **none is offered** | — | `setPointerCapture` and normalising a client coordinate into a 0–1 position: ~15 lines, reused by all three rails | **build** | |

**The one row that deserves an argument.** The pedagogy contract says correctness-critical domains — colour
spaces among them, by name — default to **borrow** whatever the posture, *unless that domain is the guide's
subject. Here it is the subject*: you rated colour spaces and conversions a **New** topic you want taught from
zero, and a picker whose maths is `chroma.hsv(h,s,v).hex()` leaves M2 and M3 with no lesson in them. So the
recommendation is build — **scoped**: the guide writes exactly the five sRGB conversions it needs, and the
step that writes them carries the rule-3.7 callout naming `chroma-js` and the condition to swap it in (any
wide-gamut, CSS Color 4, or perceptual-space requirement). Flip this row and M2 loses one step, M3 is
unchanged, M5's format switch collapses to two lines.

Every row lands in `foundation/decision-log.md` with its *why* and its revisit-if.

---

## 3. Foundation docs

| Doc | What it owns |
|---|---|
| `README.md` | Front door: objective, one-line stack summary, headline decisions, Updates log, "following this guide" note |
| `foundation/stack.md` | The §2 table verbatim — every step builds against these versions |
| `foundation/conventions.md` | File layout, naming, the canonical demo colour (§6), `Writing language: English`, the "gates are the demo page" rule |
| `foundation/glossary.md` | `### heading` per term: custom element, shadow DOM, shadow root, attribute vs property, `CustomEvent`, standalone component, signal, zoneless change detection, injector, HSV, hue, saturation, value, alpha, sRGB, pointer capture, CSS part |
| `foundation/status.md` | Single source of truth for what is actually verified. **No milestone is ✅ until its gate has been watched in a browser** |
| `foundation/progress.md` | What the reader has executed, step by step — the ledger `amend-guide` reads |
| `foundation/decision-log.md` | D1 shadow DOM over emulated · D2 colour maths built, not borrowed (§2.5) · D3 `dist/` only, no publish · D4 zoneless, no polyfill bundle · D5 no keyboard/ARIA in scope · D6 accepted risks from §1 |
| `feedback-log.md` | Seeded empty by `scaffold-guide` |

---

## 4. Milestone ladder

Every gate is the plain-HTML demo page, open in a browser, served over HTTP. Every rung depends only on rungs
below it.

| # | Milestone | Proves (end state) | Depends on | Done-when (one line) |
|---|-----------|--------------------|------------|----------------------|
| **M1** | The tag on a page | The whole distribution path works before any colour logic exists | — | The demo page shows the component; `document.querySelector('color-picker').shadowRoot` is a `ShadowRoot`, not `null`; the page's own `.panel { background: #000000 }` blackens its own box and stops at the shadow boundary *(drafting correction: the original gate used a `*` rule, which also matches the `<color-picker>` host element itself and so proves nothing about the boundary — a class the component happens to use inside its shadow root is the sharper test)* |
| **M2** | The hue rail | A pointer drag becomes a colour | M1 | Dragging the rail sweeps red→yellow→green→cyan→blue→magenta; dragging **past** either edge pins the handle and reads exactly `#ff0000`; across the middle third the readout begins `#00` *(drafting correction: the original gate asked for `#00ffff` at the exact midpoint, which is half a pixel wide and unhittable by hand — see M2's verify)* |
| **M3** | **The saturation/value area** *(reality-check gate)* | The thing is a colour picker | M2 | At hue 0: top-right → `#ff0000`, top-left → `#ffffff`, anywhere along the bottom edge → `#000000` |
| **M4** | The host-page contract | A page that knows nothing about Angular can drive it and be driven by it | M3 | `<color-picker value="#3366ff">` renders that colour on load; dragging rewrites the `value` attribute live in the Elements panel; the log prints `input` while dragging and one `change` on release, each with `detail` `{"value":"#..."}`; `el.value = '#00ff00'` from the console moves the UI; a preset swatch does both |
| **M5** | Alpha, formats & theming | The public surface is complete and the host site can restyle it | M4 | At alpha 0.5 the readout is `#3366ff80` / `rgba(51, 102, 255, 0.5)` / `hsla(225, 100%, 60%, 0.5)` as the format switch moves; `format="rgb"` on the tag picks the initial mode; the host page's `color-picker::part(panel) { border-radius: 0 }` squares the corners without touching the component |

**Reality-check gate: end of M3.** That is the first point where the thing is genuinely a colour picker. Stop,
use it, and decide the design holds before building the public API on top of it.

**Sittings.** M1–M2 is one sitting (toolchain, bridge, first interaction). M3 is its own. M4–M5 is the third,
and the longest.

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

Expected step counts: M1 ≈ 5, M2 ≈ 4, M3 ≈ 4, M4 ≈ 5, M5 ≈ 6 — 24 steps plus 5 verify files.

---

## 6. Writing contract & verification design

The full pedagogy contract applies (P1–P7). Five points need deciding **here**, not at drafting time:

- **Rule 6.2 — the browser is an environment that lies, and this guide's every gate is watched in one.** Three
  specific masks, each designed against rather than discovered in the field: **(a)** a cached bundle — the
  build pins `outputHashing: none`, so the filename never changes and the browser will happily serve
  yesterday's code; every gate is therefore watched after a **hard reload**, the demo server runs with caching
  off (`npx http-server dist/color-picker -c-1`), and M1 teaches this as a step, not a troubleshooting note.
  **(b)** `file://` — an ES module will not load from it, so "nothing renders and the console says the module
  was blocked" is a *setup* failure that looks exactly like a *code* failure. M1 owns it. **(c)** DevTools
  open with "Disable cache" ticked hides (a) from the author and not from the reader — the guide says which
  state to be in.
- **Every gate names exact values, because nothing else checks them.** There is no test runner in this stack:
  the reader's eyes are the only assertion. So no gate may say "the colour updates" — it says `#ff0000`, at
  that position, in that readout.
- **Rule 3.5 — one canonical demo colour, computed once, quoted everywhere.** `#3366ff` appears in the
  markup, the prose, the gates and the glossary. Its conversions are fixed here so no step can re-derive them
  differently: **hex `#3366ff` · `rgb(51, 102, 255)` · `hsl(225, 100%, 60%)` · HSV h=225°, s=0.80, v=1.00 ·
  at alpha 0.5: `#3366ff80`, `rgba(51, 102, 255, 0.5)`, `hsla(225, 100%, 60%, 0.5)`.** The alpha byte rule is
  fixed with it: `round(alpha × 255)`, half up — `0.5 → 128 → 0x80`.
- **Rule 4.4 — every step ends on a green build.** Angular has a compiler, so every step's Done-when ends with
  `ng build` at 0 errors. A step that changes a signal's shape or an alias fixes every use in the **same**
  step, template included. No step may say an error is expected until a later one.
- **Cross-platform commands.** The author's shell is PowerShell; the guide also targets bash. Any command that
  differs gets both variants — paths in particular (`dist/color-picker` vs `dist\color-picker`).

Plus the two that this stack makes sharp: **7.1** — every step declares whether the dev server is running and
whether the bundle has been rebuilt, because "I edited and nothing changed" is this guide's `#1` failure
class; and **5.1** — each step names its likely error (blank page, `color-picker` rendered as an unknown
element, the shadow root missing, the drag sticking when the pointer leaves the rail) with the first thing to
check.

---

## 7. Folder & file layout

```
color-picker-component-angular/
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

Approve this plan — spend the attention on **§4** and on the one flagged row in **§2.5**, not on the prose.
Check four things mechanically: M1 is the thinnest runnable rung (the pipeline only, no colour logic); each
rung uses only what rungs below it introduced; each Done-when is something you can *watch happen* and reads a
named value; and no rung needs a symbol a later rung defines.

On approval: `scaffold-guide` stamps the skeleton and the six foundation docs, then `draft-milestone` writes
all five milestones in one pass, and `audit-guide` QAs the result.
