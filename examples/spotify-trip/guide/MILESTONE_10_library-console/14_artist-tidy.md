# M10 · Step 14 of 18 — The `ArtistTidy` detail view
> Nav: [← The two relink dialogs](13_relink-dialogs.md) · [Overview](00_overview.md) · [The all-liked-songs page →](15_liked-songs.md)

> **This step touches 3 files, committed together:** `features/library/artist-tidy/artist-tidy.{ts,html,scss}` —
> the big per-artist detail view (`/library/artist/:id`). It's one component, so all three in one commit.

## Glossary for this step
> **route param signal** — the `:id` from the URL read reactively via `toSignal(route.paramMap …)`, so navigating
> from one artist straight to another re-runs the load without a manual subscription.
> **orphan tracks** — discography tracks by this artist the user hasn't collected anywhere: not in Liked Songs
> (directly or as the same recording elsewhere) and not in any playlist. Surfaced for batch-adding to a playlist.

## Why / design
This is the console's workhorse — everything the engine (step 02) and store (step 08) enable, rendered in three
tabs:

1. **Duplicates** — the ISRC-only `DuplicateGroup`s, each with a "which copy to keep" picker and a **Remove N
   other(s)** button (→ `store.removeDuplicates`, reversible).
2. **Relink** — the `RelinkSuggestion`s as before/after cards (current release → chosen target, with a per-card
   alternative picker). **Relink** one (→ `store.relink`, then `maybeSubstitutePlaylists` offers the
   `RelinkSubstitute` dialog) or **Relink all**.
3. **Discography** — every release with per-track state (❤ liked / 🔗 liked elsewhere), Saved/Not-saved + group
   filters, a sort, playlist-membership chips + add/remove menus, an **Import favourites** button (opens
   `ReleaseCompare`), an **In your playlists** section (`extraPlaylistTracks`), and a **Not in your library**
   orphans section. A bottom **playlist bar** batch-adds the ticked selection.

> **Recurring model — smart view, dumb store calls:** the component owns *view* state (selection, sort/filter
> chips, per-card target/keep overrides as signal Maps) and delegates every mutation to `LibraryStore`. It reads
> `store.analysis` / `store.releases` and computes derived views (`sortedReleases`, `visibleReleases`,
> `orphanTracks`) locally — no API calls here.
>
> **New concept — [`toSignal`](https://angular.dev/api/core/rxjs-interop/toSignal):** bridges an RxJS stream (the
> route's `paramMap`) into a signal, so an `effect()` re-runs `openArtist(id)` whenever the `:id` changes.

The `:id` route param is **load-bearing** (it's the artist id the store loads); `recordingKey` is imported from
the engine to compute per-track liked state. Play uses the M7 `PlayerStore.playTrack` (needs Premium + a device).

## Do this
1. Create the three `artist-tidy` files under `src/app/features/library/artist-tidy/`.
2. The constructor kicks `loadPlaylists()` + `ensurePlaylistIndex()` and sets an `effect()` that calls
   `openArtist(id)` inside `untracked()` on each `:id` change (so a signal write during navigation is safe).
3. Import the two dialogs (step 13), the `LogTerminal` (M6), the engine helpers (`albumSortValue`,
   `recordingKey`, `releaseSortValue`), and the models. The bottom playlist bar + membership menus are in the
   template; keep the `#discoMenu` / `#entryMenu` template refs.

## Code
### `src/app/features/library/artist-tidy/artist-tidy.ts`
```ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

import { LogStore } from '../../../core/logging/log-store';
import { Album, AlbumTrack, DiscographyRelease } from '../../../core/models/album';
import { IndexedTrack } from '../../../core/models/indexed-track';
import {
  AlbumTrackRef,
  DuplicateGroup,
  RelinkSuggestion,
} from '../../../core/models/library-analysis';
import { Playlist } from '../../../core/models/playlist';
import { PlaylistTrackEntry, PlaylistTrackRef } from '../../../core/models/playlist-index';
import {
  albumSortValue,
  recordingKey,
  releaseSortValue,
} from '../../../core/pipeline/track-matching';
import { GlobeStore } from '../../globe/globe-store';
import { LogTerminal } from '../../globe/log-terminal/log-terminal';
import { PlayerStore } from '../../player/player-store';
import { LibraryStore } from '../library-store';
import { ReleaseCompare, ReleaseCompareData } from '../release-compare/release-compare';
import { RelinkSubstitute, RelinkSubstituteData } from '../relink-substitute/relink-substitute';

type SortKey = 'original' | 'updated' | 'name';
type SortDir = 'asc' | 'desc';
type GroupFilter = 'all' | 'album' | 'single' | 'compilation';
type SavedFilter = 'all' | 'saved' | 'notSaved';
type TrackState = 'liked' | 'elsewhere' | 'none';

/** Detail view: an artist's discography with relink/dedup suggestions and playlist building. */
@Component({
  selector: 'app-artist-tidy',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTabsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    LogTerminal,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './artist-tidy.html',
  styleUrl: './artist-tidy.scss',
})
export class ArtistTidy {
  private readonly route = inject(ActivatedRoute);
  protected readonly store = inject(LibraryStore);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly globe = inject(GlobeStore);
  private readonly player = inject(PlayerStore);
  /** Live progress lines for the discography loading terminal. */
  protected readonly log = inject(LogStore);

  /** Spotify genre tags for this artist (from the globe dataset), empty when unknown. */
  protected readonly genres = computed(() => this.globe.genresOf(this.id()) ?? []);

  /** Current artist id from the `:id` route param. */
  protected readonly id = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: '' },
  );

  protected readonly groups: readonly GroupFilter[] = ['all', 'album', 'single', 'compilation'];
  protected readonly savedFilters: readonly SavedFilter[] = ['all', 'saved', 'notSaved'];
  protected readonly sortKey = signal<SortKey>('original');
  protected readonly sortDir = signal<SortDir>('desc');
  protected readonly group = signal<GroupFilter>('all');
  /** Discography chip: show all releases' tracks, only saved (in Liked Songs), or only not-saved. */
  protected readonly savedFilter = signal<SavedFilter>('all');
  protected readonly selection = signal<ReadonlySet<string>>(new Set());
  protected readonly playlistId = signal<string | null>(null);
  private readonly targetIdx = signal<ReadonlyMap<string, number>>(new Map());
  private readonly keepId = signal<ReadonlyMap<string, string>>(new Map());

  /** Saved-track ids liked by this artist, and the recording keys behind them. */
  private readonly likedIds = computed(() => {
    this.store.likedRevision();
    return new Set(this.store.likedForDetail().map((t) => t.id));
  });
  private readonly likedKeys = computed(() => {
    this.store.likedRevision();
    return new Set(this.store.likedForDetail().map((t) => recordingKey(t)));
  });

  protected readonly analysis = this.store.analysis;
  protected readonly relinks = computed(() => this.analysis()?.relinks ?? []);
  protected readonly duplicates = computed(() => this.analysis()?.duplicates ?? []);

  /** Discography filtered by album group and sorted by the chosen key + direction. */
  protected readonly sortedReleases = computed<DiscographyRelease[]>(() => {
    const group = this.group();
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    const key = this.sortKey();
    const releases = this.store
      .releases()
      .filter((r) => group === 'all' || r.album.albumType === group);

    if (key === 'name') {
      return [...releases].sort((a, b) => dir * a.album.name.localeCompare(b.album.name));
    }
    if (key === 'updated') {
      return [...releases].sort(
        (a, b) => dir * (albumSortValue(a.album) - albumSortValue(b.album)),
      );
    }
    // 'original': sort editions of the same title by the earliest release date in their group.
    const earliest = new Map<string, number>();
    for (const r of releases) {
      const name = normaliseAlbumName(r.album.name);
      const value = releaseSortValue(r.album.releaseDate);
      earliest.set(name, Math.min(earliest.get(name) ?? value, value));
    }
    return [...releases].sort(
      (a, b) =>
        dir *
        ((earliest.get(normaliseAlbumName(a.album.name)) ?? 0) -
          (earliest.get(normaliseAlbumName(b.album.name)) ?? 0)),
    );
  });

  /**
   * The sorted discography narrowed by the Saved / Not-saved chip: keeps only tracks whose recording
   * is (or isn't) in the user's Liked Songs, dropping releases left with no matching track. `all`
   * passes the list through untouched.
   */
  protected readonly visibleReleases = computed<DiscographyRelease[]>(() => {
    const filter = this.savedFilter();
    const releases = this.sortedReleases();
    if (filter === 'all') {
      return releases;
    }
    const wantSaved = filter === 'saved';
    return releases
      .map((r) => ({
        album: r.album,
        tracks: r.tracks.filter((t) => (this.trackState(t) !== 'none') === wantSaved),
      }))
      .filter((r) => r.tracks.length > 0);
  });

  /**
   * Discography tracks by this artist the user hasn't collected anywhere — not in Liked Songs
   * (directly or as the same recording on another release) and not in any playlist. Surfaced at
   * the bottom of the page so they can be batch-added to a playlist. Deduped by track id since a
   * recording can appear on several editions.
   */
  protected readonly orphanTracks = computed<{ track: AlbumTrack; album: Album }[]>(() => {
    const result: { track: AlbumTrack; album: Album }[] = [];
    const seen = new Set<string>();
    for (const release of this.store.releases()) {
      for (const track of release.tracks) {
        if (seen.has(track.id) || this.trackState(track) !== 'none') {
          continue;
        }
        if (this.store.playlistsForTrack(track.id).length > 0) {
          continue;
        }
        seen.add(track.id);
        result.push({ track, album: release.album });
      }
    }
    return result;
  });

  protected readonly selectionCount = computed(() => this.selection().size);

  /** Ids of playlists the user can write to — gates remove buttons + the membership menu. */
  protected readonly editableIds = computed(
    () => new Set(this.store.editablePlaylists().map((p) => p.id)),
  );

  constructor() {
    void this.store.loadPlaylists();
    void this.store.ensurePlaylistIndex();
    effect(() => {
      const id = this.id();
      if (id === '') {
        return;
      }
      untracked(() => {
        this.selection.set(new Set());
        void this.store.openArtist(id);
      });
    });
  }

  // --- Discography rows ---

  protected trackState(track: AlbumTrack): TrackState {
    if (this.likedIds().has(track.id)) {
      return 'liked';
    }
    return this.likedKeys().has(recordingKey(track)) ? 'elsewhere' : 'none';
  }

  /**
   * Whether a track found only in the user's playlists is also in their Liked Songs. Matched by
   * exact saved-track id — playlist entries carry no ISRC, so the discography's "elsewhere" (same
   * recording on another album) match doesn't apply here; it's a plain in/out of Liked Songs.
   */
  protected isPlaylistTrackLiked(entry: PlaylistTrackEntry): boolean {
    return this.likedIds().has(entry.id);
  }

  protected year(releaseDate: string): string {
    return releaseDate.slice(0, 4);
  }

  protected duration(ms: number): string {
    const total = Math.round(ms / 1000);
    const min = Math.floor(total / 60);
    const sec = `${total % 60}`.padStart(2, '0');
    return `${min}:${sec}`;
  }

  /** Play a track on the user's active Spotify device (needs Premium + an active device). */
  protected play(uri: string): void {
    void this.player.playTrack(uri);
  }

  // --- Selection (playlist building) ---

  protected isSelected(id: string): boolean {
    return this.selection().has(id);
  }

  protected toggleTrack(id: string): void {
    const next = new Set(this.selection());
    if (!next.delete(id)) {
      next.add(id);
    }
    this.selection.set(next);
  }

  protected clearSelection(): void {
    this.selection.set(new Set());
  }

  protected albumAllSelected(release: DiscographyRelease): boolean {
    return release.tracks.length > 0 && release.tracks.every((t) => this.selection().has(t.id));
  }

  protected toggleAlbum(release: DiscographyRelease): void {
    const next = new Set(this.selection());
    const all = this.albumAllSelected(release);
    for (const track of release.tracks) {
      if (all) {
        next.delete(track.id);
      } else {
        next.add(track.id);
      }
    }
    this.selection.set(next);
  }

  protected orphansAllSelected(): boolean {
    const orphans = this.orphanTracks();
    return orphans.length > 0 && orphans.every((o) => this.selection().has(o.track.id));
  }

  protected toggleAllOrphans(): void {
    const next = new Set(this.selection());
    const all = this.orphansAllSelected();
    for (const { track } of this.orphanTracks()) {
      if (all) {
        next.delete(track.id);
      } else {
        next.add(track.id);
      }
    }
    this.selection.set(next);
  }

  protected addSelectedToPlaylist(): void {
    const id = this.playlistId();
    if (id === null) {
      return;
    }
    const selected = this.selection();
    const refs: PlaylistTrackRef[] = [];
    const seen = new Set<string>();
    for (const release of this.store.releases()) {
      for (const track of release.tracks) {
        if (selected.has(track.id) && !seen.has(track.id)) {
          seen.add(track.id);
          refs.push(albumTrackToRef(track, release.album));
        }
      }
    }
    void this.store.addToPlaylist(id, refs).then(() => this.selection.set(new Set()));
  }

  protected onPlaylistChange(value: string): void {
    this.playlistId.set(value === '' ? null : value);
  }

  // --- Playlist membership (which playlists hold a track + add/remove) ---

  /** Playlists currently containing the track (for the inline chips). */
  protected playlistsOf(trackId: string): Playlist[] {
    return this.store.playlistsForTrack(trackId);
  }

  protected isPlaylistEditable(playlistId: string): boolean {
    return this.editableIds().has(playlistId);
  }

  protected trackInPlaylist(trackId: string, playlistId: string): boolean {
    return this.store.playlistsForTrack(trackId).some((p) => p.id === playlistId);
  }

  /** Toggle a discography track's membership in a playlist (builds a ref from its release album). */
  protected toggleDiscoMembership(track: AlbumTrack, album: Album, playlistId: string): void {
    const ref = albumTrackToRef(track, album);
    void this.store.setTrackInPlaylist(
      ref,
      playlistId,
      !this.trackInPlaylist(track.id, playlistId),
    );
  }

  protected removeDiscoMembership(track: AlbumTrack, album: Album, playlistId: string): void {
    void this.store.setTrackInPlaylist(albumTrackToRef(track, album), playlistId, false);
  }

  /** Toggle a playlist-only track's membership (the entry is already a ref). */
  protected toggleEntryMembership(entry: PlaylistTrackEntry, playlistId: string): void {
    void this.store.setTrackInPlaylist(
      entry,
      playlistId,
      !this.trackInPlaylist(entry.id, playlistId),
    );
  }

  protected removeEntryMembership(entry: PlaylistTrackEntry, playlistId: string): void {
    void this.store.setTrackInPlaylist(entry, playlistId, false);
  }

  protected refreshPlaylists(): void {
    void this.store.refreshPlaylists();
  }

  /** "updated 25 Jun 2026, 14:30" label for the playlist index, or null if never built. */
  protected builtAtLabel(): string | null {
    const iso = this.store.playlistsBuiltAt();
    return iso === null ? null : new Date(iso).toLocaleString();
  }

  // --- Relink suggestions ---

  /**
   * Album cover URLs keyed by album id, drawn from the loaded discography. The relink "current"
   * side only has an `IndexedTrack` (no cover), so we look its old release up here — best-effort,
   * since a delisted/compilation source album may not be in the discography (then: placeholder).
   */
  private readonly coversByAlbum = computed<ReadonlyMap<string, string>>(() => {
    const map = new Map<string, string>();
    for (const release of this.store.releases()) {
      if (release.album.imageUrl !== null) {
        map.set(release.album.id, release.album.imageUrl);
      }
    }
    return map;
  });

  protected coverFor(albumId: string): string | null {
    return this.coversByAlbum().get(albumId) ?? null;
  }

  protected targetFor(suggestion: RelinkSuggestion): AlbumTrackRef {
    const idx = this.targetIdx().get(suggestion.liked.id) ?? 0;
    return suggestion.alternatives[idx] ?? suggestion.target;
  }

  /** Currently-selected alternative index for a relink card's target picker (defaults to newest). */
  protected targetIndexOf(likedId: string): number {
    return this.targetIdx().get(likedId) ?? 0;
  }

  protected setTarget(likedId: string, idx: number): void {
    const next = new Map(this.targetIdx());
    next.set(likedId, idx);
    this.targetIdx.set(next);
  }

  protected relinkOne(suggestion: RelinkSuggestion): void {
    const target = this.targetFor(suggestion);
    void this.store.relink(suggestion, target);
    this.maybeSubstitutePlaylists(suggestion.liked, target);
  }

  protected relinkAll(): void {
    void this.store.relinkAll(this.relinks());
  }

  /**
   * If the old liked copy sits in any of the user's playlists, offer a position-preserving
   * substitution: preview the editable playlists that will be updated (and the non-editable ones
   * skipped), and on confirm swap the old track for the relink target in each. Silent when the old
   * copy is in no editable playlist. Runs alongside — never instead of — the Liked-Songs relink.
   */
  private maybeSubstitutePlaylists(oldTrack: IndexedTrack, target: AlbumTrackRef): void {
    const memberships = this.store.playlistsForTrack(oldTrack.id);
    if (memberships.length === 0) {
      return;
    }
    const editableIds = this.editableIds();
    const editable = memberships.filter((p) => editableIds.has(p.id));
    const skipped = memberships.filter((p) => !editableIds.has(p.id));
    if (editable.length === 0) {
      return;
    }
    const data: RelinkSubstituteData = {
      songName: oldTrack.name,
      targetLabel: target.album.name,
      editable,
      skipped,
    };
    this.dialog
      .open(RelinkSubstitute, { data, width: '520px', maxWidth: '95vw' })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed === true) {
          void this.store.substituteInPlaylists(
            indexedToRef(oldTrack),
            albumTrackToRef(target.track, target.album),
            editable.map((p) => p.id),
          );
        }
      });
  }

  // --- Duplicates ---

  protected keepFor(recordingKeyId: string, fallback: string): string {
    return this.keepId().get(recordingKeyId) ?? fallback;
  }

  protected setKeep(recordingKeyId: string, value: string): void {
    const next = new Map(this.keepId());
    next.set(recordingKeyId, value);
    this.keepId.set(next);
  }

  protected dropDuplicates(group: DuplicateGroup): void {
    void this.store.removeDuplicates(group, this.keepFor(group.recordingKey, group.keep.id));
  }

  // --- Actions ---

  protected openCompare(release: DiscographyRelease): void {
    const data: ReleaseCompareData = { album: release.album, tracks: release.tracks };
    this.dialog.open(ReleaseCompare, { data, width: '640px', maxWidth: '95vw' });
  }

  protected markReviewed(): void {
    this.store.markReviewed(this.id());
  }

  protected toggleDir(): void {
    this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
  }

  protected setSort(value: SortKey): void {
    this.sortKey.set(value);
  }

  protected setGroup(value: GroupFilter): void {
    this.group.set(value);
  }

  protected setSavedFilter(value: SavedFilter): void {
    this.savedFilter.set(value);
  }

  /** Human label for a Saved / Not-saved chip. */
  protected savedLabel(filter: SavedFilter): string {
    return filter === 'all' ? 'All' : filter === 'saved' ? 'Saved' : 'Not saved';
  }

  protected back(): void {
    void this.router.navigate(['/library']);
  }
}

/** Build a playlist-track ref from an indexed liked track (for the playlist substitution). */
function indexedToRef(track: IndexedTrack): PlaylistTrackRef {
  return {
    id: track.id,
    name: track.name,
    uri: track.uri,
    durationMs: track.durationMs,
    artistIds: track.artistIds,
    albumName: track.albumName,
    albumImageUrl: null,
  };
}

/** Build a playlist-track ref from a discography track + its release album (for add/remove). */
function albumTrackToRef(track: AlbumTrack, album: Album): PlaylistTrackRef {
  return {
    id: track.id,
    name: track.name,
    uri: track.uri,
    durationMs: track.durationMs,
    artistIds: track.artistIds,
    albumName: album.name,
    albumImageUrl: album.imageUrl,
  };
}

/** Strip edition qualifiers so "X" and "X (Deluxe)" group together for the original-date sort. */
function normaliseAlbumName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[([].*?[)\]]/g, ' ')
    .replace(/\s-\s.*$/, ' ')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}
```

### `src/app/features/library/artist-tidy/artist-tidy.html`
```html
<section class="tidy">
  <header class="topbar">
    <button mat-icon-button matTooltip="Back to artists" (click)="back()">
      <mat-icon>arrow_back</mat-icon>
    </button>

    @if (store.detailPhoto(); as photo) {
      <img class="photo" [src]="photo" [alt]="store.detailName()" />
    } @else {
      <div class="photo placeholder"><mat-icon>person</mat-icon></div>
    }

    <div class="who">
      <h1>{{ store.detailName() }}</h1>
      @if (genres().length > 0) {
        <div class="genres">
          @for (genre of genres(); track genre) {
            <span class="chip genre">{{ genre }}</span>
          }
        </div>
      }
      @if (analysis(); as a) {
        <div class="summary">
          <span class="chip relink">{{ relinks().length }} to relink</span>
          <span class="chip dup">{{ duplicates().length }} duplicate group(s)</span>
        </div>
      }
    </div>

    <button
      mat-stroked-button
      matTooltip="Mark this artist reviewed today, so you can filter out ones you've already checked on the artist list"
      (click)="markReviewed()"
    >
      <mat-icon>task_alt</mat-icon> Mark reviewed
    </button>
  </header>

  @if (store.detailLoading()) {
    <app-log-terminal [inline]="true" title="Loading discography…" [entries]="log.entries()" />
  } @else if (store.detailError()) {
    <p class="error">Couldn’t load this artist’s discography. Please try again.</p>
  } @else {
    <mat-tab-group class="tabs" mat-stretch-tabs="false" animationDuration="0ms">
      <!-- Duplicates -->
      <mat-tab [label]="'Duplicates (' + duplicates().length + ')'">
        @if (duplicates().length > 0) {
          <div class="block">
            <div class="block-head"><h2>Duplicates — liked on multiple albums</h2></div>
            @for (g of duplicates(); track g.recordingKey) {
              <div class="suggestion">
                <span class="song">{{ g.name }}</span>
                <span class="from">keep</span>
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="picker">
                  <mat-select
                    [value]="keepFor(g.recordingKey, g.keep.id)"
                    matTooltip="Choose which copy of this song to keep"
                    (selectionChange)="setKeep(g.recordingKey, $event.value)"
                  >
                    @for (copy of g.copies; track copy.id) {
                      <mat-option [value]="copy.id">
                        {{ copy.albumName }} ({{ year(copy.releaseDate) }})
                      </mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <button
                  mat-button
                  matTooltip="Remove the other liked copies, keeping only the one selected — reversible via the Undo toast"
                  [disabled]="store.busy()"
                  (click)="dropDuplicates(g)"
                >
                  Remove {{ g.copies.length - 1 }} other(s)
                </button>
              </div>
            }
          </div>
        } @else {
          <p class="tab-empty">No duplicate liked songs for this artist. 🎉</p>
        }
      </mat-tab>

      <!-- Relink -->
      <mat-tab [label]="'Relink (' + relinks().length + ')'">
        @if (relinks().length > 0) {
          <div class="block">
            <div class="block-head">
              <h2>Relink to newer release</h2>
              <button
                mat-flat-button
                color="primary"
                matTooltip="Move every liked track below onto its newest available release — reversible via the Undo toast"
                (click)="relinkAll()"
              >
                <mat-icon>moving</mat-icon> Relink all
              </button>
            </div>
            @for (s of relinks(); track s.liked.id) {
              @let target = targetFor(s);
              <div class="relink-card">
                <div class="relink-song">
                  <mat-icon class="song-ic">music_note</mat-icon>
                  <span class="song">{{ s.liked.name }}</span>
                </div>

                <div class="relink-compare">
                  <!-- Current: the release the like sits on today. -->
                  <div class="rel-side current">
                    <span class="rel-tag">Current</span>
                    @if (coverFor(s.liked.albumId); as cover) {
                      <img class="rel-cover" [src]="cover" [alt]="s.liked.albumName" />
                    } @else {
                      <div class="rel-cover placeholder"><mat-icon>album</mat-icon></div>
                    }
                    <span class="rel-album" [title]="s.liked.albumName">{{
                      s.liked.albumName
                    }}</span>
                    <span class="rel-year">{{ year(s.liked.releaseDate) }}</span>
                  </div>

                  <mat-icon class="rel-arrow">arrow_forward</mat-icon>

                  <!-- Move to: the chosen target release (cover follows the picker). -->
                  <div class="rel-side target">
                    <span class="rel-tag">Move to</span>
                    @if (target.album.imageUrl; as cover) {
                      <img class="rel-cover" [src]="cover" [alt]="target.album.name" />
                    } @else {
                      <div class="rel-cover placeholder"><mat-icon>album</mat-icon></div>
                    }
                    <mat-form-field
                      appearance="outline"
                      subscriptSizing="dynamic"
                      class="rel-picker"
                    >
                      <mat-select
                        [value]="targetIndexOf(s.liked.id)"
                        matTooltip="Pick which release to move this like onto"
                        (selectionChange)="setTarget(s.liked.id, $event.value)"
                      >
                        @for (alt of s.alternatives; track alt.track.id; let i = $index) {
                          <mat-option [value]="i">
                            {{ alt.album.name }} ({{ year(alt.album.releaseDate) }})
                          </mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>
                </div>

                <button
                  mat-flat-button
                  class="relink-go"
                  matTooltip="Move this like onto the selected release — and offer to swap it in your playlists too (reversible)"
                  [disabled]="store.busy()"
                  (click)="relinkOne(s)"
                >
                  <mat-icon>moving</mat-icon> Relink
                </button>
              </div>
            }
          </div>
        } @else {
          <p class="tab-empty">Every liked track already sits on its newest release. 🎉</p>
        }
      </mat-tab>

      <!-- Discography -->
      <mat-tab label="Discography">
        <!-- Saved / not-saved filter chips -->
        <div class="controls">
          <div class="groups">
            @for (f of savedFilters; track f) {
              <button
                type="button"
                class="seg"
                [class.active]="savedFilter() === f"
                [matTooltip]="
                  f === 'all'
                    ? 'Show every track'
                    : f === 'saved'
                      ? 'Only tracks in your Liked Songs'
                      : 'Only tracks not in your Liked Songs'
                "
                (click)="setSavedFilter(f)"
              >
                {{ savedLabel(f) }}
              </button>
            }
          </div>

          <div class="groups">
            @for (f of groups; track f) {
              <button
                type="button"
                class="seg"
                [class.active]="group() === f"
                [matTooltip]="
                  f === 'all' ? 'Show every release type' : 'Show only ' + f + ' releases'
                "
                (click)="setGroup(f)"
              >
                {{ f }}
              </button>
            }
          </div>

          <div class="sorting">
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="sort-select">
              <mat-label>Sort</mat-label>
              <mat-select
                [value]="sortKey()"
                matTooltip="Order the discography by original release date, Spotify's last update, or name"
                (selectionChange)="setSort($event.value)"
              >
                <mat-option value="original">Original release</mat-option>
                <mat-option value="updated">Spotify last update</mat-option>
                <mat-option value="name">Name</mat-option>
              </mat-select>
            </mat-form-field>
            <button
              mat-icon-button
              [matTooltip]="sortDir() === 'asc' ? 'Ascending' : 'Descending'"
              (click)="toggleDir()"
            >
              <mat-icon>{{ sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
            </button>
          </div>

          <div class="playlists-status">
            @if (store.playlistsBuilding()) {
              <span class="muted">
                <mat-spinner [diameter]="16" /> Checking your playlists
                {{ store.playlistProgress().done }}/{{ store.playlistProgress().total }}…
              </span>
            } @else {
              @if (builtAtLabel(); as built) {
                <span class="muted">Playlists updated {{ built }}</span>
              }
              <button
                mat-stroked-button
                matTooltip="Re-read all your playlists from Spotify so the membership chips below are up to date"
                (click)="refreshPlaylists()"
              >
                <mat-icon>refresh</mat-icon> Refresh playlists
              </button>
            }
          </div>
        </div>

        <!-- Tracks of this artist found only in your playlists (not in the discography) -->
        @if (store.extraPlaylistTracks().length > 0) {
          <div class="block">
            <div class="block-head">
              <h2>In your playlists</h2>
              <span class="muted">Not in the discography (e.g. features on others’ albums)</span>
            </div>
            <ul class="tracks">
              @for (entry of store.extraPlaylistTracks(); track entry.id) {
                <li class="track extra-track">
                  @if (entry.albumImageUrl; as cover) {
                    <img class="mini-cover" [src]="cover" [alt]="entry.albumName" />
                  }
                  <span class="tname">{{ entry.name }}</span>
                  <span class="talbum muted">{{ entry.albumName }}</span>
                  @if (isPlaylistTrackLiked(entry)) {
                    <mat-icon class="state liked" matTooltip="In your Liked Songs"
                      >favorite</mat-icon
                    >
                  } @else {
                    <mat-icon class="state not-liked" matTooltip="Not in your Liked Songs">
                      favorite_border
                    </mat-icon>
                  }

                  <button
                    mat-icon-button
                    class="play"
                    matTooltip="Play on your device"
                    (click)="play(entry.uri)"
                  >
                    <mat-icon>play_arrow</mat-icon>
                  </button>

                  <span class="members">
                    @for (p of playlistsOf(entry.id); track p.id) {
                      <span
                        class="pl-chip"
                        [class.locked]="!isPlaylistEditable(p.id)"
                        [title]="p.name"
                      >
                        {{ p.name }}
                        @if (isPlaylistEditable(p.id)) {
                          <button
                            type="button"
                            class="chip-x"
                            matTooltip="Remove from this playlist"
                            [disabled]="store.busy()"
                            (click)="removeEntryMembership(entry, p.id)"
                          >
                            <mat-icon>close</mat-icon>
                          </button>
                        }
                      </span>
                    }
                    <button
                      mat-icon-button
                      class="add-pl"
                      matTooltip="Add to / remove from playlists"
                      [matMenuTriggerFor]="entryMenu"
                      [matMenuTriggerData]="{ entry: entry }"
                      [disabled]="store.busy() || store.playlistsBuilding()"
                    >
                      <mat-icon>playlist_add</mat-icon>
                    </button>
                  </span>

                  <span class="tdur">{{ duration(entry.durationMs) }}</span>
                </li>
              }
            </ul>
          </div>
        }

        <!-- Discography releases -->
        @for (release of visibleReleases(); track release.album.id) {
          <div class="release">
            <div class="release-head">
              <input
                type="checkbox"
                [checked]="albumAllSelected(release)"
                (change)="toggleAlbum(release)"
                [attr.aria-label]="'Select all of ' + release.album.name"
              />
              @if (release.album.imageUrl; as cover) {
                <img class="cover" [src]="cover" [alt]="release.album.name" />
              }
              <div class="meta">
                <span class="album-name">{{ release.album.name }}</span>
                <span class="album-sub">
                  {{ release.album.albumType }} · {{ year(release.album.releaseDate) }} ·
                  {{ release.album.totalTracks }} tracks
                </span>
              </div>
              <button
                mat-button
                matTooltip="Compare this release with songs you liked on other albums, and move those likes here"
                (click)="openCompare(release)"
              >
                <mat-icon>compare_arrows</mat-icon> Import favourites
              </button>
            </div>

            <ul class="tracks">
              @for (track of release.tracks; track track.id) {
                <li class="track" [class.unavailable]="!track.isPlayable">
                  <input
                    type="checkbox"
                    [checked]="isSelected(track.id)"
                    (change)="toggleTrack(track.id)"
                    [attr.aria-label]="'Select ' + track.name"
                  />
                  <span class="tnum">{{ track.trackNumber }}</span>
                  <span class="tname">{{ track.name }}</span>
                  @switch (trackState(track)) {
                    @case ('liked') {
                      <mat-icon class="state liked" matTooltip="In your Liked Songs"
                        >favorite</mat-icon
                      >
                    }
                    @case ('elsewhere') {
                      <mat-icon
                        class="state elsewhere"
                        matTooltip="You liked this on another album"
                      >
                        link
                      </mat-icon>
                    }
                  }

                  <button
                    mat-icon-button
                    class="play"
                    matTooltip="Play on your device"
                    [disabled]="!track.isPlayable"
                    (click)="play(track.uri)"
                  >
                    <mat-icon>play_arrow</mat-icon>
                  </button>

                  <span class="members">
                    @for (p of playlistsOf(track.id); track p.id) {
                      <span
                        class="pl-chip"
                        [class.locked]="!isPlaylistEditable(p.id)"
                        [title]="p.name"
                      >
                        {{ p.name }}
                        @if (isPlaylistEditable(p.id)) {
                          <button
                            type="button"
                            class="chip-x"
                            matTooltip="Remove from this playlist"
                            [disabled]="store.busy()"
                            (click)="removeDiscoMembership(track, release.album, p.id)"
                          >
                            <mat-icon>close</mat-icon>
                          </button>
                        }
                      </span>
                    }
                    <button
                      mat-icon-button
                      class="add-pl"
                      matTooltip="Add to / remove from playlists"
                      [matMenuTriggerFor]="discoMenu"
                      [matMenuTriggerData]="{ track: track, album: release.album }"
                      [disabled]="store.busy() || store.playlistsBuilding()"
                    >
                      <mat-icon>playlist_add</mat-icon>
                    </button>
                  </span>

                  <span class="tdur">{{ duration(track.durationMs) }}</span>
                </li>
              }
            </ul>
          </div>
        } @empty {
          <p class="tab-empty">No releases match this filter.</p>
        }

        <!-- Tracks by this artist you haven't collected: not in Liked Songs and not in any playlist -->
        @if (orphanTracks().length > 0) {
          <div class="block orphans">
            <div class="block-head">
              <h2>Not in your library</h2>
              <button
                type="button"
                class="seg"
                matTooltip="Select or deselect all of these tracks, ready to add to a playlist below"
                (click)="toggleAllOrphans()"
              >
                {{ orphansAllSelected() ? 'Deselect all' : 'Select all' }}
              </button>
            </div>
            <span class="muted">
              {{ orphanTracks().length }} track(s) not in your Liked Songs or any playlist
            </span>
            <ul class="tracks">
              @for (o of orphanTracks(); track o.track.id) {
                <li class="track extra-track" [class.unavailable]="!o.track.isPlayable">
                  <input
                    type="checkbox"
                    [checked]="isSelected(o.track.id)"
                    (change)="toggleTrack(o.track.id)"
                    [attr.aria-label]="'Select ' + o.track.name"
                  />
                  @if (o.album.imageUrl; as cover) {
                    <img class="mini-cover" [src]="cover" [alt]="o.album.name" />
                  }
                  <span class="tname">{{ o.track.name }}</span>
                  <span class="talbum muted"
                    >{{ o.album.name }} ({{ year(o.album.releaseDate) }})</span
                  >

                  <button
                    mat-icon-button
                    class="play"
                    matTooltip="Play on your device"
                    [disabled]="!o.track.isPlayable"
                    (click)="play(o.track.uri)"
                  >
                    <mat-icon>play_arrow</mat-icon>
                  </button>

                  <span class="members">
                    <button
                      mat-icon-button
                      class="add-pl"
                      matTooltip="Add to a playlist"
                      [matMenuTriggerFor]="discoMenu"
                      [matMenuTriggerData]="{ track: o.track, album: o.album }"
                      [disabled]="store.busy() || store.playlistsBuilding()"
                    >
                      <mat-icon>playlist_add</mat-icon>
                    </button>
                  </span>

                  <span class="tdur">{{ duration(o.track.durationMs) }}</span>
                </li>
              }
            </ul>
          </div>
        }
      </mat-tab>
    </mat-tab-group>
  }

  <!-- Playlist toolbar -->
  @if (selectionCount() > 0) {
    <div class="playlist-bar">
      <span>{{ selectionCount() }} selected</span>
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="pl-select">
        <mat-label>Choose a playlist</mat-label>
        <mat-select
          [value]="playlistId() ?? ''"
          matTooltip="Pick which playlist to add the selected tracks to"
          (selectionChange)="onPlaylistChange($event.value)"
        >
          @for (p of store.playlists(); track p.id) {
            <mat-option [value]="p.id">{{ p.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <button
        mat-flat-button
        color="primary"
        matTooltip="Add the selected tracks to the chosen playlist"
        [disabled]="playlistId() === null || store.busy()"
        (click)="addSelectedToPlaylist()"
      >
        <mat-icon>playlist_add</mat-icon> Add
      </button>
      <button mat-button matTooltip="Clear your track selection" (click)="clearSelection()">
        Clear
      </button>
    </div>
  }

  <!-- Shared "add to / remove from playlist" menus (one per track kind) -->
  <mat-menu #discoMenu>
    <ng-template matMenuContent let-track="track" let-album="album">
      @for (p of store.editablePlaylists(); track p.id) {
        <button mat-menu-item (click)="toggleDiscoMembership(track, album, p.id)">
          <mat-icon>{{
            trackInPlaylist(track.id, p.id) ? 'check_box' : 'check_box_outline_blank'
          }}</mat-icon>
          <span>{{ p.name }}</span>
        </button>
      } @empty {
        <button mat-menu-item disabled>No editable playlists</button>
      }
    </ng-template>
  </mat-menu>

  <mat-menu #entryMenu>
    <ng-template matMenuContent let-entry="entry">
      @for (p of store.editablePlaylists(); track p.id) {
        <button mat-menu-item (click)="toggleEntryMembership(entry, p.id)">
          <mat-icon>{{
            trackInPlaylist(entry.id, p.id) ? 'check_box' : 'check_box_outline_blank'
          }}</mat-icon>
          <span>{{ p.name }}</span>
        </button>
      } @empty {
        <button mat-menu-item disabled>No editable playlists</button>
      }
    </ng-template>
  </mat-menu>
</section>
```

### `src/app/features/library/artist-tidy/artist-tidy.scss`
```scss
:host {
  display: block;
  height: 100%;
  overflow-y: auto;
}

.tidy {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.25rem 1.25rem 6rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

// Give each tab's content a little breathing room below the tab bar.
.tabs {
  ::ng-deep .mat-mdc-tab-body-content {
    padding-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
}

.tab-empty {
  opacity: 0.6;
  padding: 1.5rem 0;
  text-align: center;
}

.topbar {
  display: flex;
  align-items: center;
  gap: 1rem;

  .photo {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;

    &.placeholder {
      display: grid;
      place-items: center;
      background: var(--mat-sys-surface-container-high, rgba(255, 255, 255, 0.08));
    }
  }

  .who {
    flex: 1;
    min-width: 0;

    h1 {
      margin: 0;
      font-size: 1.4rem;
    }
  }
}

.summary {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

// Genre tags — Spotify's genres for this artist, resolved during a scan.
.genres {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.35rem;
}

.chip {
  font-size: 0.78rem;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: var(--mat-sys-surface-container-high, rgba(255, 255, 255, 0.08));

  &.relink {
    color: #ffce6b;
  }

  &.dup {
    color: #ff8a80;
  }

  &.genre {
    color: var(--mat-sys-primary, #7fd8c4);
    text-transform: capitalize;
  }
}

.error {
  opacity: 0.7;
  padding: 1rem 0;
}

.block {
  border: 1px solid var(--mat-sys-outline-variant, rgba(255, 255, 255, 0.14));
  border-radius: 10px;
  padding: 0.75rem 1rem;
}

.block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    margin: 0;
    font-size: 1rem;
  }
}

.suggestion {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0.4rem 0;
  border-top: 1px solid var(--mat-sys-outline-variant, rgba(255, 255, 255, 0.08));

  .song {
    font-weight: 600;
  }

  .from {
    opacity: 0.65;
    font-size: 0.85rem;
  }
}

// Inline mat-select pickers (relink target / dedup keep) — keep them compact within a row.
.picker {
  min-width: 12rem;
  max-width: 18rem;
}

// Relink: the "current" release beside the "move to" target, so the swap is visible at a glance.
.relink-card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.85rem 0;
  border-top: 1px solid var(--mat-sys-outline-variant, rgba(255, 255, 255, 0.08));
}

.relink-song {
  display: flex;
  align-items: center;
  gap: 0.4rem;

  .song-ic {
    font-size: 1.05rem;
    width: 1.05rem;
    height: 1.05rem;
    opacity: 0.6;
  }

  .song {
    font-weight: 600;
  }
}

.relink-compare {
  display: flex;
  align-items: stretch;
  gap: 0.75rem;
}

.rel-side {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.35rem;
  padding: 0.6rem;
  border: 1px solid var(--mat-sys-outline-variant, rgba(255, 255, 255, 0.14));
  border-radius: 8px;
  background: var(--mat-sys-surface-container, rgba(255, 255, 255, 0.04));

  // The destination stands out — it's the release the like moves onto.
  &.target {
    border-color: var(--mat-sys-primary, #4dd0c7);
  }
}

.rel-tag {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.6;
}

.rel-cover {
  width: 88px;
  height: 88px;
  border-radius: 6px;
  object-fit: cover;

  &.placeholder {
    display: grid;
    place-items: center;
    background: var(--mat-sys-surface-container-high, rgba(255, 255, 255, 0.08));
  }
}

.rel-album {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.85rem;
}

.rel-year {
  font-size: 0.78rem;
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
}

.rel-arrow {
  align-self: center;
  flex-shrink: 0;
  opacity: 0.7;
}

// The target picker fills its card (overrides the shared .picker min-width).
.rel-picker {
  width: 100%;
  margin-top: auto;
}

.relink-go {
  align-self: flex-end;
}

.sort-select {
  width: 12rem;
}

.pl-select {
  min-width: 12rem;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--mat-sys-surface, #0f1717);
  padding: 0.5rem 0;
}

.groups {
  display: flex;
  gap: 0.25rem;
}

.seg {
  text-transform: capitalize;
  padding: 0.3rem 0.7rem;
  border: 1px solid var(--mat-sys-outline-variant, rgba(255, 255, 255, 0.2));
  border-radius: 999px;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;

  &.active {
    background: var(--mat-sys-primary, #4dd0c7);
    border-color: var(--mat-sys-primary, #4dd0c7);
    color: var(--mat-sys-on-primary, #00201d);
  }
}

.sorting {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.9rem;
  }
}

.release {
  border: 1px solid var(--mat-sys-outline-variant, rgba(255, 255, 255, 0.12));
  border-radius: 10px;
  overflow: hidden;
}

.release-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  background: var(--mat-sys-surface-container, rgba(255, 255, 255, 0.04));

  .cover {
    width: 44px;
    height: 44px;
    border-radius: 4px;
    object-fit: cover;
  }

  .meta {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;

    .album-name {
      font-weight: 600;
    }

    .album-sub {
      font-size: 0.8rem;
      opacity: 0.6;
      text-transform: capitalize;
    }
  }
}

.tracks {
  list-style: none;
  margin: 0;
  padding: 0;
}

.track {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.35rem 0.75rem;
  border-top: 1px solid var(--mat-sys-outline-variant, rgba(255, 255, 255, 0.07));

  .tnum {
    width: 1.5rem;
    text-align: right;
    opacity: 0.5;
    font-size: 0.85rem;
  }

  .tname {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tdur {
    opacity: 0.55;
    font-size: 0.85rem;
    font-variant-numeric: tabular-nums;
  }

  .state {
    font-size: 1.1rem;
    width: 1.1rem;
    height: 1.1rem;

    &.liked {
      color: var(--mat-sys-primary, #4dd0c7);
    }

    &.elsewhere {
      color: #ffce6b;
    }

    &.not-liked {
      color: var(--mat-sys-outline, #6b7775);
      opacity: 0.7;
    }
  }

  &.unavailable .tname {
    opacity: 0.45;
    text-decoration: line-through;
  }
}

// Subtle secondary text + the scan-progress / refresh control in the controls row.
.muted {
  opacity: 0.6;
  font-size: 0.82rem;
}

.playlists-status {
  display: flex;
  align-items: center;
  gap: 0.6rem;

  .muted {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
}

// Per-track playlist membership: chips for the playlists holding it + an add/remove menu button.
.members {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-wrap: wrap;
  justify-content: flex-end;
  max-width: 55%;
}

.pl-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  max-width: 11rem;
  padding: 0.1rem 0.2rem 0.1rem 0.5rem;
  border-radius: 999px;
  font-size: 0.74rem;
  white-space: nowrap;
  background: var(--mat-sys-surface-container-high, rgba(255, 255, 255, 0.08));
  border: 1px solid var(--mat-sys-outline-variant, rgba(255, 255, 255, 0.14));

  &.locked {
    opacity: 0.6;
    padding-right: 0.5rem;
  }

  .chip-x {
    display: inline-grid;
    place-items: center;
    width: 1.05rem;
    height: 1.05rem;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: inherit;
    cursor: pointer;

    mat-icon {
      font-size: 0.85rem;
      width: 0.85rem;
      height: 0.85rem;
    }
  }
}

.add-pl.mat-mdc-icon-button,
.play.mat-mdc-icon-button {
  width: 32px;
  height: 32px;
  padding: 0;

  mat-icon {
    font-size: 18px;
    width: 18px;
    height: 18px;
  }
}

.play.mat-mdc-icon-button {
  color: var(--mat-sys-primary, #4dd0c7);
}

// Playlist-only tracks (e.g. features) — a track row with album thumbnail + name.
.extra-track {
  border-top: 1px solid var(--mat-sys-outline-variant, rgba(255, 255, 255, 0.07));

  .mini-cover {
    width: 32px;
    height: 32px;
    border-radius: 4px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .talbum {
    max-width: 12rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.playlist-bar {
  position: fixed;
  left: 50%;
  bottom: 1rem;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.75rem;
  background: var(--mat-sys-surface-container-high, #1d2a2a);
  border: 1px solid var(--mat-sys-outline-variant, rgba(255, 255, 255, 0.2));
  border-radius: 999px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
  z-index: 5;
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — the view compiles; both dialogs,
      `LogTerminal`, `PlayerStore`, and the engine helpers resolve.
- [ ] Exercised via the route (step 17): opening an artist shows the photo + genre chips + the three tabs; the
      **Discography** tab lists releases with ❤/🔗 flags, playlist chips, and an **Import favourites** button; the
      bottom playlist bar appears once you tick a track.

## If it breaks
- **The view never loads an artist / stays on the log terminal** → the `effect()` must read `this.id()` and call
  `openArtist` inside `untracked()`; the route param signal only updates if the `:id` route (step 17) is live.
- **`NG0600: writing to signals is not allowed in a computed`** → a signal write leaked into a computed; keep the
  `openArtist` call inside `untracked()` in the constructor effect.
- **Playlist chips never appear** → `ensurePlaylistIndex()` didn't run or errored; it's kicked in the constructor
  and syncs the index (M9). The chips read `store.playlistsForTrack` which needs a built index.
- **Play does nothing** → `PlayerStore.playTrack` needs Premium + an active device (R4); a free account gets the
  "needs Premium" toast — that's expected, not a bug.
