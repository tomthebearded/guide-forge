# M9 · Step 12 of 14 — The Actions page
> Nav: [← Wire filters into the globe page](11_globe-page-wiring.md) · [Overview](00_overview.md) · [Header nav + routes →](13_header-routes.md)

> **This step touches 3 files, committed together:** `features/actions/actions-page/actions-page.ts` + `.html` +
> `.scss` — the data-management page that takes over the scan controls the globe page just shed.

## Why / design
The globe is now a pure visualization, so the controls live here. The Actions page is a **smart** page with one
job: reload the datasets that feed the app. Three groups, each with a cheap **Check for updates** (diff only)
and a **Full re-scan** (from scratch):

- **Liked Songs → globe** — `sync.syncLiked(true)` (cheap diff) / `sync.fullRescanLiked()` (re-page + retry).
- **Playlists** — `sync.syncPlaylists(true)` (snapshot diff) / `sync.fullRescanPlaylists()`; progress read
  straight from `PlaylistIndex.building()` / `.progress()`.
- **Artist info** — `sync.syncArtists(true)` (backfill missing genres/follow) / `sync.fullRescanArtists()`.

Plus **Recheck unplaced** (`store.recheckUnplaced()`) and the couldn't-place list itself (moved here from the M6
globe page), so you can still hand-place artists the resolver missed.

**Scope note:** the source Actions page also has a **"Clear all data"** control — it needs the M11 data-transfer
service (a whole-dataset wipe) — so that group is **deferred to M11**. M9 ships the three sync groups +
recheck/unplaced. `// grows in M11`

**Recurring model:** `BootSync` is the single sync authority; the page just calls its per-domain methods and
reads its reactive `running` / `lastSyncedAt` state for the disable + "synced N ago" labels. `afterNextRender`
hydrates the playlist index so the page reflects a prior build without any network on open.

## Do this
1. Create `src/app/features/actions/actions-page/actions-page.ts`. Inject `GlobeStore`, `BootSync`,
   `PlaylistIndex`, and `GeoData` (for the unplaced picker's country list).
2. Create `.../actions-page.html` — the three groups + the unplaced section. Buttons disable on
   `sync.running()` (or the relevant in-flight signal); `agoLabel(...)` renders the last-sync time.
3. Create `.../actions-page.scss`.

## Code
### `src/app/features/actions/actions-page/actions-page.ts`
```ts
import { afterNextRender, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { GeoData } from '../../../core/geo/geo-data';
import { Country } from '../../../core/models/country';
import { BootSync } from '../../../core/pipeline/boot-sync';
import { PlaylistIndex } from '../../../core/pipeline/playlist-index';
import { GlobeStore } from '../../globe/globe-store';
import { UnplacedArtists } from '../../globe/unplaced-artists/unplaced-artists';

/**
 * Data management page: per-domain reload of the three datasets that feed the app — Liked Songs,
 * playlists, artist info — each with a cheap "Check for updates" (diff only) and a "Full re-scan"
 * (re-fetch from scratch), plus the couldn't-place list. The globe view stays a pure visualization;
 * every control lives here. (The whole-dataset wipe + export/import land with the M11 settings.)
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

    <!-- Clear-all-data + export/import land with the M11 settings panel. // grows in M11 -->
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

### `src/app/features/actions/actions-page/actions-page.scss`
```scss
:host {
  display: block;
  height: 100%;
  overflow-y: auto;
}

.actions {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.head {
  h1 {
    margin: 0;
    font-size: 1.6rem;
  }

  .sub {
    margin: 0.25rem 0 0;
    max-width: 44rem;
    opacity: 0.7;
  }
}

// The groups sit side by side on a wide screen, stacking on a narrow one.
.groups {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
  gap: 1.5rem;
  align-items: start;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.group-title {
  margin: 0;
  font-size: 1.15rem;
}

.group-sub {
  margin: 0;
  opacity: 0.7;
  font: var(--mat-sys-body-small);
}

// No box — just the status line and the refresh buttons.
.panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.status {
  margin: 0;
  font: var(--mat-sys-body-medium);
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-self: flex-start;
}

.unplaced-head {
  display: flex;
  justify-content: flex-end;
}

.unplaced {
  display: block;
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — the page resolves `BootSync`,
      `PlaylistIndex`, `GlobeStore`, `GeoData`, and `UnplacedArtists`.
- [ ] After routing is wired (step 13): navigate to `/actions` → three groups (Liked Songs, Playlists, Artist
      info), each with a status line + **Check for updates** / **Full re-scan**; clicking **Full re-scan** (Liked
      Songs) starts a scan (the globe fills once you switch back).

## If it breaks
- **`No provider for BootSync`/`PlaylistIndex`** → both are `providedIn: 'root'` (steps 06 / 03); check import
  paths.
- **`library.playlistsBuilding is not a function`** → you pasted the source, which reads a `LibraryStore` (M10);
  M9 reads `playlists.building()` / `playlists.progress()` from `PlaylistIndex` directly.
- **Compile error on `DataTransfer` / `Confirm`** → those back the M11 "Clear all data" control, deliberately not
  in the M9 page — remove any leftover import.

---
> Nav: [← Wire filters into the globe page](11_globe-page-wiring.md) · [Overview](00_overview.md) · [Header nav + routes →](13_header-routes.md)
