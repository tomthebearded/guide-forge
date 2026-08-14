# Conventions

> The style and structure rules this guide's code follows. One place, referenced everywhere, so no step
> re-argues them.

## Writing language

**English.** Only the prose would ever change language; the skeleton never does — file and folder names,
section headings (`## Do this`, `## Done when (this step)`, …), nav-line vocabulary (`Nav`, `Overview`,
`prev:`/`next:`/`start:`), table column keys, code, commands, identifiers, paths and doc URLs stay English in
every GuideForge guide.

## Shells

Every command in this guide runs on **both** Windows PowerShell and bash. Where the two differ — deleting a
folder, reading an exit code, writing a path — the step gives both variants rather than picking one. `ls`,
`mkdir`, `cd`, `npm` and `npx` are written once because they work unchanged in both. The authoritative record
is the *Target OS / shell(s)* row in [stack.md](stack.md).

## Project layout

```
color-picker-demo/                            ← the folder you work in
  color-picker/                               ← the Vite workspace (created by `npm create vite`)
    src/                                      ← the React component, the colour maths, the custom-element class
    index.html                                ← the dev harness — only `npm run dev` ever loads this
    dist/color-picker/color-picker.js         ← the built bundle
  demo/
    index.html                                ← the plain-HTML host page: no framework, no build step
```

The demo is deliberately **outside** the Vite workspace and is never processed by Vite. The moment it were
built by Vite it would stop proving the thing it exists to prove: that a page which knows nothing about React
can use the tag.

Vite's library mode emits a bundle and **no** `index.html`, so the static server is pointed at
`color-picker-demo/` — the one folder from which both the demo page and the bundle are reachable — and the
demo's `<script src>` is the relative path `../color-picker/dist/color-picker/color-picker.js`.

## The two environments, and which one a step is in

This guide's most expensive confusion is running in one of these and reading a gate meant for the other. Every
step declares which it is in.

| Environment | Command | What it serves | Used by |
|---|---|---|---|
| **Dev** | `npm run dev`, from `color-picker/` | Vite serving the workspace's own `index.html`, hot-reloading from `src/` | while you write a step |
| **Built** | `npm run build` from `color-picker/`, then `npx http-server . -c-1` from `color-picker-demo/` | the bundle the demo page loads, over HTTP, with caching off | **every milestone gate**, from M1 step 06 onwards |

A gate is never read in Dev. Dev is where you see a change quickly; Built is where you find out whether it
survived the bundler.

## The canonical demo colour

`#3366ff` is this guide's one worked example — the same colour the sibling Angular fixture uses, so the two
guides' gates read alike — and its conversions are fixed here so no step re-derives them:

| Form | Value |
|---|---|
| hex | `#3366ff` |
| rgb | `rgb(51, 102, 255)` |
| hsl | `hsl(225, 100%, 60%)` |
| hsv | h = 225°, s = 0.80, v = 1.00 |
| hex at alpha 0.5 | `#3366ff80` |
| rgb at alpha 0.5 | `rgba(51, 102, 255, 0.5)` |
| hsl at alpha 0.5 | `hsla(225, 100%, 60%, 0.5)` |

The alpha byte is `round(alpha × 255)`, rounding half up — `0.5 → 128 → 0x80`.

## Naming

- **Identifiers say what they hold or do.** `hueDegrees`, `saturationRatio`, `alphaByte`, `pointerRatioX` —
  never `h`, `s`, `val`, `data`. The unit goes in the name wherever it prevents a mistake: degrees vs ratio is
  exactly the confusion this picker invites.
- **The platform's idioms win where it has one.** `event`, `el`, `host`, `props`, `ref` — these are what MDN
  and the React docs use, and matching them is the teaching move.
- **One concept, one name.** The 0–1 position along a rail is a *ratio* in the code, "position" in the prose,
  and never a "percent" halfway through.

## Code style

- **Function components and hooks.** No class components anywhere in `src/` — the one class in this guide is
  the `HTMLElement` subclass, and it is a DOM class, not a React one.
- **`StrictMode` is never in the element bundle.** It double-invokes effects, which would make a gate reading
  "one `change` event" read two. The step that creates the React root says so in one clause.
- **The custom-element class owns the DOM; React owns everything inside the mount node.** The class attaches
  the shadow root, adopts the stylesheet, creates and unmounts the root, and dispatches events. It never
  reaches into the rendered tree.
- **`part` names are chosen in one deliberate pass, in M5.** A part name is a public promise you have to keep,
  so the theming surface is designed once, as a contract, rather than accreted node by node.
- **Prose says *colour*; code says `color`.** The platform's spelling is `color` — the tag, the CSS property,
  the file names and every identifier use it. Only the English prose around them is British.
- **The colour maths is pure functions in their own file.** No component state reaches into them; they take
  numbers and return numbers, which is what makes their values quotable in a gate.
- **Styles are a TypeScript string, not a `.css` file.** Importing CSS would make Vite emit a second file
  beside the bundle and break the one-`<script>` promise. See D4.

## Gate conventions

- **Every gate names an exact value.** There is no test runner here: your eyes are the assertion. A gate says
  `#ff0000`, at that position, in that readout — never "the colour updates".
- **Every gate is watched after a hard reload**, on a page served over HTTP by a server with caching off. The
  bundle filename never changes, so a cached bundle is this guide's most convincing liar.
- **Every gate names its environment.** See the table above: a gate read against `npm run dev` when it was
  written for the built bundle is a gate that lies in both directions.
