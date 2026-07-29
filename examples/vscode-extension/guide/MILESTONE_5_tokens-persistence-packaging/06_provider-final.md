# M5 · Step 06 of 10 — The final provider (save / applySet / delete / import / export)
> Nav: [← Save sets](05_storage.md) · [Overview](00_overview.md) · [Final webview →](07_main-js-final.md)

## Why / design
This is the last rewrite of `src/panel/ThemePanelProvider.ts` — the adapter that turns webview messages into engine
calls, settings writes, and storage operations. M4's provider handled `ready | apply | revert | reset` and applied
**chrome only**. M5's final provider makes two upgrades:

1. **Apply the whole theme.** The `apply` handler now calls `applyTheme(theme, languageId)` (step 03) instead of
   `applyChrome(theme.chrome)`, so a click recolors chrome + tokens + semantic. It also reads the new optional
   `m.languageId` from the message and remembers the last selection in `this.last` (so **Save** can reproduce it).
2. **Persistence + JSON in/out.** Five new message handlers wire the storage module (step 05): `save`, `applySet`,
   `delete`, `export`, `import`. After any change to the set list it posts `{ type: 'savedSets', savedSets }` so
   the webview re-renders "My sets".

> **The constructor gains `context`.** Storage lives in `context.globalState`, so the provider now needs the
> `ExtensionContext`. Its constructor becomes `(extensionUri, context, history)` — `extensionUri` was already there
> from M4 (for `asWebviewUri`), `history` from M2, and `context` is new for M5. Because the signature changed,
> `src/extension.ts` must pass `context` too — that one-line change is included below.
>
> **`resolveWebviewView` keeps M4's trimmed one-param signature** `(webviewView)` — the unused `_context` /
> `_token` params were already dropped in [M4/04](../MILESTONE_4_gallery-and-ux/04_provider-externalize.md); nothing about them changes here.

The `export` and `import` handlers use three VS Code APIs you'll meet in detail in **step 08** (`openTextDocument`,
`showOpenDialog`, `workspace.fs`) — the code lands here so the final provider is complete in one place; step 08 is
a focused walkthrough of that flow plus its round-trip Done-when. `applySet` runs a saved set's frozen colors
straight through `applyTheme(set)` (global, no languageId) inside the history wrapper, so Revert still undoes it.

## Do this
This step **edits two files**: `src/panel/ThemePanelProvider.ts` (the last provider rewrite) and `src/extension.ts`
(one constructor argument). The provider's **`resolveWebviewView`, `post()`, `getHtml`, and `getNonce()` are
unchanged from M4**, so the **complete paste-able file is in [the M5 checkpoint](10_verify.md)** under
`### src/panel/ThemePanelProvider.ts` — select-all in your file and paste that. The fragments below walk only the
regions that changed from M4.

> **Before you start:** M4's `src/panel/ThemePanelProvider.ts` must exist, and steps 01–05 must be done — the
> engine now returns `tokens`/`semantic`, `applyTheme` exists in `apply.ts`, and `src/storage/sets.ts` exists.

1. **Widen the imports.** Swap `applyChrome` for **`applyTheme`** and pull in the whole storage module. Replace the
   import block at the top with:
   ```ts
   import * as vscode from 'vscode';
   import { ThemeHistory } from '../theme/history';
   import { applyTheme } from '../theme/apply';
   import { COMBOS, comboById } from '../engine/combos';
   import { PROFILES, profileById } from '../engine/profiles';
   import { generate } from '../engine/generate';
   import { contrastRatio } from '../engine/color';
   import { listSets, saveSet, deleteSet, exportSets, importSets, SavedSet } from '../storage/sets';
   ```
2. **Add the `last` field and widen the constructor** to `(extensionUri, context, history)` — `context` is new
   (storage lives in `context.globalState`); `extensionUri` (M4) and `history` (M2) keep their places. Replace the
   class header + constructor with:
   ```ts
   export class ThemePanelProvider implements vscode.WebviewViewProvider {
     public static readonly viewType = 'liveRecolor.panel';

     private view?: vscode.WebviewView;
     private last?: { comboId: string; profileId: string; variant?: string };

     constructor(
       private readonly extensionUri: vscode.Uri,
       private readonly context: vscode.ExtensionContext,
       private readonly history: ThemeHistory,
     ) {}
   ```
3. **Replace `onMessage`** with the M5 protocol: `ready` now also sends `savedSets`; `apply` remembers the pick in
   `this.last` and calls **`applyTheme(theme, m.languageId || undefined)`** (chrome + tokens + semantic, optionally
   language-scoped); and five new cases — `save`, `applySet`, `delete`, `export`, `import` — wire the storage
   module, re-posting `savedSets` after any change to the list. (`export`/`import` use three VS Code APIs walked in
   [step 08](08_export-import.md).)
   ```ts
     private async onMessage(m: any): Promise<void> {
       switch (m.type) {
         case 'ready':
           this.post({
             type: 'init',
             combos: COMBOS.map((c) => ({ id: c.id, label: c.label })),
             profiles: PROFILES.map((p) => ({ id: p.id, label: p.label, family: p.family, variants: p.variants })),
             savedSets: listSets(this.context).map((s) => s.name),
           });
           break;
         case 'apply': {
           this.last = { comboId: m.comboId, profileId: m.profileId, variant: m.variant };
           const theme = generate(comboById(m.comboId), profileById(m.profileId), m.variant);
           await this.history.apply(() => applyTheme(theme, m.languageId || undefined));
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
         case 'save': {
           if (!this.last || !m.name) return;
           const theme = generate(comboById(this.last.comboId), profileById(this.last.profileId), this.last.variant);
           const set: SavedSet = {
             name: m.name, comboId: this.last.comboId, profileId: this.last.profileId, variant: this.last.variant,
             chrome: theme.chrome, tokens: theme.tokens, semantic: theme.semantic,
           };
           await saveSet(this.context, set);
           this.post({ type: 'savedSets', savedSets: listSets(this.context).map((s) => s.name) });
           break;
         }
         case 'applySet': {
           const set = listSets(this.context).find((s) => s.name === m.name);
           if (!set) return;
           await this.history.apply(() => applyTheme(set));
           break;
         }
         case 'delete':
           await deleteSet(this.context, m.name);
           this.post({ type: 'savedSets', savedSets: listSets(this.context).map((s) => s.name) });
           break;
         case 'export': {
           const doc = await vscode.workspace.openTextDocument({ language: 'json', content: exportSets(this.context) });
           await vscode.window.showTextDocument(doc);
           break;
         }
         case 'import': {
           const uris = await vscode.window.showOpenDialog({ canSelectMany: false, filters: { JSON: ['json'] } });
           if (!uris?.length) return;
           const bytes = await vscode.workspace.fs.readFile(uris[0]);
           const count = await importSets(this.context, Buffer.from(bytes).toString('utf8'));
           void vscode.window.showInformationMessage(`Live Recolor: imported ${count} set(s).`);
           this.post({ type: 'savedSets', savedSets: listSets(this.context).map((s) => s.name) });
           break;
         }
       }
     }
   ```
4. Leave **`resolveWebviewView`, `post()`, `getHtml`, and `getNonce()` exactly as M4 left them** — they're in the
   checkpoint; don't re-type them.
5. **Edit `src/extension.ts`** — pass `context` as the **middle** argument. Replace M4's construction line
   `const provider = new ThemePanelProvider(context.extensionUri, history);` with:
   ```ts
   const provider = new ThemePanelProvider(context.extensionUri, context, history);
   ```
6. Save both.

**Load-bearing:** the message-type strings (`ready`, `apply`, `revert`, `reset`, `save`, `applySet`, `delete`,
`export`, `import`) must match what the webview posts (step 07); the constructor argument order
`(extensionUri, context, history)` must match `extension.ts`; `applyTheme(theme, m.languageId || undefined)` passes
the language through. The `m.name` set-naming and the info-message text are cosmetic.

## Done when (this step)
- Both files match the checkpoint version; the project compiles clean.
- Press <kbd>F5</kbd> (or restart the EDH) and open the Live Recolor panel. It still renders (M4's webview is
  unchanged until step 07), and **applying a combo + style now recolors code tokens too** — open any `.ts`/`.js`
  file in the EDH and pick a theme: keywords/strings/comments/types change color live, on top of the chrome.
- Save/Export/Import buttons don't exist in the UI yet — step 07 adds them. The handlers are ready and waiting.

## If it breaks
- **`Expected 3 arguments, but got 2` in `extension.ts`** → you updated the provider's constructor but not the
  call site; the call must be `new ThemePanelProvider(context.extensionUri, context, history)`.
- **Panel is blank after F5** → almost always a stale EDH; <kbd>Shift</kbd>+<kbd>F5</kbd> then <kbd>F5</kbd>. If it
  persists, check the Webview Developer Tools console for a CSP/`main.js` load error (unchanged from M4).
- **Chrome recolors but code text doesn't** → the `apply` handler still calls `applyChrome`; it must call
  `applyTheme(theme, m.languageId || undefined)`. (If code *still* doesn't change with `applyTheme` in place, see
  the semantic "silently does nothing" note in step 10 — TextMate keyword/string/comment colors should change
  regardless of a language server.)

---
> Nav: [← Save sets](05_storage.md) · [Overview](00_overview.md) · [Final webview →](07_main-js-final.md)
