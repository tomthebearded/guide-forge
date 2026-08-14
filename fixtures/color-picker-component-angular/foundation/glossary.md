# Glossary

> Terms this guide introduces, defined in plain language. Each is taught in the step that first uses it — this
> page is where you look it up again later. Terms are `###` headings so the deep links from each step's
> *Glossary for this step* block resolve.

### custom element

A tag name you register with the browser yourself, backed by a JavaScript class. Once
`customElements.define('color-picker', SomeClass)` has run, every `<color-picker>` on the page — including
ones written in the HTML before the script loaded — is upgraded to an instance of that class. The browser
treats it like any built-in element.

### custom-element registry

The browser-wide table of tag name → class, reachable as `window.customElements`. A name can be registered
only once per page; registering it twice throws.

### shadow DOM

A second, private DOM tree attached to an element. Styles defined inside it do not escape, and the page's
styles do not reach in — with the deliberate exception of inherited properties like `color` and `font-family`,
and anything the component exposes on purpose. It is what makes a tag safe to drop on a site you have never
seen.

### shadow root

The root node of that private tree, returned by `element.shadowRoot` when the element was created with an open
shadow DOM. `null` means there is no shadow tree — which, in this guide, means the encapsulation setting did
not take.

### attribute vs property

An **attribute** is the string in the HTML (`value="#3366ff"`); a **property** is the live JavaScript field on
the element object (`el.value`). They are separate, and keeping them in step is code someone has to write. In
this guide, attribute → property is done by `@angular/elements`; property → attribute is written by hand in
M4.

### CustomEvent

A DOM event you create and dispatch yourself, carrying arbitrary data on its `detail` field. It is how a
custom element talks *out* to a page that knows nothing about the framework inside it.

### standalone component

An Angular component that declares its own template dependencies and needs no NgModule. The default since
Angular 19, and the only kind this guide writes.

### signal

Angular's unit of reactive state: a value you read by calling it (`hue()`) and write with `set`/`update`.
Anything that reads a signal is re-evaluated when it changes, which is what drives rendering without change
detection having to guess.

### zoneless change detection

Angular's default from v21: the framework is told when state changed by signals, instead of monkey-patching
every browser API through `zone.js` to find out. For this guide it has a concrete consequence — no `zone.js`
in the build, so the bundle is one file with no polyfill to load beside it.

### injector

The object Angular uses to resolve dependencies. `createCustomElement` needs one so that the component it
wraps can be constructed with its services; this guide gets it from the `ApplicationRef` that
`createApplication()` returns.

### HSV

A way of describing a colour with three numbers: **hue** (which colour, an angle 0–360°), **saturation** (how
far from grey, 0–1) and **value** (how far from black, 0–1). Colour pickers use it because those three
numbers map directly onto controls a person can drag — a hue rail and a two-axis square.

### hue

The angle around the colour wheel, in degrees. 0° is red, 120° green, 240° blue, and 360° is 0° again — which
is why a hue rail can be a loop and why the guide always stores it modulo 360.

### saturation

How far a colour is from grey. In HSV, 0 is grey and 1 is the most colourful version of that hue at that
value. It is the horizontal axis of the picker's square.

### value (in HSV)

How far a colour is from black. 0 is black regardless of hue and saturation; 1 is the brightest form. It is
the vertical axis of the picker's square — and it is *not* the same thing as lightness in HSL.

### HSL

A third way of naming the same sRGB colours: a hue in degrees, a **saturation** percentage, and a
**lightness** percentage — what CSS writes as `hsl(225, 100%, 60%)`. It shares its hue with HSV and nothing
else: at lightness 100% every colour is white, where at HSV value 1 a colour is at its most vivid. That
difference is why the picker's square has a rainbow along its top edge rather than a white band.

### alpha

Opacity, 0 to 1. Stored as a ratio in the code and rendered either as the fourth argument of `rgba()`/`hsla()`
or as two extra hex digits (`#3366ff80`), where the byte is `round(alpha × 255)`.

### sRGB

The standard colour space of the web: the one `#rrggbb` has always meant. This picker is sRGB-only — it does
not handle wide-gamut or CSS Color 4 spaces such as `oklch()`. See D2 in
[decision-log.md](decision-log.md).

### pointer capture

Telling the browser to keep sending pointer events to one element until the pointer is released, even when it
leaves that element's bounds. Without it, dragging a slider stops the moment your cursor slips off it — which
is exactly what a person does at the end of a rail.

### CSS part

A node inside a shadow tree marked with `part="name"`, which the host page can then style with
`my-element::part(name)`. It is the deliberate hole in the encapsulation: everything else stays private, and
what you name here is the public styling contract you have to keep.
