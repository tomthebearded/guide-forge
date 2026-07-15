# M9 · Verify — Explore controls & sync 🎛️
> Nav: [← App root: boot on open](14_app-boot.md) · [Overview](00_overview.md) · [M10 — Library console →](../MILESTONE_10_library-console/00_overview.md)

Run the pre-flight quality bar, then work the gate by hand. When it passes, scrub your musical history and watch
the app quietly keep itself in sync.

## Done-when gate (the real test — check every box by hand)
Run `npm run format:check`, `npm run lint`, `npm run build` first — all clean (`Application bundle generation
complete`, no lint errors, no `any`). Then `ng serve --host 127.0.0.1 --port 4200`, log in, go to **Actions**,
and **Full re-scan** Liked Songs once so the globe has data.

- [ ] **Timeline replays the fill-in.** On `/globe`, drag the bottom-centre scrubber left → the globe recolours
      to the music you'd liked **through** that month; the label reads e.g. `Mar 2024`. Slide fully right → reads
      `Now` and the full map returns. Press play → it advances one month per ~0.65 s, stopping at `Now`.
- [ ] **No-filter passes agree exactly.** With the scrubber at `Now` and no genre/era filter, note a leaderboard
      country's tracks value. Drag one step left, then back to `Now` → the value is **identical** (the per-track
      pass at `Now` equals the fast artist-level pass).
- [ ] **Era filter recolours.** Top-centre, click a decade chip (e.g. `90s`) → the globe re-ramps to that
      decade's tracks; the legend caption includes `90s`. **All eras** clears it.
- [ ] **Genre filter recolours.** Pick a genre from the dropdown → the globe re-ramps to artists with that tag;
      the caption includes the genre. **All genres** clears it. (Genres populate as the scan's genre worker
      enriches artists — watch the loading terminal log `Genres: fetched N artists`.)
- [ ] **Warm reopen ≈ zero network.** Reload within 15 min of the scan → DevTools ▸ Network shows **no**
      `/me/tracks`, `/me/playlists`, or `/artists/*` request; the boot overlay flashes and clears; the log reads
      `Liked Songs unchanged — nothing to fetch.` or domains skipped as fresh.
- [ ] **Changed library diff-syncs.** Like one new song on Spotify, reload → the cheap diff detects the change
      (`/me/tracks?limit=1`) and pages only the new like; the new artist colours in.
- [ ] **Actions recalculate works.** On `/actions`: **Check for updates** (Liked Songs) pages only newer likes;
      **Full re-scan** re-pages all + retries failures; **Recheck unplaced** re-resolves only couldn't-place
      artists; each group shows a status line + a `synced N ago` / `never synced` label.
- [ ] **Playlist index builds via snapshot diff.** On `/actions`, **Check for updates** (Playlists) → status
      shows `Checking your playlists… N of M` for only the changed playlists; `evm.playlistIndex` appears in
      `localStorage`. A second check within snapshot-parity re-pages **0** playlists.
- [ ] **Nav locks during boot.** While the boot overlay is up, the header **Globe**/**Actions** links are
      disabled and a manual URL change to `/actions` is blocked until it clears.

## Files after this milestone (complete — the checkpoint)

> `src/app/core/models/playlist.ts` is **unchanged since M7** (M9 only references it), so it isn't reproduced
> here — see M7's checkpoint for its contents.

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

### `src/app/core/cache/sync-state-cache.ts`
```ts
import { Injectable } from '@angular/core';

import { readJson, removeJson, writeJson } from './storage-cache';

const STORAGE_KEY = 'evm.syncState';
const VERSION = 1;

/** When each data domain was last reconciled with Spotify (epoch ms), or null if never. */
export interface DomainSyncState {
  lastSyncedAt: number | null;
}

/**
 * Per-domain last-sync timestamps that drive the boot-time staleness guard: a domain is skipped on
 * open when it was reconciled less than the guard window ago, so a warm reopen costs zero network.
 */
export interface SyncState {
  liked: DomainSyncState;
  playlists: DomainSyncState;
  artists: DomainSyncState;
}

const EMPTY: SyncState = {
  liked: { lastSyncedAt: null },
  playlists: { lastSyncedAt: null },
  artists: { lastSyncedAt: null },
};

/** Persists the three domains' last-sync timestamps (globe/liked, playlists, artist info). */
@Injectable({ providedIn: 'root' })
export class SyncStateCache {
  load(): SyncState {
    return readJson(STORAGE_KEY, revive, EMPTY);
  }

  save(state: SyncState): void {
    writeJson(STORAGE_KEY, { version: VERSION, ...state });
  }

  clear(): void {
    removeJson(STORAGE_KEY);
  }
}

function revive(parsed: unknown): SyncState | undefined {
  if (parsed === null || typeof parsed !== 'object') {
    return undefined;
  }
  const candidate = parsed as Record<string, unknown>;
  if (candidate['version'] !== VERSION) {
    return undefined;
  }
  return {
    liked: domain(candidate['liked']),
    playlists: domain(candidate['playlists']),
    artists: domain(candidate['artists']),
  };
}

/** Coerce one persisted domain entry into a valid {@link DomainSyncState}. */
function domain(value: unknown): DomainSyncState {
  if (value !== null && typeof value === 'object') {
    const at = (value as Record<string, unknown>)['lastSyncedAt'];
    if (typeof at === 'number') {
      return { lastSyncedAt: at };
    }
  }
  return { lastSyncedAt: null };
}
```

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

### `src/app/core/pipeline/boot-sync.ts`
```ts
import { inject, Injectable, signal } from '@angular/core';

import { GlobeStore } from '../../features/globe/globe-store';
import { Toast } from '../../shared/toast';
import { RateLimiters } from '../api/rate-limiters';
import { SpotifyApi } from '../api/spotify-api';
import { SyncState, SyncStateCache } from '../cache/sync-state-cache';
import { LogStore } from '../logging/log-store';
import { LikedIndex } from './liked-index';
import { PlaylistIndex } from './playlist-index';

/** The data domain currently being reconciled, or `idle` when nothing is running. */
export type SyncDomain = 'liked' | 'playlists' | 'artists';
export type SyncPhase = 'idle' | SyncDomain;

/** How recently a domain must have synced to be skipped on open. */
const STALE_MS = 15 * 60 * 1000;

/**
 * Orchestrates the on-open reconcile: liked → playlists → artists, in that order, each awaited so
 * the sequence is strictly sequential. Every step is skipped when it synced under {@link STALE_MS}
 * ago (a **staleness guard**), so a warm reopen costs zero network. The liked step leads with a
 * one-call cheap diff ({@link SpotifyApi.getLikedTracksSummary}) and only pages when the library
 * actually changed. {@link busy} drives the app's blocking overlay + nav-lock while the boot
 * sequence runs; the per-domain `force` methods back the Actions page's manual reloads.
 */
@Injectable({ providedIn: 'root' })
export class BootSync {
  private readonly spotify = inject(SpotifyApi);
  private readonly globe = inject(GlobeStore);
  private readonly likedIndex = inject(LikedIndex);
  private readonly playlistIndex = inject(PlaylistIndex);
  private readonly cache = inject(SyncStateCache);
  private readonly log = inject(LogStore);
  private readonly toast = inject(Toast);
  private readonly limits = inject(RateLimiters);

  private state: SyncState = this.cache.load();

  private readonly _phase = signal<SyncPhase>('idle');
  private readonly _running = signal(false);
  private readonly _boot = signal(false);
  private readonly _state = signal<SyncState>(this.state);

  /** The domain currently syncing, or `idle`. */
  readonly phase = this._phase.asReadonly();
  /** Any sync (boot or manual) is in flight — for disabling the Actions controls. */
  readonly running = this._running.asReadonly();
  /** The **boot** sequence is in flight — drives the blocking overlay + nav-lock only. */
  readonly busy = this._boot.asReadonly();
  /** Per-domain last-sync timestamps, reactive for the Actions "synced N ago" labels. */
  readonly syncState = this._state.asReadonly();

  /** Last-sync epoch ms for one domain, or null if never synced. */
  lastSyncedAt(domain: SyncDomain): number | null {
    return this._state()[domain].lastSyncedAt;
  }

  /**
   * The on-open reconcile: liked → playlists → artists, sequential and staleness-guarded. Assumes
   * the caller has already confirmed there's data to reconcile (a first-ever run defers to the
   * explicit scan UI). Holds {@link busy} for the whole sequence so the shell blocks navigation.
   */
  async run(): Promise<void> {
    await this.wrap(async () => {
      await this.doSyncLiked(false);
      if (this.pauseIfLimited()) return;
      await this.doSyncPlaylists(false);
      if (this.pauseIfLimited()) return;
      await this.doSyncArtists(false);
    }, true);
  }

  /** Cheap liked-songs diff (force bypasses the staleness guard) — Actions "Check for updates". */
  async syncLiked(force = false): Promise<void> {
    await this.wrap(() => this.doSyncLiked(force));
  }

  /** Incremental playlist reconcile (snapshot diff) — Actions "Check for updates". */
  async syncPlaylists(force = false): Promise<void> {
    await this.wrap(() => this.doSyncPlaylists(force));
  }

  /** Backfill artist genres + follow state for what's missing — Actions "Check for updates". */
  async syncArtists(force = false): Promise<void> {
    await this.wrap(() => this.doSyncArtists(force));
  }

  /** Full liked-songs rescan (re-page everything, retry failures) — Actions "Full re-scan". */
  async fullRescanLiked(): Promise<void> {
    await this.wrap(async () => {
      this._phase.set('liked');
      await this.globe.recalculate(true);
      this.stamp('liked');
    });
  }

  /** Full playlist rebuild from scratch — Actions "Full re-scan". */
  async fullRescanPlaylists(): Promise<void> {
    await this.wrap(async () => {
      this._phase.set('playlists');
      await this.playlistIndex.refresh();
      this.stamp('playlists');
    });
  }

  /** Re-fetch genres + follow state for every placed artist — Actions "Full re-scan". */
  async fullRescanArtists(): Promise<void> {
    await this.wrap(async () => {
      this._phase.set('artists');
      await this.globe.refreshArtistInfo();
      this.stamp('artists');
    });
  }

  // --- Domain steps (no re-entrancy management; run inside wrap()) ---

  private async doSyncLiked(force: boolean): Promise<void> {
    if (!this.globe.hasData() || (!force && this.isFresh('liked'))) {
      return;
    }
    this._phase.set('liked');
    try {
      const summary = await this.spotify.getLikedTracksSummary();
      const unchanged =
        summary.total === this.likedIndex.count() && summary.newest === this.likedIndex.newest();
      if (unchanged) {
        this.log.log('Liked Songs unchanged — nothing to fetch.');
      } else {
        await this.globe.recalculate(false);
      }
      this.stamp('liked');
    } catch {
      this.log.log('Could not check your Liked Songs.', 'error');
    }
  }

  private async doSyncPlaylists(force: boolean): Promise<void> {
    if (!this.globe.hasData() || (!force && this.isFresh('playlists'))) {
      return;
    }
    this._phase.set('playlists');
    try {
      await this.playlistIndex.sync();
      this.stamp('playlists');
    } catch {
      this.log.log('Could not check your playlists.', 'error');
    }
  }

  private async doSyncArtists(force: boolean): Promise<void> {
    if (!this.globe.hasData() || (!force && this.isFresh('artists'))) {
      return;
    }
    this._phase.set('artists');
    try {
      await this.globe.syncArtistInfo();
      this.stamp('artists');
    } catch {
      this.log.log('Could not refresh artist info.', 'error');
    }
  }

  // --- Internals ---

  /** Serialise every entry point through one in-flight guard; `boot` also raises the nav-lock. */
  private async wrap(fn: () => Promise<void>, boot = false): Promise<void> {
    if (this._running()) {
      return;
    }
    // A persisted cooldown means a data source (Spotify / Wikidata / MusicBrainz) has rate-limited us
    // and the ban is still open (it survives reloads). Firing a sync into it would only re-trip and
    // extend it — pause and tell the user. Checked across all hosts, since the sync drives all three.
    if (this.pauseIfLimited()) {
      return;
    }
    this._running.set(true);
    if (boot) {
      this._boot.set(true);
    }
    try {
      await fn();
    } finally {
      this._phase.set('idle');
      this._boot.set(false);
      this._running.set(false);
    }
  }

  /**
   * If any data source has an open 429 cooldown, surface it once and return true so the caller
   * bails out. Between boot steps this matters for more than politeness: a step whose host is banned
   * would otherwise enter {@link RateLimitGate.acquire}, which does not fail fast — it loops on
   * `delay()` until the cooldown lifts (minutes), holding the blocking overlay + nav-lock the whole
   * time. Skipping the remaining steps keeps the app responsive; the next reconcile picks them up.
   */
  private pauseIfLimited(): boolean {
    const waitMs = this.limits.maxRetryAfterMs();
    if (waitMs <= 0) {
      return false;
    }
    const mins = Math.ceil(waitMs / 60_000);
    this.log.log(
      `A music data source is rate-limiting the app — paused for about ${mins} min.`,
      'error',
    );
    this.toast.error(`The app is being rate-limited. Please try again in about ${mins} min.`);
    return true;
  }

  private isFresh(domain: SyncDomain): boolean {
    const at = this.state[domain].lastSyncedAt;
    return at !== null && Date.now() - at < STALE_MS;
  }

  private stamp(domain: SyncDomain): void {
    this.state = { ...this.state, [domain]: { lastSyncedAt: Date.now() } };
    this.cache.save(this.state);
    this._state.set(this.state);
  }
}

/** Human phase label for the blocking overlay. */
export const PHASE_LABEL: Record<SyncPhase, string> = {
  idle: '',
  liked: 'Checking your Liked Songs…',
  playlists: 'Checking your playlists…',
  artists: 'Refreshing artist details…',
};
```

### `src/app/core/pipeline/boot-sync-guard.ts`
```ts
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';

import { BootSync } from './boot-sync';

/**
 * Blocks navigation between the main pages while the boot sync is reconciling — page switching is
 * locked (alongside the shell's overlay + the header's disabled nav) only for as long as a diff
 * actually runs. Returning the current URL (false) leaves the user where they are instead of
 * bouncing them to a fallback route.
 */
export const bootSyncGuard: CanActivateFn = () => !inject(BootSync).busy();
```

### `src/app/core/dto/spotify.dto.ts` *(modified — playlist-items DTOs)*
```ts
/** Raw Spotify Web API payloads. Never used outside mappers — domain code uses models. */
/** Grows in M10 (album images on tracks, full tracks, artists). */

export interface SpotifyArtistRefDto {
  id: string;
  name: string;
}

/** Album as it rides on a track — the bits the liked-songs index needs. */
export interface SpotifyAlbumRefDto {
  id: string;
  name: string;
  album_type: string;
  /** `YYYY` | `YYYY-MM` | `YYYY-MM-DD`, per `release_date_precision`. */
  release_date: string;
}

/** One entry from `GET /me/tracks` — the saved `track` plus when it was saved. */
export interface SpotifySavedTrackDto {
  added_at: string;
  track: {
    id: string;
    name: string;
    /** Spotify URI (e.g. `spotify:track:...`) — used to start Liked Songs playback. */
    uri: string;
    artists: SpotifyArtistRefDto[];
    duration_ms: number;
    /** International Standard Recording Code — same recording shares it across re-releases. */
    external_ids?: { isrc?: string };
    album: SpotifyAlbumRefDto;
  };
}

/** The `GET /me/tracks` paging object: a page of saved tracks + the `next` cursor + the grand `total`. */
export interface SpotifySavedTracksDto {
  items: SpotifySavedTrackDto[];
  next: string | null;
  total: number;
}

/** Payload of `GET /me` — only the current user's id is needed. (Added in M2.) */
export interface SpotifyMeDto {
  id: string;
}

// --- M7: playback, devices, playlists ---

/** One image (album art / artist photo). Spotify lists them largest-first; width may be null. */
export interface SpotifyImageDto {
  url: string;
  width: number | null;
  height: number | null;
}

/** The currently-playing item as it rides on the playback state — enough for the header. */
export interface SpotifyTrackDto {
  id: string;
  name: string;
  duration_ms: number;
  artists: SpotifyArtistRefDto[];
  album: { images: SpotifyImageDto[] };
}

/** Payload of `GET /me/player`. Returns 204 (null body) when no device is active. */
export interface SpotifyPlaybackStateDto {
  is_playing: boolean;
  shuffle_state: boolean;
  /** Playback position into the current item, in ms (null when nothing is loaded). */
  progress_ms: number | null;
  /** Null for non-track items (e.g. podcast episodes) or when nothing is loaded. */
  item: SpotifyTrackDto | null;
}

/** One Spotify Connect device from `GET /me/player/devices`. */
export interface SpotifyDeviceDto {
  /** Null only for restricted devices that can't be targeted; we skip those. */
  id: string | null;
  is_active: boolean;
  name: string;
}

/** Payload of `GET /me/player/devices`. */
export interface SpotifyDevicesDto {
  devices: SpotifyDeviceDto[];
}

/** One playlist from `GET /me/playlists`. */
export interface SpotifyPlaylistDto {
  id: string;
  name: string;
  public: boolean | null;
  collaborative: boolean;
  /** Track-count summary. The Feb 2026 Dev Mode migration renamed this field `tracks` → `items`. */
  items: { total: number };
  owner: { id: string };
  /** Opaque version tag — changes iff the playlist's contents change. Drives the incremental sync (M9). */
  snapshot_id: string;
}

export interface SpotifyPlaylistsDto {
  /** Spotify returns `null` entries for playlists the user can no longer access. */
  items: (SpotifyPlaylistDto | null)[];
  next: string | null;
}

// --- M8: flight lookups (artist photo + queue peek) ---

/**
 * Payload of `GET /artists/{id}` — the artist photo that rides the flight plane, plus the `genres`
 * tags that drive the M9 globe genre filter.
 */
export interface SpotifyArtistDto {
  id: string;
  name: string;
  images: SpotifyImageDto[];
  /** Spotify's genre tags for the artist; may be empty. Consumed by the M9 genre filter. */
  genres: string[];
}

/**
 * Payload of `GET /me/player/queue`. `queue[0]` is the next item up. Items may be episodes (no
 * `artists`), so the array is typed loosely and the caller guards.
 */
export interface SpotifyQueueDto {
  currently_playing: SpotifyTrackDto | null;
  queue: (SpotifyTrackDto | { id: string | null })[];
}

// --- M9: playlist items (membership index) ---

/**
 * One item from `GET /playlists/{id}/items` (fetched with a `fields` mask). The Feb 2026 Dev Mode
 * migration renamed the per-entry `track` property to `item` (`tracks.tracks.track` → `items.items.item`).
 */
export interface SpotifyPlaylistTrackItemDto {
  item: {
    id: string | null;
    name: string;
    uri: string;
    duration_ms: number;
    /** Local files have no catalog id and can't be re-added by uri — skipped. */
    is_local: boolean;
    /** `track` | `episode` — only tracks are indexed. */
    type: string;
    artists: SpotifyArtistRefDto[];
    album: { name: string; images: SpotifyImageDto[] };
  } | null;
}

export interface SpotifyPlaylistTracksDto {
  items: SpotifyPlaylistTrackItemDto[];
  next: string | null;
}
```

### `src/app/core/mappers/spotify.mapper.ts` *(modified — `toPlaylistTrackRefs`)*
```ts
/** Dto → domain mappers. Grows in M10 (album/track mappers). */
import {
  SpotifyImageDto,
  SpotifyPlaybackStateDto,
  SpotifyPlaylistDto,
  SpotifyPlaylistsDto,
  SpotifyPlaylistTracksDto,
  SpotifySavedTracksDto,
} from '../dto/spotify.dto';
import { IndexedTrack } from '../models/indexed-track';
import { AlbumType, LikedTrack } from '../models/liked-track';
import { PlaybackState } from '../models/playback-state';
import { Playlist } from '../models/playlist';
import { PlaylistTrackRef } from '../models/playlist-index';

const ALBUM_TYPES: readonly AlbumType[] = ['album', 'single', 'compilation'];

/** Map one raw `/me/tracks` page to clean {@link LikedTrack} domain models. */
export function toLikedTracks(page: SpotifySavedTracksDto): LikedTrack[] {
  return page.items.map((item) => ({
    id: item.track.id,
    name: item.track.name,
    uri: item.track.uri,
    isrc: item.track.external_ids?.isrc ?? null,
    addedAt: item.added_at,
    durationMs: item.track.duration_ms,
    artists: item.track.artists.map((artist) => ({ id: artist.id, name: artist.name })),
    album: {
      id: item.track.album.id,
      name: item.track.album.name,
      albumType: toAlbumType(item.track.album.album_type),
      releaseDate: item.track.album.release_date,
    },
  }));
}

/** Flatten a liked track into the persisted, per-artist-lookup index entry. */
export function toIndexedTrack(track: LikedTrack): IndexedTrack {
  return {
    id: track.id,
    name: track.name,
    uri: track.uri,
    isrc: track.isrc,
    durationMs: track.durationMs,
    addedAt: track.addedAt,
    albumId: track.album.id,
    albumName: track.album.name,
    albumType: track.album.albumType,
    releaseDate: track.album.releaseDate,
    artistIds: track.artists.map((artist) => artist.id),
  };
}

/** Null when no device is active or the current item is not a track (e.g. a podcast episode). */
export function toPlaybackState(dto: SpotifyPlaybackStateDto | null): PlaybackState | null {
  if (dto === null || dto.item === null) {
    return null;
  }
  return {
    isPlaying: dto.is_playing,
    shuffle: dto.shuffle_state,
    trackId: dto.item.id,
    trackName: dto.item.name,
    artists: dto.item.artists.map((artist) => ({ id: artist.id, name: artist.name })),
    artistNames: dto.item.artists.map((artist) => artist.name).join(', '),
    albumImageUrl: smallestImageUrl(dto.item.album.images),
    durationMs: dto.item.duration_ms,
    progressMs: dto.progress_ms ?? 0,
  };
}

/** The user's playlists, skipping the `null` entries Spotify sprinkles in for inaccessible playlists. */
export function toPlaylists(dto: SpotifyPlaylistsDto): Playlist[] {
  return dto.items.filter((item): item is SpotifyPlaylistDto => item !== null).map(toPlaylist);
}

function toPlaylist(dto: SpotifyPlaylistDto): Playlist {
  return {
    id: dto.id,
    name: dto.name,
    isPublic: dto.public,
    collaborative: dto.collaborative,
    trackCount: dto.items.total,
    ownerId: dto.owner.id,
    snapshotId: dto.snapshot_id,
  };
}

/** Playable, catalog-resolved tracks on a playlist — drops local files, episodes, and null items. */
export function toPlaylistTrackRefs(dto: SpotifyPlaylistTracksDto): PlaylistTrackRef[] {
  const refs: PlaylistTrackRef[] = [];
  for (const entry of dto.items) {
    const track = entry.item;
    if (track === null || track.id === null || track.is_local || track.type !== 'track') {
      continue;
    }
    refs.push({
      id: track.id,
      name: track.name,
      uri: track.uri,
      durationMs: track.duration_ms,
      artistIds: track.artists.map((artist) => artist.id),
      albumName: track.album.name,
      albumImageUrl: largestImageUrl(track.album.images),
    });
  }
  return refs;
}

/** Coerce Spotify's free-text `album_type` to our union, defaulting unknowns to `album`. */
function toAlbumType(value: string): AlbumType {
  return (ALBUM_TYPES as readonly string[]).includes(value) ? (value as AlbumType) : 'album';
}

/** Smallest available image (Spotify lists them largest-first) — the compact header thumbnail. */
function smallestImageUrl(images: SpotifyImageDto[]): string | null {
  if (images.length === 0) {
    return null;
  }
  const smallest = images.reduce((min, image) =>
    (image.width ?? Infinity) < (min.width ?? Infinity) ? image : min,
  );
  return smallest.url;
}

/** Largest available image (Spotify lists them largest-first) — used for the plane's artist photo. */
export function largestImageUrl(images: SpotifyImageDto[]): string | null {
  if (images.length === 0) {
    return null;
  }
  const largest = images.reduce((max, image) =>
    (image.width ?? 0) > (max.width ?? 0) ? image : max,
  );
  return largest.url;
}
```

### `src/app/core/api/spotify-api.ts` *(modified — genres, playlist items, follow state)*
```ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  SpotifyArtistDto,
  SpotifyDevicesDto,
  SpotifyMeDto,
  SpotifyPlaybackStateDto,
  SpotifyPlaylistsDto,
  SpotifyPlaylistTracksDto,
  SpotifyQueueDto,
  SpotifySavedTracksDto,
} from '../dto/spotify.dto';
import { toLikedTracks, toPlaylists, toPlaylistTrackRefs } from '../mappers/spotify.mapper';
import { ArtistRef } from '../models/artist';
import { LikedTrack } from '../models/liked-track';
import { Playlist } from '../models/playlist';
import { PlaylistTrackRef } from '../models/playlist-index';
import { mapWithConcurrency, withRetry } from '../pipeline/http-retry';

/** `GET /me/tracks` and `GET /me/playlists` return at most 50 items per page. */
const PAGE_SIZE = 50;
/** `GET /playlists/{id}/items` allows up to 100 items per page. */
const PLAYLIST_PAGE_SIZE = 100;
/** Library save/remove/contains batch their uris ≤50; playlist adds cap at 100 uris. */
const ID_BATCH = 50;
const URI_BATCH = 100;
/**
 * Per-id fetches in flight when standing in for a removed bulk endpoint. 6 keeps the genre
 * enrichment brisk while staying clear of Spotify's rolling rate limit (`withRetry` honours 429).
 */
const FETCH_CONCURRENCY = 6;
/** Field mask trimming playlist-item payloads to what the membership index needs. */
const PLAYLIST_ITEM_FIELDS =
  'items(item(id,name,uri,duration_ms,is_local,type,artists(id),album(name,images))),next';

const trackUri = (id: string): string => `spotify:track:${id}`;
const artistUri = (id: string): string => `spotify:artist:${id}`;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/**
 * Typed client for the Spotify Web API. The M1 auth interceptor adds the bearer token; the M2
 * rate-limit gate (via `rateLimitInterceptor`) is the **single** pacer for every call here — spacing,
 * an adaptive rolling-window cap, and 429 cooldowns across all Spotify traffic (paging, the per-id
 * fan-outs, the player poll, controls). This service keeps no throttle of its own. Grows again in M10
 * (discography, full tracks, library relink).
 */
@Injectable({ providedIn: 'root' })
export class SpotifyApi {
  private readonly http = inject(HttpClient);

  /**
   * Streams the user's Liked Songs newest-first, one page (≤50) at a time, following Spotify's
   * `next` cursor. Consumers may stop iterating early. Each page is mapped to clean {@link LikedTrack}s.
   */
  async *streamLikedTracks(): AsyncIterable<LikedTrack[]> {
    let url: string | null = `${environment.spotify.apiBaseUrl}/me/tracks?limit=${PAGE_SIZE}`;
    while (url !== null) {
      const next: string = url;
      const page: SpotifySavedTracksDto = await withRetry(() =>
        firstValueFrom(this.http.get<SpotifySavedTracksDto>(next)),
      );
      yield toLikedTracks(page);
      url = page.next;
    }
  }

  /**
   * A one-call summary of the user's Liked Songs — total count + newest `added_at` — via
   * `GET /me/tracks?limit=1`. The cheap diff the boot sync (M9) uses to decide whether the library changed.
   */
  async getLikedTracksSummary(): Promise<{ total: number; newest: string | null }> {
    const base = environment.spotify.apiBaseUrl;
    const page = await withRetry(() =>
      firstValueFrom(this.http.get<SpotifySavedTracksDto>(`${base}/me/tracks?limit=1`)),
    );
    return { total: page.total, newest: page.items[0]?.added_at ?? null };
  }

  /**
   * URIs of the user's Liked Songs, newest-first, up to `limit` — used by the player to auto-start
   * favourites when nothing is playing. Pages in ≤50s only as far as `limit` requires.
   */
  async getLikedTrackUris(limit: number): Promise<string[]> {
    const base = environment.spotify.apiBaseUrl;
    let url: string | null = `${base}/me/tracks?limit=${Math.min(PAGE_SIZE, limit)}`;
    const uris: string[] = [];
    while (url !== null && uris.length < limit) {
      const next: string = url;
      const page: SpotifySavedTracksDto = await withRetry(() =>
        firstValueFrom(this.http.get<SpotifySavedTracksDto>(next)),
      );
      for (const item of page.items) {
        uris.push(item.track.uri);
      }
      url = page.next;
    }
    return uris.slice(0, limit);
  }

  /** The current user's profile — only the id is used (to decide playlist ownership). */
  async getMe(): Promise<SpotifyMeDto> {
    const base = environment.spotify.apiBaseUrl;
    return await firstValueFrom(this.http.get<SpotifyMeDto>(`${base}/me`));
  }

  // --- M7: playback read ---

  /** Current playback state, or `null` when no device is active (Spotify replies 204). */
  async getPlaybackState(): Promise<SpotifyPlaybackStateDto | null> {
    const base = environment.spotify.apiBaseUrl;
    return await firstValueFrom(this.http.get<SpotifyPlaybackStateDto | null>(`${base}/me/player`));
  }

  /** Targetable Spotify Connect devices (restricted ones with no id are dropped). */
  async getDevices(): Promise<{ id: string; isActive: boolean }[]> {
    const base = environment.spotify.apiBaseUrl;
    const dto = await firstValueFrom(this.http.get<SpotifyDevicesDto>(`${base}/me/player/devices`));
    return dto.devices
      .filter((device): device is typeof device & { id: string } => device.id !== null)
      .map((device) => ({ id: device.id, isActive: device.is_active }));
  }

  // --- M7: transport controls ---

  /**
   * Resume or start playback. With no options, resumes the active device; pass `uris` to start a
   * specific set of tracks and `deviceId` to target / wake a specific device.
   */
  async play(options: { uris?: string[]; deviceId?: string } = {}): Promise<void> {
    const base = environment.spotify.apiBaseUrl;
    const query = options.deviceId ? `?device_id=${options.deviceId}` : '';
    const body = options.uris ? { uris: options.uris } : {};
    await firstValueFrom(this.http.put(`${base}/me/player/play${query}`, body));
  }

  /** Pause playback on the active device. */
  async pause(): Promise<void> {
    await firstValueFrom(this.http.put(`${environment.spotify.apiBaseUrl}/me/player/pause`, {}));
  }

  /** Skip to the next track. */
  async next(): Promise<void> {
    await firstValueFrom(this.http.post(`${environment.spotify.apiBaseUrl}/me/player/next`, {}));
  }

  /** Skip to the previous track. */
  async previous(): Promise<void> {
    await firstValueFrom(this.http.post(`${environment.spotify.apiBaseUrl}/me/player/previous`, {}));
  }

  /** Toggle shuffle on the active device. */
  async setShuffle(state: boolean): Promise<void> {
    const base = environment.spotify.apiBaseUrl;
    await firstValueFrom(this.http.put(`${base}/me/player/shuffle?state=${state}`, {}));
  }

  /** Make a device the active one, optionally starting playback on it. */
  async transferPlayback(deviceId: string, play: boolean): Promise<void> {
    const base = environment.spotify.apiBaseUrl;
    await firstValueFrom(this.http.put(`${base}/me/player`, { device_ids: [deviceId], play }));
  }

  // --- M7: Liked Songs (❤) ---

  /** Whether each of the given track ids is in the user's Liked Songs (`user-library-read`). */
  async areTracksSaved(ids: string[]): Promise<boolean[]> {
    return this.libraryContains(ids.map(trackUri));
  }

  /** Add tracks to Liked Songs. */
  async saveTracks(ids: string[]): Promise<void> {
    await this.saveToLibrary(ids.map(trackUri));
  }

  /** Remove tracks from Liked Songs. */
  async removeSavedTracks(ids: string[]): Promise<void> {
    await this.removeFromLibrary(ids.map(trackUri));
  }

  /**
   * Save the given Spotify URIs to the user's library. The Feb 2026 Dev Mode migration replaced the
   * entity-specific save/follow endpoints with one generic `PUT /me/library` keyed by URI.
   */
  private async saveToLibrary(uris: string[]): Promise<void> {
    const base = environment.spotify.apiBaseUrl;
    for (const batch of chunk(uris, ID_BATCH)) {
      await withRetry(() => firstValueFrom(this.http.put(`${base}/me/library`, { uris: batch })));
    }
  }

  /** Remove the given Spotify URIs from the user's library (the `DELETE /me/library` counterpart). */
  private async removeFromLibrary(uris: string[]): Promise<void> {
    const base = environment.spotify.apiBaseUrl;
    for (const batch of chunk(uris, ID_BATCH)) {
      await withRetry(() =>
        firstValueFrom(this.http.delete(`${base}/me/library`, { body: { uris: batch } })),
      );
    }
  }

  /**
   * Whether each given URI is in the user's library, order preserved — the `GET /me/library/contains`
   * replacement. The response shape isn't documented in the migration guide; we assume an ordered
   * boolean array and validate it so a changed response fails loud here rather than silently corrupting
   * "is it saved?" downstream.
   */
  private async libraryContains(uris: string[]): Promise<boolean[]> {
    const base = environment.spotify.apiBaseUrl;
    const out: boolean[] = [];
    for (const batch of chunk(uris, ID_BATCH)) {
      const url = `${base}/me/library/contains?uris=${batch.join(',')}`;
      const flags = await withRetry(() => firstValueFrom(this.http.get<unknown>(url)));
      if (
        !Array.isArray(flags) ||
        flags.length !== batch.length ||
        flags.some((f) => typeof f !== 'boolean')
      ) {
        throw new Error(`Unexpected /me/library/contains response shape: ${JSON.stringify(flags)}`);
      }
      out.push(...(flags as boolean[]));
    }
    return out;
  }

  // --- M7: playlists ---

  /** The user's playlists, following the `next` cursor. */
  async getMyPlaylists(): Promise<Playlist[]> {
    const base = environment.spotify.apiBaseUrl;
    let url: string | null = `${base}/me/playlists?limit=${PAGE_SIZE}`;
    const playlists: Playlist[] = [];
    while (url !== null) {
      const next: string = url;
      const page = await withRetry(() => firstValueFrom(this.http.get<SpotifyPlaylistsDto>(next)));
      playlists.push(...toPlaylists(page));
      url = page.next;
    }
    return playlists;
  }

  /**
   * Append track URIs to a playlist (batched ≤100). Endpoint uses the migrated `…/items` path. Gains a
   * `position` parameter in M10 for the relink substitution (drop the new copy where the old one sat).
   */
  async addTracksToPlaylist(playlistId: string, uris: string[]): Promise<void> {
    const base = environment.spotify.apiBaseUrl;
    for (const batch of chunk(uris, URI_BATCH)) {
      await withRetry(() =>
        firstValueFrom(this.http.post(`${base}/playlists/${playlistId}/items`, { uris: batch })),
      );
    }
  }

  // --- M8: flight lookups (artist photo + queue peek) ---

  /**
   * Full artist object — used for the artist photo that rides the flight plane. Public data: needs
   * only a valid token. (The `genres` tags on the same payload drive the M9 genre filter.)
   */
  async getArtist(id: string): Promise<SpotifyArtistDto> {
    const base = environment.spotify.apiBaseUrl;
    return await firstValueFrom(this.http.get<SpotifyArtistDto>(`${base}/artists/${id}`));
  }

  /**
   * Primary artist of the next item in the playback queue, or null when the queue is empty or the
   * next item is a non-track (e.g. a podcast episode with no artists). Lets the flight store
   * pre-resolve the upcoming destination so the plane can launch the instant the track changes.
   */
  async getNextQueuedArtist(): Promise<ArtistRef | null> {
    const base = environment.spotify.apiBaseUrl;
    const dto = await firstValueFrom(this.http.get<SpotifyQueueDto>(`${base}/me/player/queue`));
    const next = dto.queue[0];
    if (next === undefined || !('artists' in next)) {
      return null;
    }
    const artist = next.artists[0];
    return artist === undefined ? null : { id: artist.id, name: artist.name };
  }

  // --- M9: genres, playlist items, follow state ---

  /**
   * Genre tags per artist for the given ids, order preserved. A resolved artist yields its tags (an
   * empty list when it genuinely has none — a *final* answer); a **fetch that fails** (persistent
   * 429/5xx/network) yields `null` so the caller can tell "confirmed no genres" apart from "not
   * fetched yet" and retry the latter. The Feb 2026 Dev Mode migration removed the bulk
   * `GET /artists?ids=`, so each artist is fetched individually, `FETCH_CONCURRENCY` at a time.
   * `onProgress` (optional) reports the running completed-count.
   */
  async getArtistGenres(
    ids: string[],
    onProgress?: (completed: number, total: number) => void,
  ): Promise<(string[] | null)[]> {
    return mapWithConcurrency(
      ids,
      (id) =>
        withRetry(() => this.getArtist(id))
          .then((artist) => artist.genres ?? [])
          .catch((): string[] | null => null),
      FETCH_CONCURRENCY,
      onProgress,
    );
  }

  /**
   * The catalog tracks on a playlist, following the `next` cursor. Trimmed via a `fields` mask; the
   * shared Spotify gate paces the membership index's pass over every playlist the user has.
   */
  async getPlaylistTrackRefs(playlistId: string): Promise<PlaylistTrackRef[]> {
    const base = environment.spotify.apiBaseUrl;
    let url: string | null =
      `${base}/playlists/${playlistId}/items?limit=${PLAYLIST_PAGE_SIZE}` +
      `&fields=${PLAYLIST_ITEM_FIELDS}`;
    const refs: PlaylistTrackRef[] = [];
    while (url !== null) {
      const next: string = url;
      const page: SpotifyPlaylistTracksDto = await withRetry(() =>
        firstValueFrom(this.http.get<SpotifyPlaylistTracksDto>(next)),
      );
      refs.push(...toPlaylistTrackRefs(page));
      url = page.next;
    }
    return refs;
  }

  /** Whether each given artist id is currently followed (order preserved). */
  async getFollowedArtistsContains(ids: string[]): Promise<boolean[]> {
    return this.libraryContains(ids.map(artistUri));
  }
}
```

### `src/app/features/globe/globe-store.ts` *(modified — genre worker, temporal pass, filters, artist-info sweeps)*
```ts
import { computed, inject, Injectable, signal } from '@angular/core';

import { RateLimiters } from '../../core/api/rate-limiters';
import { SpotifyApi } from '../../core/api/spotify-api';
import { OriginsCache } from '../../core/cache/origins-cache';
import { LogStore } from '../../core/logging/log-store';
import { ArtistRef } from '../../core/models/artist';
import { ArtistOrigin } from '../../core/models/artist-origin';
import { OriginsSnapshot } from '../../core/models/origins-snapshot';
import { ArtistResolution } from '../../core/pipeline/artist-resolution';
import { LikedIndex } from '../../core/pipeline/liked-index';
import { PlaylistIndex } from '../../core/pipeline/playlist-index';
import { delay } from '../../core/util/delay';
import { Toast } from '../../shared/toast';

const SAVE_DEBOUNCE_MS = 500;
const WORKER_IDLE_MS = 120;
/**
 * Min gap between globe repaints while a scan streams. The fast worker resolves 50 artists per
 * Wikidata round-trip with no throttle, so it would otherwise snapshot the working set into the
 * signal (and recompute every aggregate + repaint the canvas) dozens of times a second. Coalescing
 * to ~5 paints/s keeps progress visible without the recompute storm; the final state is flushed
 * explicitly when the scan ends.
 */
const PUBLISH_THROTTLE_MS = 200;
/** Artists resolved per fast Wikidata request — bounds query URL size and server-side cost. */
const RESOLVE_BATCH_SIZE = 50;

/** Kept for the (now unused) scan experience; the Liked-Songs source stays on 'globe'. */
export type GlobePhase = 'scanning' | 'placing' | 'globe';

/** Which metric the globe heat encodes. Guide extension (M6, D8) — the source only uses 'tracks'. */
export type HeatMode = 'tracks' | 'hours';

/**
 * Owns the **Liked Songs → country** dataset for the globe. Pages `/me/tracks` newest-first,
 * dedupes artists with a real per-artist liked-track count + Σ runtime, and resolves countries via
 * Wikidata-by-Spotify-id (with a MusicBrainz-by-name fallback), recolouring live. A background genre
 * worker enriches placed artists with Spotify genre tags during the scan; the heat is filterable by
 * genre, release decade, and an as-of month (the last two swap in a per-track aggregation pass). The
 * heat metric switches between liked-track count and rounded listening hours (M6, D8); manual country
 * fixups are sticky. Persists the whole dataset so a reload restores instantly.
 */
@Injectable({ providedIn: 'root' })
export class GlobeStore {
  private readonly spotify = inject(SpotifyApi);
  private readonly resolution = inject(ArtistResolution);
  private readonly cache = inject(OriginsCache);
  private readonly likedIndex = inject(LikedIndex);
  private readonly playlistIndex = inject(PlaylistIndex);
  private readonly toast = inject(Toast);
  private readonly log = inject(LogStore);
  private readonly limits = inject(RateLimiters);

  /** Mutable working set; snapshotted into the signal on publish() to bound signal churn. */
  private working = new Map<string, ArtistOrigin>();
  /** artistId → manually assigned country, sticky across reloads. */
  private readonly manualOverrides = new Map<string, string>();
  /** artistId → country auto-resolved by a previous scan, reused by a full rescan to skip re-resolving. */
  private reuseOrigins = new Map<string, string>();
  /** artistId → genre tags from a previous scan, reused by a full rescan to skip re-fetching `/artists/{id}`. */
  private reuseGenres = new Map<string, string[]>();
  private readonly fastQueue: string[] = [];
  private readonly fastQueued = new Set<string>();
  private readonly slowQueue: string[] = [];
  private readonly slowQueued = new Set<string>();
  /** Placed artists awaiting genre enrichment — drained by the genre worker *during* the scan. */
  private readonly genreQueue: string[] = [];
  private readonly genreQueued = new Set<string>();
  private fastDone = false;
  private slowDone = false;
  /** True while pages are still streaming in, so the fast worker idle-waits instead of exiting. */
  private streaming = false;
  private saveTimer?: ReturnType<typeof setTimeout>;
  /** Set once a snapshot save is rejected (e.g. quota), to avoid re-toasting on every debounce. */
  private saveFailed = false;
  private publishTimer?: ReturnType<typeof setTimeout>;

  private readonly _artists = signal<ReadonlyMap<string, ArtistOrigin>>(new Map());
  private readonly _computedAt = signal<number | null>(null);
  private readonly _oldest = signal<string | null>(null);
  private readonly _newest = signal<string | null>(null);
  private readonly _phase = signal<GlobePhase>('globe');
  private readonly _resolving = signal(false);

  readonly artists = computed(() => [...this._artists().values()]);
  readonly total = computed(() => this._artists().size);
  readonly resolvedCount = computed(
    () => this.artists().filter((a) => a.countryCode !== null).length,
  );
  readonly failedCount = computed(() => this.artists().filter((a) => a.failed).length);
  readonly pendingCount = computed(() => this.artists().filter((a) => !a.tried).length);
  readonly phase = this._phase.asReadonly();
  readonly isResolving = this._resolving.asReadonly();
  readonly hasData = computed(() => this.total() > 0);
  readonly computedAt = this._computedAt.asReadonly();
  /** Oldest / newest liked-song dates spanned by the dataset — surfaced in the Actions HUD. */
  readonly dateRange = computed(() => ({ oldest: this._oldest(), newest: this._newest() }));

  /** Resolved artists where the country couldn't be found — candidates for manual fixup. */
  readonly unplaced = computed(() =>
    this.artists()
      .filter((a) => a.failed && !a.hidden)
      .sort((a, b) => b.trackCount - a.trackCount),
  );

  /** Active genre tag the heat is filtered to, or null = all genres. */
  private readonly _genreFilter = signal<string | null>(null);
  readonly genreFilter = this._genreFilter.asReadonly();

  /**
   * Timeline scrubber cursor: `'YYYY-MM'` upper bound on liked-track `added_at`, or null = live
   * (whole library). When set, the heat replays how the map filled in *up to and including* that
   * month, so dragging it animates the globe colouring on.
   */
  private readonly _asOfMonth = signal<string | null>(null);
  readonly asOfMonth = this._asOfMonth.asReadonly();

  /**
   * Release-era filter: the set of decade-start years (e.g. 1990, 2000) the heat is restricted to by
   * *track release date*, or null = all eras. Recolours the globe by *when* the music was made.
   */
  private readonly _eraDecades = signal<ReadonlySet<number> | null>(null);
  readonly eraDecades = this._eraDecades.asReadonly();

  /** Whether any temporal filter is engaged — switches the aggregates to the per-track pass. */
  private readonly temporalActive = computed(
    () => this._asOfMonth() !== null || this._eraDecades() !== null,
  );

  /**
   * The single source of the three per-country aggregates, so every filter applies everywhere at
   * once (globe heat, legend, leaderboards, hover card). With no temporal filter this sums each
   * placed artist's lifetime totals (fast artist-level pass), narrowed by any genre filter. When a
   * timeline or release-era filter is active it defers to the {@link perTrackAggregates} pass, which
   * needs the individual liked tracks' `added_at` / `releaseDate` — the artist-level totals can't be
   * split by time. The two passes agree exactly when no temporal filter is set.
   */
  private readonly aggregates = computed<{
    tracks: Map<string, number>;
    duration: Map<string, number>;
    artists: Map<string, ArtistOrigin[]>;
  }>(() => {
    if (this.temporalActive()) {
      return this.perTrackAggregates();
    }
    const genre = this._genreFilter();
    const artists = this._artists();
    const tracks = new Map<string, number>();
    const duration = new Map<string, number>();
    const byCountry = new Map<string, ArtistOrigin[]>();

    const passesGenre = (artist: ArtistOrigin): boolean =>
      genre === null || (artist.genres ?? []).includes(genre);

    for (const artist of artists.values()) {
      if (artist.countryCode === null || !passesGenre(artist)) {
        continue;
      }
      addTo(tracks, artist.countryCode, artist.trackCount);
      addTo(duration, artist.countryCode, artist.durationMs);
      pushTo(byCountry, artist.countryCode, artist);
    }

    for (const list of byCountry.values()) {
      list.sort((a, b) => b.trackCount - a.trackCount);
    }
    return { tracks, duration, artists: byCountry };
  });

  /**
   * Per-track aggregation used whenever a temporal filter is active. Walks the persisted liked-track
   * index, attributing each track to its **primary** artist's resolved country (Spotify lists the
   * main artist first — same rule the scan uses), then applies the genre, `added_at`-month, and
   * release-decade filters before summing. Per-artist track counts / durations are recomputed from
   * the surviving tracks so the hover card and leaderboards match the filtered heat.
   */
  private readonly perTrackAggregates = computed<{
    tracks: Map<string, number>;
    duration: Map<string, number>;
    artists: Map<string, ArtistOrigin[]>;
  }>(() => {
    this.likedIndex.revision(); // recompute as the index changes
    const artists = this._artists();
    const genre = this._genreFilter();
    const asOf = this._asOfMonth();
    const decades = this._eraDecades();

    const tracks = new Map<string, number>();
    const duration = new Map<string, number>();
    // artistId → the artist plus its filtered running totals, so the lists show the narrowed counts.
    const perArtist = new Map<string, { artist: ArtistOrigin; count: number; duration: number }>();

    for (const track of this.likedIndex.all()) {
      const primaryId = track.artistIds[0];
      if (primaryId === undefined) {
        continue;
      }
      const artist = artists.get(primaryId);
      if (artist === undefined || artist.countryCode === null) {
        continue;
      }
      if (genre !== null && !(artist.genres ?? []).includes(genre)) {
        continue;
      }
      if (asOf !== null && track.addedAt.slice(0, 7) > asOf) {
        continue;
      }
      if (decades !== null) {
        const year = releaseYear(track.releaseDate);
        if (year === null || !decades.has(Math.floor(year / 10) * 10)) {
          continue;
        }
      }
      addTo(tracks, artist.countryCode, 1);
      addTo(duration, artist.countryCode, track.durationMs);
      const entry = perArtist.get(primaryId);
      if (entry === undefined) {
        perArtist.set(primaryId, { artist, count: 1, duration: track.durationMs });
      } else {
        entry.count += 1;
        entry.duration += track.durationMs;
      }
    }

    const byCountry = new Map<string, ArtistOrigin[]>();
    for (const { artist, count, duration: d } of perArtist.values()) {
      // Shallow clone carrying the filtered totals so hover/leaderboards agree with the heat.
      pushTo(byCountry, artist.countryCode as string, {
        ...artist,
        trackCount: count,
        durationMs: d,
      });
    }
    for (const list of byCountry.values()) {
      list.sort((a, b) => b.trackCount - a.trackCount);
    }
    return { tracks, duration, artists: byCountry };
  });

  /** Resolved artists grouped by country (ISO alpha-2), each list sorted by trackCount desc. */
  readonly artistsByCountry = computed(() => this.aggregates().artists);

  /** Σ liked-track count per country — the 'tracks' heat metric and the tracks leaderboard. */
  readonly tracksByCountry = computed(() => this.aggregates().tracks);

  /** Σ liked-track runtime (ms) per country — the 'hours' heat metric and the listening-hours stat. */
  readonly durationByCountry = computed(() => this.aggregates().duration);

  /**
   * Which metric colours the globe. Guide extension (M6, D8): the source hard-codes `heat =
   * tracksByCountry`. Both underlying maps are filter-aware (they come from {@link aggregates}), so
   * the genre / era / timeline filters apply in either mode.
   */
  private readonly _heatMode = signal<HeatMode>('tracks');
  readonly heatMode = this._heatMode.asReadonly();

  /** Heat per country (ISO alpha-2 → weight): liked-track count in 'tracks' mode, Σ ms in 'hours'. */
  readonly heat = computed(() =>
    this._heatMode() === 'hours' ? this.durationByCountry() : this.tracksByCountry(),
  );

  /** Set the heat metric (recolours the globe). */
  setHeatMode(mode: HeatMode): void {
    this._heatMode.set(mode);
  }

  /** Flip tracks ↔ hours. */
  toggleHeatMode(): void {
    this._heatMode.update((mode) => (mode === 'tracks' ? 'hours' : 'tracks'));
  }

  /**
   * Genre tags present across placed artists, most-common first, for the genre-filter picker.
   * Only artists with a resolved country count, since those are the ones that colour the globe.
   */
  readonly availableGenres = computed(() => {
    const counts = new Map<string, number>();
    for (const artist of this._artists().values()) {
      if (artist.countryCode === null) {
        continue;
      }
      for (const genre of artist.genres ?? []) {
        counts.set(genre, (counts.get(genre) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([genre, count]) => ({ genre, count }));
  });

  /**
   * Distinct `'YYYY-MM'` months in which the user liked a track by a *placed* artist, oldest-first —
   * the discrete steps the timeline scrubber slides across. Only placed artists count, since they're
   * the ones that colour the globe as the map fills in.
   */
  readonly timelineMonths = computed(() => {
    this.likedIndex.revision();
    const artists = this._artists();
    const months = new Set<string>();
    for (const track of this.likedIndex.all()) {
      const primaryId = track.artistIds[0];
      if (primaryId === undefined) {
        continue;
      }
      const artist = artists.get(primaryId);
      if (artist === undefined || artist.countryCode === null) {
        continue;
      }
      months.add(track.addedAt.slice(0, 7));
    }
    return [...months].sort();
  });

  /**
   * Release decades present across placed artists' liked tracks (decade-start year + track count),
   * oldest-first — the chips for the release-era filter. Tracks with an unparseable release date are
   * skipped.
   */
  readonly availableDecades = computed(() => {
    this.likedIndex.revision();
    const artists = this._artists();
    const counts = new Map<number, number>();
    for (const track of this.likedIndex.all()) {
      const primaryId = track.artistIds[0];
      if (primaryId === undefined) {
        continue;
      }
      const artist = artists.get(primaryId);
      if (artist === undefined || artist.countryCode === null) {
        continue;
      }
      const year = releaseYear(track.releaseDate);
      if (year === null) {
        continue;
      }
      const decade = Math.floor(year / 10) * 10;
      counts.set(decade, (counts.get(decade) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([decade, count]) => ({ decade, count }));
  });

  /** Restrict the heat to a single genre tag; null clears it. */
  setGenre(genre: string | null): void {
    this._genreFilter.set(genre);
  }

  /** Replay the map's fill-in up to this `'YYYY-MM'` (inclusive); null returns to the live view. */
  setAsOfMonth(month: string | null): void {
    this._asOfMonth.set(month);
  }

  /** Restrict the heat to tracks released in these decades (decade-start years); null/empty clears it. */
  setEraDecades(decades: ReadonlySet<number> | null): void {
    this._eraDecades.set(decades === null || decades.size === 0 ? null : decades);
  }

  /** The busiest country's value — the hot end of the legend's scale. */
  readonly maxHeat = computed(() => {
    let max = 0;
    for (const weight of this.heat().values()) {
      if (weight > max) {
        max = weight;
      }
    }
    return max;
  });

  /** Resolved ISO alpha-2 for a Spotify artist id from the current dataset, else null. */
  countryOf(artistId: string): string | null {
    return this._artists().get(artistId)?.countryCode ?? null;
  }

  // The library-facing following/genres read + write helpers (followingOf, genresOf, setFollowing,
  // setGenres) land with the M10 library console. M9 only *populates* those fields (the sweeps below).
  // grows in M10

  /** Dismiss an artist from the "couldn't place" list (e.g. one that has no real country). */
  hideUnplaced(artistId: string): void {
    const artist = this.working.get(artistId);
    if (artist === undefined) {
      return;
    }
    artist.hidden = true;
    this.publish();
    this.saveDebounced();
  }

  /** Hydrate the saved dataset from localStorage straight into the globe view. No network. */
  restore(): void {
    const snapshot = this.cache.load();
    if (snapshot === null) {
      return;
    }
    this.working = new Map(snapshot.artists.map((artist) => [artist.id, { ...artist }]));
    for (const artist of this.working.values()) {
      if (artist.manual && artist.countryCode !== null) {
        this.manualOverrides.set(artist.id, artist.countryCode);
      }
    }
    this._computedAt.set(snapshot.computedAt);
    this._oldest.set(snapshot.oldest);
    this._newest.set(snapshot.newest);
    this.publish();
  }

  /**
   * Refresh the dataset. `fullRescan` (or having no data) re-pages the entire library and retries
   * every unresolved artist, while reusing countries + genres already resolved by a previous scan so
   * only new or previously-failed artists hit the network; otherwise an incremental pass fetches only
   * likes newer than the last scan. Runs in the background; `isResolving` reflects progress.
   */
  async recalculate(fullRescan = false): Promise<void> {
    if (this._resolving()) {
      return;
    }
    // Don't launch a scan into an open 429 cooldown (persisted, so it survives reloads): queueing
    // thousands of paced requests behind a multi-minute ban would just hang and re-trip it. Checked
    // across all hosts — a scan drives Spotify (paging) plus Wikidata + MusicBrainz (resolution).
    const waitMs = this.limits.maxRetryAfterMs();
    if (waitMs > 0) {
      const mins = Math.ceil(waitMs / 60_000);
      this.log.log(
        `A music data source is rate-limiting the app — try again in about ${mins} min.`,
        'error',
      );
      this.toast.error(`The app is being rate-limited. Please try again in about ${mins} min.`);
      return;
    }
    if (fullRescan || !this.hasData()) {
      await this.load();
    } else {
      await this.incremental();
    }
  }

  /**
   * Re-resolve only the artists whose country couldn't be found — no Spotify refetch. Runs in the
   * background; `isResolving` reflects progress.
   */
  async recheckUnplaced(): Promise<void> {
    if (this._resolving()) {
      return;
    }
    const failed = [...this.working.values()].filter((a) => a.failed && !a.manual);
    if (failed.length === 0) {
      return;
    }
    this.resetQueues();
    for (const artist of failed) {
      artist.tried = false;
      artist.failed = false;
      this.enqueueFast(artist.id);
    }
    this.publish();
    this.log.clear();
    this.log.log(`Rechecking ${failed.length} unplaced artists…`);

    this._resolving.set(true);
    try {
      await Promise.all([this.fastWorker(), this.slowWorker(), this.genreWorker()]);
      this._computedAt.set(Date.now());
      this.log.log(
        `Done — ${this.resolvedCount()} artists placed, ${this.failedCount()} still unplaced`,
        'success',
      );
    } catch {
      this.log.log('Could not recheck artists.', 'error');
      this.toast.error('Could not recheck artists. Please try again.');
    } finally {
      this._resolving.set(false);
      this.save();
    }
  }

  /**
   * Backfill artist metadata — Spotify genres + follow state — for placed artists still missing it.
   * Backs the boot sync's "artists" step and the Actions "Check for updates" for artists: cheap (zero
   * network) when nothing is missing. No-op while a scan is already running.
   */
  async syncArtistInfo(): Promise<void> {
    if (this._resolving()) {
      return;
    }
    this._resolving.set(true);
    try {
      await Promise.all([this.loadFollowing(), this.loadGenres()]);
    } finally {
      this._resolving.set(false);
      this.save();
    }
  }

  /**
   * Re-fetch genres + follow state for every placed artist from scratch — the Actions "Full re-scan"
   * for the artists domain — dropping the cached values first so they're all re-resolved.
   */
  async refreshArtistInfo(): Promise<void> {
    if (this._resolving()) {
      return;
    }
    for (const artist of this.working.values()) {
      if (artist.countryCode !== null) {
        artist.genres = undefined;
        artist.following = undefined;
      }
    }
    await this.syncArtistInfo();
  }

  /** Kept for the (now unused) scan experience's done callback. */
  showGlobe(): void {
    this._phase.set('globe');
  }

  /**
   * Manually assign a country to an artist; sticky across future runs. Works even for an artist not
   * yet in the globe dataset (e.g. opened from the library): a minimal entry is created so the choice
   * persists and shows up. `name` labels that new entry — ignored when the artist already exists.
   */
  setCountry(artistId: string, countryCode: string, name = ''): void {
    this.manualOverrides.set(artistId, countryCode);
    let artist = this.working.get(artistId);
    if (artist === undefined) {
      artist = {
        id: artistId,
        name,
        trackCount: 0,
        durationMs: 0,
        countryCode: null,
        tried: false,
        failed: false,
        manual: false,
      };
      this.working.set(artistId, artist);
    }
    artist.countryCode = countryCode;
    artist.manual = true;
    artist.tried = true;
    artist.failed = false;
    this.publish();
    this.save();
  }

  /** Wipe persisted + in-memory data (e.g. before a fresh run). */
  clearData(): void {
    this.cache.clear();
    this.likedIndex.clear();
    this.working = new Map();
    this.manualOverrides.clear();
    this.resetQueues();
    this._computedAt.set(null);
    this._oldest.set(null);
    this._newest.set(null);
    // Clear heat filters so a stale genre/era/timeline choice can't blank the next dataset's globe.
    this._genreFilter.set(null);
    this._eraDecades.set(null);
    this._asOfMonth.set(null);
    this.publish();
  }

  /** Full scan: re-page the whole library from scratch, then resolve every artist's country. */
  private async load(): Promise<void> {
    this.log.clear();
    this.log.log('Starting a full scan of your Liked Songs…');
    // Carry over auto-resolved countries from the previous scan so re-paging the library (to pick up
    // added/removed likes) doesn't re-resolve artists we already placed. Manual fixups ride along via
    // `manualOverrides`; previously-failed artists are left out so the rescan retries them.
    this.reuseOrigins = new Map(
      [...this.working.values()]
        .filter((a) => a.countryCode !== null && !a.manual)
        .map((a) => [a.id, a.countryCode as string]),
    );
    // Genre tags are a stable per-artist fact; carry them over so a full rescan doesn't re-hit
    // `GET /artists/{id}` (no bulk endpoint since the Feb 2026 migration) for every known artist.
    this.reuseGenres = new Map(
      [...this.working.values()]
        .filter((a) => a.genres !== undefined)
        .map((a) => [a.id, a.genres as string[]]),
    );
    this.working = new Map();
    this.resetQueues();
    this.likedIndex.beginFull();
    this._oldest.set(null);
    this._newest.set(null);
    this.publish();

    this._resolving.set(true);
    this.streaming = true;
    // Resolve countries + genres + paint the globe as pages stream in, rather than after the whole
    // library is paged — a full scan is long, so progress must be visible from the first page.
    const resolveAll = Promise.all([this.fastWorker(), this.slowWorker(), this.genreWorker()]);
    try {
      let oldest: string | null = null;
      let newest: string | null = null;
      let tracks = 0;
      for await (const page of this.spotify.streamLikedTracks()) {
        for (const track of page) {
          if (oldest === null || track.addedAt < oldest) {
            oldest = track.addedAt;
          }
          if (newest === null || track.addedAt > newest) {
            newest = track.addedAt;
          }
          this.likedIndex.add(track);
          // Only the primary (main) artist counts toward the globe; Spotify lists them first.
          const main = track.artists[0];
          if (main !== undefined) {
            this.accumulate(main, track.durationMs);
          }
        }
        tracks += page.length;
        // Commit the watermarks per page so a mid-stream failure still persists scan progress
        // (otherwise newest stays null and every later recalculate falls back to a full rescan).
        this._oldest.set(oldest);
        this._newest.set(newest);
        this.likedIndex.commit(newest);
        this.publishProgress();
        this.log.log(`Fetched ${tracks} liked songs · ${this.working.size} artists so far`);
      }
    } catch {
      this.log.log('Could not load your Liked Songs from Spotify.', 'error');
      this.toast.error('Could not load your Liked Songs from Spotify. Please try again.');
    } finally {
      // Signal the workers no more artists are coming, then let them drain what's queued.
      this.streaming = false;
      await resolveAll;
      this.publish(); // flush the final resolved state (clears any pending throttled paint)
      // Independent tail fetches (disjoint fields) — run together to halve the post-scan wait.
      await Promise.all([this.loadFollowing(), this.loadGenres()]);
      this._computedAt.set(Date.now());
      this.log.log(
        `Done — ${this.resolvedCount()} artists placed across ${this.heat().size} countries` +
          (this.failedCount() > 0 ? `, ${this.failedCount()} unplaced` : ''),
        'success',
      );
      this._resolving.set(false);
      this.reuseOrigins = new Map();
      this.reuseGenres = new Map();
      this.save();
      this.syncPlaylists();
    }
  }

  /** Incremental pass: page only likes newer than the last scan, then resolve the new artists. */
  private async incremental(): Promise<void> {
    const since = this._newest();
    if (since === null) {
      await this.load();
      return;
    }
    this.resetQueues();
    this.likedIndex.beginIncremental();
    this.log.clear();
    this.log.log('Checking Spotify for new favourites…');

    this._resolving.set(true);
    this.streaming = true;
    // Resolve + paint as new likes stream in (see load()); workers idle until pages arrive.
    const resolveAll = Promise.all([this.fastWorker(), this.slowWorker(), this.genreWorker()]);
    try {
      let newest = since;
      let added = 0;
      pages: for await (const page of this.spotify.streamLikedTracks()) {
        for (const track of page) {
          // Newest-first: once we reach the last scan's frontier, everything older is known.
          if (track.addedAt <= since) {
            break pages;
          }
          if (track.addedAt > newest) {
            newest = track.addedAt;
          }
          this.likedIndex.add(track);
          added += 1;
          // Only the primary (main) artist counts toward the globe; Spotify lists them first.
          const main = track.artists[0];
          if (main !== undefined) {
            this.accumulate(main, track.durationMs);
          }
        }
        // Advance the watermark per page so a mid-stream failure keeps the progress made so far.
        this._newest.set(newest);
        this.likedIndex.commit(newest);
        this.publishProgress();
        this.log.log(`Found ${added} new liked songs so far`);
      }
      // Covers the case where the frontier is reached on the first page (no per-page set ran).
      this._newest.set(newest);
      this.likedIndex.commit(newest);
      this.log.log(
        added === 0 ? 'No new liked songs since the last scan.' : `${added} new liked songs`,
      );
      // Retry previously-unresolved artists alongside any newly discovered ones. Done while still
      // streaming=true so the workers can't drain-and-exit before these are enqueued.
      let retried = 0;
      for (const artist of this.working.values()) {
        if (artist.failed && !artist.manual) {
          artist.tried = false;
          artist.failed = false;
          this.enqueueFast(artist.id);
          retried += 1;
        }
      }
      if (retried > 0) {
        this.log.log(`Retrying ${retried} previously unplaced artists`);
      }
      this.publishProgress();
    } catch {
      this.log.log('Could not fetch new favourites.', 'error');
      this.toast.error('Could not fetch new favourites. Please try again.');
    } finally {
      this.streaming = false;
      await resolveAll;
      this.publish(); // flush the final resolved state (clears any pending throttled paint)
      // Independent tail fetches (disjoint fields) — run together to halve the post-scan wait.
      await Promise.all([this.loadFollowing(), this.loadGenres()]);
      this._computedAt.set(Date.now());
      this.log.log(
        `Done — ${this.resolvedCount()} artists placed across ${this.heat().size} countries` +
          (this.failedCount() > 0 ? `, ${this.failedCount()} unplaced` : ''),
        'success',
      );
      this._resolving.set(false);
      this.save();
      this.syncPlaylists();
    }
  }

  /**
   * Keep the playlist-membership index fresh alongside the favourites scan, so the library tools
   * reflect playlist changes without a separate manual refresh. Runs after country resolution as a
   * background ride-along: it drives its own progress UI and never blocks or breaks the scan (the
   * favourites scan surfaces its own errors; a sync failure just leaves the last good index).
   */
  private syncPlaylists(): void {
    void this.playlistIndex.sync().catch(() => undefined);
  }

  /**
   * Bulk-resolve Spotify "is following" for every artist whose state is still unknown, then persist
   * it on the dataset. Run at the tail of each scan so the library list (M10) reads it straight from
   * cache. Non-fatal: on error (e.g. a token issued before the `user-follow-read` scope) the state
   * stays unknown and a later scan retries, so it never breaks the country scan it rides along with.
   */
  private async loadFollowing(): Promise<void> {
    const ids = [...this.working.values()]
      .filter((artist) => artist.following === undefined)
      .map((artist) => artist.id);
    if (ids.length === 0) {
      return;
    }
    try {
      const flags = await this.spotify.getFollowedArtistsContains(ids);
      ids.forEach((id, i) => {
        const artist = this.working.get(id);
        if (artist !== undefined) {
          artist.following = flags[i] ?? false;
        }
      });
      this.publish();
      this.log.log(`Loaded follow status for ${ids.length} artists`);
    } catch {
      // Leave following unknown — a later scan retries it.
    }
  }

  /**
   * Tail genre sweep for any placed artist still missing tags once the scan ends. The {@link
   * genreWorker} enriches artists live as they're placed, so this normally finds nothing — it only
   * mops up stragglers that never passed through the country workers (manual fixups, or a pre-genre
   * dataset being backfilled). Only placed artists are fetched, since unplaced ones never colour the
   * globe. Non-fatal: on error the tags stay unknown and a later scan retries.
   */
  private async loadGenres(): Promise<void> {
    const ids = [...this.working.values()]
      .filter((artist) => artist.genres === undefined && artist.countryCode !== null)
      .map((artist) => artist.id);
    if (ids.length === 0) {
      return;
    }
    try {
      this.log.log(`Fetching genres for ${ids.length} remaining artists…`);
      const genres = await this.spotify.getArtistGenres(ids, (done, total) => {
        if (done % RESOLVE_BATCH_SIZE === 0 && done !== total) {
          this.log.log(`Genres: ${done} / ${total} artists`);
        }
      });
      ids.forEach((id, i) => {
        const artist = this.working.get(id);
        const fetched = genres[i];
        // null/undefined = the per-artist fetch failed; leave genres undefined so a later sweep
        // retries it rather than persisting a transient failure as a permanent empty result.
        if (artist !== undefined && fetched != null) {
          artist.genres = fetched;
        }
      });
      this.publish();
      this.log.log(`Loaded genres for ${ids.length} artists`, 'success');
    } catch {
      // Leave genres unknown — a later scan retries them.
    }
  }

  /** Fast pass: drains the fast queue in batches via Wikidata-by-Spotify-id; misses → slow queue. */
  private async fastWorker(): Promise<void> {
    for (;;) {
      const batch = this.fastQueue.splice(0, RESOLVE_BATCH_SIZE);
      if (batch.length === 0) {
        // Empty queue: keep waiting while pages are still arriving; only stop once paging is done.
        if (this.streaming) {
          await delay(WORKER_IDLE_MS);
          continue;
        }
        break;
      }
      const results = await this.resolution.resolveBatchBySpotifyId(batch);
      let placed = 0;
      for (const id of batch) {
        const artist = this.working.get(id);
        if (artist === undefined || artist.manual || artist.tried) {
          continue;
        }
        const code = results.get(id) ?? null;
        if (code !== null) {
          artist.countryCode = code;
          artist.tried = true;
          artist.failed = false;
          placed += 1;
          this.enqueueGenre(id);
        } else {
          this.enqueueSlow(id);
        }
      }
      this.publishProgress();
      this.saveDebounced();
      this.log.log(
        `Wikidata: placed ${placed} of ${batch.length} artists`,
        placed > 0 ? 'success' : 'info',
      );
    }
    this.fastDone = true;
  }

  /** Slow pass: per-artist MusicBrainz fallback for the fast-pass misses. */
  private async slowWorker(): Promise<void> {
    for (;;) {
      const id = this.slowQueue.shift();
      if (id === undefined) {
        // Nothing queued: exit only once the fast pass is done feeding this queue; else idle-wait.
        if (this.fastDone) {
          break;
        }
        await delay(WORKER_IDLE_MS);
        continue;
      }
      const artist = this.working.get(id);
      if (artist === undefined || artist.manual || artist.tried) {
        continue;
      }
      const code = await this.resolution.resolveByName(artist.name);
      artist.tried = true;
      artist.countryCode = code;
      artist.failed = code === null;
      if (code !== null) {
        this.enqueueGenre(id);
      }
      this.publishProgress();
      this.saveDebounced();
      this.log.log(
        code !== null ? `MusicBrainz: ${artist.name} → ${code}` : `Couldn't place ${artist.name}`,
        code !== null ? 'success' : 'warn',
      );
    }
    this.slowDone = true;
  }

  /**
   * Genre pass: runs *alongside* the country workers, draining artists queued the moment they're
   * placed and fetching their Spotify genre tags in batches (each batch fans out per-artist, since
   * the Feb 2026 migration removed the bulk `/artists?ids=`). Overlapping the genre fetch with the
   * rate-limited paging spreads those per-artist calls across the whole scan — gentler on Spotify's
   * limit than bursting them at the end, and it hides the wait behind paging. Idles while more
   * artists may still arrive (streaming, or the country workers aren't finished); exits once both are
   * done and the queue is empty. Non-fatal: {@link SpotifyApi.getArtistGenres} swallows per-id
   * errors, so it never rejects the scan.
   */
  private async genreWorker(): Promise<void> {
    for (;;) {
      const batch = this.genreQueue.splice(0, RESOLVE_BATCH_SIZE);
      if (batch.length === 0) {
        if (this.streaming || !this.fastDone || !this.slowDone) {
          await delay(WORKER_IDLE_MS);
          continue;
        }
        break;
      }
      const genres = await this.spotify.getArtistGenres(batch);
      batch.forEach((id, i) => {
        const artist = this.working.get(id);
        const fetched = genres[i];
        // Leave genres undefined on a failed fetch (null/undefined) so the tail sweep retries it,
        // instead of persisting a transient blip as a permanent "no genres".
        if (artist !== undefined && fetched != null) {
          artist.genres = fetched;
        }
      });
      this.publishProgress();
      this.saveDebounced();
      this.log.log(`Genres: fetched ${batch.length} artists`);
    }
  }

  /** Count one liked-track appearance for an artist (new or existing), summing its runtime. */
  private accumulate(ref: ArtistRef, durationMs: number): void {
    const existing = this.working.get(ref.id);
    if (existing !== undefined) {
      existing.trackCount += 1;
      existing.durationMs += durationMs;
      return;
    }
    const manual = this.manualOverrides.get(ref.id) ?? null;
    // A manual fixup wins; otherwise reuse a country resolved by a previous scan (full-rescan only).
    const known = manual ?? this.reuseOrigins.get(ref.id) ?? null;
    this.working.set(ref.id, {
      id: ref.id,
      name: ref.name,
      trackCount: 1,
      durationMs,
      countryCode: known,
      tried: known !== null,
      failed: false,
      manual: manual !== null,
      // Reuse genres from a previous scan (full-rescan only) so loadGenres() skips re-fetching them.
      genres: this.reuseGenres.get(ref.id),
    });
    if (known === null) {
      this.enqueueFast(ref.id);
    }
  }

  private enqueueFast(id: string): void {
    if (!this.fastQueued.has(id)) {
      this.fastQueued.add(id);
      this.fastQueue.push(id);
    }
  }

  private enqueueSlow(id: string): void {
    if (!this.slowQueued.has(id)) {
      this.slowQueued.add(id);
      this.slowQueue.push(id);
    }
  }

  /** Queue a just-placed artist for genre enrichment (skips ones whose genres are already known). */
  private enqueueGenre(id: string): void {
    if (this.working.get(id)?.genres !== undefined) {
      return;
    }
    if (!this.genreQueued.has(id)) {
      this.genreQueued.add(id);
      this.genreQueue.push(id);
    }
  }

  private resetQueues(): void {
    this.fastQueue.length = 0;
    this.slowQueue.length = 0;
    this.genreQueue.length = 0;
    this.fastQueued.clear();
    this.slowQueued.clear();
    this.genreQueued.clear();
    this.fastDone = false;
    this.slowDone = false;
    this.streaming = false;
  }

  private publish(): void {
    clearTimeout(this.publishTimer);
    this.publishTimer = undefined;
    this._artists.set(new Map(this.working));
  }

  /**
   * Publish a mid-scan progress update, coalesced to at most one paint per {@link PUBLISH_THROTTLE_MS}
   * while streaming (outside a scan it publishes immediately). The scan's finally block flushes the
   * final state with a direct {@link publish}, so a pending throttle never drops the last update.
   */
  private publishProgress(): void {
    if (!this.streaming) {
      this.publish();
      return;
    }
    if (this.publishTimer !== undefined) {
      return; // a paint is already scheduled — this update rides along with it
    }
    this.publishTimer = setTimeout(() => {
      this.publishTimer = undefined;
      this._artists.set(new Map(this.working));
    }, PUBLISH_THROTTLE_MS);
  }

  private snapshot(): OriginsSnapshot {
    return {
      version: 2,
      computedAt: this._computedAt() ?? Date.now(),
      oldest: this._oldest(),
      newest: this._newest(),
      artists: [...this.working.values()],
    };
  }

  private saveDebounced(): void {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.save(), SAVE_DEBOUNCE_MS);
  }

  private save(): void {
    clearTimeout(this.saveTimer);
    if (!this.cache.save(this.snapshot()) && !this.saveFailed) {
      // Warn once per session so a full localStorage doesn't spam a toast on every debounced save.
      this.saveFailed = true;
      this.toast.error('Could not save your globe data — browser storage may be full.');
    }
  }
}

/** Leading 4-digit year of a Spotify release date (`YYYY` | `YYYY-MM` | `YYYY-MM-DD`), else null. */
function releaseYear(releaseDate: string): number | null {
  const year = Number(releaseDate.slice(0, 4));
  return Number.isInteger(year) && year > 0 ? year : null;
}

/** Add `value` to a country's running total in `map` (initialising the entry at 0). */
function addTo(map: Map<string, number>, code: string, value: number): void {
  map.set(code, (map.get(code) ?? 0) + value);
}

/** Append an artist to its country's list in `map` (initialising the list). */
function pushTo(map: Map<string, ArtistOrigin[]>, code: string, artist: ArtistOrigin): void {
  const list = map.get(code);
  if (list === undefined) {
    map.set(code, [artist]);
  } else {
    list.push(artist);
  }
}
```

### `src/app/core/cache/view-prefs-cache.ts`
```ts
import { Injectable } from '@angular/core';

import { readJson, writeJson } from './storage-cache';

const STORAGE_KEY = 'evm.viewPrefs';

/** Which globe overlays the user has chosen to show. Persisted across reloads. */
export interface ViewPrefs {
  showStats: boolean;
  showLegend: boolean;
  /** The flight overlay (plane + route arc + country highlight + follow camera). */
  showFlight: boolean;
  showTripLog: boolean;
  showJourney: boolean;
  /** The heat-filter bar (genre picker + release-era chips). */
  showFilters: boolean;
  /** The timeline scrubber (replays the map's fill-in over time). */
  showTimeline: boolean;
}

const DEFAULTS: ViewPrefs = {
  showStats: true,
  showLegend: true,
  showFlight: true,
  showTripLog: true,
  showJourney: true,
  showFilters: true,
  showTimeline: true,
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

### `src/app/features/globe/genre-filter/genre-filter.ts`
```ts
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

/** One selectable genre tag plus how many placed artists carry it. */
export interface GenreOption {
  genre: string;
  count: number;
}

/**
 * Picker that filters the globe heat to a single genre tag (or "All genres"). Dumb: the page owns
 * the available genres and the current selection; this just emits the chosen genre (or null).
 */
@Component({
  selector: 'app-genre-filter',
  imports: [MatFormFieldModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './genre-filter.html',
  styleUrl: './genre-filter.scss',
})
export class GenreFilter {
  readonly genres = input<readonly GenreOption[]>([]);
  readonly selected = input<string | null>(null);
  readonly genreChange = output<string | null>();
}
```

### `src/app/features/globe/genre-filter/genre-filter.html`
```html
<mat-form-field appearance="outline" subscriptSizing="dynamic">
  <mat-label>Genre</mat-label>
  <mat-select
    [value]="selected()"
    (selectionChange)="genreChange.emit($event.value)"
    panelClass="genre-filter-panel"
  >
    <mat-option [value]="null">All genres</mat-option>
    @for (option of genres(); track option.genre) {
      <mat-option [value]="option.genre">{{ option.genre }} · {{ option.count }}</mat-option>
    }
  </mat-select>
</mat-form-field>
```

### `src/app/features/globe/genre-filter/genre-filter.scss`
```scss
:host {
  display: block;
}

mat-form-field {
  width: 11rem;
}
```

### `src/app/features/globe/era-filter/era-filter.ts`
```ts
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

/** One selectable release decade plus how many placed liked tracks fall in it. */
export interface DecadeOption {
  /** Decade-start year, e.g. 1990. */
  decade: number;
  count: number;
}

/**
 * Chips that filter the globe heat to one or more release decades — recolouring the map by *when*
 * the music was made. Dumb: the page owns the available decades and current selection; this emits
 * the new decade set (or null when nothing / "All" is chosen).
 */
@Component({
  selector: 'app-era-filter',
  imports: [MatChipsModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './era-filter.html',
  styleUrl: './era-filter.scss',
})
export class EraFilter {
  readonly decades = input<readonly DecadeOption[]>([]);
  readonly selected = input<ReadonlySet<number> | null>(null);
  readonly selectionChange = output<ReadonlySet<number> | null>();

  /** True when no decade is picked — the "All eras" chip is active and the heat spans every era. */
  protected readonly allActive = computed(() => {
    const set = this.selected();
    return set === null || set.size === 0;
  });

  protected isSelected(decade: number): boolean {
    return this.selected()?.has(decade) ?? false;
  }

  /** Toggle a decade in/out of the selection, emitting null once the last one is cleared. */
  protected toggle(decade: number): void {
    const next = new Set(this.selected() ?? []);
    if (next.has(decade)) {
      next.delete(decade);
    } else {
      next.add(decade);
    }
    this.selectionChange.emit(next.size === 0 ? null : next);
  }

  protected clear(): void {
    this.selectionChange.emit(null);
  }

  /** 1990 → "90s", 2000 → "00s" — the short chip label. */
  protected label(decade: number): string {
    return `${String(decade % 100).padStart(2, '0')}s`;
  }
}
```

### `src/app/features/globe/era-filter/era-filter.html`
```html
<mat-chip-listbox aria-label="Filter heat by release decade" multiple>
  <mat-chip-option [selected]="allActive()" (click)="clear()">All eras</mat-chip-option>
  @for (option of decades(); track option.decade) {
    <mat-chip-option
      [selected]="isSelected(option.decade)"
      (click)="toggle(option.decade)"
      [matTooltip]="option.count + ' tracks'"
    >
      {{ label(option.decade) }}
    </mat-chip-option>
  }
</mat-chip-listbox>
```

### `src/app/features/globe/era-filter/era-filter.scss`
```scss
:host {
  display: block;
}

mat-chip-listbox {
  // Keep the chip row tight so it sits cleanly beside the genre picker in the filters bar.
  --mdc-chip-container-height: 2rem;
}
```

### `src/app/features/globe/timeline-scrubber/timeline-scrubber.ts`
```ts
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** Milliseconds each month holds while the fill-in animation plays. */
const STEP_MS = 650;

/**
 * Bottom-centre control that replays how the globe filled in over time. Slides across the dataset's
 * liked-song months; the last stop is "Now" (the live, whole-library view). Dumb: it owns only the
 * cursor + play state and emits the chosen `'YYYY-MM'` (or null at "Now") for the page to feed the
 * store's as-of filter.
 */
@Component({
  selector: 'app-timeline-scrubber',
  imports: [MatSliderModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './timeline-scrubber.html',
  styleUrl: './timeline-scrubber.scss',
})
export class TimelineScrubber {
  readonly months = input<readonly string[]>([]);
  /** Emits the as-of month, or null when the cursor rests at "Now" (live whole-library view). */
  readonly monthChange = output<string | null>();

  /** Top index (= "Now"). */
  protected readonly max = computed(() => Math.max(0, this.months().length - 1));
  /**
   * Cursor position. Defaults to "Now" and snaps back there whenever the month list changes (e.g. a
   * rescan adds months), so the scrubber never strands the heat on a stale slice.
   */
  protected readonly index = linkedSignal(() => this.max());
  protected readonly atNow = computed(() => this.index() >= this.max());

  private readonly playing = signal(false);
  protected readonly isPlaying = this.playing.asReadonly();
  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly label = computed(() =>
    this.atNow() ? 'Now' : formatMonth(this.months()[this.index()] ?? ''),
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  /** Slider tooltip label for a given step. */
  protected readonly display = (value: number): string =>
    value >= this.max() ? 'Now' : formatMonth(this.months()[value] ?? '');

  protected onSlider(value: number): void {
    this.stop();
    this.setIndex(value);
  }

  /** Play/pause the fill-in animation. Play from the start again if the cursor sits at "Now". */
  protected togglePlay(): void {
    if (this.playing()) {
      this.stop();
      return;
    }
    if (this.months().length < 2) {
      return;
    }
    if (this.atNow()) {
      this.setIndex(0);
    }
    this.playing.set(true);
    this.timer = setInterval(() => {
      const next = this.index() + 1;
      this.setIndex(next);
      if (next >= this.max()) {
        this.stop();
      }
    }, STEP_MS);
  }

  private stop(): void {
    this.playing.set(false);
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private setIndex(value: number): void {
    const clamped = Math.max(0, Math.min(this.max(), value));
    this.index.set(clamped);
    this.monthChange.emit(clamped >= this.max() ? null : (this.months()[clamped] ?? null));
  }
}

/** `'2024-03'` → `'Mar 2024'`. */
function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  const name = MONTH_NAMES[Number(m) - 1];
  return name && year ? `${name} ${year}` : month;
}
```

### `src/app/features/globe/timeline-scrubber/timeline-scrubber.html`
```html
<button
  mat-icon-button
  class="play"
  (click)="togglePlay()"
  [disabled]="months().length < 2"
  [attr.aria-label]="isPlaying() ? 'Pause fill-in replay' : 'Play fill-in replay'"
>
  <mat-icon>{{ isPlaying() ? 'pause' : 'play_arrow' }}</mat-icon>
</button>

<mat-slider class="track" [min]="0" [max]="max()" [step]="1" discrete [displayWith]="display">
  <input
    matSliderThumb
    aria-label="Liked-songs month"
    [value]="index()"
    (valueChange)="onSlider($event)"
  />
</mat-slider>

<span class="label">{{ label() }}</span>
```

### `src/app/features/globe/timeline-scrubber/timeline-scrubber.scss`
```scss
:host {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 1rem 0.25rem 0.5rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--space-surface) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--neon-teal) 25%, transparent);
  backdrop-filter: blur(8px);
  box-shadow: var(--glow-shadow);
}

.track {
  // Fill the panel so the months spread across a comfortable scrub distance.
  width: min(60vw, 32rem);
}

.label {
  min-width: 4.5rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--neon-teal);
  white-space: nowrap;
}
```

### `src/app/features/globe/view-options/view-options.ts`
```ts
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

/**
 * Pinned control to toggle which globe overlays are visible — and hide them all at once for a
 * globe-only view. Dumb: inputs/outputs only; the page owns and persists the state. The open/closed
 * state of its little panel is purely local view state. Grows in M11 (a "save image" action).
 */
@Component({
  selector: 'app-view-options',
  imports: [MatButtonModule, MatIconModule, MatSlideToggleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './view-options.html',
  styleUrl: './view-options.scss',
})
export class ViewOptions {
  readonly showStats = input(true);
  readonly showLegend = input(true);
  readonly showFlight = input(true);
  readonly showTripLog = input(true);
  readonly showJourney = input(true);
  readonly showFilters = input(true);
  readonly showTimeline = input(true);

  readonly toggleStats = output<boolean>();
  readonly toggleLegend = output<boolean>();
  readonly toggleFlight = output<boolean>();
  readonly toggleTripLog = output<boolean>();
  readonly toggleJourney = output<boolean>();
  readonly toggleFilters = output<boolean>();
  readonly toggleTimeline = output<boolean>();
  readonly hideAll = output<void>();

  protected readonly open = signal(false);
}
```

### `src/app/features/globe/view-options/view-options.html`
```html
@if (open()) {
  <div class="panel">
    <mat-slide-toggle [checked]="showStats()" (change)="toggleStats.emit($event.checked)">
      Leaderboards
    </mat-slide-toggle>
    <mat-slide-toggle [checked]="showLegend()" (change)="toggleLegend.emit($event.checked)">
      Heat legend
    </mat-slide-toggle>
    <mat-slide-toggle [checked]="showFlight()" (change)="toggleFlight.emit($event.checked)">
      Flight (plane &amp; route)
    </mat-slide-toggle>
    <mat-slide-toggle [checked]="showTripLog()" (change)="toggleTripLog.emit($event.checked)">
      Trip log
    </mat-slide-toggle>
    <mat-slide-toggle [checked]="showJourney()" (change)="toggleJourney.emit($event.checked)">
      Journey passport
    </mat-slide-toggle>
    <mat-slide-toggle [checked]="showFilters()" (change)="toggleFilters.emit($event.checked)">
      Heat filters
    </mat-slide-toggle>
    <mat-slide-toggle [checked]="showTimeline()" (change)="toggleTimeline.emit($event.checked)">
      Timeline
    </mat-slide-toggle>
    <button mat-stroked-button class="hide-all" (click)="hideAll.emit()">
      <mat-icon>visibility_off</mat-icon>
      Hide all
    </button>
  </div>
}

<button
  mat-mini-fab
  class="trigger"
  (click)="open.set(!open())"
  [attr.aria-label]="open() ? 'Close overlay options' : 'Show or hide globe overlays'"
>
  <mat-icon>{{ open() ? 'close' : 'visibility' }}</mat-icon>
</button>
```

### `src/app/features/globe/view-options/view-options.scss`
```scss
:host {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--space-surface) 90%, transparent);
  border: 1px solid color-mix(in srgb, var(--neon-teal) 25%, transparent);
  backdrop-filter: blur(8px);
  box-shadow: var(--glow-shadow);
}

.hide-all {
  margin-top: 0.25rem;
}

.trigger {
  box-shadow: var(--glow-shadow);
}
```

### `src/app/features/actions/actions-page/actions-page.ts`
```ts
import { afterNextRender, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { GeoData } from '../../../core/geo/geo-data';
import { Country } from '../../../core/models/country';
import { BootSync } from '../../../core/pipeline/boot-sync';
import { PlaylistIndex } from '../../../core/pipeline/playlist-index';
import { GlobeStore } from '../../globe/globe-store';
import { UnplacedArtists } from '../../globe/unplaced-artists/unplaced-artists';

/**
 * Data management page: per-domain reload of the three datasets that feed the app — Liked Songs,
 * playlists, artist info — each with a cheap "Check for updates" (diff only) and a "Full re-scan"
 * (re-fetch from scratch), plus the couldn't-place list. The globe view stays a pure visualization;
 * every control lives here. (The whole-dataset wipe + export/import land with the M11 settings.)
 */
@Component({
  selector: 'app-actions-page',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, UnplacedArtists],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './actions-page.html',
  styleUrl: './actions-page.scss',
})
export class ActionsPage {
  protected readonly store = inject(GlobeStore);
  protected readonly sync = inject(BootSync);
  protected readonly playlists = inject(PlaylistIndex);
  /** Countries for the couldn't-place picker, loaded once from the GeoJSON. */
  protected readonly countries = signal<Country[]>([]);

  constructor() {
    // Hydrate the cached playlist index so its "last built" status reflects a prior scan without any
    // network on open. The globe dataset is already restored by the app root (step 14).
    afterNextRender(() => this.playlists.hydrate());
    const geoData = inject(GeoData);
    void geoData.countries().then((countries) => this.countries.set(countries));
  }

  // --- Liked Songs ---

  protected checkLiked(): void {
    void this.sync.syncLiked(true);
  }

  protected rescanLiked(): void {
    void this.sync.fullRescanLiked();
  }

  // --- Playlists ---

  protected checkPlaylists(): void {
    void this.sync.syncPlaylists(true);
  }

  protected rescanPlaylists(): void {
    void this.sync.fullRescanPlaylists();
  }

  // --- Artists ---

  protected checkArtists(): void {
    void this.sync.syncArtists(true);
  }

  protected rescanArtists(): void {
    void this.sync.fullRescanArtists();
  }

  protected recheckUnplaced(): void {
    void this.store.recheckUnplaced();
  }

  /** "synced 3 min ago" / "never synced" for a domain's last-sync timestamp. */
  protected agoLabel(at: number | null): string {
    if (at === null) {
      return 'never synced';
    }
    const seconds = Math.round((Date.now() - at) / 1000);
    if (seconds < 60) {
      return 'synced just now';
    }
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `synced ${minutes} min ago`;
    }
    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return `synced ${hours} h ago`;
    }
    return `synced ${Math.round(hours / 24)} d ago`;
  }
}
```

### `src/app/features/actions/actions-page/actions-page.html`
```html
<section class="actions">
  <header class="head">
    <h1>Actions</h1>
    <p class="sub">
      Reload the data that feeds EarthViewMusic. “Check for updates” fetches only what changed;
      “Full re-scan” re-reads everything from scratch.
    </p>
  </header>

  <div class="groups">
    <!-- Liked Songs → globe -->
    <section class="group">
      <h2 class="group-title">Liked Songs</h2>
      <p class="group-sub">The dataset that colours the globe.</p>
      <div class="panel">
        <p class="status">
          {{ agoLabel(sync.lastSyncedAt('liked')) }} · {{ store.total() }} artists ·
          {{ store.resolvedCount() }} placed · {{ store.failedCount() }} unplaced
        </p>
        <div class="controls">
          <button
            mat-flat-button
            [disabled]="sync.running() || store.isResolving()"
            (click)="checkLiked()"
            matTooltip="Check Spotify for new likes and fetch only what changed"
          >
            <mat-icon>sync</mat-icon> Check for updates
          </button>
          <button
            mat-stroked-button
            [disabled]="sync.running() || store.isResolving()"
            (click)="rescanLiked()"
            matTooltip="Re-page your entire Liked Songs and retry every unplaced artist"
          >
            <mat-icon>restart_alt</mat-icon> Full re-scan
          </button>
        </div>
      </div>
    </section>

    <!-- Playlists -->
    <section class="group">
      <h2 class="group-title">Playlists</h2>
      <p class="group-sub">
        Membership index for the library tools — which playlists hold each track.
      </p>
      <div class="panel">
        @if (playlists.building()) {
          <p class="status">
            Checking your playlists… {{ playlists.progress().done }} of
            {{ playlists.progress().total }}
          </p>
        } @else {
          <p class="status">{{ agoLabel(sync.lastSyncedAt('playlists')) }}</p>
        }
        <div class="controls">
          <button
            mat-flat-button
            [disabled]="sync.running() || playlists.building()"
            (click)="checkPlaylists()"
            matTooltip="Re-read only the playlists changed since the last check"
          >
            <mat-icon>sync</mat-icon> Check for updates
          </button>
          <button
            mat-stroked-button
            [disabled]="sync.running() || playlists.building()"
            (click)="rescanPlaylists()"
            matTooltip="Re-read every playlist from scratch"
          >
            <mat-icon>restart_alt</mat-icon> Full re-scan
          </button>
        </div>
      </div>
    </section>

    <!-- Artist info (genres + follow state) -->
    <section class="group">
      <h2 class="group-title">Artist info</h2>
      <p class="group-sub">Genres and follow status for each placed artist.</p>
      <div class="panel">
        <p class="status">{{ agoLabel(sync.lastSyncedAt('artists')) }}</p>
        <div class="controls">
          <button
            mat-flat-button
            [disabled]="sync.running() || store.isResolving()"
            (click)="checkArtists()"
            matTooltip="Fetch genres/follow state for artists still missing it"
          >
            <mat-icon>sync</mat-icon> Check for updates
          </button>
          <button
            mat-stroked-button
            [disabled]="sync.running() || store.isResolving()"
            (click)="rescanArtists()"
            matTooltip="Re-fetch genres and follow state for every placed artist"
          >
            <mat-icon>restart_alt</mat-icon> Full re-scan
          </button>
        </div>
      </div>
    </section>

    <!-- Clear-all-data + export/import land with the M11 settings panel. // grows in M11 -->
  </div>

  @if (store.unplaced().length > 0) {
    <div class="unplaced-head">
      <button
        mat-stroked-button
        [disabled]="sync.running() || store.isResolving()"
        (click)="recheckUnplaced()"
        matTooltip="Try again to auto-resolve the artists we couldn't place"
      >
        <mat-icon>refresh</mat-icon> Recheck unplaced
      </button>
    </div>
    <app-unplaced-artists
      class="unplaced"
      [artists]="store.unplaced()"
      [countries]="countries()"
      (place)="store.setCountry($event.artistId, $event.code)"
      (hide)="store.hideUnplaced($event)"
    />
  }
</section>
```

### `src/app/features/actions/actions-page/actions-page.scss`
```scss
:host {
  display: block;
  height: 100%;
  overflow-y: auto;
}

.actions {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.head {
  h1 {
    margin: 0;
    font-size: 1.6rem;
  }

  .sub {
    margin: 0.25rem 0 0;
    max-width: 44rem;
    opacity: 0.7;
  }
}

// The groups sit side by side on a wide screen, stacking on a narrow one.
.groups {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
  gap: 1.5rem;
  align-items: start;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.group-title {
  margin: 0;
  font-size: 1.15rem;
}

.group-sub {
  margin: 0;
  opacity: 0.7;
  font: var(--mat-sys-body-small);
}

// No box — just the status line and the refresh buttons.
.panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.status {
  margin: 0;
  font: var(--mat-sys-body-medium);
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-self: flex-start;
}

.unplaced-head {
  display: flex;
  justify-content: flex-end;
}

.unplaced {
  display: block;
}
```

### `src/app/features/globe/globe-page/globe-page.ts` *(modified)*
```ts
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';

import { ViewPrefsCache } from '../../../core/cache/view-prefs-cache';
import { countryCentroids, GeoData, greatCircleKm, LatLng } from '../../../core/geo/geo-data';
import { LogStore } from '../../../core/logging/log-store';
import { Country } from '../../../core/models/country';
import { CountryHover } from '../country-hover/country-hover';
import { CountryStat, CountryStats, StatBoard } from '../country-stats/country-stats';
import { EraFilter } from '../era-filter/era-filter';
import { FlightStore } from '../flight-store';
import { GenreFilter } from '../genre-filter/genre-filter';
import { CountryHoverEvent, GlobeCanvas } from '../globe-canvas/globe-canvas';
import { GlobeStore } from '../globe-store';
import { HeatLegend } from '../heat-legend/heat-legend';
import { JourneyStats, JourneyTotals } from '../journey-stats/journey-stats';
import { LogTerminal } from '../log-terminal/log-terminal';
import { ScanList } from '../scan-list/scan-list';
import { TimelineScrubber } from '../timeline-scrubber/timeline-scrubber';
import { TripLog } from '../trip-log/trip-log';
import { ViewOptions } from '../view-options/view-options';

@Component({
  selector: 'app-globe-page',
  imports: [
    GlobeCanvas,
    ScanList,
    HeatLegend,
    ViewOptions,
    CountryHover,
    CountryStats,
    TripLog,
    JourneyStats,
    GenreFilter,
    EraFilter,
    TimelineScrubber,
    LogTerminal,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './globe-page.html',
  styleUrl: './globe-page.scss',
})
export class GlobePage {
  protected readonly store = inject(GlobeStore);
  /** Live progress lines for the loading-terminal overlay (a scan launched from Actions / boot). */
  protected readonly log = inject(LogStore);
  private readonly flight = inject(FlightStore);
  /** Drives the plane animation from live Spotify playback. */
  protected readonly flightTarget = this.flight.target;
  /** Finished stops for the trip log (newest first). */
  protected readonly tripHistory = this.flight.history;

  /** Countries for name lookups, loaded once from the GeoJSON. */
  protected readonly countries = signal<Country[]>([]);
  /** Country centroids + continents, loaded from the GeoJSON for the Trip-mode journey stats. */
  private readonly centroids = signal<ReadonlyMap<string, LatLng>>(new Map());
  private readonly continents = signal<ReadonlyMap<string, string>>(new Map());

  // --- Overlay visibility (persisted; D5 — independent toggles, not a mode switch) ---
  private readonly viewPrefs = inject(ViewPrefsCache);
  protected readonly showStats = signal(true);
  protected readonly showLegend = signal(true);
  /** The flight overlay (plane + route + follow camera). When off it keeps flying, just hidden. */
  protected readonly showFlight = signal(true);
  protected readonly showTripLog = signal(true);
  protected readonly showJourney = signal(true);
  /** The heat-filter bar (genre picker + release-era chips). */
  protected readonly showFilters = signal(true);
  /** The timeline scrubber that replays the map's fill-in over time. */
  protected readonly showTimeline = signal(true);

  // --- Hover card state ---
  /** ISO alpha-2 of the country under the pointer, fed by the globe canvas. */
  protected readonly hoveredCode = signal<string | null>(null);
  /** Cursor position (canvas px) where the current country was entered — anchors the hover card. */
  protected readonly hoverPos = signal({ x: 0, y: 0 });
  /** Place the card below the cursor when there's more room there than above, so it never clips. */
  protected readonly hoverBelow = signal(false);
  /** Max height (px) for the card's artist list, sized to the free space on the chosen side. */
  protected readonly hoverListMax = signal(240);
  /** Pending card dismissal — deferred so the pointer can travel from globe onto the card. */
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly hoveredArtists = computed(() => {
    const code = this.hoveredCode();
    return code === null ? [] : (this.store.artistsByCountry().get(code) ?? []);
  });
  protected readonly hoveredCountryName = computed(() => {
    const code = this.hoveredCode();
    return code === null ? '' : this.countryName(code);
  });

  // --- Heat legend (heat-mode toggle, D8; caption also notes any active filter) ---
  protected readonly legendCaption = computed(() => {
    const metric = this.store.heatMode() === 'hours' ? 'hours' : 'tracks';
    const base = metric === 'hours' ? 'Hours per country' : 'Tracks per country';
    const parts: string[] = [];
    const genre = this.store.genreFilter();
    if (genre !== null) {
      parts.push(genre);
    }
    const decades = this.store.eraDecades();
    if (decades !== null) {
      parts.push(
        [...decades]
          .sort((a, b) => a - b)
          .map((d) => `${String(d % 100).padStart(2, '0')}s`)
          .join('/'),
      );
    }
    const asOf = this.store.asOfMonth();
    if (asOf !== null) {
      parts.push(`through ${asOf}`);
    }
    return parts.length === 0 ? base : `${parts.join(' · ')} · ${metric} per country`;
  });
  protected readonly legendUnit = computed(() => (this.store.heatMode() === 'hours' ? 'h' : '♪'));
  /** The hot end of the legend scale, converted to whole hours in 'hours' mode. */
  protected readonly legendMax = computed(() =>
    this.store.heatMode() === 'hours'
      ? Math.round(this.store.maxHeat() / 3_600_000)
      : this.store.maxHeat(),
  );

  /** Top-10 country leaderboards by artists, liked tracks, and liked-music hours. */
  protected readonly statBoards = computed<StatBoard[]>(() => {
    const byArtists = [...this.store.artistsByCountry().entries()].map(([code, artists]) => ({
      code,
      name: this.countryName(code),
      value: artists.length,
    }));
    const byTracks = [...this.store.tracksByCountry().entries()].map(([code, value]) => ({
      code,
      name: this.countryName(code),
      value,
    }));
    const byHours = [...this.store.durationByCountry().entries()].map(([code, ms]) => ({
      code,
      name: this.countryName(code),
      // ms → hours, one decimal place.
      value: Math.round(ms / 360_000) / 10,
    }));
    return [
      { caption: 'Top countries · artists', rows: top10(byArtists) },
      { caption: 'Top countries · tracks', unit: '♪', rows: top10(byTracks) },
      { caption: 'Top countries · hours', unit: 'h', rows: top10(byHours) },
    ];
  });

  /**
   * Running totals for the Trip-mode passport. The chronological stop sequence is the history
   * (newest-first) reversed, with the now-playing destination appended as the latest stop; distance
   * sums the great-circle hops between consecutive *known, distinct* countries.
   */
  protected readonly journeyTotals = computed<JourneyTotals>(() => {
    const current = this.flightTarget();
    const stops = [...this.tripHistory()].reverse();
    const codes = stops.map((s) => s.countryCode);
    if (current !== null) {
      codes.push(current.countryCode);
    }

    const centroids = this.centroids();
    const continents = this.continents();
    const countries = new Set<string>();
    const seenContinents = new Set<string>();
    let distanceKm = 0;
    let unknown = 0;
    let prev: LatLng | null = null;
    let prevCode: string | null = null;

    for (const code of codes) {
      if (code === null) {
        unknown++;
        continue;
      }
      countries.add(code);
      const continent = continents.get(code);
      if (continent !== undefined) {
        seenContinents.add(continent);
      }
      const here = centroids.get(code) ?? null;
      if (here !== null && prev !== null && code !== prevCode) {
        distanceKm += greatCircleKm(prev, here);
      }
      if (here !== null) {
        prev = here;
        prevCode = code;
      }
    }

    return {
      distanceKm,
      countries: countries.size,
      continents: seenContinents.size,
      songs: codes.length,
      unknown,
    };
  });

  constructor() {
    // Load the country list (name lookups) + centroids/continents (journey stats) from the GeoJSON.
    const geoData = inject(GeoData);
    void geoData.countries().then((countries) => this.countries.set(countries));
    void geoData.features().then((features) => this.centroids.set(countryCentroids(features)));
    void geoData.continents().then((continents) => this.continents.set(continents));

    // Load overlay-visibility prefs, then persist any change back (D5).
    const prefs = this.viewPrefs.load();
    this.showStats.set(prefs.showStats);
    this.showLegend.set(prefs.showLegend);
    this.showFlight.set(prefs.showFlight);
    this.showTripLog.set(prefs.showTripLog);
    this.showJourney.set(prefs.showJourney);
    this.showFilters.set(prefs.showFilters);
    this.showTimeline.set(prefs.showTimeline);
    effect(() =>
      this.viewPrefs.save({
        showStats: this.showStats(),
        showLegend: this.showLegend(),
        showFlight: this.showFlight(),
        showTripLog: this.showTripLog(),
        showJourney: this.showJourney(),
        showFilters: this.showFilters(),
        showTimeline: this.showTimeline(),
      }),
    );

    // Hiding the scrubber returns the heat to the live view — otherwise a scrubbed-back month would
    // stay frozen on the globe with no visible control to release it.
    effect(() => {
      if (!this.showTimeline()) {
        this.store.setAsOfMonth(null);
      }
    });

    // Drop any stale hover when leaving the globe view (the canvas is destroyed then).
    effect(() => {
      if (this.store.phase() !== 'globe') {
        this.hoveredCode.set(null);
      }
    });
    // NOTE: restoring saved data + the boot-sync refresh now live in the app root (App), so they run
    // on any landing route — not just when the globe page mounts. (M9, step 14.)
  }

  /**
   * Globe hover changed. A country anchors and shows the card; leaving a country (null) defers the
   * dismissal so the pointer can cross the gap onto the card — `cancelHide` (card mouseenter) keeps
   * it open. The anchor only moves on a country change, so the card stays put to be hovered.
   */
  protected onHover(event: CountryHoverEvent): void {
    if (event.code === null) {
      this.scheduleHide();
      return;
    }
    this.cancelHide();
    // Keep the card on-screen horizontally; translateX(-50%) centres it on this x.
    const half = 192;
    const x = Math.min(Math.max(event.x, half), window.innerWidth - half);
    this.hoverPos.set({ x, y: event.y });

    // Flip the card to whichever side of the cursor has more room, then cap its scroll list to that
    // side's free height so it grows to fit and only scrolls when it genuinely can't.
    const above = event.y;
    const below = window.innerHeight - event.y;
    const placeBelow = below > above;
    const RESERVED = 130; // card header + summary + paddings + 14px cursor gap + edge margin
    this.hoverBelow.set(placeBelow);
    this.hoverListMax.set(Math.max(120, (placeBelow ? below : above) - RESERVED));

    this.hoveredCode.set(event.code);
  }

  protected scheduleHide(): void {
    this.cancelHide();
    this.hideTimer = setTimeout(() => this.hoveredCode.set(null), 220);
  }

  protected cancelHide(): void {
    if (this.hideTimer !== null) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  /** Hide every overlay for a bare-globe view. */
  protected hideAll(): void {
    this.showStats.set(false);
    this.showLegend.set(false);
    this.showFlight.set(false);
    this.showTripLog.set(false);
    this.showJourney.set(false);
    this.showFilters.set(false);
    this.showTimeline.set(false);
  }

  /** code → country, rebuilt only when the country list changes — so name lookups aren't a linear
   * scan repeated for every leaderboard row on each `statBoards` recompute. */
  private readonly countryByCode = computed(
    () => new Map(this.countries().map((c) => [c.code, c])),
  );

  private countryName(code: string): string {
    return this.countryByCode().get(code)?.name ?? code;
  }
}

/** Highest-value 10, sorted descending. */
function top10(stats: CountryStat[]): CountryStat[] {
  return [...stats].sort((a, b) => b.value - a.value).slice(0, 10);
}
```

### `src/app/features/globe/globe-page/globe-page.html` *(modified)*
```html
@if (store.phase() === 'globe') {
  <app-globe-canvas
    class="globe"
    [heat]="store.heat()"
    [flightTarget]="flightTarget()"
    [flightVisible]="showFlight()"
    (countryHover)="onHover($event)"
  />

  <!-- Top-centre: heat filters — genre (where) + release-era decades (when). -->
  @if (
    showFilters() &&
    store.hasData() &&
    (store.availableGenres().length > 0 || store.availableDecades().length > 1)
  ) {
    <div class="filters">
      @if (store.availableGenres().length > 0) {
        <app-genre-filter
          [genres]="store.availableGenres()"
          [selected]="store.genreFilter()"
          (genreChange)="store.setGenre($event)"
        />
      }
      @if (store.availableDecades().length > 1) {
        <app-era-filter
          [decades]="store.availableDecades()"
          [selected]="store.eraDecades()"
          (selectionChange)="store.setEraDecades($event)"
        />
      }
    </div>
  }

  <!-- Bottom-centre: timeline scrubber — replays how the map filled in over the months. -->
  @if (showTimeline() && store.hasData() && store.timelineMonths().length > 1) {
    <app-timeline-scrubber
      class="timeline"
      [months]="store.timelineMonths()"
      (monthChange)="store.setAsOfMonth($event)"
    />
  }

  <!-- Hover card, anchored to the cursor. -->
  @if (hoveredCode() !== null && hoveredArtists().length > 0) {
    <app-country-hover
      class="hover"
      [class.below]="hoverBelow()"
      [style.left.px]="hoverPos().x"
      [style.top.px]="hoverPos().y"
      [style.--artists-max]="hoverListMax() + 'px'"
      [countryCode]="hoveredCode() ?? ''"
      [countryName]="hoveredCountryName()"
      [artists]="hoveredArtists()"
      (mouseenter)="cancelHide()"
      (mouseleave)="scheduleHide()"
    />
  }

  <!-- Top-left: the trip log (scan controls + couldn't-place list now live on the Actions page). -->
  <div class="stack-tl">
    @if (showTripLog()) {
      <app-trip-log [current]="flightTarget()" [history]="tripHistory()" />
    }
  </div>

  <!-- Bottom-left: journey passport → heat-mode toggle (D8) → legend. -->
  <div class="stack-bl">
    @if (showJourney() && journeyTotals().songs > 0) {
      <app-journey-stats [stats]="journeyTotals()" />
    }

    @if (store.heat().size > 0) {
      <div class="heat-toggle" role="group" aria-label="Heat metric">
        <button
          type="button"
          [class.active]="store.heatMode() === 'tracks'"
          (click)="store.setHeatMode('tracks')"
        >
          ♪ Tracks
        </button>
        <button
          type="button"
          [class.active]="store.heatMode() === 'hours'"
          (click)="store.setHeatMode('hours')"
        >
          h Hours
        </button>
      </div>
      @if (showLegend()) {
        <app-heat-legend [max]="legendMax()" [caption]="legendCaption()" [unit]="legendUnit()" />
      }
    }
  </div>

  <!-- Bottom-right: leaderboards, above the view-options fab. -->
  @if (showStats() && store.heat().size > 0) {
    <app-country-stats class="stats" [boards]="statBoards()" />
  }

  <!-- Overlay-visibility fab (bottom-right corner). -->
  <app-view-options
    class="view-options"
    [showStats]="showStats()"
    [showLegend]="showLegend()"
    [showFlight]="showFlight()"
    [showTripLog]="showTripLog()"
    [showJourney]="showJourney()"
    [showFilters]="showFilters()"
    [showTimeline]="showTimeline()"
    (toggleStats)="showStats.set($event)"
    (toggleLegend)="showLegend.set($event)"
    (toggleFlight)="showFlight.set($event)"
    (toggleTripLog)="showTripLog.set($event)"
    (toggleJourney)="showJourney.set($event)"
    (toggleFilters)="showFilters.set($event)"
    (toggleTimeline)="showTimeline.set($event)"
    (hideAll)="hideAll()"
  />
} @else {
  <app-scan-list
    class="scan"
    [artists]="store.artists()"
    [phase]="store.phase()"
    [resolving]="store.isResolving()"
    (done)="store.showGlobe()"
  />
}

<!-- Loading terminal: a blocking overlay streaming a scan's progress (launched from Actions / boot). -->
@if (store.isResolving()) {
  <app-log-terminal
    [entries]="log.entries()"
    [resolvedCount]="store.resolvedCount()"
    [pendingCount]="store.pendingCount()"
    [failedCount]="store.failedCount()"
    [total]="store.total()"
  />
}
```

### `src/app/features/globe/globe-page/globe-page.scss` *(modified)*
```scss
:host {
  display: block;
  position: relative;
  // Fill the viewport below the 64px toolbar so the globe sits in full-bleed space.
  height: calc(100dvh - 64px);
  overflow: hidden;
  background: radial-gradient(circle at 50% 40%, #0b1626 0%, var(--space-void, #070b14) 70%);
}

.globe,
.scan {
  display: block;
  width: 100%;
  height: 100%;
}

// Top-left column: the trip log (scan HUD moved to the Actions page in M9).
.stack-tl {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  max-width: 17rem;
}

// Top-centre: heat filters (genre picker + era chips). Centred and capped so it never collides with
// the top-left trip log; wraps to stack on narrow viewports.
.filters {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem 1rem;
  max-width: min(46rem, calc(100vw - 2rem));
  padding: 0.6rem 1rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--space-surface) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--neon-teal) 25%, transparent);
  backdrop-filter: blur(8px);
  box-shadow: var(--glow-shadow);
}

// Bottom-centre: the timeline scrubber. Kept clear of the bottom-left journey/legend stack and the
// bottom-right stats/fab; shrinks its own track on narrow viewports.
.timeline {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  max-width: calc(100vw - 2rem);
}

// Bottom-left column: journey passport → heat-mode toggle → legend.
.stack-bl {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.6rem;
}

// Segmented tracks/hours toggle (guide extension, D8).
.heat-toggle {
  display: inline-flex;
  border-radius: 0.6rem;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--neon-teal) 25%, transparent);
  background: color-mix(in srgb, var(--space-surface) 80%, transparent);
  backdrop-filter: blur(8px);

  button {
    padding: 0.35rem 0.75rem;
    border: 0;
    background: transparent;
    color: var(--mat-sys-on-surface-variant);
    font: var(--mat-sys-body-small);
    cursor: pointer;

    &.active {
      background: color-mix(in srgb, var(--neon-teal) 22%, transparent);
      color: var(--mat-sys-on-surface);
      font-weight: 700;
    }
  }
}

// Leaderboards sit above the view-options fab (bottom-right) so both share the corner.
.stats {
  position: absolute;
  bottom: 4.5rem;
  right: 1rem;
  z-index: 1;
}

.view-options {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  z-index: 2;
}

.hover {
  position: absolute;
  // left/top are bound to the cursor position (canvas px); sit just above the cursor by default.
  z-index: 3;
  transform: translate(-50%, calc(-100% - 14px));
  // Hoverable: the user moves onto the card to scroll it and click artist links.
  pointer-events: auto;
}

// Near the top edge, flip below the cursor so the card never clips off-screen.
.hover.below {
  transform: translate(-50%, 14px);
}
```

### `src/app/shared/components/header/header.ts`
```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { SpotifyAuth } from '../../../core/auth/spotify-auth';
import { TokenStore } from '../../../core/auth/token-store';
import { BootSync } from '../../../core/pipeline/boot-sync';
import { PlayerBar } from '../../../features/player/player-bar/player-bar';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    PlayerBar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly auth = inject(SpotifyAuth);
  private readonly router = inject(Router);

  /** A session exists (matching the route guard) — drives whether the app chrome shows. */
  protected readonly hasSession = inject(TokenStore).hasSession;

  /** The boot sync is reconciling — nav is locked to match the route guard + overlay. */
  protected readonly syncing = inject(BootSync).busy;

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
```

### `src/app/shared/components/header/header.html`
```html
<mat-toolbar class="header">
  <a class="brand" routerLink="/globe">EarthViewMusic</a>
  @if (hasSession()) {
    <app-player-bar class="player" />
  }
  <span class="spacer"></span>
  <nav class="nav">
    @if (hasSession()) {
      <a
        mat-button
        routerLink="/globe"
        routerLinkActive="active"
        [disabled]="syncing()"
        title="Back to the globe"
      >
        <mat-icon>public</mat-icon>
        Globe
      </a>
      <a
        mat-button
        routerLink="/actions"
        routerLinkActive="active"
        [disabled]="syncing()"
        title="Scan &amp; manage your data"
      >
        <mat-icon>storage</mat-icon>
        Actions
      </a>
      <button mat-button (click)="logout()">Log out</button>
    }
  </nav>
</mat-toolbar>
```

### `src/app/shared/components/header/header.scss`
```scss
.header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand {
  color: var(--neon-teal);
  font-weight: 600;
  letter-spacing: 0.03em;
  text-decoration: none;
}

.player {
  margin-left: 1.5rem;
  min-width: 0;
}

.spacer {
  flex: 1 1 auto;
}

// The active nav link (Globe / Actions) reads bolder.
.nav .active {
  font-weight: 600;
}
```

### `src/app/app.routes.ts`
```ts
import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth-guard';
import { bootSyncGuard } from './core/pipeline/boot-sync-guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'globe' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./features/auth/callback-page/callback-page').then((m) => m.CallbackPage),
  },
  {
    path: 'globe',
    canActivate: [authGuard, bootSyncGuard],
    loadComponent: () => import('./features/globe/globe-page/globe-page').then((m) => m.GlobePage),
  },
  {
    path: 'actions',
    canActivate: [authGuard, bootSyncGuard],
    loadComponent: () =>
      import('./features/actions/actions-page/actions-page').then((m) => m.ActionsPage),
  },
  // `/library*` routes arrive with the M10 library console.
  { path: '**', redirectTo: 'globe' },
];
```

### `src/app/app.ts`
```ts
import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { TokenStore } from './core/auth/token-store';
import { LogStore } from './core/logging/log-store';
import { BootSync, PHASE_LABEL } from './core/pipeline/boot-sync';
import { GlobeStore } from './features/globe/globe-store';
import { LogTerminal } from './features/globe/log-terminal/log-terminal';
import { Header } from './shared/components/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, LogTerminal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly bootSync = inject(BootSync);
  protected readonly globe = inject(GlobeStore);
  protected readonly log = inject(LogStore);

  /** Overlay caption for the current sync phase (empty while idle). */
  protected readonly phaseLabel = (): string => PHASE_LABEL[this.bootSync.phase()];

  constructor() {
    const tokens = inject(TokenStore);
    const globe = this.globe;
    const bootSync = this.bootSync;

    // On app open — or the moment a session appears after login — restore the saved globe data and,
    // only if there's already data to reconcile, run the sequential boot sync (liked → playlists →
    // artists). Each step is staleness-guarded, so a warm reopen within 15 min does no network. A
    // first-ever run (no data) defers to the explicit "Full re-scan" UI rather than auto-paging.
    // Owned here (not on the globe page) so it fires regardless of the landing route.
    let started = false;
    effect(() => {
      if (started || !tokens.hasSession()) {
        return;
      }
      started = true;
      globe.restore();
      if (globe.hasData()) {
        void bootSync.run();
      }
    });
  }
}
```

### `src/app/app.html`
```html
<app-header />
<main class="content">
  <router-outlet />
</main>

@if (bootSync.busy()) {
  <div class="sync-overlay">
    <app-log-terminal
      [title]="phaseLabel()"
      [entries]="log.entries()"
      [total]="globe.total()"
      [resolvedCount]="globe.resolvedCount()"
      [pendingCount]="globe.pendingCount()"
      [failedCount]="globe.failedCount()"
    />
  </div>
}
```

### `src/app/app.scss`
```scss
.content {
  display: block;
  min-height: calc(100dvh - 64px);
}

// Full-screen block while the boot sync reconciles — page switching is locked until it finishes.
// It's just a fixed positioning context: the <app-log-terminal> inside fills it (position:absolute
// inset:0) and supplies its own scrim + centred terminal, so the boot loader *is* the live terminal.
.sync-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
}
```

## What you have now (cumulative)
On top of M0–M8, the globe is now **explorable and self-syncing**. A background **genre worker** enriches placed
artists with Spotify genre tags live during each scan; the heat is filterable by **genre**, **release decade**,
and an **as-of month** (the timeline scrubber), with a **per-track aggregation pass** that swaps in for any
temporal filter and agrees exactly with the fast pass when none is set. A **boot sync** reconciles Liked Songs →
playlists → artist info on open — cheap-diff first, 15-minute staleness guard, and a `pauseIfLimited` bail — with
a blocking overlay + nav-lock while it runs. A **snapshot-id-diff playlist index** is built and kept fresh. A
dedicated **Actions page** owns per-domain recalculate + recheck-unplaced (the globe is now a pure
visualization). Persisted keys added: `evm.playlistIndex`, `evm.syncState` (joining `evm.origins`,
`evm.likedIndex`, `evm.viewPrefs`, `evm.tripLog`, `evm.ratelimit.*`; `evm.appearance` arrives in M11).

## Troubleshooting
| Symptom | Likely cause → fix |
|---------|--------------------|
| Filters bar never shows | Gated on `store.hasData()` + non-empty `availableGenres`/`availableDecades`. Genres appear only after the genre worker enriches artists — watch the log for `Genres: fetched N`. |
| Per-track total ≠ fast total at "Now" | The per-track pass must attribute each track to `artistIds[0]` (primary) — the same rule `accumulate` uses. A different attribution desyncs the two passes. |
| Timeline shows the whole map even when scrubbed back | `setAsOfMonth` not wired, or the cursor is stuck at `max` (Now). Confirm `(monthChange)="store.setAsOfMonth($event)"` and that `timelineMonths().length > 1`. |
| Warm reopen still hits the network | A domain's `stamp()` didn't run, or `isFresh` reads the signal instead of the plain `this.state`; also confirm `STALE_MS` is 15 min. |
| Changed library not detected | `getLikedTracksSummary` compares `total` **and** `newest` against `likedIndex.count()`/`newest()`; if either is stale the diff misfires — check the M3 index commits its watermark. |
| Every playlist re-pages each sync | Comparing the raw `snapshot_id` instead of the domain `snapshotId` (mapped in `toPlaylist`), or the roster advances a changed playlist's snapshot before its items are read. |
| Boot overlay never clears | A boot step is waiting on a rate-limit cooldown; `pauseIfLimited` must bail between steps (step 06). |
| Genres burst at scan end instead of streaming | The `genreWorker` wasn't added to the scan's `Promise.all`, so only the tail `loadGenres()` runs — re-check `load()`/`incremental()`. |
| Heat-mode toggle gone / hours mode broken | You pasted the source `globe-store` (`heat = tracksByCountry`); keep the D8 computed `heat` + `_heatMode`. |
| `/actions` compile error on `LibraryStore`/`DataTransfer`/`Confirm` | Those are M10/M11; the M9 Actions page reads `PlaylistIndex` directly and omits the clear-all group. |

## Next
Continue to **[M10 — Library console](../MILESTONE_10_library-console/00_overview.md)** — the artist table,
artist-tidy, liked-songs page, relink/dedup by ISRC, and the discography/track-matching engine, all reading the
`LikedIndex` + the playlist index this milestone built.
