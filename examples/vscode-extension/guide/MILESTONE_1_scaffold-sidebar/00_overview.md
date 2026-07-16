# Milestone M1 — Scaffold + sidebar panel
> Setup · milestone 1 of 5 · prev: — · next: [M2](../MILESTONE_2_nondestructive-backbone/00_overview.md)

## Goal
Stand up a real VS Code extension and give it a home in the editor: an **icon in the Activity Bar** that opens a
**sidebar panel** (a Webview View), and prove the panel and the extension can **talk to each other** — a button
in the panel sends a message the extension receives. Nothing is recolored yet; this milestone builds the surface
everything later hangs off.

**Observable end state:** press <kbd>F5</kbd> → a second VS Code window opens → the Live Recolor icon is in its
Activity Bar → clicking it opens a panel that renders our HTML → clicking the panel's button prints
`[Live Recolor] message from webview: { type: 'ping', text: 'hello from the webview' }` in the Debug Console of
the *first* window.

## Scope discipline (what this milestone deliberately does NOT do)
- **No color writing.** We do not touch `workbench.colorCustomizations` or any setting — that's **M2** (with the
  snapshot/Revert backbone). M1's button just logs; it changes nothing in the editor.
- **No color engine, no palettes, no profiles** — **M3**.
- **No gallery, swatches, or contrast readout** — **M4**.
- **No tokens, persistence, import/export, or packaging** — **M5**.
- **No external webview JS/CSS files yet** — M1 keeps the webview HTML inline in the provider; we externalize it in
  **M4** when the UI grows. (Intentional, recorded here so it isn't mistaken for drift.)

## Prerequisite
None — this is the first milestone. You need Node 24 LTS and VS Code installed (checked in step 01).

## Load-bearing names (must match exactly, everywhere)
| Name | Value | What breaks if it drifts |
|------|-------|--------------------------|
| Extension / package name | `live-recolor` | the `.vsix` filename (M5) and the extension id |
| View Container id | `liveRecolor` | the `contributes.views` key must equal this, or the view has no home |
| View id | `liveRecolor.panel` | the provider's `viewType` must equal this, or the provider never attaches |
| Icon path | `media/icon.svg` | a missing/renamed path = no Activity-Bar icon |
| Provider file | `src/panel/ThemePanelProvider.ts` | import path in `extension.ts` |

*(Cosmetic — rename freely: the display titles "Live Recolor", the description text, the SVG artwork, the button label.)*

## Steps at a glance (grouped into sittings)
**Sitting 1 — Scaffold and run the empty extension (01–03)** — prove the dev loop works before touching anything.
1. [Check prerequisites](01_prerequisites.md)
2. [Scaffold the extension with `yo code`](02_scaffold.md)
3. [First F5 run — the generated Hello World](03_first-run.md)

**Sitting 2 — Add the sidebar panel (04–07)**
4. [Add the Activity-Bar icon asset](04_icon-asset.md)
5. [Declare the View Container + Webview View](05_contribute-view.md)
6. [Create the WebviewViewProvider](06_provider.md)
7. [Register the provider — the panel renders](07_register-provider.md)

**Sitting 3 — Wire the message round-trip (08–09)**
8. [Add a button + script to the webview](08_webview-button.md)
9. [Receive the message in the extension](09_message-roundtrip.md)

**Verify**
10. [Milestone verification + file checkpoint](10_verify.md)

## Design / decisions folded in
- **Unbundled TypeScript** (plain `tsc` → `out/`), no webpack/esbuild — fewer concepts for a reader New to the API;
  packaging in M5 is unaffected. → [conventions.md](../foundation/conventions.md)
- **Two-layer architecture starts here:** the only files we write are the *adapter* (`extension.ts`, `panel/`).
  The `vscode`-free `engine/` doesn't exist until M3. → [conventions.md](../foundation/conventions.md#structure--architecture)
- **Inline HTML + strict CSP + nonce** is the canonical VS Code webview pattern; we teach it now so M4's richer UI
  builds on a secure base. → [decision-log.md](../foundation/decision-log.md#d3--two-layer-architecture-pure-engine--thin-adapter)

## Done-when gate (aggregated — the real test)
- [ ] `node --version` prints `v24.*` and `code --version` prints `1.128.*` (or your pinned line). → step 01
- [ ] `npx … yo code` produced a `live-recolor/` folder that opens in VS Code with no errors. → step 02
- [ ] <kbd>F5</kbd> opens the Extension Development Host and the generated **Hello World** command shows its notification. → step 03
- [ ] After the contribution edit, the **Live Recolor icon appears** in the Extension Development Host's Activity Bar. → step 05
- [ ] Clicking the icon opens a panel that renders **"The control panel will grow here."** → step 07
- [ ] The panel shows a **"Say hello to the extension"** button. → step 08
- [ ] Clicking the button prints `[Live Recolor] message from webview: { type: 'ping', text: 'hello from the webview' }` in the **Debug Console** of the first window. → step 09

## Handoff
### Recap
You scaffolded a TypeScript extension, gave it an Activity-Bar container + a Webview-View panel, and proved
two-way messaging between the webview and the extension host.

### Done so far (cumulative)
- A runnable VS Code extension `live-recolor` with a working F5 dev loop.
- A sidebar panel (Webview View) that renders our own HTML.
- A verified webview→extension message channel.

### Artifacts now in the project
- `live-recolor/` (scaffolded project) — with, modified/added by us: `package.json` (contributions),
  `src/extension.ts` (provider registration), `src/panel/ThemePanelProvider.ts` (the panel), `media/icon.svg`.
- Generator-created and left as-is: `tsconfig.json`, `.vscode/launch.json` + `tasks.json`, ESLint config,
  `src/test/`, `.vscodeignore`, `.gitignore`.

### Decisions / open issues
- Webview HTML is inline for now (externalized in M4). The provider takes no constructor args yet; M4 adds
  `extensionUri` when it needs `asWebviewUri`.

### Next milestone
**[M2 — Non-destructive backbone](../MILESTONE_2_nondestructive-backbone/00_overview.md):** make the button
actually *do* something — apply one workbench color live — but first build the snapshot/Revert/Reset safety net.
Done-when: status bar turns a chosen hex live; Revert restores it exactly; Reset removes the customization.

---
> Setup · milestone 1 of 5 · prev: — · next: [M2](../MILESTONE_2_nondestructive-backbone/00_overview.md)
