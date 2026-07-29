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
This step **edits one file**: `src/panel/ThemePanelProvider.ts` (from [step 08](08_webview-button.md)) — adding a
listener inside `resolveWebviewView`. Everything else stays byte-for-byte as in step 08.

**In `resolveWebviewView`, immediately after the `webviewView.webview.html = this.getHtml(webviewView.webview);` line, add this block:**
```ts
    // ADDED THIS STEP — listen for messages the webview sends (see the <script> in getHtml).
    webviewView.webview.onDidReceiveMessage((message) => {
      console.log('[Live Recolor] message from webview:', message);
    });
```

Then:
1. Save (it recompiles).
2. Press <kbd>F5</kbd> to relaunch the EDH with the new build.
3. In the **first** window (the `live-recolor` one), open the **Debug Console**: **View → Debug Console** (or
   <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Y</kbd>).
4. In the **EDH**, open the Live Recolor panel and click **"Say hello to the extension"**.
5. Watch the Debug Console in the first window.

*(The complete `src/panel/ThemePanelProvider.ts` after this step is shown whole in [10_verify.md](10_verify.md).)*

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
