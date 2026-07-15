# M3 · Step 03 of 07 — The crossing: the mapper
> Nav: [← Domain models](02_domain-models.md) · [Overview](00_overview.md) · [`streamLikedTracks()` →](04_stream-liked-tracks.md)

## Glossary for this step
> **mapper** — a pure function that converts a `Dto` into a domain model (`Dto → domain`). It's the *only*
> place a `…Dto` shape is allowed to be read; everything downstream gets clean models. See
> [conventions](../foundation/conventions.md).

## Why / design
The mapper is the border checkpoint between "raw Spotify" and "the app". It's where `snake_case` becomes
`camelCase`, where `external_ids?.isrc` collapses to a plain `isrc: string | null`, and where Spotify's
free-text `album_type` is narrowed to our `AlbumType` union. Two functions carry M3:

- **`toLikedTracks(page)`** — maps a whole `/me/tracks` page (a `SpotifySavedTracksDto`) to `LikedTrack[]`.
  This is what `streamLikedTracks()` calls before yielding a page (step 04), so a `…Dto` never leaves the API
  client.
- **`toIndexedTrack(track)`** — flattens one `LikedTrack` into an `IndexedTrack` for storage (this runs inside
  the `LikedIndex.add()` in step 06).

> **Why narrow `album_type`?** Spotify's field is a plain `string`, but the domain wants one of three known
> values. `toAlbumType` checks membership and defaults anything unexpected to `'album'` — so a future Spotify
> value can't smuggle an off-union string into a typed field. This "validate at the mapper" habit is why the
> rest of the app can trust its own types.

Both functions are **pure** (no `inject`, no state) — plain exported functions, not a service. Mappers never
need DI.

## Do this
1. Create `src/app/core/mappers/spotify.mapper.ts` with the code below.
2. `toLikedTracks` reads DTO fields (`item.track.duration_ms`, `item.added_at`, …) and writes model fields
   (`durationMs`, `addedAt`, …). This left-DTO/right-model shape is the whole point — the field renames all
   live **here** and nowhere else.
3. `isrc` uses `?? null`: `external_ids?.isrc` is `string | undefined`; the model wants `string | null`. The
   `?? null` coercion is **mandatory** — the model type has no `undefined`.

## Code
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

## Done when (this step)
- [ ] Run `npm run build` → completes clean (`Application bundle generation complete`).
- [ ] `spotify.mapper.ts` exports `toLikedTracks` and `toIndexedTrack`; neither imports `@angular/core` (pure
      functions, no DI).

## If it breaks
- **`build` fails: "Type 'string | undefined' is not assignable to 'string | null'"** → you dropped the
  `?? null` on `isrc`. The DTO's `external_ids?.isrc` is optional; the model's `isrc` is `string | null`.
- **`build` fails: "Type 'string' is not assignable to type 'AlbumType'"** → you assigned
  `item.track.album.album_type` straight to `albumType`; it must go through `toAlbumType(...)` to narrow the
  union.
