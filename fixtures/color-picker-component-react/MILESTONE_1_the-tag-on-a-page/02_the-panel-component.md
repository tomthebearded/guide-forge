# Milestone 1 · Step 02 of 07 — The panel component
> Nav: [← Create the workspace](01_create-the-workspace.md) · [Overview](00_overview.md) · [The custom element →](03_the-custom-element.md)

## Before you start

Step 01 done: the workspace exists and `npm run dev` is running with the stock page open.

## Glossary for this step

- [function component](../foundation/glossary.md#function-component) — defined under *Do this*, action 1.

## Why / design

The picker is a React component before it is anything else. This step writes the smallest version of it that
is worth looking at — a panel with a colour swatch and a text readout — and throws the template's demo code
away in the same breath, so nothing is left behind that you would later wonder about.

**This step touches four files, committed together:** it creates `src/ColorPicker.tsx`, rewrites
`src/main.tsx`, and deletes `src/App.tsx`, `src/App.css`, `src/index.css` and `src/assets/`. They go together
because `main.tsx` imports the files being deleted — splitting them would leave you with a project that does
not compile, and no step in this guide ends that way.

The swatch is hard-coded to `#3366ff` here. It stays hard-coded until M2 gives the component a colour it can
actually change.

## Do this

1. **Create `src/ColorPicker.tsx`** with the whole file below.

   > **New concept — function component.** In React, a component is a plain function that returns markup. The
   > markup is JSX: HTML-looking syntax that the build step turns into function calls. A component's name
   > must start with a capital letter — that is how JSX tells `<ColorPicker />` (your component) apart from
   > `<div />` (an HTML tag). ([Your First Component](https://react.dev/learn/your-first-component))

   ```tsx
   // src/ColorPicker.tsx — the whole file
   export function ColorPicker() {
     const hexText = '#3366ff';

     return (
       <div className="panel">
         <div className="swatch" style={{ background: hexText }} />
         <div className="readout">{hexText}</div>
       </div>
     );
   }
   ```

   Three things in that block are React spellings rather than HTML ones, and they will recur in every
   component file in this guide:

   - `className` instead of `class` — `class` is a reserved word in JavaScript.
   - `style` takes an **object**, not a string, and its keys are camelCased.
   - `{hexText}` puts a JavaScript value into the markup. Braces mean "evaluate this".

   The class names `panel`, `swatch` and `readout` are **load-bearing** from step 04 onwards: the stylesheet
   you write there selects on exactly these. The variable name `hexText` is yours to change.

2. **Rewrite `src/main.tsx`** with the whole file below. It replaces the template's version, which imported
   the files you are about to delete.

   ```tsx
   // src/main.tsx — the whole file, replacing what the template wrote
   import { createRoot } from 'react-dom/client';
   import { ColorPicker } from './ColorPicker';

   createRoot(document.getElementById('root')!).render(<ColorPicker />);
   ```

   The trailing `!` is TypeScript's non-null assertion: `getElementById` can return `null`, and you are telling
   the compiler that this one will not, because `index.html` contains `<div id="root">`. This file is
   temporary — step 03 deletes it too, once the component has a real home.

3. **Delete the template's demo files.** All four, plus the assets folder.

   ```bash
   # bash
   rm -rf src/App.tsx src/App.css src/index.css src/assets
   ```

   ```powershell
   # PowerShell
   Remove-Item -Recurse -Force src/App.tsx, src/App.css, src/index.css, src/assets
   ```

4. **Look at the page.** The dev server rebuilt as you saved. The styling is gone with `index.css`, so what you
   get is unstyled — a blue rectangle with no height (the swatch has no size yet) and the text `#3366ff`. That
   is correct; step 04 gives it dimensions.

## Done when (this step)

- The dev page shows the text `#3366ff`, and none of the template's demo page is left — no logos, no heading,
  no counter button. (What that heading *said* varies by template version; that it is gone does not.)
- The terminal running `npm run dev` shows no error and has not stopped.
- `npm run build` exits without printing an error and writes a `dist/` folder. (Run it in a second terminal so
  the dev server keeps running. This is a build check only — the output is not yet the shape the demo needs;
  step 05 fixes that.)

## If it breaks

- **The page is blank and the browser console says `Failed to resolve import "./App.css"`.** `main.tsx` was
  not fully replaced — the template's imports are still at the top. Its complete contents are in action 2.
- **`npm run build` fails with `Cannot find module './App'`.** Same cause, seen by the type-checker instead:
  `npm run build` runs `tsc -b` before Vite.
- **The page still shows the counter.** The browser is holding an old module. Hard-reload it
  (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd>, <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd> on macOS).

---
> Nav: [← Create the workspace](01_create-the-workspace.md) · [Overview](00_overview.md) · [The custom element →](03_the-custom-element.md)
