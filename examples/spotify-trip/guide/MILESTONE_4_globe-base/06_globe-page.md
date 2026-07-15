# M4 · Step 06 of 8 — `globe-page` skeleton + temporary hover readout
> Nav: [← Globe canvas](05_globe-canvas.md) · [Overview](00_overview.md) · [Globe route →](07_globe-route.md)

This step touches **3 files, committed together**: `globe-page.ts`, `globe-page.html`, `globe-page.scss`. These
already exist — created as a placeholder in M0 and reworked in M3 to show the live liked-track count — so here
you **replace** them with the smart page that hosts the globe canvas full-bleed and shows which country you're
hovering. M3's liked-count view is retired (the `LikedIndex` store stays; it's just no longer displayed until M5
colours the globe).

## Glossary for this step
> **`@if` / `@let`** — Angular's built-in control flow (replaces `*ngIf`); `@if (x; as y)` binds the truthy value to a local `y`. See [conventions](../foundation/conventions.md) and [docs](https://angular.dev/guide/templates/control-flow).
> **smart vs dumb component** — the *smart* page owns state and wiring; *dumb* children (like `globe-canvas`) just take inputs / emit outputs. Classic Angular pattern — one-line reminder only.

## Why / design
In the full app this page is enormous (heat legend, filters, timeline, stats, settings, the flight trip log,
the real hover card, a `GlobeStore`). **All of that is later milestones.** M4's page is a deliberate skeleton:
mount the canvas, fill the viewport, and prove hover works.

To make the hover gate *observable at the page level* — not just "a country turned white on the globe" — the
page keeps a `hoveredCode` signal and shows it in a small top-left readout. That also exercises the full
outbound seam, hop by hop:
1. the renderer fires its hover **callback** (plain class, no signals);
2. the canvas component forwards it as an Angular **`output`**;
3. the page stores the value in its `hoveredCode` **signal**;
4. the **template** renders the signal in the readout.

> **This readout is a temporary M4 dev affordance.** M6 replaces it with the real hover/select country card
> (which shows the country's artists and facts). It's here now purely so you have a concrete thing to read in
> the Done-when gate.

The `:host` background is a radial "space" gradient; the canvas is transparent (`alpha: true` in the renderer),
so the gradient shows through behind the globe. The page reserves `calc(100dvh - 64px)` — full viewport minus
the app toolbar height from M0.

## Do this
1. **Replace `src/app/features/globe/globe-page/globe-page.ts`** (below) — overwrite M3's liked-count version.
   It imports `GlobeCanvas`, holds a `hoveredCode` signal, and updates it from the canvas's `countryHover` output.
2. **Replace `globe-page.html`** — render `<app-globe-canvas>` full-bleed and bind `(countryHover)`; show the
   readout with `@if (hoveredCode(); as code)`.
3. **Replace `globe-page.scss`** — the space background, the full-size globe, and the readout chip.
4. **On the `--space-void` variable:** the gradient references the CSS custom property `--space-void` (a deep
   space blue, defined by the M0 theme). The fallback `#070b14` is **mandatory** here so the gradient still
   renders if you're following before the theme defines it — `var(--space-void, #070b14)`.
5. **Keep the selector `app-globe-page`** and the suffix-less class name `GlobePage`.

## Code
### `src/app/features/globe/globe-page/globe-page.ts`  *(M4 skeleton — grows massively in M5/M6+)*
```ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { CountryHoverEvent, GlobeCanvas } from '../globe-canvas/globe-canvas';

@Component({
  selector: 'app-globe-page',
  imports: [GlobeCanvas],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './globe-page.html',
  styleUrl: './globe-page.scss',
})
export class GlobePage {
  /**
   * ISO alpha-2 of the country under the pointer, fed by the globe canvas.
   * Temporary M4 readout — M6 replaces this with the real hover/select country card.
   */
  protected readonly hoveredCode = signal<string | null>(null);

  protected onHover(event: CountryHoverEvent): void {
    this.hoveredCode.set(event.code);
  }
}
```

### `src/app/features/globe/globe-page/globe-page.html`
```html
<app-globe-canvas class="globe" (countryHover)="onHover($event)" />

<!-- Temporary M4 readout: proves raycast → ISO_A2 resolves. Replaced by the country card in M6. -->
<div class="hover-readout">
  @if (hoveredCode(); as code) {
    Hovering: {{ code }}
  } @else {
    Hovering: —
  }
</div>
```

### `src/app/features/globe/globe-page/globe-page.scss`
```scss
:host {
  display: block;
  position: relative;
  // Fill the viewport below the 64px toolbar so the globe sits in full-bleed space.
  height: calc(100dvh - 64px);
  overflow: hidden;
  background: radial-gradient(circle at 50% 40%, #0b1626 0%, var(--space-void, #070b14) 70%);
}

.globe {
  display: block;
  width: 100%;
  height: 100%;
}

.hover-readout {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 1;
  padding: 0.4rem 0.7rem;
  border-radius: 0.5rem;
  font: 500 0.9rem/1 system-ui, sans-serif;
  color: #e8f1ff;
  background: rgba(11, 22, 38, 0.7);
  backdrop-filter: blur(6px);
}
```

> **Scope flags.** The source `globe-page` imports ~13 child components and a `GlobeStore`/`SettingsStore`/
> `FlightStore`, computes stat boards, journey totals, a heat legend, hover-card placement, view-prefs
> persistence, and a save-image action — **all** later milestones. M4's page is host + readout only.

## Done when (this step)
- [ ] `npm run build` → compiles clean.
- [ ] Still no route points at the page (next step). Build passing is the gate; the on-screen check is step 08.

## If it breaks
- **`'app-globe-canvas' is not a known element`** → you forgot `GlobeCanvas` in the component's `imports`
  array (standalone components declare their own imports).
- **The page has zero height / globe invisible** → the `:host` `height` rule didn't apply. Ensure the file is
  `globe-page.scss` and referenced via `styleUrl`, and that your app toolbar really is 64px (adjust the
  `calc()` if M0 used a different height).
- **Gradient shows as a flat colour** → `--space-void` is undefined and you dropped the `#070b14` fallback;
  keep `var(--space-void, #070b14)`.
