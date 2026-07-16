# Verified stack — Live Recolor (VS Code extension)

> Pinned versions and official docs for this guide, verified online on **2026-07-10**.
> Every milestone uses these exact versions. If you're following this later, re-check the "Latest stable"
> column — if it moved, reconcile before following (the review-before-follow gate).

| Tool / library | Pinned version | Latest stable (as of 2026-07-10) | Official docs | Notes (renames · deprecations · install) |
|----------------|----------------|----------------------------------|---------------|------------------------------------------|
| VS Code (engine) | `engines.vscode`: `^1.128.0` | 1.128 (2026-07-08) | https://code.visualstudio.com/updates/v1_128 | Monthly cadence. Webview-View + color APIs stable since 1.49, so a lower floor (`^1.100.0`) works for wider reach; we pin current stable for a consistent teaching target. |
| @types/vscode | `^1.128.0` | 1.128.x | https://www.npmjs.com/package/@types/vscode | Mirrors the VS Code release number. `vsce package` requires `@types/vscode` ≥ `engines.vscode`. |
| Node.js | 24 LTS (e.g. 24.18.0) | Active LTS 24.18.0; Current 26.x | https://nodejs.org/en/about/previous-releases | 20 is EOL (Mar 2026); don't use 26 (not LTS until Oct 2026) for a beginner guide. |
| TypeScript | `^5.9.0` | 7.0.2 (2026-07-08) | https://www.typescriptlang.org/ | **Pin 5.9.x**: TS 7.0 (native compiler) is 2 days old — deliberately avoided here. |
| Scaffolder | `generator-code` via `npx` | generator-code 1.11.x | https://code.visualstudio.com/api/get-started/your-first-extension | Run `npx --package yo --package generator-code -- yo code` (no global install). Officially recommended path. |
| Packaging CLI | `@vscode/vsce` (dev dep / npx) | `@vscode/vsce` | https://code.visualstudio.com/api/working-with-extensions/publishing-extension | **RENAME:** package is `@vscode/vsce` (bare `vsce` is deprecated); the *command* is still `vsce package`. |
| Test/runtime helpers | `@vscode/test-cli`, `@vscode/test-electron` | current | https://code.visualstudio.com/api/working-with-extensions/testing-extension | The legacy `vscode` npm module is dead — never install it. |

## Install (the exact commands, at the pinned versions)
```bash
# Scaffold a new extension (no global install; pick TypeScript when prompted)
npx --package yo --package generator-code -- yo code

# Inside the generated folder, the dev loop is F5 in VS Code (Extension Development Host).
# Packaging (M5) — the command name is still `vsce` even though the package is scoped:
npm install -g @vscode/vsce   # or: npx @vscode/vsce package
vsce package                  # emits live-recolor-<version>.vsix
```

## Version notes
- **`vsce` → `@vscode/vsce`.** The publishing/packaging CLI moved to the scoped npm package; the bare `vsce`
  package is deprecated. The command you type is still `vsce`. — https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- **TypeScript 7.0 exists but is avoided.** 7.0 (the native "Go" compiler) shipped 2026-07-08; this guide pins the
  mature 5.9.x line for a beginner-safe build. — https://www.typescriptlang.org/
- **Node 20 is EOL (Mar 2026); Node 26 is not LTS until Oct 2026.** Use Node 24 LTS. — https://nodejs.org/en/about/previous-releases

## Verified API facts steps must honor (exact spelling — load-bearing)
- Register the sidebar UI with **`vscode.window.registerWebviewViewProvider(viewId, provider)`**; the provider
  implements **`WebviewViewProvider.resolveWebviewView(webviewView, context, token)`**.
- The `contributes.views` entry **must include `"type": "webview"`** and the webview **must set
  `webview.options = { enableScripts: true }`** — the two top "nothing happens" traps.
- Manifest keys: **`contributes.viewsContainers.activitybar`** (`{ id, title, icon }`) + **`contributes.views`**
  (keyed by container id; `{ id, name, type: "webview" }`).
- Messaging: extension→webview `webviewView.webview.postMessage(data)`; webview→extension
  `webviewView.webview.onDidReceiveMessage(handler)`; in the webview script `const vscode = acquireVsCodeApi()`
  (callable **once**), then `vscode.postMessage(data)`.
- The three settings (exact IDs): **`workbench.colorCustomizations`**, **`editor.tokenColorCustomizations`**,
  **`editor.semanticTokenColorCustomizations`**.
- Per-theme scoping inside a customization object uses a **`"[Theme Display Name]"`** key (wildcards `*`,
  multiple `[A][B]` = OR).
- Per-**language** scoping uses a top-level **`"[languageId]"`** key and applies to `editor.*` settings only
  (tokens), **not** `workbench.colorCustomizations`.
- Write settings with **`vscode.workspace.getConfiguration().update(section, value, ConfigurationTarget.Global)`**
  (`Global = 1`, `Workspace = 2`); `await` it; changes apply **live**. Observe external edits with
  `vscode.workspace.onDidChangeConfiguration`.

> **Unverified?** This table was verified online on 2026-07-10. Two caveats from that check: the exact TS patch
> (`7.0.2`) was search-corroborated but not fetched first-party (npm returned 403), and the TypeScript version a
> fresh `yo code` scaffold pins is resolved at run time — confirm it by reading the emitted `package.json`.
