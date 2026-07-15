# Glossary — Live Recolor (VS Code extension)

> Terms the guide introduces, defined in plain language. Ordered alphabetically. Each step defines a term
> inline on first use, then links here. Terms are seeded from the plan; step links are filled as milestones draft.

- **`acquireVsCodeApi()`** — a function available only inside a VS Code webview script that returns the object used to `postMessage` back to the extension; callable exactly once per webview. *(Introduced in M1.)*
- **Activity Bar** — the vertical strip of icons on the far edge of the VS Code window; clicking an icon opens its View Container. *(Introduced in M1.)*
- **Chrome (workbench chrome)** — the editor's surrounding UI (title bar, activity bar, sidebar, status bar, tabs, panels) as opposed to the code text; recolored via `workbench.colorCustomizations`. *(Introduced in M2.)*
- **`ConfigurationTarget`** — the enum choosing *where* a settings write lands: `Global` (User settings, all workspaces) or `Workspace`/`WorkspaceFolder`. *(Introduced in M2.)*
- **Contrast ratio (WCAG)** — a number from 1:1 to 21:1 describing how distinguishable two colors are; AA text wants ≥ 4.5:1, AAA wants ≥ 7:1. *(Introduced in M3.)*
- **Custom set** — a user-saved, named theme (the full set of color customizations) persisted by the extension and shown in "My sets". *(Introduced in M5.)*
- **Extension Development Host** — the second VS Code window that opens when you press F5, running your in-development extension. *(Introduced in M1.)*
- **Generative profile** — a style whose full palette is *derived* from a seed color by the profile's rules (e.g. Neon, Pastel). *(Introduced in M3.)*
- **HSL** — a color model of Hue (0–360°), Saturation (%), Lightness (%); easier than RGB for deriving coordinated palettes. *(Introduced in M3.)*
- **Seed color** — the single base color a generative profile expands into a full coordinated palette. *(Introduced in M3.)*
- **Semantic token** — a code token classified by the language's semantic-tokens provider (e.g. "this identifier is a parameter"), recolored via `editor.semanticTokenColorCustomizations`; only applies when a provider is active and the theme opts in. *(Introduced in M5.)*
- **Signature preset** — a style with a fixed identity palette rather than a seed-derived one (e.g. Game Boy, Synthwave). *(Introduced in M4.)*
- **Snapshot** — a saved copy of the color settings taken *before* an apply, so the change can be reverted exactly. *(Introduced in M2.)*
- **Starter combination** — one of the 5 base 5-color palettes (bg / surface / text / accent1 / accent2) the reader picks as a starting point. *(Introduced in M3.)*
- **Style profile** — the data object (rules or fixed values) defining one of the 13 styles; collected in one registry. *(Introduced in M3.)*
- **TextMate scope** — a dotted name (e.g. `comment.line`, `keyword.control`) identifying a class of syntax tokens, targeted by `editor.tokenColorCustomizations`. *(Introduced in M5.)*
- **View Container** — a grouping in the Activity Bar (or panel) that holds one or more Views; contributed via `contributes.viewsContainers`. *(Introduced in M1.)*
- **Webview View** — a View whose content is an HTML/JS page (a mini web app) rather than a tree; our sidebar panel, contributed with `"type": "webview"`. *(Introduced in M1.)*
- **Workbench color key** — one of VS Code's named themeable UI colors (e.g. `statusBar.background`) settable under `workbench.colorCustomizations`. *(Introduced in M2.)*
