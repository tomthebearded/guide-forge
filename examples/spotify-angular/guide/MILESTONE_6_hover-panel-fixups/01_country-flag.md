# M6 · Step 01 of 11 — The `country-flag` component (flagcdn)
> Nav: — · [Overview](00_overview.md) · [heat-legend →](02_heat-legend.md)

This step touches **3 files, committed together**: `country-flag.ts`, `.html`, `.scss` (separate template +
styles per [conventions](../foundation/conventions.md#language--framework-specifics-angular-21-zoneless)).

## Glossary for this step
> **flagcdn** — a free CDN that serves country flag images by ISO 3166-1 alpha-2 code (e.g.
> `https://flagcdn.com/w40/us.png`). No key, no client needed — just an `<img>` `src`. See the [flagcdn site](https://flagcdn.com).
> **dumb (presentational) component** — a component with only `input()`s in and `output()`s out and **no** store/service injection; the smart page owns the data. The recurring pattern for every component in this milestone ([conventions](../foundation/conventions.md#structure--architecture-feature-first)).

## Why / design
Four panels in this milestone show a flag beside a country — the hover card, both leaderboard columns, the
picker, and (dormant) the scan list. Rather than repeat an `<img>` and its URL logic, we build **one** tiny
shared component. It is the first component we build because everything else imports it.

It is deliberately the simplest possible **dumb component**: one required `input()` (the ISO code), one
`computed()` deriving the flagcdn URL. There is **no HTTP client** here — the browser fetches the image
directly from the CDN via the `<img src>`. That is the whole reason we don't need (and the source never had) a
REST Countries client for flags ([decision-log D7](../foundation/decision-log.md#d7--hover-card-is-descoped-to-match-the-code-no-rest-countries)).

## Do this
1. Create the folder `src/app/features/globe/country-flag/` and the three files below.
2. In `country-flag.ts`, the `code` input is **`input.required<string>()`** — the component is meaningless
   without a code, so requiring it fails the build early if a caller forgets it.
3. The URL `https://flagcdn.com/w40/${code}.png` is **load-bearing**: `w40` is flagcdn's 40px-wide variant and
   the code must be **lower-cased** (`this.code().toLowerCase()`) — flagcdn 404s on upper-case codes. The
   selector `app-country-flag` is load-bearing (every template below references it); the class name and field
   names are cosmetic.
4. `loading="lazy"` on the `<img>` defers off-screen flag loads — keep it; it matters when a leaderboard or
   picker lists dozens of flags.

## Code
### `src/app/features/globe/country-flag/country-flag.ts`
```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** A themed country flag (flagcdn image) for an ISO 3166-1 alpha-2 code. Dumb component. */
@Component({
  selector: 'app-country-flag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './country-flag.html',
  styleUrl: './country-flag.scss',
})
export class CountryFlag {
  readonly code = input.required<string>();

  protected readonly src = computed(
    () => `https://flagcdn.com/w40/${this.code().toLowerCase()}.png`,
  );
}
```

### `src/app/features/globe/country-flag/country-flag.html`
```html
<img class="flag" [src]="src()" [alt]="code()" width="32" height="24" loading="lazy" />
```

### `src/app/features/globe/country-flag/country-flag.scss`
```scss
:host {
  display: inline-flex;
  line-height: 0;
}

.flag {
  width: 2rem;
  height: 1.5rem;
  object-fit: cover;
  border-radius: 0.25rem;
  border: 1px solid color-mix(in srgb, var(--neon-teal) 45%, transparent);
  box-shadow: 0 1px 3px rgb(0 0 0 / 35%);
  // Real national flags are bold; soften them so they sit in the pastel theme.
  filter: saturate(0.6) contrast(0.92) brightness(1.02);
}
```

## Done when (this step)
- [ ] `npm run build` → compiles clean (no "missing required input" complaints — nothing consumes it yet).
- [ ] Temporarily drop `<app-country-flag code="us" />` into any rendered template and serve → the US flag
      renders at ~32×24 px with a soft teal border. Remove the temporary tag afterward.

## If it breaks
- **A broken-image icon instead of a flag** → the code reached flagcdn upper-cased, or isn't a real ISO
  alpha-2. Confirm `.toLowerCase()` is in the `src` computed.
- **`code` is required` build error where you test it** → you used `<app-country-flag />` with no `code`;
  `input.required` refuses an absent value. Pass a code.

---
> Nav: — · [Overview](00_overview.md) · [heat-legend →](02_heat-legend.md)
