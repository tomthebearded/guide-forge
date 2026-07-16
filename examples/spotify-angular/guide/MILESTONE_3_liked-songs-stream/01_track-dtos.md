# M3 · Step 01 of 07 — The raw edge: track & paging DTOs
> Nav: — · [Overview](00_overview.md) · [Domain models →](02_domain-models.md)

## Glossary for this step
> **DTO (Data Transfer Object)** — the raw shape an API hands back, typed exactly as the JSON arrives (down to
> its `snake_case` field names), and suffixed `Dto`. It lives only at the network edge; a mapper turns it into
> a clean domain model so API shapes never leak into the app. See [glossary](../foundation/glossary.md#dto).
> **cursor (paging)** — a server-supplied pointer to the next page of a list. Spotify returns it as a full
> URL in the `next` field; `null` means "no more pages".

## Why / design
Every byte the Spotify Web API returns enters the app through a typed `Dto`. This is the first half of the
recurring mental model you'll lean on for the rest of the guide:

> **DTO at the edge, domain everywhere else.** Raw payloads are `…Dto` and never travel past a mapper.
> Everything the UI, stores, and pipelines touch is a clean domain model. When Spotify renames a field (it
> did — several times in the Feb 2026 Dev-Mode migration), only the `Dto` and its mapper change; the rest of
> the app doesn't move.

`GET /me/tracks` (the user's "Liked Songs") returns a **paging object**: an `items` array of *saved tracks*,
a `total`, and a `next` cursor URL. Each saved track wraps the actual `track` plus the `added_at` timestamp.
This step types that shape exactly — no cleaning, no renaming yet. That's the mapper's job (step 03).

> M2 already created `spotify.dto.ts` with `SpotifyMeDto` and a bare `SpotifySavedTracksDto` for the
> liked-summary call. This step **grows** the file with the full track/album/artist shapes the scan needs.
> The file keeps growing across later milestones (playlists in M9, player in M7, artists in M5) — you only add
> what M3 uses now.

## Do this
1. Open `src/app/core/dto/spotify.dto.ts` (M2 created it). Replace its contents with the code below — it keeps
   `SpotifyMeDto` and fleshes out the liked-tracks shapes.
2. Field names are **load-bearing and mandatory**: they must match Spotify's JSON exactly (`added_at`,
   `duration_ms`, `album_type`, `release_date`, `external_ids`). Angular's `HttpClient` does no renaming —
   type a field wrong and it reads back `undefined` at runtime with no compile error. The **interface names**
   (`SpotifySavedTrackDto`, …) are cosmetic — rename them if you keep the `Dto` suffix — but the guide uses
   these exact names throughout.
3. `external_ids` is optional (`?`) because not every track carries an ISRC — leave the `?`. Leave every other
   field required.

## Code
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

## Done when (this step)
- [ ] Run `npm run build` → it completes with no TypeScript errors (`Application bundle generation complete`).
- [ ] `src/app/core/dto/spotify.dto.ts` exports `SpotifySavedTracksDto`, `SpotifySavedTrackDto`,
      `SpotifyAlbumRefDto`, `SpotifyArtistRefDto`, and `SpotifyMeDto`.

## If it breaks
- **`build` fails with "Duplicate identifier 'SpotifyMeDto'"** → M2's version of the file still has its own
  `SpotifyMeDto`; you appended instead of replacing. Replace the whole file with the code above.
- **Later, the count loads but track names are `undefined`** → a `Dto` field name doesn't match Spotify's JSON
  (e.g. `durationMs` instead of `duration_ms`). `HttpClient` returns the JSON verbatim; the field names here
  must be `snake_case` exactly as Spotify sends them.

---
> Nav: — · [Overview](00_overview.md) · [Domain models →](02_domain-models.md)
