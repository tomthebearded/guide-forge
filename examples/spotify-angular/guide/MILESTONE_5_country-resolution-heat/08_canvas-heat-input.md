# M5 · Step 08 of 10 — The canvas `heat` input + first `effect()`
> Nav: [← Heat ramp](07_heat-ramp.md) · [Overview](00_overview.md) · [Wire the globe page →](09_globe-page-wiring.md)

## Glossary for this step
> **`input()`** — Angular's signal-based component input: `readonly heat = input(...)` is a *signal* you call as
> `heat()`, and it re-fires dependents when the parent binds a new value. Replaces `@Input`.
> [glossary](../foundation/glossary.md#signal) · [docs](https://angular.dev/guide/components/inputs).
> **`effect()`** — runs a side-effect whenever the signals it reads change. Here it's the bridge from the `heat`
> signal into the imperative three.js renderer. [glossary](../foundation/glossary.md#effect) ·
> [docs](https://angular.dev/guide/signals#effects).
> **`viewChild.required()`** — the signal-based query that grabs a template element/component (matched by a
> template reference like `#host`); the `.required` form asserts it's always present, so it returns a non-null
> signal you read as `host()`. It's the modern replacement for the `@ViewChild` decorator.
> [docs](https://angular.dev/api/core/viewChild).

## Why / design
The M4 `globe-canvas` is a dumb host that mounts the renderer and forwards hover events. This step gives it its
**first data input** — the heat map — and the **single `effect()`** that pushes that signal into the renderer.

> 📚 Recurring model — **the one signal↔imperative bridge** ([D4](../foundation/decision-log.md#d4--signal-free-render-loop)).
> The renderer's loop is deliberately signal-free. So how does live heat reach it? Through exactly one seam:
> this component's `effect()`. When the parent's `heat` signal changes, the effect re-runs and calls
> `renderer.applyHeat(...)` — an imperative method. The render loop never reads the signal; it just draws
> whatever `applyHeat` last stored. **This is the pattern for every future input** (flight target, palette,
> day-mode all follow it in later milestones): `input()` signal → `effect()` → imperative renderer method.

**The `ready` guard.** The renderer's methods are unsafe before `init()` has run, and `init()` runs inside
`afterNextRender` (the first moment the host `<div>` is a real DOM node). So the effect checks a `ready` flag
before calling `applyHeat`. And because the effect may have fired *before* `ready` flipped (dropping that early
value), `afterNextRender` also calls `applyHeat(this.heat())` once right after `init()` — this is what paints a
**restored-from-cache** dataset immediately on reload, before any change fires the effect.

## Do this
1. Open `src/app/features/globe/globe-canvas/globe-canvas.ts` (the M4 file). This step replaces it with the
   version below. The M4 template + styles (`globe-canvas.html`, `globe-canvas.scss`) are **unchanged**.
2. The diff from M4: add `effect` + `input` to the `@angular/core` import, add the `heat` input, add the `ready`
   flag, add `this.renderer.applyHeat(this.heat())` at the end of the `afterNextRender` block, and add the one
   `effect()`.
3. `heat` is load-bearing by name — the page binds `[heat]="store.heat()"` in step 09. Its default is an empty
   `Map` so the component works before any data exists.
4. Leave the hover output, the `GeoData` inject, the `GlobeRenderer` instance, and the `DestroyRef` disposal
   exactly as M4 had them.

## Code
### `src/app/features/globe/globe-canvas/globe-canvas.ts`
```ts
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

import { GeoData } from '../../../core/geo/geo-data';
import { GlobeRenderer } from '../globe-renderer';

/** Hovered country (ISO alpha-2, or null off-country) plus the cursor position in canvas pixels. */
export interface CountryHoverEvent {
  code: string | null;
  x: number;
  y: number;
}

/** Dumb host for the three.js globe: owns the renderer's DOM lifecycle and pushes heat into it. */
@Component({
  selector: 'app-globe-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './globe-canvas.html',
  styleUrl: './globe-canvas.scss',
})
export class GlobeCanvas {
  /** Per-country heat (ISO alpha-2 → liked-track count). Recolours the globe live as it changes. */
  readonly heat = input<ReadonlyMap<string, number>>(new Map());

  /** Emits the hovered country (or null off-country) with the cursor position, anchoring a card later. */
  readonly countryHover = output<CountryHoverEvent>();

  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  private readonly geoData = inject(GeoData);
  private readonly renderer = new GlobeRenderer();
  /** Guards the effect: the renderer's methods are unsafe until init() has run (afterNextRender). */
  private ready = false;

  constructor() {
    // afterNextRender: the first moment the host <div> is a real DOM element — mount the renderer here.
    afterNextRender(async () => {
      const features = await this.geoData.features();
      this.renderer.setHoverHandler((code, x, y) => this.countryHover.emit({ code, x, y }));
      this.renderer.init(this.host().nativeElement, features);
      this.ready = true;
      // Push whatever heat already exists (e.g. a dataset restored from cache) now that the renderer
      // is live — an effect that fired before `ready` flipped would have skipped it.
      this.renderer.applyHeat(this.heat());
    });

    // The one signal→imperative bridge: whenever `heat` changes, push it into the render loop. This
    // effect is the ONLY place a signal touches the renderer — the loop itself stays signal-free (D4).
    effect(() => {
      const heat = this.heat();
      if (this.ready) {
        this.renderer.applyHeat(heat);
      }
    });

    // Component destroyed (e.g. navigating away from /globe) → release the WebGL context + GPU memory.
    inject(DestroyRef).onDestroy(() => this.renderer.dispose());
  }
}
```

## Done when (this step)
- [ ] `npm run build` is clean. Wired up in step 09, but you can prove the bridge in isolation now: temporarily
      bind `[heat]="testHeat"` where `testHeat = new Map([['BR', 5], ['US', 1]])` on the page — Brazil paints
      near the hot end, the USA near the cold end, everything else muted. Revert the temporary binding after.

## If it breaks
- **Globe stays fully muted even with data** → the effect never calls `applyHeat`, usually because `ready` is
  still `false` (the effect ran before `afterNextRender`). Confirm `ready = true` is set **inside**
  `afterNextRender` after `init`, and that `applyHeat(this.heat())` is called there too.
- **`NG0600` / writing to a signal in an effect** → you did more than read `heat()` in the effect. It should
  only read the input and call the imperative method — no signal writes.
- **Heat updates lag or don't repaint** → the store passes the *same* `Map` reference each time. It doesn't —
  `GlobeStore.publish()` sets a **new** `Map`, and `heat` is a fresh computed — so the input identity changes
  and the effect fires. If you memoized the map upstream, drop that.

---
> Nav: [← Heat ramp](07_heat-ramp.md) · [Overview](00_overview.md) · [Wire the globe page →](09_globe-page-wiring.md)
