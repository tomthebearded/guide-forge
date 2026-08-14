# Milestone 1 · Step 03 of 07 — The custom element
> Nav: [← The panel component](02_the-panel-component.md) · [Overview](00_overview.md) · [The styles →](04_the-styles.md)

## Before you start

Step 02 done: `src/ColorPicker.tsx` renders a panel, and the dev server is still running.

## Glossary for this step

- [custom element](../foundation/glossary.md#custom-element) — defined under *Do this*, action 1.
- [custom-element registry](../foundation/glossary.md#custom-element-registry) — defined under *Do this*, action 3.
- [shadow DOM](../foundation/glossary.md#shadow-dom) — defined under *Do this*, action 1.
- [shadow root](../foundation/glossary.md#shadow-root) — defined under *Do this*, action 1.
- [mount node](../foundation/glossary.md#mount-node) — defined under *Do this*, action 1.
- [React root](../foundation/glossary.md#react-root) — defined under *Do this*, action 2.

## Why / design

This is the step the guide exists for. Everything else here is a colour picker; this is the bridge that turns
a React component into a tag any page can use.

> **Build vs borrow — [`@r2wc/react-to-web-component` 2.1.1](https://github.com/bitovi/react-to-web-component)**
> does this in production: you're writing it by hand here to learn what a framework's element bridge actually
> owns — a shadow root, a React root's lifecycle, and the two boundaries between DOM the browser drives and
> DOM React drives. Swap it in when you need a second component on this stack and have already learned the
> mechanism. Its README still says React 18 only; the published `package.json` for 2.1.1 declares
> `"react": "^18.0.0 || ^19.0.0"`.

Angular ships this bridge in the box, as `@angular/elements`. React does not, and that absence is the reason
this milestone is the widest one in the guide.

**This step touches three files, committed together:** it creates `src/color-picker-element.tsx`, rewrites the
workspace's `index.html`, and deletes `src/main.tsx`. `index.html` currently loads `main.tsx`, so deleting one
without changing the other would leave the project broken.

## Do this

1. **Create `src/color-picker-element.tsx`** with the class below. Read the three callouts before you type it —
   the whole step is in them.

   > **New concept — custom element.** A tag name you register with the browser yourself, backed by a
   > JavaScript class that extends `HTMLElement`. Once the registration has run, every `<color-picker>` on the
   > page is *upgraded* to an instance of your class — including tags that were already in the HTML before
   > your script loaded. The browser then calls methods on it at fixed moments: `connectedCallback` when it
   > enters the document, `disconnectedCallback` when it leaves.
   > ([MDN: using custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements))

   > **New concept — shadow DOM and the shadow root.** `attachShadow({ mode: 'open' })` gives your element a
   > second, private DOM tree and returns its root. Styles inside it do not escape, and the page's styles do
   > not reach in. That is what makes a tag safe to drop on a site whose CSS you have never read. `mode:
   > 'open'` means `element.shadowRoot` returns the root instead of `null`, which is what M1's gate checks.
   > ([MDN: using shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM))

   > **New concept — the mount node.** React does not render into the shadow root. It renders into a plain
   > `<div>` you append inside it. `createRoot` is documented to take *"A DOM element"*, and a `ShadowRoot` is
   > a `DocumentFragment`, not an element — passing one may work, but it is not what the API promises, and
   > this guide does not build its spine on an undocumented capability. The `<div>` is also a useful line to
   > have: everything outside it is DOM this class owns, everything inside it is DOM React owns.
   > ([`createRoot`](https://react.dev/reference/react-dom/client/createRoot))

   ```tsx
   // src/color-picker-element.tsx — the whole file
   import { createRoot, type Root } from 'react-dom/client';
   import { ColorPicker } from './ColorPicker';

   export class ColorPickerElement extends HTMLElement {
     // `#` means a real private field: unreachable from outside the class, even at runtime.
     #mountNode: HTMLDivElement;
     #reactRoot: Root | null = null;

     constructor() {
       super();
       const shadowRoot = this.attachShadow({ mode: 'open' });
       this.#mountNode = document.createElement('div');
       shadowRoot.append(this.#mountNode);
     }

     connectedCallback() {
       this.#reactRoot = createRoot(this.#mountNode); // one React root per element instance
       this.#reactRoot.render(<ColorPicker />);
     }

     disconnectedCallback() {
       this.#reactRoot?.unmount(); // tear the tree down so a removed tag leaks nothing
       this.#reactRoot = null;
     }
   }
   ```

   > **New concept — the React root.** `createRoot(mountNode)` returns an object that owns the rendering of one
   > React tree into one DOM node. You call `render` on it to put a tree there or update it, and `unmount` to
   > destroy it. Creating it in `connectedCallback` and unmounting it in `disconnectedCallback` is what keeps
   > the React tree's life exactly as long as the tag's.

   Two details that are easy to get wrong and hard to diagnose:

   - **`attachShadow` is in the constructor, `createRoot` is not.** The specification forbids touching
     attributes or children in a custom element's constructor, but attaching a shadow root is explicitly
     allowed. Rendering is work, and work belongs in `connectedCallback`.
   - **There is no `StrictMode` here, on purpose.** It is React's development-only wrapper that deliberately
     runs effects twice. In M4 this element dispatches one `change` event per drag, and a gate that reads
     "one event" would read two. See [`../foundation/conventions.md`](../foundation/conventions.md).
   - **The tag is meant to be placed, not moved.** Moving a custom element to a different parent fires
     `disconnectedCallback` and then `connectedCallback` again, and React will not accept a container that has
     already hosted a root — so this element supports being added and removed, not relocated. Every host page
     in this guide places the tag once. Keeping the code honest about that is cheaper than the machinery a
     fresh mount node per reconnect would need; recorded as a named limit in
     [`../foundation/decision-log.md`](../foundation/decision-log.md).

2. **Register the tag.** Add these two lines at the **bottom** of `src/color-picker-element.tsx`, after the
   closing brace of the class.

   ```tsx
   // src/color-picker-element.tsx — appended below the class
   // Registering here, at module scope, is what makes one <script> tag enough for a host page.
   customElements.define('color-picker', ColorPickerElement);
   ```

   > **New concept — the custom-element registry.** `window.customElements` is the browser-wide table of tag
   > name → class. `define` adds an entry, and a name can be registered only **once per page**: calling it
   > twice with the same name throws `NotSupportedError`. The name `color-picker` is **load-bearing** — it is
   > the tag the demo page writes, and it must contain a hyphen, which is how the platform reserves the whole
   > namespace of hyphenated names for you and guarantees it will never collide with a future built-in tag.
   > ([`customElements.define`](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define))

3. **Rewrite the workspace's `index.html`.** It sits at the root of `color-picker/`, beside `package.json` —
   not in `src/`. Replace the whole `<body>` and the `<title>`; leave the `<!doctype>` line, the `<meta>` tags
   and the `<link rel="icon">` alone.

   ```html
   <!-- color-picker/index.html — replacing the <title> and everything between <body> and </body> -->
   <title>color-picker — dev harness</title>
   ```

   ```html
   <!-- color-picker/index.html — the new <body> -->
   <body>
     <color-picker></color-picker>
     <script type="module" src="/src/color-picker-element.tsx"></script>
   </body>
   ```

   This file is now a **harness**, not a product: it exists so `npm run dev` has something to serve. The page
   that matters is the one you write in step 06, and it is not this one.

4. **Delete `src/main.tsx`.** Nothing imports it any more.

   ```bash
   # bash
   rm src/main.tsx
   ```

   ```powershell
   # PowerShell
   Remove-Item src/main.tsx
   ```

## Done when (this step)

- The dev page still shows `#3366ff`, now rendered inside the tag rather than inside `<div id="root">`.
- In DevTools' **Elements** panel, `<color-picker>` has a child labelled `#shadow-root (open)`, and the panel
  markup sits underneath it.
- In DevTools' **Console**, typing this prints `true`:

  ```js
  document.querySelector('color-picker').shadowRoot !== null
  ```

- `npm run build` exits without printing an error.

## If it breaks

- **The page is empty and `<color-picker>` shows no `#shadow-root` in the Elements panel.** The module never
  ran, so the tag was never registered and the browser is treating it as an unknown element. Check the
  Console for a module-loading error, and check that `index.html`'s `<script src>` reads exactly
  `/src/color-picker-element.tsx` — with the leading slash and the `.tsx` extension.
- **`Uncaught NotSupportedError: the name "color-picker" has already been used`.** The module was evaluated
  twice. In dev this usually means a hot reload re-ran it; a full page reload clears it.
- **`Uncaught TypeError: Cannot read properties of null` from `main.tsx`.** `index.html` still points at the
  deleted `main.tsx`. Action 3 replaces that line.
- **`tsc` complains about `type Root`.** The import must be `import { createRoot, type Root } from
  'react-dom/client'` — `Root` is a type, and the template's TypeScript config does not allow importing a type
  as a value.

---
> Nav: [← The panel component](02_the-panel-component.md) · [Overview](00_overview.md) · [The styles →](04_the-styles.md)
