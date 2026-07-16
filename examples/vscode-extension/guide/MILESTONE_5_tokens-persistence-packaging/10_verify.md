# M5 · Step 10 of 10 — Verify the milestone + you're done
> Nav: [← Package the .vsix](09_package.md) · [Overview](00_overview.md) · [Guide front door →](../README.md)

## Done-when gate (run every check)
Do these in the Extension Development Host (press <kbd>F5</kbd>), in order. Each pairs an action with the **exact**
result you should see. Open a real `.ts` or `.js` file in the EDH first so you can watch code recolor.

### 1. Tokens recolor live
- In the panel, pick a **Starter combination** + a **Style** (e.g. Deep Sea + Neon).
- **Expected:** the chrome recolors (as in M4) **and** the code in your open file recolors — **keywords**,
  **strings**, and **comments** take the theme's colors immediately, no reload. Switch styles and watch them
  change again.

> ⚠️ **The semantic-tokens trap — read this before deciding M5 is "broken".** We set
> `editor.semanticTokenColorCustomizations` with `enabled: true`, but **semantic** recoloring only takes visible
> effect when **(a)** the open file's language has a running **semantic-tokens provider** (a language server —
> TypeScript/JS have one; a plain `.txt` or a language with no server does not) **and (b)** the differences are
> actually distinguishable from the TextMate colors underneath. So it is completely normal to apply a set and see
> **keywords/strings/comments change (TextMate) while "nothing extra" seems to happen from semantic** — that is not
> a failure. To *prove* semantic works: open a `.ts` file, apply a set, and note that **types/classes and
> function/parameter identifiers** pick up their colors once the TS server has tokenized the file (give it a
> second on a fresh open). If you only ever test on a plain-text file, semantic will *always* look inert — by
> design, not by bug.

### 2. Revert / Reset still undo everything
- After an apply, click **Revert** → **Expected:** the **first** click already steps back (one snapshot per pick,
  not two) and the previous state returns for chrome **and** tokens **and** semantic (all three settings step
  back together).
- Click **Reset** → **Expected:** all customizations are removed. Check `settings.json` (Command Palette →
  **Preferences: Open User Settings (JSON)**): `workbench.colorCustomizations`, `editor.tokenColorCustomizations`,
  and `editor.semanticTokenColorCustomizations` are **gone** (keys deleted, not blanked).

### 3. Save a set — and it survives a reload
- Pick a combo + style, type a name (e.g. `deep-neon`) in the set-name box, click **Save set…**.
- **Expected:** `deep-neon` appears under **My sets**.
- Command Palette → **Developer: Reload Window** (reloads the EDH).
- **Expected:** after reload, `deep-neon` is **still** under My sets (it lives in `globalState`, not the session).
  Clicking it re-applies its colors.

### 4. Export → save → import round-trips
- Click **Export** → **Expected:** a JSON tab opens with an **array** containing `deep-neon` (name + comboId +
  profileId + frozen chrome/tokens/semantic). Save it as `sets.json`.
- Delete `deep-neon` from My sets (its ✕), then click **Import** and pick `sets.json`.
- **Expected:** toast **"Live Recolor: imported 1 set(s)."** and `deep-neon` reappears under My sets, identical.

### 5. Per-language scoping — one language only, chrome untouched
- Type `typescript` into the **Per-language (tokens only)** box, then pick a combo/style (this applies scoped).
- **Expected:** in `settings.json`, a `"[typescript]"` block now holds `editor.tokenColorCustomizations` (and
  `editor.semanticTokenColorCustomizations`); a `.ts` file recolors its tokens, a `.js`/`.md` file **does not**;
  and the **chrome is unchanged** by this scoped apply (chrome can't be language-scoped — [D2](../foundation/decision-log.md#d2--per-language-scoping-is-tokens-only)).
- Clear the box (blank) and apply again → tokens go back to applying for all languages.

### 6. Package the `.vsix`
- In the project-root terminal: `vsce package`.
- **Expected:** final line ends with **`live-recolor-0.0.1.vsix`**, and the file exists in the project root
  (`Get-ChildItem *.vsix`).

If all six pass, **M5 is done — and so is the build.**

## What's automatable vs. checked by hand
- **Engine (pure, no F5):** step 02's `node -e` check proves `generate()` emits seven token colors + 13 semantic
  types. That's the only part verifiable without VS Code.
- **Everything else you check by hand in the EDH:** tokens recoloring, Revert/Reset, persistence-across-reload,
  export/import, language scoping, and packaging all require the running extension / CLI and can't be simulated
  from this guide. Verify them by eye against the expected outputs above.

## Files after this milestone (complete contents)
The files **created or modified in M5**. Unchanged since earlier milestones and **not repeated here**:
`src/engine/color.ts`, `combos.ts`, `profiles.ts` (M3–M4), `src/theme/settings.ts` (M2),
`media/webview/styles.css` (M4, already includes `.badge`/`.text`/`.muted`), `media/icon.svg` (M1), and the
generator files left as-is.

### `src/engine/types.ts`
```ts
export type Hex = string;

export interface StarterCombo {
  id: string;
  label: string;
  bg: Hex;
  surface: Hex;
  text: Hex;
  accent1: Hex;
  accent2: Hex;
}

// 8 coordinated roles every profile produces.
export interface Palette {
  bg: Hex;
  surface: Hex;
  surfaceAlt: Hex;
  text: Hex;
  textMuted: Hex;
  accent1: Hex;
  accent2: Hex;
  border: Hex;
}

export type ChromeColors = Record<string, Hex>;

export interface TokenColors {
  comments: Hex; keywords: Hex; strings: Hex; numbers: Hex;
  types: Hex; functions: Hex; variables: Hex;
}
export type SemanticColors = Record<string, Hex>;

export interface ThemeResult {
  palette: Palette;
  chrome: ChromeColors;
  tokens: TokenColors;
  semantic: SemanticColors;
}

export interface StyleProfile {
  id: string;
  label: string;
  family: 'generative' | 'signature';
  variants?: string[];
  buildPalette(combo: StarterCombo, variant?: string): Palette;
}
```

### `src/engine/generate.ts`
```ts
import { ChromeColors, Palette, StarterCombo, StyleProfile, ThemeResult, TokenColors, SemanticColors } from './types';
import { readableOn, mix, rotate, ensureContrast } from './color';

function paletteToChrome(p: Palette): ChromeColors {
  const onAccent = readableOn(p.accent1);
  return {
    'editor.background': p.bg,
    'editor.foreground': p.text,
    'sideBar.background': p.surface,
    'sideBar.foreground': p.text,
    'sideBarSectionHeader.background': p.surfaceAlt,
    'activityBar.background': p.surfaceAlt,
    'activityBar.foreground': p.accent1,
    'activityBar.activeBorder': p.accent1,
    'statusBar.background': p.accent1,
    'statusBar.foreground': onAccent,
    'titleBar.activeBackground': p.surfaceAlt,
    'titleBar.activeForeground': p.text,
    'tab.activeBackground': p.bg,
    'tab.inactiveBackground': p.surface,
    'tab.activeForeground': p.text,
    'tab.inactiveForeground': p.textMuted,
    'editorGroupHeader.tabsBackground': p.surface,
    'panel.background': p.surface,
    'panel.border': p.border,
    'focusBorder': p.accent2,
  };
}

function paletteToTokens(p: Palette): TokenColors {
  const on = (c: string) => ensureContrast(c, p.bg, 3);
  return {
    comments: on(p.textMuted),
    keywords: on(p.accent1),
    strings: on(p.accent2),
    numbers: on(rotate(p.accent2, 20)),
    types: on(rotate(p.accent1, -20)),
    functions: on(mix(p.accent2, p.text, 0.2)),
    variables: on(p.text),
  };
}

function paletteToSemantic(t: TokenColors): SemanticColors {
  return {
    variable: t.variables, parameter: t.variables, property: t.variables,
    function: t.functions, method: t.functions,
    class: t.types, type: t.types, interface: t.types, enum: t.types,
    keyword: t.keywords, string: t.strings, number: t.numbers, comment: t.comments,
  };
}

export function generate(combo: StarterCombo, profile: StyleProfile, variant?: string): ThemeResult {
  const palette = profile.buildPalette(combo, variant);
  const tokens = paletteToTokens(palette);
  return {
    palette,
    chrome: paletteToChrome(palette),
    tokens,
    semantic: paletteToSemantic(tokens),
  };
}
```

### `src/theme/apply.ts`
```ts
import * as vscode from 'vscode';
import { CHROME, TOKENS, SEMANTIC, TARGET } from './settings';
import { ThemeResult } from '../engine/types';

export async function applyChrome(chrome: Record<string, string>): Promise<void> {
  await vscode.workspace.getConfiguration(CHROME.section).update(CHROME.key, chrome, TARGET);
}

export async function applyTokens(tokens: ThemeResult['tokens'], languageId?: string): Promise<void> {
  const value = { comments: tokens.comments, keywords: tokens.keywords, strings: tokens.strings,
    numbers: tokens.numbers, types: tokens.types, functions: tokens.functions, variables: tokens.variables };
  const cfg = vscode.workspace.getConfiguration(TOKENS.section, languageId ? { languageId } : undefined);
  await cfg.update(TOKENS.key, value, TARGET, languageId ? true : undefined);
}

export async function applySemantic(semantic: ThemeResult['semantic'], languageId?: string): Promise<void> {
  const value = { enabled: true, rules: semantic };
  const cfg = vscode.workspace.getConfiguration(SEMANTIC.section, languageId ? { languageId } : undefined);
  await cfg.update(SEMANTIC.key, value, TARGET, languageId ? true : undefined);
}

// Accepts anything carrying the three color maps — a generated ThemeResult OR a saved set.
export async function applyTheme(
  theme: Pick<ThemeResult, 'chrome' | 'tokens' | 'semantic'>,
  languageId?: string,
): Promise<void> {
  if (!languageId) { await applyChrome(theme.chrome); } // chrome can't be language-scoped
  await applyTokens(theme.tokens, languageId);
  await applySemantic(theme.semantic, languageId);
}
```

### `src/theme/history.ts`
```ts
import * as vscode from 'vscode';
import { CHROME, TOKENS, SEMANTIC, TARGET } from './settings';

interface Snapshot { chrome: unknown; tokens: unknown; semantic: unknown; }

export class ThemeHistory {
  private stack: Snapshot[] = [];

  private capture(): Snapshot {
    const wb = vscode.workspace.getConfiguration(CHROME.section);
    const ed = vscode.workspace.getConfiguration(TOKENS.section);
    return {
      chrome: wb.inspect(CHROME.key)?.globalValue,
      tokens: ed.inspect(TOKENS.key)?.globalValue,
      semantic: ed.inspect(SEMANTIC.key)?.globalValue,
    };
  }

  private async restore(s: Snapshot): Promise<void> {
    const wb = vscode.workspace.getConfiguration(CHROME.section);
    const ed = vscode.workspace.getConfiguration(TOKENS.section);
    await wb.update(CHROME.key, s.chrome, TARGET);
    await ed.update(TOKENS.key, s.tokens, TARGET);
    await ed.update(SEMANTIC.key, s.semantic, TARGET);
  }

  async apply(fn: () => Promise<void>): Promise<void> {
    this.stack.push(this.capture());
    await fn();
  }

  async revert(): Promise<boolean> {
    const snap = this.stack.pop();
    if (!snap) return false;
    await this.restore(snap);
    return true;
  }

  async reset(): Promise<void> {
    await this.restore({ chrome: undefined, tokens: undefined, semantic: undefined });
    this.stack = [];
  }

  get depth(): number { return this.stack.length; }
}
```

### `src/storage/sets.ts`
```ts
import * as vscode from 'vscode';
import { ChromeColors, TokenColors, SemanticColors } from '../engine/types';

export interface SavedSet {
  name: string;
  comboId: string;
  profileId: string;
  variant?: string;
  chrome: ChromeColors;
  tokens: TokenColors;
  semantic: SemanticColors;
}

const KEY = 'liveRecolor.savedSets';

export function listSets(ctx: vscode.ExtensionContext): SavedSet[] {
  return ctx.globalState.get<SavedSet[]>(KEY, []);
}

export async function saveSet(ctx: vscode.ExtensionContext, set: SavedSet): Promise<void> {
  const sets = listSets(ctx).filter((s) => s.name !== set.name);
  sets.push(set);
  await ctx.globalState.update(KEY, sets);
}

export async function deleteSet(ctx: vscode.ExtensionContext, name: string): Promise<void> {
  await ctx.globalState.update(KEY, listSets(ctx).filter((s) => s.name !== name));
}

export function exportSets(ctx: vscode.ExtensionContext): string {
  return JSON.stringify(listSets(ctx), null, 2);
}

export async function importSets(ctx: vscode.ExtensionContext, json: string): Promise<number> {
  const incoming = JSON.parse(json) as SavedSet[];
  if (!Array.isArray(incoming)) throw new Error('Expected a JSON array of sets.');
  const byName = new Map(listSets(ctx).map((s) => [s.name, s]));
  for (const s of incoming) byName.set(s.name, s);
  const merged = [...byName.values()];
  await ctx.globalState.update(KEY, merged);
  return incoming.length;
}
```

### `src/panel/ThemePanelProvider.ts`
```ts
import * as vscode from 'vscode';
import { ThemeHistory } from '../theme/history';
import { applyTheme } from '../theme/apply';
import { COMBOS, comboById } from '../engine/combos';
import { PROFILES, profileById } from '../engine/profiles';
import { generate } from '../engine/generate';
import { contrastRatio } from '../engine/color';
import { listSets, saveSet, deleteSet, exportSets, importSets, SavedSet } from '../storage/sets';

export class ThemePanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'liveRecolor.panel';

  private view?: vscode.WebviewView;
  private last?: { comboId: string; profileId: string; variant?: string };

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly context: vscode.ExtensionContext,
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

### `src/extension.ts`
```ts
import * as vscode from 'vscode';
import { ThemePanelProvider } from './panel/ThemePanelProvider';
import { ThemeHistory } from './theme/history';

export function activate(context: vscode.ExtensionContext): void {
  const history = new ThemeHistory();
  const provider = new ThemePanelProvider(context.extensionUri, context, history);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ThemePanelProvider.viewType, provider),
  );
}

export function deactivate(): void {}
```

### `media/webview/main.js`
```js
(function () {
  const vscode = acquireVsCodeApi();
  const app = document.getElementById('app');
  const state = { combos: [], profiles: [], savedSets: [], comboId: null, profileId: null, variant: null, languageId: '' };

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.type === 'init') {
      state.combos = msg.combos;
      state.profiles = msg.profiles;
      state.savedSets = msg.savedSets || [];
      if (!state.comboId && state.combos[0]) state.comboId = state.combos[0].id;
      if (!state.profileId && state.profiles[0]) state.profileId = state.profiles[0].id;
      render();
      apply(); // apply the initial selection once, right after the first draw
    } else if (msg.type === 'applied') {
      renderPreview(msg.palette, msg.contrast);
    } else if (msg.type === 'savedSets') {
      state.savedSets = msg.savedSets || [];
      renderSaved();
    }
  });

  function apply() {
    if (!state.comboId || !state.profileId) return;
    vscode.postMessage({
      type: 'apply', comboId: state.comboId, profileId: state.profileId,
      variant: state.variant || undefined, languageId: state.languageId || undefined,
    });
  }

  function el(tag, props, ...kids) {
    const n = document.createElement(tag);
    Object.assign(n, props || {});
    for (const k of kids) n.append(k);
    return n;
  }
  function section(title, body) {
    return el('div', { className: 'section' }, el('h4', { textContent: title }), body);
  }

  function render() {
    app.innerHTML = '';

    const combosBox = el('div', { className: 'row' });
    for (const c of state.combos) {
      const b = el('button', { textContent: c.label, className: c.id === state.comboId ? 'chip active' : 'chip' });
      b.addEventListener('click', () => { state.comboId = c.id; render(); apply(); });
      combosBox.append(b);
    }
    app.append(section('Starter combination', combosBox));

    const profBox = el('div', { className: 'row' });
    for (const p of state.profiles) {
      const b = el('button', { textContent: p.label, className: p.id === state.profileId ? 'chip active' : 'chip' });
      b.addEventListener('click', () => { state.profileId = p.id; state.variant = null; render(); apply(); });
      profBox.append(b);
    }
    app.append(section('Style', profBox));

    const sel = state.profiles.find((p) => p.id === state.profileId);
    if (sel && sel.variants && sel.variants.length) {
      const vbox = el('div', { className: 'row' });
      for (const v of sel.variants) {
        const active = (state.variant || sel.variants[0]) === v;
        const b = el('button', { textContent: v, className: active ? 'chip active' : 'chip' });
        b.addEventListener('click', () => { state.variant = v; render(); apply(); });
        vbox.append(b);
      }
      app.append(section('Variant', vbox));
    }

    app.append(el('div', { id: 'preview', className: 'section' }));

    const lang = el('input', { id: 'lang', type: 'text', placeholder: 'languageId e.g. typescript (blank = all)', value: state.languageId, className: 'text' });
    lang.addEventListener('change', () => { state.languageId = lang.value.trim(); });
    app.append(section('Per-language (tokens only)', lang));

    const actions = el('div', { className: 'row' });
    const mk = (label, type) => { const b = el('button', { textContent: label, className: 'btn' }); b.addEventListener('click', () => vscode.postMessage({ type })); return b; };
    actions.append(mk('Revert', 'revert'), mk('Reset', 'reset'));
    const saveBtn = el('button', { textContent: 'Save set…', className: 'btn' });
    saveBtn.addEventListener('click', () => {
      const name = (document.getElementById('setname')).value.trim();
      if (name) vscode.postMessage({ type: 'save', name });
    });
    actions.append(mk('Export', 'export'), mk('Import', 'import'), saveBtn);
    const nameInput = el('input', { id: 'setname', type: 'text', placeholder: 'set name', className: 'text' });
    app.append(section('Actions', el('div', {}, nameInput, actions)));

    app.append(el('div', { id: 'saved', className: 'section' }));
    renderSaved();
  }

  function renderPreview(palette, contrast) {
    const box = document.getElementById('preview');
    if (!box) return;
    box.innerHTML = '';
    box.append(el('h4', { textContent: 'Palette' }));
    const strip = el('div', { className: 'swatches' });
    for (const key of ['bg', 'surface', 'surfaceAlt', 'text', 'textMuted', 'accent1', 'accent2', 'border']) {
      const sw = el('div', { className: 'swatch', title: key + ' ' + palette[key] });
      sw.style.background = palette[key];
      strip.append(sw);
    }
    box.append(strip);
    const aa = contrast >= 4.5, aaa = contrast >= 7;
    const badge = el('span', { className: 'badge ' + (aaa ? 'ok' : aa ? 'warn' : 'bad'),
      textContent: 'text/bg contrast ' + contrast + ':1 ' + (aaa ? 'AAA' : aa ? 'AA' : 'FAIL') });
    box.append(badge);
  }

  function renderSaved() {
    const box = document.getElementById('saved');
    if (!box) return;
    box.innerHTML = '';
    box.append(el('h4', { textContent: 'My sets' }));
    if (!state.savedSets.length) { box.append(el('p', { className: 'muted', textContent: 'No saved sets yet.' })); return; }
    for (const name of state.savedSets) {
      const row = el('div', { className: 'row' });
      const apply = el('button', { textContent: name, className: 'chip' });
      apply.addEventListener('click', () => vscode.postMessage({ type: 'applySet', name }));
      const del = el('button', { textContent: '✕', className: 'chip' });
      del.addEventListener('click', () => vscode.postMessage({ type: 'delete', name }));
      row.append(apply, del);
      box.append(row);
    }
  }

  vscode.postMessage({ type: 'ready' });
})();
```

### `package.json`
```jsonc
{
  "name": "live-recolor",
  "displayName": "Live Recolor",
  "description": "Live-recolor the whole editor from a sidebar panel.",
  "version": "0.0.1",
  "publisher": "example",
  "repository": {
    "type": "git",
    "url": "https://github.com/example/live-recolor"
  },
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

## Troubleshooting sheet (M5 traps)
| Symptom | Usual cause | Fix |
|---------|-------------|-----|
| Chrome recolors but code text doesn't | `apply` handler still calls `applyChrome` | it must call `applyTheme(theme, m.languageId \|\| undefined)` (step 06) |
| Semantic seems to "do nothing" | no language server on the file, or `enabled` missing | test on a `.ts` file with the TS server; confirm `applySemantic` sets `enabled: true` (**expected**, not a bug — see the trap note above) |
| Revert leaves token colors stuck | `history` snapshot didn't capture all three | `capture`/`restore` must include `tokens` + `semantic` (step 04) |
| Reset blanks instead of removing keys | restored `{}` not `undefined` | `reset()` must restore `undefined` for all three (step 04) |
| Saved sets vanish on reload | forgot `await` on `globalState.update`, or key mismatch | all storage funnels through the one `KEY` constant + awaited updates (step 05) |
| Language-scoped apply hits all files | missing `{ languageId }` scope or the `true` 4th arg | both are required together in `applyTokens`/`applySemantic` (step 03) |
| Import does nothing / throws | file isn't a JSON array, or bytes not decoded | array only; decode `readFile` bytes with `Buffer.from(bytes).toString('utf8')` (step 08) |
| `ERROR Missing publisher name` | no `publisher` in `package.json` | add `"publisher": "example"` (step 09) |
| `vsce: command not found` | CLI not installed | `npm install -g @vscode/vsce` or `npx @vscode/vsce package` (step 09) |

## You're done — what you built
Over five milestones you built a complete, installable VS Code extension from an empty scaffold:

- **M1** — a real extension with an Activity-Bar icon, a Webview sidebar panel, and two-way messaging.
- **M2** — a non-destructive backbone: snapshot-before-write, Revert, Reset — one write path, always reversible.
- **M3** — a pure, `vscode`-free color engine: hex↔HSL math, WCAG contrast, 5 starter combos, 9 generative
  profiles that derive a full chrome palette from a seed.
- **M4** — an externalized gallery UI (13 profiles incl. 4 signature presets) with live swatch preview and a WCAG
  contrast readout — the reality-check gate where the tool became genuinely usable.
- **M5** — syntax + semantic **token** recoloring, **saved sets** persisted in `globalState`, **JSON import/export**,
  **per-language token scoping** (and the taught reason chrome can't be scoped), and a packaged
  **`live-recolor-0.0.1.vsix`**.

The architecture held the whole way: a pure engine you can unit-test in plain Node, a thin adapter that owns every
side effect, and a single choke point for settings writes that kept "non-destructive" honest even as the surface
grew from one workbench color to three full customization settings.

**Where to go next (all deliberately out of scope here):** publish to the Marketplace with `vsce publish`
(needs a registered publisher + token); add file-icon/product-icon theming; or reframe per-language scoping as
per-*workspace* theming (chrome *can* vary per workspace — a different feature, noted in [D2](../foundation/decision-log.md#d2--per-language-scoping-is-tokens-only)).

## Next
There is no M6 — this was the final milestone. Head back to the **[guide front door](../README.md)** for the
one-page recap and the Updates log.

---
> Nav: [← Package the .vsix](09_package.md) · [Overview](00_overview.md) · [Guide front door →](../README.md)
