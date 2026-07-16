# M11 · Step 08 of 10 — View-options: a "Save image" action
> Nav: [← Host the panel + wire the globe page](07_globe-page-settings.md) · [Overview](00_overview.md) · [Actions "Clear all data" →](09_actions-clear-data.md)

> **This step touches 2 files, committed together:** `features/globe/view-options/view-options.ts` (one output)
> + `.html` (one button). The `.scss` is unchanged.

## Why / design
`ViewOptions` stays **dumb** — it only emits; the globe page (step 07) owns `saveImage()` and does the actual
snapshot + download. So this is the smallest possible edit: add a `saveImage` output and a **Save image** button
in the panel. M9 left the doc comment `// Grows in M11 (a "save image" action)` here as the marker for exactly
this change; it's now done, so drop that note.

The button lands between the overlay toggles and **Hide all**, using a `photo_camera` icon so it reads as a
capture action, not a toggle.

## Do this
1. In `src/app/features/globe/view-options/view-options.ts`, add `readonly saveImage = output<void>();` (next to
   `hideAll`) and remove the "Grows in M11" line from the class doc comment. Everything else is unchanged from M9.
2. In `.../view-options.html`, add the **Save image** button just above the **Hide all** button.

## Code
### `src/app/features/globe/view-options/view-options.ts`
```ts
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

/**
 * Pinned control to toggle which globe overlays are visible — and hide them all at once for a
 * globe-only view, or save the current globe as an image. Dumb: inputs/outputs only; the page owns
 * and persists the state and performs the snapshot. The open/closed state of its little panel is
 * purely local view state.
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
  /** User asked to download the current globe view as an image. */
  readonly saveImage = output<void>();

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
    <button mat-stroked-button class="save-image" (click)="saveImage.emit()">
      <mat-icon>photo_camera</mat-icon>
      Save image
    </button>
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
- [ ] `npm run build` → clean.
- [ ] Open `/globe` → open the visibility fab (bottom-right) → a **Save image** button now sits above **Hide
      all**; clicking it downloads `earthviewmusic-<date>.png` that opens to the current globe on a solid space
      background (not blank/transparent).

## If it breaks
- **`saveImage` isn't a known output on `app-view-options`** → the `(saveImage)="saveImage()"` binding (step 07)
  was added but this `output<void>()` wasn't — add it here.
- **PNG is blank/transparent** → the renderer's `preserveDrawingBuffer` (step 03) or `captureImage`'s solid-fill
  paint is missing — the page/canvas capture path is fine; the fix is in `globe-renderer.ts`.
- **Nothing downloads** → `saveImage()` on the page returned early because `canvas()?.capture()` was `null` (not
  on the globe phase / renderer not ready) — you must be on `/globe` with the globe visible.

---
> Nav: [← Host the panel + wire the globe page](07_globe-page-settings.md) · [Overview](00_overview.md) · [Actions "Clear all data" →](09_actions-clear-data.md)
