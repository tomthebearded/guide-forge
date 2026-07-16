# M3 · Step 08 of 8 — Verify the milestone + file checkpoint
> Nav: [← Panel: two dropdowns](07_panel-selects.md) · [Overview](00_overview.md) · [M4 → Preset gallery + panel UX](../MILESTONE_4_gallery-and-ux/00_overview.md)

## Done-when gate (run every check)
Do these in order; each pairs an action with the **exact** result you should see. The first is pure Node (no F5);
the rest run in the Extension Development Host.

1. **Engine math (Node, no F5)** — compile, then run a one-liner against the compiled engine:
   ```powershell
   npx tsc -p ./
   node -e "const c=require('./out/engine/color'); console.log('round-trip', c.hslToHex(c.hexToHsl('#3ec6ff'))); console.log('contrast', c.contrastRatio('#ffffff','#000000'))"
   ```
   **Expected — exactly:**
   ```
   round-trip #3ec6ff
   contrast 21
   ```
   (Round-trip is lossless; black-on-white contrast is the maximum `21`.)

2. **Engine wiring (Node, no F5)** — prove `generate` produces a full chrome object:
   ```powershell
   node -e "const {generate}=require('./out/engine/generate'); const {comboById}=require('./out/engine/combos'); const {profileById}=require('./out/engine/profiles'); const t=generate(comboById('deep-sea'),profileById('midnight')); console.log('keys', Object.keys(t.chrome).length); console.log('bg', t.chrome['editor.background'])"
   ```
   **Expected — exactly:**
   ```
   keys 20
   bg #000000
   ```
   (20 workbench keys; Midnight forces `editor.background` to pure black.)

3. **Panel dropdowns** — press <kbd>F5</kbd>, open the Live Recolor panel. It shows a **Starter** dropdown with 5
   options (Deep Sea, Ember, Grove, Orchid, Graphite) and a **Style** dropdown with 9 options (Neon … Monochrome +
   Accent), above **Apply / Revert / Reset**.

4. **Live chrome apply** — pick **Deep Sea** + **Neon** (or click **Apply**). The whole editor *chrome* recolors at
   once and live (no reload): editor background deep navy, sidebar/activity bar dark, **status bar a bright cyan
   with readable text**, tabs and panels coordinated.

5. **Settings diff** — open your User `settings.json` (Command Palette → **Preferences: Open User Settings (JSON)**).
   `workbench.colorCustomizations` is now present with **20 keys**, e.g.:
   ```jsonc
   "workbench.colorCustomizations": {
     "editor.background": "#08151f",
     "statusBar.background": "#5cd0ff",
     "statusBar.foreground": "#111111",
     "activityBar.activeBorder": "#5cd0ff"
     // …20 keys total
   }
   ```
   (Exact hexes depend on the profile's math; the **key count** and **coherence** are what matter.)

6. **Switch re-applies live** — change the **Style** dropdown to **Midnight / OLED**. The editor background snaps to
   pure black (`#000000`) immediately, without touching Apply.

7. **Revert restores** — click **Revert**. The previous palette (Neon) returns exactly — verify against the
   settings.json diff: `editor.background` goes back to the Neon value. Click **Revert** again → back to whatever was
   there before M3. Click **Reset** → `workbench.colorCustomizations` is **removed** from settings entirely (the M2
   backbone is intact).

If all seven pass, **M3 is done**: a starter combo + a generative profile produces a full, coordinated, live,
revertible chrome theme — through a pure engine you verified in plain Node. Tokens, the gallery, swatches, and the
contrast readout are still ahead.

## Files after this milestone (complete current contents)
Files **created this milestone**: the five `src/engine/*` files. File **modified this milestone**:
`src/panel/ThemePanelProvider.ts`. `src/extension.ts`, `src/theme/*`, `package.json`, and `media/icon.svg` are
**unchanged from M2**.

### `src/engine/color.ts`
```ts
// Pure color math. No VS Code imports. Colors cross the boundary as "#rrggbb" strings.

export interface Rgb { r: number; g: number; b: number; } // 0..255
export interface Hsl { h: number; s: number; l: number; }  // h 0..360, s/l 0..1

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const to2 = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}

export function hexToHsl(hex: string): Hsl {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)); break;
      case gn: h = ((bn - rn) / d + 2); break;
      default: h = ((rn - gn) / d + 4); break;
    }
    h *= 60;
  }
  return { h, s, l };
}

export function hslToHex({ h, s, l }: Hsl): string {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 1);
  l = clamp(l, 0, 1);
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return rgbToHex({ r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 });
}

export function lighten(hex: string, amount: number): string {
  const c = hexToHsl(hex); return hslToHex({ ...c, l: c.l + amount });
}
export function darken(hex: string, amount: number): string {
  const c = hexToHsl(hex); return hslToHex({ ...c, l: c.l - amount });
}
export function saturate(hex: string, amount: number): string {
  const c = hexToHsl(hex); return hslToHex({ ...c, s: c.s + amount });
}
export function desaturate(hex: string, amount: number): string {
  const c = hexToHsl(hex); return hslToHex({ ...c, s: c.s - amount });
}
export function rotate(hex: string, degrees: number): string {
  const c = hexToHsl(hex); return hslToHex({ ...c, h: c.h + degrees });
}
export function setHue(hex: string, hue: number): string {
  const c = hexToHsl(hex); return hslToHex({ ...c, h: hue });
}
export function mix(a: string, b: string, t: number): string {
  const ca = hexToRgb(a), cb = hexToRgb(b);
  return rgbToHex({
    r: ca.r + (cb.r - ca.r) * t,
    g: ca.g + (cb.g - ca.g) * t,
    b: ca.b + (cb.b - ca.b) * t,
  });
}

// WCAG relative luminance + contrast ratio.
function channelLuminance(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a), lb = relativeLuminance(b);
  const hi = Math.max(la, lb), lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

// Return near-black or near-white, whichever reads better on `bg`.
export function readableOn(bg: string): string {
  return contrastRatio('#ffffff', bg) >= contrastRatio('#111111', bg) ? '#ffffff' : '#111111';
}

// Nudge `fg` lighter/darker until it hits `ratio` against `bg` (or clamps).
export function ensureContrast(fg: string, bg: string, ratio: number): string {
  if (contrastRatio(fg, bg) >= ratio) return fg;
  const goLighter = relativeLuminance(bg) < 0.5;
  let c = hexToHsl(fg);
  for (let i = 0; i < 100; i++) {
    c = { ...c, l: clamp(c.l + (goLighter ? 0.01 : -0.01), 0, 1) };
    const candidate = hslToHex(c);
    if (contrastRatio(candidate, bg) >= ratio) return candidate;
    if (c.l <= 0 || c.l >= 1) break;
  }
  return goLighter ? '#ffffff' : '#111111';
}
```

### `src/engine/types.ts`  *(M3 version — chrome only)*
```ts
// [M3 version] — chrome only. [M5] appends TokenColors, SemanticColors, and tokens/semantic on ThemeResult.
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

export interface ThemeResult {
  palette: Palette;
  chrome: ChromeColors;
  // [M5] adds: tokens: TokenColors; semantic: SemanticColors;
}

export interface StyleProfile {
  id: string;
  label: string;
  family: 'generative' | 'signature';
  variants?: string[];                       // e.g. Nature: ['ocean','forest']
  buildPalette(combo: StarterCombo, variant?: string): Palette;
}
```

### `src/engine/combos.ts`
```ts
import { StarterCombo } from './types';

export const COMBOS: StarterCombo[] = [
  { id: 'deep-sea', label: 'Deep Sea', bg: '#0b1a2b', surface: '#13293d', text: '#dbe9f4', accent1: '#3ec6ff', accent2: '#5eead4' },
  { id: 'ember',    label: 'Ember',    bg: '#1b1210', surface: '#2a1a15', text: '#f6e7dd', accent1: '#ff7849', accent2: '#ffd24c' },
  { id: 'grove',    label: 'Grove',    bg: '#0f1f17', surface: '#183025', text: '#e4f2ea', accent1: '#5fd68b', accent2: '#b8d96a' },
  { id: 'orchid',   label: 'Orchid',   bg: '#170f22', surface: '#241634', text: '#efe6f7', accent1: '#c084fc', accent2: '#ff77c8' },
  { id: 'graphite', label: 'Graphite', bg: '#17191c', surface: '#212429', text: '#e6e8ea', accent1: '#7dd3fc', accent2: '#9aa0a6' },
];

export function comboById(id: string): StarterCombo {
  return COMBOS.find((c) => c.id === id) ?? COMBOS[0];
}
```

### `src/engine/profiles.ts`  *(9 generative profiles)*
```ts
// [M3] exports GENERATIVE (9 profiles) + PROFILES = [...GENERATIVE]. [M4] appends SIGNATURE.
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

// [M3] PROFILES = [...GENERATIVE]. [M4] becomes [...GENERATIVE, ...SIGNATURE].
export const PROFILES: StyleProfile[] = [...GENERATIVE];

export function profileById(id: string): StyleProfile {
  return PROFILES.find((p) => p.id === id) ?? PROFILES[0];
}
```

### `src/engine/generate.ts`  *(M3 version — `{ palette, chrome }`)*
```ts
// [M3 version] returns { palette, chrome } only. [M5] adds tokens + semantic.
import { ChromeColors, Palette, StarterCombo, StyleProfile, ThemeResult } from './types';
import { readableOn } from './color';

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

export function generate(combo: StarterCombo, profile: StyleProfile, variant?: string): ThemeResult {
  const palette = profile.buildPalette(combo, variant);
  return {
    palette,
    chrome: paletteToChrome(palette),
  };
}
```

### `src/panel/ThemePanelProvider.ts`  *(END OF M3)*
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

## Troubleshooting sheet (M3 traps)
| Symptom | Usual cause | Fix |
|---------|-------------|-----|
| `node -e` can't find `./out/engine/color` | project not compiled, or wrong path | Run `npx tsc -p ./`; the output mirrors `src/` under `out/` |
| `Cannot use import statement outside a module` | you ran the `.ts`, not the compiled `.js` | Node runs `out/engine/*.js`; compile first |
| `contrast` prints something other than `21` | typo in `contrastRatio`/luminance weights | Weights `0.2126/0.7152/0.0722`; ratio `(hi+0.05)/(lo+0.05)` |
| Dropdowns empty in the panel | `COMBOS`/`GENERATIVE` not imported, or option map missing | Confirm imports + `${comboOpts}`/`${profOpts}` inside the `<select>`s |
| Only the status bar changes | you left M2's `applyDemo` handler | Replace with the `apply` case that applies `theme.chrome` |
| Colors apply but Revert does nothing | `applyChrome` called outside `history.apply` | Wrap it: `this.history.apply(() => applyChrome(theme.chrome))` |
| `ThemePanelProvider` argument-count error | `extension.ts` drifted from M2 | Ctor is `(history)`; `extension.ts` calls `new ThemePanelProvider(history)` |
| Engine won't compile: "Cannot find module 'vscode'" in `engine/` | you imported `vscode` into the pure engine | Remove it — the engine is `vscode`-free by design |

## Next
These seven hands-on checks are the same gate as the **six** aggregated Done-when conditions in
[00_overview.md](00_overview.md) — the walkthrough splits some of them into finer steps, so the counts aren't 1:1.

Once all seven gate checks pass, continue to **[M4 — Preset gallery + panel UX](../MILESTONE_4_gallery-and-ux/00_overview.md)**:
the two dropdowns become the full chip gallery (5 combos × 9 generative **+ 4 signature presets**), with a live
palette **swatch preview** and a **WCAG contrast readout**, and the webview moves out to `media/webview/`. M4 is the
*reality-check gate* — where you stop and actually use it.

---
> Nav: [← Panel: two dropdowns](07_panel-selects.md) · [Overview](00_overview.md) · [M4 → Preset gallery + panel UX](../MILESTONE_4_gallery-and-ux/00_overview.md)
