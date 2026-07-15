# M9 · Step 03 of 14 — The PlaylistIndex service (snapshot-id diff)
> Nav: [← Grow the Spotify client](02_spotify-client-grow.md) · [Overview](00_overview.md) · [Grow GlobeStore →](04_globe-store-grow.md)

## Glossary for this step
> **incremental (diff) sync** — reconciling only what changed since last time instead of rebuilding from
> scratch. Here it means: for each playlist, re-page its items **only if** its `snapshotId` differs from the
> cached one; unchanged playlists cost zero item requests.
> **commit point** — the moment a partial result becomes durable. This service advances a playlist's *cached
> snapshot* only **after** its items are re-read and stored, so a crash mid-sync re-reads that playlist next
> time rather than silently losing its tracks.

## Why / design
This is the sync engine for the playlist-membership index. It builds a `trackId → PlaylistTrackEntry` map by
reading playlists, persists it via the step-01 cache, and — crucially — reconciles cheaply:

- **`sync()`** reads `GET /me/playlists`, compares each playlist's `snapshotId` to the cached value, and re-pages
  **only** the changed + brand-new ones; playlists that vanished are dropped. Persists after **each** playlist
  (so an interrupted sync resumes), and only advances a playlist's cached snapshot once its items are indexed
  (the commit point). A first-ever run sees every playlist as new, so `sync()` doubles as the initial build.
- **`refresh()`** forces a full rebuild from scratch (the Actions "Full re-scan" for playlists).
- **`hydrate()`** loads the persisted index into memory with no network, so a page can read `builtAt`/`hasData`
  straight from cache on open.

**Scope:** M9 builds and syncs the index. Its **library consumers** — reading which playlists hold a track,
editing membership after a Spotify change — are M10, so this file grows then (`// grows in M10`). We ship only
the build/sync/status surface that boot-sync (step 06) and the Actions page (step 12) need now. The read
signals (`playlists`, `builtAt`, `hasData`, `revision`) are populated here but first *consumed* by M10's
library views — they're the status surface those views bind to, alongside the read/edit methods that grow in M10.

**Recurring model:** this mirrors the M3 `LikedIndex` — an in-memory working map, `ensureLoaded()` lazy
hydration, a `revision` signal so dependent views recompute, and `persist()` writing the whole snapshot.

## Do this
1. Create `src/app/core/pipeline/playlist-index.ts` with the `PlaylistIndex` service + the `PlaylistScanProgress`
   interface + the `upsert` helper.
2. Note the `sync()` shape: build the surviving **roster** (unchanged playlists take fresh metadata; changed
   ones **hold their old snapshot** until re-paged), drop vanished playlists, then re-page each changed playlist
   and advance its snapshot in the roster only after its items land.
3. Leave the read/edit membership methods out — they arrive in M10. The `// grows in M10` comment marks where.

## Code
### `src/app/core/pipeline/playlist-index.ts`
```ts
import { computed, inject, Injectable, signal } from '@angular/core';

import { SpotifyApi } from '../api/spotify-api';
import { PlaylistIndexCache } from '../cache/playlist-index-cache';
import { Playlist } from '../models/playlist';
import { PlaylistTrackEntry, PlaylistTrackRef } from '../models/playlist-index';

/** Progress of an in-flight playlist scan (playlists read / total to read). */
export interface PlaylistScanProgress {
  done: number;
  total: number;
}

/**
 * Builds and persists a playlist-membership index: for every one of the user's playlists, which
 * tracks it contains, assembled into `trackId → {metadata, playlistIds[]}`. Built once on first use,
 * refreshed on demand; the library tools (M10) read + patch it in place (mirrors {@link LikedIndex}).
 * M9 ships the build/sync/status surface only.
 */
@Injectable({ providedIn: 'root' })
export class PlaylistIndex {
  private readonly spotify = inject(SpotifyApi);
  private readonly cache = inject(PlaylistIndexCache);

  /** Working set keyed by track id (each entry tracks the playlists currently holding it). */
  private byId = new Map<string, PlaylistTrackEntry>();
  private loaded = false;

  private readonly _playlists = signal<Playlist[]>([]);
  private readonly _myUserId = signal('');
  private readonly _builtAt = signal<string | null>(null);
  private readonly _building = signal(false);
  private readonly _progress = signal<PlaylistScanProgress>({ done: 0, total: 0 });
  private readonly _revision = signal(0);

  readonly playlists = this._playlists.asReadonly();
  readonly building = this._building.asReadonly();
  readonly progress = this._progress.asReadonly();
  /** Bumps whenever membership changes — lets views recompute after a build / add / remove. */
  readonly revision = this._revision.asReadonly();
  /** Last build timestamp (ISO), or null if never built. */
  readonly builtAt = this._builtAt.asReadonly();
  readonly hasData = computed(() => this._builtAt() !== null);

  // --- Build / refresh ---

  /** Load the persisted index into memory if present, without hitting Spotify — so a page can read
   * `builtAt` / status straight from cache on open (mirrors {@link LikedIndex.hydrate}). */
  hydrate(): void {
    this.ensureLoaded();
  }

  /**
   * Reconcile the index with Spotify, re-paging only the playlists whose contents changed since the
   * last sync (their `snapshotId` differs), plus brand-new ones, and dropping playlists that have
   * disappeared. Unchanged playlists cost zero item requests. A first-ever run sees every playlist
   * as new, so this doubles as the initial build. Persists after each playlist, so an interrupted
   * sync resumes from where it stopped instead of restarting (and never advances a playlist's cached
   * snapshot until that playlist's items have been re-read, so a crash can't silently lose tracks).
   */
  async sync(): Promise<void> {
    this.ensureLoaded();
    if (this._building()) {
      return;
    }
    this._building.set(true);
    try {
      this._myUserId.set((await this.spotify.getMe()).id);
      const current = await this.spotify.getMyPlaylists();
      const cached = new Map(this._playlists().map((p) => [p.id, p]));
      const currentIds = new Set(current.map((p) => p.id));

      // The roster we'll persist: surviving playlists, but with their snapshot left at the cached
      // value until re-paged so an interrupted sync re-reads them next time.
      const roster = new Map<string, Playlist>();
      for (const p of current) {
        const prev = cached.get(p.id);
        if (prev !== undefined && prev.snapshotId === p.snapshotId) {
          roster.set(p.id, p); // unchanged — safe to take fresh metadata (e.g. a rename)
        } else if (prev !== undefined) {
          roster.set(p.id, prev); // changed — hold the old snapshot until its items are re-read
        }
        // New playlists are added to the roster only once successfully paged (below).
      }

      // Drop the memberships of playlists that vanished entirely.
      for (const id of cached.keys()) {
        if (!currentIds.has(id)) {
          this.dropPlaylist(id);
        }
      }

      const changed = current.filter((p) => {
        const prev = cached.get(p.id);
        return prev === undefined || prev.snapshotId !== p.snapshotId;
      });
      this._progress.set({ done: 0, total: changed.length });
      this._playlists.set([...roster.values()]);
      this.persist();
      this._revision.update((r) => r + 1);

      for (const playlist of changed) {
        this.dropPlaylist(playlist.id); // clear any stale contribution before re-reading
        try {
          const refs = await this.spotify.getPlaylistTrackRefs(playlist.id);
          const seen = new Set<string>();
          for (const ref of refs) {
            if (seen.has(ref.id)) {
              continue; // a track listed twice in one playlist counts once
            }
            seen.add(ref.id);
            upsert(this.byId, ref, playlist.id);
          }
          // Commit point: advance this playlist's cached snapshot only now its items are indexed.
          roster.set(playlist.id, playlist);
          this._playlists.set([...roster.values()]);
        } catch {
          // A single unreadable playlist is non-fatal — skip it (snapshot left un-advanced so the
          // next sync retries it) and keep the rest.
        }
        this._progress.update((p) => ({ ...p, done: p.done + 1 }));
        this._builtAt.set(new Date().toISOString());
        this.persist();
        this._revision.update((r) => r + 1);
      }

      this._builtAt.set(new Date().toISOString());
      this.persist();
      this._revision.update((r) => r + 1);
    } finally {
      this._building.set(false);
    }
  }

  /** Force a full rebuild from Spotify (manual "Refresh playlists"). */
  async refresh(): Promise<void> {
    await this.build();
  }

  private async build(): Promise<void> {
    this.ensureLoaded();
    this._building.set(true);
    try {
      const myUserId = (await this.spotify.getMe()).id;
      const playlists = await this.spotify.getMyPlaylists();
      this._progress.set({ done: 0, total: playlists.length });

      const next = new Map<string, PlaylistTrackEntry>();
      for (const playlist of playlists) {
        try {
          const refs = await this.spotify.getPlaylistTrackRefs(playlist.id);
          const seen = new Set<string>();
          for (const ref of refs) {
            if (seen.has(ref.id)) {
              continue; // a track listed twice in one playlist counts once
            }
            seen.add(ref.id);
            upsert(next, ref, playlist.id);
          }
        } catch {
          // A single unreadable playlist is non-fatal — skip it, keep the rest.
        }
        this._progress.update((p) => ({ ...p, done: p.done + 1 }));
      }

      this.byId = next;
      this._playlists.set(playlists);
      this._myUserId.set(myUserId);
      this._builtAt.set(new Date().toISOString());
      this.persist();
      this._revision.update((r) => r + 1);
    } finally {
      this._building.set(false);
    }
  }

  // --- Library membership reads + edits (playlistIdsForTrack, tracksByArtist, addMembership,
  //     removeMembership, editablePlaylists) arrive with the M10 library console. // grows in M10

  // --- Internals ---

  /** Remove a playlist's id from every track entry, deleting entries left in no playlist. */
  private dropPlaylist(playlistId: string): void {
    for (const [trackId, entry] of this.byId) {
      if (!entry.playlistIds.includes(playlistId)) {
        continue;
      }
      entry.playlistIds = entry.playlistIds.filter((id) => id !== playlistId);
      if (entry.playlistIds.length === 0) {
        this.byId.delete(trackId);
      }
    }
  }

  private ensureLoaded(): void {
    if (this.loaded) {
      return;
    }
    const snapshot = this.cache.load();
    if (snapshot !== null) {
      this.byId = new Map(snapshot.tracks.map((track) => [track.id, track]));
      this._playlists.set(snapshot.playlists);
      this._myUserId.set(snapshot.myUserId);
      this._builtAt.set(snapshot.builtAt);
    }
    this.loaded = true;
  }

  private persist(): void {
    this.cache.save({
      version: 1,
      builtAt: this._builtAt() ?? new Date().toISOString(),
      myUserId: this._myUserId(),
      playlists: this._playlists(),
      tracks: [...this.byId.values()],
    });
  }
}

/** Insert or extend a track entry, adding `playlistId` to its membership set. */
function upsert(
  map: Map<string, PlaylistTrackEntry>,
  ref: PlaylistTrackRef,
  playlistId: string,
): void {
  const existing = map.get(ref.id);
  if (existing === undefined) {
    map.set(ref.id, { ...ref, playlistIds: [playlistId] });
  } else if (!existing.playlistIds.includes(playlistId)) {
    existing.playlistIds = [...existing.playlistIds, playlistId];
  }
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — `PlaylistIndex` resolves
      `getMyPlaylists` + `getPlaylistTrackRefs` (steps 02) and the step-01 cache/models.
- [ ] It's not wired to any UI yet, so there's nothing to click. Its Done-when is proven end-to-end via the
      Actions "Check for updates" (playlists) in [step 15](15_verify.md): a second sync within snapshot-parity
      re-pages **0** playlists.

## If it breaks
- **`myUserId` is always empty / all playlists look "not mine"** → `getMe()` must resolve before the roster
  compare; it's `await`ed first in `sync()`/`build()`.
- **Every sync re-pages every playlist** → you're comparing the wrong field. The diff key is the domain
  `snapshotId` (mapped in M7's `toPlaylist`), not the raw `snapshot_id`.
- **A track in two playlists shows only one** → `upsert` must *extend* `playlistIds` when the entry exists, not
  overwrite it.
