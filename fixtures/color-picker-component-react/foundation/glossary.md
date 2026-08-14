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
shadow DOM. `null` means there is no shadow tree. It is a `DocumentFragment`, **not** an element — which is why
this guide never passes it straight to `createRoot`.

### mount node

The plain `<div>` this guide appends inside the shadow root and hands to `createRoot`. It exists so React gets
the DOM *element* its API documents, and so the boundary between "DOM the class owns" and "DOM React owns" has
a name.

### attribute vs property

An **attribute** is the string in the HTML (`value="#3366ff"`); a **property** is the live JavaScript field on
the element object (`el.value`). They are separate, and keeping them in step is code someone has to write. In
this guide both directions are written by hand in M4: attribute → property via `attributeChangedCallback`,
property → attribute via a `set value()` accessor that reflects.

### observedAttributes

A static array on the custom-element class naming which attributes the browser should watch. Change one of
those on the tag and the browser calls `attributeChangedCallback`; change any other and nothing happens. An
attribute missing from this list is the usual reason "setting the attribute does nothing".

### CustomEvent

A DOM event you create and dispatch yourself, carrying arbitrary data on its `detail` field. It is how a
custom element talks *out* to a page that knows nothing about the framework inside it.

### function component

A React component written as a plain function that returns markup. The only kind this guide writes — the one
`class` here is the `HTMLElement` subclass, which is a DOM class, not a React one.

### React root

The object `createRoot(mountNode)` returns. It owns the rendering of one React tree into one DOM node: you call
`render` on it to update, and `unmount` to tear it down. The custom-element class creates one in
`connectedCallback` and unmounts it in `disconnectedCallback`, which is what stops a removed tag from leaking.

### state

A value React re-renders on when it changes, created with `useState`. In this picker the state is the colour —
hue, saturation, value and alpha — and everything on screen is derived from it.

### ref

A mutable box a component keeps across renders, created with `useRef` and read or written as `.current`.
Writing to it does **not** re-render, which is the whole difference from state: use a ref for bookkeeping the
screen does not show. This picker uses one to remember the hex it last published, so the `change` event can
re-emit exactly what the last `input` carried.

### effect

Code React runs after rendering, declared with `useEffect`. Used here only for the things that reach outside
React: dispatching the `input` and `change` events, and reflecting the value back to the host attribute.

### StrictMode

A development-only React wrapper that deliberately double-invokes effects to surface bugs. It is **not** in this
guide's element bundle, on purpose: it would fire every event twice and make M4's gate read two `change` events
where it names one.

### constructed stylesheet

A `CSSStyleSheet` you build in JavaScript (`new CSSStyleSheet()`, then `replaceSync(cssText)`) and attach with
`shadowRoot.adoptedStyleSheets`. This guide's styles arrive this way rather than as a `.css` file, which is what
keeps the build down to a single `.js`.

### CSS part

A node inside a shadow root marked `part="name"`, which the host page can then style with
`color-picker::part(name)`. It is the deliberate hole in the encapsulation — a public promise, chosen once, in
M5.

### HSV

A way of describing a colour as **hue** (which colour), **saturation** (how much of it) and **value** (how
bright). It is the model behind almost every colour picker's layout, because two of its three numbers map
naturally onto the two axes of a square.

### hue

The angle around the colour wheel, 0–360°. 0° is red, 120° green, 240° blue. The hue rail in M2 is this one
number.

### saturation

How far a colour is from grey, 0–1. At saturation 0 every hue looks the same shade of grey; at 1 the colour is
as pure as the display can render. The horizontal axis of the square in M3.

### value

How bright a colour is, 0–1. At value 0 every colour is black regardless of hue and saturation — which is why
the bottom edge of the square reads `#000000` all the way across. The vertical axis of the square in M3.

### HSL

A third way to name the same colour: hue (the same angle HSV uses), saturation, and **lightness** — 100%
lightness is white, 0% is black, and the pure colour sits at 50%. It is the model CSS took, which is why this
picker has to speak it in M5 even though it thinks in HSV. The same colour has a different saturation number
in HSL and in HSV, and that is not a rounding error.

### alpha

Opacity, 0–1. It is not part of the colour, it is how much of the colour you see. M5 adds it, and the
8-digit hex form `#rrggbbaa` carries it as a byte: `round(alpha × 255)`, half up.

### sRGB

The colour space this picker works in, and the one every hex code on the web means. It is a deliberate scope
limit: the conversions written in M2 are correct for sRGB hex and are not correct for wide-gamut, CSS Color 4
or perceptual spaces like Oklch. See D3 in [decision-log.md](decision-log.md).

### pointer capture

`element.setPointerCapture(pointerId)` — telling the browser to keep sending this pointer's events to this
element even after the pointer leaves it. It is the difference between a drag that keeps working when your
mouse runs off the rail and one that sticks.

### library mode

The Vite build mode that produces a distributable bundle from an entry module rather than an application from
an `index.html`. Configured under `build.lib`; it is what turns `src/` into the one file the demo page loads.
