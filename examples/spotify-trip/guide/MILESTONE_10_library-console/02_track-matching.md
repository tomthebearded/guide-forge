# M10 · Step 02 of 18 — The pure `track-matching` engine
> Nav: [← Domain models](01_library-models.md) · [Overview](00_overview.md) · [Grow the Spotify client →](03_spotify-client-grow.md)

## Glossary for this step
> **`recordingKey`** — this app's identity for "the same recording": its **ISRC** when present, else a normalized
> title + a coarse duration bucket. Two tracks with the same key are treated as the same song. See
> [glossary](../foundation/glossary.md#recordingkey).
> **duration bucket** — rounding a track's length to the nearest 2 s so two rips of the same song that differ by
> a few hundred ms still collide on the fallback key.
> **pure function** — a function whose output depends only on its inputs, with no side effects (no HTTP, no
> signals, no `Date.now()` on the hot path). Trivial to reason about and to reuse from three different callers.

## Why / design
This is the analytical heart of the console — and it's **pure**: no Angular, no HTTP, no state. You give it an
artist's liked tracks and their discography; it tells you what to do. Four exported functions:

1. **`recordingKey(track)`** — the identity used everywhere. **ISRC-first** (`isrc:…`), falling back to a
   normalized title + duration bucket (`nd:…`) when a track has no ISRC. Normalization strips edition noise
   ("Remastered 2011", "(Deluxe)", featuring credits) so re-releases of one song collapse together.
2. **`releaseSortValue(releaseDate)`** — turns Spotify's ragged `YYYY` / `YYYY-MM` / `YYYY-MM-DD` into a sortable
   timestamp, so "newest release" is well-defined. `albumSortValue` re-exports it for the UI.
3. **`analyseArtist(liked, releases)`** — annotates each like `ok` / `relink` / `unavailable`, derives the relink
   suggestions (move to the newest *playable* copy), and derives the duplicate groups.
4. **`compareAlbum(albumTracks, liked)`** — for the "import favourites from a previous release" panel: each album
   track paired with whether it's already liked, and any liked copies on *other* releases.

> **Recurring model — the safety limit ([decision-log D6](../foundation/decision-log.md#d6--isrc-only-duplicate-detection-per-id-fan-out-after-bulk-endpoint-removal)):** the fuzzy title+duration key is good enough
> to *suggest* a relink or compare (where the user reviews the target), but **must never drive a delete**. A
> generic "Intro" or a short skit can normalize to the same key on several albums and land in one duration
> bucket — deleting on that basis would lose data. So `analyseArtist` only forms a `DuplicateGroup` when the key
> starts with `isrc:`. This one guard is why duplicate removal is safe.

## Do this
1. Create `src/app/core/pipeline/track-matching.ts` with the complete file below.
2. Read the `DUPLICATE_BUCKET`/`NOISE` constants: `DURATION_BUCKET_MS = 2_000` is the fallback-key tolerance;
   `NOISE` is the edition-qualifier regex stripped from titles. These values are illustrative tuning — nudge them
   and matching gets looser/tighter — but the `\d{4}` (a bare 4-digit year) and the `feat`/`remaster` terms are
   the load-bearing ones (they cause the most false splits).
3. Note the **ISRC-only duplicate guard**: `if (copies.length < 2 || !key.startsWith('isrc:')) continue;`. Leave
   it exactly as written — it's the D6 safety limit.

## Code
### `src/app/core/pipeline/track-matching.ts`
```ts
import { Album, AlbumTrack, DiscographyRelease } from '../models/album';
import { IndexedTrack } from '../models/indexed-track';
import {
  AlbumTrackRef,
  ArtistAnalysis,
  CompareRow,
  DuplicateGroup,
  LikedAnnotation,
  LikedStatus,
  RelinkSuggestion,
} from '../models/library-analysis';

/** Duration bucket (ms) for the title+duration fallback when two tracks lack a shared ISRC. */
const DURATION_BUCKET_MS = 2_000;

/** Parenthetical / dash-suffix noise that shouldn't distinguish two copies of the same recording. */
const NOISE = new RegExp(
  '\\b(remaster(ed)?|re-?master(ed)?|version|edit|mono|stereo|deluxe|expanded|bonus|' +
    'anniversary|reissue|remastered version|single version|album version|feat\\.?|featuring|' +
    'with|original|\\d{4})\\b',
  'gi',
);

/**
 * Identity key tying the same recording across album versions: the ISRC when present, otherwise a
 * normalized title + a coarse duration bucket. Used for relink targets, dedup, and album compares.
 */
export function recordingKey(track: {
  isrc: string | null;
  name: string;
  durationMs: number;
}): string {
  if (track.isrc !== null && track.isrc.length > 0) {
    return `isrc:${track.isrc.toUpperCase()}`;
  }
  return `nd:${normalizeTitle(track.name)}|${Math.round(track.durationMs / DURATION_BUCKET_MS)}`;
}

function normalizeTitle(name: string): string {
  return name
    .toLowerCase()
    .replace(/[([].*?[)\]]/g, ' ') // drop "(... )" / "[...]" qualifiers
    .replace(/\s-\s.*$/, ' ') // drop "- Remastered 2011"-style suffixes
    .replace(NOISE, ' ')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

/** Sortable timestamp for a `YYYY` / `YYYY-MM` / `YYYY-MM-DD` release date (bare parts → Jan 1st). */
export function releaseSortValue(releaseDate: string): number {
  const [year = '0', month = '01', day = '01'] = releaseDate.split('-');
  const ts = Date.parse(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00Z`);
  return Number.isFinite(ts) ? ts : 0;
}

/** Build a recordingKey → available/playable discography copies index, each newest-first. */
function indexDiscography(releases: DiscographyRelease[]): Map<string, AlbumTrackRef[]> {
  const byKey = new Map<string, AlbumTrackRef[]>();
  for (const release of releases) {
    for (const track of release.tracks) {
      const key = recordingKey(track);
      const ref: AlbumTrackRef = { album: release.album, track };
      const list = byKey.get(key);
      if (list === undefined) {
        byKey.set(key, [ref]);
      } else {
        list.push(ref);
      }
    }
  }
  for (const list of byKey.values()) {
    list.sort(
      (a, b) => releaseSortValue(b.album.releaseDate) - releaseSortValue(a.album.releaseDate),
    );
  }
  return byKey;
}

/** Newest available (playable) copy of a recording, or null when every copy is greyed-out/missing. */
function newestAvailable(refs: AlbumTrackRef[] | undefined): AlbumTrackRef | null {
  if (refs === undefined) {
    return null;
  }
  // Already sorted newest-first; the first playable one is the newest available.
  return refs.find((ref) => ref.track.isPlayable) ?? null;
}

/**
 * Analyse one artist: annotate each liked track against the current discography, then derive the
 * relink suggestions (move likes to the newest available copy) and the duplicate groups.
 */
export function analyseArtist(
  liked: IndexedTrack[],
  releases: DiscographyRelease[],
): ArtistAnalysis {
  const discoByKey = indexDiscography(releases);

  // Count liked copies per recording for the duplicate flag.
  const likedByKey = new Map<string, IndexedTrack[]>();
  for (const track of liked) {
    const key = recordingKey(track);
    const list = likedByKey.get(key);
    if (list === undefined) {
      likedByKey.set(key, [track]);
    } else {
      list.push(track);
    }
  }

  const annotations: LikedAnnotation[] = liked.map((track) => {
    const key = recordingKey(track);
    const target = newestAvailable(discoByKey.get(key));
    const status: LikedStatus =
      target === null ? 'unavailable' : target.album.id === track.albumId ? 'ok' : 'relink';
    return {
      liked: track,
      recordingKey: key,
      status,
      target,
      duplicateCount: likedByKey.get(key)?.length ?? 1,
    };
  });

  const relinks: RelinkSuggestion[] = annotations
    .filter((a): a is LikedAnnotation & { target: AlbumTrackRef } => a.status === 'relink')
    .map((a) => ({
      liked: a.liked,
      target: a.target,
      alternatives: (discoByKey.get(a.recordingKey) ?? []).filter((ref) => ref.track.isPlayable),
    }));

  const duplicates: DuplicateGroup[] = [];
  for (const [key, copies] of likedByKey) {
    // Only ISRC-identified copies are *reliably* the same recording. The title+duration fallback
    // can conflate distinct short/generic tracks (e.g. an "Intro" on several albums that normalize
    // to the same key and land in one duration bucket), so it must never drive a remove-duplicate
    // suggestion. Fuzzy matches still power relink/compare, where the user reviews each target.
    if (copies.length < 2 || !key.startsWith('isrc:')) {
      continue;
    }
    const byNewest = [...copies].sort(
      (a, b) => releaseSortValue(b.releaseDate) - releaseSortValue(a.releaseDate),
    );
    const keep = byNewest[0];
    if (keep === undefined) {
      continue;
    }
    duplicates.push({ recordingKey: key, name: keep.name, copies: byNewest, keep });
  }
  duplicates.sort((a, b) => a.name.localeCompare(b.name));

  return { annotations, relinks, duplicates };
}

/**
 * Rows for the "import favourites from previous release" panel: each track on `album` paired with
 * whether it's already liked and any liked copies sitting on *other* releases.
 */
export function compareAlbum(albumTracks: AlbumTrack[], liked: IndexedTrack[]): CompareRow[] {
  const likedByKey = new Map<string, IndexedTrack[]>();
  const likedIds = new Set<string>();
  for (const track of liked) {
    likedIds.add(track.id);
    const key = recordingKey(track);
    const list = likedByKey.get(key);
    if (list === undefined) {
      likedByKey.set(key, [track]);
    } else {
      list.push(track);
    }
  }

  return albumTracks.map((track) => {
    const key = recordingKey(track);
    const sameRecording = likedByKey.get(key) ?? [];
    return {
      track,
      likedHere: likedIds.has(track.id),
      likedElsewhere: sameRecording.filter((copy) => copy.id !== track.id),
    };
  });
}

/** Re-export so UI sorters share the engine's date logic. */
export function albumSortValue(album: Album): number {
  return releaseSortValue(album.releaseDate);
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — the engine compiles against the
      step-01 models with no `any`.
- [ ] Reason it through by hand: for a like whose `recordingKey` has a *newer playable* copy on a different
      album, `analyseArtist` marks it `relink` with that copy as `target`; two likes sharing one **ISRC** on
      different albums form one `DuplicateGroup`; two likes sharing only a **fuzzy** `nd:` key do **not**.

## If it breaks
- **Every fuzzy near-duplicate shows as a duplicate** → you dropped the `!key.startsWith('isrc:')` guard; that's
  the D6 safety limit — restore it, or you'll offer to delete distinct tracks.
- **"Newest release" picks the wrong album** → `releaseSortValue` must pad `YYYY`/`YYYY-MM` to a full date;
  comparing the raw strings would sort `"2011"` after `"2011-01-05"`.
- **A relink suggests a greyed-out copy** → `newestAvailable` must filter on `track.isPlayable`; without it you'd
  relink onto a copy the user can't play.
