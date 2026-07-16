# M11 · Step 09 of 10 — Actions page: a "Clear all data" control
> Nav: [← View-options "Save image"](08_view-options-save-image.md) · [Overview](00_overview.md) · [Empty/error states + a11y →](10_states-and-a11y.md)

> **This step touches 2 files, committed together:** `features/actions/actions-page/actions-page.ts` (inject
> `DataTransfer` + `Confirm`, add `clearAllData()`) + `.html` (a "Data" group). The `.scss` is unchanged.

## Why / design
The Actions page is the data-management page; a whole-dataset **wipe** belongs here too (the settings panel's
Delete does the same thing — same `DataTransfer.clear()` scope — for the user who's on the globe). M9 left a
`// grows in M11` placeholder comment where this group goes; we replace it now.

`clearAllData()` mirrors the panel's Delete: it goes through the shared `Confirm` dialog (M10) with
`destructive: true` (warn-palette button), then on confirm calls `dataTransfer.clear()` and reloads so every
store re-hydrates empty. **You stay logged in** — `clear()` never touches `evm.spotify.*` (step 05). This step
does **not** convert the page to `LibraryStore`: the guide's Actions page reads `PlaylistIndex` directly (M9);
only the wipe control is new.

## Do this
1. In `src/app/features/actions/actions-page/actions-page.ts`, add `DataTransfer` + `Confirm` injects and a
   `clearAllData()` method. Everything else (the three sync groups, `PlaylistIndex.hydrate()`, `agoLabel`, the
   unplaced picker) is unchanged from M9.
2. In `.../actions-page.html`, replace the `<!-- Clear-all-data … // grows in M11 -->` placeholder with the
   **Data** group.

## Code
### `src/app/features/actions/actions-page/actions-page.ts`
```ts
import { afterNextRender, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DataTransfer } from '../../../core/cache/data-transfer';
import { GeoData } from '../../../core/geo/geo-data';
import { Country } from '../../../core/models/country';
import { BootSync } from '../../../core/pipeline/boot-sync';
import { PlaylistIndex } from '../../../core/pipeline/playlist-index';
import { Confirm } from '../../../shared/confirm';
import { GlobeStore } from '../../globe/globe-store';
import { UnplacedArtists } from '../../globe/unplaced-artists/unplaced-artists';

/**
 * Data management page: per-domain reload of the three datasets that feed the app — Liked Songs,
 * playlists, artist info — each with a cheap "Check for updates" (diff only) and a "Full re-scan"
 * (re-fetch from scratch), plus the couldn't-place list and a wipe-everything control. The globe view
 * stays a pure visualization; every control lives here.
 */
@Component({
  selector: 'app-actions-page',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, UnplacedArtists],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './actions-page.html',
  styleUrl: './actions-page.scss',
})
export class ActionsPage {
  protected readonly store = inject(GlobeStore);
  protected readonly sync = inject(BootSync);
  protected readonly playlists = inject(PlaylistIndex);
  private readonly dataTransfer = inject(DataTransfer);
  private readonly confirm = inject(Confirm);
  /** Countries for the couldn't-place picker, loaded once from the GeoJSON. */
  protected readonly countries = signal<Country[]>([]);

  constructor() {
    // Hydrate the cached playlist index so its "last built" status reflects a prior scan without any
    // network on open. The globe dataset is already restored by the app root (step 14).
    afterNextRender(() => this.playlists.hydrate());
    const geoData = inject(GeoData);
    void geoData.countries().then((countries) => this.countries.set(countries));
  }

  // --- Liked Songs ---

  protected checkLiked(): void {
    void this.sync.syncLiked(true);
  }

  protected rescanLiked(): void {
    void this.sync.fullRescanLiked();
  }

  // --- Playlists ---

  protected checkPlaylists(): void {
    void this.sync.syncPlaylists(true);
  }

  protected rescanPlaylists(): void {
    void this.sync.fullRescanPlaylists();
  }

  // --- Artists ---

  protected checkArtists(): void {
    void this.sync.syncArtists(true);
  }

  protected rescanArtists(): void {
    void this.sync.fullRescanArtists();
  }

  protected recheckUnplaced(): void {
    void this.store.recheckUnplaced();
  }

  /** "synced 3 min ago" / "never synced" for a domain's last-sync timestamp. */
  protected agoLabel(at: number | null): string {
    if (at === null) {
      return 'never synced';
    }
    const seconds = Math.round((Date.now() - at) / 1000);
    if (seconds < 60) {
      return 'synced just now';
    }
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `synced ${minutes} min ago`;
    }
    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return `synced ${hours} h ago`;
    }
    return `synced ${Math.round(hours / 24)} d ago`;
  }

  /**
   * Wipe every locally-stored EarthViewMusic entry (globe dataset, playlist index, preferences,
   * appearance, trip log), keeping the Spotify login, then reload so each store re-hydrates empty.
   * Same scope as the settings panel's Delete.
   */
  protected async clearAllData(): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Clear all data?',
      message:
        'Clear all locally-stored EarthViewMusic data — the globe dataset, playlist index, ' +
        'preferences, appearance, and trip log? You stay logged in. This cannot be undone.',
      confirmLabel: 'Clear all',
      destructive: true,
    });
    if (!ok) {
      return;
    }
    this.dataTransfer.clear();
    location.reload();
  }
}
```

### `src/app/features/actions/actions-page/actions-page.html`
```html
<section class="actions">
  <header class="head">
    <h1>Actions</h1>
    <p class="sub">
      Reload the data that feeds EarthViewMusic. “Check for updates” fetches only what changed;
      “Full re-scan” re-reads everything from scratch.
    </p>
  </header>

  <div class="groups">
    <!-- Liked Songs → globe -->
    <section class="group">
      <h2 class="group-title">Liked Songs</h2>
      <p class="group-sub">The dataset that colours the globe.</p>
      <div class="panel">
        <p class="status">
          {{ agoLabel(sync.lastSyncedAt('liked')) }} · {{ store.total() }} artists ·
          {{ store.resolvedCount() }} placed · {{ store.failedCount() }} unplaced
        </p>
        <div class="controls">
          <button
            mat-flat-button
            [disabled]="sync.running() || store.isResolving()"
            (click)="checkLiked()"
            matTooltip="Check Spotify for new likes and fetch only what changed"
          >
            <mat-icon>sync</mat-icon> Check for updates
          </button>
          <button
            mat-stroked-button
            [disabled]="sync.running() || store.isResolving()"
            (click)="rescanLiked()"
            matTooltip="Re-page your entire Liked Songs and retry every unplaced artist"
          >
            <mat-icon>restart_alt</mat-icon> Full re-scan
          </button>
        </div>
      </div>
    </section>

    <!-- Playlists -->
    <section class="group">
      <h2 class="group-title">Playlists</h2>
      <p class="group-sub">
        Membership index for the library tools — which playlists hold each track.
      </p>
      <div class="panel">
        @if (playlists.building()) {
          <p class="status">
            Checking your playlists… {{ playlists.progress().done }} of
            {{ playlists.progress().total }}
          </p>
        } @else {
          <p class="status">{{ agoLabel(sync.lastSyncedAt('playlists')) }}</p>
        }
        <div class="controls">
          <button
            mat-flat-button
            [disabled]="sync.running() || playlists.building()"
            (click)="checkPlaylists()"
            matTooltip="Re-read only the playlists changed since the last check"
          >
            <mat-icon>sync</mat-icon> Check for updates
          </button>
          <button
            mat-stroked-button
            [disabled]="sync.running() || playlists.building()"
            (click)="rescanPlaylists()"
            matTooltip="Re-read every playlist from scratch"
          >
            <mat-icon>restart_alt</mat-icon> Full re-scan
          </button>
        </div>
      </div>
    </section>

    <!-- Artist info (genres + follow state) -->
    <section class="group">
      <h2 class="group-title">Artist info</h2>
      <p class="group-sub">Genres and follow status for each placed artist.</p>
      <div class="panel">
        <p class="status">{{ agoLabel(sync.lastSyncedAt('artists')) }}</p>
        <div class="controls">
          <button
            mat-flat-button
            [disabled]="sync.running() || store.isResolving()"
            (click)="checkArtists()"
            matTooltip="Fetch genres/follow state for artists still missing it"
          >
            <mat-icon>sync</mat-icon> Check for updates
          </button>
          <button
            mat-stroked-button
            [disabled]="sync.running() || store.isResolving()"
            (click)="rescanArtists()"
            matTooltip="Re-fetch genres and follow state for every placed artist"
          >
            <mat-icon>restart_alt</mat-icon> Full re-scan
          </button>
        </div>
      </div>
    </section>

    <!-- Wipe local data (settings panel's Delete does the same for the globe view). -->
    <section class="group">
      <h2 class="group-title">Data</h2>
      <p class="group-sub">
        Everything EarthViewMusic stores in this browser — the globe dataset, playlist index,
        preferences, appearance, and trip log. Your Spotify login is kept.
      </p>
      <div class="panel">
        <button mat-stroked-button class="clear" (click)="clearAllData()">
          <mat-icon>delete_forever</mat-icon>
          Clear all data
        </button>
      </div>
    </section>
  </div>

  @if (store.unplaced().length > 0) {
    <div class="unplaced-head">
      <button
        mat-stroked-button
        [disabled]="sync.running() || store.isResolving()"
        (click)="recheckUnplaced()"
        matTooltip="Try again to auto-resolve the artists we couldn't place"
      >
        <mat-icon>refresh</mat-icon> Recheck unplaced
      </button>
    </div>
    <app-unplaced-artists
      class="unplaced"
      [artists]="store.unplaced()"
      [countries]="countries()"
      (place)="store.setCountry($event.artistId, $event.code)"
      (hide)="store.hideUnplaced($event)"
    />
  }
</section>
```

## Done when (this step)
- [ ] `npm run build` → clean.
- [ ] Navigate to `/actions` → a fourth **Data** group shows a **Clear all data** button. Click it → the
      confirm dialog appears (warn-palette **Clear all**); confirm → the page reloads with an empty globe and
      **you're still logged in** (no redirect to `/login`). `localStorage` retains `evm.spotify.*` but no
      `evm.origins` / `evm.appearance` / etc.

## If it breaks
- **`No provider for DataTransfer` / `Confirm`** → both are `providedIn: 'root'` (step 05 / M10); check the
  import paths.
- **Wipe logs you out** → something added `evm.spotify.*` to the portable set, or you called `localStorage.clear()`
  instead of `dataTransfer.clear()` — the wipe must go through `DataTransfer` so auth keys survive.
- **`playlists.building is not a function`** → you pasted the *source* actions page (which reads `LibraryStore`);
  the guide's page reads `PlaylistIndex` directly (M9) — keep `playlists.building()` / `playlists.progress()`.

---
> Nav: [← View-options "Save image"](08_view-options-save-image.md) · [Overview](00_overview.md) · [Empty/error states + a11y →](10_states-and-a11y.md)
