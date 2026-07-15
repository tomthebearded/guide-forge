# M8 · Step 02 of 12 — Persist the trip log (`evm.tripLog`)
> Nav: [← Trip types](01_flight-target-model.md) · [Overview](00_overview.md) · [Spotify: artist photo + queue peek →](03_spotify-artist-queue.md)

## Glossary for this step
> **versioned snapshot** — the recurring cache pattern in this app: wrap the payload in `{ version, … }`, and on
> load only accept it if the version matches and the shape validates, so a stale or corrupt blob falls back to a
> safe default instead of poisoning the app. (Same pattern as `origins-cache` in M5.)

## Why / design
The passport should survive a reload — a "trip" you've been building up all afternoon shouldn't reset to empty
because you refreshed the tab. So the finished stops persist to `localStorage` under the **load-bearing key**
`evm.tripLog`.

This is the same read/write/validate cache pattern you built for `evm.origins` (M5), on the shared
`storage-cache` helpers (`readJson`/`writeJson`/`removeJson`). Two things worth calling out:
1. It's **portable** — the key is `evm.tripLog`, not `evm.spotify.*`, so it rides along in the data export/import
   feature (M11) rather than being treated as transient auth state.
2. The bound on how many stops are kept lives in the `FlightStore` (step 04), not here — the cache just stores
   whatever list it's handed. This keeps the cache dumb and the "trip length" policy in one place.

## Do this
1. Create `src/app/core/cache/trip-log-cache.ts`.
2. Define a `TripLogSnapshot` = `{ version, stops }` and a `VERSION` constant of `1` — the **versioned
   snapshot** wrapper, so a future shape change can reject old blobs.
3. `load()` returns the `stops` array (or `[]` if absent/invalid), `save(stops)` wraps them in the snapshot, and
   `clear()` removes the key — reusing `readJson`/`writeJson`/`removeJson` from `storage-cache` exactly as the
   other caches do.

## Code
### `src/app/core/cache/trip-log-cache.ts`
```ts
import { Injectable } from '@angular/core';

import { TripStop } from '../models/trip-stop';
import { readJson, removeJson, writeJson } from './storage-cache';

const STORAGE_KEY = 'evm.tripLog';
const VERSION = 1;

/** Persisted trip log: the most recent stops, newest-first (bounded by the flight store). */
export interface TripLogSnapshot {
  version: number;
  stops: TripStop[];
}

/**
 * Persists the Trip-mode passport (finished flight stops) to localStorage so the journey log + its
 * totals survive a reload, instead of resetting to empty every time. Portable like the other caches
 * (no `evm.spotify.` prefix), so it rides along in the data export/import.
 */
@Injectable({ providedIn: 'root' })
export class TripLogCache {
  load(): TripStop[] {
    return readJson(STORAGE_KEY, (parsed) => (isSnapshot(parsed) ? parsed.stops : undefined), []);
  }

  save(stops: TripStop[]): void {
    const snapshot: TripLogSnapshot = { version: VERSION, stops };
    writeJson(STORAGE_KEY, snapshot);
  }

  clear(): void {
    removeJson(STORAGE_KEY);
  }
}

function isSnapshot(value: unknown): value is TripLogSnapshot {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return candidate['version'] === VERSION && Array.isArray(candidate['stops']);
}
```

## Done when (this step)
- [ ] The file compiles and `TripLogCache` is injectable (it's `providedIn: 'root'`).
- [ ] In DevTools console (after the app is running later), `new`-ing isn't needed — but you can confirm the key
      shape by hand: `localStorage.setItem('evm.tripLog', JSON.stringify({version:1,stops:[]}))` then a
      `TripLogCache.load()` returns `[]` (a `version:2` blob would return `[]` too — rejected).

## If it breaks
- **`Cannot find name 'readJson'`** → `storage-cache.ts` (M5) doesn't export it, or the import path is wrong;
  the cache helpers live in `core/cache/storage-cache.ts` beside this file.
- **Trip log doesn't survive reload later** → the key drifted. It **must** be exactly `evm.tripLog` (load-bearing);
  a typo writes to one key and reads from another.
