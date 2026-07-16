# M5 · Step 09 of 10 — Wire the globe page (heat + progress)
> Nav: [← Canvas heat input](08_canvas-heat-input.md) · [Overview](00_overview.md) · [Verify →](10_verify.md)

**This step edits three files, committed together:** `globe-page.ts`, `globe-page.html`, `globe-page.scss` under
`src/app/features/globe/globe-page/`. They're one change — the page's new job — so they ship as one commit.

## Why / design
M4's page was a globe plus a temporary "Hovering: XX" readout. This step replaces that readout with the M5 job:
mount the globe, **feed `GlobeStore.heat` into the canvas**, restore the saved dataset on init, and show a
progress HUD with a **Load / Recalculate** trigger.

The page is a **smart component** ([conventions](../foundation/conventions.md#structure--architecture-feature-first)):
it owns the store, the dumb `globe-canvas` takes the `heat` signal as an input. The page adds almost no logic of
its own — that's the point of putting orchestration in the store:
- **On construct:** call `store.restore()` — synchronous, no network. A reload repaints the coloured globe
  instantly from `evm.origins`.
- **The button:** calls `store.recalculate()`. The store itself decides full-vs-incremental (full when there's
  no data, incremental otherwise), so the page doesn't branch.
- **The HUD:** binds the store's readonly count signals (`resolvedCount`, `failedCount`, `pendingCount`,
  `total`) and `dateRange`.

> 📚 Reminder — **the hover readout is gone.** M4's `Hovering: XX` was scaffolding to prove raycast → ISO. The
> real hover **facts panel** (with country facts + artist list) is **M6**. M5 leaves the canvas emitting
> `countryHover`, but the page doesn't bind it yet — no readout, no panel.

## Do this
1. Replace `globe-page.ts` with the version below. It injects `GlobeStore`, calls `restore()` in the
   constructor, and exposes one `load()` method. `imports: [GlobeCanvas]` is required (standalone component).
2. Replace `globe-page.html` with the template below: the `<app-globe-canvas>` bound to `store.heat()`, plus the
   HUD overlay.
3. Replace `globe-page.scss` with the styles below — M4's `:host`/`.globe` block, with the `.hover-readout`
   rules swapped for the `.hud` panel.
4. Load-bearing: `[heat]="store.heat()"` (the binding name `heat` must match step 08's input) and the store
   signal names in the HUD. The CSS class names and copy are cosmetic.

## Code
### `src/app/features/globe/globe-page/globe-page.ts`
```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { GlobeCanvas } from '../globe-canvas/globe-canvas';
import { GlobeStore } from '../globe-store';

@Component({
  selector: 'app-globe-page',
  imports: [GlobeCanvas],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './globe-page.html',
  styleUrl: './globe-page.scss',
})
export class GlobePage {
  protected readonly store = inject(GlobeStore);

  constructor() {
    // Restore the persisted dataset synchronously — NO network. A reload recolours the globe
    // instantly; the scan runs only on demand.
    this.store.restore();
  }

  /** Scan Liked Songs and resolve countries. The store picks full-vs-incremental from its own state. */
  protected load(): void {
    void this.store.recalculate();
  }
}
```

### `src/app/features/globe/globe-page/globe-page.html`
```html
<app-globe-canvas class="globe" [heat]="store.heat()" />

<div class="hud">
  <button type="button" class="hud__btn" (click)="load()" [disabled]="store.isResolving()">
    @if (store.isResolving()) {
      Scanning…
    } @else if (store.hasData()) {
      Recalculate
    } @else {
      Load my music
    }
  </button>

  @if (store.hasData() || store.isResolving()) {
    <dl class="hud__stats">
      <div><dt>Resolved</dt><dd>{{ store.resolvedCount() }}</dd></div>
      <div><dt>Unplaced</dt><dd>{{ store.failedCount() }}</dd></div>
      <div><dt>Pending</dt><dd>{{ store.pendingCount() }}</dd></div>
      <div><dt>Artists</dt><dd>{{ store.total() }}</dd></div>
    </dl>

    @if (store.dateRange().oldest !== null) {
      <p class="hud__range">
        {{ store.dateRange().oldest?.slice(0, 10) }} → {{ store.dateRange().newest?.slice(0, 10) }}
      </p>
    }
  } @else {
    <p class="hud__hint">Load your Liked Songs to colour the globe by artist country.</p>
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

.hud {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  max-width: 16rem;
  padding: 0.8rem 0.9rem;
  border-radius: 0.6rem;
  color: #e8f1ff;
  background: rgba(11, 22, 38, 0.72);
  backdrop-filter: blur(6px);
  font: 500 0.9rem/1.3 system-ui, sans-serif;
}

.hud__btn {
  padding: 0.5rem 1rem;
  cursor: pointer;
  border: 0;
  border-radius: 0.4rem;
  background: #1db954; // Spotify green — cosmetic
  color: #04210f;
  font: inherit;
  font-weight: 700;

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
}

.hud__stats {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.3rem 0.9rem;

  div {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
  }

  dt {
    opacity: 0.7;
  }

  dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
    font-weight: 700;
  }
}

.hud__range {
  margin: 0;
  opacity: 0.65;
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
}

.hud__hint {
  margin: 0;
  opacity: 0.75;
}
```

## Done when (this step)
- [ ] `npm run build` is clean, then `ng serve --host 127.0.0.1 --port 4200`, log in, open `/globe`. The HUD
      shows **Load my music** and the hint. Click it → the button reads **Scanning…**, countries begin to
      colour, and **Resolved** climbs while **Pending** falls. When it settles, the HUD reads e.g.
      `Resolved 412 · Unplaced 38 · Pending 0 · Artists 450` with a date range below.

## If it breaks
- **`NG8001: 'app-globe-canvas' is not a known element`** → `GlobeCanvas` isn't in the component's `imports`
  array. Add it (it's standalone).
- **Globe mounts but never colours** → `[heat]="store.heat()"` isn't bound, or `restore()`/`recalculate()`
  wasn't called. Check the binding name is exactly `heat` and the constructor calls `store.restore()`.
- **Clicking the button does nothing** → `store.isResolving()` is already `true` (a scan is in flight), so
  `recalculate()` early-returns. Wait for the current scan, or check the console for a paging error line.
- **Counts show but `Resolved + Unplaced ≠ Artists`** mid-scan → that's expected while **Pending > 0** (some
  artists aren't tried yet). It balances once Pending hits 0.

---
> Nav: [← Canvas heat input](08_canvas-heat-input.md) · [Overview](00_overview.md) · [Verify →](10_verify.md)
