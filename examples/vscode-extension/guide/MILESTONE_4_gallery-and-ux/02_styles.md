# M4 · Step 02 of 6 — Create `media/webview/styles.css`
> Nav: [← Signature presets](01_signature-profiles.md) · [Overview](00_overview.md) · [The gallery script →](03_main-js.md)

## Why / design
Through M3 the panel's markup lived inside a template string in the provider, and its only styling was the
browser default. M4's UI — chip rows, a swatch strip, a contrast badge — needs real CSS, and cramming a growing
stylesheet into a TypeScript string is miserable to edit and impossible to lint. So we lift it out into a real
**`media/webview/styles.css`** file (step 04 rewrites the provider to link it). This step just writes the file;
nothing renders differently until step 04 wires it up.

> 🧠 **New concept — VS Code webview CSS variables (`var(--vscode-…)`).** A webview is a sandboxed iframe with its
> *own* blank page — it does **not** inherit the editor's theme. To make your panel match whatever theme the user
> runs, VS Code injects a set of **CSS custom properties** onto the webview's root, named after theme colors:
> `--vscode-font-family`, `--vscode-foreground`, `--vscode-button-background`, `--vscode-input-background`, and so
> on. You read them with `var(--vscode-foreground)`. Because they update when the user switches theme, styling with
> them means the panel restyles itself for free. Always give a **fallback** for any variable that might be absent in
> some themes: `var(--vscode-button-border, transparent)` uses `transparent` if the variable isn't set. Docs:
> [Webview → theming with CSS variables](https://code.visualstudio.com/api/extension-guides/webview#theming-webview-content).

> 🧠 **New concept — why webview assets live in `media/`, not `src/`.** VS Code loads `styles.css` and `main.js`
> **at runtime, as files on disk** (via `asWebviewUri`, step 04) — they are not compiled into `out/` like your
> TypeScript. The generator's **`.vscodeignore`** excludes `src/**` from the packaged `.vsix`, so a webview asset
> placed under `src/` would work during F5 but **vanish from the shipped extension**. Assets under `media/` are
> kept. We externalize into `media/webview/` **now** so M5's `vsce package` step just works — no last-minute file
> shuffle. (This is a forward-reference to M5; nothing to do about packaging yet.) Docs:
> [Publishing → `.vscodeignore`](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#advance-usage).

## Do this
This step creates **one file**: `media/webview/styles.css`.

1. In the Explorer, inside the existing **`media/`** folder (created in M1 for `icon.svg`), create a subfolder
   **`media/webview/`**.
2. Create the file **`media/webview/styles.css`** (this exact path is load-bearing — step 04's `asWebviewUri` call
   points at it).
3. Paste the CSS below **verbatim**. Notes on the rules that carry weight later:
   - `.chip` / `.btn` are the clickable gallery buttons; `.chip.active` marks the currently selected combo/style
     (step 03 toggles that class).
   - `.swatches` / `.swatch` lay out the 8-color palette strip; a `.swatch`'s color is set inline by `main.js`.
   - `.badge` plus `.badge.ok` / `.badge.warn` / `.badge.bad` style the WCAG contrast readout (green/amber/red).
   - `.text` and `.muted` are used by M5's inputs and empty-state text; we write the **whole final stylesheet now**
     so M5 doesn't have to touch this file — a few rules will simply go unused until then. That's intentional, not
     dead code.
4. Everything here is **cosmetic** — class names, colors, sizes. You can restyle freely as long as `main.js`
   (step 03) uses the same class names.
5. Save.

## Code
`media/webview/styles.css` — the complete, final stylesheet:
```css
body { font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); color: var(--vscode-foreground); padding: 8px; }
h4 { margin: 12px 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; opacity: .8; }
.section { margin-bottom: 8px; }
.row { display: flex; flex-wrap: wrap; gap: 6px; }
.chip, .btn {
  font: inherit; cursor: pointer; border-radius: 4px; padding: 4px 8px;
  border: 1px solid var(--vscode-button-border, transparent);
  background: var(--vscode-button-secondaryBackground, #2a2d2e); color: var(--vscode-button-secondaryForeground, #ccc);
}
.chip.active { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
.chip:hover, .btn:hover { background: var(--vscode-button-hoverBackground); }
.text { width: 100%; box-sizing: border-box; padding: 4px 6px; margin-bottom: 6px;
  background: var(--vscode-input-background); color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border, #3c3c3c); border-radius: 4px; }
.swatches { display: flex; gap: 4px; margin-bottom: 6px; }
.swatch { width: 22px; height: 22px; border-radius: 4px; border: 1px solid rgba(255,255,255,.15); }
.badge { font-size: 11px; padding: 2px 6px; border-radius: 4px; }
.badge.ok { background: #1a7f37; color: #fff; }
.badge.warn { background: #9a6700; color: #fff; }
.badge.bad { background: #b62324; color: #fff; }
.muted { opacity: .6; }
```

## Done when (this step)
- The file **`media/webview/styles.css`** exists with the content above.
- Nothing changes in the running panel **yet** — the provider still serves the old inline HTML and doesn't link
  this file. It gets linked in step 04. (If you want proof the folder is right, the Explorer should show
  `media/webview/styles.css` as a sibling of `media/icon.svg`'s parent — i.e. `media/webview/` next to
  `media/icon.svg`.)

## If it breaks
- **The file landed under `src/`** → move it to `media/webview/`. Under `src/` it will be stripped from the `.vsix`
  in M5, and step 04's `localResourceRoots` (which only whitelists `media`) won't let the webview load it.
- **You're unsure the `.badge`/`.text`/`.muted` rules belong here** → they do; the final stylesheet is written once,
  in M4. M5 reuses it unchanged.

---
> Nav: [← Signature presets](01_signature-profiles.md) · [Overview](00_overview.md) · [The gallery script →](03_main-js.md)
