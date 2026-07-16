# M11 · Step 02 of 10 — The settings store: CSS defaults, saved overrides, live mirror
> Nav: [← Appearance cache](01_appearance-cache.md) · [Overview](00_overview.md) · [Grow the renderer →](03_renderer-live-appearance.md)

## Glossary for this step
> **CSS custom property** — a `--name: value` variable declared on an element (here `:root`/`html`) that CSS
> reads via `var(--name)` and JS reads/writes via `getComputedStyle(el).getPropertyValue(name)` /
> `el.style.setProperty(name, value)`. This app declares its appearance tokens (`--space-void`, `--neon-teal`,
> `--globe-ocean`, `--globe-land-cold/mid/hot`, `--flight-marker`, …) once in `styles.scss` (M0). See
> [MDN: custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties).
> **`LivePalette`** — the *subset* of the appearance colours the three.js renderer actually consumes (six
> `#rrggbb` strings). The other colours (background, tertiary accent) drive CSS only, so they're not in it.

## Why / design
This store is the milestone's centrepiece. It owns the live appearance and enforces **one source of truth** with
**three mirrors**:

1. **Defaults come from the stylesheet, read once.** At construction, `readCssDefaults()` calls
   `getComputedStyle(document.documentElement)` and reads the app's `--*` tokens. The SCSS you wrote in M0 stays
   the single place the *default* palette is authored — the store never hard-codes a default colour it can avoid
   (there are `#hex` fallbacks only in case a property is missing).
2. **Saved overrides layer on top.** `appearanceCache.load(defaults)` merges any `evm.appearance` blob over
   those defaults (step 01), so a returning user gets their colours and a first-time user gets the stylesheet's.
3. **Every change mirrors to CSS + localStorage, reactively.** A single `effect()` reads the current snapshot
   and (a) writes each value back to the matching `--*` custom property on `:root` — so panels, borders, and the
   heat-legend gradient recolour **live** without any component knowing — and (b) calls `cache.save(...)`. The
   renderer consumes the derived `palette` / `dayMode` / `markerIcon` signals (wired in steps 03–04).

> 📚 New concept — one `effect()`, two mirrors: because the `effect` reads the signals via `snapshot()`, it
> re-runs on *any* appearance change and re-applies **all** CSS variables + re-saves. You never wire per-field
> listeners; the reactive graph does it. This is the [effect()](../foundation/glossary.md) bridge again — same
> tool the canvas uses to drive the renderer, here driving CSS + storage instead.

**Why `heatMid` is computed, not stored:** the heat legend needs a cold→mid→hot gradient, but a naive RGB
average of two pastels muddies to grey. `lerpHSL(...0.5)` interpolates in HSL so the mid tone stays vivid; we
write it to `--globe-land-mid` on every change so the legend (M5) tracks the user's endpoints.

**Load-bearing:** the `--*` property names and the `evm.appearance` key must match the stylesheet and step 01
exactly. Field names on the store (`accent`, `heatCold`, …) are cosmetic — but the `LivePalette` field names
(`teal`, `cyan`, `ocean`, `landCold`, `landHot`, `marker`) are load-bearing: the renderer reads them by name
(step 03).

## Do this
1. Create `src/app/features/settings/settings-store.ts` with the code below.
2. Note the `normalizeHex` helper: `<input type="color">` only round-trips `#rrggbb`, so a `#rgb` shorthand from
   the stylesheet is expanded and anything else dropped — otherwise the colour picker would silently reset.

## Code
### `src/app/features/settings/settings-store.ts`
```ts
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Color } from 'three';

import { AppearanceCache, AppearanceSettings, MarkerKind } from '../../core/cache/appearance-cache';

/** The subset of colours the three.js renderer consumes (the rest drive CSS only). */
export interface LivePalette {
  /** Country strokes. */
  teal: string;
  /** Atmosphere halo + flight arcs/marker. */
  cyan: string;
  /** Globe sphere base. */
  ocean: string;
  /** Heat ramp cold end. */
  landCold: string;
  /** Heat ramp hot end. */
  landHot: string;
  /** Flight marker icon fill (drawn with a black outline). */
  marker: string;
}

/**
 * Owns the live appearance settings. Reads the stylesheet's colours once as defaults, layers any
 * saved overrides on top, then mirrors every change back to (a) CSS custom properties — so panels,
 * borders and the heat legend recolour live — and (b) localStorage. The globe page reads
 * {@link palette}/{@link dayMode}/{@link markerIcon} and feeds them into the canvas.
 */
@Injectable({ providedIn: 'root' })
export class SettingsStore {
  private readonly cache = inject(AppearanceCache);
  /** Captured from the stylesheet at construction, before we override anything. */
  private readonly defaults = readCssDefaults();

  readonly background = signal(this.defaults.background);
  readonly accent = signal(this.defaults.accent);
  readonly accentSecondary = signal(this.defaults.accentSecondary);
  readonly accentTertiary = signal(this.defaults.accentTertiary);
  readonly markerColor = signal(this.defaults.markerColor);
  readonly ocean = signal(this.defaults.ocean);
  readonly heatCold = signal(this.defaults.heatCold);
  readonly heatHot = signal(this.defaults.heatHot);
  readonly dayMode = signal(this.defaults.dayMode);
  readonly markerIcon = signal<MarkerKind>(this.defaults.markerIcon);

  /** Mid heat tone, interpolated in HSL so cold→hot never washes through a muddy grey. */
  private readonly heatMid = computed(() =>
    new Color(this.heatCold()).lerpHSL(new Color(this.heatHot()), 0.5).getStyle(),
  );

  /** Colours the renderer needs, as a single object input for the canvas. */
  readonly palette = computed<LivePalette>(() => ({
    teal: this.accent(),
    cyan: this.accentSecondary(),
    ocean: this.ocean(),
    landCold: this.heatCold(),
    landHot: this.heatHot(),
    marker: this.markerColor(),
  }));

  constructor() {
    const saved = this.cache.load(this.defaults);
    this.applySettings(saved);

    // Mirror every change to CSS custom properties (for HTML/SCSS surfaces) and to localStorage.
    effect(() => {
      const settings = this.snapshot();
      const root = document.documentElement.style;
      root.setProperty('--space-void', settings.background);
      root.setProperty('--neon-teal', settings.accent);
      root.setProperty('--neon-cyan', settings.accentSecondary);
      root.setProperty('--neon-violet', settings.accentTertiary);
      root.setProperty('--flight-marker', settings.markerColor);
      root.setProperty('--globe-ocean', settings.ocean);
      root.setProperty('--globe-land-cold', settings.heatCold);
      root.setProperty('--globe-land-mid', this.heatMid());
      root.setProperty('--globe-land-hot', settings.heatHot);
      this.cache.save(settings);
    });
  }

  /** Restore every setting to the stylesheet defaults. */
  reset(): void {
    this.applySettings(this.defaults);
  }

  private applySettings(s: AppearanceSettings): void {
    this.background.set(s.background);
    this.accent.set(s.accent);
    this.accentSecondary.set(s.accentSecondary);
    this.accentTertiary.set(s.accentTertiary);
    this.markerColor.set(s.markerColor);
    this.ocean.set(s.ocean);
    this.heatCold.set(s.heatCold);
    this.heatHot.set(s.heatHot);
    this.dayMode.set(s.dayMode);
    this.markerIcon.set(s.markerIcon);
  }

  private snapshot(): AppearanceSettings {
    return {
      background: this.background(),
      accent: this.accent(),
      accentSecondary: this.accentSecondary(),
      accentTertiary: this.accentTertiary(),
      markerColor: this.markerColor(),
      ocean: this.ocean(),
      heatCold: this.heatCold(),
      heatHot: this.heatHot(),
      dayMode: this.dayMode(),
      markerIcon: this.markerIcon(),
    };
  }
}

/** Read the app's default colours from the stylesheet so they stay the single source of truth. */
function readCssDefaults(): AppearanceSettings {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string): string =>
    normalizeHex(styles.getPropertyValue(name).trim()) || fallback;
  return {
    background: read('--space-void', '#0d1b2a'),
    accent: read('--neon-teal', '#9fe0cf'),
    accentSecondary: read('--neon-cyan', '#a9d4f0'),
    accentTertiary: read('--neon-violet', '#c4b5e8'),
    markerColor: read('--flight-marker', '#4cc9f0'),
    ocean: read('--globe-ocean', '#112233'),
    heatCold: read('--globe-land-cold', '#7fa8c9'),
    heatHot: read('--globe-land-hot', '#ef9a8a'),
    dayMode: false,
    markerIcon: 'plane',
  };
}

/** `<input type="color">` only accepts `#rrggbb`; expand a `#rgb` shorthand and drop anything else. */
function normalizeHex(value: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    return value.toLowerCase();
  }
  const short = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/.exec(value);
  return short
    ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toLowerCase()
    : '';
}
```

## Done when (this step)
- [ ] `npm run build` → clean; no `any`, no unused import. The store compiles even though nothing injects it yet
      (the canvas + panel wire it in steps 04/06).
- [ ] Temporarily inject `SettingsStore` anywhere and, in the console,
      `document.documentElement.style.getPropertyValue('--neon-teal')` returns the current accent (proving the
      mirror ran); setting `store.accent.set('#ff0000')` turns `--neon-teal` to `#ff0000` and writes
      `evm.appearance`. (Remove the temporary injection after checking.)

## If it breaks
- **`getComputedStyle` returns empty strings for every `--*`** → the store was constructed before the global
  stylesheet loaded, or `styles.scss`'s `--*` tokens (M0) were renamed. The `readCssDefaults` fallbacks keep it
  from crashing, but the panel would show the fallbacks — confirm the token names match `styles.scss`.
- **`Color` import fails / `lerpHSL is not a function`** → import `Color` from `three` (not from three-globe);
  the pinned `three@~0.184` has `Color.lerpHSL`.
- **Colours don't persist across reload** → the `effect()` isn't running (it must live in the constructor, in an
  injection context) — an effect created outside the constructor throws `NG0203`.

---
> Nav: [← Appearance cache](01_appearance-cache.md) · [Overview](00_overview.md) · [Grow the renderer →](03_renderer-live-appearance.md)
