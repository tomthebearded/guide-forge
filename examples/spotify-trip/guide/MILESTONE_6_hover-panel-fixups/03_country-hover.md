# M6 · Step 03 of 11 — The `country-hover` card
> Nav: [← heat-legend](02_heat-legend.md) · [Overview](00_overview.md) · [country-stats →](04_country-stats.md)

This step touches **3 files, committed together**: `country-hover.ts`, `.html`, `.scss`.

## Glossary for this step
> **`RouterLink`** — Angular's directive for in-app navigation (`[routerLink]="['/path', id]"`); it renders an
> `<a href>` and navigates without a full page reload. See the [Angular router docs](https://angular.dev/guide/routing).

## Why / design
This is the card that appears when you hover a coloured country: its flag, its name, and a ranked, scrollable
list of **the artists you like from there** with per-artist liked-track counts, plus a one-line footer
(`N artists · N tracks · N h`). It is the milestone's headline read-only view.

**REST Countries is descoped.** The plan's placeholder said the card would show "REST-Countries facts." The
source app never built that client, so neither do we: the card reads **only** data the app already has — the
flag (flagcdn, step 01), the country name (from `GeoData`, passed in by the page), and per-country counts (from
the store's aggregates). See [decision-log D7](../foundation/decision-log.md#d7--hover-card-is-descoped-to-match-the-code-no-rest-countries).

> **Mental model — dumb child, smart page.** This component injects **nothing**. It takes three
> `input.required`s (`countryCode`, `countryName`, `artists`) and derives its two summary numbers with
> `computed()`. The smart `GlobePage` (step 10) owns the `GlobeStore`, decides *which* country is hovered, and
> hands this component the pre-sorted artist list for that country. Every component in this milestone follows
> this shape — the page is the only thing that talks to the store.

The `artists` list is pre-sorted by `trackCount` descending **by the store** (M5's `artistsByCountry`
aggregate already sorts each country's list), so the card just renders it in order.

## Do this
1. Create `src/app/features/globe/country-hover/` and the three files below.
2. Import `CountryFlag` (step 01) and `RouterLink` in the component's `imports` array.
3. `totalTracks` and `totalHours` are `computed()` from the `artists` input — `totalHours` divides Σ
   `durationMs` by `3_600_000` (ms per hour) and rounds. These are display-only sums; the mandatory contract is
   just that they read the same `artists` array the page passed.
4. Each artist row links **two** ways: an in-app `[routerLink]="['/library/artist', artist.id]"` on the name,
   and an external `https://open.spotify.com/artist/<id>` icon link (`target="_blank" rel="noopener
   noreferrer"`). Both are ported faithfully from the source.

> ⚠️ **Load-bearing flag — the `/library/artist/:id` route does not exist until M10.** `RouterLink` compiles
> and renders fine now, but clicking an artist name currently navigates nowhere (the router logs an "no routes
> matched" warning). That is expected in M6; the library feature arrives in M10. The **Spotify** external link
> works today. Leave the `routerLink` in — removing it would diverge from the source and you'd re-add it in M10.

5. The `.card` styles set their **own** pastel `--card-*` custom properties (a light card on the dark globe),
   deliberately overriding the theme — keep them. `--artists-max` (set per-hover by the page in step 10) caps
   the scroll list height; it falls back to `15rem` when unset.

## Code
### `src/app/features/globe/country-hover/country-hover.ts`
```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ArtistOrigin } from '../../../core/models/artist-origin';
import { CountryFlag } from '../country-flag/country-flag';

/**
 * Hover card for the focused country: its flag + name, every resolved artist (sorted by liked-track
 * count, scrollable when long) linking to its in-app artist page with a Spotify shortcut beside the
 * name, and a summary. Dumb: inputs only; the page feeds it the hovered country's pre-sorted artist
 * list and anchors it to the cursor.
 */
@Component({
  selector: 'app-country-hover',
  imports: [CountryFlag, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './country-hover.html',
  styleUrl: './country-hover.scss',
})
export class CountryHover {
  readonly countryCode = input.required<string>();
  readonly countryName = input.required<string>();
  /** All resolved artists from this country, sorted by trackCount descending. */
  readonly artists = input.required<ArtistOrigin[]>();

  protected readonly totalTracks = computed(() =>
    this.artists().reduce((sum, artist) => sum + artist.trackCount, 0),
  );

  /** Whole hours of liked music from this country (Σ track runtime, rounded). */
  protected readonly totalHours = computed(() =>
    Math.round(this.artists().reduce((sum, artist) => sum + artist.durationMs, 0) / 3_600_000),
  );

  /** Public Spotify artist page for a Spotify artist id. */
  protected artistUrl(id: string): string {
    return `https://open.spotify.com/artist/${id}`;
  }
}
```

### `src/app/features/globe/country-hover/country-hover.html`
```html
<div class="card">
  <header class="head">
    <app-country-flag [code]="countryCode()" />
    <h2 class="country">{{ countryName() }}</h2>
  </header>
  <ol class="artists">
    @for (artist of artists(); track artist.id) {
      <li class="row">
        <span class="rank">{{ $index + 1 }}</span>
        <a class="name" [routerLink]="['/library/artist', artist.id]" [title]="artist.name">
          {{ artist.name }}
        </a>
        <a
          class="spotify"
          [href]="artistUrl(artist.id)"
          target="_blank"
          rel="noopener noreferrer"
          [attr.aria-label]="'Open ' + artist.name + ' on Spotify'"
          title="Open on Spotify"
        >
          <svg class="spotify-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"
            />
          </svg>
        </a>
        <span class="count">{{ artist.trackCount }}<span class="unit">♪</span></span>
      </li>
    }
  </ol>
  <p class="summary">
    {{ artists().length }} artists · {{ totalTracks() }} liked tracks · {{ totalHours() }} h
  </p>
</div>
```

### `src/app/features/globe/country-hover/country-hover.scss`
```scss
:host {
  display: block;
  // Light pastel card (blue + grey), so its own slate-on-pale palette overrides the dark theme.
  --card-bg: #dbe7f1; // pastel light blue
  --card-border: #9bb8d2; // soft azure-grey
  --card-ink: #3a4654; // pastel slate — primary text
  --card-ink-soft: #6b7886; // muted grey — secondary text
  --card-accent: #3f6e93; // muted blue — counts / name
}

.card {
  width: min(22rem, 85vw);
  padding: 0.9rem 1.25rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--card-bg) 92%, transparent);
  border: 1px solid color-mix(in srgb, var(--card-border) 70%, transparent);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 12px rgb(0 0 0 / 25%);
  color: var(--card-ink);
}

.head {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin-bottom: 0.6rem;
}

.country {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--card-accent);
}

.artists {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  // Grow to fill the free space the page measured on the card's side (`--artists-max`, set per
  // hover); only scroll when the list still outgrows it. Falls back to a fixed cap if unset.
  max-height: var(--artists-max, 15rem);
  overflow-y: auto;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.rank {
  width: 1.2rem;
  text-align: center;
  color: var(--card-ink-soft);
  font-variant-numeric: tabular-nums;
}

.name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--card-ink);
  text-decoration: none;
}

.name:hover,
.name:focus-visible {
  color: var(--card-accent);
  text-decoration: underline;
}

.spotify {
  display: inline-flex;
  flex: none;
  color: #1db954; // Spotify green
  opacity: 0.85;
  transition: opacity 0.15s ease;
}

.spotify:hover,
.spotify:focus-visible {
  opacity: 1;
}

.spotify-icon {
  width: 1rem;
  height: 1rem;
  fill: currentColor;
}

.count {
  color: var(--card-accent);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.unit {
  margin-left: 0.15rem;
  font-weight: 400;
  opacity: 0.7;
}

.summary {
  margin: 0.6rem 0 0;
  font: var(--mat-sys-body-small);
  color: var(--card-ink-soft);
  text-align: center;
}
```

## Done when (this step)
- [ ] `npm run build` → compiles clean (no unresolved `RouterLink` or `ArtistOrigin` import).
- [ ] Once wired (step 10), hovering a coloured country shows a pastel card: flag + country name at the top, a
      ranked artist list (`1 <name> ♫ 42♪`), and a footer `12 artists · 240 liked tracks · 63 h`.

## If it breaks
- **`NG04002: Cannot match any routes` in the console when you click an artist name** → expected in M6; the
  `/library/artist/:id` route lands in M10. Not a bug.
- **Card renders but flags are missing** → `CountryFlag` isn't in `imports`, or the code is invalid — see
  step 01.
- **List never scrolls even when long** → `--artists-max` is being set to a huge value by the page; that's the
  step-10 anchoring logic, not this component.
