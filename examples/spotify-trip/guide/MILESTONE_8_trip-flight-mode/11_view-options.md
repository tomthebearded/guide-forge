# M8 · Step 11 of 12 — `ViewOptions` toggle panel
> Nav: [← Persist the overlay prefs](10_view-prefs-cache.md) · [Overview](00_overview.md) · [Wire it into the globe page →](12_globe-page-wiring.md)

This step touches **3 files, committed together**: `view-options.ts` + `.html` + `.scss`.

## Why / design
A pinned mini-fab in the corner that opens a little panel of slide-toggles — one per overlay — plus a **Hide
all** button for a bare-globe view. It's **dumb**: `input()` the current visibilities, `output()` a change per
toggle; the page owns and persists the state (steps 10, 12). The panel's own open/closed state is purely local
view state (a `signal`), not persisted.

M8 exposes the **five** M8 overlays: leaderboards, heat legend, flight, trip log, journey passport. The
**Heat filters** + **Timeline** toggles arrive in M9 (with those overlays), and the **Save image** button in M11
(with `captureImage`) — so this component **grows in M9 and M11**. Adding them now would import components that
don't exist yet, so they're deferred.

Uses Material's `MatSlideToggleModule` (a labelled on/off switch), `MatButtonModule` (the fab + hide-all), and
`MatIconModule`.

## Do this
1. Create `src/app/features/globe/view-options/view-options.ts` — five boolean `input()`s, five `output<boolean>()`
   toggles, a `hideAll` `output<void>()`, and a local `open` signal.
2. Create `view-options.html` — the fab + (when open) the panel of toggles + Hide all.
3. Create `view-options.scss` — the pinned column styling.

## Code
### `src/app/features/globe/view-options/view-options.ts`
```ts
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

/**
 * Pinned control to toggle which globe overlays are visible — and hide them all at once for a
 * globe-only view. Dumb: inputs/outputs only; the page owns and persists the state. The open/closed
 * state of its little panel is purely local view state. Grows in M9 (filters + timeline toggles) and
 * M11 (a "save image" action).
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

  readonly toggleStats = output<boolean>();
  readonly toggleLegend = output<boolean>();
  readonly toggleFlight = output<boolean>();
  readonly toggleTripLog = output<boolean>();
  readonly toggleJourney = output<boolean>();
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

### `src/app/features/globe/view-options/view-options.scss`
```scss
:host {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--space-surface) 90%, transparent);
  border: 1px solid color-mix(in srgb, var(--neon-teal) 25%, transparent);
  backdrop-filter: blur(8px);
  box-shadow: var(--glow-shadow);
}

.hide-all {
  margin-top: 0.25rem;
}

.trigger {
  box-shadow: var(--glow-shadow);
}
```

## Done when (this step)
- [ ] `npm run build` clean. The fab compiles (wired to the page next step).
- [ ] Rendered later: clicking the fab opens a panel with **five** toggles + **Hide all**; each toggle reflects
      its bound input.

## If it breaks
- **`mat-slide-toggle` unknown element** → `MatSlideToggleModule` missing from `imports`.
- **Toggling does nothing** → the outputs aren't wired on the page yet (step 12); this component only *emits*.
- **A "Heat filters"/"Timeline"/"Save image" control is missing** → intentional; those land in M9/M11.
