# M1 · Step 08 of 10 — Add a button + script to the webview
> Nav: [← Register provider](07_register-provider.md) · [Overview](00_overview.md) · [Message round-trip →](09_message-roundtrip.md)

## Why / design
Now we make the panel interactive. We add a button and a small script that, on click, sends a message *out* of the
webview toward the extension. This step only sends; step 09 receives.

> 🧠 **New concept — `acquireVsCodeApi()`.** Inside a webview script, VS Code injects one global function,
> `acquireVsCodeApi()`. It returns the bridge object you use to talk to the extension — `vscode.postMessage(data)`
> sends a message to the extension side. **Call it exactly once** and keep the result; calling it twice throws.
> Docs: [Webview → passing messages](https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-a-webview-to-an-extension).

> 🧠 **New concept — the nonce & script-src.** Our CSP set `default-src 'none'`, which also blocks scripts. To allow
> our *one* script (and nothing injected by anything else), we generate a random one-time token — a **nonce** — add
> `script-src 'nonce-<token>'` to the CSP, and put the same `nonce="<token>"` on the `<script>` tag. Only a script
> carrying that exact nonce runs. This is the standard webview security pattern. Docs:
> [Webview → content security](https://code.visualstudio.com/api/extension-guides/webview#content-security-policy).

## Do this
This step **edits one file**: `src/panel/ThemePanelProvider.ts`. Three changes:
1. Add a `getNonce()` helper (bottom of the file).
2. In `getHtml`, compute a `nonce` and add `script-src 'nonce-${nonce}'` to the CSP.
3. Add the `<button>` and the `<script nonce="${nonce}">…</script>` to the body.

The message payload shape — `{ type: 'ping', text: 'hello from the webview' }` — is **load-bearing**: step 09
reads `type` and logs the object, and the verify gate checks this exact text. The button's visible label is
cosmetic.

Replace the whole file with the version below, then save (it recompiles on save).

## Code
`src/panel/ThemePanelProvider.ts`
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
- Reopen/relaunch the panel in the EDH (<kbd>F5</kbd> or restart): it now shows a button labelled
  **"Say hello to the extension"** under the intro text.
- Clicking the button **does nothing visible yet** — that's expected; the receiver is step 09. (If you want proof
  the script loads, the button simply exists and is clickable without a CSP error in the webview.)

## If it breaks
- **The button doesn't appear / page looks unchanged** → you may be seeing a cached EDH; stop debugging and F5
  again. Confirm the file saved and compiled.
- **The webview is blank and the Webview Developer Tools console shows a CSP violation** → the `script-src
  'nonce-…'` fragment is missing from the CSP `<meta>`, or the `nonce="…"` on the `<script>` doesn't match. Both use
  the same `${nonce}` — don't hard-code one. (Open those dev tools via Command Palette → **Developer: Open Webview
  Developer Tools**.)
- **`acquireVsCodeApi is not defined`** → `enableScripts: true` isn't set, so the script never ran; confirm it's in
  `resolveWebviewView`.

---
> Nav: [← Register provider](07_register-provider.md) · [Overview](00_overview.md) · [Message round-trip →](09_message-roundtrip.md)
