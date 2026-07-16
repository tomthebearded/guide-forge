# M9 · Step 02 of 14 — Grow the Spotify client: playlist refs, genres, follow state
> Nav: [← Playlist model + cache](01_playlist-model-cache.md) · [Overview](00_overview.md) · [The PlaylistIndex service →](03_playlist-index.md)

> **This step touches 3 files, committed together:** `core/dto/spotify.dto.ts` (add the playlist-items DTOs),
> `core/mappers/spotify.mapper.ts` (add `toPlaylistTrackRefs`), and `core/api/spotify-api.ts` (add the three M9
> endpoints). They're one API surface, so we grow them together. The DTO + mapper are shown whole (short); the
> long `spotify-api.ts` is taught as additions here and shown complete in [step 15](15_verify.md).

## Glossary for this step
> **per-id fan-out** — standing in for a removed bulk endpoint by fetching each id in its own request, a bounded
> number in flight at once. The Feb-2026 Dev-Mode migration removed Spotify's bulk `GET /artists?ids=` /
> `GET /tracks?ids=`, so we fan out via `mapWithConcurrency` ([decision-log D6](../foundation/decision-log.md#d6--isrc-only-duplicate-detection-per-id-fan-out-after-bulk-endpoint-removal)).
> **`fields` mask** — a query param that trims a Spotify list response to only the properties you name, so a
> playlist-items page carries just what the membership index needs instead of the full track objects.

## Why / design
Three new pieces of Spotify data feed M9:

1. **Playlist track refs** (`getPlaylistTrackRefs`) — the catalog tracks on one playlist, so step 03's index
   knows what each playlist holds. Trimmed with a `fields` mask; paged via the `next` cursor.
2. **Artist genres** (`getArtistGenres`) — the genre tags that drive the globe genre filter. Fanned out per-id
   at concurrency 6. It returns **`string[] | null` per id**: a real list (possibly empty = "genuinely no
   tags") on success, `null` when the fetch *failed*, so the caller can tell "confirmed none" from "not fetched
   yet" and retry only the latter — a transient blip must never be persisted as permanent genre loss.
3. **Follow state** (`getFollowedArtistsContains`) — whether each artist is followed, reusing the M7
   `libraryContains` helper against artist URIs (following an artist = its URI being in the library).

**Recurring model:** the M2 rate-limit gate is the single pacer — none of these methods add their own throttle;
`withRetry` wraps each request (it deliberately excludes 429, [decision-log D2](../foundation/decision-log.md#d2--single-rate-limit-authority-429-excluded-from-retry)), and `mapWithConcurrency` (from M2's
`http-retry`) bounds how many per-id fetches are in flight.

## Do this
1. In `src/app/core/dto/spotify.dto.ts`, add the two playlist-items DTOs below the existing `SpotifyPlaylistsDto`
   (leave everything else). The per-entry property is **`item`** (not `track`): the Feb-2026 migration renamed
   it (`tracks.tracks.track` → `items.items.item`).
2. In `src/app/core/mappers/spotify.mapper.ts`, add `toPlaylistTrackRefs` and its imports. It drops local files,
   podcast episodes, and null items, keeping only catalog tracks.
3. In `src/app/core/api/spotify-api.ts`:
   - Extend the imports: add `SpotifyPlaylistTracksDto` to the DTO import, `toPlaylistTrackRefs` to the mapper
     import, `PlaylistTrackRef` from `../models/playlist-index`, and `mapWithConcurrency` alongside `withRetry`.
   - Add the constants `FETCH_CONCURRENCY = 6`, `PLAYLIST_PAGE_SIZE = 100`, the `PLAYLIST_ITEM_FIELDS` mask, and
     the `artistUri` helper.
   - Add the three methods `getArtistGenres`, `getPlaylistTrackRefs`, `getFollowedArtistsContains`.

## Code
### `src/app/core/dto/spotify.dto.ts` — add these two interfaces (below `SpotifyPlaylistsDto`)
```ts
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

### `src/app/core/mappers/spotify.mapper.ts` — add the import + mapper
```ts
// Add to the existing dto import:  SpotifyPlaylistTracksDto
// Add this new import line:
import { PlaylistTrackRef } from '../models/playlist-index';

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
```

### `src/app/core/api/spotify-api.ts` — additions
```ts
// 1) Imports — extend the existing ones:
//    from '../dto/spotify.dto':      add  SpotifyPlaylistTracksDto
//    from '../mappers/spotify.mapper': add  toPlaylistTrackRefs
//    add new import:                 import { PlaylistTrackRef } from '../models/playlist-index';
//    from '../pipeline/http-retry':  add  mapWithConcurrency  (alongside withRetry)

// 2) Constants — add near the top (beside PAGE_SIZE / ID_BATCH / URI_BATCH):
/**
 * Per-id fetches in flight when standing in for a removed bulk endpoint. 6 keeps the genre
 * enrichment brisk while staying clear of Spotify's rolling rate limit (`withRetry` honours 429).
 */
const FETCH_CONCURRENCY = 6;
/** `GET /playlists/{id}/items` allows up to 100 items per page. */
const PLAYLIST_PAGE_SIZE = 100;
/** Field mask trimming playlist-item payloads to what the membership index needs. */
const PLAYLIST_ITEM_FIELDS =
  'items(item(id,name,uri,duration_ms,is_local,type,artists(id),album(name,images))),next';

const artistUri = (id: string): string => `spotify:artist:${id}`;

// 3) Methods — add inside the SpotifyApi class, after the M8 flight-lookup methods, before the closing `}`:

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
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — the DTO/mapper/API additions
      compile; `mapWithConcurrency` and `libraryContains` resolve (both from M2 / M7).
- [ ] `npm run lint` → clean, no `any` (`getArtistGenres` returns `(string[] | null)[]`, not `any[]`).

## If it breaks
- **`Property 'libraryContains' is private`/not found** → it was added in M7; confirm `getFollowedArtistsContains`
  lives in the same `SpotifyApi` class (so the private helper is reachable).
- **`mapWithConcurrency is not exported`** → it's from M2's `core/pipeline/http-retry.ts`; add it to that
  import line, don't re-import `withRetry` twice.
- **Playlist items come back with `undefined` track fields** → the `fields` mask uses `item(...)` (migrated
  name), not `track(...)`; a typo in `PLAYLIST_ITEM_FIELDS` silently drops fields.

---
> Nav: [← Playlist model + cache](01_playlist-model-cache.md) · [Overview](00_overview.md) · [The PlaylistIndex service →](03_playlist-index.md)
