# M10 · Step 03 of 18 — Grow the Spotify client: discography + relink write endpoints
> Nav: [← The track-matching engine](02_track-matching.md) · [Overview](00_overview.md) · [The library caches →](04_library-caches.md)

> **This step touches 3 files, committed together:** `core/dto/spotify.dto.ts` (album/track DTOs),
> `core/mappers/spotify.mapper.ts` (album/track mappers), and `core/api/spotify-api.ts` (the M10 library
> endpoints). They're one API surface, so we grow them together. The DTO + mapper additions are shown whole;
> the long `spotify-api.ts` is taught as additions and shown complete in [step 18](18_verify.md).

## Glossary for this step
> **per-id fan-out** — standing in for a removed bulk endpoint by fetching each id in its own request, a bounded
> number in flight at once (via `mapWithConcurrency` from M2). The Feb-2026 Dev-Mode migration removed the bulk
> `GET /tracks?ids=` / `GET /artists?ids=`, so `getTracks` and `getAlbumTrackIdsBatch` fan out. See
> [decision-log D6](../foundation/decision-log.md#d6--isrc-only-duplicate-detection-per-id-fan-out-after-bulk-endpoint-removal).
> **ISRC enrichment** — album-track lists (`GET /albums/{id}/tracks`) carry *no* ISRC; only `GET /tracks/{id}`
> does. So we get each album's track *ids* first, then fetch the full tracks to attach ISRC + playability.

## Why / design
The console needs to read discographies and write relink/follow changes. Five reads + three writes land here.

**Reads:**
1. **`getArtistAlbums(artistId)`** — the artist's albums/singles/compilations (`appears_on` excluded — those are
   other artists' releases). Paged; note `GET /artists/{id}/albums` caps `limit` at **10**, not 50.
2. **`getAlbumTrackIds(albumId)`** — the track ids on one album, in order.
3. **`getAlbumTrackIdsBatch(albumIds)`** — the id lists for many albums at once, per-id fan-out so a deep
   discography doesn't serialise into one round-trip per album. A failed album yields `[]`, never rejecting the batch.
4. **`getTracks(ids, onProgress?)`** — full tracks (ISRC + playability) for any number of ids, per-id fan-out; a
   track that can't be resolved drops out. This is the **only** source carrying ISRC.

**Writes:**
5. **`followArtists` / `unfollowArtists`** — reuse the M7 `saveToLibrary` / `removeFromLibrary` helpers against
   artist URIs (following an artist = its URI being in the library, post-migration).
6. **`addTracksToPlaylist` gains a `position`** parameter — insert at a specific 0-based slot instead of the end,
   used by the position-preserving relink substitution (step 08).
7. **`removeTracksFromPlaylist`** — remove all occurrences of the given track URIs from a playlist.

> **Recurring model:** the M2 rate-limit gate is the single pacer — none of these add their own throttle;
> `withRetry` wraps each request (it excludes 429, [decision-log D2](../foundation/decision-log.md#d2--single-rate-limit-authority-429-excluded-from-retry)) and `mapWithConcurrency` bounds the per-id fan-out.

**Already present (do not re-add):** `getArtist` (M8), `getArtistGenres` + `getFollowedArtistsContains` + the
`artistUri` helper (M9), `saveTracks` / `removeSavedTracks` / `saveToLibrary` / `removeFromLibrary` +
`getMyPlaylists` + `getPlaylistTrackRefs` (M7/M9), `largestImageUrl` + `toAlbumType` (M8/M3).

## Do this
1. In `src/app/core/dto/spotify.dto.ts`, add the five album/track DTOs below (leave everything else). The
   simplified `SpotifyAlbumTrackDto` carries **no** ISRC — the comment marks that; `SpotifyFullTrackDto` is where
   ISRC + `is_playable` come together.
2. In `src/app/core/mappers/spotify.mapper.ts`, add `ALBUM_GROUPS`, `toAlbums`/`toAlbum`, `toAlbumTracks`,
   `toAlbumGroup`, and extend the DTO import + the model import (`Album, AlbumGroup, AlbumTrack`).
3. In `src/app/core/api/spotify-api.ts`:
   - Extend the DTO import (`SpotifyAlbumTracksDto`, `SpotifyArtistAlbumsDto`, `SpotifyFullTrackDto`) and the
     mapper import (`toAlbums`, `toAlbumTracks`); add `import { Album, AlbumTrack } from '../models/album';`.
   - Add the constant `ARTIST_ALBUMS_PAGE_SIZE = 10`.
   - Add the four read methods, the two follow methods, `removeTracksFromPlaylist`, and add the optional
     `position` parameter to the existing `addTracksToPlaylist`.

## Code
### `src/app/core/dto/spotify.dto.ts` — add these five interfaces
```ts
/** One album from `GET /artists/{id}/albums`. */
export interface SpotifyAlbumDto {
  id: string;
  name: string;
  album_type: string;
  /** This album's relation to the artist: `album` | `single` | `compilation` | `appears_on`. */
  album_group: string;
  release_date: string;
  total_tracks: number;
  images: SpotifyImageDto[];
}

export interface SpotifyArtistAlbumsDto {
  items: SpotifyAlbumDto[];
  next: string | null;
}

/** Simplified track from `GET /albums/{id}/tracks` — note: carries no ISRC (use `GET /tracks`). */
export interface SpotifyAlbumTrackDto {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  track_number: number;
  disc_number: number;
  is_playable?: boolean;
  artists: SpotifyArtistRefDto[];
}

export interface SpotifyAlbumTracksDto {
  items: SpotifyAlbumTrackDto[];
  next: string | null;
}

/** Full track from `GET /tracks/{id}` — the only place ISRC + market playability come together. */
export interface SpotifyFullTrackDto {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  track_number: number;
  disc_number: number;
  is_playable?: boolean;
  external_ids?: { isrc?: string };
  artists: SpotifyArtistRefDto[];
}
```

### `src/app/core/mappers/spotify.mapper.ts` — add the imports + mappers
```ts
// Extend the existing dto import with:  SpotifyAlbumDto, SpotifyArtistAlbumsDto, SpotifyFullTrackDto
// Extend the existing model import from '../models/album' with:  Album, AlbumGroup, AlbumTrack
// Add this constant beside the existing ALBUM_TYPES:
const ALBUM_GROUPS: readonly AlbumGroup[] = ['album', 'single', 'compilation', 'appears_on'];

export function toAlbums(dto: SpotifyArtistAlbumsDto): Album[] {
  return dto.items.map(toAlbum);
}

function toAlbum(dto: SpotifyAlbumDto): Album {
  return {
    id: dto.id,
    name: dto.name,
    albumType: toAlbumType(dto.album_type),
    albumGroup: toAlbumGroup(dto.album_group),
    releaseDate: dto.release_date,
    totalTracks: dto.total_tracks,
    imageUrl: largestImageUrl(dto.images),
  };
}

/** Build discography tracks from full-track payloads (the only source carrying ISRC). */
export function toAlbumTracks(dtos: SpotifyFullTrackDto[]): AlbumTrack[] {
  return dtos.map((dto) => ({
    id: dto.id,
    name: dto.name,
    uri: dto.uri,
    isrc: dto.external_ids?.isrc ?? null,
    durationMs: dto.duration_ms,
    trackNumber: dto.track_number,
    discNumber: dto.disc_number,
    isPlayable: dto.is_playable ?? true,
    artistIds: dto.artists.map((artist) => artist.id),
  }));
}

function toAlbumGroup(value: string): AlbumGroup {
  return (ALBUM_GROUPS as readonly string[]).includes(value) ? (value as AlbumGroup) : 'album';
}
```

### `src/app/core/api/spotify-api.ts` — additions
```ts
// 1) Imports — extend the existing ones:
//    from '../dto/spotify.dto':      add  SpotifyAlbumTracksDto, SpotifyArtistAlbumsDto, SpotifyFullTrackDto
//    from '../mappers/spotify.mapper': add  toAlbums, toAlbumTracks
//    add new import:                 import { Album, AlbumTrack } from '../models/album';

// 2) Constant — add beside PAGE_SIZE:
/** `GET /artists/{id}/albums` caps `limit` at 10 (unlike most list endpoints' 50). */
const ARTIST_ALBUMS_PAGE_SIZE = 10;

// 3) Methods — add inside the SpotifyApi class:

/**
 * An artist's full discography for the user's market — albums, singles/EPs, and compilations,
 * following the `next` cursor. `appears_on` is excluded (other artists' releases).
 */
async getArtistAlbums(artistId: string): Promise<Album[]> {
  const base = environment.spotify.apiBaseUrl;
  const groups = 'album,single,compilation';
  let url: string | null =
    `${base}/artists/${artistId}/albums?include_groups=${groups}&limit=${ARTIST_ALBUMS_PAGE_SIZE}`;
  const albums: Album[] = [];
  while (url !== null) {
    const next: string = url;
    const page = await withRetry(() => firstValueFrom(this.http.get<SpotifyArtistAlbumsDto>(next)));
    albums.push(...toAlbums(page));
    url = page.next;
  }
  return albums;
}

/**
 * Track-id lists for several albums at once, order preserved, `FETCH_CONCURRENCY` in flight —
 * so a deep discography doesn't serialise into one round-trip per album. A failed album yields an
 * empty list rather than rejecting the whole batch.
 */
async getAlbumTrackIdsBatch(albumIds: string[]): Promise<string[][]> {
  return mapWithConcurrency(
    albumIds,
    (id) => this.getAlbumTrackIds(id).catch((): string[] => []),
    FETCH_CONCURRENCY,
  );
}

/** Track ids on an album, in track order, following the `next` cursor. */
async getAlbumTrackIds(albumId: string): Promise<string[]> {
  const base = environment.spotify.apiBaseUrl;
  let url: string | null = `${base}/albums/${albumId}/tracks?limit=${PAGE_SIZE}`;
  const ids: string[] = [];
  while (url !== null) {
    const next: string = url;
    const page = await withRetry(() => firstValueFrom(this.http.get<SpotifyAlbumTracksDto>(next)));
    for (const item of page.items) {
      ids.push(item.id);
    }
    url = page.next;
  }
  return ids;
}

/**
 * Full tracks (with ISRC + market playability) for any number of ids. The Feb 2026 Dev Mode
 * migration removed the bulk `GET /tracks?ids=`, so each id is fetched individually,
 * `FETCH_CONCURRENCY` at a time. A track that can't be resolved drops out (null → filtered).
 */
async getTracks(
  ids: string[],
  onProgress?: (completed: number, total: number) => void,
): Promise<AlbumTrack[]> {
  const base = environment.spotify.apiBaseUrl;
  const dtos = await mapWithConcurrency(
    ids,
    (id) =>
      withRetry(() => firstValueFrom(this.http.get<SpotifyFullTrackDto>(`${base}/tracks/${id}`)))
        .then((dto): SpotifyFullTrackDto | null => dto)
        .catch(() => null),
    FETCH_CONCURRENCY,
    onProgress,
  );
  return toAlbumTracks(dtos.filter((dto): dto is SpotifyFullTrackDto => dto !== null));
}

/** Follow artists (saving the artist URIs to the library). */
async followArtists(ids: string[]): Promise<void> {
  await this.saveToLibrary(ids.map(artistUri));
}

/** Unfollow artists (removing the artist URIs from the library). */
async unfollowArtists(ids: string[]): Promise<void> {
  await this.removeFromLibrary(ids.map(artistUri));
}

/**
 * Remove all occurrences of the given track URIs from a playlist (batched ≤100). Endpoint renamed
 * `…/tracks` → `…/items`; the migration guide doesn't show the new DELETE body, so the old
 * `tracks: [{ uri }]` shape follows the documented `tracks` → `items` field rename.
 */
async removeTracksFromPlaylist(playlistId: string, uris: string[]): Promise<void> {
  const base = environment.spotify.apiBaseUrl;
  for (const batch of chunk(uris, URI_BATCH)) {
    await withRetry(() =>
      firstValueFrom(
        this.http.delete(`${base}/playlists/${playlistId}/items`, {
          body: { items: batch.map((uri) => ({ uri })) },
        }),
      ),
    );
  }
}
```

### `src/app/core/api/spotify-api.ts` — REPLACE the existing `addTracksToPlaylist` (add `position`)
```ts
/**
 * Append track URIs to a playlist (batched ≤100). Endpoint renamed `…/tracks` → `…/items`. Pass
 * `position` to insert at a specific 0-based index instead of the end — used by the relink
 * substitution to drop the new copy where the old one sat, preserving playlist order.
 */
async addTracksToPlaylist(playlistId: string, uris: string[], position?: number): Promise<void> {
  const base = environment.spotify.apiBaseUrl;
  for (const batch of chunk(uris, URI_BATCH)) {
    const body = position === undefined ? { uris: batch } : { uris: batch, position };
    await withRetry(() =>
      firstValueFrom(this.http.post(`${base}/playlists/${playlistId}/items`, body)),
    );
  }
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — the DTO/mapper/API additions compile;
      `mapWithConcurrency`, `FETCH_CONCURRENCY`, `artistUri`, `saveToLibrary`, `chunk`, `URI_BATCH` all resolve
      (from M2 / M9 / M7).
- [ ] `npm run lint` → clean, no `any` (`getTracks` returns `AlbumTrack[]`, `getAlbumTrackIdsBatch` `string[][]`).

## If it breaks
- **`Cannot redeclare 'artistUri' / 'FETCH_CONCURRENCY'`** → those were added in M9; add the new album/track
  imports to the existing lines, don't reintroduce the M9 helpers/constants.
- **Discography track lists come back with no ISRC** → you mapped from `SpotifyAlbumTrackDto` (album-tracks
  endpoint carries none); ISRC only rides `SpotifyFullTrackDto` (`GET /tracks`), which `getTracks` uses.
- **`getArtistAlbums` returns only ~10 albums** → that endpoint's `limit` maxes at 10; the `while (next)` loop is
  what pages the rest — don't drop it.
- **`removeTracksFromPlaylist` 400s** → the DELETE body must be `{ items: [{ uri }] }` (migrated field name), not
  `{ tracks: … }` or `{ uris: … }`.

---
> Nav: [← The track-matching engine](02_track-matching.md) · [Overview](00_overview.md) · [The library caches →](04_library-caches.md)
