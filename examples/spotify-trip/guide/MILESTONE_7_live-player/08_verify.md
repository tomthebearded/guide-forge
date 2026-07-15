# M7 · Verify — The live player
> Nav: [← Embed in the header](07_header-embed.md) · [Overview](00_overview.md) · [M8 · Trip / Flight mode →](../MILESTONE_8_trip-flight-mode/00_overview.md)

Run the full gate by hand, then use the **file checkpoint** to diff any file you lost track of. Start with
`npm start` running and logged in. The gate is **split per [decision-log R4](../foundation/decision-log.md#r4--split-the-m7-gate-read-only-vs-premium-controls)**:
the read-only tier works for any account; the control tiers need **Spotify Premium + an active device**.

## Done-when gate (the real test — check every box by hand)

### 0. Tooling
- [ ] `npm run format:check` → clean. `npm run lint` → clean. `npm run build` → `Application bundle generation
  complete` (no `any`, no unused).

### 1. Read-only now-playing (any account)
- [ ] Start playing any track on any Spotify client (phone, desktop app, or the web player). Within **~3 s** the
  header player shows that track's **album thumbnail, title, and artist(s)**. → DevTools → Network (filter
  `api.spotify.com`) shows a `GET .../v1/me/player` roughly every 3 s.
- [ ] Skip to the next track on that client → the header follows within **~3 s** (title + art change), no reload.
- [ ] Pause on that client → within ~3 s the header's play/pause icon shows **play** (`play_arrow`), and the
  `/me/player` polling visibly **thins** to about one call every ~9 s while idle.
- [ ] With nothing playing anywhere, the label reads *"Nothing playing"* in italics.

### 2. Optimistic controls (Premium + active device)
- [ ] Click **play/pause** in the header → the icon flips **immediately** (before the request settles) and is
  still correct after Spotify reconciles ~0.4 s later. Playback actually starts/stops on the device.
- [ ] Click **next** / **previous** → the track changes on Spotify and the header updates within ~0.4 s.
- [ ] Click **shuffle** → the shuffle button lights up (coloured `--mat-sys-primary`) immediately; the Spotify
  app shows shuffle now on, and the state survives the next poll (doesn't flip back).

### 3. ❤ toggles a Like (Premium or free — needs `user-library-modify`)
- [ ] On a track **not** in your Liked Songs, the heart is **outlined** (`favorite_border`). Click it → it
  **fills** (`favorite`) immediately, and in the Spotify app the track is now in **Liked Songs**.
- [ ] Click it again → the heart outlines again and the track leaves Liked Songs.

### 4. 404 → device auto-activation
- [ ] Leave Spotify idle long enough that no device is active (or close all Spotify clients so only a Connect
  target remains). Press **play** in the header → after a brief settle, **playback starts on an available
  device** without you manually choosing one, and the bar shows the track. (Under the hood: the 404 triggered
  `transferPlayback` + a single retry.)

### 5. 403 → Premium toast (free account)
- [ ] On a **free** Spotify account, press **play** → a red toast reads *"Playback control needs Spotify
  Premium and the latest permissions — log out and back in."* — not a silent no-op. (Read-only now-playing from
  gate 1 still works on the same free account.)

## Files after this milestone (complete — the checkpoint)

### `src/app/core/models/playback-state.ts`
```ts
import { ArtistRef } from './artist';

/** The user's current Spotify playback, reduced to what the header control renders (and, later, the globe). */
export interface PlaybackState {
  /** True while the active device is playing (paused or stopped → false). */
  isPlaying: boolean;
  /** True when shuffle is enabled on the active device. */
  shuffle: boolean;
  trackId: string | null;
  trackName: string;
  /** All track artists; the first is treated as primary for origin + photo. */
  artists: ArtistRef[];
  /** All track artists joined for a single-line label. */
  artistNames: string;
  /** Smallest available album image, for a compact thumbnail. */
  albumImageUrl: string | null;
  /** Track runtime in ms. */
  durationMs: number;
  /** Playback position into the track in ms when this state was read. */
  progressMs: number;
}
```

### `src/app/core/models/playlist.ts`
```ts
/** A playlist the user can add tracks to. */
export interface Playlist {
  id: string;
  name: string;
  /** Null when Spotify doesn't disclose it (e.g. some collaborative playlists). */
  isPublic: boolean | null;
  /** Editable by anyone who follows it — together with `ownerId` it decides write access. */
  collaborative: boolean;
  trackCount: number;
  /** Spotify user id of the owner — only the user's own playlists are writable here. */
  ownerId: string;
  /** Opaque content-version tag from Spotify; an unchanged value lets a sync skip re-paging it (M10). */
  snapshotId: string;
}
```

### `src/app/core/dto/spotify.dto.ts`
```ts
/** Raw Spotify Web API payloads. Never used outside mappers — domain code uses models. */
/** Grows in M10 (album images on tracks, playlist-item paging, full tracks, artists). */

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
  /** Opaque version tag — changes iff the playlist's contents change. Drives the incremental sync (M10). */
  snapshot_id: string;
}

export interface SpotifyPlaylistsDto {
  /** Spotify returns `null` entries for playlists the user can no longer access. */
  items: (SpotifyPlaylistDto | null)[];
  next: string | null;
}
```

### `src/app/core/mappers/spotify.mapper.ts`
```ts
/** Dto → domain mappers. Grows in M10 (album/playlist-item/track mappers). */
import {
  SpotifyImageDto,
  SpotifyPlaybackStateDto,
  SpotifyPlaylistDto,
  SpotifyPlaylistsDto,
  SpotifySavedTracksDto,
} from '../dto/spotify.dto';
import { IndexedTrack } from '../models/indexed-track';
import { AlbumType, LikedTrack } from '../models/liked-track';
import { PlaybackState } from '../models/playback-state';
import { Playlist } from '../models/playlist';

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
```

### `src/app/core/api/spotify-api.ts`
```ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  SpotifyDevicesDto,
  SpotifyMeDto,
  SpotifyPlaybackStateDto,
  SpotifyPlaylistsDto,
  SpotifySavedTracksDto,
} from '../dto/spotify.dto';
import { toLikedTracks, toPlaylists } from '../mappers/spotify.mapper';
import { LikedTrack } from '../models/liked-track';
import { Playlist } from '../models/playlist';
import { withRetry } from '../pipeline/http-retry';

/** `GET /me/tracks` and `GET /me/playlists` return at most 50 items per page. */
const PAGE_SIZE = 50;
/** Library save/remove/contains batch their uris ≤50; playlist adds cap at 100 uris. */
const ID_BATCH = 50;
const URI_BATCH = 100;

const trackUri = (id: string): string => `spotify:track:${id}`;

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
 * an adaptive rolling-window cap, and 429 cooldowns across all Spotify traffic (paging, the player
 * poll, controls). This service keeps no throttle of its own. Grows again in M10 (artist enrichment,
 * discography, playlist-membership index, library relink).
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
   * `GET /me/tracks?limit=1`. The cheap diff a boot sync uses (M9) to decide whether the library changed.
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
}
```

### `src/app/features/player/player-store.ts`
```ts
import { HttpErrorResponse } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';

import { RateLimiters } from '../../core/api/rate-limiters';
import { SpotifyApi } from '../../core/api/spotify-api';
import { TokenStore } from '../../core/auth/token-store';
import { toPlaybackState } from '../../core/mappers/spotify.mapper';
import { PlaybackState } from '../../core/models/playback-state';
import { Playlist } from '../../core/models/playlist';
import { delay } from '../../core/util/delay';
import { Toast } from '../../shared/toast';

/** How often to poll `/me/player` so external changes (skips, phone control) show up promptly. */
const POLL_INTERVAL_MS = 3_000;
/**
 * While paused/idle the state barely moves, so only actually poll every Nth tick (~9s) instead of
 * every 3s — cutting idle `/me/player` traffic by ~⅔. Controls call `refreshSoon()`, so a resume the
 * user triggers still reflects immediately; an external resume shows within ~9s.
 */
const IDLE_POLL_EVERY = 3;
/** Spotify's playback state lags a control action — re-read shortly after issuing one. */
const SETTLE_DELAY_MS = 400;
/** Give Spotify a moment to register a freshly-activated device before retrying a control. */
const DEVICE_SETTLE_MS = 450;
/** After an optimistic control, ignore lagging background polls this long so they don't revert it. */
const CONTROL_GRACE_MS = 1_500;
/** How many Liked Songs to queue when auto-starting favourites from an idle player. */
const FAVOURITES_BATCH = 50;

/**
 * Root singleton owning the user's live Spotify playback state for the header control. Polls while a
 * session exists (and the tab is visible), exposes readonly signals, and issues optimistic control
 * actions. Playback control needs a Spotify **Premium** account and an active device.
 */
@Injectable({ providedIn: 'root' })
export class PlayerStore {
  private readonly api = inject(SpotifyApi);
  private readonly tokenStore = inject(TokenStore);
  private readonly rateLimit = inject(RateLimiters).spotify;
  private readonly toast = inject(Toast);

  private readonly _state = signal<PlaybackState | null>(null);
  /** Whether the current track is one of the user's Liked Songs; null while unknown/unchecked. */
  private readonly _isFavourite = signal<boolean | null>(null);

  /** The user's editable playlists (owned or collaborative), loaded lazily for the "add to" menu. */
  private readonly _playlists = signal<Playlist[]>([]);
  private readonly _playlistsLoading = signal(false);
  /** Cached current-user id, to filter playlists the user can actually write to. */
  private myUserId: string | null = null;

  readonly state = this._state.asReadonly();
  readonly isPlaying = computed(() => this._state()?.isPlaying ?? false);
  readonly shuffle = computed(() => this._state()?.shuffle ?? false);
  readonly hasTrack = computed(() => this._state() !== null);
  readonly isFavourite = this._isFavourite.asReadonly();
  readonly playlists = this._playlists.asReadonly();
  readonly playlistsLoading = this._playlistsLoading.asReadonly();

  private pollHandle: ReturnType<typeof setInterval> | null = null;
  /** Counts poll ticks so idle polls can be thinned to every {@link IDLE_POLL_EVERY}th. */
  private pollTick = 0;
  /** Epoch ms until which background-poll results are dropped, so they can't undo an optimistic patch. */
  private suppressPollUntil = 0;
  /** Track whose saved-state was last looked up, so we only re-check on a real track change. */
  private lastFavTrackId: string | null = null;
  /** trackId → saved, so flipping back to a recent track doesn't re-hit the API. */
  private readonly favouriteMemo = new Map<string, boolean>();
  /** Track ids whose saved-state lookup is in flight, so rapid A→B→A skips don't double-fire it. */
  private readonly favouriteInFlight = new Set<string>();
  /**
   * Set once the saved-state endpoint returns 403 (token lacks `user-library-read`). The heart
   * indicator is best-effort, so we stop probing for the session — otherwise every skip re-fires the
   * same forbidden request and spams the console.
   */
  private favouriteCheckForbidden = false;

  constructor() {
    // Poll whenever a session exists — not just while the access token is unexpired. A lapsed access
    // token still has a valid refresh token, and the interceptor refreshes it lazily on the first
    // poll's 401. Gating on `isAuthenticated` would leave the bar dead after the token ages out. Stop
    // and clear on logout (`hasSession` → false).
    effect(() => {
      if (this.tokenStore.hasSession()) {
        this.startPolling();
      } else {
        this.stopPolling();
        this._state.set(null);
        this.resetFavourite();
        this._playlists.set([]);
        this.myUserId = null;
      }
    });
  }

  async togglePlay(): Promise<void> {
    // Nothing loaded on any device → kick off the user's favourites instead of a no-op resume.
    if (!this.hasTrack()) {
      await this.startFavourites();
      return;
    }
    const wasPlaying = this.isPlaying();
    this.patch({ isPlaying: !wasPlaying });
    const ok = await this.control(() => (wasPlaying ? this.api.pause() : this.api.play()));
    if (!ok) {
      this.patch({ isPlaying: wasPlaying });
    }
    this.refreshSoon();
  }

  /**
   * Press-play with nothing active: start the user's Liked Songs (shuffled) on an available device.
   * Device waking + the no-device toast are handled by {@link control}; we just supply the tracks.
   */
  private async startFavourites(): Promise<void> {
    let uris: string[];
    try {
      uris = await this.api.getLikedTrackUris(FAVOURITES_BATCH);
    } catch (error) {
      this.reportError(error);
      return;
    }
    if (uris.length === 0) {
      this.toast.error('No Liked Songs to play — like some tracks on Spotify first.');
      return;
    }
    await this.control(async () => {
      await this.api.play({ uris });
      await this.api.setShuffle(true);
    });
    this.refreshSoon();
  }

  /**
   * Start a specific track on the active device (the library "play this" affordance, used from M10).
   * Optimistically marks the bar as playing so it responds instantly.
   */
  async playTrack(uri: string): Promise<void> {
    this.patch({ isPlaying: true });
    await this.control(() => this.api.play({ uris: [uri] }));
    this.refreshSoon();
  }

  async next(): Promise<void> {
    await this.control(() => this.api.next());
    this.refreshSoon();
  }

  async previous(): Promise<void> {
    await this.control(() => this.api.previous());
    this.refreshSoon();
  }

  async toggleShuffle(): Promise<void> {
    const next = !this.shuffle();
    this.patch({ shuffle: next });
    const ok = await this.control(() => this.api.setShuffle(next));
    if (!ok) {
      this.patch({ shuffle: !next });
    }
    this.refreshSoon();
  }

  /**
   * Add or remove the current track to/from the user's Liked Songs (`user-library-modify`),
   * optimistically flipping the heart and reverting on failure. The memo is updated too, so the
   * indicator stays correct if the track is skipped to and back.
   */
  async toggleFavourite(): Promise<void> {
    const trackId = this._state()?.trackId ?? null;
    if (trackId === null) {
      return;
    }
    const current = this._isFavourite() ?? false;
    const next = !current;
    this._isFavourite.set(next);
    this.favouriteMemo.set(trackId, next);
    try {
      if (next) {
        await this.api.saveTracks([trackId]);
      } else {
        await this.api.removeSavedTracks([trackId]);
      }
    } catch (error) {
      this._isFavourite.set(current);
      this.favouriteMemo.set(trackId, current);
      const status = error instanceof HttpErrorResponse ? error.status : 0;
      this.toast.error(
        status === 403
          ? 'Liking songs needs the latest permissions — log out and back in.'
          : 'Could not update your Liked Songs.',
      );
    }
  }

  /**
   * Lazily load the playlists the user can write to (owned or collaborative), for the "add to
   * playlist" menu. No-op once loaded; failures toast and leave the list empty.
   */
  async loadPlaylists(): Promise<void> {
    if (this._playlists().length > 0 || this._playlistsLoading()) {
      return;
    }
    this._playlistsLoading.set(true);
    try {
      if (this.myUserId === null) {
        this.myUserId = (await this.api.getMe()).id;
      }
      const me = this.myUserId;
      const playlists = await this.api.getMyPlaylists();
      this._playlists.set(playlists.filter((p) => p.ownerId === me || p.collaborative));
    } catch {
      this.toast.error('Could not load your playlists.');
    } finally {
      this._playlistsLoading.set(false);
    }
  }

  /** Append the current track to a playlist by id (no undo — playlist edits stand). */
  async addCurrentToPlaylist(playlistId: string): Promise<void> {
    const trackId = this._state()?.trackId ?? null;
    if (trackId === null) {
      return;
    }
    try {
      await this.api.addTracksToPlaylist(playlistId, [`spotify:track:${trackId}`]);
      this.toast.info('Added to playlist.');
    } catch {
      this.toast.error('Could not add to the playlist.');
    }
  }

  /**
   * Run a playback control. The usual "nothing happens" cause is Spotify having no *active* device
   * (it goes idle after a while) — on a 404 we activate an available device once and retry.
   */
  private async control(action: () => Promise<void>): Promise<boolean> {
    // Don't fire a doomed control into an active rate-limit cooldown — it would only poke Spotify and
    // surface a misleading "no device" error. Tell the user what's actually happening.
    if (this.rateLimit.limited) {
      this.toast.error('Spotify is rate-limiting the app — please wait a bit and try again.');
      return false;
    }
    try {
      await action();
      return true;
    } catch (error) {
      const noDevice = error instanceof HttpErrorResponse && error.status === 404;
      if (noDevice && (await this.activateDevice())) {
        try {
          await action();
          return true;
        } catch (retryError) {
          this.reportError(retryError);
          return false;
        }
      }
      this.reportError(error);
      return false;
    }
  }

  /** Make an available Spotify Connect device active so controls can target it. */
  private async activateDevice(): Promise<boolean> {
    try {
      const devices = await this.api.getDevices();
      const target = devices.find((device) => device.isActive) ?? devices[0];
      if (target === undefined) {
        return false;
      }
      await this.api.transferPlayback(target.id, this.isPlaying());
      await delay(DEVICE_SETTLE_MS);
      return true;
    } catch {
      return false;
    }
  }

  private refreshSoon(): void {
    setTimeout(() => void this.refresh(), SETTLE_DELAY_MS);
  }

  /** Optimistically merge a partial change into the current state (no-op if nothing is loaded). */
  private patch(change: Partial<PlaybackState>): void {
    this.suppressPollUntil = Date.now() + CONTROL_GRACE_MS;
    this._state.update((state) => (state === null ? state : { ...state, ...change }));
  }

  private reportError(error: unknown): void {
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    if (status === 404) {
      this.toast.error('No active Spotify device — start playing on a device, then try again.');
    } else if (status === 401) {
      this.toast.error('Log out and back in to grant Spotify playback permissions.');
    } else if (status === 403) {
      // 403 covers both a non-Premium account and a token issued before the playback scopes —
      // re-login fixes the latter; Premium is required for the former.
      this.toast.error(
        'Playback control needs Spotify Premium and the latest permissions — log out and back in.',
      );
    } else if (status === 429) {
      this.toast.error('Spotify is rate-limiting the app — please wait a bit and try again.');
    } else {
      this.toast.error('Could not control Spotify playback — is a Spotify device active?');
    }
  }

  private async refresh(fromPoll = false): Promise<void> {
    // Mirror the poll gate: a session is enough — the interceptor refreshes a lapsed token on 401.
    if (!this.tokenStore.hasSession()) {
      return;
    }
    try {
      const dto = await this.api.getPlaybackState();
      // Re-check after the await: a control action issued while this poll was in flight just set an
      // optimistic state, and Spotify's read still lags it — applying it now would revert the UI.
      if (fromPoll && Date.now() < this.suppressPollUntil) {
        return;
      }
      const state = toPlaybackState(dto);
      this._state.set(state);
      this.checkFavourite(state?.trackId ?? null);
    } catch {
      // Polling errors are transient and noisy — swallow them; control actions report their own.
    }
  }

  /**
   * On a track change, look up whether the new song is one of the user's Liked Songs. This only drives
   * the heart indicator — it never feeds the globe's scanned dataset, so playing songs (favourite or
   * not) can't pollute the map.
   */
  private checkFavourite(trackId: string | null): void {
    if (trackId === this.lastFavTrackId) {
      return;
    }
    this.lastFavTrackId = trackId;
    if (trackId === null || this.favouriteCheckForbidden) {
      this._isFavourite.set(null);
      return;
    }
    const memoised = this.favouriteMemo.get(trackId);
    if (memoised !== undefined) {
      this._isFavourite.set(memoised);
      return;
    }
    this._isFavourite.set(null); // unknown until the lookup returns
    if (this.favouriteInFlight.has(trackId)) {
      return; // a lookup for this exact track is already running — don't duplicate it
    }
    this.favouriteInFlight.add(trackId);
    this.api
      .areTracksSaved([trackId])
      .then((saved) => {
        const value = saved[0] ?? false;
        this.favouriteMemo.set(trackId, value);
        if (this.lastFavTrackId === trackId) {
          this._isFavourite.set(value); // ignore if the track changed again meanwhile
        }
      })
      .catch((error: unknown) => {
        // Best-effort: a 403 means the token can't read the library at all, so stop probing — every
        // skip would otherwise repeat it.
        if (error instanceof HttpErrorResponse && error.status === 403) {
          this.favouriteCheckForbidden = true;
        }
      })
      .finally(() => this.favouriteInFlight.delete(trackId));
  }

  private resetFavourite(): void {
    this._isFavourite.set(null);
    this.lastFavTrackId = null;
    this.favouriteMemo.clear();
    this.favouriteInFlight.clear();
    this.favouriteCheckForbidden = false;
  }

  private startPolling(): void {
    if (this.pollHandle !== null) {
      return;
    }
    void this.refresh();
    this.pollTick = 0;
    this.pollHandle = setInterval(() => {
      this.pollTick++;
      // Skip (don't queue) while hidden or rate-limited: the interval fires regardless, so deferring
      // these requests would pile up dozens that all fire when the cooldown lifts, re-tripping it.
      if (document.visibilityState !== 'visible' || this.rateLimit.limited) {
        return;
      }
      // Full 3s cadence while actively playing; back off to every IDLE_POLL_EVERY ticks when paused or
      // idle, where the state is static and frequent re-reads buy nothing.
      if (!this.isPlaying() && this.pollTick % IDLE_POLL_EVERY !== 0) {
        return;
      }
      void this.refresh(true);
    }, POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.pollHandle !== null) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }
}
```

### `src/app/features/player/player-bar/player-bar.ts`
```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { PlayerStore } from '../player-store';

/**
 * Compact Spotify player for the header: shows the current track and drives shuffle / previous /
 * play-pause / next, plus liking the current song and adding it to a playlist, through
 * {@link PlayerStore}. Smart by exception — it owns no state, only wiring the root playback store to a
 * few buttons, so it lives self-contained rather than as dumb IO.
 */
@Component({
  selector: 'app-player-bar',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './player-bar.html',
  styleUrl: './player-bar.scss',
})
export class PlayerBar {
  private readonly store = inject(PlayerStore);

  protected readonly state = this.store.state;
  protected readonly isPlaying = this.store.isPlaying;
  protected readonly shuffle = this.store.shuffle;
  protected readonly isFavourite = this.store.isFavourite;
  protected readonly playlists = this.store.playlists;
  protected readonly playlistsLoading = this.store.playlistsLoading;

  protected toggleShuffle(): void {
    void this.store.toggleShuffle();
  }

  protected previous(): void {
    void this.store.previous();
  }

  protected togglePlay(): void {
    void this.store.togglePlay();
  }

  protected next(): void {
    void this.store.next();
  }

  protected toggleFavourite(): void {
    void this.store.toggleFavourite();
  }

  protected loadPlaylists(): void {
    void this.store.loadPlaylists();
  }

  protected addToPlaylist(playlistId: string): void {
    void this.store.addCurrentToPlaylist(playlistId);
  }
}
```

### `src/app/features/player/player-bar/player-bar.html`
```html
<div class="player">
  @let track = state();
  <div class="now-playing" [class.empty]="!track">
    @if (track?.albumImageUrl; as art) {
      <img class="art" [src]="art" alt="" />
    }
    <div class="meta">
      <span class="title">{{ track ? track.trackName : 'Nothing playing' }}</span>
      @if (track) {
        <span class="artist">{{ track.artistNames }}</span>
      }
    </div>
  </div>

  <div class="controls">
    @if (track) {
      <button
        mat-icon-button
        class="fav"
        [class.on]="isFavourite()"
        (click)="toggleFavourite()"
        [title]="isFavourite() ? 'Remove from Liked Songs' : 'Add to Liked Songs'"
        [attr.aria-label]="isFavourite() ? 'Remove from Liked Songs' : 'Add to Liked Songs'"
      >
        <mat-icon>{{ isFavourite() ? 'favorite' : 'favorite_border' }}</mat-icon>
      </button>
      <button
        mat-icon-button
        [matMenuTriggerFor]="playlistMenu"
        (menuOpened)="loadPlaylists()"
        title="Add to playlist"
        aria-label="Add current track to a playlist"
      >
        <mat-icon>playlist_add</mat-icon>
      </button>
    }
    <button
      mat-icon-button
      class="shuffle"
      [class.on]="shuffle()"
      (click)="toggleShuffle()"
      title="Shuffle"
      aria-label="Toggle shuffle"
    >
      <mat-icon>shuffle</mat-icon>
    </button>
    <button mat-icon-button (click)="previous()" title="Previous" aria-label="Previous track">
      <mat-icon>skip_previous</mat-icon>
    </button>
    <button
      mat-icon-button
      (click)="togglePlay()"
      [title]="isPlaying() ? 'Pause' : 'Play'"
      [attr.aria-label]="isPlaying() ? 'Pause' : 'Play'"
    >
      <mat-icon>{{ isPlaying() ? 'pause' : 'play_arrow' }}</mat-icon>
    </button>
    <button mat-icon-button (click)="next()" title="Next" aria-label="Next track">
      <mat-icon>skip_next</mat-icon>
    </button>
  </div>

  <mat-menu #playlistMenu="matMenu">
    @if (playlistsLoading()) {
      <button mat-menu-item disabled>Loading playlists…</button>
    } @else if (playlists().length === 0) {
      <button mat-menu-item disabled>No editable playlists</button>
    } @else {
      @for (playlist of playlists(); track playlist.id) {
        <button mat-menu-item (click)="addToPlaylist(playlist.id)">{{ playlist.name }}</button>
      }
    }
  </mat-menu>
</div>
```

### `src/app/features/player/player-bar/player-bar.scss`
```scss
.player {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.now-playing {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  // Keep the variable-length track label from pushing the controls off-screen.
  max-width: 16rem;

  &.empty .title {
    color: var(--mat-sys-on-surface-variant);
    font-style: italic;
  }
}

.art {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  object-fit: cover;
  flex: 0 0 auto;
}

.meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.2;
}

.title,
.artist {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title {
  font-size: 0.85rem;
  font-weight: 500;
}

.artist {
  font-size: 0.75rem;
  color: var(--mat-sys-on-surface-variant);
}

.controls {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
}

.shuffle.on,
.fav.on {
  color: var(--mat-sys-primary);
}

// Below the header's mobile breakpoint, drop the track label and keep just the controls.
@media (max-width: 599px) {
  .now-playing {
    display: none;
  }
}
```

### `src/app/shared/components/header/header.ts`
```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';

import { SpotifyAuth } from '../../../core/auth/spotify-auth';
import { TokenStore } from '../../../core/auth/token-store';
import { PlayerBar } from '../../../features/player/player-bar/player-bar';

@Component({
  selector: 'app-header',
  imports: [RouterLink, MatToolbarModule, MatButtonModule, PlayerBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly auth = inject(SpotifyAuth);
  private readonly router = inject(Router);

  /** A session exists (matching the route guard) — drives whether the app chrome shows. */
  protected readonly hasSession = inject(TokenStore).hasSession;

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
  @if (hasSession()) {
    <button mat-button (click)="logout()">Log out</button>
  }
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
```

## What you have now (cumulative)
On top of the logged-in, resilient, globe-colouring app (M0–M6), the header now carries a **live Spotify
player**. A root-singleton `PlayerStore` polls `/me/player` every ~3 s (thinning to ~9 s while idle, skipping
while hidden or rate-limited), so the header reflects whatever you're playing on any Spotify client — for any
account. With Premium + an active device, its buttons drive playback **optimistically** (instant UI, reconcile,
revert), auto-activate a device on a 404, like/unlike the current track, and add it to a playlist; failures
map to specific toasts (Premium/permissions on 403, re-login on 401, rate-limit on 429). The favourite
indicator is header-only and never touches the globe dataset.

## Troubleshooting
| Symptom | Likely cause → fix |
|---------|--------------------|
| Header shows "Nothing playing" though music plays elsewhere | The poll isn't running (nothing injected `PlayerStore`) — confirm the header renders `<app-player-bar>` and you're logged in (`hasSession()` true). Or Spotify has no *active* device reporting to `/me/player` (open the app on that device). |
| No `/me/player` requests in Network | `PlayerBar` not in the header `imports`, or the `@if (hasSession())` guard is false → check login + header wiring (step 07). |
| Play/pause icon flips then flips back within ~2 s | A lagging poll reverted the optimistic patch — the `suppressPollUntil` grace window (set in `patch`, checked in `refresh`) isn't wired: confirm `patch()` sets it and `refresh(fromPoll=true)` returns early while `Date.now() < suppressPollUntil`. |
| Every control toasts "needs Premium" | Free account (expected — R4), **or** a token issued before the playback scopes → log out and back in so the new scopes apply. |
| Press play does nothing, no toast | The 404 device-activation path found no device to transfer to (`getDevices()` empty) → open Spotify on a phone/desktop once so a Connect device exists, then retry. |
| ❤ never fills / stays hidden | The saved-state lookup hit a 403 and self-disabled for the session (`favouriteCheckForbidden`) — the token lacks `user-library-read`; log out/in. Or `/me/library/contains` returned an unexpected shape (it throws loudly — check the console). |
| Idle polling still fires every 3 s | `isPlaying()` is stuck true (Spotify reports playing) — the thinning only applies while paused/idle; that's correct. |
| `NG0203: inject() ... injection context` | An `inject()` moved out of a field initializer / constructor in `PlayerStore` or `PlayerBar` — keep all `inject()` calls at field-declaration level. |

## Next
Continue to **[M8 — Trip / Flight mode](../MILESTONE_8_trip-flight-mode/00_overview.md)**: the current track
(from this player's `PlaybackState`) drives a plane flying across the globe from the previous artist's country
to the new one — where `getNextQueuedArtist()` and the globe's reaction to the live track finally come into
play.
