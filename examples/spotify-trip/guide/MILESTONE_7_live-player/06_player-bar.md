# M7 · Step 06 of 8 — The `player-bar` component
> Nav: [← Toggle ❤ + playlists](05_favourite-and-playlists.md) · [Overview](00_overview.md) · [Embed in the header →](07_header-embed.md)

> **This step touches 3 files, committed together:** `player-bar.ts`, `player-bar.html`, `player-bar.scss` —
> one component (separate template + styles, per [conventions](../foundation/conventions.md)).

## Glossary for this step
> **`@let`** — a template-local variable in modern Angular control flow (`@let track = state();`), so you read
> a signal once and reuse it. See [Angular control-flow docs](https://angular.dev/guide/templates/control-flow).
> **`matMenuTriggerFor` / `(menuOpened)`** — Angular Material's menu: a button opens the `<mat-menu>`, and
> `(menuOpened)` fires when it opens — the hook we use to lazily load playlists.

## Why / design
`PlayerBar` is a compact, mostly-**dumb** component: it owns no state, it just mirrors `PlayerStore`'s readonly
signals into the template and forwards clicks back to the store's methods. "Smart by exception" — it lives
self-contained rather than taking a dozen signal inputs/outputs, because it wires exactly one store to a few
buttons.

Template shape:

- **Now-playing:** album art (from the smallest image, chosen by the mapper), title, and artist names. When
  nothing is playing (`state()` is `null`), it shows an italic "Nothing playing".
- **Controls:** ❤ (only when a track is loaded), add-to-playlist menu (loads on open), shuffle, previous,
  play/pause, next. The play/pause and ❤ icons swap on the store's `isPlaying()` / `isFavourite()` signals; the
  shuffle and ❤ buttons get an `.on` class (coloured `--mat-sys-primary`) when active.
- **Playlist menu:** shows "Loading playlists…", "No editable playlists", or the list — driven by
  `playlistsLoading()` and `playlists()`.

Everything is `OnPush` + signal reads, so it re-renders only when a store signal changes — no manual change
detection.

## Do this
1. **Create `src/app/features/player/player-bar/` and its three files** with the code below.
2. The component imports `MatButtonModule`, `MatIconModule`, `MatMenuModule` (Material, already installed in
   M0) — no `NgModule`, it's a [standalone component](../foundation/glossary.md#standalone-component).
3. The selector `app-player-bar` is **load-bearing** (the header references it in step 07). The `protected`
   method/signal names are cosmetic.

## Code
### `src/app/features/player/player-bar/player-bar.ts`
```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { PlayerStore } from '../player-store';

/**
 * Compact Spotify player for the header: shows the current track and drives shuffle / previous /
 * play-pause / next, plus liking the current song and adding it to a playlist, through
 * {@link PlayerStore}. Smart by exception — it owns no state, only wiring the root playback store to a
 * few buttons, so it lives self-contained rather than as dumb IO.
 */
@Component({
  selector: 'app-player-bar',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './player-bar.html',
  styleUrl: './player-bar.scss',
})
export class PlayerBar {
  private readonly store = inject(PlayerStore);

  protected readonly state = this.store.state;
  protected readonly isPlaying = this.store.isPlaying;
  protected readonly shuffle = this.store.shuffle;
  protected readonly isFavourite = this.store.isFavourite;
  protected readonly playlists = this.store.playlists;
  protected readonly playlistsLoading = this.store.playlistsLoading;

  protected toggleShuffle(): void {
    void this.store.toggleShuffle();
  }

  protected previous(): void {
    void this.store.previous();
  }

  protected togglePlay(): void {
    void this.store.togglePlay();
  }

  protected next(): void {
    void this.store.next();
  }

  protected toggleFavourite(): void {
    void this.store.toggleFavourite();
  }

  protected loadPlaylists(): void {
    void this.store.loadPlaylists();
  }

  protected addToPlaylist(playlistId: string): void {
    void this.store.addCurrentToPlaylist(playlistId);
  }
}
```

### `src/app/features/player/player-bar/player-bar.html`
```html
<div class="player">
  @let track = state();
  <div class="now-playing" [class.empty]="!track">
    @if (track?.albumImageUrl; as art) {
      <img class="art" [src]="art" alt="" />
    }
    <div class="meta">
      <span class="title">{{ track ? track.trackName : 'Nothing playing' }}</span>
      @if (track) {
        <span class="artist">{{ track.artistNames }}</span>
      }
    </div>
  </div>

  <div class="controls">
    @if (track) {
      <button
        mat-icon-button
        class="fav"
        [class.on]="isFavourite()"
        (click)="toggleFavourite()"
        [title]="isFavourite() ? 'Remove from Liked Songs' : 'Add to Liked Songs'"
        [attr.aria-label]="isFavourite() ? 'Remove from Liked Songs' : 'Add to Liked Songs'"
      >
        <mat-icon>{{ isFavourite() ? 'favorite' : 'favorite_border' }}</mat-icon>
      </button>
      <button
        mat-icon-button
        [matMenuTriggerFor]="playlistMenu"
        (menuOpened)="loadPlaylists()"
        title="Add to playlist"
        aria-label="Add current track to a playlist"
      >
        <mat-icon>playlist_add</mat-icon>
      </button>
    }
    <button
      mat-icon-button
      class="shuffle"
      [class.on]="shuffle()"
      (click)="toggleShuffle()"
      title="Shuffle"
      aria-label="Toggle shuffle"
    >
      <mat-icon>shuffle</mat-icon>
    </button>
    <button mat-icon-button (click)="previous()" title="Previous" aria-label="Previous track">
      <mat-icon>skip_previous</mat-icon>
    </button>
    <button
      mat-icon-button
      (click)="togglePlay()"
      [title]="isPlaying() ? 'Pause' : 'Play'"
      [attr.aria-label]="isPlaying() ? 'Pause' : 'Play'"
    >
      <mat-icon>{{ isPlaying() ? 'pause' : 'play_arrow' }}</mat-icon>
    </button>
    <button mat-icon-button (click)="next()" title="Next" aria-label="Next track">
      <mat-icon>skip_next</mat-icon>
    </button>
  </div>

  <mat-menu #playlistMenu="matMenu">
    @if (playlistsLoading()) {
      <button mat-menu-item disabled>Loading playlists…</button>
    } @else if (playlists().length === 0) {
      <button mat-menu-item disabled>No editable playlists</button>
    } @else {
      @for (playlist of playlists(); track playlist.id) {
        <button mat-menu-item (click)="addToPlaylist(playlist.id)">{{ playlist.name }}</button>
      }
    }
  </mat-menu>
</div>
```

### `src/app/features/player/player-bar/player-bar.scss`
```scss
.player {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.now-playing {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  // Keep the variable-length track label from pushing the controls off-screen.
  max-width: 16rem;

  &.empty .title {
    color: var(--mat-sys-on-surface-variant);
    font-style: italic;
  }
}

.art {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  object-fit: cover;
  flex: 0 0 auto;
}

.meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.2;
}

.title,
.artist {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title {
  font-size: 0.85rem;
  font-weight: 500;
}

.artist {
  font-size: 0.75rem;
  color: var(--mat-sys-on-surface-variant);
}

.controls {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
}

.shuffle.on,
.fav.on {
  color: var(--mat-sys-primary);
}

// Below the header's mobile breakpoint, drop the track label and keep just the controls.
@media (max-width: 599px) {
  .now-playing {
    display: none;
  }
}
```

## Done when (this step)
- [ ] `npm run build` → clean. The component compiles; nothing renders it yet (that's step 07).
- [ ] `npm run lint` → clean (all three Material modules are used in the template).

## If it breaks
- **`'app-player-bar' is not a known element`** appears in step 07, not here — it means the header didn't
  import `PlayerBar`. Nothing to fix in this file.
- **`Can't bind to 'matMenuTriggerFor'`** → `MatMenuModule` missing from the component `imports` array.
- **Album art broken / no thumbnail** → `track.albumImageUrl` is `null` for tracks Spotify returns without
  images; the `@if (track?.albumImageUrl; as art)` guard hides the `<img>` in that case — expected, not a bug.
- **Icons show as text (e.g. the word "shuffle")** → the Material Symbols/Icons font isn't loaded; that's the
  M0 Material setup, not this component.
