# M4 · Step 06 of 6 — Verify the milestone + the ⭐ reality check
> Nav: [← Wire the extension](05_wire-extension.md) · [Overview](00_overview.md) · [M5 → Tokens, persistence, packaging](../MILESTONE_5_tokens-persistence-packaging/00_overview.md)

## Done-when gate (run every check)
Do these in order; each pairs an action with the **exact** result you should see. Checks 1–2 are the pure-engine
verifications (no F5 needed); 3–8 run in the Extension Development Host.

1. **Registry holds 13** — in the project terminal (after `npm run compile`):
   ```powershell
   node -e "const {PROFILES,GENERATIVE,SIGNATURE}=require('./out/engine/profiles.js'); console.log(PROFILES.length, GENERATIVE.length, SIGNATURE.length)"
   ```
   → prints `13 9 4`.
2. **Signature palette is fixed** — the Game Boy DMG background is the classic dark green regardless of combo:
   ```powershell
   node -e "const {profileById}=require('./out/engine/profiles.js'); console.log(profileById('game-boy').buildPalette({},'dmg').bg, profileById('game-boy').buildPalette({},'light').bg)"
   ```
   → prints `#0f380f #c4cfa1` (dmg dark green, light olive).
3. **Launch** — press <kbd>F5</kbd> → the **[Extension Development Host]** opens with no error notification; click
   the Live Recolor palette icon in its Activity Bar.
4. **Gallery renders** — the panel shows a **"Starter combination"** row with **5** combo chips
   (Deep Sea, Ember, Grove, Orchid, Graphite) and a **"Style"** row with **13** style chips (the 9 generative +
   Game Boy, 16-bit, Synthwave, Terminal / CRT). **No dropdowns.** One chip in each row is highlighted (the
   `active` class), and the chrome is already recolored (enforced-on-select applied the defaults on load).
5. **Generative combo recolors + preview** — click **Deep Sea**, then **Neon**:
   - The whole editor chrome recolors live (editor background, side bar, activity bar, status bar, tabs).
   - A **"Palette"** section shows an **8-swatch strip** (bg, surface, surfaceAlt, text, textMuted, accent1,
     accent2, border) — hover a swatch to see its role + hex in the tooltip.
   - A badge reads roughly **`text/bg contrast 12.3:1 AAA`** (exact number varies; Deep Sea's light text on its dark
     background is well past 7:1, so **AAA**, green badge).
6. **Signature + variant** — click **Game Boy**:
   - The chrome turns the Game Boy DMG greens; the swatch strip shows the green palette.
   - A **"Variant"** row appears with **dmg / pocket / light**. Click **light** → the chrome re-applies live to the
     olive light-screen palette (the swatch strip and contrast badge update). Click **Terminal / CRT** → the variant
     row changes to **green / amber**.
7. **Revert** — after a few picks, click **Revert** repeatedly: **the very first click already steps the chrome
   back** to the previous selection's colors — one snapshot per pick, not two (if the first Revert looks inert,
   `render()` is double-applying; see step 03). Keep clicking and it walks back toward your pre-M4 state.
8. **Reset** — click **Reset**: all color customizations are removed and the editor returns to its base theme.
   (Confirm in **File → Preferences → Settings → open `settings.json`**: `workbench.colorCustomizations` is gone,
   not left as `{}`.)

If all eight pass, M4's mechanics are done.

## ⭐ Reality check — stop building and use it
This is the milestone the whole ladder was pointing at: the first time Live Recolor is a **tool**, not a demo. Before
you touch M5, **actually use it.**

1. Leave the Extension Development Host open as your editor for a real task — read some code, edit a file — for at
   least 10–15 minutes.
2. Cycle through a few combos and styles as you work. Try at least: one dark generative (Neon or Midnight), one
   accessible one (High Contrast — note its badge should read **AAA**), and two signature presets with their
   variants (Game Boy dmg/light, Terminal green/amber).
3. Watch the **contrast badge** as you go. If a combo/style pair drops to **AA** (amber) or **FAIL** (red), that's
   the readout doing its job — decide whether that pair is one you'd actually ship.
4. Ask yourself the gate question honestly: **is this worth finishing?** M5 adds real weight — recoloring the code
   text (tokens), saving named sets, import/export, per-language scoping, and packaging a `.vsix`. Those are worth
   it only if the chrome experience already feels good to you here. If something about the *chrome* still bugs you
   (a profile you'd re-tune, a combo you'd swap), fix it now in the engine — it's cheaper before tokens layer on top.

There's nothing to type for this check. It's a deliberate pause: proceed to M5 only once you've decided the tool
earns it.

## Files after this milestone (complete contents)
The files **created or modified in M4**. Unchanged engine/theme files from M2–M3 (`color.ts`, `types.ts`,
`combos.ts`, `generate.ts`, `settings.ts`, `apply.ts`, `history.ts`), `package.json`, and `media/icon.svg` are as
those milestones left them.

### `src/engine/profiles.ts`  (all 13 profiles)
```ts
import { Palette, StarterCombo, StyleProfile } from './types';
import { darken, lighten, saturate, desaturate, setHue, mix, ensureContrast } from './color';

// Shared base: map a combo's 5 colors to the 8 palette roles.
function base(combo: StarterCombo): Palette {
  return {
    bg: combo.bg,
    surface: combo.surface,
    surfaceAlt: lighten(combo.surface, 0.04),
    text: combo.text,
    textMuted: mix(combo.text, combo.surface, 0.5),
    accent1: combo.accent1,
    accent2: combo.accent2,
    border: mix(combo.surface, combo.text, 0.15),
  };
}

export const GENERATIVE: StyleProfile[] = [
  {
    id: 'neon', label: 'Neon', family: 'generative',
    buildPalette: (c) => {
      const p = base(c);
      return { ...p,
        bg: darken(p.bg, 0.03), surface: darken(p.surface, 0.02),
        accent1: saturate(lighten(p.accent1, 0.05), 0.3),
        accent2: saturate(lighten(p.accent2, 0.05), 0.3),
        text: lighten(p.text, 0.02) };
    },
  },
  {
    id: 'pastel', label: 'Pastel', family: 'generative',
    buildPalette: (c) => {
      const p = base(c);
      return { ...p,
        surface: lighten(p.surface, 0.06), surfaceAlt: lighten(p.surfaceAlt, 0.06),
        accent1: lighten(desaturate(p.accent1, 0.25), 0.12),
        accent2: lighten(desaturate(p.accent2, 0.25), 0.12) };
    },
  },
  {
    id: 'midnight', label: 'Midnight / OLED', family: 'generative',
    buildPalette: (c) => {
      const p = base(c);
      return { ...p, bg: '#000000', surface: darken(p.surface, 0.06), surfaceAlt: darken(p.surfaceAlt, 0.05) };
    },
  },
  {
    id: 'warm-sepia', label: 'Warm Sepia', family: 'generative',
    buildPalette: (c) => {
      const p = base(c);
      const warm = (h: string, t: number) => mix(h, '#c98a3c', t);
      return { ...p,
        bg: warm(p.bg, 0.10), surface: warm(p.surface, 0.12), surfaceAlt: warm(p.surfaceAlt, 0.12),
        text: warm(p.text, 0.06), textMuted: warm(p.textMuted, 0.10),
        accent1: setHue(p.accent1, 32), accent2: setHue(p.accent2, 44) };
    },
  },
  {
    id: 'material', label: 'Material', family: 'generative',
    buildPalette: (c) => {
      const p = base(c);
      return { ...p,
        bg: '#121212', surface: '#1e1e1e', surfaceAlt: '#242424',
        text: '#e0e0e0', textMuted: '#9e9e9e',
        accent1: saturate(p.accent1, 0.05), accent2: saturate(p.accent2, 0.05),
        border: '#2c2c2c' };
    },
  },
  {
    id: 'nature', label: 'Nature', family: 'generative', variants: ['ocean', 'forest'],
    buildPalette: (c, variant = 'ocean') => {
      const p = base(c);
      const hue = variant === 'forest' ? 140 : 200;
      return { ...p,
        bg: mix(p.bg, setHue(p.bg, hue), 0.5),
        surface: mix(p.surface, setHue(p.surface, hue), 0.5),
        accent1: setHue(p.accent1, hue),
        accent2: setHue(p.accent2, hue + (variant === 'forest' ? 40 : -30)) };
    },
  },
  {
    id: 'high-contrast', label: 'High Contrast (AAA)', family: 'generative',
    buildPalette: (c) => {
      const p = base(c);
      const bg = darken(p.bg, 0.02);
      return { ...p, bg,
        text: ensureContrast(p.text, bg, 7),
        textMuted: ensureContrast(p.textMuted, bg, 4.5),
        accent1: ensureContrast(saturate(p.accent1, 0.1), bg, 7),
        accent2: ensureContrast(saturate(p.accent2, 0.1), bg, 7),
        border: ensureContrast(p.border, bg, 3) };
    },
  },
  {
    id: 'muted', label: 'Muted / Low-strain', family: 'generative',
    buildPalette: (c) => {
      const p = base(c);
      return { ...p,
        text: desaturate(darken(p.text, 0.05), 0.1),
        accent1: desaturate(darken(p.accent1, 0.05), 0.25),
        accent2: desaturate(darken(p.accent2, 0.05), 0.25) };
    },
  },
  {
    id: 'monochrome', label: 'Monochrome + Accent', family: 'generative',
    buildPalette: (c) => {
      const p = base(c);
      const gray = (h: string) => desaturate(h, 1);
      return {
        bg: gray(p.bg), surface: gray(p.surface), surfaceAlt: gray(p.surfaceAlt),
        text: gray(p.text), textMuted: gray(p.textMuted), border: gray(p.border),
        accent1: p.accent1, accent2: p.accent1 };
    },
  },
];

// M4 — the 4 fixed-identity signature presets.
export const SIGNATURE: StyleProfile[] = [
  {
    id: 'game-boy', label: 'Game Boy', family: 'signature', variants: ['dmg', 'pocket', 'light'],
    buildPalette: (_c, variant = 'dmg') => {
      if (variant === 'pocket') return fixed('#0d0d0d', '#2b2b2b', '#8b8b8b', '#c4c4c4', '#5a5a5a');
      if (variant === 'light') return fixed('#c4cfa1', '#8b956d', '#4d533c', '#1f1f1f', '#4d533c');
      return fixed('#0f380f', '#306230', '#9bbc0f', '#8bac0f', '#306230'); // dmg
    },
  },
  {
    id: 'sixteen-bit', label: '16-bit', family: 'signature',
    buildPalette: () => fixed('#1a1c2c', '#29366f', '#f4f4f4', '#ef7d57', '#41a6f6'),
  },
  {
    id: 'synthwave', label: 'Synthwave', family: 'signature',
    buildPalette: () => fixed('#241b2f', '#2a2139', '#f8f8f2', '#ff7edb', '#36f9f6'),
  },
  {
    id: 'terminal', label: 'Terminal / CRT', family: 'signature', variants: ['green', 'amber'],
    buildPalette: (_c, variant = 'green') => variant === 'amber'
      ? fixed('#0a0600', '#1a1200', '#ffb000', '#ffc433', '#7a5200')
      : fixed('#001100', '#002200', '#33ff33', '#66ff66', '#0a5a0a'),
  },
];

// Helper: build an 8-role palette from a signature's core colors.
function fixed(bg: string, surface: string, text: string, accent1: string, accent2: string): Palette {
  return {
    bg, surface, surfaceAlt: lighten(surface, 0.04),
    text, textMuted: mix(text, surface, 0.5),
    accent1, accent2, border: mix(surface, text, 0.2),
  };
}

export const PROFILES: StyleProfile[] = [...GENERATIVE, ...SIGNATURE];

export function profileById(id: string): StyleProfile {
  return PROFILES.find((p) => p.id === id) ?? PROFILES[0];
}
```

### `media/webview/styles.css`
```css
body { font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); color: var(--vscode-foreground); padding: 8px; }
h4 { margin: 12px 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; opacity: .8; }
.section { margin-bottom: 8px; }
.row { display: flex; flex-wrap: wrap; gap: 6px; }
.chip, .btn {
  font: inherit; cursor: pointer; border-radius: 4px; padding: 4px 8px;
  border: 1px solid var(--vscode-button-border, transparent);
  background: var(--vscode-button-secondaryBackground, #2a2d2e); color: var(--vscode-button-secondaryForeground, #ccc);
}
.chip.active { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
.chip:hover, .btn:hover { background: var(--vscode-button-hoverBackground); }
.text { width: 100%; box-sizing: border-box; padding: 4px 6px; margin-bottom: 6px;
  background: var(--vscode-input-background); color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border, #3c3c3c); border-radius: 4px; }
.swatches { display: flex; gap: 4px; margin-bottom: 6px; }
.swatch { width: 22px; height: 22px; border-radius: 4px; border: 1px solid rgba(255,255,255,.15); }
.badge { font-size: 11px; padding: 2px 6px; border-radius: 4px; }
.badge.ok { background: #1a7f37; color: #fff; }
.badge.warn { background: #9a6700; color: #fff; }
.badge.bad { background: #b62324; color: #fff; }
.muted { opacity: .6; }
```

### `media/webview/main.js`  (M4 subset — no language/save/export/import/saved-sets)
```js
(function () {
  const vscode = acquireVsCodeApi();
  const app = document.getElementById('app');
  const state = { combos: [], profiles: [], comboId: null, profileId: null, variant: null };

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.type === 'init') {
      state.combos = msg.combos;
      state.profiles = msg.profiles;
      if (!state.comboId && state.combos[0]) state.comboId = state.combos[0].id;
      if (!state.profileId && state.profiles[0]) state.profileId = state.profiles[0].id;
      render();
      apply(); // apply the initial selection once, right after the first draw
    } else if (msg.type === 'applied') {
      renderPreview(msg.palette, msg.contrast);
    }
  });

  function apply() {
    if (!state.comboId || !state.profileId) return;
    vscode.postMessage({ type: 'apply', comboId: state.comboId, profileId: state.profileId, variant: state.variant || undefined });
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

    const actions = el('div', { className: 'row' });
    const mk = (label, type) => { const b = el('button', { textContent: label, className: 'btn' }); b.addEventListener('click', () => vscode.postMessage({ type })); return b; };
    actions.append(mk('Revert', 'revert'), mk('Reset', 'reset'));
    app.append(section('Actions', actions));
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
    box.append(el('span', {
      className: 'badge ' + (aaa ? 'ok' : aa ? 'warn' : 'bad'),
      textContent: 'text/bg contrast ' + contrast + ':1 ' + (aaa ? 'AAA' : aa ? 'AA' : 'FAIL'),
    }));
  }

  vscode.postMessage({ type: 'ready' });
})();
```

### `src/panel/ThemePanelProvider.ts`  (END OF M4)
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

### `src/extension.ts`  (M4)
```ts
import * as vscode from 'vscode';
import { ThemePanelProvider } from './panel/ThemePanelProvider';
import { ThemeHistory } from './theme/history';

export function activate(context: vscode.ExtensionContext): void {
  const history = new ThemeHistory();
  const provider = new ThemePanelProvider(context.extensionUri, history);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ThemePanelProvider.viewType, provider),
  );
}

export function deactivate(): void {}
```

## Troubleshooting sheet (M4 traps)
| Symptom | Usual cause | Fix |
|---------|-------------|-----|
| Panel shows **nothing** (blank `#app`) | `localResourceRoots` doesn't include `media`, or the CSP blocks the files | Confirm `localResourceRoots: [Uri.joinPath(extensionUri, 'media')]`; CSP must have `style-src ${webview.cspSource}` and `script-src 'nonce-…'` |
| Chips render but **unstyled** | `styles.css` not loaded | Check the `<link href>` uses `asWebviewUri`, the file is at `media/webview/styles.css`, and `style-src` allows `${webview.cspSource}` |
| **No chips at all**, but no error | `init` never sent/received | The webview must post `{type:'ready'}` (last line of `main.js`); the provider must reply to `ready` with `init`; message type strings must match exactly |
| Chrome recolors but **swatches blank / no badge** | the `applied` post is missing or malformed | The `apply` handler must `this.post({ type:'applied', palette, contrast })`; `main.js`'s listener draws on `applied` |
| Only **9** style chips | provider still imports `GENERATIVE` for the list, or `PROFILES` wasn't updated | Import `PROFILES` (all 13) in the provider; set `PROFILES = [...GENERATIVE, ...SIGNATURE]` in `profiles.ts` |
| **`Uri.joinPath is not a function`** | typo / wrong import | Use `vscode.Uri.joinPath(...)`; `Uri` comes from `import * as vscode` |
| Signature style looks like a **generative** palette | variant branch not hit, or wrong id | Chip must post the exact id (`game-boy`, `terminal`); `buildPalette` reads `variant` |
| `acquireVsCodeApi is not defined` | `enableScripts: true` missing | Set it in `resolveWebviewView`'s `webview.options` |
| Panel didn't change after edits | stale EDH | <kbd>Shift</kbd>+<kbd>F5</kbd> then <kbd>F5</kbd> to relaunch |

## Next
These eight hands-on checks are the same gate as the **seven** aggregated Done-when conditions in
[00_overview.md](00_overview.md) — the walkthrough splits some of them into finer steps, so the counts aren't 1:1.

Once all eight gate checks pass **and** you've done the ⭐ reality check and decided it's worth finishing, continue
to **[M5 — Tokens, persistence, packaging](../MILESTONE_5_tokens-persistence-packaging/00_overview.md)**: recolor
the code text (syntax + semantic tokens), **Save** named sets that survive a reload, **export/import** as JSON,
**scope tokens per language**, and build the shippable **`.vsix`**.

---
> Nav: [← Wire the extension](05_wire-extension.md) · [Overview](00_overview.md) · [M5 → Tokens, persistence, packaging](../MILESTONE_5_tokens-persistence-packaging/00_overview.md)
