# M10 · Step 01 of 18 — Domain models: `Album` + library-analysis types
> Nav: — · [Overview](00_overview.md) · [The pure track-matching engine →](02_track-matching.md)

> **This step touches 2 files, committed together:** `core/models/album.ts` (the discography types the matching
> engine consumes) and `core/models/library-analysis.ts` (the shapes it produces). They're the pure data
> vocabulary of the whole milestone — a model has no behaviour — so we introduce them in one commit before the
> engine (step 02) and everything downstream.

## Glossary for this step
> **`recordingKey`** — this app's identity for "the same recording": its **ISRC** when present, else a
> normalized title + a coarse duration bucket. It's the string these models key on to tie a like to its
> discography copies; the function that builds it is defined in the [next step](02_track-matching.md). See
> [glossary](../foundation/glossary.md#recordingkey).
> **discography** — every release an artist has out on Spotify (albums, singles/EPs, compilations), each with
> its track list. The library page fetches and analyses this per artist.
> **relink** — moving a *like* off an old copy of a recording onto the **newest playable copy** of the same
> recording that exists in the discography. A common cleanup: you liked a song on a since-superseded album.
> **ISRC** — International Standard Recording Code: a globally unique id for one specific recording, shared
> across album editions. The reliable "same recording" key. See [glossary](../foundation/glossary.md#isrc).

## Why / design
The library console is built on a **pure engine** (step 02) that takes an artist's liked tracks + their
discography and returns an analysis: which likes are fine, which should relink, which are duplicates. That
engine needs two vocabularies:

1. **What goes in** — `Album` / `AlbumTrack` / `DiscographyRelease` (`album.ts`). A `DiscographyRelease` is one
   album paired with its tracks, **each track enriched with its ISRC + market playability** — the two facts a
   simplified album-tracks response doesn't carry (step 03 fetches them via `GET /tracks`).
2. **What comes out** — `LikedStatus`, `LikedAnnotation`, `RelinkSuggestion`, `DuplicateGroup`, `ArtistAnalysis`,
   `CompareRow`, `AlbumTrackRef` (`library-analysis.ts`).

> **Recurring model: DTO at the edge, domain everywhere else.** These are clean *domain* models — no `snake_case`,
> no Spotify-specific shapes. The mappers (step 03) convert `Dto → domain` so the UI and engine never see a raw
> payload. See [conventions](../foundation/conventions.md).

`AlbumType` is reused from the M3 `liked-track.ts` (`'album' | 'single' | 'compilation'`), so both files import it.

## Do this
1. Create `src/app/core/models/album.ts` with `AlbumGroup`, `Album`, `DiscographyRelease`, and `AlbumTrack`. The
   `isPlayable` flag on `AlbumTrack` is **load-bearing** — relink targets must be *playable*, so a greyed-out copy
   is never suggested. The `isrc` field is **load-bearing** too (it's the duplicate-detection key).
2. Create `src/app/core/models/library-analysis.ts` with the analysis output types. `LikedAnnotation.status` is
   the `LikedStatus` union; `DuplicateGroup.copies` is newest-album-first with `keep` = the suggested survivor.
3. Field names other than `isrc` / `isPlayable` / the `LikedStatus` values are cosmetic — rename freely if you
   keep them consistent with the engine (step 02) that reads them.

## Code
### `src/app/core/models/album.ts`
```ts
import { AlbumType } from './liked-track';

/** An album's relation to the artist whose discography it appears in. */
export type AlbumGroup = 'album' | 'single' | 'compilation' | 'appears_on';

/** A release from an artist's discography (album / single / EP / compilation). */
export interface Album {
  id: string;
  name: string;
  albumType: AlbumType;
  albumGroup: AlbumGroup;
  /** `YYYY` | `YYYY-MM` | `YYYY-MM-DD`. */
  releaseDate: string;
  totalTracks: number;
  imageUrl: string | null;
}

/** A release paired with its (ISRC-enriched) tracks — the unit the matching engine consumes. */
export interface DiscographyRelease {
  album: Album;
  tracks: AlbumTrack[];
}

/** A track on a release, enriched with ISRC + market playability from `GET /tracks`. */
export interface AlbumTrack {
  id: string;
  name: string;
  uri: string;
  isrc: string | null;
  durationMs: number;
  trackNumber: number;
  discNumber: number;
  /** Playable in the user's market — false means greyed-out for them. */
  isPlayable: boolean;
  artistIds: string[];
}
```

### `src/app/core/models/library-analysis.ts`
```ts
import { Album, AlbumTrack } from './album';
import { IndexedTrack } from './indexed-track';

/**
 * A liked track's standing in its artist's current discography:
 * - `ok`          — already sits on the newest available copy of the recording.
 * - `relink`      — a newer available copy exists on a different release (move the like there).
 * - `unavailable` — no playable copy in the current discography (the greyed-out / dead like).
 */
export type LikedStatus = 'ok' | 'relink' | 'unavailable';

/** A specific track on a specific release. */
export interface AlbumTrackRef {
  album: Album;
  track: AlbumTrack;
}

/** One liked track annotated against the discography. */
export interface LikedAnnotation {
  liked: IndexedTrack;
  recordingKey: string;
  status: LikedStatus;
  /** Newest available copy of this recording in the discography, or null when none is playable. */
  target: AlbumTrackRef | null;
  /** How many liked copies share this recording (>1 ⇒ part of a duplicate group). */
  duplicateCount: number;
}

/** A move suggestion: relink the like from its current (old) copy to a newer available one. */
export interface RelinkSuggestion {
  liked: IndexedTrack;
  /** Suggested target — newest available copy. */
  target: AlbumTrackRef;
  /** All available copies, newest-first, for the per-card dropdown override. */
  alternatives: AlbumTrackRef[];
}

/** The same recording liked on two or more albums — keep one, remove the rest. */
export interface DuplicateGroup {
  recordingKey: string;
  name: string;
  /** Liked copies sharing the recording, newest album first. */
  copies: IndexedTrack[];
  /** Suggested copy to keep (newest album). */
  keep: IndexedTrack;
}

/** The full per-artist analysis the detail page renders. */
export interface ArtistAnalysis {
  annotations: LikedAnnotation[];
  relinks: RelinkSuggestion[];
  duplicates: DuplicateGroup[];
}

/** One row of the per-album "import favourites from previous release" comparison. */
export interface CompareRow {
  /** A track on the album being imported into. */
  track: AlbumTrack;
  /** Whether this exact album track is already liked. */
  likedHere: boolean;
  /** Liked copies of the same recording sitting on other releases. */
  likedElsewhere: IndexedTrack[];
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — both files compile and
      `library-analysis.ts` resolves its `./album` + `./indexed-track` imports.
- [ ] `AlbumTrack` exposes `isrc: string | null` and `isPlayable: boolean`; `LikedStatus` is the exact union
      `'ok' | 'relink' | 'unavailable'`.

## If it breaks
- **`Cannot find module './indexed-track'`** → `IndexedTrack` is the M3 model (`core/models/indexed-track.ts`);
  if it's missing, your M3 work is incomplete.
- **`'AlbumType' is not exported`** → it lives in the M3 `core/models/liked-track.ts`; import it from there, don't
  redeclare it (a second definition would drift from the mapper's coercion in step 03).
- **Type error: `keep` not assignable** → `DuplicateGroup.copies` and `keep` are `IndexedTrack[]` / `IndexedTrack`
  (liked tracks), not `AlbumTrackRef` — the engine dedupes *likes*, not discography entries.

---
> Nav: — · [Overview](00_overview.md) · [The pure track-matching engine →](02_track-matching.md)
