# M1 · Step 09 of 10 — Receive the message in the extension
> Nav: [← Webview button](08_webview-button.md) · [Overview](00_overview.md) · [Verify →](10_verify.md)

## Why / design
The button sends a message; now the extension must **listen** for it. This closes the loop and is the pattern every
later milestone uses — the panel's controls will send messages ("apply this preset", "revert"), and the extension
will act on them.

> 🧠 **New concept — `onDidReceiveMessage`.** The extension side of the bridge. `webviewView.webview
> .onDidReceiveMessage(handler)` fires your handler every time the webview calls `vscode.postMessage(...)`; the
> argument is exactly the object you posted. Together with `webview.postMessage(...)` (extension → webview, used
> later) this is the full two-way channel. Docs:
> [Webview → passing messages](https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-a-webview-to-an-extension).

> 🧠 **New concept — where `console.log` goes.** Webview logs go to the *Webview* dev tools, but **extension-side**
> `console.log` (this handler runs in the extension host) prints to the **Debug Console of the first window** — the
> one you pressed F5 from — **not** the EDH. This trips up nearly everyone once. Docs:
> [Debugging the extension](https://code.visualstudio.com/api/get-started/your-first-extension#_debugging-the-extension).

## Do this
This step **edits one file**: `src/panel/ThemePanelProvider.ts` — adding a listener inside `resolveWebviewView`.
Everything else stays as in step 08.

1. In `resolveWebviewView`, **after** the `webviewView.webview.html = …` line, add the `onDidReceiveMessage` block
   shown below.
2. Save (it recompiles).
3. Press <kbd>F5</kbd> to relaunch the EDH with the new build.
4. In the **first** window (the `live-recolor` one), open the **Debug Console**: **View → Debug Console** (or
   <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Y</kbd>).
5. In the **EDH**, open the Live Recolor panel and click **"Say hello to the extension"**.
6. Watch the Debug Console in the first window.

## Code
`src/panel/ThemePanelProvider.ts` — the **complete file** after this step. The only change from step 08 is the
`onDidReceiveMessage` block inside `resolveWebviewView` (marked below); everything else is byte-for-byte the
step-08 file.
```ts
import * as vscode from 'vscode';

export class ThemePanelProvider implements vscode.WebviewViewProvider {
  // Must match the view id declared in package.json (contributes.views).
  public static readonly viewType = 'liveRecolor.panel';

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    // Allow the page to run scripts.
    webviewView.webview.options = { enableScripts: true };

    // Fill the panel with our HTML.
    webviewView.webview.html = this.getHtml(webviewView.webview);

    // ADDED THIS STEP — listen for messages the webview sends (see the <script> in getHtml).
    webviewView.webview.onDidReceiveMessage((message) => {
      console.log('[Live Recolor] message from webview:', message);
    });
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
  <p>The control panel will grow here.</p>
  <button id="ping">Say hello to the extension</button>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    document.getElementById('ping').addEventListener('click', () => {
      vscode.postMessage({ type: 'ping', text: 'hello from the webview' });
    });
  </script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
```

## Done when (this step)
- Clicking the button prints this line in the **first window's Debug Console**:
  ```
  [Live Recolor] message from webview: { type: 'ping', text: 'hello from the webview' }
  ```
  (The object may render with slightly different spacing/quoting depending on VS Code's console formatting; the
  `type` and `text` values must match exactly.)
- Clicking again prints it again — one line per click.

## If it breaks
- **No log line appears** → you're almost certainly watching the wrong console. It must be the **Debug Console of
  the first window**, not the EDH's, and not the webview dev tools. Re-read the second callout above.
- **Still nothing** → confirm the handler is inside `resolveWebviewView` and the build recompiled (check the watch
  task terminal for errors), then F5 again.
- **The line prints but `message` is `undefined`** → the webview posted nothing; check step 08's `postMessage`
  payload is `{ type: 'ping', text: 'hello from the webview' }`.

---
> Nav: [← Webview button](08_webview-button.md) · [Overview](00_overview.md) · [Verify →](10_verify.md)
