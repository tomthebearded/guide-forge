# M6 · Step 06 of 11 — The `scan-list` reveal (phase-gated)
> Nav: [← log-terminal](05_log-terminal.md) · [Overview](00_overview.md) · [globe-store grow →](07_globe-store-grow.md)

This step touches **3 files, committed together**: `scan-list.ts`, `.html`, `.scss`.

## Why / design
`scan-list` is a full-screen "scan → place" experience: during `'scanning'` it shows the artist list growing;
during `'placing'` it walks the list top-to-bottom, revealing one flag at a time and fading each matched row
out, then emits `done` so the page can switch to the globe.

> ⚠️ **This component is dormant in M6 — and that's intended.** The Liked-Songs source keeps `GlobePhase` on
> `'globe'` the entire time (it never flips to `'scanning'`/`'placing'`), so `scan-list`'s `@else` branch on the
> page (step 10) never renders. We port it **faithfully** because it's part of the globe feature and the page
> wiring references it, but the *live-progress* requirement is met by the [log-terminal](05_log-terminal.md),
> not this. Don't try to "fix" it into showing — the phase gate is the design.

Its animation state (`revealed` / `fading` / `faded` sets) is **local, view-only** signal state driven by a
`setInterval` ticker — a good example of a dumb component owning throwaway UI state without touching the store.

## Do this
1. Create `src/app/features/globe/scan-list/` and the three files below.
2. Import `CountryFlag`, `ArtistOrigin`, and the `GlobePhase` type from `../globe-store` (defined in M5).
3. The three timing constants (`REVEAL_STAGGER_MS`, `FLAG_LINGER_MS`, `FADE_MS`) are cosmetic animation
   tuning — any similar values work; we use the source's `100` / `500` / `400`.
4. The ticker is cleared on destroy via `inject(DestroyRef).onDestroy(...)` — keep it, or the interval leaks
   after navigation.
5. `done` is an `output<void>()`; the page binds it to `store.showGlobe()` (added next step). Because the phase
   never leaves `'globe'`, it won't actually fire in M6 — but the wiring must compile.

## Code
### `src/app/features/globe/scan-list/scan-list.ts`
```ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { ArtistOrigin } from '../../../core/models/artist-origin';
import { CountryFlag } from '../country-flag/country-flag';
import { GlobePhase } from '../globe-store';

const REVEAL_STAGGER_MS = 100;
const FLAG_LINGER_MS = 500;
const FADE_MS = 400;

/**
 * The scan→place center experience. During 'scanning' it shows the artist list growing; during
 * 'placing' it walks the list top-to-bottom revealing one flag at a time, then fades each matched
 * row out 0.5s later. Emits `done` once resolution has finished and every matched row has faded —
 * the page then switches to the globe. Animation state is local (view-only).
 */
@Component({
  selector: 'app-scan-list',
  imports: [CountryFlag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scan-list.html',
  styleUrl: './scan-list.scss',
})
export class ScanList {
  readonly artists = input<ArtistOrigin[]>([]);
  readonly phase = input<GlobePhase>('scanning');
  readonly resolving = input(false);
  readonly done = output<void>();

  protected readonly revealed = signal<ReadonlySet<string>>(new Set());
  protected readonly fading = signal<ReadonlySet<string>>(new Set());
  private readonly faded = signal<ReadonlySet<string>>(new Set());

  /** Rows still on screen: matched rows leave once faded; failed rows move to the unplaced table. */
  protected readonly visible = computed(() =>
    this.artists().filter((a) => !a.failed && !this.faded().has(a.id)),
  );

  private emitted = false;

  constructor() {
    const ticker = setInterval(() => this.tick(), REVEAL_STAGGER_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(ticker));
  }

  private tick(): void {
    if (this.phase() !== 'placing') {
      return;
    }
    const revealed = this.revealed();
    const faded = this.faded();
    const next = this.artists().find(
      (a) => a.countryCode !== null && !revealed.has(a.id) && !faded.has(a.id),
    );
    if (next !== undefined) {
      this.reveal(next.id);
      return;
    }
    // Nothing to reveal now → done once resolution is finished and every matched row has faded.
    const allMatchedFaded = this.artists().every(
      (a) => a.countryCode === null || this.faded().has(a.id),
    );
    if (!this.emitted && !this.resolving() && allMatchedFaded) {
      this.emitted = true;
      this.done.emit();
    }
  }

  private reveal(id: string): void {
    this.revealed.update((set) => new Set(set).add(id));
    setTimeout(() => this.fading.update((set) => new Set(set).add(id)), FLAG_LINGER_MS);
    setTimeout(() => this.faded.update((set) => new Set(set).add(id)), FLAG_LINGER_MS + FADE_MS);
  }
}
```

### `src/app/features/globe/scan-list/scan-list.html`
```html
<section class="scan">
  <h2 class="status">
    @if (phase() === 'scanning') {
      Retrieving your library from Spotify…
    } @else {
      Finding where they're from…
    }
  </h2>
  <p class="count">{{ visible().length }} artists</p>

  <ul class="list">
    @for (artist of visible(); track artist.id) {
      <li class="row" [class.fading]="fading().has(artist.id)">
        <span class="name">{{ artist.name }}</span>
        @if (revealed().has(artist.id) && artist.countryCode; as code) {
          <app-country-flag [code]="code" />
        } @else if (!artist.tried) {
          <span class="pending">…</span>
        }
      </li>
    }
  </ul>
</section>
```

### `src/app/features/globe/scan-list/scan-list.scss`
```scss
.scan {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  height: 100%;
  padding: 2rem 1rem;
  box-sizing: border-box;
}

.status {
  margin: 0;
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  color: var(--neon-teal);
  text-shadow: var(--glow-shadow);
  text-align: center;
}

.count {
  margin: 0;
  font: var(--mat-sys-body-small);
  color: var(--mat-sys-on-surface-variant);
}

.list {
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
  width: min(28rem, 90vw);
  flex: 1;
  overflow-y: auto;
  // Fade the top/bottom edges so the scrolling list melts into the space backdrop.
  mask-image: linear-gradient(to bottom, transparent, #000 8%, #000 92%, transparent);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid color-mix(in srgb, var(--neon-teal) 8%, transparent);
  transition:
    opacity 400ms ease,
    transform 400ms ease;
}

.row.fading {
  opacity: 0;
  transform: translateX(12px);
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pending {
  color: var(--mat-sys-on-surface-variant);
  opacity: 0.6;
}

app-country-flag {
  animation: flag-in 250ms ease;
}

@keyframes flag-in {
  from {
    opacity: 0;
    transform: scale(0.7);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

## Done when (this step)
- [ ] `npm run build` → compiles clean (the `GlobePhase` import from `../globe-store` resolves).
- [ ] After step 10, the component exists and is imported by the page but is **not visible** while the phase
      stays `'globe'` — this is correct. (You can prove it's wired by confirming no unused-import lint error.)

## If it breaks
- **`'GlobePhase' has no exported member`** → it's exported from `globe-store.ts` since M5; check the import
  path `../globe-store`.
- **A leaked interval warning after navigating away** → the `DestroyRef.onDestroy(clearInterval)` was dropped;
  restore it.
