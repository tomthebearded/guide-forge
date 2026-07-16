# M3 · Step 05 of 07 — The cache: `liked-index-cache.ts`
> Nav: [← `streamLikedTracks()`](04_stream-liked-tracks.md) · [Overview](00_overview.md) · [The `LikedIndex` store →](06_liked-index.md)

## Glossary for this step
> **typed cache service** — a thin `@Injectable` that owns exactly one `localStorage` key, a version, and a
> validator, and exposes `load` / `save` / `clear`. It hides the raw `localStorage` calls behind a typed API
> and folds validation into `load`. Each `evm.*` key gets its own cache service. See
> [conventions](../foundation/conventions.md).

## Why / design
`localStorage` hands you back a `string` and trusts you to parse it. A cache service is where that trust gets
verified once, in one place:

> **Read / write / validate.** `save` serializes a snapshot to JSON; `load` parses it and runs it through a
> `revive` validator that returns `undefined` for anything malformed (an old shape, a corrupted string, a
> version bump) — and `readJson` turns that `undefined` into the caller's fallback (`null` here). So a bad or
> stale cache reads as "no cache" rather than crashing or, worse, feeding a wrong shape into the app.

This service leans on the shared `readJson` / `writeJson` / `removeJson` primitives from M2's
`storage-cache.ts` — it doesn't touch `localStorage` directly.

- **`STORAGE_KEY = 'evm.likedIndex'`** is **load-bearing** — it's the exact key the Done-when gate inspects and
  the key a reload restores from. The `evm.` prefix namespaces all this app's keys.
- **`VERSION = 1`** must match the snapshot's `version: 1` literal from step 02. `isSnapshot` rejects any
  parsed value whose `version` isn't `1`, so a future format bump auto-invalidates old caches instead of
  loading a mismatched shape.

`writeJson` returns `false` on a `QuotaExceededError` (a very large library can exceed the ~5–10 MB budget,
per decision-log R6). M3's `save` fires-and-forgets like most caches; the once-per-session quota warning is
added in a later milestone.

## Do this
1. Create `src/app/core/cache/liked-index-cache.ts` with the code below.
2. Keep the constants exactly: `STORAGE_KEY = 'evm.likedIndex'` and `VERSION = 1`.
3. `isSnapshot` is a **type guard** (`value is LikedIndexSnapshot`): it checks `version === VERSION` and that
   `tracks` is an array, then tells TypeScript the value is a real snapshot. Leave both checks — dropping
   either lets a malformed cache through.

## Code
### `src/app/core/cache/liked-index-cache.ts`
```typescript
import { Injectable } from '@angular/core';

import { LikedIndexSnapshot } from '../models/indexed-track';
import { readJson, removeJson, writeJson } from './storage-cache';

const STORAGE_KEY = 'evm.likedIndex';
const VERSION = 1;

/**
 * Persists the flattened liked-tracks index (a byproduct of the globe's `/me/tracks` scan) so the
 * app can restore it on reload — with album + ISRC — without re-paging the whole library.
 * Newest-cursor incremental.
 */
@Injectable({ providedIn: 'root' })
export class LikedIndexCache {
  load(): LikedIndexSnapshot | null {
    return readJson(STORAGE_KEY, (parsed) => (isSnapshot(parsed) ? parsed : undefined), null);
  }

  save(snapshot: LikedIndexSnapshot): void {
    writeJson(STORAGE_KEY, snapshot);
  }

  clear(): void {
    removeJson(STORAGE_KEY);
  }
}

function isSnapshot(value: unknown): value is LikedIndexSnapshot {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return candidate['version'] === VERSION && Array.isArray(candidate['tracks']);
}
```

## Done when (this step)
- [ ] Run `npm run build` → completes clean (`Application bundle generation complete`).
- [ ] In the browser console, `localStorage.setItem('evm.likedIndex', '{"bogus":true}')` followed by reading
      it back through the app (next step) yields `null` from `load()` — the validator rejects the bad shape.

## If it breaks
- **`build` fails: "Cannot find module './storage-cache'"** → `storage-cache.ts` was created in M2 and lives
  in `core/cache/`. If it's missing, M2's gate wasn't completed — go back and finish M2.
- **`build` fails: "Element implicitly has an 'any' type / index signature"** → you wrote `candidate.version`
  instead of `candidate['version']`. Strict mode's `noPropertyAccessFromIndexSignature` requires bracket
  access on the `Record<string, unknown>`.

---
> Nav: [← `streamLikedTracks()`](04_stream-liked-tracks.md) · [Overview](00_overview.md) · [The `LikedIndex` store →](06_liked-index.md)
