# M4 · Step 04 of 6 — Rewrite the provider to serve external files + post `init`/`applied`
> Nav: [← The gallery script](03_main-js.md) · [Overview](00_overview.md) · [Wire the extension →](05_wire-extension.md)

## Glossary for this step
- **`asWebviewUri`** — converts a file-on-disk `Uri` into a special URI the webview is actually allowed to load. — [glossary.md](../foundation/glossary.md)
- **`localResourceRoots`** — the whitelist of folders a webview may load local files from. — [glossary.md](../foundation/glossary.md)

## Why / design
The provider stops embedding HTML+JS+CSS as a string and instead serves the two files you just wrote, then speaks
the message protocol from step 03: reply to `ready` with `init`, and after each `apply` send back `applied` with
the palette and contrast ratio. The engine already exists — this step is pure adapter wiring.

> 🧠 **New concept — `asWebviewUri` & why a plain file path fails.** A webview runs on an opaque internal origin
> (something like `vscode-webview://…`), **not** on your filesystem. So a normal path or `file://` URL in
> `<script src>` / `<link href>` **will not load** — the webview can't reach the disk directly, and the CSP blocks
> it. You must convert each on-disk `Uri` with **`webview.asWebviewUri(uri)`**, which returns a rewritten URL the
> webview *is* permitted to fetch. You build the on-disk `Uri` with `vscode.Uri.joinPath(this.extensionUri, 'media',
> 'webview', 'main.js')`. Docs:
> [Webview → loading local content](https://code.visualstudio.com/api/extension-guides/webview#loading-local-content).

> 🧠 **New concept — `localResourceRoots`.** Even with a correct `asWebviewUri`, a webview may only load local files
> from folders you explicitly whitelist in `webview.options.localResourceRoots`. We set it to
> `[Uri.joinPath(this.extensionUri, 'media')]` — the whole `media/` tree — so `media/webview/main.js` and
> `styles.css` are allowed and nothing else on disk is. Omit this (it defaults to the extension root or the view's
> folder) and you can get a blank panel with a console error about a resource being blocked. Docs:
> [Webview → `WebviewOptions.localResourceRoots`](https://code.visualstudio.com/api/references/vscode-api#WebviewOptions).

> ⚠️ **Two things must agree for a file to load:** (1) `localResourceRoots` covers its folder (`media`), **and**
> (2) the CSP allows its type — our CSP has `style-src ${webview.cspSource}` and `script-src 'nonce-…'`. The
> external `<script>` carries the nonce; the external `<link>` is covered by `cspSource`. If either is wrong the
> file silently fails to load.

To reach `media/`, the provider needs the extension's install folder as a `Uri`. That's **`extensionUri`**, which
we pass into the constructor here and wire from `extension.ts` in step 05.

## Do this
This step **replaces the whole contents** of `src/panel/ThemePanelProvider.ts` with the version below.

1. Open `src/panel/ThemePanelProvider.ts` and select all.
2. Replace it with the code below. What changed from M3:
   - **`resolveWebviewView` now takes just `(webviewView)`** — we drop the two unused `_context` /
     `_token` params it carried in M1–M3 (they were only ever placeholders to match the interface). TypeScript
     lets you omit trailing parameters you don't use, so this is purely a tidy-up, not a behavior change.
   - The constructor now takes **`extensionUri`** first, then `history`: `(extensionUri, history)`. (M5 will insert
     `context` in the middle.)
   - `resolveWebviewView` stores the view (`this.view`) so the extension can push messages to it later, and sets
     **`localResourceRoots: [Uri.joinPath(extensionUri, 'media')]`** alongside `enableScripts`.
   - A tiny **`post()`** helper wraps `this.view?.webview.postMessage(...)`.
   - `onMessage` now handles the M4 protocol: **`ready`** → post `init` (combos + all **`PROFILES`**, so the 4
     signature styles appear); **`apply`** → generate, apply chrome via history, then post **`applied`** with the
     palette and the rounded text-on-background contrast; **`revert`** / **`reset`** unchanged.
   - `getHtml` now returns a shell (`<div id="app">` + external `<link>` and `<script>`) built with `asWebviewUri`,
     and the CSP drops `'unsafe-inline'` from `style-src` (the styles are an external file now).
   - The import of the profile list changes from M3's `GENERATIVE` to **`PROFILES`** (all 13).
3. Note the apply is still **`applyChrome(theme.chrome)`** — chrome only. No tokens. (`applyTheme` arrives in M5.)
4. Save; it recompiles. It **won't compile against `extension.ts` yet** — the M3 `extension.ts` still calls the old
   constructor. That's expected and fixed in step 05.

## Code
`src/panel/ThemePanelProvider.ts`:
```ts
import * as vscode from 'vscode';
import { ThemeHistory } from '../theme/history';
import { applyChrome } from '../theme/apply';
import { COMBOS, comboById } from '../engine/combos';
import { PROFILES, profileById } from '../engine/profiles';
import { generate } from '../engine/generate';
import { contrastRatio } from '../engine/color';

export class ThemePanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'liveRecolor.panel';

  private view?: vscode.WebviewView;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly history: ThemeHistory,
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')],
    };
    webviewView.webview.html = this.getHtml(webviewView.webview);
    webviewView.webview.onDidReceiveMessage((m) => this.onMessage(m));
  }

  private post(message: unknown): void {
    this.view?.webview.postMessage(message);
  }

  private async onMessage(m: any): Promise<void> {
    switch (m.type) {
      case 'ready':
        this.post({
          type: 'init',
          combos: COMBOS.map((c) => ({ id: c.id, label: c.label })),
          profiles: PROFILES.map((p) => ({ id: p.id, label: p.label, family: p.family, variants: p.variants })),
        });
        break;
      case 'apply': {
        const theme = generate(comboById(m.comboId), profileById(m.profileId), m.variant);
        await this.history.apply(() => applyChrome(theme.chrome));
        this.post({
          type: 'applied',
          palette: theme.palette,
          contrast: Math.round(contrastRatio(theme.palette.text, theme.palette.bg) * 100) / 100,
        });
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
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'webview', 'main.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'webview', 'styles.css'));
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';" />
  <link href="${styleUri}" rel="stylesheet" />
  <title>Live Recolor</title>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
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

> Why post the **`family`** and **`variants`** in `init`? The webview needs `variants` to know whether to draw the
> variant row (Game Boy, Terminal, Nature), and `family` is forwarded for M5's UI grouping. The provider owns the
> data; the webview just renders it — that's the data-driven split from step 03.

## Done when (this step)
- `src/panel/ThemePanelProvider.ts` matches the code above. It will show a compile error where `extension.ts` still
  calls `new ThemePanelProvider(history)` with the old signature — **expected**; step 05 fixes it. (If your watch
  task reports only that one error in `extension.ts`, you're on track.)
- Full behavior is verified after step 05 (the panel can't render until the constructor is wired). The milestone
  gate in step 06 confirms init/apply/applied end-to-end.

## If it breaks
- **`Property 'extensionUri' has no initializer` / ctor errors** → make sure both constructor params use the
  `private readonly` shorthand exactly as shown; the class fields are declared by that shorthand.
- **Compile error only in `extension.ts`** → correct at this stage; do step 05.
- **(Looking ahead) panel blank at F5** → almost always `localResourceRoots` not covering `media`, or a CSP mismatch
  — see the troubleshooting table in [06_verify.md](06_verify.md).
