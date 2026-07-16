# M1 · Step 10 of 10 — Verify the milestone + file checkpoint
> Nav: [← Message round-trip](09_message-roundtrip.md) · [Overview](00_overview.md) · [M2 → Non-destructive backbone](../MILESTONE_2_nondestructive-backbone/00_overview.md)

## Done-when gate (run every check)
Do these in order; each pairs an action with the **exact** result you should see.

1. **Toolchain** — in the project terminal:
   - `node --version` → `v24.*`
   - `code --version` → first line `1.128.*`
2. **Project exists** — the Explorer shows `live-recolor/` with `package.json`, `src/extension.ts`,
   `src/panel/ThemePanelProvider.ts`, and `media/icon.svg`. `package.json` `"name"` is `live-recolor`.
3. **Dev loop** — press <kbd>F5</kbd> → a window titled **[Extension Development Host]** opens with no error
   notification.
4. **Activity-Bar icon** — the EDH's Activity Bar shows the **palette icon**.
5. **Panel renders** — clicking it opens a panel showing **"Live Recolor"** and **"The control panel will grow
   here."**, plus a button **"Say hello to the extension"**.
6. **Message round-trip** — with the **first window's Debug Console** open (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Y</kbd>),
   click the button → this line appears:
   ```
   [Live Recolor] message from webview: { type: 'ping', text: 'hello from the webview' }
   ```

If all six pass, M1 is done: you have a runnable extension with an interactive sidebar panel wired to the extension
host. Nothing is recolored yet — that's M2.

## Files after this milestone (complete current contents)
These are the files **we created or modified**. Generator-created files we didn't touch (`tsconfig.json`,
`.vscode/launch.json` + `tasks.json`, ESLint config, `src/test/`, `.vscodeignore`, `.gitignore`,
`CHANGELOG.md`) are left exactly as scaffolded.

### `package.json`
> Your `devDependencies` version numbers are whatever the generator resolved on your scaffold day; they mirror the
> pinned lines in [stack.md](../foundation/stack.md) (`typescript ^5.9`, `@types/vscode ^1.128`). **Don't hand-edit
> them.** The only parts we authored are `engines.vscode` (confirm) and the whole `contributes` block.
```jsonc
{
  "name": "live-recolor",
  "displayName": "Live Recolor",
  "description": "Live-recolor the whole editor from a sidebar panel.",
  "version": "0.0.1",
  "engines": {
    "vscode": "^1.128.0"
  },
  "categories": [
    "Other"
  ],
  "activationEvents": [],
  "main": "./out/extension.js",
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "liveRecolor",
          "title": "Live Recolor",
          "icon": "media/icon.svg"
        }
      ]
    },
    "views": {
      "liveRecolor": [
        {
          "id": "liveRecolor.panel",
          "name": "Live Recolor",
          "type": "webview"
        }
      ]
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "pretest": "npm run compile && npm run lint",
    "lint": "eslint src",
    "test": "vscode-test"
  },
  "devDependencies": {
    "@types/vscode": "^1.128.0",
    "@types/node": "24.x",
    "@types/mocha": "^10.0.10",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint": "^9.0.0",
    "typescript": "^5.9.0",
    "@vscode/test-cli": "^0.0.11",
    "@vscode/test-electron": "^2.4.0"
  }
}
```

### `src/extension.ts`
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

### `src/panel/ThemePanelProvider.ts`
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

    // Listen for messages the webview sends (see the <script> in getHtml).
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

### `media/icon.svg`
```svg
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path fill="currentColor" d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-.95-.5-1.3-.3-.35-.5-.8-.5-1.2 0-1.1.9-2 2-2h2.5A4.5 4.5 0 0 0 22 11 10 10 0 0 0 12 2Zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3.5 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"/>
</svg>
```

## Troubleshooting sheet (first-timer traps)
| Symptom | Usual cause | Fix |
|---------|-------------|-----|
| No Activity-Bar icon | `media/icon.svg` missing, or JSON invalid | Check the file exists; fix red squiggles in `package.json` |
| Panel opens but stays blank / "no data provider" | `"type": "webview"` missing, or `viewType` ≠ view `id` | Both must be `liveRecolor.panel`; add `"type": "webview"`; restart EDH |
| Webview blank, CSP error in webview dev tools | nonce/`script-src` mismatch | Use the same `${nonce}` in the CSP and on `<script>` |
| `acquireVsCodeApi is not defined` | `enableScripts: true` not set | Set it in `resolveWebviewView` |
| Button click logs nothing | Watching the EDH console, not the **first window's** Debug Console | Open Debug Console in the F5 window |
| Contribution edit didn't take effect | EDH running stale build | <kbd>Shift</kbd>+<kbd>F5</kbd> then <kbd>F5</kbd> to relaunch |

## Next
Once all six gate checks pass, continue to **[M2 — Non-destructive backbone](../MILESTONE_2_nondestructive-backbone/00_overview.md)**:
you'll turn the panel's message into a *real* action — applying one workbench color live — but only after building
the snapshot/Revert/Reset safety net that makes every apply reversible.

---
> Nav: [← Message round-trip](09_message-roundtrip.md) · [Overview](00_overview.md) · [M2 → Non-destructive backbone](../MILESTONE_2_nondestructive-backbone/00_overview.md)
