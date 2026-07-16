# M7 · Step 02 of 8 — The playback slice of `SpotifyApi`
> Nav: [← Playback data layer](01_playback-data-layer.md) · [Overview](00_overview.md) · [PlayerStore: polling read core →](03_player-store-polling.md)

## Glossary for this step
> **Spotify Connect device** — any Spotify client that can play audio (phone, desktop app, web player, speaker).
> Playback control targets the **active** one; if none is active, control endpoints return `404`.
> **`/me/library`** — this project's post-Feb-2026 Spotify shape: one generic library endpoint keyed by URI
> (`PUT` to save, `DELETE` to remove, `GET …/contains` to check), replacing the old per-entity
> `PUT /me/tracks` etc. See decision-log [D6](../foundation/decision-log.md#d6--isrc-only-duplicate-detection-per-id-fan-out-after-bulk-endpoint-removal).

## Why / design
`SpotifyApi` is the one typed client every Spotify call goes through (convention:
[all HTTP via `core/api/`](../foundation/conventions.md)). It keeps **no throttle of its own** — the M2
rate-limit gate (via `rateLimitInterceptor`) is the single pacer, and the M1 auth interceptor adds the bearer.
So each method here is just a typed `firstValueFrom(this.http…)` call; pacing, retries-on-5xx, and 429
cooldowns happen underneath.

This step adds the **playback slice** on top of the M3 file (`streamLikedTracks`, `getLikedTracksSummary`,
`getLikedTrackUris`, `getMe`):

- **Read:** `getPlaybackState` (`GET /me/player`), `getDevices` (`GET /me/player/devices`).
- **Transport:** `play`, `pause`, `next`, `previous`, `setShuffle`, `transferPlayback`.
- **Library ❤:** `saveTracks`, `removeSavedTracks`, `areTracksSaved` — all built on the generic `/me/library`
  helpers (`saveToLibrary` / `removeFromLibrary` / `libraryContains`), batching URIs ≤50.
- **Playlists:** `getMyPlaylists` (paged), `addTracksToPlaylist` (batched ≤100).

> 📚 Note — `getPlaybackState` is typed `Promise<SpotifyPlaybackStateDto | null>` because Spotify replies
> **`204 No Content`** (an empty body → `null`) when no device is active. The mapper (step 01) already handles
> that `null`.

Two small design points:

- **HTTP verbs match Spotify's:** transport toggles are `PUT` (`/play`, `/pause`, `/shuffle`), skips are `POST`
  (`/next`, `/previous`). `play` optionally takes `uris` (start a specific set) and `deviceId` (target/wake a
  device); with neither, it resumes the active device.
- **`libraryContains` validates the response shape.** The generic endpoint's response isn't documented, so we
  assert it's an ordered `boolean[]` and throw loudly if not — better than silently corrupting "is this
  liked?" downstream.

`SpotifyApi` **grows again in M10** (artist enrichment, discography, playlist-membership index, library
relink) — those per-id fan-out methods use `mapWithConcurrency` (built in M2) and aren't part of the player.

## Do this
1. In `src/app/core/api/spotify-api.ts`, **replace the whole file** with the version below. It is the M3 file
   plus the playback slice — the M3 methods are unchanged.
2. Note the new module-level helpers at the top: `chunk` (splits a URI list into batches) and `trackUri`
   (`id → spotify:track:<id>`), plus the `ID_BATCH = 50` / `URI_BATCH = 100` constants. These are
   **load-bearing sizes** — Spotify caps library batches at 50 URIs and playlist adds at 100.

## Code
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

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors. `SpotifyApi` now exports the
  playback methods (`getPlaybackState`, `play`, `pause`, `next`, `previous`, `setShuffle`, `getDevices`,
  `transferPlayback`, `areTracksSaved`, `saveTracks`, `removeSavedTracks`, `getMyPlaylists`,
  `addTracksToPlaylist`) alongside the M3 methods.
- [ ] `npm run lint` → clean (the new DTO/mapper imports are all used).

## If it breaks
- **`'mapWithConcurrency' is declared but never read`** (or an unused `artistUri`) → you pasted M10 helpers.
  The M7 slice needs only `chunk` and `trackUri`; the per-id fan-out arrives in M10.
- **`Cannot find name 'SpotifyDevicesDto'`** → the DTO wasn't added in step 01, or the import list here is
  incomplete. Both files must be in sync.
- **`play`/`pause` compile but 403 at runtime later** → not a build issue; that's the Premium/permission path
  the store handles in step 04. Nothing to fix here.

---
> Nav: [← Playback data layer](01_playback-data-layer.md) · [Overview](00_overview.md) · [PlayerStore: polling read core →](03_player-store-polling.md)
