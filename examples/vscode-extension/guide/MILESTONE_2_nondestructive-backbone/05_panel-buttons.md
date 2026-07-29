# M2 · Step 05 of 6 — Panel buttons: Apply demo / Revert / Reset
> Nav: [← Wire extension](04_wire-extension.md) · [Overview](00_overview.md) · [Verify →](06_verify.md)

## Why / design
Now the panel drives the backbone. We rewrite the provider so it (1) receives the shared `ThemeHistory` in its
constructor, (2) renders three buttons, and (3) routes each button's message to the matching history call. This
closes the loop M1 opened: the webview posts a message, `onDidReceiveMessage` receives it, and — new in M2 — the
extension *acts* on it by writing a setting through the safe path.

The message protocol is three flat message types, mirroring the three buttons:
- **`applyDemo`** → `history.apply(() => applyChrome({ 'statusBar.background': '#e11d48', 'statusBar.foreground': '#ffffff' }))`.
  The `history.apply` wrapper snapshots first, so this is reversible.
- **`revert`** → `history.revert()`.
- **`reset`** → `history.reset()`.

Notice the provider never calls `getConfiguration().update(...)` itself — it goes through `applyChrome` and
`ThemeHistory`. That's the single-write-path convention holding: the panel decides *what* to apply; `theme/` decides
*how* to write it safely.

The demo apply uses the exact hexes `#e11d48` (a crimson red) on `statusBar.background` and `#ffffff` on
`statusBar.foreground` — both **load-bearing** (the verify gate checks these values in `settings.json`). The message
type strings `applyDemo` / `revert` / `reset` are **load-bearing** too: the webview posts them and `onMessage`'s
`switch` reads them — a mismatch is a dead button with no error. The button **labels** are cosmetic.

## Do this
This step **replaces** the whole contents of `src/panel/ThemePanelProvider.ts` (the M1 version rendered the ping
demo; we swap in the M2 version).

1. Open `src/panel/ThemePanelProvider.ts`.
2. Select all and replace it with the code below. What changed from M1:
   - **Imports** `ThemeHistory` (from `../theme/history`) and `applyChrome` (from `../theme/apply`).
   - **Adds** `constructor(private readonly history: ThemeHistory) {}` — this consumes the argument step 04 passed,
     clearing that compile error. *(TS reminder — `private readonly` on a constructor param declares and assigns the
     field in one line.)*
   - **Adds** `onMessage`, a `switch` over `m.type` doing the three history calls above, and wires it with
     `onDidReceiveMessage((m) => this.onMessage(m))`.
   - **Rewrites** the HTML body: three `<button>`s and an inline nonce'd script that posts one message type per
     button. The CSP + `getNonce()` pattern is unchanged from M1 (script allowed only via the matching nonce).
3. Save. If the `watch` task is running it recompiles; otherwise run `npm run compile`. The step-04 error is now gone.
4. Press <kbd>F5</kbd> (or stop the EDH with <kbd>Shift</kbd>+<kbd>F5</kbd> and F5 again) and open the Live Recolor panel.

## Code
`src/panel/ThemePanelProvider.ts` *(the M2 version — a near-total rewrite of the M1 provider; the complete file is also in [06_verify.md](06_verify.md))*
```ts
import * as vscode from 'vscode';
import { ThemeHistory } from '../theme/history';
import { applyChrome } from '../theme/apply';

export class ThemePanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'liveRecolor.panel';

  constructor(private readonly history: ThemeHistory) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.getHtml(webviewView.webview);
    webviewView.webview.onDidReceiveMessage((m) => this.onMessage(m));
  }

  private async onMessage(m: { type: string }): Promise<void> {
    switch (m.type) {
      case 'applyDemo':
        await this.history.apply(() =>
          applyChrome({ 'statusBar.background': '#e11d48', 'statusBar.foreground': '#ffffff' }),
        );
        break;
      case 'revert':
        await this.history.revert();
        break;
      case 'reset':
        await this.history.reset();
        break;
    }
  }

  private getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';" />
  <title>Live Recolor</title>
</head>
<body>
  <h3>Live Recolor</h3>
  <button id="apply">Apply demo (red status bar)</button>
  <button id="revert">Revert</button>
  <button id="reset">Reset</button>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    document.getElementById('apply').addEventListener('click', () => vscode.postMessage({ type: 'applyDemo' }));
    document.getElementById('revert').addEventListener('click', () => vscode.postMessage({ type: 'revert' }));
    document.getElementById('reset').addEventListener('click', () => vscode.postMessage({ type: 'reset' }));
  </script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) { text += possible.charAt(Math.floor(Math.random() * possible.length)); }
  return text;
}
```

## Done when (this step)
- The project compiles with **no** errors (the step-04 "Expected 0 arguments" error is resolved by the new constructor).
- In the EDH, opening the Live Recolor panel shows a heading **"Live Recolor"** and three buttons:
  **Apply demo (red status bar)**, **Revert**, **Reset**.
- Clicking **Apply demo** turns the EDH's status bar crimson (`#e11d48`) with white text, **live**. (The full
  apply → revert → reset walkthrough, with the `settings.json` diffs, is the milestone gate in [step 06](06_verify.md).)

## If it breaks
- **Still "Expected 0 arguments, but got 1"** → the constructor line is missing or misplaced; it must be
  `constructor(private readonly history: ThemeHistory) {}` inside the class.
- **Buttons render but nothing happens on click** → most likely a message-type mismatch (the posted `type` string
  must equal a `case` in `onMessage`), or a CSP/nonce problem (open **Developer: Open Webview Developer Tools** and
  look for a CSP violation — the `script-src 'nonce-…'` and the `<script nonce="…">` must share the same `${nonce}`).
- **Status bar doesn't change but no error** → confirm `applyChrome` is imported from `../theme/apply` and the demo
  object uses the exact keys `statusBar.background` / `statusBar.foreground`. Also make sure you relaunched the EDH
  after compiling (<kbd>Shift</kbd>+<kbd>F5</kbd> then <kbd>F5</kbd>).
- **`acquireVsCodeApi is not defined`** → `enableScripts: true` isn't set in `resolveWebviewView`; confirm it's there.

---
> Nav: [← Wire extension](04_wire-extension.md) · [Overview](00_overview.md) · [Verify →](06_verify.md)
