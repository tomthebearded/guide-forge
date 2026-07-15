# M9 · Step 01 of 14 — Playlist index model + cache
> Nav: — · [Overview](00_overview.md) · [Grow the Spotify client →](02_spotify-client-grow.md)

> **This step touches 2 files, committed together:** `core/models/playlist-index.ts` and
> `core/cache/playlist-index-cache.ts`. They're the data types the playlist-membership index rides on — its
> persisted snapshot + the cache that stores it — so we introduce them in one commit before the service that
> fills them (step 03). They build on the `Playlist` model **M7 already created** (`core/models/playlist.ts`);
> this step does not recreate it.

## Glossary for this step
> **playlist-membership index** — a `trackId → { metadata, playlistIds[] }` map built by reading every one of
> your playlists, so a track can answer "which of my playlists am I in?" without re-reading playlists each time.
> It mirrors the M3 `LikedIndex` (a per-track byproduct of a scan).
> **snapshot ID** — Spotify's opaque content-version token for a playlist; it changes **iff** the playlist's
> contents change, so comparing it lets a sync skip re-paging unchanged playlists. See
> [glossary](../foundation/glossary.md#snapshot-id).

## Why / design
The M10 library tools will let you see and edit which playlists hold a track. Reading every playlist on every
visit would be dozens of paced requests, so instead we build a persisted **index** once and patch it in place.
The `Playlist` model this index references (identity + write-permission facts + its `snapshotId` diff key)
**already exists from M7** — this step lays the two types that ride on top of it:

1. **`PlaylistTrackRef` / `PlaylistTrackEntry` / `PlaylistIndexSnapshot`** — one track as it rides on a
   playlist, that same track with the set of playlists holding it, and the whole persisted index.
2. **`PlaylistIndexCache`** — the quota-safe `localStorage` reader/writer for the snapshot, keyed
   `evm.playlistIndex` (mirrors `LikedIndexCache`).

**Recurring model:** every cache in this app owns exactly one namespaced `evm.*` key + a `version` field + a
validator, and goes through the shared `storage-cache` helpers (`readJson`/`writeJson`/`removeJson`). We follow
that here, so the snapshot rides along in the M11 export/import unchanged.

## Do this
1. Create `src/app/core/models/playlist-index.ts` with the three index types. `PlaylistTrackEntry` **extends**
   `PlaylistTrackRef` by adding the deduped `playlistIds` set. It imports `Playlist` from the model M7 created —
   the `snapshotId` field on that model is **load-bearing** (the whole diff sync in step 03 keys off it).
2. Create `src/app/core/cache/playlist-index-cache.ts` — the `evm.playlistIndex` cache. The key string is
   **load-bearing** (must match across steps + the M11 export).

## Code
### `src/app/core/models/playlist-index.ts`
```ts
import { Playlist } from './playlist';

/** One track as it rides on a playlist (before membership is assembled across playlists). */
export interface PlaylistTrackRef {
  id: string;
  name: string;
  uri: string;
  durationMs: number;
  /** Every artist credited on the track — the track is reachable from each of them. */
  artistIds: string[];
  albumName: string;
  albumImageUrl: string | null;
}

/** A track found in the user's playlists, with the set of playlists currently containing it. */
export interface PlaylistTrackEntry extends PlaylistTrackRef {
  /** Ids of the user's playlists this track is in (deduped). */
  playlistIds: string[];
}

/** The persisted playlist-membership index — built by reading every one of the user's playlists. */
export interface PlaylistIndexSnapshot {
  version: 1;
  /** When the index was last (re)built (ISO 8601) — surfaced as "updated …" in the UI. */
  builtAt: string;
  /** Current user's Spotify id — a playlist is editable when owned by them or collaborative. */
  myUserId: string;
  /** The playlists that were indexed, for name + editability lookup. */
  playlists: Playlist[];
  tracks: PlaylistTrackEntry[];
}
```

### `src/app/core/cache/playlist-index-cache.ts`
```ts
import { Injectable } from '@angular/core';

import { PlaylistIndexSnapshot } from '../models/playlist-index';
import { readJson, removeJson, writeJson } from './storage-cache';

const STORAGE_KEY = 'evm.playlistIndex';
const VERSION = 1;

/**
 * Persists the playlist-membership index (which of the user's playlists each track is in) so the
 * artist page can show + edit membership without re-reading every playlist on each visit. Rebuilt
 * on demand via the "Refresh playlists" action; mirrors {@link LikedIndexCache}.
 */
@Injectable({ providedIn: 'root' })
export class PlaylistIndexCache {
  load(): PlaylistIndexSnapshot | null {
    return readJson(STORAGE_KEY, (parsed) => (isSnapshot(parsed) ? parsed : undefined), null);
  }

  save(snapshot: PlaylistIndexSnapshot): void {
    writeJson(STORAGE_KEY, snapshot);
  }

  clear(): void {
    removeJson(STORAGE_KEY);
  }
}

function isSnapshot(value: unknown): value is PlaylistIndexSnapshot {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    candidate['version'] === VERSION &&
    Array.isArray(candidate['tracks']) &&
    Array.isArray(candidate['playlists'])
  );
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — the two files compile and
      `PlaylistIndexCache` resolves its `../models/playlist-index` + `./storage-cache` imports (and
      `playlist-index.ts` resolves its `./playlist` import against M7's model).
- [ ] In the browser console after serving, `localStorage.getItem('evm.playlistIndex')` → `null` (nothing
      written yet — the cache exists but the index isn't built until step 03).

## If it breaks
- **`Cannot find module './storage-cache'`** → the shared `storage-cache` helpers were built in M3; confirm
  `core/cache/storage-cache.ts` exports `readJson`/`writeJson`/`removeJson`.
- **`Property 'snapshotId' does not exist`** later in step 03** → you spelled the field `snapshot_id` (that's
  the raw DTO); the domain model uses camelCase `snapshotId`.
