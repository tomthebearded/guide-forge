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
folder, reading an exit code — the step gives both variants rather than picking one. `ls`, `mkdir`, `cd` and
`npx` are written once because they work unchanged in both. The authoritative record is the *Target OS /
shell(s)* row in [stack.md](stack.md).

## Project layout

```
color-picker/          ← the Angular workspace (created by `ng new`)
  src/                 ← the component, the colour maths, the element registration
  dist/color-picker/   ← the built bundle the demo loads
demo/
  index.html           ← the plain-HTML host page: no framework, no build step
```

The demo is deliberately **outside** the Angular workspace and is never processed by the CLI. The moment it
were built by Angular it would stop proving the thing it exists to prove: that a page which knows nothing
about Angular can use the tag.

## The canonical demo colour

`#3366ff` is this guide's one worked example, and its conversions are fixed here so no step re-derives them:

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
- **The platform's idioms win where it has one.** `event`, `el`, `host`, `ctx` — these are what MDN and the
  Angular docs use, and matching them is the teaching move.
- **One concept, one name.** The 0–1 position along a rail is a *ratio* in the code, "position" in the prose,
  and never a "percent" halfway through.

## Code style

- **Standalone components and signals.** No NgModules, no `zone.js`, no `ngOnChanges` where a `computed`
  says it better.
- **`ViewEncapsulation.ShadowDom` on the component.** Set once, in the component that becomes the element.
- **`part` names are chosen in one deliberate pass, in M5.** A part name is a public promise you have to keep,
  so the theming surface is designed once, as a contract, rather than accreted node by node.
- **Prose says *colour*; code says `color`.** The platform's spelling is `color` — the tag, the CSS property,
  the file names and every identifier use it. Only the English prose around them is British.
- **The colour maths is pure functions in their own file.** No component state reaches into them; they take
  numbers and return numbers, which is what makes their values quotable in a gate.

## Gate conventions

- **Every gate names an exact value.** There is no test runner here: your eyes are the assertion. A gate says
  `#ff0000`, at that position, in that readout — never "the colour updates".
- **Every gate is watched after a hard reload**, on a page served over HTTP by a server with caching off. The
  bundle filename never changes (`outputHashing: none`), so a cached bundle is this guide's most convincing
  liar.
