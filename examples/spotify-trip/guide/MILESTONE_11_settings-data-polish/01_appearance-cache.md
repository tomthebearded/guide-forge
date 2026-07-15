# M11 · Step 01 of 10 — Appearance cache + `MarkerKind`'s home
> Nav: — · [Overview](00_overview.md) · [The settings store →](02_settings-store.md)

> **This step creates one file:** `core/cache/appearance-cache.ts`. Nothing else changes — the flight layer
> stays exactly as M8 left it (plane-only) until step 03 grows its marker engine.

## Glossary for this step
> **`AppearanceSettings`** — the full, persisted appearance blob: eight `#rrggbb` colours, a `dayMode` boolean,
> and the `markerIcon`. It's what lives under `evm.appearance`.

## Why / design
`MarkerKind` (which icon carries the now-playing track) is **born here**, in the appearance model. M8's flight
overlay flew a fixed plane and never needed the type; M11 is the milestone whose settings panel actually lets
the user pick an icon, so appearance owns it from the start. The marker engine that *consumes* it grows onto the
flight layer in step 03. This step just creates its home.

`AppearanceCache` is one more **`evm.*` cache** in the exact shape every other cache in this app follows
([conventions](../foundation/conventions.md)): a single namespaced key, a `load(defaults)` that merges saved
values **over** the caller's defaults, a `save`, and a `sanitize` validator so a corrupt or partial blob can
never poison the defaults. It reuses the shared `readJson` / `writeJson` helpers from `storage-cache.ts` (M0).

> 📚 New concept — merge-over-defaults: `load` returns `{ ...defaults, ...sanitize(parsed) }`. A blob saved by an
> older build (missing a field this build added) keeps its saved fields and simply picks up the new default for
> the rest — no migration code. This is the same pattern `ViewPrefsCache` used in M9.

**Load-bearing:** the key string `evm.appearance` and the CSS-variable names in the doc comments are
load-bearing (the settings store reads/writes exactly these). The `MarkerKind` string literals
(`'plane' | 'boat' | …`) are load-bearing — they're persisted and matched against `MARKER_KINDS`.

## Do this
1. Create `src/app/core/cache/appearance-cache.ts` with the code below — it exports `MarkerKind`,
   `MARKER_KINDS`, `AppearanceSettings`, and the `AppearanceCache` service. That's the whole step; nothing
   imports these yet (the settings store picks up `MarkerKind` in step 02, the flight layer + renderer in
   step 03).

## Code
### `src/app/core/cache/appearance-cache.ts`
```ts
import { Injectable } from '@angular/core';

import { readJson, writeJson } from './storage-cache';

const STORAGE_KEY = 'evm.appearance';

/**
 * Which marker carries the now-playing track around the globe — themed around the app's
 * "music on a trip" concept: ways to travel (plane, sailboat, car, train, bike) and music
 * (note, vinyl record).
 */
export type MarkerKind = 'plane' | 'boat' | 'car' | 'train' | 'bike' | 'note' | 'record';

export const MARKER_KINDS: readonly MarkerKind[] = [
  'plane',
  'boat',
  'car',
  'train',
  'bike',
  'note',
  'record',
];

/**
 * User-customizable appearance: globe/accent/background colours, the heat ramp endpoints (the mid
 * tone is derived), day-vs-studio lighting, and the flight marker icon. Colours are `#rrggbb`.
 */
export interface AppearanceSettings {
  /** Space backdrop (`--space-void`). */
  background: string;
  /** Primary accent — borders, country strokes (`--neon-teal`). */
  accent: string;
  /** Secondary accent — atmosphere halo, flight arcs/marker (`--neon-cyan`). */
  accentSecondary: string;
  /** Tertiary accent (`--neon-violet`). */
  accentTertiary: string;
  /** Flight marker icon fill (`--flight-marker`); drawn with a black outline for contrast. */
  markerColor: string;
  /** Globe sphere base (`--globe-ocean`). */
  ocean: string;
  /** Heat ramp cold end (`--globe-land-cold`). */
  heatCold: string;
  /** Heat ramp hot end (`--globe-land-hot`); the mid tone is interpolated from cold↔hot. */
  heatHot: string;
  /** Light the globe from a single sun (day/night terminator) instead of flat studio lighting. */
  dayMode: boolean;
  /** Icon drawn for the currently-playing track. */
  markerIcon: MarkerKind;
}

/** Persists the user's appearance choices to localStorage, merged over the live CSS defaults. */
@Injectable({ providedIn: 'root' })
export class AppearanceCache {
  /** Saved settings merged over `defaults` (captured from the stylesheet) so new fields keep theirs. */
  load(defaults: AppearanceSettings): AppearanceSettings {
    return readJson(STORAGE_KEY, (parsed) => ({ ...defaults, ...sanitize(parsed) }), {
      ...defaults,
    });
  }

  save(settings: AppearanceSettings): void {
    writeJson(STORAGE_KEY, settings);
  }
}

/** Keep only well-typed fields from a stored blob, so a corrupt/partial value can't poison defaults. */
function sanitize(value: unknown): Partial<AppearanceSettings> {
  if (value === null || typeof value !== 'object') {
    return {};
  }
  const v = value as Record<string, unknown>;
  const out: Partial<AppearanceSettings> = {};
  for (const key of [
    'background',
    'accent',
    'accentSecondary',
    'accentTertiary',
    'markerColor',
    'ocean',
    'heatCold',
    'heatHot',
  ] as const) {
    if (isHexColor(v[key])) {
      out[key] = v[key];
    }
  }
  if (typeof v['dayMode'] === 'boolean') {
    out.dayMode = v['dayMode'];
  }
  if (MARKER_KINDS.includes(v['markerIcon'] as MarkerKind)) {
    out.markerIcon = v['markerIcon'] as MarkerKind;
  }
  return out;
}

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — `appearance-cache.ts` compiles as
      a standalone new file (nothing imports it yet). The app still runs exactly as it did after M10.
- [ ] In DevTools console after opening the app: `localStorage['evm.appearance']` is `null` (nothing saved yet —
      the store writes it in step 02).

## If it breaks
- **`'MarkerKind' is declared but never used` in appearance-cache** → harmless until step 02's settings store
  imports it; the type *is* used here (in `AppearanceSettings.markerIcon` and the `sanitize` guard).
- **Later: `Module '"../../core/cache/appearance-cache"' has no exported member 'MarkerKind'`** (from the store
  in step 02, or the flight layer / renderer in step 03) → the new file wasn't saved, or the import path is
  wrong (from `features/globe/flight-layer.ts` it's `../../core/cache/appearance-cache`).
