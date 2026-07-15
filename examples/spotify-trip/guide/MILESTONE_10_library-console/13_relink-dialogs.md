# M10 · Step 13 of 18 — The two relink dialogs (`ReleaseCompare` + `RelinkSubstitute`)
> Nav: [← The library page](12_library-page.md) · [Overview](00_overview.md) · [The ArtistTidy detail view →](14_artist-tidy.md)

> **This step touches 6 files, committed together:** the two dialog components
> `features/library/release-compare/release-compare.{ts,html,scss}` and
> `features/library/relink-substitute/relink-substitute.{ts,html,scss}`. Both are small `MatDialog` bodies opened
> by the artist detail (step 14), so we add them in one commit before it.

## Glossary for this step
> **`MAT_DIALOG_DATA`** — the token a dialog component injects to read the `data` its opener passed. Both dialogs
> use it for their inputs.
> **import-from-a-previous-release** — pulling a like you have on album X onto its copy on album Y (via the
> engine's `compareAlbum`), so your favourite sits on the release you're browsing.

## Why / design
Two focused modals that the `ArtistTidy` view opens:

1. **`ReleaseCompare`** — "Import favourites → <album>". It runs the pure `compareAlbum` (step 02) against the
   user's liked tracks and shows, per album track: already liked here (`likedHere`), liked on another release
   (`likedElsewhere`), or unavailable. Per-row **Move here** / **Add** / **Remove**, plus a one-click **Auto
   import** of every row that has a like stranded elsewhere. Every action routes through `LibraryStore` — so each
   is reversible via the Undo toast; the `rows` computed re-runs on `likedRevision`, so the modal updates live.
2. **`RelinkSubstitute`** — a confirm/preview modal shown *after* a relink when the old copy sits in playlists.
   It lists the **editable** playlists that'll get the position-preserving swap and the **skipped** (non-editable)
   ones, and closes `true` on confirm. The artist view (step 14) then calls `substituteInPlaylists` (step 08).

> **Recurring model — dialogs are dumb bodies, the store does the work.** `ReleaseCompare` reads store signals +
> calls store methods; `RelinkSubstitute` is a pure preview that only emits a boolean. Neither touches the API.
> The `[mat-dialog-close]="true/false"` bindings on `RelinkSubstitute`'s buttons are **load-bearing** (the
> caller's `.afterClosed()` reads them).

## Do this
1. Create the three `release-compare` files. Export `ReleaseCompareData` (`{ album, tracks }`) — the opener types
   its `data` against it. `rows` reads `store.likedRevision()` first so it recomputes after each action.
2. Create the three `relink-substitute` files. Export `RelinkSubstituteData` (`songName`, `targetLabel`,
   `editable`, `skipped`). It has no logic beyond rendering `data` and closing with a boolean.
3. Both selectors keep the `app-` prefix (cosmetic here — the dialogs are opened by class reference).

## Code
### `src/app/features/library/release-compare/release-compare.ts`
```ts
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { Album, AlbumTrack } from '../../../core/models/album';
import { IndexedTrack } from '../../../core/models/indexed-track';
import { CompareRow } from '../../../core/models/library-analysis';
import { compareAlbum } from '../../../core/pipeline/track-matching';
import { LibraryStore } from '../library-store';

export interface ReleaseCompareData {
  album: Album;
  tracks: AlbumTrack[];
}

/**
 * "Import favourites from a previous release" — compares this album's tracks against the user's
 * liked copies elsewhere, with per-row manual add/remove/move and a one-click Auto import.
 */
@Component({
  selector: 'app-release-compare',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './release-compare.html',
  styleUrl: './release-compare.scss',
})
export class ReleaseCompare {
  protected readonly store = inject(LibraryStore);
  protected readonly data = inject<ReleaseCompareData>(MAT_DIALOG_DATA);

  /** Recomputes after each library action via the liked-index revision. */
  protected readonly rows = computed<CompareRow[]>(() => {
    this.store.likedRevision();
    return compareAlbum(this.data.tracks, this.store.likedForDetail());
  });

  /** Rows whose like sits on another release and can be pulled onto this (playable) album. */
  protected readonly importable = computed(
    () =>
      this.rows().filter((r) => r.likedElsewhere.length > 0 && r.track.isPlayable && !r.likedHere)
        .length,
  );

  protected auto(): void {
    void this.store.importFromCompare(this.rows(), this.data.album);
  }

  protected moveHere(row: CompareRow): void {
    void this.store.relinkTo(row.likedElsewhere, { album: this.data.album, track: row.track });
  }

  protected add(track: AlbumTrack): void {
    void this.store.addFavourite({ album: this.data.album, track });
  }

  protected remove(track: AlbumTrack): void {
    const liked = this.store.likedForDetail().find((t: IndexedTrack) => t.id === track.id);
    if (liked !== undefined) {
      void this.store.removeFavourite(liked);
    }
  }

  protected elsewhereLabel(row: CompareRow): string {
    return row.likedElsewhere.map((t) => t.albumName).join(', ');
  }
}
```

### `src/app/features/library/release-compare/release-compare.html`
```html
<h2 mat-dialog-title>Import favourites → {{ data.album.name }}</h2>

<mat-dialog-content>
  <p class="lead">
    Match this release against songs you’ve already liked on other albums. Move them here to relink
    your favourites, or add/remove individually.
  </p>

  <div class="rows">
    @for (row of rows(); track row.track.id) {
      <div class="row" [class.disabled]="!row.track.isPlayable">
        <div class="info">
          <span class="title">{{ row.track.trackNumber }}. {{ row.track.name }}</span>
          @if (!row.track.isPlayable) {
            <span class="tag warn">Unavailable in your market</span>
          } @else if (row.likedHere) {
            <span class="tag ok">Liked here</span>
          } @else if (row.likedElsewhere.length > 0) {
            <span class="tag move">Liked on: {{ elsewhereLabel(row) }}</span>
          }
        </div>

        <div class="actions">
          @if (row.likedHere) {
            <button mat-button (click)="remove(row.track)">
              <mat-icon>heart_broken</mat-icon> Remove
            </button>
          } @else {
            @if (row.likedElsewhere.length > 0 && row.track.isPlayable) {
              <button mat-flat-button color="primary" (click)="moveHere(row)">
                <mat-icon>moving</mat-icon> Move here
              </button>
            }
            @if (row.track.isPlayable) {
              <button mat-button (click)="add(row.track)">
                <mat-icon>favorite_border</mat-icon> Add
              </button>
            }
          }
        </div>
      </div>
    }
  </div>
</mat-dialog-content>

<mat-dialog-actions align="end">
  <button mat-button mat-dialog-close>Close</button>
  <button mat-flat-button color="primary" [disabled]="importable() === 0" (click)="auto()">
    <mat-icon>auto_fix_high</mat-icon> Auto-import {{ importable() }} favourite(s)
  </button>
</mat-dialog-actions>
```

### `src/app/features/library/release-compare/release-compare.scss`
```scss
.lead {
  margin: 0 0 1rem;
  opacity: 0.75;
  max-width: 40rem;
}

.rows {
  display: flex;
  flex-direction: column;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--mat-sys-outline-variant, rgba(255, 255, 255, 0.12));

  &.disabled .title {
    opacity: 0.5;
  }
}

.info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.title {
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.tag {
  font-size: 0.78rem;
  opacity: 0.85;

  &.ok {
    color: var(--mat-sys-primary, #4dd0c7);
  }

  &.move {
    color: #ffce6b;
  }

  &.warn {
    color: #ff8a80;
  }
}
```

### `src/app/features/library/relink-substitute/relink-substitute.ts`
```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { Playlist } from '../../../core/models/playlist';

/** Inputs for the relink → playlist substitution preview. */
export interface RelinkSubstituteData {
  /** The liked song being relinked (its title). */
  songName: string;
  /** Where it's moving to (target album name). */
  targetLabel: string;
  /** Editable playlists the old copy sits in — these get the position-preserving substitution. */
  editable: Playlist[];
  /** Playlists holding the old copy that can't be edited — shown as skipped. */
  skipped: Playlist[];
}

/**
 * Confirms substituting a relinked track inside the user's playlists: previews which editable
 * playlists will have the old copy swapped for the new (in place) and which are skipped because
 * they aren't writable. Closes with `true` on confirm.
 */
@Component({
  selector: 'app-relink-substitute',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './relink-substitute.html',
  styleUrl: './relink-substitute.scss',
})
export class RelinkSubstitute {
  protected readonly data = inject<RelinkSubstituteData>(MAT_DIALOG_DATA);
}
```

### `src/app/features/library/relink-substitute/relink-substitute.html`
```html
<h2 mat-dialog-title>Also update your playlists?</h2>

<mat-dialog-content>
  <p class="lead">
    “{{ data.songName }}” is in your playlists. Swap the old copy for the version on
    <strong>{{ data.targetLabel }}</strong> — kept in the same position.
  </p>

  @if (data.editable.length > 0) {
    <h3 class="section">Will update ({{ data.editable.length }})</h3>
    <ul class="pl-list">
      @for (p of data.editable; track p.id) {
        <li><mat-icon class="ok">check_circle</mat-icon> {{ p.name }}</li>
      }
    </ul>
  }

  @if (data.skipped.length > 0) {
    <h3 class="section">Skipped — not editable ({{ data.skipped.length }})</h3>
    <ul class="pl-list muted">
      @for (p of data.skipped; track p.id) {
        <li><mat-icon class="lock">lock</mat-icon> {{ p.name }}</li>
      }
    </ul>
  }
</mat-dialog-content>

<mat-dialog-actions align="end">
  <button mat-button [mat-dialog-close]="false">Skip playlists</button>
  <button
    mat-flat-button
    color="primary"
    [mat-dialog-close]="true"
    [disabled]="data.editable.length === 0"
  >
    <mat-icon>swap_horiz</mat-icon> Update {{ data.editable.length }} playlist(s)
  </button>
</mat-dialog-actions>
```

### `src/app/features/library/relink-substitute/relink-substitute.scss`
```scss
.lead {
  margin: 0 0 1rem;
}

.section {
  margin: 1rem 0 0.35rem;
  font-size: 0.9rem;
  opacity: 0.8;
}

.pl-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  li {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  &.muted {
    opacity: 0.6;
  }

  mat-icon {
    font-size: 1.1rem;
    width: 1.1rem;
    height: 1.1rem;
  }

  .ok {
    color: var(--mat-sys-primary, #4dd0c7);
  }
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — both dialogs compile; `compareAlbum`
      and the store methods resolve.
- [ ] Exercised via the artist view (step 14): opening **Import favourites** on a release lists its tracks tagged
      *Liked here* / *Liked on: <album>* / *Unavailable*; relinking a track that's in playlists pops the
      *"Also update your playlists?"* preview.

## If it breaks
- **`No provider for MAT_DIALOG_DATA`** → these components must be opened via `MatDialog.open(...)` (step 14),
  never rendered directly in a template; the token only exists inside a dialog.
- **`ReleaseCompare` rows don't refresh after an action** → the `rows` computed must read `store.likedRevision()`
  first; without that read it can't track the plain-array `likedForDetail()`.
- **`RelinkSubstitute` always returns undefined** → its buttons must bind `[mat-dialog-close]="true"` /
  `"false"`; the caller reads those exact values from `afterClosed()`.
