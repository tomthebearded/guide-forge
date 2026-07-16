# M1 · Step 07 of 10 — Register the provider (the panel renders)
> Nav: [← Provider](06_provider.md) · [Overview](00_overview.md) · [Webview button →](08_webview-button.md)

## Why / design
A provider does nothing until VS Code knows about it. You register it in your extension's **`activate`** function,
which VS Code runs when the extension wakes up. After this, opening the panel triggers `resolveWebviewView` and your
HTML appears.

> 🧠 **New concept — `activate` / `deactivate` & the activation lifecycle.** Every extension exports an `activate`
> function; VS Code calls it once, the first time the extension is needed. *When* it's "needed" is set by
> **activation events** — and because we contributed a view, VS Code auto-activates us when that view is first
> opened (that's why `activationEvents` stayed `[]`). `deactivate` runs on shutdown for cleanup. Docs:
> [Activation events](https://code.visualstudio.com/api/references/activation-events).

> 🧠 **New concept — `context.subscriptions` & disposables.** Most `register…` API calls return a **Disposable** — a
> handle whose `.dispose()` tears down what you registered. Pushing it onto `context.subscriptions` lets VS Code
> dispose it automatically when your extension unloads, so you don't leak registrations. Docs:
> [registerWebviewViewProvider](https://code.visualstudio.com/api/references/vscode-api#window.registerWebviewViewProvider).

## Do this
This step **replaces** the whole contents of `src/extension.ts` (the scaffold filled it with the Hello World
command, which we no longer contribute).

1. Open `src/extension.ts`.
2. Select all and replace it with the code below.
3. Note the registration argument order: `registerWebviewViewProvider(viewType, provider)` — `viewType` is the view
   id string, taken from `ThemePanelProvider.viewType` so the two can never drift.
4. Save. If the watch task is running, it recompiles automatically; otherwise run `npm run compile`.
5. Press <kbd>F5</kbd> (or restart the EDH), then click the **palette icon** in the EDH's Activity Bar.

## Code
`src/extension.ts`
```ts
import * as vscode from 'vscode';
import { ThemePanelProvider } from './panel/ThemePanelProvider';

export function activate(context: vscode.ExtensionContext): void {
  const provider = new ThemePanelProvider();

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ThemePanelProvider.viewType, provider),
  );
}

export function deactivate(): void {}
```

## Done when (this step)
- Clicking the Live Recolor icon in the EDH opens the panel and it renders:
  - a heading **"Live Recolor"**, and
  - the line **"The control panel will grow here."**
- No error notification appears.

## If it breaks
- **Panel still empty / "no data provider"** → the `viewType` string and the `package.json` view `id` don't match.
  Both must be exactly `liveRecolor.panel`. (Restart the EDH after fixing — contribution changes need a reload.)
- **`Cannot find name 'ThemePanelProvider'`** → the import path is wrong; it must be `./panel/ThemePanelProvider`
  (no `.ts` extension), matching the file from step 06.
- **Nothing changed after F5** → you may be looking at a stale EDH; stop debugging (<kbd>Shift</kbd>+<kbd>F5</kbd>)
  and press F5 again to relaunch with the new build.

---
> Nav: [← Provider](06_provider.md) · [Overview](00_overview.md) · [Webview button →](08_webview-button.md)
