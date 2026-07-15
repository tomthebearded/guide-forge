# M3 · Step 02 of 07 — The clean domain: `LikedTrack`, `IndexedTrack`, `ArtistRef`
> Nav: [← Track DTOs](01_track-dtos.md) · [Overview](00_overview.md) · [The mapper →](03_mapper.md)

> This step touches **three files, committed together** — they're the domain half of the DTO→domain pair and
> nothing works until all three exist: `core/models/artist.ts`, `core/models/liked-track.ts`,
> `core/models/indexed-track.ts`.

## Glossary for this step
> **domain model** — the clean, `camelCase` shape the app actually uses, free of API quirks. The counterpart
> to a `Dto`. See [glossary: DTO](../foundation/glossary.md#dto).
> **ISRC** — International Standard Recording Code: a globally unique id for a specific recording; the same
> recording shares it across album editions. Nullable here because not every track has one. See
> [glossary](../foundation/glossary.md#isrc).
> **snapshot** — the whole persisted index as one JSON object with a `version` stamp; what gets written to and
> read from `localStorage`.

## Why / design
The DTOs describe what Spotify *sends*; these models describe what the app *keeps*. Two shapes, on purpose:

- **`LikedTrack`** — a liked song in its natural, nested form (`album` is an object, `artists` is a list of
  `{ id, name }`). This is what the mapper produces and what a page consumer receives per track.
- **`IndexedTrack`** — the same track **flattened** for storage and lookup: `albumId`/`albumName` instead of a
  nested `album`, and `artistIds: string[]` instead of full artist objects. Flattening keeps the persisted
  snapshot small and makes "every track for artist X" a simple `artistIds.includes(x)` scan.

Splitting the two costs one tiny mapper function (step 03) and buys a persisted format that never carries a
field the index doesn't need. `ArtistRef` is the shared `{ id, name }` both the DTO layer and `LikedTrack`
speak in.

`LikedIndexSnapshot` also lives here (beside `IndexedTrack`) because it's *the persisted shape of a set of
indexed tracks* — `version` (for future migrations), `newest` (the newest `added_at` seen — the incremental
cursor a later sync resumes from), and `tracks`.

## Do this
1. Create `src/app/core/models/artist.ts` with the shared `ArtistRef`.
2. Create `src/app/core/models/liked-track.ts` with `LikedTrack`, its nested `LikedTrackAlbum`, and the
   `AlbumType` union. `AlbumType` is **load-bearing** — the mapper narrows Spotify's free-text `album_type`
   into exactly these three strings.
3. Create `src/app/core/models/indexed-track.ts` with `IndexedTrack` and `LikedIndexSnapshot`. The
   `version: 1` field is **mandatory and load-bearing** — the cache validator (step 05) rejects any snapshot
   whose `version` isn't `1`.

## Code
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

## Done when (this step)
- [ ] Run `npm run build` → completes clean (`Application bundle generation complete`).
- [ ] The three files exist and each has **one primary export group** (models only — no logic), matching the
      suffix-less naming convention.

## If it breaks
- **`build` fails: "Cannot find module './artist'"** → `liked-track.ts` imports `ArtistRef` from `./artist`;
  make sure `artist.ts` sits in the same `core/models/` folder.
- **`build` fails: "'version' is declared but its type '1'…" or a widening error** → keep `version: 1` as the
  literal type `1`, not `number`; the snapshot type and the cache validator depend on the exact literal.
