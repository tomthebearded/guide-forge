# M9 · Step 10 of 14 — View prefs + view-options: filters & timeline toggles
> Nav: [← The timeline scrubber](09_timeline-scrubber.md) · [Overview](00_overview.md) · [Wire filters into the globe page →](11_globe-page-wiring.md)

> **This step touches 3 files, committed together:** `core/cache/view-prefs-cache.ts` (add two fields),
> `features/globe/view-options/view-options.ts` and `.html` (add two toggles). The `.scss` is unchanged.

## Why / design
M8 gave the globe five persisted overlay toggles (leaderboards, legend, flight, trip log, journey passport).
M9 adds two more — **Heat filters** (the genre + era bar) and **Timeline** (the scrubber) — following the exact
same pattern ([decision-log D5](../foundation/decision-log.md#d5--likedindex-is-a-byproduct-of-the-globe-scan-tripexplore-are-overlay-toggles): overlays are independent persisted toggles, not a mode). Two edits:

1. **`ViewPrefs`** gains `showFilters` + `showTimeline` booleans (defaulting `true`). Because `load()` merges
   over `DEFAULTS`, a prefs blob saved by M8 (before these fields existed) keeps its other choices and simply
   picks up the new defaults — no migration needed.
2. **`ViewOptions`** gains the two `input`s + two `output`s and a slide toggle each in the panel.

> **Scope note:** the source `view-options` also has a "Save image" action. That needs the M11 canvas-capture +
> settings palette, so it's **deferred to M11** — M9 adds only the filters + timeline toggles. `// grows in M11`

## Do this
1. In `src/app/core/cache/view-prefs-cache.ts`, add `showFilters` + `showTimeline` to the `ViewPrefs` interface
   and to `DEFAULTS` (both `true`). Leave the `isViewPrefs` validator as-is — the merge-over-defaults handles
   the new fields.
2. In `src/app/features/globe/view-options/view-options.ts`, add `showFilters`/`showTimeline` inputs and
   `toggleFilters`/`toggleTimeline` outputs.
3. In `.../view-options.html`, add a **Heat filters** and a **Timeline** slide toggle to the panel.

## Code
### `src/app/core/cache/view-prefs-cache.ts`
```ts
import { Injectable } from '@angular/core';

import { readJson, writeJson } from './storage-cache';

const STORAGE_KEY = 'evm.viewPrefs';

/** Which globe overlays the user has chosen to show. Persisted across reloads. */
export interface ViewPrefs {
  showStats: boolean;
  showLegend: boolean;
  /** The flight overlay (plane + route arc + country highlight + follow camera). */
  showFlight: boolean;
  showTripLog: boolean;
  showJourney: boolean;
  /** The heat-filter bar (genre picker + release-era chips). */
  showFilters: boolean;
  /** The timeline scrubber (replays the map's fill-in over time). */
  showTimeline: boolean;
}

const DEFAULTS: ViewPrefs = {
  showStats: true,
  showLegend: true,
  showFlight: true,
  showTripLog: true,
  showJourney: true,
  showFilters: true,
  showTimeline: true,
};

/** Persists the globe view's overlay-visibility preferences to localStorage. */
@Injectable({ providedIn: 'root' })
export class ViewPrefsCache {
  load(): ViewPrefs {
    // Merge over defaults so prefs saved before a field existed keep their other choices.
    return readJson(
      STORAGE_KEY,
      (parsed) => (isViewPrefs(parsed) ? { ...DEFAULTS, ...parsed } : undefined),
      { ...DEFAULTS },
    );
  }

  save(prefs: ViewPrefs): void {
    writeJson(STORAGE_KEY, prefs);
  }
}

function isViewPrefs(value: unknown): value is ViewPrefs {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['showStats'] === 'boolean' && typeof candidate['showLegend'] === 'boolean'
  );
}
```

### `src/app/features/globe/view-options/view-options.ts`
```ts
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

/**
 * Pinned control to toggle which globe overlays are visible — and hide them all at once for a
 * globe-only view. Dumb: inputs/outputs only; the page owns and persists the state. The open/closed
 * state of its little panel is purely local view state. Grows in M11 (a "save image" action).
 */
@Component({
  selector: 'app-view-options',
  imports: [MatButtonModule, MatIconModule, MatSlideToggleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './view-options.html',
  styleUrl: './view-options.scss',
})
export class ViewOptions {
  readonly showStats = input(true);
  readonly showLegend = input(true);
  readonly showFlight = input(true);
  readonly showTripLog = input(true);
  readonly showJourney = input(true);
  readonly showFilters = input(true);
  readonly showTimeline = input(true);

  readonly toggleStats = output<boolean>();
  readonly toggleLegend = output<boolean>();
  readonly toggleFlight = output<boolean>();
  readonly toggleTripLog = output<boolean>();
  readonly toggleJourney = output<boolean>();
  readonly toggleFilters = output<boolean>();
  readonly toggleTimeline = output<boolean>();
  readonly hideAll = output<void>();

  protected readonly open = signal(false);
}
```

### `src/app/features/globe/view-options/view-options.html`
```html
@if (open()) {
  <div class="panel">
    <mat-slide-toggle [checked]="showStats()" (change)="toggleStats.emit($event.checked)">
      Leaderboards
    </mat-slide-toggle>
    <mat-slide-toggle [checked]="showLegend()" (change)="toggleLegend.emit($event.checked)">
      Heat legend
    </mat-slide-toggle>
    <mat-slide-toggle [checked]="showFlight()" (change)="toggleFlight.emit($event.checked)">
      Flight (plane &amp; route)
    </mat-slide-toggle>
    <mat-slide-toggle [checked]="showTripLog()" (change)="toggleTripLog.emit($event.checked)">
      Trip log
    </mat-slide-toggle>
    <mat-slide-toggle [checked]="showJourney()" (change)="toggleJourney.emit($event.checked)">
      Journey passport
    </mat-slide-toggle>
    <mat-slide-toggle [checked]="showFilters()" (change)="toggleFilters.emit($event.checked)">
      Heat filters
    </mat-slide-toggle>
    <mat-slide-toggle [checked]="showTimeline()" (change)="toggleTimeline.emit($event.checked)">
      Timeline
    </mat-slide-toggle>
    <button mat-stroked-button class="hide-all" (click)="hideAll.emit()">
      <mat-icon>visibility_off</mat-icon>
      Hide all
    </button>
  </div>
}

<button
  mat-mini-fab
  class="trigger"
  (click)="open.set(!open())"
  [attr.aria-label]="open() ? 'Close overlay options' : 'Show or hide globe overlays'"
>
  <mat-icon>{{ open() ? 'close' : 'visibility' }}</mat-icon>
</button>
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors.
- [ ] After step 11 wires it: open the view-options fab (bottom-right) → the panel now lists **Heat filters** and
      **Timeline** toggles beneath the M8 five; flipping one and reloading keeps the choice
      (`JSON.parse(localStorage['evm.viewPrefs'])` shows `showFilters`/`showTimeline`).

## If it breaks
- **`showFilters`/`showTimeline` are `undefined` after reload** → `load()` must spread `{ ...DEFAULTS, ...parsed }`
  so a pre-M9 blob gains the new defaults; without the spread, missing fields stay `undefined`.
- **The two new toggles don't appear** → the `.html` panel edits didn't land, or `MatSlideToggleModule` was
  dropped from `imports`.

---
> Nav: [← The timeline scrubber](09_timeline-scrubber.md) · [Overview](00_overview.md) · [Wire filters into the globe page →](11_globe-page-wiring.md)
