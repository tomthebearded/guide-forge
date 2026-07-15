# M7 · Step 01 of 8 — The playback data layer: model, DTOs, mappers
> Nav: — · [Overview](00_overview.md) · [Playback API →](02_playback-api.md)

> **This step touches 4 files, committed together** (they form one data-layer slice, so they compile as a
> set): two new domain models — `playback-state.ts`, `playlist.ts` — and two edits — the DTO file
> `spotify.dto.ts` and the mapper file `spotify.mapper.ts`.

## Glossary for this step
> **DTO** — the raw shape Spotify's JSON has, suffixed `Dto`. A **mapper** turns it into a clean domain model
> so `snake_case` API shapes never leak into the UI. See [glossary](../foundation/glossary.md#dto).
> **PlaybackState** — our reduced model of "what's playing right now": is-playing, shuffle, the track's id /
> name / artists / album art / duration / progress. Everything the header renders, and nothing it doesn't.

## Why / design
The player is just another Spotify client, so it rides the same data spine you built in M3: **DTO → mapper →
domain model → store**. Before the store can poll `/me/player`, three shapes have to exist:

1. A domain **model** for the reduced playback state (`PlaybackState`) and one for a writable **playlist**
   (`Playlist`, for the "add to playlist" menu).
2. The **DTOs** for the raw payloads: `GET /me/player`, `GET /me/player/devices`, `GET /me/playlists`, plus the
   `image` and `track` shapes they nest.
3. The **mappers** that flatten those DTOs into the models (`toPlaybackState`, `toPlaylists`).

Two mapper details are load-bearing:

- **`GET /me/player` returns `204 No Content` (a `null` body) when no device is active.** The mapper takes
  `SpotifyPlaybackStateDto | null` and returns `null` for both "no device" and "the current item isn't a
  track" (e.g. a podcast episode has no `artists`). The store treats `null` as "nothing playing".
- **Album art: pick the *smallest* image.** Spotify lists album images largest-first; the header thumbnail is
  36 px, so `smallestImageUrl` avoids downloading a 640 px cover for a tiny slot.

## Do this
1. **Create `src/app/core/models/playback-state.ts`** — the reduced now-playing model. It imports `ArtistRef`
   (created in M3) so the artist list matches the rest of the app.
2. **Create `src/app/core/models/playlist.ts`** — a playlist the user can write to. `ownerId` + `collaborative`
   decide write access (the store filters to editable playlists). `trackCount` / `snapshotId` aren't used by
   the header yet — they're populated by the mapper and consumed by the M10 playlist sync; leave them in so
   the model matches the DTO one-to-one.
3. **Edit `src/app/core/dto/spotify.dto.ts`** — append the playback / device / playlist / image / track DTOs
   below the M3 ones. **Keep the existing M3 interfaces unchanged.** The field names
   (`is_playing`, `shuffle_state`, `progress_ms`, `is_active`, `snapshot_id`, `album_type`, …) are
   **load-bearing** — they must match Spotify's JSON exactly, because `HttpClient` does no renaming.
   > The `SpotifyPlaylistDto.items: { total }` field (a track-count summary) and the `is_local` /
   > `type` fields model this project's **post-Feb-2026 Spotify** shape (decision-log
   > [R3](../foundation/decision-log.md#r3--teach-the-rate-limit-mechanism-document-dev-mode-limits-up-front) / [D6](../foundation/decision-log.md#d6--isrc-only-duplicate-detection-per-id-fan-out-after-bulk-endpoint-removal)); keep them as written.
4. **Edit `src/app/core/mappers/spotify.mapper.ts`** — add `toPlaybackState`, `toPlaylists` (+ its private
   `toPlaylist`), and the `smallestImageUrl` helper. **Keep the M3 exports** (`toLikedTracks`, `toIndexedTrack`,
   `toAlbumType`).

## Code
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

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no TypeScript errors. The four files
  compile: `playback-state.ts` and `playlist.ts` exist, `spotify.dto.ts` exports the seven new interfaces, and
  `spotify.mapper.ts` exports `toPlaybackState` + `toPlaylists`.
- [ ] `npm run lint` → clean (no unused imports, no `any`).

## If it breaks
- **`Cannot find module './artist'`** in `playback-state.ts` → the `ArtistRef` model is from M3
  (`src/app/core/models/artist.ts`); it must already exist. You're building on the M3 data layer.
- **`Property 'shuffle_state' does not exist`** (or `is_playing`, `progress_ms`) → a DTO field was renamed to
  camelCase. DTOs mirror Spotify's raw JSON exactly; only the mapper renames.
- **`toPlaybackState` type error on the argument** → its parameter must be `SpotifyPlaybackStateDto | null`
  (the endpoint returns a `null` body on 204). Don't narrow it to non-null here.
