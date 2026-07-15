# M9 · Step 09 of 14 — The timeline scrubber
> Nav: [← The release-era filter](08_era-filter.md) · [Overview](00_overview.md) · [View prefs + toggles →](10_view-prefs-toggles.md)

> **This step touches 3 files, committed together:** `features/globe/timeline-scrubber/timeline-scrubber.ts` +
> `.html` + `.scss` — a Material slider + play button that replays the map's fill-in over the months.

## Glossary for this step
> **as-of month** — a `'YYYY-MM'` upper bound on liked-track `added_at`. Feeding it to `store.setAsOfMonth`
> makes the heat show only the music you'd liked *through* that month — the other **temporal filter**.
> **`linkedSignal`** — an Angular signal whose value is *derived* from a source but is still independently
> writable, and which **re-derives (resets) when the source changes**. Here the cursor defaults to "Now" and
> snaps back to "Now" whenever the month list changes (e.g. a rescan adds months), so it never strands the heat
> on a stale slice. See [angular.dev/guide/signals/linked-signal](https://angular.dev/guide/signals/linked-signal).

## Why / design
The scrubber slides across the dataset's liked-song months (`store.timelineMonths()`), emitting the chosen
`'YYYY-MM'` — or `null` at the top stop ("Now" = the live whole-library view). It owns only view state: the
cursor position and whether the fill-in animation is playing. The page feeds `monthChange` to
`store.setAsOfMonth`.

The cursor is a `linkedSignal(() => this.max())` — it *defaults* to the top (Now) and, because a `linkedSignal`
re-derives when its source changes, it **snaps back to Now** whenever the month list grows (a new scan). Play
walks the cursor forward one month per `STEP_MS` (650 ms), stopping at Now.

**Recurring model:** dumb + signal I/O. The interval timer is cleared on destroy via `DestroyRef.onDestroy` —
the same leak-avoidance pattern the scan-list used in M6.

## Do this
1. Create the three `timeline-scrubber` files. `months` is the ordered list from `store.timelineMonths()`;
   `monthChange` emits `string | null`.
2. `discrete [displayWith]="display"` gives the slider thumb a tooltip showing the month (or "Now" at the top).
3. The play button is disabled when there are fewer than 2 months (nothing to animate).

## Code
### `src/app/features/globe/timeline-scrubber/timeline-scrubber.ts`
```ts
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** Milliseconds each month holds while the fill-in animation plays. */
const STEP_MS = 650;

/**
 * Bottom-centre control that replays how the globe filled in over time. Slides across the dataset's
 * liked-song months; the last stop is "Now" (the live, whole-library view). Dumb: it owns only the
 * cursor + play state and emits the chosen `'YYYY-MM'` (or null at "Now") for the page to feed the
 * store's as-of filter.
 */
@Component({
  selector: 'app-timeline-scrubber',
  imports: [MatSliderModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './timeline-scrubber.html',
  styleUrl: './timeline-scrubber.scss',
})
export class TimelineScrubber {
  readonly months = input<readonly string[]>([]);
  /** Emits the as-of month, or null when the cursor rests at "Now" (live whole-library view). */
  readonly monthChange = output<string | null>();

  /** Top index (= "Now"). */
  protected readonly max = computed(() => Math.max(0, this.months().length - 1));
  /**
   * Cursor position. Defaults to "Now" and snaps back there whenever the month list changes (e.g. a
   * rescan adds months), so the scrubber never strands the heat on a stale slice.
   */
  protected readonly index = linkedSignal(() => this.max());
  protected readonly atNow = computed(() => this.index() >= this.max());

  private readonly playing = signal(false);
  protected readonly isPlaying = this.playing.asReadonly();
  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly label = computed(() =>
    this.atNow() ? 'Now' : formatMonth(this.months()[this.index()] ?? ''),
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  /** Slider tooltip label for a given step. */
  protected readonly display = (value: number): string =>
    value >= this.max() ? 'Now' : formatMonth(this.months()[value] ?? '');

  protected onSlider(value: number): void {
    this.stop();
    this.setIndex(value);
  }

  /** Play/pause the fill-in animation. Play from the start again if the cursor sits at "Now". */
  protected togglePlay(): void {
    if (this.playing()) {
      this.stop();
      return;
    }
    if (this.months().length < 2) {
      return;
    }
    if (this.atNow()) {
      this.setIndex(0);
    }
    this.playing.set(true);
    this.timer = setInterval(() => {
      const next = this.index() + 1;
      this.setIndex(next);
      if (next >= this.max()) {
        this.stop();
      }
    }, STEP_MS);
  }

  private stop(): void {
    this.playing.set(false);
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private setIndex(value: number): void {
    const clamped = Math.max(0, Math.min(this.max(), value));
    this.index.set(clamped);
    this.monthChange.emit(clamped >= this.max() ? null : (this.months()[clamped] ?? null));
  }
}

/** `'2024-03'` → `'Mar 2024'`. */
function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  const name = MONTH_NAMES[Number(m) - 1];
  return name && year ? `${name} ${year}` : month;
}
```

### `src/app/features/globe/timeline-scrubber/timeline-scrubber.html`
```html
<button
  mat-icon-button
  class="play"
  (click)="togglePlay()"
  [disabled]="months().length < 2"
  [attr.aria-label]="isPlaying() ? 'Pause fill-in replay' : 'Play fill-in replay'"
>
  <mat-icon>{{ isPlaying() ? 'pause' : 'play_arrow' }}</mat-icon>
</button>

<mat-slider class="track" [min]="0" [max]="max()" [step]="1" discrete [displayWith]="display">
  <input
    matSliderThumb
    aria-label="Liked-songs month"
    [value]="index()"
    (valueChange)="onSlider($event)"
  />
</mat-slider>

<span class="label">{{ label() }}</span>
```

### `src/app/features/globe/timeline-scrubber/timeline-scrubber.scss`
```scss
:host {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 1rem 0.25rem 0.5rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--space-surface) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--neon-teal) 25%, transparent);
  backdrop-filter: blur(8px);
  box-shadow: var(--glow-shadow);
}

.track {
  // Fill the panel so the months spread across a comfortable scrub distance.
  width: min(60vw, 32rem);
}

.label {
  min-width: 4.5rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--neon-teal);
  white-space: nowrap;
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — `linkedSignal` (Angular 21) and
      `MatSliderModule` resolve.
- [ ] No consumer yet (wired in step 11). Rendered proof — dragging the slider back shows the globe as-of a
      month (label e.g. `Mar 2024`), play animates it forward, the right end reads `Now` — is in
      [step 15](15_verify.md).

## If it breaks
- **`linkedSignal is not exported from '@angular/core'`** → it requires Angular ≥ 19; you're pinned to 21.2 so
  it's available — check the import isn't from a submodule.
- **Slider thumb won't move** → the `matSliderThumb` `<input>` must be a child of `<mat-slider>`, with `[value]`
  bound and `(valueChange)` wired; a bare `<mat-slider>` renders but does nothing.
- **Cursor doesn't reset after a rescan** → `index` must be a `linkedSignal(() => this.max())`, not a plain
  `signal(0)` — the linked form is what re-derives when `months` grows.
