# M6 · Step 02 of 11 — The `heat-legend` gradient scale
> Nav: [← country-flag](01_country-flag.md) · [Overview](00_overview.md) · [country-hover →](03_country-hover.md)

This step touches **3 files, committed together**: `heat-legend.ts`, `.html`, `.scss`.

## Why / design
The globe recolours countries on a cold→hot ramp, but a colour ramp is meaningless without a key. The
`heat-legend` is that key: a horizontal gradient bar labelled `1` at the cold end and the busiest country's
value at the hot end. It is a **dumb** component — the page feeds it `max`, `caption`, and `unit` as plain
inputs, all derived from the store. That is what lets one legend serve both heat modes: in step 10 the page
passes `Tracks per country` / `♪` / `store.maxHeat()` in tracks mode, and `Hours per country` / `h` / the
rounded-hours max in hours mode. The legend itself knows nothing about modes.

The gradient is built from the M0 theme's `--globe-land-cold` / `--globe-land-mid` / `--globe-land-hot` CSS
custom properties. Note these are **seeded to the same values** as the renderer's ramp, not (yet) a shared
source: the M5 renderer hard-codes its endpoints (`LAND_COLD`/`LAND_HOT`) and lerps cold→hot with no mid stop.
So the legend and globe *look* consistent because the numbers match, but until **M11** — where the renderer
starts reading the live palette — they could drift if you changed one and not the other. Building the legend
from the CSS vars now means it will track the palette automatically once M11 lands.

## Do this
1. Create `src/app/features/globe/heat-legend/` and the three files below.
2. The three inputs have **defaults** so the component renders even before data exists: `max` defaults to `0`,
   `caption` to `'Tracks per country'`, `unit` to `'♪'`. In step 10 the page overrides all three; here they're
   just safe fallbacks (illustrative values).
3. The selector `app-heat-legend` is load-bearing. The bar's gradient stops must be the three
   `--globe-land-*` vars in cold→mid→hot order — **don't** hard-code hex here, so the legend tracks the theme
   palette automatically (and stays aligned with the globe once the renderer reads that palette live in M11).

## Code
### `src/app/features/globe/heat-legend/heat-legend.ts`
```ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Gradient legend for the globe heat ramp (cold → hot), labelled with the busiest country's weight. */
@Component({
  selector: 'app-heat-legend',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './heat-legend.html',
  styleUrl: './heat-legend.scss',
})
export class HeatLegend {
  /** The busiest country's value — the hot end of the scale. */
  readonly max = input(0);
  /** Heading describing the active heat metric. */
  readonly caption = input('Tracks per country');
  /** Suffix shown after the max value (e.g. '♪', 'h'). */
  readonly unit = input('♪');
}
```

### `src/app/features/globe/heat-legend/heat-legend.html`
```html
<section class="legend">
  <span class="caption">{{ caption() }}</span>
  <div class="bar"></div>
  <div class="scale">
    <span>1</span>
    <span>{{ max() }}{{ unit() }}</span>
  </div>
</section>
```

### `src/app/features/globe/heat-legend/heat-legend.scss`
```scss
.legend {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 12rem;
  padding: 0.6rem 0.75rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--space-surface) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--neon-teal) 25%, transparent);
  backdrop-filter: blur(8px);
  box-shadow: var(--glow-shadow);
}

.caption {
  font: var(--mat-sys-body-small);
  color: var(--mat-sys-on-surface-variant);
}

// Seeded to the same cold/hot values as the renderer's ramp; the renderer reads this palette live from M11.
.bar {
  height: 0.6rem;
  border-radius: 0.3rem;
  background: linear-gradient(
    to right,
    var(--globe-land-cold),
    var(--globe-land-mid),
    var(--globe-land-hot)
  );
}

.scale {
  display: flex;
  justify-content: space-between;
  font: var(--mat-sys-body-small);
  color: var(--mat-sys-on-surface-variant);
}
```

## Done when (this step)
- [ ] `npm run build` → compiles clean.
- [ ] Rendered (you'll wire it in step 10), `<app-heat-legend [max]="240" />` shows a rounded card with a
      cold→hot gradient bar, `Tracks per country` above it, and `1` … `240♪` beneath.

## If it breaks
- **The gradient bar is a flat grey / transparent** → the `--globe-land-*` vars aren't defined; confirm M0's
  `styles/_theme-colors.scss` is imported by `styles.scss`.
- **Nothing appears** → the selector is misspelled where you placed it; it must be exactly `app-heat-legend`.

---
> Nav: [← country-flag](01_country-flag.md) · [Overview](00_overview.md) · [country-hover →](03_country-hover.md)
