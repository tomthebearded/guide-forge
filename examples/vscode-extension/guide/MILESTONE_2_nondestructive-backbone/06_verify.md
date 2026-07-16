# M2 · Step 06 of 6 — Verify the milestone + file checkpoint
> Nav: [← Panel buttons](05_panel-buttons.md) · [Overview](00_overview.md) · [M3 → Color-formula engine](../MILESTONE_3_formula-engine-chrome/00_overview.md)

## Done-when gate (run every check)
Do these in order; each pairs an action with the **exact** result you should see. You'll watch two things: the
**status bar** in the Extension Development Host, and that same EDH's **User `settings.json`**.

**Open the EDH's settings.json first** so you can watch it change: in the **EDH** window, Command Palette
(<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>) → **Preferences: Open User Settings (JSON)**. Keep that tab visible.
*(Note the EDH runs with its own settings — during F5 dev that's still your real User settings, which is exactly why
the non-destructive backbone matters.)*

1. **Build + launch** — the project compiles with no errors; press <kbd>F5</kbd> → an **[Extension Development Host]**
   window opens with no error notification.
2. **Panel + buttons** — click the Live Recolor icon in the EDH's Activity Bar → the panel shows **"Live Recolor"**
   and three buttons: **Apply demo (red status bar)**, **Revert**, **Reset**.
3. **Apply (live + written)** — click **Apply demo**:
   - The EDH's **status bar turns crimson** (`#e11d48`) with **white** text, immediately, with no reload.
   - The EDH's `settings.json` gains **exactly** this block:
     ```jsonc
     "workbench.colorCustomizations": {
       "statusBar.background": "#e11d48",
       "statusBar.foreground": "#ffffff"
     }
     ```
4. **Revert (restores exactly)** — click **Revert**:
   - The status bar returns to **exactly** its prior color.
   - In `settings.json`: if you had **no** `workbench.colorCustomizations` before step 3, the key is now **removed**
     entirely. If you *did* have one, it's restored to that prior value byte-for-byte. Either way you're back to the
     pre-Apply state.
5. **Re-apply, then Reset (removes the key)** — click **Apply demo** again (status bar red again), then click **Reset**:
   - The status bar returns to the base theme's color.
   - The **entire** `"workbench.colorCustomizations"` key is **gone** from `settings.json` — not left as an empty
     `{}`. (Reset restores an all-`undefined` snapshot, which deletes the key.)

If all five pass, M2 is done: one workbench color applies live through a single write path, and every apply is fully
reversible — snapshot, Revert, Reset. That backbone is what M3's generated palettes will ride on.

> 🔬 **What's checked by hand vs. machine-verified.** Everything above is a check **you run by hand** in the Extension
> Development Host (the F5/GUI flow can't be scripted here). Mark M2 ✅ in [status.md](../foundation/status.md) only
> after you've watched the status bar change *and* seen the `settings.json` diff appear and disappear as described.

## Files after this milestone (complete current contents)
These are the files **we created or modified** in M2. Everything from M1 (`package.json`, `media/icon.svg`) is
unchanged, and all generator files stay as scaffolded.

### `src/theme/settings.ts` (new)
```ts
import * as vscode from 'vscode';

// The three setting IDs, split into their config section + key.
export const CHROME = { section: 'workbench', key: 'colorCustomizations' } as const;
export const TOKENS = { section: 'editor', key: 'tokenColorCustomizations' } as const;
export const SEMANTIC = { section: 'editor', key: 'semanticTokenColorCustomizations' } as const;

export const TARGET = vscode.ConfigurationTarget.Global;
```

### `src/theme/apply.ts` (new — M2 version, `applyChrome` only)
```ts
import * as vscode from 'vscode';
import { CHROME, TARGET } from './settings';

export async function applyChrome(chrome: Record<string, string>): Promise<void> {
  await vscode.workspace.getConfiguration(CHROME.section).update(CHROME.key, chrome, TARGET);
}
```

### `src/theme/history.ts` (new — M2 version, chrome-only snapshot)
```ts
import * as vscode from 'vscode';
import { CHROME, TARGET } from './settings';

interface Snapshot { chrome: unknown; } // [M2: chrome only; M5 adds tokens + semantic]

export class ThemeHistory {
  private stack: Snapshot[] = [];

  private capture(): Snapshot {
    const wb = vscode.workspace.getConfiguration(CHROME.section);
    return {
      chrome: wb.inspect(CHROME.key)?.globalValue,
    };
  }

  private async restore(s: Snapshot): Promise<void> {
    const wb = vscode.workspace.getConfiguration(CHROME.section);
    await wb.update(CHROME.key, s.chrome, TARGET);
  }

  // Snapshot current state, THEN run the apply function. This is the non-destructive backbone.
  async apply(fn: () => Promise<void>): Promise<void> {
    this.stack.push(this.capture());
    await fn();
  }

  // Step back one apply. Returns false if nothing to revert.
  async revert(): Promise<boolean> {
    const snap = this.stack.pop();
    if (!snap) return false;
    await this.restore(snap);
    return true;
  }

  // Remove ALL customizations (undefined = delete the key). Clears history.
  async reset(): Promise<void> {
    await this.restore({ chrome: undefined });
    this.stack = [];
  }

  get depth(): number { return this.stack.length; }
}
```

### `src/extension.ts` (modified — M2 version)
```ts
import * as vscode from 'vscode';
import { ThemePanelProvider } from './panel/ThemePanelProvider';
import { ThemeHistory } from './theme/history';

export function activate(context: vscode.ExtensionContext): void {
  const history = new ThemeHistory();
  const provider = new ThemePanelProvider(history);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ThemePanelProvider.viewType, provider),
  );
}

export function deactivate(): void {}
```

### `src/panel/ThemePanelProvider.ts` (modified — END OF M2)
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

## Troubleshooting sheet (M2 traps)
| Symptom | Usual cause | Fix |
|---------|-------------|-----|
| `new ThemePanelProvider(history)` won't compile | Provider still has the M1 no-arg constructor | Add `constructor(private readonly history: ThemeHistory) {}` (step 05) |
| Apply does nothing, no error | Message-type mismatch — posted `type` ≠ a `case` in `onMessage` | Both sides must be `applyDemo` / `revert` / `reset` exactly |
| Status bar doesn't recolor | Wrong color keys, or EDH running a stale build | Use `statusBar.background` / `statusBar.foreground`; <kbd>Shift</kbd>+<kbd>F5</kbd> then <kbd>F5</kbd> |
| Reset leaves `"workbench.colorCustomizations": {}` | Restored `{}` instead of `undefined` | `reset()` must restore `{ chrome: undefined }` — `undefined` deletes the key |
| Revert restores the wrong value | Snapshot captured *after* the write (missing `await`) | `apply()` must `push(capture())` **before** running `fn`; every `update` is `await`ed |
| `update` throws "No workspace folder open" | A write used `ConfigurationTarget.Workspace` with no folder | Use `TARGET` (`Global`) as exported in `settings.ts` |
| Webview blank, CSP error in webview dev tools | nonce/`script-src` mismatch | Same `${nonce}` in the CSP and on `<script>` |

## Next
These five hands-on checks are the same gate as the **six** aggregated Done-when conditions in
[00_overview.md](00_overview.md) — grouped differently for a live walkthrough (build + wire land in one F5
launch here), so the counts aren't 1:1.

Once all five gate checks pass, continue to
**[M3 — Color-formula engine (chrome)](../MILESTONE_3_formula-engine-chrome/00_overview.md)**: you'll build the
`vscode`-free color engine — hex↔HSL math, the 5 starter combos, and the 9 generative style profiles — so a seed
color derives a whole coordinated chrome palette. The panel's single hard-coded color becomes a real generator, still
applied live and reverted through the exact backbone you just built.

---
> Nav: [← Panel buttons](05_panel-buttons.md) · [Overview](00_overview.md) · [M3 → Color-formula engine](../MILESTONE_3_formula-engine-chrome/00_overview.md)
