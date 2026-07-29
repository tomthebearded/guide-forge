# M1 · Step 06 of 10 — Create the WebviewViewProvider
> Nav: [← Contribute view](05_contribute-view.md) · [Overview](00_overview.md) · [Register provider →](07_register-provider.md)

## Glossary for this step
- **`WebviewViewProvider`** — the object VS Code calls to fill a webview view with content.
- **CSP (Content-Security-Policy)** — an HTML rule set that restricts what a page may load/run; webviews demand a strict one.

## Why / design
Declaring the view (step 05) reserved the space; a **provider** fills it. VS Code calls your provider's
`resolveWebviewView` the first time the view becomes visible, handing you a `WebviewView` whose `.webview.html` you
set to your page. This step writes a provider that renders **static** HTML — the button and messaging come next.

> 🧠 **New concept — the webview & its sandbox.** A *webview* is an iframe VS Code embeds to show arbitrary
> HTML/CSS/JS. It's sandboxed: by default **scripts are disabled** and it can't load anything, so you must (a) set
> `webview.options = { enableScripts: true }` to allow JS, and (b) give the HTML a **Content-Security-Policy** that
> whitelists exactly what may run. `webview.cspSource` is a special origin string you put in the CSP so the webview
> may load VS Code-provided styles. Docs: [Webview guide](https://code.visualstudio.com/api/extension-guides/webview).
> *(We have no script yet, so this step's CSP allows styles only — step 08 adds script permission.)*

> 🧠 **New concept — `resolveWebviewView`.** The one method of `WebviewViewProvider`. VS Code calls it with the
> `WebviewView` when the panel is first shown; whatever you assign to `webviewView.webview.html` becomes the panel's
> content. Docs: [WebviewViewProvider API](https://code.visualstudio.com/api/references/vscode-api#WebviewViewProvider).

## Do this
This step creates **one file**: `src/panel/ThemePanelProvider.ts`.

1. In the Explorer, create a folder **`src/panel`**, then a file **`src/panel/ThemePanelProvider.ts`** (this exact
   path is load-bearing — step 07 imports it).
2. Paste the code below. Notes on what's load-bearing:
   - `viewType` **must equal** the view id from step 05 — `'liveRecolor.panel'`. If these differ, VS Code never
     connects your provider to the view.
   - The `_context` / `_token` parameters are required by the interface but unused here; the leading underscore is a
     convention marking "intentionally unused".
3. Save the file.

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
    // Allow the page to run scripts (needed from step 08 on).
    webviewView.webview.options = { enableScripts: true };

    // Fill the panel with our HTML.
    webviewView.webview.html = this.getHtml(webviewView.webview);
  }

  private getHtml(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline';" />
  <title>Live Recolor</title>
</head>
<body>
  <h3>Live Recolor</h3>
  <p>The control panel will grow here.</p>
</body>
</html>`;
  }
}
```

## Done when (this step)
- `src/panel/ThemePanelProvider.ts` exists with the code above.
- It compiles with no red squiggles (the terminal watch task, or `npm run compile`, reports no errors).
- **Note:** the panel won't show this content yet — the provider isn't registered until step 07.

## If it breaks
- **Red squiggle on `implements vscode.WebviewViewProvider`** → a typo in a method/parameter type name; compare
  against the block above. The types come from `@types/vscode` (already a devDependency).
- **`Cannot find module 'vscode'`** → you're editing outside the `live-recolor` project, or dependencies didn't
  install; run `npm install` in the project root.

---
> Nav: [← Contribute view](05_contribute-view.md) · [Overview](00_overview.md) · [Register provider →](07_register-provider.md)
