# M10 · Verify — Library console
> Nav: [← Header link + routes](17_header-routes.md) · [Overview](00_overview.md) · [M11 · Settings, data transfer & polish →](../MILESTONE_11_settings-data-polish/00_overview.md)

Run the full gate by hand with `npm start` running and logged in (and a prior library scan). The gate exercises
the whole console. The **file checkpoint** below holds the authoritative, full copy of every file that **grew
across more than one step this milestone** — the models, matching engine, caches, DTOs/mappers, API client, the
two indexes, `globe-store`, the header, and the routes — so you can diff the files that changed hands mid-stream.
The self-contained pieces that were rendered whole in a single step and **didn't change afterward**
(`library-store.ts` and the eight library/shared components) are **linked to their step**, not re-pasted, to keep
this page navigable — the pointers are listed at the end of the checkpoint. Playback + follow actions need the
usual account tiers (R4).

## Done-when gate (the real test — check every box by hand)

### 0. Tooling
- [ ] `npm run format:check` → clean. `npm run lint` → clean. `npm run build` → `Application bundle generation
  complete` (no `any`, no unused).

### 1. Master table (browse / filter / sort)
- [ ] Header shows **Globe · Actions · Library · Log out**; click **Library** → `/library`, the link reads
  bold/active, and the sortable artist table lists your liked artists.
- [ ] Click a letter in the alphabet bar → the list narrows to artists under it; letters with no artists are
  dimmed and unclickable. Type in **Search artists** → results span all letters.
- [ ] Click the **Needs review** / **Not following** / **No origin** chips → the list narrows to that worklist;
  click a column header (e.g. **Liked**) → rows re-sort, and clicking it again flips the caret ↑/↓.

### 2. Artist detail (discography + analysis)
- [ ] Click an artist → `/library/artist/:id` shows the photo, genre chips, and three tabs **Duplicates (N)** /
  **Relink (N)** / **Discography**; the Discography lists releases with per-track ❤ (liked) / 🔗 (liked
  elsewhere) flags and playlist-membership chips.

### 3. Reversible relink (Spotify first, then local patch — no rescan)
- [ ] On **Relink**, pick a track whose newer copy is playable and click **Relink** → a toast *"Relinked 1
  track(s) to <album>."* with an **Undo** button; the ❤ moves to the target copy immediately **without a page
  reload / rescan**. In the Spotify app, the like now sits on the newer release.
- [ ] If the old copy was in an editable playlist, the *"Also update your playlists?"* preview appears; confirm →
  toast *"Substituted the track in N playlist(s)."* and the new copy sits in the old one's position.
- [ ] Click **Undo** on the relink toast → the like returns to the old copy and the target is removed (symmetric).

### 4. ISRC-only duplicates
- [ ] The **Duplicates** tab lists only groups whose copies **share an ISRC** (two likes of one recording on
  different albums). A pair matched only by title+duration does **not** appear here.
- [ ] Click **Remove N other(s)** → the app saves the keep copy first, then removes the others; toast *"Removed N
  duplicate(s)."* with **Undo**. Undo restores the removed copies.

### 5. Follow / origin write-back
- [ ] Back on the master table, click an artist's follow icon → it flips `person_add_alt` → `how_to_reg`
  immediately; reload the page → it's still followed (persisted on the globe dataset). On Spotify, the artist is
  now followed.
- [ ] Set an artist's origin via the inline picker → the globe re-colours to place them there, and the choice
  sticks across a reload (a manual override wins over auto-resolution).

### 6. All liked songs + library-wide tidy
- [ ] `/library/tracks` lists every liked song with a live *"N of M"* count; search narrows it, **Not in any
  playlist** filters to unfiled songs, ticking rows shows the bulk **Add to playlist…** bar, and **heart_broken**
  removes a like with an Undo toast.
- [ ] `/library/tidy` → **Scan library** shows a determinate progress bar (*"Scanning X / Y artists…"*) and
  streams per-artist relink/duplicate cards; a clean library shows *"Nothing to tidy — … Nice library!"*.

## Files after this milestone — full copies of the cross-step files (the checkpoint)

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

### `src/app/core/cache/discography-cache.ts`
```ts
import { Injectable } from '@angular/core';

import { DiscographyRelease } from '../models/album';
import { readJson, removeJson, writeJson } from './storage-cache';

const STORAGE_KEY = 'evm.discography';
const VERSION = 1;
/**
 * Keep only the most-recently-added artists' discographies. A discography blob is large, and the
 * library can hold thousands of artists; an unbounded cache would blow the localStorage quota.
 */
const MAX_ARTISTS = 40;

interface DiscographySnapshot {
  version: number;
  /** artistId → its releases. Object insertion order is the recency order (oldest first). */
  entries: Record<string, DiscographyRelease[]>;
}

/**
 * Persists recently-viewed artist discographies so reopening the app doesn't re-page them from
 * Spotify. A nicety, not source-of-truth: bounded to {@link MAX_ARTISTS} and quota-safe (a failed
 * write just drops persistence — the in-memory cache still serves the session). Discographies are
 * effectively static, so cross-session staleness (a brand-new release) is acceptable.
 */
@Injectable({ providedIn: 'root' })
export class DiscographyCache {
  load(): Map<string, DiscographyRelease[]> {
    const snapshot = readJson<DiscographySnapshot | null>(
      STORAGE_KEY,
      (parsed) => (isSnapshot(parsed) ? parsed : undefined),
      null,
    );
    return snapshot === null ? new Map() : new Map(Object.entries(snapshot.entries));
  }

  /** Persist the cache, capped to the most-recent {@link MAX_ARTISTS} (Map preserves insert order). */
  save(cache: Map<string, DiscographyRelease[]>): void {
    const all = [...cache];
    const entries: Record<string, DiscographyRelease[]> = {};
    for (const [id, releases] of all.slice(Math.max(0, all.length - MAX_ARTISTS))) {
      entries[id] = releases;
    }
    try {
      writeJson(STORAGE_KEY, { version: VERSION, entries } satisfies DiscographySnapshot);
    } catch {
      // Quota exceeded (or serialise failure): persistence is optional, so abandon it rather than
      // break the artist view. Best-effort cleanup of any partial/stale entry.
      try {
        removeJson(STORAGE_KEY);
      } catch {
        // localStorage unavailable — nothing more we can do.
      }
    }
  }
}

function isSnapshot(value: unknown): value is DiscographySnapshot {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    candidate['version'] === VERSION &&
    candidate['entries'] !== null &&
    typeof candidate['entries'] === 'object'
  );
}
```

### `src/app/core/cache/library-prefs-cache.ts`
```ts
import { Injectable } from '@angular/core';

import { readJson, writeJson } from './storage-cache';

const STORAGE_KEY = 'evm.libraryPrefs';
/** Former key — migrated to {@link STORAGE_KEY} on first load so existing prefs survive the rename. */
const LEGACY_STORAGE_KEY = 'evm.favouritesPrefs';

/** Per-artist library-page state: when each was last reviewed, and which are hidden. */
export interface LibraryPrefs {
  /** artistId → epoch ms of the last "Mark reviewed". */
  reviewedAt: Record<string, number>;
  /** Hidden artist ids — filtered out of the table unless "Show hidden" is on. */
  hidden: string[];
}

const DEFAULTS: LibraryPrefs = { reviewedAt: {}, hidden: [] };

/** Persists the library page's per-artist review timestamps + hidden set to localStorage. */
@Injectable({ providedIn: 'root' })
export class LibraryPrefsCache {
  load(): LibraryPrefs {
    // One-time migration from the pre-rename key, before the shared reader takes over.
    if (localStorage.getItem(STORAGE_KEY) === null) {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy !== null) {
        localStorage.setItem(STORAGE_KEY, legacy);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }
    return readJson<LibraryPrefs>(
      STORAGE_KEY,
      (parsed) =>
        isPrefs(parsed)
          ? { reviewedAt: { ...parsed.reviewedAt }, hidden: [...parsed.hidden] }
          : undefined,
      { ...DEFAULTS },
    );
  }

  save(prefs: LibraryPrefs): void {
    // Via writeJson so a full quota fails soft (returns false) instead of throwing, matching
    // every other cache — a lost preference write must never crash the library page.
    writeJson(STORAGE_KEY, prefs);
  }
}

function isPrefs(value: unknown): value is LibraryPrefs {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const reviewedAt = candidate['reviewedAt'];
  return (
    Array.isArray(candidate['hidden']) &&
    typeof reviewedAt === 'object' &&
    reviewedAt !== null &&
    !Array.isArray(reviewedAt)
  );
}
```

### `src/app/core/dto/spotify.dto.ts`
```ts
/** Raw Spotify Web API payloads. Never used outside mappers — domain code uses models. */

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

/** Payload of `GET /me` — only the current user's id is needed (to decide playlist ownership). */
export interface SpotifyMeDto {
  id: string;
}

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

/**
 * Payload of `GET /me/player/queue`. `queue[0]` is the next item up. Items may be episodes (no
 * `artists`), so the array is typed loosely and the caller guards.
 */
export interface SpotifyQueueDto {
  currently_playing: SpotifyTrackDto | null;
  queue: (SpotifyTrackDto | { id: string | null })[];
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

/**
 * Payload of `GET /artists/{id}` — used for the artist photo riding the flight plane and the
 * per-artist genre tags driving the globe's genre filter.
 */
export interface SpotifyArtistDto {
  id: string;
  name: string;
  images: SpotifyImageDto[];
  /** Spotify's genre tags for the artist (often granular, e.g. "swedish indie pop"); may be empty. */
  genres: string[];
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
  /** Opaque version tag — changes iff the playlist's contents change. Drives the incremental sync. */
  snapshot_id: string;
}

export interface SpotifyPlaylistsDto {
  /** Spotify returns `null` entries for playlists the user can no longer access. */
  items: (SpotifyPlaylistDto | null)[];
  next: string | null;
}

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

### `src/app/core/mappers/spotify.mapper.ts`
```ts
import {
  SpotifyAlbumDto,
  SpotifyArtistAlbumsDto,
  SpotifyFullTrackDto,
  SpotifyImageDto,
  SpotifyPlaybackStateDto,
  SpotifyPlaylistDto,
  SpotifyPlaylistsDto,
  SpotifyPlaylistTracksDto,
  SpotifySavedTracksDto,
} from '../dto/spotify.dto';
import { Album, AlbumGroup, AlbumTrack } from '../models/album';
import { IndexedTrack } from '../models/indexed-track';
import { AlbumType, LikedTrack } from '../models/liked-track';
import { PlaybackState } from '../models/playback-state';
import { Playlist } from '../models/playlist';
import { PlaylistTrackRef } from '../models/playlist-index';

const ALBUM_TYPES: readonly AlbumType[] = ['album', 'single', 'compilation'];
const ALBUM_GROUPS: readonly AlbumGroup[] = ['album', 'single', 'compilation', 'appears_on'];

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

export function toPlaylists(dto: SpotifyPlaylistsDto): Playlist[] {
  // Spotify sprinkles `null` items into `/me/playlists` for playlists the user can't access; skip them.
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

function toAlbumType(value: string): AlbumType {
  return (ALBUM_TYPES as readonly string[]).includes(value) ? (value as AlbumType) : 'album';
}

function toAlbumGroup(value: string): AlbumGroup {
  return (ALBUM_GROUPS as readonly string[]).includes(value) ? (value as AlbumGroup) : 'album';
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

function smallestImageUrl(images: SpotifyImageDto[]): string | null {
  if (images.length === 0) {
    return null;
  }
  const smallest = images.reduce((min, image) =>
    (image.width ?? Infinity) < (min.width ?? Infinity) ? image : min,
  );
  return smallest.url;
}

/** Largest available image (Spotify lists them largest-first) — used for the plane's artist photo. */
export function largestImageUrl(images: SpotifyImageDto[]): string | null {
  if (images.length === 0) {
    return null;
  }
  const largest = images.reduce((max, image) =>
    (image.width ?? 0) > (max.width ?? 0) ? image : max,
  );
  return largest.url;
}
```

### `src/app/core/api/spotify-api.ts`
```ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  SpotifyAlbumTracksDto,
  SpotifyArtistAlbumsDto,
  SpotifyArtistDto,
  SpotifyDevicesDto,
  SpotifyFullTrackDto,
  SpotifyMeDto,
  SpotifyPlaybackStateDto,
  SpotifyPlaylistsDto,
  SpotifyPlaylistTracksDto,
  SpotifyQueueDto,
  SpotifySavedTracksDto,
} from '../dto/spotify.dto';
import {
  toAlbums,
  toAlbumTracks,
  toLikedTracks,
  toPlaylists,
  toPlaylistTrackRefs,
} from '../mappers/spotify.mapper';
import { Album, AlbumTrack } from '../models/album';
import { ArtistRef } from '../models/artist';
import { LikedTrack } from '../models/liked-track';
import { Playlist } from '../models/playlist';
import { PlaylistTrackRef } from '../models/playlist-index';
import { mapWithConcurrency, withRetry } from '../pipeline/http-retry';

const PAGE_SIZE = 50;
/** `GET /artists/{id}/albums` caps `limit` at 10 (unlike most list endpoints' 50). */
const ARTIST_ALBUMS_PAGE_SIZE = 10;
/** `GET /playlists/{id}/items` allows up to 100 items per page. */
const PLAYLIST_PAGE_SIZE = 100;
/** Library save/remove/contains batch their uris ≤50; playlist adds cap at 100 uris. */
const ID_BATCH = 50;
const URI_BATCH = 100;
/**
 * Per-id fetches in flight when standing in for a removed bulk endpoint. 6 keeps the artist-page
 * enrichment brisk while staying clear of Spotify's rolling rate limit (`withRetry` honours 429).
 */
const FETCH_CONCURRENCY = 6;
/** Field mask trimming playlist-item payloads to what the membership index needs. */
const PLAYLIST_ITEM_FIELDS =
  'items(item(id,name,uri,duration_ms,is_local,type,artists(id),album(name,images))),next';

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

const trackUri = (id: string): string => `spotify:track:${id}`;
const artistUri = (id: string): string => `spotify:artist:${id}`;

/**
 * Typed client for the Spotify Web API. The M1 auth interceptor adds the bearer token; the M2
 * rate-limit gate (via `rateLimitInterceptor`) is the **single** pacer for every call here — spacing,
 * an adaptive rolling-window cap, and 429 cooldowns across all Spotify traffic (paging, the per-id
 * fan-outs, the player poll, library relink). This service keeps no throttle of its own.
 */
@Injectable({ providedIn: 'root' })
export class SpotifyApi {
  private readonly http = inject(HttpClient);

  /**
   * Streams the user's Liked Songs newest-first, one page (≤50) at a time, following Spotify's
   * `next` cursor. Consumers may stop iterating early (e.g. incremental sync past a known date).
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
   * `GET /me/tracks?limit=1`. The cheap diff the boot sync uses to decide whether the library changed.
   */
  async getLikedTracksSummary(): Promise<{ total: number; newest: string | null }> {
    const base = environment.spotify.apiBaseUrl;
    const page = await withRetry(() =>
      firstValueFrom(this.http.get<SpotifySavedTracksDto>(`${base}/me/tracks?limit=1`)),
    );
    return { total: page.total, newest: page.items[0]?.added_at ?? null };
  }

  /** Current playback state, or `null` when no device is active (Spotify replies 204). */
  async getPlaybackState(): Promise<SpotifyPlaybackStateDto | null> {
    const base = environment.spotify.apiBaseUrl;
    return await firstValueFrom(this.http.get<SpotifyPlaybackStateDto | null>(`${base}/me/player`));
  }

  /**
   * Primary artist of the next item in the playback queue, or null when the queue is empty or the
   * next item is a non-track (e.g. a podcast episode with no artists).
   */
  async getNextQueuedArtist(): Promise<ArtistRef | null> {
    const base = environment.spotify.apiBaseUrl;
    const dto = await firstValueFrom(this.http.get<SpotifyQueueDto>(`${base}/me/player/queue`));
    const next = dto.queue[0];
    if (next === undefined || !('artists' in next)) {
      return null;
    }
    const artist = next.artists[0];
    return artist === undefined ? null : { id: artist.id, name: artist.name };
  }

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
    await firstValueFrom(
      this.http.post(`${environment.spotify.apiBaseUrl}/me/player/previous`, {}),
    );
  }

  /** Toggle shuffle on the active device. */
  async setShuffle(state: boolean): Promise<void> {
    const base = environment.spotify.apiBaseUrl;
    await firstValueFrom(this.http.put(`${base}/me/player/shuffle?state=${state}`, {}));
  }

  /** Targetable Spotify Connect devices (restricted ones with no id are dropped). */
  async getDevices(): Promise<{ id: string; isActive: boolean }[]> {
    const base = environment.spotify.apiBaseUrl;
    const dto = await firstValueFrom(this.http.get<SpotifyDevicesDto>(`${base}/me/player/devices`));
    return dto.devices
      .filter((device): device is typeof device & { id: string } => device.id !== null)
      .map((device) => ({ id: device.id, isActive: device.is_active }));
  }

  /** Make a device the active one, optionally starting playback on it. */
  async transferPlayback(deviceId: string, play: boolean): Promise<void> {
    const base = environment.spotify.apiBaseUrl;
    await firstValueFrom(this.http.put(`${base}/me/player`, { device_ids: [deviceId], play }));
  }

  /**
   * URIs of the user's Liked Songs, newest-first, up to `limit` — used to auto-start favourites
   * when nothing is playing. Pages in ≤50s only as far as `limit` requires.
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

  /** Whether each of the given track ids is in the user's Liked Songs (`user-library-read`). */
  async areTracksSaved(ids: string[]): Promise<boolean[]> {
    return this.libraryContains(ids.map(trackUri));
  }

  /** The current user's profile — only the id is used (to decide playlist ownership). */
  async getMe(): Promise<SpotifyMeDto> {
    const base = environment.spotify.apiBaseUrl;
    return await firstValueFrom(this.http.get<SpotifyMeDto>(`${base}/me`));
  }

  /** Full artist object (for its photo). Public data — only needs a valid token. */
  async getArtist(id: string): Promise<SpotifyArtistDto> {
    const base = environment.spotify.apiBaseUrl;
    return await firstValueFrom(this.http.get<SpotifyArtistDto>(`${base}/artists/${id}`));
  }

  /**
   * Genre tags per artist for the given ids, order preserved. A resolved artist yields its tags (an
   * empty list when it genuinely has none — a *final* answer); a **fetch that fails** yields `null`
   * so the caller can tell "confirmed no genres" apart from "not fetched yet" and retry the latter.
   * The Feb 2026 Dev Mode migration removed the bulk `GET /artists?ids=`, so each artist is fetched
   * individually, `FETCH_CONCURRENCY` at a time. `onProgress` reports the running completed-count.
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
      const page = await withRetry(() =>
        firstValueFrom(this.http.get<SpotifyArtistAlbumsDto>(next)),
      );
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
      const page = await withRetry(() =>
        firstValueFrom(this.http.get<SpotifyAlbumTracksDto>(next)),
      );
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

  /** Add tracks to Liked Songs. */
  async saveTracks(ids: string[]): Promise<void> {
    await this.saveToLibrary(ids.map(trackUri));
  }

  /** Remove tracks from Liked Songs. */
  async removeSavedTracks(ids: string[]): Promise<void> {
    await this.removeFromLibrary(ids.map(trackUri));
  }

  /**
   * Save the given Spotify URIs to the user's library. The Feb 2026 Dev Mode migration replaced
   * the entity-specific save/follow endpoints with one generic `PUT /me/library` keyed by URI;
   * following an artist is saving its URI.
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
   * replacement. Response shape isn't documented in the migration guide; assumed an ordered boolean
   * array and validated so a changed response fails loud here rather than silently corrupting state.
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

  /** Whether each given artist id is currently followed (order preserved). */
  async getFollowedArtistsContains(ids: string[]): Promise<boolean[]> {
    return this.libraryContains(ids.map(artistUri));
  }

  /** Follow artists (saving the artist URIs to the library). */
  async followArtists(ids: string[]): Promise<void> {
    await this.saveToLibrary(ids.map(artistUri));
  }

  /** Unfollow artists (removing the artist URIs from the library). */
  async unfollowArtists(ids: string[]): Promise<void> {
    await this.removeFromLibrary(ids.map(artistUri));
  }

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
}
```

### `src/app/core/pipeline/liked-index.ts`
```ts
import { computed, inject, Injectable, signal, untracked } from '@angular/core';

import { LikedIndexCache } from '../cache/liked-index-cache';
import { toIndexedTrack } from '../mappers/spotify.mapper';
import { IndexedTrack } from '../models/indexed-track';
import { LikedTrack } from '../models/liked-track';

/**
 * Flattened, per-track view of the user's Liked Songs — built as a byproduct of the `/me/tracks`
 * scan and persisted via {@link LikedIndexCache}. Reads an artist's liked tracks (with album + ISRC)
 * without re-paging the library. Grown in M10 with the relink/dedup local mutations.
 */
@Injectable({ providedIn: 'root' })
export class LikedIndex {
  private readonly cache = inject(LikedIndexCache);

  /** Working set keyed by saved track id (each liked track is unique by id). */
  private byId = new Map<string, IndexedTrack>();
  private loaded = false;

  private readonly _count = signal(0);
  private readonly _newest = signal<string | null>(null);

  readonly count = this._count.asReadonly();
  readonly newest = this._newest.asReadonly();
  readonly hasData = computed(() => this._count() > 0);

  /** A scan or a local mutation changed the data — bump this so dependent views recompute. */
  private readonly _revision = signal(0);
  readonly revision = this._revision.asReadonly();

  /**
   * Hydrate the persisted index into memory (idempotent) so `hasData` and lookups reflect the
   * localStorage cache without waiting for a scan. Called when the page opens so a cached library
   * doesn't look empty (which would re-prompt a full scan).
   */
  hydrate(): void {
    this.ensureLoaded();
  }

  /** Liked tracks featuring the given artist, newest-first. */
  tracksByArtist(artistId: string): IndexedTrack[] {
    this.ensureLoaded();
    return [...this.byId.values()]
      .filter((track) => track.artistIds.includes(artistId))
      .sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1));
  }

  /** Every indexed liked track (unordered). Pair with {@link revision} inside a computed. */
  all(): IndexedTrack[] {
    this.ensureLoaded();
    return [...this.byId.values()];
  }

  // --- Scan feed (called by the page while paging `/me/tracks`) ---

  /** Begin a full rescan: drop the working set so removed likes don't linger. */
  beginFull(): void {
    this.ensureLoaded();
    this.byId.clear();
    this._newest.set(null);
    this._count.set(0);
  }

  /** Begin an incremental pass: keep what's persisted, merge new likes on top (M9 boot-sync). */
  beginIncremental(): void {
    this.ensureLoaded();
  }

  /** Record one liked track (upsert by id). */
  add(track: LikedTrack): void {
    this.byId.set(track.id, toIndexedTrack(track));
  }

  /** Persist the working set and advance the newest-seen cursor. Safe to call per page. */
  commit(newest: string | null): void {
    this._newest.set(newest);
    this._count.set(this.byId.size);
    this._revision.update((r) => r + 1);
    this.persist();
  }

  // --- Reset (used by a full "start fresh" and the globe's `clearData`, from M5 on) ---

  /** Wipe the index and its persisted snapshot. Leaves `loaded = true` so the next read sees the empty set, not a stale reload. */
  clear(): void {
    this.byId.clear();
    this.loaded = true;
    this._count.set(0);
    this._newest.set(null);
    this.cache.clear();
    this._revision.update((r) => r + 1);
  }

  // --- Local mutations (M10 — applied after a Spotify library action confirms) ---

  /** Remove liked tracks by id (e.g. the old copies dropped during a relink/dedup). */
  removeTracks(ids: Iterable<string>): void {
    this.ensureLoaded();
    for (const id of ids) {
      this.byId.delete(id);
    }
    this._count.set(this.byId.size);
    this._revision.update((r) => r + 1);
    this.persist();
  }

  /** Add liked tracks (e.g. the newer copies saved during a relink). */
  addTracks(tracks: Iterable<IndexedTrack>): void {
    this.ensureLoaded();
    for (const track of tracks) {
      this.byId.set(track.id, track);
    }
    this._count.set(this.byId.size);
    this._revision.update((r) => r + 1);
    this.persist();
  }

  private ensureLoaded(): void {
    if (this.loaded) {
      return;
    }
    const snapshot = this.cache.load();
    if (snapshot !== null) {
      this.byId = new Map(snapshot.tracks.map((track) => [track.id, track]));
    }
    this.loaded = true;
    // Hydration can be triggered by the first read inside a reactive context (a computed reading
    // `all()`); signal writes are forbidden there, so apply them outside any active consumer.
    untracked(() => {
      if (snapshot !== null) {
        this._newest.set(snapshot.newest);
      }
      this._count.set(this.byId.size);
    });
  }

  private persist(): void {
    this.cache.save({ version: 1, newest: this._newest(), tracks: [...this.byId.values()] });
  }
}
```

### `src/app/core/pipeline/playlist-index.ts`
```ts
import { computed, inject, Injectable, signal } from '@angular/core';

import { SpotifyApi } from '../api/spotify-api';
import { PlaylistIndexCache } from '../cache/playlist-index-cache';
import { Playlist } from '../models/playlist';
import { PlaylistTrackEntry, PlaylistTrackRef } from '../models/playlist-index';

/** Progress of an in-flight playlist scan (playlists read / total to read). */
export interface PlaylistScanProgress {
  done: number;
  total: number;
}

/**
 * Builds and persists a playlist-membership index: for every one of the user's playlists, which
 * tracks it contains, assembled into `trackId → {metadata, playlistIds[]}`. Built once on first use,
 * refreshed on demand; the library tools (M10) read + patch it in place (mirrors {@link LikedIndex}).
 */
@Injectable({ providedIn: 'root' })
export class PlaylistIndex {
  private readonly spotify = inject(SpotifyApi);
  private readonly cache = inject(PlaylistIndexCache);

  /** Working set keyed by track id (each entry tracks the playlists currently holding it). */
  private byId = new Map<string, PlaylistTrackEntry>();
  private loaded = false;

  private readonly _playlists = signal<Playlist[]>([]);
  private readonly _myUserId = signal('');
  private readonly _builtAt = signal<string | null>(null);
  private readonly _building = signal(false);
  private readonly _progress = signal<PlaylistScanProgress>({ done: 0, total: 0 });
  private readonly _revision = signal(0);

  readonly playlists = this._playlists.asReadonly();
  readonly building = this._building.asReadonly();
  readonly progress = this._progress.asReadonly();
  /** Bumps whenever membership changes — lets views recompute after a build / add / remove. */
  readonly revision = this._revision.asReadonly();
  /** Last build timestamp (ISO), or null if never built. */
  readonly builtAt = this._builtAt.asReadonly();
  readonly hasData = computed(() => this._builtAt() !== null);

  /** Playlists the user can add to / remove from (owned by them or collaborative). */
  readonly editablePlaylists = computed(() => {
    const me = this._myUserId();
    return this._playlists().filter((p) => p.ownerId === me || p.collaborative);
  });

  // --- Build / refresh ---

  /** Load the persisted index into memory if present, without hitting Spotify — so a page can read
   * `builtAt` / status straight from cache on open (mirrors {@link LikedIndex.hydrate}). */
  hydrate(): void {
    this.ensureLoaded();
  }

  /**
   * Reconcile the index with Spotify, re-paging only the playlists whose contents changed since the
   * last sync (their `snapshotId` differs), plus brand-new ones, and dropping playlists that have
   * disappeared. Unchanged playlists cost zero item requests. A first-ever run sees every playlist
   * as new, so this doubles as the initial build. Persists after each playlist, so an interrupted
   * sync resumes from where it stopped instead of restarting (and never advances a playlist's cached
   * snapshot until that playlist's items have been re-read, so a crash can't silently lose tracks).
   */
  async sync(): Promise<void> {
    this.ensureLoaded();
    if (this._building()) {
      return;
    }
    this._building.set(true);
    try {
      this._myUserId.set((await this.spotify.getMe()).id);
      const current = await this.spotify.getMyPlaylists();
      const cached = new Map(this._playlists().map((p) => [p.id, p]));
      const currentIds = new Set(current.map((p) => p.id));

      // The roster we'll persist: surviving playlists, but with their snapshot left at the cached
      // value until re-paged so an interrupted sync re-reads them next time.
      const roster = new Map<string, Playlist>();
      for (const p of current) {
        const prev = cached.get(p.id);
        if (prev !== undefined && prev.snapshotId === p.snapshotId) {
          roster.set(p.id, p); // unchanged — safe to take fresh metadata (e.g. a rename)
        } else if (prev !== undefined) {
          roster.set(p.id, prev); // changed — hold the old snapshot until its items are re-read
        }
        // New playlists are added to the roster only once successfully paged (below).
      }

      // Drop the memberships of playlists that vanished entirely.
      for (const id of cached.keys()) {
        if (!currentIds.has(id)) {
          this.dropPlaylist(id);
        }
      }

      const changed = current.filter((p) => {
        const prev = cached.get(p.id);
        return prev === undefined || prev.snapshotId !== p.snapshotId;
      });
      this._progress.set({ done: 0, total: changed.length });
      this._playlists.set([...roster.values()]);
      this.persist();
      this._revision.update((r) => r + 1);

      for (const playlist of changed) {
        this.dropPlaylist(playlist.id); // clear any stale contribution before re-reading
        try {
          const refs = await this.spotify.getPlaylistTrackRefs(playlist.id);
          const seen = new Set<string>();
          for (const ref of refs) {
            if (seen.has(ref.id)) {
              continue; // a track listed twice in one playlist counts once
            }
            seen.add(ref.id);
            upsert(this.byId, ref, playlist.id);
          }
          // Commit point: advance this playlist's cached snapshot only now its items are indexed.
          roster.set(playlist.id, playlist);
          this._playlists.set([...roster.values()]);
        } catch {
          // A single unreadable playlist is non-fatal — skip it (snapshot left un-advanced so the
          // next sync retries it) and keep the rest.
        }
        this._progress.update((p) => ({ ...p, done: p.done + 1 }));
        this._builtAt.set(new Date().toISOString());
        this.persist();
        this._revision.update((r) => r + 1);
      }

      this._builtAt.set(new Date().toISOString());
      this.persist();
      this._revision.update((r) => r + 1);
    } finally {
      this._building.set(false);
    }
  }

  /** Force a full rebuild from Spotify (manual "Refresh playlists"). */
  async refresh(): Promise<void> {
    await this.build();
  }

  private async build(): Promise<void> {
    this.ensureLoaded();
    this._building.set(true);
    try {
      const myUserId = (await this.spotify.getMe()).id;
      const playlists = await this.spotify.getMyPlaylists();
      this._progress.set({ done: 0, total: playlists.length });

      const next = new Map<string, PlaylistTrackEntry>();
      for (const playlist of playlists) {
        try {
          const refs = await this.spotify.getPlaylistTrackRefs(playlist.id);
          const seen = new Set<string>();
          for (const ref of refs) {
            if (seen.has(ref.id)) {
              continue; // a track listed twice in one playlist counts once
            }
            seen.add(ref.id);
            upsert(next, ref, playlist.id);
          }
        } catch {
          // A single unreadable playlist is non-fatal — skip it, keep the rest.
        }
        this._progress.update((p) => ({ ...p, done: p.done + 1 }));
      }

      this.byId = next;
      this._playlists.set(playlists);
      this._myUserId.set(myUserId);
      this._builtAt.set(new Date().toISOString());
      this.persist();
      this._revision.update((r) => r + 1);
    } finally {
      this._building.set(false);
    }
  }

  // --- Library membership reads (M10) ---

  /** Ids of the user's playlists currently containing the given track. */
  playlistIdsForTrack(trackId: string): string[] {
    this.ensureLoaded();
    return this.byId.get(trackId)?.playlistIds ?? [];
  }

  /** Playlist-held tracks crediting the given artist (for the "In your playlists" section). */
  tracksByArtist(artistId: string): PlaylistTrackEntry[] {
    this.ensureLoaded();
    return [...this.byId.values()].filter((entry) => entry.artistIds.includes(artistId));
  }

  /** Resolve a playlist id to its full object (name + editability), or undefined if unknown. */
  playlistById(id: string): Playlist | undefined {
    return this._playlists().find((p) => p.id === id);
  }

  // --- Library membership edits (M10 — applied after a Spotify playlist change confirms) ---

  /** Add a track to a playlist's membership, then persist + bump the revision. */
  addMembership(ref: PlaylistTrackRef, playlistId: string): void {
    this.ensureLoaded();
    upsert(this.byId, ref, playlistId);
    this.persist();
    this._revision.update((r) => r + 1);
  }

  /** Drop a track from a playlist; remove the entry entirely once it's in no playlists. */
  removeMembership(trackId: string, playlistId: string): void {
    this.ensureLoaded();
    const entry = this.byId.get(trackId);
    if (entry === undefined) {
      return;
    }
    entry.playlistIds = entry.playlistIds.filter((id) => id !== playlistId);
    if (entry.playlistIds.length === 0) {
      this.byId.delete(trackId);
    }
    this.persist();
    this._revision.update((r) => r + 1);
  }

  // --- Internals ---

  /** Remove a playlist's id from every track entry, deleting entries left in no playlist. */
  private dropPlaylist(playlistId: string): void {
    for (const [trackId, entry] of this.byId) {
      if (!entry.playlistIds.includes(playlistId)) {
        continue;
      }
      entry.playlistIds = entry.playlistIds.filter((id) => id !== playlistId);
      if (entry.playlistIds.length === 0) {
        this.byId.delete(trackId);
      }
    }
  }

  private ensureLoaded(): void {
    if (this.loaded) {
      return;
    }
    const snapshot = this.cache.load();
    if (snapshot !== null) {
      this.byId = new Map(snapshot.tracks.map((track) => [track.id, track]));
      this._playlists.set(snapshot.playlists);
      this._myUserId.set(snapshot.myUserId);
      this._builtAt.set(snapshot.builtAt);
    }
    this.loaded = true;
  }

  private persist(): void {
    this.cache.save({
      version: 1,
      builtAt: this._builtAt() ?? new Date().toISOString(),
      myUserId: this._myUserId(),
      playlists: this._playlists(),
      tracks: [...this.byId.values()],
    });
  }
}

/** Insert or extend a track entry, adding `playlistId` to its membership set. */
function upsert(
  map: Map<string, PlaylistTrackEntry>,
  ref: PlaylistTrackRef,
  playlistId: string,
): void {
  const existing = map.get(ref.id);
  if (existing === undefined) {
    map.set(ref.id, { ...ref, playlistIds: [playlistId] });
  } else if (!existing.playlistIds.includes(playlistId)) {
    existing.playlistIds = [...existing.playlistIds, playlistId];
  }
}
```

### `src/app/features/globe/globe-store.ts`
> Complete M10 state — the M9 store plus the four library-facing helpers (`followingOf`, `genresOf`,
> `setFollowing`, `setGenres`) that replaced the `// grows in M10` marker. Everything else is unchanged from M9.
```ts
import { computed, inject, Injectable, signal } from '@angular/core';

import { RateLimiters } from '../../core/api/rate-limiters';
import { SpotifyApi } from '../../core/api/spotify-api';
import { OriginsCache } from '../../core/cache/origins-cache';
import { LogStore } from '../../core/logging/log-store';
import { ArtistRef } from '../../core/models/artist';
import { ArtistOrigin } from '../../core/models/artist-origin';
import { OriginsSnapshot } from '../../core/models/origins-snapshot';
import { ArtistResolution } from '../../core/pipeline/artist-resolution';
import { LikedIndex } from '../../core/pipeline/liked-index';
import { PlaylistIndex } from '../../core/pipeline/playlist-index';
import { delay } from '../../core/util/delay';
import { Toast } from '../../shared/toast';

const SAVE_DEBOUNCE_MS = 500;
const WORKER_IDLE_MS = 120;
/**
 * Min gap between globe repaints while a scan streams. The fast worker resolves 50 artists per
 * Wikidata round-trip with no throttle, so it would otherwise snapshot the working set into the
 * signal (and recompute every aggregate + repaint the canvas) dozens of times a second. Coalescing
 * to ~5 paints/s keeps progress visible without the recompute storm; the final state is flushed
 * explicitly when the scan ends.
 */
const PUBLISH_THROTTLE_MS = 200;
/** Artists resolved per fast Wikidata request — bounds query URL size and server-side cost. */
const RESOLVE_BATCH_SIZE = 50;

/** Kept for the (now unused) scan experience; the Liked-Songs source stays on 'globe'. */
export type GlobePhase = 'scanning' | 'placing' | 'globe';

/** Which metric the globe heat encodes. Guide extension (M6, D8) — the source only uses 'tracks'. */
export type HeatMode = 'tracks' | 'hours';

/**
 * Owns the **Liked Songs → country** dataset for the globe. Pages `/me/tracks` newest-first,
 * dedupes artists with a real per-artist liked-track count + Σ runtime, and resolves countries via
 * Wikidata-by-Spotify-id (with a MusicBrainz-by-name fallback), recolouring live. A background genre
 * worker enriches placed artists with Spotify genre tags during the scan; the heat is filterable by
 * genre, release decade, and an as-of month (the last two swap in a per-track aggregation pass). The
 * heat metric switches between liked-track count and rounded listening hours (M6, D8); manual country
 * fixups are sticky. Persists the whole dataset so a reload restores instantly.
 */
@Injectable({ providedIn: 'root' })
export class GlobeStore {
  private readonly spotify = inject(SpotifyApi);
  private readonly resolution = inject(ArtistResolution);
  private readonly cache = inject(OriginsCache);
  private readonly likedIndex = inject(LikedIndex);
  private readonly playlistIndex = inject(PlaylistIndex);
  private readonly toast = inject(Toast);
  private readonly log = inject(LogStore);
  private readonly limits = inject(RateLimiters);

  /** Mutable working set; snapshotted into the signal on publish() to bound signal churn. */
  private working = new Map<string, ArtistOrigin>();
  /** artistId → manually assigned country, sticky across reloads. */
  private readonly manualOverrides = new Map<string, string>();
  /** artistId → country auto-resolved by a previous scan, reused by a full rescan to skip re-resolving. */
  private reuseOrigins = new Map<string, string>();
  /** artistId → genre tags from a previous scan, reused by a full rescan to skip re-fetching `/artists/{id}`. */
  private reuseGenres = new Map<string, string[]>();
  private readonly fastQueue: string[] = [];
  private readonly fastQueued = new Set<string>();
  private readonly slowQueue: string[] = [];
  private readonly slowQueued = new Set<string>();
  /** Placed artists awaiting genre enrichment — drained by the genre worker *during* the scan. */
  private readonly genreQueue: string[] = [];
  private readonly genreQueued = new Set<string>();
  private fastDone = false;
  private slowDone = false;
  /** True while pages are still streaming in, so the fast worker idle-waits instead of exiting. */
  private streaming = false;
  private saveTimer?: ReturnType<typeof setTimeout>;
  /** Set once a snapshot save is rejected (e.g. quota), to avoid re-toasting on every debounce. */
  private saveFailed = false;
  private publishTimer?: ReturnType<typeof setTimeout>;

  private readonly _artists = signal<ReadonlyMap<string, ArtistOrigin>>(new Map());
  private readonly _computedAt = signal<number | null>(null);
  private readonly _oldest = signal<string | null>(null);
  private readonly _newest = signal<string | null>(null);
  private readonly _phase = signal<GlobePhase>('globe');
  private readonly _resolving = signal(false);

  readonly artists = computed(() => [...this._artists().values()]);
  readonly total = computed(() => this._artists().size);
  readonly resolvedCount = computed(
    () => this.artists().filter((a) => a.countryCode !== null).length,
  );
  readonly failedCount = computed(() => this.artists().filter((a) => a.failed).length);
  readonly pendingCount = computed(() => this.artists().filter((a) => !a.tried).length);
  readonly phase = this._phase.asReadonly();
  readonly isResolving = this._resolving.asReadonly();
  readonly hasData = computed(() => this.total() > 0);
  readonly computedAt = this._computedAt.asReadonly();
  /** Oldest / newest liked-song dates spanned by the dataset — surfaced in the Actions HUD. */
  readonly dateRange = computed(() => ({ oldest: this._oldest(), newest: this._newest() }));

  /** Resolved artists where the country couldn't be found — candidates for manual fixup. */
  readonly unplaced = computed(() =>
    this.artists()
      .filter((a) => a.failed && !a.hidden)
      .sort((a, b) => b.trackCount - a.trackCount),
  );

  /** Active genre tag the heat is filtered to, or null = all genres. */
  private readonly _genreFilter = signal<string | null>(null);
  readonly genreFilter = this._genreFilter.asReadonly();

  /**
   * Timeline scrubber cursor: `'YYYY-MM'` upper bound on liked-track `added_at`, or null = live
   * (whole library). When set, the heat replays how the map filled in *up to and including* that
   * month, so dragging it animates the globe colouring on.
   */
  private readonly _asOfMonth = signal<string | null>(null);
  readonly asOfMonth = this._asOfMonth.asReadonly();

  /**
   * Release-era filter: the set of decade-start years (e.g. 1990, 2000) the heat is restricted to by
   * *track release date*, or null = all eras. Recolours the globe by *when* the music was made.
   */
  private readonly _eraDecades = signal<ReadonlySet<number> | null>(null);
  readonly eraDecades = this._eraDecades.asReadonly();

  /** Whether any temporal filter is engaged — switches the aggregates to the per-track pass. */
  private readonly temporalActive = computed(
    () => this._asOfMonth() !== null || this._eraDecades() !== null,
  );

  /**
   * The single source of the three per-country aggregates, so every filter applies everywhere at
   * once (globe heat, legend, leaderboards, hover card). With no temporal filter this sums each
   * placed artist's lifetime totals (fast artist-level pass), narrowed by any genre filter. When a
   * timeline or release-era filter is active it defers to the {@link perTrackAggregates} pass, which
   * needs the individual liked tracks' `added_at` / `releaseDate` — the artist-level totals can't be
   * split by time. The two passes agree exactly when no temporal filter is set.
   */
  private readonly aggregates = computed<{
    tracks: Map<string, number>;
    duration: Map<string, number>;
    artists: Map<string, ArtistOrigin[]>;
  }>(() => {
    if (this.temporalActive()) {
      return this.perTrackAggregates();
    }
    const genre = this._genreFilter();
    const artists = this._artists();
    const tracks = new Map<string, number>();
    const duration = new Map<string, number>();
    const byCountry = new Map<string, ArtistOrigin[]>();

    const passesGenre = (artist: ArtistOrigin): boolean =>
      genre === null || (artist.genres ?? []).includes(genre);

    for (const artist of artists.values()) {
      if (artist.countryCode === null || !passesGenre(artist)) {
        continue;
      }
      addTo(tracks, artist.countryCode, artist.trackCount);
      addTo(duration, artist.countryCode, artist.durationMs);
      pushTo(byCountry, artist.countryCode, artist);
    }

    for (const list of byCountry.values()) {
      list.sort((a, b) => b.trackCount - a.trackCount);
    }
    return { tracks, duration, artists: byCountry };
  });

  /**
   * Per-track aggregation used whenever a temporal filter is active. Walks the persisted liked-track
   * index, attributing each track to its **primary** artist's resolved country (Spotify lists the
   * main artist first — same rule the scan uses), then applies the genre, `added_at`-month, and
   * release-decade filters before summing. Per-artist track counts / durations are recomputed from
   * the surviving tracks so the hover card and leaderboards match the filtered heat.
   */
  private readonly perTrackAggregates = computed<{
    tracks: Map<string, number>;
    duration: Map<string, number>;
    artists: Map<string, ArtistOrigin[]>;
  }>(() => {
    this.likedIndex.revision(); // recompute as the index changes
    const artists = this._artists();
    const genre = this._genreFilter();
    const asOf = this._asOfMonth();
    const decades = this._eraDecades();

    const tracks = new Map<string, number>();
    const duration = new Map<string, number>();
    // artistId → the artist plus its filtered running totals, so the lists show the narrowed counts.
    const perArtist = new Map<string, { artist: ArtistOrigin; count: number; duration: number }>();

    for (const track of this.likedIndex.all()) {
      const primaryId = track.artistIds[0];
      if (primaryId === undefined) {
        continue;
      }
      const artist = artists.get(primaryId);
      if (artist === undefined || artist.countryCode === null) {
        continue;
      }
      if (genre !== null && !(artist.genres ?? []).includes(genre)) {
        continue;
      }
      if (asOf !== null && track.addedAt.slice(0, 7) > asOf) {
        continue;
      }
      if (decades !== null) {
        const year = releaseYear(track.releaseDate);
        if (year === null || !decades.has(Math.floor(year / 10) * 10)) {
          continue;
        }
      }
      addTo(tracks, artist.countryCode, 1);
      addTo(duration, artist.countryCode, track.durationMs);
      const entry = perArtist.get(primaryId);
      if (entry === undefined) {
        perArtist.set(primaryId, { artist, count: 1, duration: track.durationMs });
      } else {
        entry.count += 1;
        entry.duration += track.durationMs;
      }
    }

    const byCountry = new Map<string, ArtistOrigin[]>();
    for (const { artist, count, duration: d } of perArtist.values()) {
      // Shallow clone carrying the filtered totals so hover/leaderboards agree with the heat.
      pushTo(byCountry, artist.countryCode as string, {
        ...artist,
        trackCount: count,
        durationMs: d,
      });
    }
    for (const list of byCountry.values()) {
      list.sort((a, b) => b.trackCount - a.trackCount);
    }
    return { tracks, duration, artists: byCountry };
  });

  /** Resolved artists grouped by country (ISO alpha-2), each list sorted by trackCount desc. */
  readonly artistsByCountry = computed(() => this.aggregates().artists);

  /** Σ liked-track count per country — the 'tracks' heat metric and the tracks leaderboard. */
  readonly tracksByCountry = computed(() => this.aggregates().tracks);

  /** Σ liked-track runtime (ms) per country — the 'hours' heat metric and the listening-hours stat. */
  readonly durationByCountry = computed(() => this.aggregates().duration);

  /**
   * Which metric colours the globe. Guide extension (M6, D8): the source hard-codes `heat =
   * tracksByCountry`. Both underlying maps are filter-aware (they come from {@link aggregates}), so
   * the genre / era / timeline filters apply in either mode.
   */
  private readonly _heatMode = signal<HeatMode>('tracks');
  readonly heatMode = this._heatMode.asReadonly();

  /** Heat per country (ISO alpha-2 → weight): liked-track count in 'tracks' mode, Σ ms in 'hours'. */
  readonly heat = computed(() =>
    this._heatMode() === 'hours' ? this.durationByCountry() : this.tracksByCountry(),
  );

  /** Set the heat metric (recolours the globe). */
  setHeatMode(mode: HeatMode): void {
    this._heatMode.set(mode);
  }

  /** Flip tracks ↔ hours. */
  toggleHeatMode(): void {
    this._heatMode.update((mode) => (mode === 'tracks' ? 'hours' : 'tracks'));
  }

  /**
   * Genre tags present across placed artists, most-common first, for the genre-filter picker.
   * Only artists with a resolved country count, since those are the ones that colour the globe.
   */
  readonly availableGenres = computed(() => {
    const counts = new Map<string, number>();
    for (const artist of this._artists().values()) {
      if (artist.countryCode === null) {
        continue;
      }
      for (const genre of artist.genres ?? []) {
        counts.set(genre, (counts.get(genre) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([genre, count]) => ({ genre, count }));
  });

  /**
   * Distinct `'YYYY-MM'` months in which the user liked a track by a *placed* artist, oldest-first —
   * the discrete steps the timeline scrubber slides across. Only placed artists count, since they're
   * the ones that colour the globe as the map fills in.
   */
  readonly timelineMonths = computed(() => {
    this.likedIndex.revision();
    const artists = this._artists();
    const months = new Set<string>();
    for (const track of this.likedIndex.all()) {
      const primaryId = track.artistIds[0];
      if (primaryId === undefined) {
        continue;
      }
      const artist = artists.get(primaryId);
      if (artist === undefined || artist.countryCode === null) {
        continue;
      }
      months.add(track.addedAt.slice(0, 7));
    }
    return [...months].sort();
  });

  /**
   * Release decades present across placed artists' liked tracks (decade-start year + track count),
   * oldest-first — the chips for the release-era filter. Tracks with an unparseable release date are
   * skipped.
   */
  readonly availableDecades = computed(() => {
    this.likedIndex.revision();
    const artists = this._artists();
    const counts = new Map<number, number>();
    for (const track of this.likedIndex.all()) {
      const primaryId = track.artistIds[0];
      if (primaryId === undefined) {
        continue;
      }
      const artist = artists.get(primaryId);
      if (artist === undefined || artist.countryCode === null) {
        continue;
      }
      const year = releaseYear(track.releaseDate);
      if (year === null) {
        continue;
      }
      const decade = Math.floor(year / 10) * 10;
      counts.set(decade, (counts.get(decade) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([decade, count]) => ({ decade, count }));
  });

  /** Restrict the heat to a single genre tag; null clears it. */
  setGenre(genre: string | null): void {
    this._genreFilter.set(genre);
  }

  /** Replay the map's fill-in up to this `'YYYY-MM'` (inclusive); null returns to the live view. */
  setAsOfMonth(month: string | null): void {
    this._asOfMonth.set(month);
  }

  /** Restrict the heat to tracks released in these decades (decade-start years); null/empty clears it. */
  setEraDecades(decades: ReadonlySet<number> | null): void {
    this._eraDecades.set(decades === null || decades.size === 0 ? null : decades);
  }

  /** The busiest country's value — the hot end of the legend's scale. */
  readonly maxHeat = computed(() => {
    let max = 0;
    for (const weight of this.heat().values()) {
      if (weight > max) {
        max = weight;
      }
    }
    return max;
  });

  /** Resolved ISO alpha-2 for a Spotify artist id from the current dataset, else null. */
  countryOf(artistId: string): string | null {
    return this._artists().get(artistId)?.countryCode ?? null;
  }

  /** Whether the user follows an artist (from the dataset), or undefined if not yet checked. */
  followingOf(artistId: string): boolean | undefined {
    return this._artists().get(artistId)?.following;
  }

  /** Spotify genre tags for an artist (from the dataset), or undefined if not yet checked. */
  genresOf(artistId: string): string[] | undefined {
    return this._artists().get(artistId)?.genres;
  }

  /** Record a follow/unfollow locally (optimistic UI from the library list); sticky + persisted. */
  setFollowing(artistId: string, value: boolean): void {
    const artist = this.working.get(artistId);
    if (artist === undefined) {
      return;
    }
    artist.following = value;
    this.publish();
    this.saveDebounced();
  }

  /** Dismiss an artist from the "couldn't place" list (e.g. one that has no real country). */
  hideUnplaced(artistId: string): void {
    const artist = this.working.get(artistId);
    if (artist === undefined) {
      return;
    }
    artist.hidden = true;
    this.publish();
    this.saveDebounced();
  }

  /** Hydrate the saved dataset from localStorage straight into the globe view. No network. */
  restore(): void {
    const snapshot = this.cache.load();
    if (snapshot === null) {
      return;
    }
    this.working = new Map(snapshot.artists.map((artist) => [artist.id, { ...artist }]));
    for (const artist of this.working.values()) {
      if (artist.manual && artist.countryCode !== null) {
        this.manualOverrides.set(artist.id, artist.countryCode);
      }
    }
    this._computedAt.set(snapshot.computedAt);
    this._oldest.set(snapshot.oldest);
    this._newest.set(snapshot.newest);
    this.publish();
  }

  /**
   * Refresh the dataset. `fullRescan` (or having no data) re-pages the entire library and retries
   * every unresolved artist, while reusing countries + genres already resolved by a previous scan so
   * only new or previously-failed artists hit the network; otherwise an incremental pass fetches only
   * likes newer than the last scan. Runs in the background; `isResolving` reflects progress.
   */
  async recalculate(fullRescan = false): Promise<void> {
    if (this._resolving()) {
      return;
    }
    // Don't launch a scan into an open 429 cooldown (persisted, so it survives reloads): queueing
    // thousands of paced requests behind a multi-minute ban would just hang and re-trip it. Checked
    // across all hosts — a scan drives Spotify (paging) plus Wikidata + MusicBrainz (resolution).
    const waitMs = this.limits.maxRetryAfterMs();
    if (waitMs > 0) {
      const mins = Math.ceil(waitMs / 60_000);
      this.log.log(
        `A music data source is rate-limiting the app — try again in about ${mins} min.`,
        'error',
      );
      this.toast.error(`The app is being rate-limited. Please try again in about ${mins} min.`);
      return;
    }
    if (fullRescan || !this.hasData()) {
      await this.load();
    } else {
      await this.incremental();
    }
  }

  /**
   * Re-resolve only the artists whose country couldn't be found — no Spotify refetch. Runs in the
   * background; `isResolving` reflects progress.
   */
  async recheckUnplaced(): Promise<void> {
    if (this._resolving()) {
      return;
    }
    const failed = [...this.working.values()].filter((a) => a.failed && !a.manual);
    if (failed.length === 0) {
      return;
    }
    this.resetQueues();
    for (const artist of failed) {
      artist.tried = false;
      artist.failed = false;
      this.enqueueFast(artist.id);
    }
    this.publish();
    this.log.clear();
    this.log.log(`Rechecking ${failed.length} unplaced artists…`);

    this._resolving.set(true);
    try {
      await Promise.all([this.fastWorker(), this.slowWorker(), this.genreWorker()]);
      this._computedAt.set(Date.now());
      this.log.log(
        `Done — ${this.resolvedCount()} artists placed, ${this.failedCount()} still unplaced`,
        'success',
      );
    } catch {
      this.log.log('Could not recheck artists.', 'error');
      this.toast.error('Could not recheck artists. Please try again.');
    } finally {
      this._resolving.set(false);
      this.save();
    }
  }

  /**
   * Backfill artist metadata — Spotify genres + follow state — for placed artists still missing it.
   * Backs the boot sync's "artists" step and the Actions "Check for updates" for artists: cheap (zero
   * network) when nothing is missing. No-op while a scan is already running.
   */
  async syncArtistInfo(): Promise<void> {
    if (this._resolving()) {
      return;
    }
    this._resolving.set(true);
    try {
      await Promise.all([this.loadFollowing(), this.loadGenres()]);
    } finally {
      this._resolving.set(false);
      this.save();
    }
  }

  /**
   * Re-fetch genres + follow state for every placed artist from scratch — the Actions "Full re-scan"
   * for the artists domain — dropping the cached values first so they're all re-resolved.
   */
  async refreshArtistInfo(): Promise<void> {
    if (this._resolving()) {
      return;
    }
    for (const artist of this.working.values()) {
      if (artist.countryCode !== null) {
        artist.genres = undefined;
        artist.following = undefined;
      }
    }
    await this.syncArtistInfo();
  }

  /** Kept for the (now unused) scan experience's done callback. */
  showGlobe(): void {
    this._phase.set('globe');
  }

  /**
   * Manually assign a country to an artist; sticky across future runs. Works even for an artist not
   * yet in the globe dataset (e.g. opened from the library): a minimal entry is created so the choice
   * persists and shows up. `name` labels that new entry — ignored when the artist already exists.
   */
  setCountry(artistId: string, countryCode: string, name = ''): void {
    this.manualOverrides.set(artistId, countryCode);
    let artist = this.working.get(artistId);
    if (artist === undefined) {
      artist = {
        id: artistId,
        name,
        trackCount: 0,
        durationMs: 0,
        countryCode: null,
        tried: false,
        failed: false,
        manual: false,
      };
      this.working.set(artistId, artist);
    }
    artist.countryCode = countryCode;
    artist.manual = true;
    artist.tried = true;
    artist.failed = false;
    this.publish();
    this.save();
  }

  /** Fold fresh genre tags for an artist back into the dataset (from the artist page's `GET /artists/{id}`). */
  setGenres(artistId: string, genres: string[]): void {
    const artist = this.working.get(artistId);
    if (artist === undefined) {
      return;
    }
    artist.genres = genres;
    this.publish();
    this.saveDebounced();
  }

  /** Wipe persisted + in-memory data (e.g. before a fresh run). */
  clearData(): void {
    this.cache.clear();
    this.likedIndex.clear();
    this.working = new Map();
    this.manualOverrides.clear();
    this.resetQueues();
    this._computedAt.set(null);
    this._oldest.set(null);
    this._newest.set(null);
    // Clear heat filters so a stale genre/era/timeline choice can't blank the next dataset's globe.
    this._genreFilter.set(null);
    this._eraDecades.set(null);
    this._asOfMonth.set(null);
    this.publish();
  }

  /** Full scan: re-page the whole library from scratch, then resolve every artist's country. */
  private async load(): Promise<void> {
    this.log.clear();
    this.log.log('Starting a full scan of your Liked Songs…');
    // Carry over auto-resolved countries from the previous scan so re-paging the library (to pick up
    // added/removed likes) doesn't re-resolve artists we already placed. Manual fixups ride along via
    // `manualOverrides`; previously-failed artists are left out so the rescan retries them.
    this.reuseOrigins = new Map(
      [...this.working.values()]
        .filter((a) => a.countryCode !== null && !a.manual)
        .map((a) => [a.id, a.countryCode as string]),
    );
    // Genre tags are a stable per-artist fact; carry them over so a full rescan doesn't re-hit
    // `GET /artists/{id}` (no bulk endpoint since the Feb 2026 migration) for every known artist.
    this.reuseGenres = new Map(
      [...this.working.values()]
        .filter((a) => a.genres !== undefined)
        .map((a) => [a.id, a.genres as string[]]),
    );
    this.working = new Map();
    this.resetQueues();
    this.likedIndex.beginFull();
    this._oldest.set(null);
    this._newest.set(null);
    this.publish();

    this._resolving.set(true);
    this.streaming = true;
    // Resolve countries + genres + paint the globe as pages stream in, rather than after the whole
    // library is paged — a full scan is long, so progress must be visible from the first page.
    const resolveAll = Promise.all([this.fastWorker(), this.slowWorker(), this.genreWorker()]);
    try {
      let oldest: string | null = null;
      let newest: string | null = null;
      let tracks = 0;
      for await (const page of this.spotify.streamLikedTracks()) {
        for (const track of page) {
          if (oldest === null || track.addedAt < oldest) {
            oldest = track.addedAt;
          }
          if (newest === null || track.addedAt > newest) {
            newest = track.addedAt;
          }
          this.likedIndex.add(track);
          // Only the primary (main) artist counts toward the globe; Spotify lists them first.
          const main = track.artists[0];
          if (main !== undefined) {
            this.accumulate(main, track.durationMs);
          }
        }
        tracks += page.length;
        // Commit the watermarks per page so a mid-stream failure still persists scan progress
        // (otherwise newest stays null and every later recalculate falls back to a full rescan).
        this._oldest.set(oldest);
        this._newest.set(newest);
        this.likedIndex.commit(newest);
        this.publishProgress();
        this.log.log(`Fetched ${tracks} liked songs · ${this.working.size} artists so far`);
      }
    } catch {
      this.log.log('Could not load your Liked Songs from Spotify.', 'error');
      this.toast.error('Could not load your Liked Songs from Spotify. Please try again.');
    } finally {
      // Signal the workers no more artists are coming, then let them drain what's queued.
      this.streaming = false;
      await resolveAll;
      this.publish(); // flush the final resolved state (clears any pending throttled paint)
      // Independent tail fetches (disjoint fields) — run together to halve the post-scan wait.
      await Promise.all([this.loadFollowing(), this.loadGenres()]);
      this._computedAt.set(Date.now());
      this.log.log(
        `Done — ${this.resolvedCount()} artists placed across ${this.heat().size} countries` +
          (this.failedCount() > 0 ? `, ${this.failedCount()} unplaced` : ''),
        'success',
      );
      this._resolving.set(false);
      this.reuseOrigins = new Map();
      this.reuseGenres = new Map();
      this.save();
      this.syncPlaylists();
    }
  }

  /** Incremental pass: page only likes newer than the last scan, then resolve the new artists. */
  private async incremental(): Promise<void> {
    const since = this._newest();
    if (since === null) {
      await this.load();
      return;
    }
    this.resetQueues();
    this.likedIndex.beginIncremental();
    this.log.clear();
    this.log.log('Checking Spotify for new favourites…');

    this._resolving.set(true);
    this.streaming = true;
    // Resolve + paint as new likes stream in (see load()); workers idle until pages arrive.
    const resolveAll = Promise.all([this.fastWorker(), this.slowWorker(), this.genreWorker()]);
    try {
      let newest = since;
      let added = 0;
      pages: for await (const page of this.spotify.streamLikedTracks()) {
        for (const track of page) {
          // Newest-first: once we reach the last scan's frontier, everything older is known.
          if (track.addedAt <= since) {
            break pages;
          }
          if (track.addedAt > newest) {
            newest = track.addedAt;
          }
          this.likedIndex.add(track);
          added += 1;
          // Only the primary (main) artist counts toward the globe; Spotify lists them first.
          const main = track.artists[0];
          if (main !== undefined) {
            this.accumulate(main, track.durationMs);
          }
        }
        // Advance the watermark per page so a mid-stream failure keeps the progress made so far.
        this._newest.set(newest);
        this.likedIndex.commit(newest);
        this.publishProgress();
        this.log.log(`Found ${added} new liked songs so far`);
      }
      // Covers the case where the frontier is reached on the first page (no per-page set ran).
      this._newest.set(newest);
      this.likedIndex.commit(newest);
      this.log.log(
        added === 0 ? 'No new liked songs since the last scan.' : `${added} new liked songs`,
      );
      // Retry previously-unresolved artists alongside any newly discovered ones. Done while still
      // streaming=true so the workers can't drain-and-exit before these are enqueued.
      let retried = 0;
      for (const artist of this.working.values()) {
        if (artist.failed && !artist.manual) {
          artist.tried = false;
          artist.failed = false;
          this.enqueueFast(artist.id);
          retried += 1;
        }
      }
      if (retried > 0) {
        this.log.log(`Retrying ${retried} previously unplaced artists`);
      }
      this.publishProgress();
    } catch {
      this.log.log('Could not fetch new favourites.', 'error');
      this.toast.error('Could not fetch new favourites. Please try again.');
    } finally {
      this.streaming = false;
      await resolveAll;
      this.publish(); // flush the final resolved state (clears any pending throttled paint)
      // Independent tail fetches (disjoint fields) — run together to halve the post-scan wait.
      await Promise.all([this.loadFollowing(), this.loadGenres()]);
      this._computedAt.set(Date.now());
      this.log.log(
        `Done — ${this.resolvedCount()} artists placed across ${this.heat().size} countries` +
          (this.failedCount() > 0 ? `, ${this.failedCount()} unplaced` : ''),
        'success',
      );
      this._resolving.set(false);
      this.save();
      this.syncPlaylists();
    }
  }

  /**
   * Keep the playlist-membership index fresh alongside the favourites scan, so the library tools
   * reflect playlist changes without a separate manual refresh. Runs after country resolution as a
   * background ride-along: it drives its own progress UI and never blocks or breaks the scan (the
   * favourites scan surfaces its own errors; a sync failure just leaves the last good index).
   */
  private syncPlaylists(): void {
    void this.playlistIndex.sync().catch(() => undefined);
  }

  /**
   * Bulk-resolve Spotify "is following" for every artist whose state is still unknown, then persist
   * it on the dataset. Run at the tail of each scan so the library list (M10) reads it straight from
   * cache. Non-fatal: on error (e.g. a token issued before the `user-follow-read` scope) the state
   * stays unknown and a later scan retries, so it never breaks the country scan it rides along with.
   */
  private async loadFollowing(): Promise<void> {
    const ids = [...this.working.values()]
      .filter((artist) => artist.following === undefined)
      .map((artist) => artist.id);
    if (ids.length === 0) {
      return;
    }
    try {
      const flags = await this.spotify.getFollowedArtistsContains(ids);
      ids.forEach((id, i) => {
        const artist = this.working.get(id);
        if (artist !== undefined) {
          artist.following = flags[i] ?? false;
        }
      });
      this.publish();
      this.log.log(`Loaded follow status for ${ids.length} artists`);
    } catch {
      // Leave following unknown — a later scan retries it.
    }
  }

  /**
   * Tail genre sweep for any placed artist still missing tags once the scan ends. The {@link
   * genreWorker} enriches artists live as they're placed, so this normally finds nothing — it only
   * mops up stragglers that never passed through the country workers (manual fixups, or a pre-genre
   * dataset being backfilled). Only placed artists are fetched, since unplaced ones never colour the
   * globe. Non-fatal: on error the tags stay unknown and a later scan retries.
   */
  private async loadGenres(): Promise<void> {
    const ids = [...this.working.values()]
      .filter((artist) => artist.genres === undefined && artist.countryCode !== null)
      .map((artist) => artist.id);
    if (ids.length === 0) {
      return;
    }
    try {
      this.log.log(`Fetching genres for ${ids.length} remaining artists…`);
      const genres = await this.spotify.getArtistGenres(ids, (done, total) => {
        if (done % RESOLVE_BATCH_SIZE === 0 && done !== total) {
          this.log.log(`Genres: ${done} / ${total} artists`);
        }
      });
      ids.forEach((id, i) => {
        const artist = this.working.get(id);
        const fetched = genres[i];
        // null/undefined = the per-artist fetch failed; leave genres undefined so a later sweep
        // retries it rather than persisting a transient failure as a permanent empty result.
        if (artist !== undefined && fetched != null) {
          artist.genres = fetched;
        }
      });
      this.publish();
      this.log.log(`Loaded genres for ${ids.length} artists`, 'success');
    } catch {
      // Leave genres unknown — a later scan retries them.
    }
  }

  /** Fast pass: drains the fast queue in batches via Wikidata-by-Spotify-id; misses → slow queue. */
  private async fastWorker(): Promise<void> {
    for (;;) {
      const batch = this.fastQueue.splice(0, RESOLVE_BATCH_SIZE);
      if (batch.length === 0) {
        // Empty queue: keep waiting while pages are still arriving; only stop once paging is done.
        if (this.streaming) {
          await delay(WORKER_IDLE_MS);
          continue;
        }
        break;
      }
      const results = await this.resolution.resolveBatchBySpotifyId(batch);
      let placed = 0;
      for (const id of batch) {
        const artist = this.working.get(id);
        if (artist === undefined || artist.manual || artist.tried) {
          continue;
        }
        const code = results.get(id) ?? null;
        if (code !== null) {
          artist.countryCode = code;
          artist.tried = true;
          artist.failed = false;
          placed += 1;
          this.enqueueGenre(id);
        } else {
          this.enqueueSlow(id);
        }
      }
      this.publishProgress();
      this.saveDebounced();
      this.log.log(
        `Wikidata: placed ${placed} of ${batch.length} artists`,
        placed > 0 ? 'success' : 'info',
      );
    }
    this.fastDone = true;
  }

  /** Slow pass: per-artist MusicBrainz fallback for the fast-pass misses. */
  private async slowWorker(): Promise<void> {
    for (;;) {
      const id = this.slowQueue.shift();
      if (id === undefined) {
        // Nothing queued: exit only once the fast pass is done feeding this queue; else idle-wait.
        if (this.fastDone) {
          break;
        }
        await delay(WORKER_IDLE_MS);
        continue;
      }
      const artist = this.working.get(id);
      if (artist === undefined || artist.manual || artist.tried) {
        continue;
      }
      const code = await this.resolution.resolveByName(artist.name);
      artist.tried = true;
      artist.countryCode = code;
      artist.failed = code === null;
      if (code !== null) {
        this.enqueueGenre(id);
      }
      this.publishProgress();
      this.saveDebounced();
      this.log.log(
        code !== null ? `MusicBrainz: ${artist.name} → ${code}` : `Couldn't place ${artist.name}`,
        code !== null ? 'success' : 'warn',
      );
    }
    this.slowDone = true;
  }

  /**
   * Genre pass: runs *alongside* the country workers, draining artists queued the moment they're
   * placed and fetching their Spotify genre tags in batches (each batch fans out per-artist, since
   * the Feb 2026 migration removed the bulk `/artists?ids=`). Overlapping the genre fetch with the
   * rate-limited paging spreads those per-artist calls across the whole scan — gentler on Spotify's
   * limit than bursting them at the end, and it hides the wait behind paging. Idles while more
   * artists may still arrive (streaming, or the country workers aren't finished); exits once both are
   * done and the queue is empty. Non-fatal: {@link SpotifyApi.getArtistGenres} swallows per-id
   * errors, so it never rejects the scan.
   */
  private async genreWorker(): Promise<void> {
    for (;;) {
      const batch = this.genreQueue.splice(0, RESOLVE_BATCH_SIZE);
      if (batch.length === 0) {
        if (this.streaming || !this.fastDone || !this.slowDone) {
          await delay(WORKER_IDLE_MS);
          continue;
        }
        break;
      }
      const genres = await this.spotify.getArtistGenres(batch);
      batch.forEach((id, i) => {
        const artist = this.working.get(id);
        const fetched = genres[i];
        // Leave genres undefined on a failed fetch (null/undefined) so the tail sweep retries it,
        // instead of persisting a transient blip as a permanent "no genres".
        if (artist !== undefined && fetched != null) {
          artist.genres = fetched;
        }
      });
      this.publishProgress();
      this.saveDebounced();
      this.log.log(`Genres: fetched ${batch.length} artists`);
    }
  }

  /** Count one liked-track appearance for an artist (new or existing), summing its runtime. */
  private accumulate(ref: ArtistRef, durationMs: number): void {
    const existing = this.working.get(ref.id);
    if (existing !== undefined) {
      existing.trackCount += 1;
      existing.durationMs += durationMs;
      return;
    }
    const manual = this.manualOverrides.get(ref.id) ?? null;
    // A manual fixup wins; otherwise reuse a country resolved by a previous scan (full-rescan only).
    const known = manual ?? this.reuseOrigins.get(ref.id) ?? null;
    this.working.set(ref.id, {
      id: ref.id,
      name: ref.name,
      trackCount: 1,
      durationMs,
      countryCode: known,
      tried: known !== null,
      failed: false,
      manual: manual !== null,
      // Reuse genres from a previous scan (full-rescan only) so loadGenres() skips re-fetching them.
      genres: this.reuseGenres.get(ref.id),
    });
    if (known === null) {
      this.enqueueFast(ref.id);
    }
  }

  private enqueueFast(id: string): void {
    if (!this.fastQueued.has(id)) {
      this.fastQueued.add(id);
      this.fastQueue.push(id);
    }
  }

  private enqueueSlow(id: string): void {
    if (!this.slowQueued.has(id)) {
      this.slowQueued.add(id);
      this.slowQueue.push(id);
    }
  }

  /** Queue a just-placed artist for genre enrichment (skips ones whose genres are already known). */
  private enqueueGenre(id: string): void {
    if (this.working.get(id)?.genres !== undefined) {
      return;
    }
    if (!this.genreQueued.has(id)) {
      this.genreQueued.add(id);
      this.genreQueue.push(id);
    }
  }

  private resetQueues(): void {
    this.fastQueue.length = 0;
    this.slowQueue.length = 0;
    this.genreQueue.length = 0;
    this.fastQueued.clear();
    this.slowQueued.clear();
    this.genreQueued.clear();
    this.fastDone = false;
    this.slowDone = false;
    this.streaming = false;
  }

  private publish(): void {
    clearTimeout(this.publishTimer);
    this.publishTimer = undefined;
    this._artists.set(new Map(this.working));
  }

  /**
   * Publish a mid-scan progress update, coalesced to at most one paint per {@link PUBLISH_THROTTLE_MS}
   * while streaming (outside a scan it publishes immediately). The scan's finally block flushes the
   * final state with a direct {@link publish}, so a pending throttle never drops the last update.
   */
  private publishProgress(): void {
    if (!this.streaming) {
      this.publish();
      return;
    }
    if (this.publishTimer !== undefined) {
      return; // a paint is already scheduled — this update rides along with it
    }
    this.publishTimer = setTimeout(() => {
      this.publishTimer = undefined;
      this._artists.set(new Map(this.working));
    }, PUBLISH_THROTTLE_MS);
  }

  private snapshot(): OriginsSnapshot {
    return {
      version: 2,
      computedAt: this._computedAt() ?? Date.now(),
      oldest: this._oldest(),
      newest: this._newest(),
      artists: [...this.working.values()],
    };
  }

  private saveDebounced(): void {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.save(), SAVE_DEBOUNCE_MS);
  }

  private save(): void {
    clearTimeout(this.saveTimer);
    if (!this.cache.save(this.snapshot()) && !this.saveFailed) {
      // Warn once per session so a full localStorage doesn't spam a toast on every debounced save.
      this.saveFailed = true;
      this.toast.error('Could not save your globe data — browser storage may be full.');
    }
  }
}

/** Leading 4-digit year of a Spotify release date (`YYYY` | `YYYY-MM` | `YYYY-MM-DD`), else null. */
function releaseYear(releaseDate: string): number | null {
  const year = Number(releaseDate.slice(0, 4));
  return Number.isInteger(year) && year > 0 ? year : null;
}

/** Add `value` to a country's running total in `map` (initialising the entry at 0). */
function addTo(map: Map<string, number>, code: string, value: number): void {
  map.set(code, (map.get(code) ?? 0) + value);
}

/** Append an artist to its country's list in `map` (initialising the list). */
function pushTo(map: Map<string, ArtistOrigin[]>, code: string, artist: ArtistOrigin): void {
  const list = map.get(code);
  if (list === undefined) {
    map.set(code, [artist]);
  } else {
    list.push(artist);
  }
}
```

### `src/app/features/library/library-store.ts`
The complete `LibraryStore` is rendered in [step 08](08_library-store.md) — paste that file. (Not repeated here
to keep this checkpoint navigable; it is unchanged from the step.)

### The library feature components + shared confirm
Each of the following is rendered complete in its own step — paste from there; none changed after their step:
- `shared/components/confirm-dialog/confirm-dialog.{ts,html,scss}` + `shared/confirm.ts` → [step 09](09_confirm-dialog.md)
- `features/library/alphabet-bar/*` → [step 10](10_alphabet-bar.md)
- `features/library/artist-table/*` → [step 11](11_artist-table.md)
- `features/library/library-page/*` → [step 12](12_library-page.md)
- `features/library/release-compare/*` + `features/library/relink-substitute/*` → [step 13](13_relink-dialogs.md)
- `features/library/artist-tidy/*` → [step 14](14_artist-tidy.md)
- `features/library/liked-songs/*` → [step 15](15_liked-songs.md)
- `features/library/library-tidy/*` → [step 16](16_library-tidy.md)

### `src/app/shared/components/header/header.html`
```html
<mat-toolbar class="header">
  <a class="brand" routerLink="/globe">EarthViewMusic</a>
  @if (hasSession()) {
    <app-player-bar class="player" />
  }
  <span class="spacer"></span>
  <nav class="nav">
    @if (hasSession()) {
      <a
        mat-button
        routerLink="/globe"
        routerLinkActive="active"
        [disabled]="syncing()"
        title="Back to the globe"
      >
        <mat-icon>public</mat-icon>
        Globe
      </a>
      <a
        mat-button
        routerLink="/actions"
        routerLinkActive="active"
        [disabled]="syncing()"
        title="Scan &amp; manage your data"
      >
        <mat-icon>storage</mat-icon>
        Actions
      </a>
      <a
        mat-button
        routerLink="/library"
        routerLinkActive="active"
        [disabled]="syncing()"
        title="Browse &amp; tidy your liked songs"
      >
        <mat-icon>queue_music</mat-icon>
        Library
      </a>
      <button mat-button (click)="logout()">Log out</button>
    }
  </nav>
</mat-toolbar>
```

### `src/app/app.routes.ts`
```ts
import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth-guard';
import { bootSyncGuard } from './core/pipeline/boot-sync-guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'globe' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./features/auth/callback-page/callback-page').then((m) => m.CallbackPage),
  },
  {
    path: 'globe',
    canActivate: [authGuard, bootSyncGuard],
    loadComponent: () => import('./features/globe/globe-page/globe-page').then((m) => m.GlobePage),
  },
  {
    path: 'actions',
    canActivate: [authGuard, bootSyncGuard],
    loadComponent: () =>
      import('./features/actions/actions-page/actions-page').then((m) => m.ActionsPage),
  },
  {
    path: 'library',
    canActivate: [authGuard, bootSyncGuard],
    loadComponent: () =>
      import('./features/library/library-page/library-page').then((m) => m.LibraryPage),
  },
  {
    path: 'library/tracks',
    canActivate: [authGuard, bootSyncGuard],
    loadComponent: () =>
      import('./features/library/liked-songs/liked-songs').then((m) => m.LikedSongs),
  },
  {
    path: 'library/tidy',
    canActivate: [authGuard, bootSyncGuard],
    loadComponent: () =>
      import('./features/library/library-tidy/library-tidy').then((m) => m.LibraryTidy),
  },
  {
    path: 'library/artist/:id',
    canActivate: [authGuard, bootSyncGuard],
    loadComponent: () =>
      import('./features/library/artist-tidy/artist-tidy').then((m) => m.ArtistTidy),
  },
  { path: '**', redirectTo: 'globe' },
];
```

## What you have now (cumulative)
On top of the M0–M9 app (login → resilient HTTP → Liked-Songs scan → globe heat → hover panel → live player →
Trip mode → explore controls + boot-sync + Actions page + playlist index), you now have a full **library
console**. `/library` browses every liked artist A–Z with letter/search/status filters and column sort; opening
one shows its discography with each liked track annotated `ok`/`relink`/`unavailable`, ISRC-only duplicate
groups, relink suggestions, and playlist-membership editing. Actions are **reversible**: a relink/dedup/import
commits to Spotify first, then patches `LikedIndex` (no rescan), with a symmetric **Undo** toast; a relinked
track that lives in playlists gets a position-preserving substitution. Follow/origin edits write back to the
globe dataset and re-colour the map. `/library/tracks` is the flat all-liked-songs view; `/library/tidy` scans
the whole library for outstanding relink/duplicate work. The pure `track-matching` engine underpins all of it.

## Troubleshooting
| Symptom | Likely cause → fix |
|---------|--------------------|
| `/library` redirects to `/globe` | A `**` wildcard sits above the library routes — the four `/library*` routes must precede it (step 17). |
| Relink loses a like on a Spotify error | `commitChange` must **save before remove** (step 08); a swapped order can drop a like on a partial failure. |
| Duplicates tab shows fuzzy near-dupes | The `!key.startsWith('isrc:')` guard in `analyseArtist` was dropped — D6 requires ISRC-only groups (step 02). |
| Undo toast does nothing | `Toast.action` (M1) returns the `Promise<boolean>`; the toast auto-dismisses after 7 s — click Undo before then. |
| Follow toggle reverts on reload | `GlobeStore.setFollowing` must `saveDebounced()` (step 07); without it the optimistic flag isn't persisted. |
| `Property 'addTracks'/'removeTracks' missing on LikedIndex` | Step 05 wasn't applied — those are the M10 relink/dedup mutations `commitChange` relies on. (`clear` is older — built in M3 step 06.) |
| Artist detail never loads | The `:id` route (step 17) or the `effect()`/`untracked` load (step 14) is missing; `ArtistTidy` reads `route.paramMap` as a signal. |
| Playlist chips never appear | `ensurePlaylistIndex()` didn't finish (a first-ever build pages every playlist) — wait for it, or check the Actions page's playlist sync (M9). |

## Next
Continue to **[M11 — Settings, data transfer & polish](../MILESTONE_11_settings-data-polish/00_overview.md)**:
live appearance/lighting/marker settings mirrored to CSS vars + the renderer, and `localStorage` export → wipe →
re-import round-tripping the whole dataset — where the shared `Confirm` dialog added here backs the "Clear all
data" control.
