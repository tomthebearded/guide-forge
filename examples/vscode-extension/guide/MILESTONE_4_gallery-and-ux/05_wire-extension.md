# M4 · Step 05 of 6 — Wire `extensionUri` into the provider from `extension.ts`
> Nav: [← Rewrite the provider](04_provider-externalize.md) · [Overview](00_overview.md) · [Verify + reality check →](06_verify.md)

## Why / design
Step 04 changed the provider's constructor to `(extensionUri, history)`. `extension.ts` still calls it the M3 way
(`new ThemePanelProvider(history)`), which is the one compile error left. This step passes the extension's install
folder in, closing the gap. It's a one-line change to the `new ThemePanelProvider(...)` call.

> 🧠 **New concept — `context.extensionUri`.** When VS Code activates your extension it hands `activate` an
> **`ExtensionContext`**. Its **`extensionUri`** is a `Uri` pointing at your extension's **install directory on
> disk** — the folder that contains `package.json`, `out/`, and `media/`. That's exactly the anchor the provider
> needs to build paths to `media/webview/main.js` and `styles.css` (via `Uri.joinPath`) and to whitelist `media/`
> in `localResourceRoots`. Prefer `extensionUri` over the older string `extensionPath`: it's a proper `Uri`, so it
> composes with `Uri.joinPath` and works across remote/virtual filesystems. Docs:
> [ExtensionContext.extensionUri](https://code.visualstudio.com/api/references/vscode-api#ExtensionContext).

## Do this
This step **edits one file**: `src/extension.ts`.

1. Open `src/extension.ts`.
2. Change the provider construction to pass `context.extensionUri` **first**, then the existing `history`:
   `new ThemePanelProvider(context.extensionUri, history)`. The argument **order matters** — it must match the
   constructor signature from step 04 (`extensionUri, history`).
3. Everything else stays as M2/M3 left it: `history` is still created, the `registerWebviewViewProvider` call and
   `context.subscriptions.push(...)` are unchanged, `deactivate` stays empty.
4. Save; it recompiles. With this in place there should be **no** compile errors anywhere.

## Code
`src/extension.ts` — the complete M4 version:
```ts
import * as vscode from 'vscode';
import { ThemePanelProvider } from './panel/ThemePanelProvider';
import { ThemeHistory } from './theme/history';

export function activate(context: vscode.ExtensionContext): void {
  const history = new ThemeHistory();
  const provider = new ThemePanelProvider(context.extensionUri, history);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ThemePanelProvider.viewType, provider),
  );
}

export function deactivate(): void {}
```

> Forward note (no action): in M5 the constructor gains `context` for `globalState` — the extension's built-in
> key→value store that VS Code persists across reloads (used to save named sets; taught in full in
> [M5 step 05](../MILESTONE_5_tokens-persistence-packaging/05_storage.md)) — becoming
> `new ThemePanelProvider(context.extensionUri, context, history)`. Not now — M4 needs only `extensionUri`.

## Done when (this step)
- `src/extension.ts` matches the code above and the whole project **compiles with zero errors** (the step-04 error
  in `extension.ts` is gone).
- The extension is now fully wired: pressing <kbd>F5</kbd> and opening the panel should render the gallery. Prove
  it fully in step 06 — but a quick smoke test: F5, open Live Recolor, and confirm you see chip rows rather than a
  blank panel or the old dropdowns.

## If it breaks
- **`Expected 2 arguments, but got 1`** → you left the old `new ThemePanelProvider(history)`; it must be
  `new ThemePanelProvider(context.extensionUri, history)`.
- **Arguments in the wrong order (`history, context.extensionUri`)** → TypeScript will complain that a
  `ThemeHistory` isn't a `Uri`; match the step-04 signature: `extensionUri` first.
- **`Cannot find name 'ThemeHistory'`** → the `import { ThemeHistory } from './theme/history';` line got dropped;
  it's been there since M2.

---
> Nav: [← Rewrite the provider](04_provider-externalize.md) · [Overview](00_overview.md) · [Verify + reality check →](06_verify.md)
