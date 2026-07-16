# M10 · Step 08 of 18 — The `LibraryStore` orchestrator (reversible `applyChange`)
> Nav: [← Grow GlobeStore](07_globe-store-grow.md) · [Overview](00_overview.md) · [Shared ConfirmDialog →](09_confirm-dialog.md)

## Glossary for this step
> **orchestrator store** — the one root-singleton that wires the pure engine, the caches, the Spotify client, and
> the three indexes into the state + methods the library UI binds to. Smart pages read its signals and call its
> methods; they never touch the API or caches directly.
> **reversible action** — a library change that can be undone symmetrically. `applyChange` runs it, offers an
> **Undo** toast, and on Undo runs the mirror-image change (swap `saved` ↔ `removed`).
> **save-before-remove** — always add the new copies *before* deleting the old ones, so a mid-way failure can
> leave a duplicate (both liked) but can **never lose a like outright**.

## Why / design
This is the milestone's centre of gravity — one big store. The load-bearing ideas:

1. **Master rows** (`allRows` → `visibleRows`) come from the **globe dataset** (`GlobeStore.artists()`), joined
   with the prefs cache (reviewed/hidden). All the filter/sort/letter/search state lives here as signals; the
   page just binds them.
2. **Detail** (`openArtist`) lazily fetches + analyses one artist's discography: `getArtistAlbums` → per-album
   track ids → `getTracks` (ISRC enrichment) → `analyseArtist`. Results cache in memory + `DiscographyCache`.
3. **The reversible action pattern** — `applyChange(change, message)` → `commitChange(change)`:

   > **`commitChange` is the safety core.** It **saves the new copies first**, mirrors them into `LikedIndex`
   > *only after Spotify confirms*, **then** removes the old copies and mirrors that removal — again only after
   > Spotify confirms. So the local index never claims a change Spotify rejected, and a partial failure can dup
   > but never drop a like ([the D6 spirit](../foundation/decision-log.md#d6--isrc-only-duplicate-detection-per-id-fan-out-after-bulk-endpoint-removal)). `applyChange` wraps it with the **Undo** toast — on Undo it
   > runs `commitChange({ saved: removed, removed: saved })`, the exact mirror image.

4. **Follow/origin write-back** (`toggleFollow`, `setCountry`) goes through `GlobeStore` (step 07) — optimistic,
   reverted on failure, persisted on the dataset so the globe reflects it.
5. **Position-preserving playlist substitution** (`substituteInPlaylists`) — for a relinked track that sits in
   playlists: read each playlist's order, insert the new copy at the old one's slot (`addTracksToPlaylist(…,
   position)`), then remove the old — order preserved. The rare "same track twice in one playlist" case is
   handled so a substitution never silently deletes a copy.

**Scope note:** this store does **not** export or wipe data (M11's `DataTransfer`), and it never *auto-deletes*
on a fuzzy match — duplicate removal only ever runs on ISRC groups from the engine (step 02).

The file is long; it's shown **complete** below (and again in [step 18](18_verify.md)). Read the `applyChange` /
`commitChange` pair closely — the rest is plumbing around it.

## Do this
1. Create `src/app/features/library/library-store.ts` with the complete file below.
2. Confirm the eight injects resolve: `SpotifyApi`, `GlobeStore`, `LikedIndex`, `PlaylistIndex`,
   `LibraryPrefsCache`, `DiscographyCache`, `Toast`, `LogStore` — all `providedIn: 'root'` from earlier steps.
3. Note the interfaces exported for the UI: `ArtistRow`, `ArtistSortKey`, `SortDir`, `ArtistStatusFilter`,
   `LikedTrackRow`, `ArtistTidyResult` — the components (steps 11–16) import these.

## Code
### `src/app/features/library/library-store.ts`
```ts
import { computed, inject, Injectable, signal } from '@angular/core';

import { SpotifyApi } from '../../core/api/spotify-api';
import { DiscographyCache } from '../../core/cache/discography-cache';
import { LibraryPrefs, LibraryPrefsCache } from '../../core/cache/library-prefs-cache';
import { LogStore } from '../../core/logging/log-store';
import { largestImageUrl } from '../../core/mappers/spotify.mapper';
import { Album, AlbumTrack, DiscographyRelease } from '../../core/models/album';
import { ArtistOrigin } from '../../core/models/artist-origin';
import { IndexedTrack } from '../../core/models/indexed-track';
import {
  AlbumTrackRef,
  ArtistAnalysis,
  CompareRow,
  DuplicateGroup,
  RelinkSuggestion,
} from '../../core/models/library-analysis';
import { Playlist } from '../../core/models/playlist';
import { PlaylistTrackEntry, PlaylistTrackRef } from '../../core/models/playlist-index';
import { LikedIndex } from '../../core/pipeline/liked-index';
import { PlaylistIndex } from '../../core/pipeline/playlist-index';
import { analyseArtist } from '../../core/pipeline/track-matching';
import { Toast } from '../../shared/toast';
import { GlobeStore } from '../globe/globe-store';

/** One row of the alphabet master table. */
export interface ArtistRow {
  id: string;
  name: string;
  trackCount: number;
  /** Σ runtime (ms) of this artist's liked tracks — the "Hours" column. */
  durationMs: number;
  /** Resolved (or manually set) origin, ISO alpha-2 — null when still unplaced. */
  countryCode: string | null;
  /** Epoch ms of the last "Mark reviewed", or null. */
  reviewedAt: number | null;
  /** Following state: true/false once known, undefined while not yet checked. */
  following: boolean | undefined;
  hidden: boolean;
}

/** Column the master table is sorted by. */
export type ArtistSortKey = 'name' | 'tracks' | 'hours' | 'reviewed';
export type SortDir = 'asc' | 'desc';

/** Quick worklist filters over the master table. */
export type ArtistStatusFilter = 'all' | 'unreviewed' | 'unfollowed' | 'no-origin';

/** One row of the "all liked songs" table — a liked track resolved to its artist names. */
export interface LikedTrackRow {
  id: string;
  name: string;
  uri: string;
  /** Credited artist names, joined — resolved from the globe dataset (falls back to blank). */
  artists: string;
  albumName: string;
  /** ISO 8601 date the track was liked. */
  addedAt: string;
  durationMs: number;
  artistIds: string[];
}

/** Library copies to save + old copies to remove, as one reversible unit. */
interface LibraryChange {
  saved: IndexedTrack[];
  removed: IndexedTrack[];
}

/** One artist's outstanding tidy work, from the library-wide scan. */
export interface ArtistTidyResult {
  artistId: string;
  name: string;
  relinks: RelinkSuggestion[];
  duplicates: DuplicateGroup[];
}

/** `#` bucket for names that don't start with A–Z. */
const NON_ALPHA = '#';

/**
 * Orchestrates the library page: groups the globe's artists A–Z, lazily fetches + analyses an
 * artist's discography, and runs reversible relink / dedup / playlist / follow actions through the
 * Spotify API while patching the local liked index so the UI stays consistent without a rescan.
 */
@Injectable({ providedIn: 'root' })
export class LibraryStore {
  private readonly spotify = inject(SpotifyApi);
  private readonly globe = inject(GlobeStore);
  private readonly likedIndex = inject(LikedIndex);
  private readonly playlistIndex = inject(PlaylistIndex);
  private readonly prefsCache = inject(LibraryPrefsCache);
  private readonly discoCacheStore = inject(DiscographyCache);
  private readonly toast = inject(Toast);
  private readonly log = inject(LogStore);

  /** Cache of fetched discographies — avoids refetching on revisit; hydrated from + mirrored to
   * localStorage so it also survives a reload. Lazily loaded on first {@link discography} call. */
  private readonly discoCache = new Map<string, DiscographyRelease[]>();
  private discoCacheHydrated = false;

  private readonly _prefs = signal(this.prefsCache.load());
  private readonly _selectedLetter = signal<string | null>(null);
  private readonly _showHidden = signal(false);
  private readonly _search = signal('');
  private readonly _sortKey = signal<ArtistSortKey>('name');
  private readonly _sortDir = signal<SortDir>('asc');
  private readonly _statusFilter = signal<ArtistStatusFilter>('all');

  // --- Detail (one artist at a time) ---
  private readonly _detailId = signal<string | null>(null);
  private readonly _detailName = signal('');
  private readonly _detailPhoto = signal<string | null>(null);
  private readonly _detailLoading = signal(false);
  private readonly _detailError = signal(false);
  private readonly _releases = signal<DiscographyRelease[]>([]);
  private readonly _analysis = signal<ArtistAnalysis | null>(null);
  private readonly _playlists = signal<Playlist[]>([]);
  private readonly _busy = signal(false);

  // --- Library-wide tidy scan ---
  private readonly _tidyRunning = signal(false);
  private readonly _tidyScanned = signal(false);
  private readonly _tidyProgress = signal<{ done: number; total: number }>({ done: 0, total: 0 });
  private readonly _tidyResults = signal<ArtistTidyResult[]>([]);

  readonly selectedLetter = this._selectedLetter.asReadonly();
  readonly showHidden = this._showHidden.asReadonly();
  readonly search = this._search.asReadonly();
  readonly sortKey = this._sortKey.asReadonly();
  readonly sortDir = this._sortDir.asReadonly();
  readonly statusFilter = this._statusFilter.asReadonly();
  readonly hasData = this.likedIndex.hasData;
  readonly scanning = this.globe.isResolving;
  /** Bumps whenever the liked index changes — lets views recompute after relink/dedup. */
  readonly likedRevision = this.likedIndex.revision;

  readonly tidyRunning = this._tidyRunning.asReadonly();
  readonly tidyScanned = this._tidyScanned.asReadonly();
  readonly tidyProgress = this._tidyProgress.asReadonly();
  readonly tidyResults = this._tidyResults.asReadonly();
  readonly tidyRelinkTotal = computed(() =>
    this._tidyResults().reduce((sum, r) => sum + r.relinks.length, 0),
  );
  readonly tidyDuplicateTotal = computed(() =>
    this._tidyResults().reduce((sum, r) => sum + r.duplicates.length, 0),
  );

  readonly detailName = this._detailName.asReadonly();
  readonly detailPhoto = this._detailPhoto.asReadonly();
  readonly detailLoading = this._detailLoading.asReadonly();
  readonly detailError = this._detailError.asReadonly();
  readonly releases = this._releases.asReadonly();
  readonly analysis = this._analysis.asReadonly();
  readonly playlists = this._playlists.asReadonly();
  readonly busy = this._busy.asReadonly();

  // --- Playlist membership (which playlists hold each track) ---
  readonly playlistsBuilding = this.playlistIndex.building;
  readonly playlistsBuiltAt = this.playlistIndex.builtAt;
  readonly playlistProgress = this.playlistIndex.progress;
  readonly playlistRevision = this.playlistIndex.revision;
  /** Playlists the user can add to / remove from (owned or collaborative). */
  readonly editablePlaylists = this.playlistIndex.editablePlaylists;

  /**
   * Tracks crediting the open artist that live in the user's playlists but aren't in the fetched
   * discography (Spotify excludes `appears_on`) — surfaced as the "In your playlists" section.
   */
  readonly extraPlaylistTracks = computed<PlaylistTrackEntry[]>(() => {
    this.playlistRevision();
    const id = this._detailId();
    if (id === null) {
      return [];
    }
    const inDiscography = new Set(this._releases().flatMap((r) => r.tracks.map((t) => t.id)));
    return this.playlistIndex
      .tracksByArtist(id)
      .filter((entry) => !inDiscography.has(entry.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  /**
   * Every liked track as a flat row with resolved artist names — the "all liked songs" view.
   * Reactive on the liked index (relink/dedup edits) and the artist dataset (name resolution).
   */
  readonly allLikedTracks = computed<LikedTrackRow[]>(() => {
    this.likedRevision();
    const names = new Map(this.globe.artists().map((a) => [a.id, a.name]));
    return this.likedIndex.all().map((track) => ({
      id: track.id,
      name: track.name,
      uri: track.uri,
      artists: track.artistIds
        .map((id) => names.get(id))
        .filter((name): name is string => name !== undefined)
        .join(', '),
      albumName: track.albumName,
      addedAt: track.addedAt,
      durationMs: track.durationMs,
      artistIds: track.artistIds,
    }));
  });

  /** All liked artists with first-letter buckets, sorted by name. */
  private readonly allRows = computed<ArtistRow[]>(() => {
    const prefs = this._prefs();
    const hidden = new Set(prefs.hidden);
    return this.globe
      .artists()
      .map((origin: ArtistOrigin) => ({
        id: origin.id,
        name: origin.name,
        trackCount: origin.trackCount,
        durationMs: origin.durationMs,
        countryCode: origin.countryCode,
        reviewedAt: prefs.reviewedAt[origin.id] ?? null,
        // Following is resolved in bulk during the globe scan and cached on the dataset.
        following: origin.following,
        hidden: hidden.has(origin.id),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  /** Letters (A–Z plus `#`) that actually have artists — drives the alphabet bar. */
  readonly availableLetters = computed(() => {
    const letters = new Set<string>();
    for (const row of this.allRows()) {
      letters.add(letterOf(row.name));
    }
    return [...letters].sort();
  });

  /**
   * Rows to render: the selected letter (ignored while searching so results span all letters),
   * hidden ones dropped unless "Show hidden" is on, narrowed by the search text and the status
   * worklist filter, then ordered by the chosen sort column + direction.
   */
  readonly visibleRows = computed<ArtistRow[]>(() => {
    const letter = this._selectedLetter();
    const showHidden = this._showHidden();
    const query = this._search().trim().toLowerCase();
    const status = this._statusFilter();
    const rows = this.allRows().filter(
      (row) =>
        (query !== '' || letter === null || letterOf(row.name) === letter) &&
        (showHidden || !row.hidden) &&
        (query === '' || row.name.toLowerCase().includes(query)) &&
        matchesStatus(row, status),
    );
    return this.sortRows(rows);
  });

  /** Hidden-artist count in the current letter — surfaced on the "Show hidden (N)" toggle. */
  readonly hiddenCount = computed(() => {
    const letter = this._selectedLetter();
    return this.allRows().filter(
      (row) => row.hidden && (letter === null || letterOf(row.name) === letter),
    ).length;
  });

  /** Restore the globe dataset if the page is opened before the globe has loaded it. */
  initMaster(): void {
    // Hydrate the liked index from its cache so `hasData` reflects a previous scan — otherwise the
    // page's first-run "Scan my library" banner shows on every visit even when the data is cached.
    this.likedIndex.hydrate();
    // Hydrate the playlist membership index too so the Actions page can show its last-built time
    // (and the artist page its chips) from cache without forcing a rebuild.
    this.playlistIndex.hydrate();
    if (!this.globe.hasData()) {
      this.globe.restore();
    }
  }

  selectLetter(letter: string): void {
    // Picking a letter is a narrower intent than a live search — clear the query so the two don't
    // silently fight (a stale search would otherwise hide most of the chosen letter's artists).
    this._search.set('');
    this._selectedLetter.set(this._selectedLetter() === letter ? null : letter);
  }

  toggleShowHidden(): void {
    this._showHidden.update((v) => !v);
  }

  setSearch(query: string): void {
    this._search.set(query);
  }

  setStatusFilter(filter: ArtistStatusFilter): void {
    this._statusFilter.set(filter);
  }

  /** Sort by a column; re-selecting the active column flips its direction. */
  setSort(key: ArtistSortKey): void {
    if (this._sortKey() === key) {
      this._sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this._sortKey.set(key);
      // Name reads best A→Z; the numeric/date columns are most useful biggest/most-recent first.
      this._sortDir.set(key === 'name' ? 'asc' : 'desc');
    }
  }

  private sortRows(rows: ArtistRow[]): ArtistRow[] {
    const dir = this._sortDir() === 'asc' ? 1 : -1;
    const key = this._sortKey();
    return [...rows].sort((a, b) => {
      switch (key) {
        case 'tracks':
          return dir * (a.trackCount - b.trackCount);
        case 'hours':
          return dir * (a.durationMs - b.durationMs);
        case 'reviewed':
          // Never-reviewed (null) sort as oldest so "most recently reviewed" surfaces real dates.
          return dir * ((a.reviewedAt ?? 0) - (b.reviewedAt ?? 0));
        default:
          return dir * a.name.localeCompare(b.name);
      }
    });
  }

  /** Run the enriched library scan (reuses the globe pipeline) to populate the page on first run. */
  async scan(): Promise<void> {
    await this.globe.recalculate(true);
  }

  // --- Library-wide tidy scan (duplicates + relinks across every artist) ---

  /**
   * Walk every liked artist, fetch (cached) each discography, and analyse it for relink + duplicate
   * work — building the library-wide tidy list. Sequential and gentle on the API; discographies are
   * cached so a re-run after the first is cheap. Results stream in as each artist resolves.
   */
  async scanLibraryTidy(): Promise<void> {
    if (this._tidyRunning()) {
      return;
    }
    this._tidyRunning.set(true);
    this._tidyResults.set([]);
    const artists = this.globe.artists().filter((a) => a.trackCount > 0);
    this._tidyProgress.set({ done: 0, total: artists.length });
    const results: ArtistTidyResult[] = [];
    for (const artist of artists) {
      const liked = this.likedIndex.tracksByArtist(artist.id);
      if (liked.length > 0) {
        try {
          const analysis = analyseArtist(liked, await this.discography(artist.id));
          if (analysis.relinks.length > 0 || analysis.duplicates.length > 0) {
            results.push({
              artistId: artist.id,
              name: artist.name,
              relinks: analysis.relinks,
              duplicates: analysis.duplicates,
            });
            this._tidyResults.set([...results]); // stream partial progress into the view
          }
        } catch {
          // An artist whose discography can't be read is skipped — the scan carries on.
        }
      }
      this._tidyProgress.update((p) => ({ ...p, done: p.done + 1 }));
    }
    this._tidyScanned.set(true);
    this._tidyRunning.set(false);
  }

  /** Relink every suggested track for one artist, then refresh its tidy entry from cache. */
  async tidyRelinkAll(artistId: string): Promise<void> {
    const result = this._tidyResults().find((r) => r.artistId === artistId);
    if (result === undefined) {
      return;
    }
    await this.relinkAll(result.relinks);
    await this.refreshTidyArtist(artistId);
  }

  /** Drop the extra copies of one duplicate group, then refresh the artist's tidy entry. */
  async tidyRemoveDuplicates(artistId: string, group: DuplicateGroup): Promise<void> {
    await this.removeDuplicates(group, group.keep.id);
    await this.refreshTidyArtist(artistId);
  }

  /** Re-analyse one artist from the cached discography and patch (or drop) its tidy entry. */
  private async refreshTidyArtist(artistId: string): Promise<void> {
    let analysis: ArtistAnalysis;
    try {
      analysis = analyseArtist(
        this.likedIndex.tracksByArtist(artistId),
        await this.discography(artistId),
      );
    } catch {
      return;
    }
    this._tidyResults.update((list) =>
      list.flatMap((r) => {
        if (r.artistId !== artistId) {
          return [r];
        }
        if (analysis.relinks.length === 0 && analysis.duplicates.length === 0) {
          return [];
        }
        return [{ ...r, relinks: analysis.relinks, duplicates: analysis.duplicates }];
      }),
    );
  }

  /** Manually assign an artist's country of origin from the master table's inline picker (sticky). */
  setCountry(artistId: string, code: string): void {
    this.globe.setCountry(artistId, code);
  }

  // --- Following ---

  /**
   * Toggle following on Spotify. Following state lives on the globe dataset (resolved in bulk during
   * a scan), so the optimistic update + revert go through the globe store, which persists it.
   */
  async toggleFollow(id: string): Promise<void> {
    const current = this.globe.followingOf(id) ?? false;
    this.globe.setFollowing(id, !current); // optimistic
    try {
      if (current) {
        await this.spotify.unfollowArtists([id]);
      } else {
        await this.spotify.followArtists([id]);
      }
    } catch {
      this.globe.setFollowing(id, current); // revert
      this.toast.error('Could not update following on Spotify.');
    }
  }

  // --- Prefs (reviewed / hidden) ---

  markReviewed(id: string): void {
    this.mutatePrefs((prefs) => ({
      ...prefs,
      reviewedAt: { ...prefs.reviewedAt, [id]: Date.now() },
    }));
    this.toast.info('Marked as reviewed.');
  }

  hide(id: string): void {
    this.mutatePrefs((prefs) =>
      prefs.hidden.includes(id) ? prefs : { ...prefs, hidden: [...prefs.hidden, id] },
    );
  }

  unhide(id: string): void {
    this.mutatePrefs((prefs) => ({ ...prefs, hidden: prefs.hidden.filter((h) => h !== id) }));
  }

  // --- Detail ---

  /** Open an artist: load liked tracks, fetch + analyse the discography, fetch the photo. */
  async openArtist(id: string): Promise<void> {
    this._detailId.set(id);
    this._detailError.set(false);
    this._detailLoading.set(true);
    this._releases.set([]);
    this._analysis.set(null);
    this._detailPhoto.set(null);
    const knownName = this.globe.artists().find((a) => a.id === id)?.name ?? '';
    this._detailName.set(knownName);

    this.log.clear();
    this.log.log(`Loading ${knownName || 'artist'} discography…`);
    void this.loadPhoto(id);
    try {
      const releases = await this.discography(id);
      this._releases.set(releases);
      this.recompute();
      this.log.log(
        `Loaded ${releases.length} releases · ${releases.reduce((n, r) => n + r.tracks.length, 0)} tracks`,
        'success',
      );
    } catch {
      this._detailError.set(true);
      this.toast.error('Could not load this artist’s discography from Spotify.');
    } finally {
      this._detailLoading.set(false);
    }
  }

  /** Liked tracks for the currently open artist (newest-first). */
  likedForDetail(): IndexedTrack[] {
    const id = this._detailId();
    return id === null ? [] : this.likedIndex.tracksByArtist(id);
  }

  async loadPlaylists(): Promise<void> {
    if (this._playlists().length > 0) {
      return;
    }
    try {
      this._playlists.set(await this.spotify.getMyPlaylists());
    } catch {
      this.toast.error('Could not load your playlists from Spotify.');
    }
  }

  /** Playlists currently containing the given track, resolved to full playlist objects. */
  playlistsForTrack(trackId: string): Playlist[] {
    this.playlistRevision();
    return this.playlistIndex
      .playlistIdsForTrack(trackId)
      .map((id) => this.playlistIndex.playlistById(id))
      .filter((p): p is Playlist => p !== undefined);
  }

  // --- Playlist index build / refresh ---

  /**
   * Reconcile the playlist-membership index with Spotify on artist open — re-pages only the
   * playlists whose contents changed (and builds it in full the first time). Cheap once built.
   */
  async ensurePlaylistIndex(): Promise<void> {
    try {
      await this.playlistIndex.sync();
    } catch {
      this.toast.error('Could not read your playlists from Spotify.');
    }
  }

  /**
   * Incrementally reconcile the index: re-page only the playlists whose contents changed since the
   * last sync (and any new ones), dropping deleted ones — the cheap "scan what's new" counterpart.
   */
  async updatePlaylists(): Promise<void> {
    try {
      await this.playlistIndex.sync();
      this.toast.info('Playlists updated.');
    } catch {
      this.toast.error('Could not update your playlists from Spotify.');
    }
  }

  /** Re-read every playlist from Spotify in full (when membership has drifted past a sync). */
  async refreshPlaylists(): Promise<void> {
    try {
      await this.playlistIndex.refresh();
      this.toast.info('Playlists refreshed.');
    } catch {
      this.toast.error('Could not refresh your playlists from Spotify.');
    }
  }

  /**
   * Add or remove a single track to/from a playlist, then patch the membership index so the chips
   * update without a rebuild. The index is patched only after Spotify confirms the change.
   */
  async setTrackInPlaylist(
    track: PlaylistTrackRef,
    playlistId: string,
    inPlaylist: boolean,
  ): Promise<void> {
    this._busy.set(true);
    try {
      if (inPlaylist) {
        await this.spotify.addTracksToPlaylist(playlistId, [track.uri]);
        this.playlistIndex.addMembership(track, playlistId);
      } else {
        await this.spotify.removeTracksFromPlaylist(playlistId, [track.uri]);
        this.playlistIndex.removeMembership(track.id, playlistId);
      }
    } catch {
      this.toast.error('Could not update the playlist on Spotify.');
    } finally {
      this._busy.set(false);
    }
  }

  // --- Library actions (all reversible via the Undo toast) ---

  async relink(suggestion: RelinkSuggestion, target: AlbumTrackRef): Promise<void> {
    await this.relinkTo([suggestion.liked], target);
  }

  /** Move the given liked copies onto a target release's track (save target, remove olds). */
  async relinkTo(removed: IndexedTrack[], target: AlbumTrackRef): Promise<void> {
    await this.applyChange(
      { saved: [refToIndexed(target)], removed },
      `Relinked ${removed.length} track(s) to ${target.album.name}.`,
    );
  }

  /** Like a discography track outright (manual "add favourite" in the compare panel). */
  async addFavourite(target: AlbumTrackRef): Promise<void> {
    await this.applyChange({ saved: [refToIndexed(target)], removed: [] }, 'Added to Liked Songs.');
  }

  /** Remove a liked track outright (manual "remove favourite"). */
  async removeFavourite(track: IndexedTrack): Promise<void> {
    await this.applyChange({ saved: [], removed: [track] }, 'Removed from Liked Songs.');
  }

  /** Remove a liked track by id (the "all liked songs" list only carries the id). */
  async removeLikedById(id: string): Promise<void> {
    const track = this.likedIndex.all().find((t) => t.id === id);
    if (track !== undefined) {
      await this.removeFavourite(track);
    }
  }

  /**
   * Auto-import: for every compare row that has likes stuck on other releases (and whose copy on
   * this album is playable and not already liked), relink them onto this album in one reversible go.
   */
  async importFromCompare(rows: CompareRow[], album: Album): Promise<void> {
    const saved: IndexedTrack[] = [];
    const removed: IndexedTrack[] = [];
    for (const row of rows) {
      if (row.likedElsewhere.length > 0 && row.track.isPlayable && !row.likedHere) {
        saved.push(refToIndexed({ album, track: row.track }));
        removed.push(...row.likedElsewhere);
      }
    }
    if (saved.length === 0) {
      this.toast.info('Nothing to import — no matching favourites on other releases.');
      return;
    }
    await this.applyChange(
      { saved, removed },
      `Imported ${saved.length} favourite(s) to ${album.name}.`,
    );
  }

  async relinkAll(suggestions: RelinkSuggestion[]): Promise<void> {
    if (suggestions.length === 0) {
      return;
    }
    const change: LibraryChange = {
      saved: suggestions.map((s) => refToIndexed(s.target)),
      removed: suggestions.map((s) => s.liked),
    };
    await this.applyChange(change, `Relinked ${suggestions.length} tracks.`);
  }

  /** Remove every duplicate copy except the suggested keep. */
  async removeDuplicates(group: DuplicateGroup, keepId: string): Promise<void> {
    const removed = group.copies.filter((copy) => copy.id !== keepId);
    if (removed.length === 0) {
      return;
    }
    await this.applyChange({ saved: [], removed }, `Removed ${removed.length} duplicate(s).`);
  }

  /**
   * Add the selected tracks to a playlist, then patch the membership index so their chips update
   * and any "not in your library" view drops them without a rebuild. Not undone (playlist edits
   * stand). Refs (not bare {@link AlbumTrack}s) so the index gets the album metadata it stores.
   */
  async addToPlaylist(playlistId: string, tracks: PlaylistTrackRef[]): Promise<void> {
    if (tracks.length === 0) {
      return;
    }
    this._busy.set(true);
    try {
      await this.spotify.addTracksToPlaylist(
        playlistId,
        tracks.map((t) => t.uri),
      );
      for (const track of tracks) {
        this.playlistIndex.addMembership(track, playlistId);
      }
      this.toast.info(`Added ${tracks.length} track(s) to the playlist.`);
    } catch {
      this.toast.error('Could not add tracks to the playlist.');
    } finally {
      this._busy.set(false);
    }
  }

  // --- Internals ---

  private mutatePrefs(fn: (prefs: LibraryPrefs) => LibraryPrefs): void {
    const next = fn(this._prefs());
    this._prefs.set(next);
    this.prefsCache.save(next);
  }

  private recompute(): void {
    const id = this._detailId();
    if (id === null) {
      return;
    }
    this._analysis.set(analyseArtist(this.likedIndex.tracksByArtist(id), this._releases()));
  }

  private async loadPhoto(id: string): Promise<void> {
    try {
      const artist = await this.spotify.getArtist(id);
      if (this._detailId() === id) {
        this._detailName.set(artist.name);
        this._detailPhoto.set(largestImageUrl(artist.images));
      }
      // Refresh-on-open: `GET /artists/{id}` already carries the genre tags, so fold them straight
      // back into the globe dataset (no separate `getArtistGenres` call needed) to keep them current.
      this.globe.setGenres(id, artist.genres ?? []);
    } catch {
      // A missing photo/genres is non-fatal — leave the existing values.
    }
  }

  /**
   * Substitute an old liked copy for its newer relink target across the given (editable) playlists,
   * preserving each playlist's position: insert the new track where the old one sat, then remove the
   * old. Reads each playlist's order once to find the slot, then patches the membership index so the
   * chips update without a rebuild. Non-fatal per playlist — a failure is surfaced, not thrown.
   */
  async substituteInPlaylists(
    oldRef: PlaylistTrackRef,
    newRef: PlaylistTrackRef,
    playlistIds: string[],
  ): Promise<void> {
    if (playlistIds.length === 0) {
      return;
    }
    this._busy.set(true);
    let done = 0;
    try {
      for (const playlistId of playlistIds) {
        const refs = await this.spotify.getPlaylistTrackRefs(playlistId);
        const positions = refs.flatMap((r, i) => (r.id === oldRef.id ? [i] : []));
        const [position] = positions;
        if (position === undefined) {
          continue; // the old track is already gone from this playlist — nothing to substitute
        }
        // Insert the new copy at the old one's slot (it lands before the old, which then shifts down),
        // then drop the old — leaving the new copy exactly where the old one sat.
        await this.spotify.addTracksToPlaylist(playlistId, [newRef.uri], position);
        await this.spotify.removeTracksFromPlaylist(playlistId, [oldRef.uri]);
        this.playlistIndex.addMembership(newRef, playlistId);
        if (positions.length > 1) {
          // Rare: this playlist held the same track more than once. Spotify's remove-by-URI drops
          // *every* copy, so re-add the surplus (they land at the end) — a substitution must never
          // silently delete tracks. The old track still rides this playlist, so keep its membership.
          await this.spotify.addTracksToPlaylist(
            playlistId,
            Array<string>(positions.length - 1).fill(oldRef.uri),
          );
        } else {
          this.playlistIndex.removeMembership(oldRef.id, playlistId);
        }
        done += 1;
      }
      if (done > 0) {
        this.toast.info(`Substituted the track in ${done} playlist(s).`);
      }
    } catch {
      this.toast.error('Could not substitute in some playlists — please check them on Spotify.');
    } finally {
      this._busy.set(false);
    }
  }

  private async discography(id: string): Promise<DiscographyRelease[]> {
    if (!this.discoCacheHydrated) {
      // Pull any persisted discographies into the session cache once, so a reload skips re-paging.
      for (const [artistId, releases] of this.discoCacheStore.load()) {
        this.discoCache.set(artistId, releases);
      }
      this.discoCacheHydrated = true;
    }
    const cached = this.discoCache.get(id);
    if (cached !== undefined) {
      return cached;
    }
    const albums = await this.spotify.getArtistAlbums(id);
    this.log.log(`Found ${albums.length} releases · reading track lists…`);
    // Fetch every album's track-id list concurrently (the API layer caps in-flight requests) rather
    // than awaiting them one after another, which serialised a deep discography into dozens of round-trips.
    const idLists = await this.spotify.getAlbumTrackIdsBatch(albums.map((album) => album.id));
    const idsByAlbum = new Map<string, string[]>();
    const allIds: string[] = [];
    albums.forEach((album, i) => {
      const ids = idLists[i] ?? [];
      idsByAlbum.set(album.id, ids);
      allIds.push(...ids);
    });
    const uniqueIds = [...new Set(allIds)];
    this.log.log(`Fetching details for ${uniqueIds.length} tracks…`);
    const fullTracks = await this.spotify.getTracks(uniqueIds, (done, total) => {
      if (done % 50 === 0 && done !== total) {
        this.log.log(`Tracks: ${done} / ${total}`);
      }
    });
    const trackById = new Map(fullTracks.map((track) => [track.id, track]));
    const releases: DiscographyRelease[] = albums.map((album) => ({
      album,
      tracks: (idsByAlbum.get(album.id) ?? [])
        .map((trackId) => trackById.get(trackId))
        .filter((track): track is AlbumTrack => track !== undefined),
    }));
    this.discoCache.set(id, releases);
    this.discoCacheStore.save(this.discoCache);
    return releases;
  }

  private async applyChange(change: LibraryChange, message: string): Promise<void> {
    this._busy.set(true);
    try {
      await this.commitChange(change);
    } catch {
      // commitChange mirrors each step into the index only after Spotify confirms it, so a failure
      // here may have already landed the saves (it always saves before removing). Recompute to show
      // whatever actually applied, and don't claim "unchanged" or offer an Undo for a partial state.
      this.recompute();
      this._busy.set(false);
      this.toast.error(
        'Spotify rejected part of the change — please check your library on Spotify.',
      );
      return;
    }
    this.recompute();
    this._busy.set(false);

    if (await this.toast.action(message, 'Undo')) {
      this._busy.set(true);
      try {
        await this.commitChange({ saved: change.removed, removed: change.saved });
        this.recompute();
      } catch {
        this.toast.error('Could not undo — please check your library on Spotify.');
      } finally {
        this._busy.set(false);
      }
    }
  }

  /**
   * Save the new copies, then remove the old — mirroring each step into the local liked index only
   * after Spotify confirms it, so the index never claims a change Spotify rejected. Saving first means
   * a mid-way failure can leave a duplicate (both copies liked) but never loses a like outright.
   */
  private async commitChange(change: LibraryChange): Promise<void> {
    if (change.saved.length > 0) {
      await this.spotify.saveTracks(change.saved.map((t) => t.id));
      this.likedIndex.addTracks(change.saved);
    }
    if (change.removed.length > 0) {
      await this.spotify.removeSavedTracks(change.removed.map((t) => t.id));
      this.likedIndex.removeTracks(change.removed.map((t) => t.id));
    }
  }
}

function letterOf(name: string): string {
  const first = name.trim().charAt(0).toUpperCase();
  return first >= 'A' && first <= 'Z' ? first : NON_ALPHA;
}

/** Whether a row belongs in the current worklist filter. */
function matchesStatus(row: ArtistRow, filter: ArtistStatusFilter): boolean {
  switch (filter) {
    case 'unreviewed':
      return row.reviewedAt === null;
    case 'unfollowed':
      return row.following === false;
    case 'no-origin':
      return row.countryCode === null;
    default:
      return true;
  }
}

function refToIndexed(ref: AlbumTrackRef): IndexedTrack {
  return {
    id: ref.track.id,
    name: ref.track.name,
    uri: ref.track.uri,
    isrc: ref.track.isrc,
    durationMs: ref.track.durationMs,
    addedAt: new Date().toISOString(),
    albumId: ref.album.id,
    albumName: ref.album.name,
    albumType: ref.album.albumType,
    releaseDate: ref.album.releaseDate,
    artistIds: ref.track.artistIds,
  };
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors, no `any` — the store compiles with
      its eight injects and the M10 API/index/globe additions (steps 03–07) all resolving.
- [ ] Trace `applyChange({ saved:[B], removed:[A] })` by hand: it `saveTracks([B])` → `addTracks([B])` →
      `removeSavedTracks([A])` → `removeTracks([A])`, then a toast *"Relinked …"* with **Undo**; Undo runs
      `commitChange({ saved:[A], removed:[B] })` — the exact reverse.
- [ ] Full end-to-end proof (relink, dedupe, undo, follow write-back, playlist substitution) is exercised once
      the pages are wired — see [step 18](18_verify.md).

## If it breaks
- **`No provider for GlobeStore / LikedIndex / PlaylistIndex`** → all are `providedIn: 'root'`; check the import
  paths (`../globe/globe-store`, `../../core/pipeline/liked-index`, `../../core/pipeline/playlist-index`).
- **`Property 'addTracks' / 'removeTracks' does not exist on LikedIndex`** → step 05 wasn't applied; those are the
  M10 mutations the commit relies on.
- **`Property 'followArtists' / 'unfollowArtists' does not exist on SpotifyApi`** → step 03 wasn't applied.
- **Undo does nothing** → `this.toast.action(message, 'Undo')` must return the `Promise<boolean>` from the M1
  Toast; if it resolves `false` immediately, the toast auto-dismissed before you clicked (the `durationMs` is 7 s).
- **A relink loses the like on a Spotify hiccup** → you swapped the order in `commitChange`; it must **save
  before remove** so a partial failure dups, never drops.

---
> Nav: [← Grow GlobeStore](07_globe-store-grow.md) · [Overview](00_overview.md) · [Shared ConfirmDialog →](09_confirm-dialog.md)
