# M3 · Verify — Liked Songs streaming
> Nav: [← Render the likes](07_render-likes.md) · [Overview](00_overview.md) · [The globe →](../MILESTONE_4_globe-base/00_overview.md)

## Done-when gate (the real test — check every box by hand)
Run `npm run format:check`, `npm run lint`, and `npm run build` first — all three must be clean
(`Application bundle generation complete`, no lint errors). Then, with `npm start` running and logged in:

- [ ] **Streaming, newest-first.** Open `/globe`, click **Load my Liked Songs** → the count rises page-by-page
      (`50` → `100` → … → your real total) and the list grows with the newest saved track at the top. In the
      Network panel you see repeated `GET https://api.spotify.com/v1/me/tracks?...` calls, each following the
      previous response's `next` URL, visibly spaced by the rate-limit gate.
- [ ] **Persisted.** After the scan finishes, in DevTools → Application → Local Storage, key `evm.likedIndex`
      holds `{"version":1,"newest":"<ISO 8601 date>","tracks":[…]}` where `tracks.length` equals the count
      shown on screen.
- [ ] **Reload restores instantly, no refetch.** Reload the page → the same count and list appear immediately,
      and the Network panel shows **no** `GET /me/tracks` request until you click **Recalculate**.
- [ ] **DTO→domain wall holds.** In the DevTools console run
      `JSON.parse(localStorage['evm.likedIndex']).tracks[0]` → it's a flat `IndexedTrack`
      (`{ id, name, uri, isrc, durationMs, addedAt, albumId, albumName, albumType, releaseDate, artistIds }`) —
      all `camelCase`, no `snake_case`, no nested `track`/`album` object. No `…Dto` shape reaches the page.

## Files after this milestone (complete — the checkpoint)
### `src/app/core/dto/spotify.dto.ts`
```typescript
/** Raw Spotify Web API payloads. Never used outside mappers — domain code uses models. */
/** Grows in M4+ (album images, playlists, player, artists…). */

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
```

### `src/app/core/models/artist.ts`
```typescript
/** Minimal artist reference, as it appears on a Spotify track. */
export interface ArtistRef {
  id: string;
  name: string;
}
```

### `src/app/core/models/liked-track.ts`
```typescript
import { ArtistRef } from './artist';

export type AlbumType = 'album' | 'single' | 'compilation';

/** Album as it appears on a liked track — enough to match it against an artist's discography. */
export interface LikedTrackAlbum {
  id: string;
  name: string;
  /** `album` | `single` | `compilation`. */
  albumType: AlbumType;
  /** `YYYY` | `YYYY-MM` | `YYYY-MM-DD`. */
  releaseDate: string;
}

/** A liked/saved Spotify track. Carries identity + album so the library page can relink it. */
export interface LikedTrack {
  /** Saved track id — the one to remove from Liked Songs when relinking away from it. */
  id: string;
  name: string;
  /** Spotify URI (e.g. `spotify:track:...`) — used to start Liked Songs playback. */
  uri: string;
  /** International Standard Recording Code — ties the same recording across albums. May be null. */
  isrc: string | null;
  /** When the track was saved (ISO 8601) — drives the library date range + incremental cursor. */
  addedAt: string;
  /** Track runtime in milliseconds — summed per country for the listening-hours stat (M5). */
  durationMs: number;
  artists: ArtistRef[];
  album: LikedTrackAlbum;
}
```

### `src/app/core/models/indexed-track.ts`
```typescript
import { AlbumType } from './liked-track';

/** A liked track flattened for persistence + per-artist lookup on the library page. */
export interface IndexedTrack {
  id: string;
  name: string;
  uri: string;
  isrc: string | null;
  durationMs: number;
  addedAt: string;
  albumId: string;
  albumName: string;
  albumType: AlbumType;
  releaseDate: string;
  /** Every artist credited on the track — the track is reachable from each of them. */
  artistIds: string[];
}

/** The persisted liked-tracks index — a byproduct of the globe's `/me/tracks` scan. */
export interface LikedIndexSnapshot {
  version: 1;
  /** Newest liked-song `added_at` (ISO 8601) seen — the incremental cursor. */
  newest: string | null;
  tracks: IndexedTrack[];
}
```

### `src/app/core/mappers/spotify.mapper.ts`
```typescript
/** Dto → domain mappers. Grows in M4+ (album/playlist/track/playback mappers). */
import { SpotifySavedTracksDto } from '../dto/spotify.dto';
import { IndexedTrack } from '../models/indexed-track';
import { AlbumType, LikedTrack } from '../models/liked-track';

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

/** Coerce Spotify's free-text `album_type` to our union, defaulting unknowns to `album`. */
function toAlbumType(value: string): AlbumType {
  return (ALBUM_TYPES as readonly string[]).includes(value) ? (value as AlbumType) : 'album';
}
```

### `src/app/core/api/spotify-api.ts`
```typescript
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SpotifyMeDto, SpotifySavedTracksDto } from '../dto/spotify.dto';
import { toLikedTracks } from '../mappers/spotify.mapper';
import { LikedTrack } from '../models/liked-track';
import { withRetry } from '../pipeline/http-retry';

/** `GET /me/tracks` returns at most 50 saved tracks per page. */
const PAGE_SIZE = 50;

/**
 * Typed client for the Spotify Web API. The M1 auth interceptor adds the bearer token; the M2
 * rate-limit gate (via `rateLimitInterceptor`) is the single pacer for every call here, so a large
 * library never bursts into the rate limit. This service keeps no throttle of its own. Grows in
 * M5/M7/M10 (artists, player, playlists, library mutations).
 */
@Injectable({ providedIn: 'root' })
export class SpotifyApi {
  private readonly http = inject(HttpClient);

  /**
   * Streams the user's Liked Songs newest-first, one page (≤50) at a time, following Spotify's
   * `next` cursor. Consumers may stop iterating early (e.g. an incremental sync that stops at a
   * known date). Each page is mapped to clean {@link LikedTrack}s before it leaves this method.
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
   * A one-call summary of the user's Liked Songs — the total count and the newest track's
   * `added_at` — via `GET /me/tracks?limit=1`. The cheap diff a boot sync uses (M9) to decide
   * whether the library changed before paging anything.
   */
  async getLikedTracksSummary(): Promise<{ total: number; newest: string | null }> {
    const base = environment.spotify.apiBaseUrl;
    const page = await withRetry(() =>
      firstValueFrom(this.http.get<SpotifySavedTracksDto>(`${base}/me/tracks?limit=1`)),
    );
    return { total: page.total, newest: page.items[0]?.added_at ?? null };
  }

  /**
   * URIs of the user's Liked Songs, newest-first, up to `limit` — used by the player (M7) to
   * auto-start favourites when nothing is playing. Pages in ≤50s only as far as `limit` requires,
   * then stops early. Built now beside `streamLikedTracks()`; unused until M7.
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

  /** The current user's profile — only the id is used (to decide playlist ownership later). */
  async getMe(): Promise<SpotifyMeDto> {
    const base = environment.spotify.apiBaseUrl;
    return await firstValueFrom(this.http.get<SpotifyMeDto>(`${base}/me`));
  }
}
```

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

### `src/app/core/pipeline/liked-index.ts`
```typescript
import { computed, inject, Injectable, signal, untracked } from '@angular/core';

import { LikedIndexCache } from '../cache/liked-index-cache';
import { toIndexedTrack } from '../mappers/spotify.mapper';
import { IndexedTrack } from '../models/indexed-track';
import { LikedTrack } from '../models/liked-track';

/**
 * Flattened, per-track view of the user's Liked Songs — built as a byproduct of the `/me/tracks`
 * scan and persisted via {@link LikedIndexCache}. Reads an artist's liked tracks (with album + ISRC)
 * without re-paging the library. Grows in M9/M10 with incremental merge + relink/dedup mutations.
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

  /** A scan fed new data — bump this so dependent views recompute. */
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

### `src/app/features/globe/globe-page/globe-page.ts`
```typescript
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { SpotifyApi } from '../../../core/api/spotify-api';
import { IndexedTrack } from '../../../core/models/indexed-track';
import { LikedIndex } from '../../../core/pipeline/liked-index';

@Component({
  selector: 'app-globe-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './globe-page.html',
  styleUrl: './globe-page.scss',
})
export class GlobePage {
  private readonly spotify = inject(SpotifyApi);
  protected readonly likedIndex = inject(LikedIndex);

  /** True while a streaming scan is in flight — drives the button label + spinner. */
  protected readonly scanning = signal(false);
  /** Set after a failed scan — shown as an inline error. */
  protected readonly error = signal<string | null>(null);

  /** Liked tracks to render, newest-first (first 200). Reads `revision()` so it recomputes per page. */
  protected readonly tracks = computed<IndexedTrack[]>(() => {
    this.likedIndex.revision();
    return [...this.likedIndex.all()]
      .sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1))
      .slice(0, 200);
  });

  constructor() {
    // Restore the persisted index synchronously — NO network. A reload shows saved likes instantly;
    // the scan runs only on demand.
    this.likedIndex.hydrate();
  }

  /** Stream Liked Songs newest-first, committing (and persisting) the index after every page. */
  protected async loadLikes(): Promise<void> {
    if (this.scanning()) {
      return;
    }
    this.scanning.set(true);
    this.error.set(null);
    try {
      this.likedIndex.beginFull();
      let newest: string | null = null;
      for await (const page of this.spotify.streamLikedTracks()) {
        for (const track of page) {
          this.likedIndex.add(track);
          if (newest === null || track.addedAt > newest) {
            newest = track.addedAt;
          }
        }
        // Per-page watermark commit: a reload mid-scan keeps everything fetched so far.
        this.likedIndex.commit(newest);
      }
    } catch {
      this.error.set('Could not load your Liked Songs — check your connection and try again.');
    } finally {
      this.scanning.set(false);
    }
  }
}
```

### `src/app/features/globe/globe-page/globe-page.html`
```html
<section class="likes">
  <header class="likes__head">
    <h1>Your Liked Songs</h1>

    <p class="likes__count">
      @if (likedIndex.hasData() || scanning()) {
        <strong>{{ likedIndex.count() }}</strong> tracks
        @if (scanning()) {
          <span class="likes__status">· loading…</span>
        }
      } @else {
        Not loaded yet.
      }
    </p>

    <button type="button" class="likes__btn" (click)="loadLikes()" [disabled]="scanning()">
      @if (scanning()) {
        Loading…
      } @else if (likedIndex.hasData()) {
        Recalculate
      } @else {
        Load my Liked Songs
      }
    </button>
  </header>

  @if (error(); as message) {
    <p class="likes__error" role="alert">{{ message }}</p>
  }

  @if (tracks().length > 0) {
    <ol class="likes__list">
      @for (track of tracks(); track track.id) {
        <li class="likes__item">
          <span class="likes__name">{{ track.name }}</span>
          <span class="likes__album">{{ track.albumName }}</span>
        </li>
      }
    </ol>
  } @else if (!scanning()) {
    <p class="likes__empty">Load your library to watch your Liked Songs stream in, newest first.</p>
  }
</section>
```

### `src/app/features/globe/globe-page/globe-page.scss`
```scss
.likes {
  max-width: 42rem;
  margin: 0 auto;
  padding: 2rem 1rem;

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.75rem 1rem;
  }

  &__count {
    margin: 0;
    opacity: 0.85;

    strong {
      font-size: 1.4rem;
    }
  }

  &__status {
    opacity: 0.7;
  }

  &__btn {
    margin-left: auto;
    padding: 0.5rem 1rem;
    cursor: pointer;

    &:disabled {
      cursor: default;
      opacity: 0.6;
    }
  }

  &__error {
    color: #ff6b6b;
  }

  &__list {
    margin: 1.5rem 0 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__item {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.4rem 0.6rem;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.04);
  }

  &__album {
    opacity: 0.6;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 45%;
  }

  &__empty {
    margin-top: 1.5rem;
    opacity: 0.7;
  }
}
```

## What you have now (cumulative)
Logged in (M1), every Spotify call paced by the resilience layer (M2), you can now stream your entire Liked
Songs library into a versioned `localStorage` index and watch it fill the `/globe` page live — and a reload
brings it back instantly with no network. The data spine (DTOs → mappers → domain models → a persisted feature
store) is in place for the globe (M4) to render and the resolver (M5) to color.

## Troubleshooting
| Symptom | Likely cause → fix |
|---------|--------------------|
| Count jumps to the total in one step (no ticking) | Rendering `getLikedTracksSummary()` instead of the stream → bind the count to `likedIndex.count()`, updated by `commit()` in the `for await` loop (step 07). |
| Count rises but the list stays frozen | The `tracks` computed doesn't read `likedIndex.revision()` first → add it so the plain array from `all()` is recomputed per page (step 07). |
| Reload fires a `GET /me/tracks` request | The constructor calls `loadLikes()` instead of `hydrate()` → only `hydrate()` runs on init; the scan is button-only (step 07). |
| `evm.likedIndex` missing after a scan | `commit()` never called, or `writeJson` hit `QuotaExceededError` on a huge library (R6) → confirm `commit(newest)` is inside the loop; check the console for a quota error. |
| Track names/albums are `undefined` | A `Dto` field name doesn't match Spotify's JSON (`duration_ms`, `added_at`, `album_type`) → fix `spotify.dto.ts` (step 01); `HttpClient` does no renaming. |
| `401` on `/me/tracks` | The M1 auth interceptor isn't attaching the bearer, or the token expired → log out and back in; the interceptor owns auth, not `SpotifyApi`. |
| `429` then a pause before requests resume | Expected — the M2 rate-limit gate opened a cooldown; it's the single pacer and will resume on its own. Don't add a retry here. |

## Next
Continue to **[M4 — The globe (three.js, no data)](../MILESTONE_4_globe-base/00_overview.md)**.

---
> Nav: [← Render the likes](07_render-likes.md) · [Overview](00_overview.md) · [The globe →](../MILESTONE_4_globe-base/00_overview.md)
