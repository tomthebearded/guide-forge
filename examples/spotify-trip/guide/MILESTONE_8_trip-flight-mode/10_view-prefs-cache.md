# M8 · Step 10 of 12 — Persist the overlay prefs (`evm.viewPrefs`)
> Nav: [← JourneyStats](09_journey-stats.md) · [Overview](00_overview.md) · [ViewOptions →](11_view-options.md)

## Why / design
Per [decision-log D5](../foundation/decision-log.md#d5--likedindex-is-a-byproduct-of-the-globe-scan-tripexplore-are-overlay-toggles),
Trip and Explore are **not a mode switch** — each globe overlay is an independent, **persisted** visibility
toggle. This cache stores those booleans under the **load-bearing key** `evm.viewPrefs`, so your choices (e.g.
"hide the leaderboards, keep the trip log") survive a reload.

M8 owns **five** toggles: `showStats` (leaderboards), `showLegend` (heat legend), `showFlight` (the plane +
route overlay), `showTripLog`, and `showJourney` (the passport). Two more — `showFilters` and `showTimeline` —
arrive in **M9** with the filter panel + scrubber, so this model **grows in M9**.

The load merges over `DEFAULTS` so a prefs blob saved before a field existed keeps its other choices — the same
forward-compatible merge the other caches use.

## Do this
1. Create `src/app/core/cache/view-prefs-cache.ts`.
2. Define `ViewPrefs` with the **five M8 booleans**, a `DEFAULTS` with all `true`, and the cache with
   `load()`/`save()` on the shared `storage-cache` helpers.
3. Validate with `isViewPrefs` (checks two known booleans), and merge over defaults on load.

## Code
### `src/app/core/cache/view-prefs-cache.ts`
```ts
import { Injectable } from '@angular/core';

import { readJson, writeJson } from './storage-cache';

const STORAGE_KEY = 'evm.viewPrefs';

/** Which globe overlays the user has chosen to show. Persisted across reloads. Grows in M9. */
export interface ViewPrefs {
  showStats: boolean;
  showLegend: boolean;
  /** The flight overlay (plane + route arc + country highlight + follow camera). */
  showFlight: boolean;
  showTripLog: boolean;
  showJourney: boolean;
  // showFilters (genre + era) and showTimeline (scrubber) are added in M9.
}

const DEFAULTS: ViewPrefs = {
  showStats: true,
  showLegend: true,
  showFlight: true,
  showTripLog: true,
  showJourney: true,
};

/** Persists the globe view's overlay-visibility preferences to localStorage. */
@Injectable({ providedIn: 'root' })
export class ViewPrefsCache {
  load(): ViewPrefs {
    // Merge over defaults so prefs saved before a field existed keep their other choices.
    return readJson(
      STORAGE_KEY,
      (parsed) => (isViewPrefs(parsed) ? { ...DEFAULTS, ...parsed } : undefined),
      { ...DEFAULTS },
    );
  }

  save(prefs: ViewPrefs): void {
    writeJson(STORAGE_KEY, prefs);
  }
}

function isViewPrefs(value: unknown): value is ViewPrefs {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['showStats'] === 'boolean' && typeof candidate['showLegend'] === 'boolean'
  );
}
```

## Done when (this step)
- [ ] `npm run build` clean; `ViewPrefsCache` is injectable.
- [ ] By hand later: toggling an overlay off then reloading keeps it off →
      `JSON.parse(localStorage['evm.viewPrefs'])` shows that field `false`.

## If it breaks
- **Prefs don't persist** → the key drifted; it **must** be exactly `evm.viewPrefs`.
- **A newly-added field resets others to default** → the load must spread `{ ...DEFAULTS, ...parsed }`, not
  return `parsed` raw, so partial old blobs keep their known choices.
