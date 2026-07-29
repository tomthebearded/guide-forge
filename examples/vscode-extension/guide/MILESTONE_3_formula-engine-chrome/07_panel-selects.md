# M3 · Step 07 of 8 — Panel: two dropdowns → live chrome
> Nav: [← Generate](06_generate.md) · [Overview](00_overview.md) · [Verify →](08_verify.md)

## Why / design
The engine is done and proven in Node; now the **adapter** connects it to the UI. We rewrite the panel provider so
its webview shows two `<select>` dropdowns — one for the starter combo, one for the style — and, on any change, sends
`{ type: 'apply', comboId, profileId }` to the extension. The handler runs the engine (`generate`) and applies the
result's `chrome` through **M2's backbone**: `this.history.apply(() => applyChrome(theme.chrome))`. That single line
is the whole point of the two-layer design — the panel doesn't know any color math, and the write still snapshots
first, so **Revert/Reset keep working unchanged**.

This is deliberately the *minimal* UI: two dropdowns and the three buttons from M2. The rich chip gallery, swatch
preview, and contrast badge are M4; keeping the panel plain here means the diff from M2 is small and the focus stays
on the engine wiring.

> 🧠 **Where the dropdown data comes from.** The provider imports `COMBOS` and `GENERATIVE` directly from the engine
> and renders one `<option>` per entry *into the HTML string* (server-side, in `getHtml`). The webview script only
> reads the selected values and posts them back. Note we import **`GENERATIVE`** (the 9 generative profiles) for the
> menu — in M4 that source becomes `PROFILES` once the 4 signature presets exist. `profileById`/`comboById` resolve
> the posted ids back to objects.

> ⚠️ **Config API reminder (the M2 trap still applies).** `applyChrome` does `await config.update(..., ConfigurationTarget.Global)`.
> It writes to your **real** User settings during F5 — which is exactly why every apply goes through
> `history.apply` (snapshot first). Don't call `applyChrome` outside the history wrapper.
> Docs: [ConfigurationTarget](https://code.visualstudio.com/api/references/vscode-api#ConfigurationTarget).

## Do this
This step **edits one file**: `src/panel/ThemePanelProvider.ts` — replace it with the version below.
**`src/extension.ts` is unchanged from M2** (it already builds `new ThemeHistory()` and passes it to
`new ThemePanelProvider(history)`) — do not touch it.

1. **Swap the imports.** The M2 provider imported `ThemeHistory` + `applyChrome`. Add the engine imports:
   `COMBOS, comboById` from `../engine/combos`; `GENERATIVE, profileById` from `../engine/profiles`; `generate`
   from `../engine/generate`. The constructor still takes only `history` — unchanged from M2.
2. **Rewrite `onMessage`.** Replace M2's `applyDemo` case with an `apply` case that reads `m.comboId`/`m.profileId`,
   calls `generate(comboById(...), profileById(...))`, and applies `theme.chrome` via `this.history.apply(...)`.
   Keep `revert` and `reset` exactly as M2 had them.
3. **Rewrite `getHtml`.** Build `comboOpts`/`profOpts` by mapping `COMBOS`/`GENERATIVE` to `<option>` tags, drop them
   into two `<select>`s, and replace M2's script so it posts `{ type: 'apply', comboId, profileId }` on the Apply
   button **and** on either dropdown's `change` (so picking re-applies live). Keep Revert/Reset.
4. Save. The complete file is below — the simplest safe move is to replace the whole file with it.

**Load-bearing:** the message shape `{ type: 'apply', comboId, profileId }` (the handler reads these keys); the
dropdown `<option value>` must be the combo/profile **id** (not the label), since `comboById`/`profileById` look up
by id. The `viewType` and the CSP/nonce pattern are unchanged from M1/M2.

## Code
`src/panel/ThemePanelProvider.ts` *(END OF M3 — inline `<select>`s, generated chrome via the history; a near-total rewrite of the M2 provider, shown whole also in [08_verify.md](08_verify.md))*
```ts
import * as vscode from 'vscode';
import { ThemeHistory } from '../theme/history';
import { applyChrome } from '../theme/apply';
import { COMBOS, comboById } from '../engine/combos';
import { GENERATIVE, profileById } from '../engine/profiles';
import { generate } from '../engine/generate';

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

  private async onMessage(m: { type: string; comboId?: string; profileId?: string }): Promise<void> {
    switch (m.type) {
      case 'apply': {
        const theme = generate(comboById(m.comboId ?? ''), profileById(m.profileId ?? ''));
        await this.history.apply(() => applyChrome(theme.chrome));
        break;
      }
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
    const comboOpts = COMBOS.map((c) => `<option value="${c.id}">${c.label}</option>`).join('');
    const profOpts = GENERATIVE.map((p) => `<option value="${p.id}">${p.label}</option>`).join('');
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
  <p><label>Starter <select id="combo">${comboOpts}</select></label></p>
  <p><label>Style <select id="profile">${profOpts}</select></label></p>
  <button id="apply">Apply</button>
  <button id="revert">Revert</button>
  <button id="reset">Reset</button>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const combo = document.getElementById('combo');
    const profile = document.getElementById('profile');
    function apply() { vscode.postMessage({ type: 'apply', comboId: combo.value, profileId: profile.value }); }
    document.getElementById('apply').addEventListener('click', apply);
    combo.addEventListener('change', apply);
    profile.addEventListener('change', apply);
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
- The file compiles with no errors and `src/extension.ts` is still the M2 version (`new ThemePanelProvider(history)`).
- Press <kbd>F5</kbd>, open the Live Recolor panel: it shows a **Starter** dropdown (5 options) and a **Style**
  dropdown (9 options) above **Apply / Revert / Reset**.
- Pick **Deep Sea** + **Neon** (or click **Apply**): the editor background, sidebar, activity bar, status bar, tabs,
  and panels all recolor to a coordinated dark-teal theme **live**, no reload.
- Change the **Style** dropdown to **Midnight / OLED**: the background snaps to pure black immediately (the `change`
  handler re-applies).
- (Full milestone gate — including the settings.json diff and Revert — is step 08.)

## If it breaks
- **Dropdowns are empty** → the `<option>` mapping didn't run; confirm `COMBOS`/`GENERATIVE` are imported and the
  template literals use `${comboOpts}` / `${profOpts}` inside the `<select>`.
- **Nothing recolors on change** → the webview script didn't wire `change`, or the message `type` isn't `'apply'`.
  Open **Developer: Open Webview Developer Tools** and check for a CSP/script error; confirm the handler's `case
  'apply'` matches.
- **`ThemePanelProvider` expects 1 argument but got 0** (or vice-versa) → `extension.ts` drifted. In M2→M3 the ctor
  is `constructor(private readonly history: ThemeHistory)` and `extension.ts` calls `new ThemePanelProvider(history)`.
- **Colors apply but Revert does nothing** → you called `applyChrome` directly instead of through
  `this.history.apply(() => applyChrome(...))`; only the wrapped path snapshots.

---
> Nav: [← Generate](06_generate.md) · [Overview](00_overview.md) · [Verify →](08_verify.md)
