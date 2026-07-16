# M10 · Step 04 of 18 — The discography + library-prefs caches
> Nav: [← Grow the Spotify client](03_spotify-client-grow.md) · [Overview](00_overview.md) · [Grow LikedIndex →](05_liked-index-grow.md)

> **This step touches 2 files, committed together:** `core/cache/discography-cache.ts` (bounded, quota-safe
> discography store) and `core/cache/library-prefs-cache.ts` (per-artist reviewed/hidden state). Both are
> `localStorage` caches following the app's shared pattern, so we add them in one commit.

## Glossary for this step
> **bounded cache** — a cache with a hard cap on how much it stores, evicting the oldest entries past the cap.
> A full discography blob is large, and a library can hold thousands of artists, so this cache keeps only the
> most-recent `MAX_ARTISTS`.
> **quota-safe write** — a write that *fails soft*: if `localStorage` is full (`QuotaExceededError`), it abandons
> persistence rather than throwing and breaking the page. The whole app persists this way ([R6](../foundation/decision-log.md#r6--localstorage-only-persistence-accepted)).

## Why / design
Two small caches back the library page:

1. **`DiscographyCache`** (`evm.discography`) — persists recently-viewed discographies so reopening an artist
   doesn't re-page Spotify. It's a *nicety, not source-of-truth*: **bounded to `MAX_ARTISTS = 40`** (a Map's
   insertion order is the recency order, so it keeps the last 40) and **quota-safe** (a failed write just drops
   persistence — the in-memory session cache still serves). Discographies are effectively static, so
   cross-session staleness is acceptable.
2. **`LibraryPrefsCache`** (`evm.libraryPrefs`) — per-artist page state: a `reviewedAt` map (last "Mark reviewed"
   epoch) and a `hidden` list. It carries a **one-time migration** from the old `evm.favouritesPrefs` key so an
   existing user's prefs survive the rename.

> **Recurring model:** every cache owns exactly one namespaced `evm.*` key + a validator, and goes through the
> shared `storage-cache` helpers (`readJson`/`writeJson`/`removeJson`) from M3 — so both snapshots ride along in
> the M11 export/import unchanged. The `evm.discography` and `evm.libraryPrefs` key strings are **load-bearing**.

## Do this
1. Create `src/app/core/cache/discography-cache.ts`. The `MAX_ARTISTS = 40` cap and the `try/catch` around
   `writeJson` are **mandatory** (they're the quota safety); the eviction uses `Map` insertion order.
2. Create `src/app/core/cache/library-prefs-cache.ts`. The `LEGACY_STORAGE_KEY = 'evm.favouritesPrefs'` migration
   block runs once, before the shared reader takes over — leave it as written so upgraders don't lose prefs.
3. Both keys (`evm.discography`, `evm.libraryPrefs`, `evm.favouritesPrefs`) are **load-bearing** — spell them
   exactly; they must match the M11 export allow-list.

## Code
### `src/app/core/cache/discography-cache.ts`
```ts
import { Injectable } from '@angular/core';

import { DiscographyRelease } from '../models/album';
import { readJson, removeJson, writeJson } from './storage-cache';

const STORAGE_KEY = 'evm.discography';
const VERSION = 1;
/**
 * Keep only the most-recently-added artists' discographies. A discography blob is large, and the
 * library can hold thousands of artists; an unbounded cache would blow the localStorage quota.
 */
const MAX_ARTISTS = 40;

interface DiscographySnapshot {
  version: number;
  /** artistId → its releases. Object insertion order is the recency order (oldest first). */
  entries: Record<string, DiscographyRelease[]>;
}

/**
 * Persists recently-viewed artist discographies so reopening the app doesn't re-page them from
 * Spotify. A nicety, not source-of-truth: bounded to {@link MAX_ARTISTS} and quota-safe (a failed
 * write just drops persistence — the in-memory cache still serves the session). Discographies are
 * effectively static, so cross-session staleness (a brand-new release) is acceptable.
 */
@Injectable({ providedIn: 'root' })
export class DiscographyCache {
  load(): Map<string, DiscographyRelease[]> {
    const snapshot = readJson<DiscographySnapshot | null>(
      STORAGE_KEY,
      (parsed) => (isSnapshot(parsed) ? parsed : undefined),
      null,
    );
    return snapshot === null ? new Map() : new Map(Object.entries(snapshot.entries));
  }

  /** Persist the cache, capped to the most-recent {@link MAX_ARTISTS} (Map preserves insert order). */
  save(cache: Map<string, DiscographyRelease[]>): void {
    const all = [...cache];
    const entries: Record<string, DiscographyRelease[]> = {};
    for (const [id, releases] of all.slice(Math.max(0, all.length - MAX_ARTISTS))) {
      entries[id] = releases;
    }
    try {
      writeJson(STORAGE_KEY, { version: VERSION, entries } satisfies DiscographySnapshot);
    } catch {
      // Quota exceeded (or serialise failure): persistence is optional, so abandon it rather than
      // break the artist view. Best-effort cleanup of any partial/stale entry.
      try {
        removeJson(STORAGE_KEY);
      } catch {
        // localStorage unavailable — nothing more we can do.
      }
    }
  }
}

function isSnapshot(value: unknown): value is DiscographySnapshot {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    candidate['version'] === VERSION &&
    candidate['entries'] !== null &&
    typeof candidate['entries'] === 'object'
  );
}
```

### `src/app/core/cache/library-prefs-cache.ts`
```ts
import { Injectable } from '@angular/core';

import { readJson, writeJson } from './storage-cache';

const STORAGE_KEY = 'evm.libraryPrefs';
/** Former key — migrated to {@link STORAGE_KEY} on first load so existing prefs survive the rename. */
const LEGACY_STORAGE_KEY = 'evm.favouritesPrefs';

/** Per-artist library-page state: when each was last reviewed, and which are hidden. */
export interface LibraryPrefs {
  /** artistId → epoch ms of the last "Mark reviewed". */
  reviewedAt: Record<string, number>;
  /** Hidden artist ids — filtered out of the table unless "Show hidden" is on. */
  hidden: string[];
}

const DEFAULTS: LibraryPrefs = { reviewedAt: {}, hidden: [] };

/** Persists the library page's per-artist review timestamps + hidden set to localStorage. */
@Injectable({ providedIn: 'root' })
export class LibraryPrefsCache {
  load(): LibraryPrefs {
    // One-time migration from the pre-rename key, before the shared reader takes over.
    if (localStorage.getItem(STORAGE_KEY) === null) {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy !== null) {
        localStorage.setItem(STORAGE_KEY, legacy);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }
    return readJson<LibraryPrefs>(
      STORAGE_KEY,
      (parsed) =>
        isPrefs(parsed)
          ? { reviewedAt: { ...parsed.reviewedAt }, hidden: [...parsed.hidden] }
          : undefined,
      { ...DEFAULTS },
    );
  }

  save(prefs: LibraryPrefs): void {
    // Via writeJson so a full quota fails soft (returns false) instead of throwing, matching
    // every other cache — a lost preference write must never crash the library page.
    writeJson(STORAGE_KEY, prefs);
  }
}

function isPrefs(value: unknown): value is LibraryPrefs {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const reviewedAt = candidate['reviewedAt'];
  return (
    Array.isArray(candidate['hidden']) &&
    typeof reviewedAt === 'object' &&
    reviewedAt !== null &&
    !Array.isArray(reviewedAt)
  );
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — both caches resolve their
      `./storage-cache` + `../models/album` imports.
- [ ] After serving, in the browser console `localStorage.getItem('evm.discography')` and
      `localStorage.getItem('evm.libraryPrefs')` → both `null` (the caches exist but nothing writes them until an
      artist is opened / a pref is set in step 08).

## If it breaks
- **`Cannot find module './storage-cache'`** → the shared helpers are from M3 (`core/cache/storage-cache.ts`);
  confirm it exports `readJson` / `writeJson` / `removeJson`.
- **Old prefs vanish after the rename** → the migration block must run *before* `readJson` and copy
  `evm.favouritesPrefs` into `evm.libraryPrefs`; a typo in either key silently loses them.
- **`localStorage` fills up on a big library** → expected past ~40 large discographies; the `MAX_ARTISTS` cap +
  the quota-safe `try/catch` keep it from crashing — don't remove either.

---
> Nav: [← Grow the Spotify client](03_spotify-client-grow.md) · [Overview](00_overview.md) · [Grow LikedIndex →](05_liked-index-grow.md)
