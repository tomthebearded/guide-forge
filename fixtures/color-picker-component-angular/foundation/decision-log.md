# Decision log

> The non-obvious choices and *why* they were made — so you learn the reasoning, not just the result.

### D1 — The component lives behind a native shadow root

**Decision.** The component sets `encapsulation: ViewEncapsulation.ShadowDom`, so the browser gives it a real
shadow root rather than Angular's attribute-rewriting emulation.

**Why.** The whole promise of this build is "drop the tag on **any** site". A site you have never seen has a
stylesheet you have never read, and `input { width: 100% }` somewhere in it would otherwise reach inside your
picker and break it. A shadow root is the only mechanism that actually stops that.

**What it costs.** The isolation cuts both ways: the host page cannot style the picker at all, which is why M5
exposes `::part()` names and CSS custom properties on purpose. A second cost is not fixed here — a
`<color-picker>` inside a `<form>` submits nothing, because it is not a form-associated element. That needs
`ElementInternals`, which is out of scope.

**Revisit if** you need the host page's fonts or theme tokens to cascade in unchanged. Angular 22 also ships
`ExperimentalIsolatedShadowDom`, which blocks even inherited styles — deliberately not used here while it is
marked experimental.

### D2 — Build vs borrow: the colour maths is written by hand

**Decision.** The guide writes exactly five sRGB conversions — HSV→RGB, RGB→hex (including the 8-digit alpha
form), hex→RGB, RGB→HSV and RGB→HSL — instead of taking
[`chroma-js` 3.2.0](https://www.npmjs.com/package/chroma-js) or
[`culori` 4.0.2](https://github.com/Evercoder/culori/releases).

*(The plan said four. Drafting M4 found the fifth: the moment the host page can set `value="#3366ff"`, the
picker has to turn that colour back into the hue, saturation and value its handles are positioned from, and
RGB→HSV is the only way there. Recorded here rather than quietly written.)*

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

### D3 — Build vs borrow: the Angular → custom-element bridge is borrowed

**Decision.** `@angular/elements` and its `createCustomElement`, rather than a hand-written `HTMLElement`
subclass.

**Why.** Hand-rolling the bridge means owning an `ApplicationRef`, the attribute→input mapping, the
change-detection hook and the output→`CustomEvent` re-dispatch — a week of work to re-derive a package that
ships with the framework and is versioned with it. Nothing in the objective is about writing that bridge.

**Revisit if** you ever need the element to exist without Angular at all, which is a rewrite, not a swap.

### D4 — Build vs borrow: pointer-drag tracking is written by hand

**Decision.** Press, follow, release and clamp are implemented directly on Pointer Events with
`setPointerCapture`.

**Why.** It is roughly fifteen lines, shared by all three rails, and it is half the lesson in M2 and M3:
turning a client coordinate into a 0–1 ratio *is* what a picker does. No gesture library was verified against
Angular 22 on 2026-08-14, so none was offered as an alternative.

**Revisit if** you add multi-touch, inertia or pinch gestures — none of which this picker has.

### D5 — The gates are a browser, not a test runner

**Decision.** Every milestone's Done-when is watched by a person on the plain-HTML demo page. There is no
Vitest, no Karma, no Playwright anywhere in this guide.

**Why.** It was the explicit choice at plan approval: the audience wants to see the thing work in the setting
it will actually be used in — a page that knows nothing about Angular — rather than in a harness.

**What it costs, and this is the honest part.** A gate a person has to perform is a gate that quietly stops
being performed, and there is no regression net at all: a change to the colour maths can silently break M2's
values and nothing will say so. Two mitigations are in force — every gate names an exact value (see
`conventions.md`), and every gate names the environment it is watched in, because a cached bundle makes fixed
code look broken and broken code look fixed.

**Revisit if** the picker ever leaves teaching use. One Playwright milestone would convert every gate in this
guide into something machine-checkable.

### D6 — `dist/` only: no npm publish, no CDN, no registry

**Decision.** The build produces a self-registering bundle in `dist/color-picker/`, and the demo loads it with
a relative `<script src>`. Nothing is packaged or published.

**Why.** The constraint at plan approval. The bundle *is* the artifact you would publish, so this is a
deferred decision rather than a rework: adding a `package.json` `exports` map later changes nothing about the
component.

### D7 — Accepted risks (recorded at plan approval)

- **No test suite.** See D5.
- **Hand-rolled colour maths in a correctness-critical domain.** See D2.
- **Shadow DOM removes form participation.** See D1.
- **Angular pays for a small component.** The bundle carries the framework runtime; a plain-JS picker would be
  a fraction of the bytes. Accepted as the cost of the brief — but the guide says it once, plainly, rather
  than letting the reader discover it from the build output.
- **No keyboard access or ARIA.** The picker is drag-only: nothing is focusable, arrow keys do nothing, a
  screen reader announces nothing. This is the one exclusion that would be a defect in real use, and it was
  recorded as such when the plan was approved. A sixth milestone would close it.

### D8 — The format switch changes the readout, and nothing else

**Decision.** `format="hex|rgb|hsl"` and the three buttons change what the **readout displays**. The `value`
attribute and both events always carry hex.

**Why.** Whatever the component emits, it must also accept back — so emitting `rgb(51, 102, 255)` would make
`parseHex` responsible for every CSS colour form, and turn a display preference into a change in what a host
page has stored. It would also break the reflection guard, which compares strings: two spellings of one colour
would never compare equal, and the two effects would chase each other. One canonical wire format, one display
format.

**Revisit if** you need the component to emit what the reader sees — a "copy this value" button is the usual
reason. That is a second, explicitly-named output, not a change to `value`.
