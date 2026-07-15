# M10 · Step 15 of 18 — The all-liked-songs page
> Nav: [← The ArtistTidy detail view](14_artist-tidy.md) · [Overview](00_overview.md) · [The library-wide tidy page →](16_library-tidy.md)

> **This step touches 3 files, committed together:** `features/library/liked-songs/liked-songs.{ts,html,scss}` —
> the flat `/library/tracks` view of every liked song.

## Glossary for this step
> **bulk selection** — a header "select all visible" checkbox plus per-row checkboxes, feeding a one-shot "add
> selected to a playlist" action. The selection is cleared whenever the visible set changes (e.g. toggling the
> "not in any playlist" filter) so a stale tick can't act on a hidden row.

## Why / design
`LikedSongs` is the searchable, sortable, flat list of every liked track (`store.allLikedTracks`) — the
counterpart to the artist-grouped master table. Per row: play (M7 `playTrack`), a playlist add/remove menu, and
remove-from-Liked-Songs (reversible via the store's Undo). Plus:

- **Search** across title / artist / album; **sort** by any column.
- **"Not in any playlist"** filter — surfaces liked songs you've never filed, using
  `store.playlistsForTrack(id).length === 0`. Recomputes on `playlistRevision`.
- **Bulk add** — tick rows, pick a playlist, add them all in one `store.addToPlaylist`.

> **Recurring model — view state local, data + mutations in the store.** The component owns search/sort/selection
> signals; every track mutation goes through `LibraryStore` (so removes are reversible and the index stays
> consistent). The `rows` computed reads `store.playlistRevision()` so the "not in any playlist" filter re-runs
> when membership changes. Play needs Premium + a device (R4).

The `toRef(row)` helper builds a `PlaylistTrackRef` from a flat row (no album art in the flat index → `null`
cover). Column keys (`name`/`artists`/`album`/`added`/`duration`) are local to this view; cosmetic.

## Do this
1. Create the three `liked-songs` files under `src/app/features/library/liked-songs/`.
2. The constructor calls `store.initMaster()` (so a direct `/library/tracks` open isn't empty) and
   `ensurePlaylistIndex()` (so the membership menu + filter work).
3. `toggleNotInPlaylist()` **clears the selection** — a filtered-away row must not stay ticked. Keep that.

## Code
### `src/app/features/library/liked-songs/liked-songs.ts`
```ts
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

import { PlaylistTrackRef } from '../../../core/models/playlist-index';
import { PlayerStore } from '../../player/player-store';
import { LibraryStore, LikedTrackRow, SortDir } from '../library-store';

type TrackSortKey = 'name' | 'artists' | 'album' | 'added' | 'duration';

/** Flat, searchable, sortable view of every Liked Song — play, remove, or add to a playlist. */
@Component({
  selector: 'app-liked-songs',
  imports: [
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './liked-songs.html',
  styleUrl: './liked-songs.scss',
})
export class LikedSongs {
  protected readonly store = inject(LibraryStore);
  private readonly player = inject(PlayerStore);

  protected readonly search = signal('');
  protected readonly sortKey = signal<TrackSortKey>('added');
  protected readonly sortDir = signal<SortDir>('desc');
  /** Show only liked tracks that aren't in any of the user's playlists. */
  protected readonly notInPlaylistOnly = signal(false);
  /** Currently ticked track ids for the bulk "add to playlist" action. */
  protected readonly selection = signal<ReadonlySet<string>>(new Set());
  protected readonly selectionCount = computed(() => this.selection().size);

  protected readonly columns: readonly { key: TrackSortKey; label: string; num?: boolean }[] = [
    { key: 'name', label: 'Title' },
    { key: 'artists', label: 'Artist' },
    { key: 'album', label: 'Album' },
    { key: 'added', label: 'Added' },
    { key: 'duration', label: 'Length', num: true },
  ];

  /** Liked tracks after the search + "not in any playlist" filters and the chosen sort. */
  protected readonly rows = computed<LikedTrackRow[]>(() => {
    this.store.playlistRevision(); // recompute membership-derived filter as playlists change
    const query = this.search().trim().toLowerCase();
    let filtered =
      query === ''
        ? this.store.allLikedTracks()
        : this.store
            .allLikedTracks()
            .filter(
              (row) =>
                row.name.toLowerCase().includes(query) ||
                row.artists.toLowerCase().includes(query) ||
                row.albumName.toLowerCase().includes(query),
            );
    if (this.notInPlaylistOnly()) {
      filtered = filtered.filter((row) => this.store.playlistsForTrack(row.id).length === 0);
    }
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    const key = this.sortKey();
    return [...filtered].sort((a, b) => {
      switch (key) {
        case 'artists':
          return dir * a.artists.localeCompare(b.artists);
        case 'album':
          return dir * a.albumName.localeCompare(b.albumName);
        case 'added':
          return dir * (a.addedAt < b.addedAt ? -1 : a.addedAt > b.addedAt ? 1 : 0);
        case 'duration':
          return dir * (a.durationMs - b.durationMs);
        default:
          return dir * a.name.localeCompare(b.name);
      }
    });
  });

  /** Ids of playlists the user can write to — gates the membership menu. */
  protected readonly editableIds = computed(
    () => new Set(this.store.editablePlaylists().map((p) => p.id)),
  );

  /** Whether every currently-visible row is ticked — drives the header select-all box. */
  protected readonly allSelected = computed(() => {
    const rows = this.rows();
    const selection = this.selection();
    return rows.length > 0 && rows.every((row) => selection.has(row.id));
  });

  constructor() {
    // Opened directly via /library/tracks: hydrate the caches so the list isn't empty on a reload.
    this.store.initMaster();
    void this.store.ensurePlaylistIndex();
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected setSort(key: TrackSortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortDir.set(key === 'name' || key === 'artists' || key === 'album' ? 'asc' : 'desc');
    }
  }

  protected duration(ms: number): string {
    const total = Math.round(ms / 1000);
    const min = Math.floor(total / 60);
    const sec = `${total % 60}`.padStart(2, '0');
    return `${min}:${sec}`;
  }

  protected play(uri: string): void {
    void this.player.playTrack(uri);
  }

  protected remove(id: string): void {
    void this.store.removeLikedById(id);
  }

  protected trackInPlaylist(trackId: string, playlistId: string): boolean {
    return this.store.playlistsForTrack(trackId).some((p) => p.id === playlistId);
  }

  protected toggleMembership(row: LikedTrackRow, playlistId: string): void {
    void this.store.setTrackInPlaylist(
      toRef(row),
      playlistId,
      !this.trackInPlaylist(row.id, playlistId),
    );
  }

  // --- "Not in any playlist" filter + bulk add ---

  protected toggleNotInPlaylist(): void {
    this.notInPlaylistOnly.update((v) => !v);
    this.selection.set(new Set()); // the visible set changed — a stale selection would confuse
  }

  protected isSelected(id: string): boolean {
    return this.selection().has(id);
  }

  protected toggleSelect(id: string): void {
    const next = new Set(this.selection());
    if (!next.delete(id)) {
      next.add(id);
    }
    this.selection.set(next);
  }

  protected toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selection.set(new Set());
    } else {
      this.selection.set(new Set(this.rows().map((row) => row.id)));
    }
  }

  protected clearSelection(): void {
    this.selection.set(new Set());
  }

  /** Add every ticked track to the chosen playlist, then clear the selection. */
  protected addSelectedToPlaylist(playlistId: string): void {
    const selected = this.selection();
    const refs = this.rows()
      .filter((row) => selected.has(row.id))
      .map(toRef);
    void this.store.addToPlaylist(playlistId, refs).then(() => this.selection.set(new Set()));
  }
}

/** A liked-track row as a playlist ref (no album art in the flat index → null cover). */
function toRef(row: LikedTrackRow): PlaylistTrackRef {
  return {
    id: row.id,
    name: row.name,
    uri: row.uri,
    durationMs: row.durationMs,
    artistIds: row.artistIds,
    albumName: row.albumName,
    albumImageUrl: null,
  };
}
```

### `src/app/features/library/liked-songs/liked-songs.html`
```html
<section class="liked">
  <header class="head">
    <div class="titles">
      <h1>Liked songs</h1>
      <p class="sub">Every track in your Liked Songs — search, play, or tidy them up.</p>
    </div>
    <a mat-stroked-button routerLink="/library" matTooltip="Back to the artist list">
      <mat-icon>arrow_back</mat-icon> Artists
    </a>
  </header>

  @if (!store.hasData()) {
    <div class="empty">
      <mat-icon class="big">library_music</mat-icon>
      <p>No liked songs yet. Scan your library from the Artists page to populate this list.</p>
      <a mat-flat-button color="primary" routerLink="/library">Go to Library</a>
    </div>
  } @else {
    <div class="controls">
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
        <mat-icon matPrefix>search</mat-icon>
        <input
          matInput
          type="search"
          placeholder="Search title, artist or album"
          matTooltip="Filter the list by track title, artist name, or album"
          [value]="search()"
          (input)="onSearch($event)"
        />
      </mat-form-field>
      <button
        mat-stroked-button
        class="pl-filter"
        [class.active-filter]="notInPlaylistOnly()"
        matTooltip="Show only liked songs that aren't in any of your playlists"
        (click)="toggleNotInPlaylist()"
      >
        <mat-icon>{{ notInPlaylistOnly() ? 'filter_alt' : 'filter_alt_off' }}</mat-icon>
        Not in any playlist
      </button>
      <span class="count">{{ rows().length }} of {{ store.allLikedTracks().length }}</span>
    </div>

    @if (selectionCount() > 0) {
      <div class="bulk-bar">
        <span>{{ selectionCount() }} selected</span>
        <button
          mat-flat-button
          color="primary"
          matTooltip="Add the selected tracks to a playlist"
          [matMenuTriggerFor]="bulkMenu"
          [disabled]="store.busy() || store.playlistsBuilding()"
        >
          <mat-icon>playlist_add</mat-icon> Add to playlist…
        </button>
        <button mat-button (click)="clearSelection()">Clear</button>
      </div>
    }

    <table class="tracks">
      <thead>
        <tr>
          <th scope="col" class="check">
            <input
              type="checkbox"
              [checked]="allSelected()"
              (change)="toggleSelectAll()"
              [attr.aria-label]="'Select all visible tracks'"
            />
          </th>
          @for (col of columns; track col.key) {
            <th scope="col" [class.num]="col.num">
              <button
                type="button"
                class="sort"
                [matTooltip]="'Sort by ' + col.label.toLowerCase() + ' (click again to reverse)'"
                (click)="setSort(col.key)"
              >
                {{ col.label }}
                @if (sortKey() === col.key) {
                  <mat-icon class="dir">{{
                    sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward'
                  }}</mat-icon>
                }
              </button>
            </th>
          }
          <th scope="col" class="center" aria-label="Actions"></th>
        </tr>
      </thead>
      <tbody>
        @for (row of rows(); track row.id) {
          <tr [class.selected]="isSelected(row.id)">
            <td class="check">
              <input
                type="checkbox"
                [checked]="isSelected(row.id)"
                (change)="toggleSelect(row.id)"
                [attr.aria-label]="'Select ' + row.name"
              />
            </td>
            <td class="title">{{ row.name }}</td>
            <td class="muted">{{ row.artists || '—' }}</td>
            <td class="muted">{{ row.albumName }}</td>
            <td class="muted">{{ row.addedAt | date: 'mediumDate' }}</td>
            <td class="num muted">{{ duration(row.durationMs) }}</td>
            <td class="actions">
              <button
                mat-icon-button
                class="play"
                matTooltip="Play on your device"
                (click)="play(row.uri)"
              >
                <mat-icon>play_arrow</mat-icon>
              </button>
              <button
                mat-icon-button
                matTooltip="Add to / remove from playlists"
                [matMenuTriggerFor]="plMenu"
                [matMenuTriggerData]="{ row: row }"
                [disabled]="store.busy() || store.playlistsBuilding()"
              >
                <mat-icon>playlist_add</mat-icon>
              </button>
              <button
                mat-icon-button
                class="remove"
                matTooltip="Remove from Liked Songs"
                [disabled]="store.busy()"
                (click)="remove(row.id)"
              >
                <mat-icon>heart_broken</mat-icon>
              </button>
            </td>
          </tr>
        } @empty {
          <tr>
            <td colspan="7" class="empty-row">No tracks match your filters.</td>
          </tr>
        }
      </tbody>
    </table>
  }

  <mat-menu #bulkMenu>
    @for (p of store.editablePlaylists(); track p.id) {
      <button mat-menu-item (click)="addSelectedToPlaylist(p.id)">
        <mat-icon>queue_music</mat-icon>
        <span>{{ p.name }}</span>
      </button>
    } @empty {
      <button mat-menu-item disabled>No editable playlists</button>
    }
  </mat-menu>

  <mat-menu #plMenu>
    <ng-template matMenuContent let-row="row">
      @for (p of store.editablePlaylists(); track p.id) {
        <button mat-menu-item (click)="toggleMembership(row, p.id)">
          <mat-icon>{{
            trackInPlaylist(row.id, p.id) ? 'check_box' : 'check_box_outline_blank'
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

### `src/app/features/library/liked-songs/liked-songs.scss`
```scss
:host {
  display: block;
  height: 100%;
  overflow-y: auto;
}

.liked {
  max-width: 1040px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;

  h1 {
    margin: 0;
    font-size: 1.6rem;
  }

  .sub {
    margin: 0.25rem 0 0;
    opacity: 0.7;
  }
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  padding: 3rem 1rem;
  border: 1px dashed var(--mat-sys-outline-variant, rgba(255, 255, 255, 0.18));
  border-radius: 12px;

  .big {
    font-size: 3rem;
    width: 3rem;
    height: 3rem;
    opacity: 0.6;
  }

  p {
    margin: 0;
    max-width: 36rem;
    opacity: 0.85;
  }
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;

  .search {
    flex: 1 1 18rem;
    max-width: 26rem;
  }

  .count {
    opacity: 0.6;
    font-size: 0.85rem;
  }

  .pl-filter.active-filter {
    color: var(--mat-sys-primary, #4dd0c7);
    border-color: var(--mat-sys-primary, #4dd0c7);
  }
}

// Bulk action bar shown while tracks are ticked.
.bulk-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  background: var(--mat-sys-surface-container-high, rgba(255, 255, 255, 0.06));
}

.tracks {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;

  th,
  td {
    text-align: left;
    padding: 0.4rem 0.6rem;
    border-bottom: 1px solid var(--mat-sys-outline-variant, rgba(255, 255, 255, 0.12));
  }

  th {
    font-weight: 600;
    opacity: 0.75;
    font-size: 0.85rem;
  }

  .num {
    text-align: right;
    width: 5rem;
  }

  .center {
    text-align: center;
  }

  .check {
    width: 2.25rem;
    text-align: center;
  }

  tbody tr.selected {
    background: var(--mat-sys-surface-container-high, rgba(77, 208, 199, 0.12));
  }

  td.muted {
    opacity: 0.65;
  }

  .title {
    font-weight: 500;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.1rem;
    white-space: nowrap;
  }

  tbody tr:hover {
    background: var(--mat-sys-surface-container-high, rgba(255, 255, 255, 0.05));
  }

  .empty-row {
    text-align: center;
    opacity: 0.6;
    padding: 1.5rem 0;
  }

  .sort {
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    font-weight: 600;
    color: inherit;
    cursor: pointer;

    &:hover {
      color: var(--mat-sys-primary, #4dd0c7);
    }

    .dir {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
    }
  }

  .num .sort {
    flex-direction: row-reverse;
  }

  .play {
    color: var(--mat-sys-primary, #4dd0c7);
  }

  .remove {
    color: #ff8a80;
  }
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — the page compiles; `PlayerStore` +
      the store's `allLikedTracks` / `editablePlaylists` resolve.
- [ ] Via `/library/tracks` (step 17): the table lists every liked song with a live *"N of M"* count; searching
      narrows it; toggling **Not in any playlist** filters to unfiled songs; ticking rows shows the bulk **Add to
      playlist…** bar; **Remove** (`heart_broken`) drops a like with an Undo toast.

## If it breaks
- **The list is empty though you scanned** → `initMaster()` didn't hydrate `LikedIndex`; it runs in the
  constructor — confirm it's there (a direct `/library/tracks` open relies on it).
- **"Not in any playlist" shows everything** → the playlist index isn't built; `ensurePlaylistIndex()` runs in
  the constructor and `playlistsForTrack` reads it — a first-ever run needs the sync to finish.
- **`colspan="7"` misaligns the empty row** → the table has 7 columns (checkbox + 5 data + actions); keep the
  span in sync if you add/remove a column.
