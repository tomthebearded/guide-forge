# M10 · Step 05 of 18 — Grow `LikedIndex`: local relink/dedup mutations
> Nav: [← The library caches](04_library-caches.md) · [Overview](00_overview.md) · [Grow PlaylistIndex →](06_playlist-index-grow.md)

## Glossary for this step
> **local mutation** — patching the in-memory index (and its persisted snapshot) *after* Spotify confirms an
> action, so the UI reflects the change without a full rescan. The counterpart to the scan feed (`add`/`commit`).

## Why / design
When a library action relinks or removes likes, the UI must update **without re-paging the whole library**. The
`LibraryStore` (step 08) does that by patching `LikedIndex` in place once Spotify confirms — so this step adds
the two local-mutation methods that were deferred back in [M3's overview](../MILESTONE_3_liked-songs-stream/00_overview.md):

- **`removeTracks(ids)`** — drop liked tracks by id (the old copies removed in a relink/dedup).
- **`addTracks(tracks)`** — add liked tracks (the newer copies saved in a relink). Full `IndexedTrack`s, since
  the caller already has the album metadata.

Each bumps the `revision` signal and re-persists, so every dependent computed (the artist detail, the
all-liked-songs list, the globe's per-track pass) recomputes.

> **`clear()` already exists — it isn't new here.** The globe store has called `likedIndex.clear()` since M5
> (`clearData()`), so `clear()` was built back in [M3 step 06](../MILESTONE_3_liked-songs-stream/06_liked-index.md#code).
> This step *completes* the public surface with the two relink/dedup mutations; `clear()` is shown below only
> because the whole file is reprinted.

> **Recurring model — mirror only after Spotify confirms.** These are dumb, synchronous patches. The *ordering*
> (Spotify first, then patch) lives in the store (step 08); `LikedIndex` just applies what it's told. That
> separation is why a rejected Spotify call never leaves the index claiming a change that didn't happen.

The file is short, so the **whole updated `liked-index.ts`** is below — paste it over the M3 version. The only
changes are the two new methods (`removeTracks`, `addTracks`), appended after the M3 `clear()`.

## Do this
1. Replace `src/app/core/pipeline/liked-index.ts` with the file below.
2. The two new methods go under the `// --- Local mutations (M10) ---` comment; everything above it (including
   `clear()`, built in M3) is the M3 file unchanged.
3. `removeTracks` / `addTracks` each bump `revision` and call `persist()` — that's what re-renders dependent
   computeds and survives a reload.

## Code
### `src/app/core/pipeline/liked-index.ts`
```ts
import { computed, inject, Injectable, signal, untracked } from '@angular/core';

import { LikedIndexCache } from '../cache/liked-index-cache';
import { toIndexedTrack } from '../mappers/spotify.mapper';
import { IndexedTrack } from '../models/indexed-track';
import { LikedTrack } from '../models/liked-track';

/**
 * Flattened, per-track view of the user's Liked Songs — built as a byproduct of the `/me/tracks`
 * scan and persisted via {@link LikedIndexCache}. Reads an artist's liked tracks (with album + ISRC)
 * without re-paging the library. Grown in M10 with the relink/dedup local mutations.
 */
@Injectable({ providedIn: 'root' })
export class LikedIndex {
  private readonly cache = inject(LikedIndexCache);

  /** Working set keyed by saved track id (each liked track is unique by id). */
  private byId = new Map<string, IndexedTrack>();
  private loaded = false;

  private readonly _count = signal(0);
  private readonly _newest = signal<string | null>(null);

  readonly count = this._count.asReadonly();
  readonly newest = this._newest.asReadonly();
  readonly hasData = computed(() => this._count() > 0);

  /** A scan or a local mutation changed the data — bump this so dependent views recompute. */
  private readonly _revision = signal(0);
  readonly revision = this._revision.asReadonly();

  /**
   * Hydrate the persisted index into memory (idempotent) so `hasData` and lookups reflect the
   * localStorage cache without waiting for a scan. Called when the page opens so a cached library
   * doesn't look empty (which would re-prompt a full scan).
   */
  hydrate(): void {
    this.ensureLoaded();
  }

  /** Liked tracks featuring the given artist, newest-first. */
  tracksByArtist(artistId: string): IndexedTrack[] {
    this.ensureLoaded();
    return [...this.byId.values()]
      .filter((track) => track.artistIds.includes(artistId))
      .sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1));
  }

  /** Every indexed liked track (unordered). Pair with {@link revision} inside a computed. */
  all(): IndexedTrack[] {
    this.ensureLoaded();
    return [...this.byId.values()];
  }

  // --- Scan feed (called by the page while paging `/me/tracks`) ---

  /** Begin a full rescan: drop the working set so removed likes don't linger. */
  beginFull(): void {
    this.ensureLoaded();
    this.byId.clear();
    this._newest.set(null);
    this._count.set(0);
  }

  /** Begin an incremental pass: keep what's persisted, merge new likes on top (M9 boot-sync). */
  beginIncremental(): void {
    this.ensureLoaded();
  }

  /** Record one liked track (upsert by id). */
  add(track: LikedTrack): void {
    this.byId.set(track.id, toIndexedTrack(track));
  }

  /** Persist the working set and advance the newest-seen cursor. Safe to call per page. */
  commit(newest: string | null): void {
    this._newest.set(newest);
    this._count.set(this.byId.size);
    this._revision.update((r) => r + 1);
    this.persist();
  }

  // --- Reset (used by a full "start fresh" and the globe's `clearData`, from M5 on) ---

  /** Wipe the index and its persisted snapshot. Leaves `loaded = true` so the next read sees the empty set, not a stale reload. */
  clear(): void {
    this.byId.clear();
    this.loaded = true;
    this._count.set(0);
    this._newest.set(null);
    this.cache.clear();
    this._revision.update((r) => r + 1);
  }

  // --- Local mutations (M10 — applied after a Spotify library action confirms) ---

  /** Remove liked tracks by id (e.g. the old copies dropped during a relink/dedup). */
  removeTracks(ids: Iterable<string>): void {
    this.ensureLoaded();
    for (const id of ids) {
      this.byId.delete(id);
    }
    this._count.set(this.byId.size);
    this._revision.update((r) => r + 1);
    this.persist();
  }

  /** Add liked tracks (e.g. the newer copies saved during a relink). */
  addTracks(tracks: Iterable<IndexedTrack>): void {
    this.ensureLoaded();
    for (const track of tracks) {
      this.byId.set(track.id, track);
    }
    this._count.set(this.byId.size);
    this._revision.update((r) => r + 1);
    this.persist();
  }

  private ensureLoaded(): void {
    if (this.loaded) {
      return;
    }
    const snapshot = this.cache.load();
    if (snapshot !== null) {
      this.byId = new Map(snapshot.tracks.map((track) => [track.id, track]));
    }
    this.loaded = true;
    // Hydration can be triggered by the first read inside a reactive context (a computed reading
    // `all()`); signal writes are forbidden there, so apply them outside any active consumer.
    untracked(() => {
      if (snapshot !== null) {
        this._newest.set(snapshot.newest);
      }
      this._count.set(this.byId.size);
    });
  }

  private persist(): void {
    this.cache.save({ version: 1, newest: this._newest(), tracks: [...this.byId.values()] });
  }
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — `LikedIndex` now also exposes
      `removeTracks` and `addTracks` (alongside the `clear` it has had since M3).
- [ ] `addTracks` / `removeTracks` both call `this._revision.update(...)` and `this.persist()` — so a mutation
      both re-renders dependent computeds and survives a reload.

## If it breaks
- **`Property 'clear' does not exist on type 'LikedIndex'`** → your `liked-index.ts` predates M3's `clear()`.
  Re-paste the [M3 step 06](../MILESTONE_3_liked-songs-stream/06_liked-index.md#code) file, then re-apply the
  two additions above.
- **The globe / library still shows a removed like after a relink** → the mutation didn't bump `revision` (the
  view can't track a plain array otherwise) — keep the `_revision.update` in both `addTracks` and `removeTracks`.
- **A relink survives in the UI but not after reload** → you dropped the `this.persist()` call; the mutation must
  re-write the snapshot.
