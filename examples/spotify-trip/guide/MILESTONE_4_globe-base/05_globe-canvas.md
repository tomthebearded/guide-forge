# M4 · Step 05 of 8 — `globe-canvas`: the afterNextRender / DestroyRef bridge
> Nav: [← Renderer hover](04_renderer-hover.md) · [Overview](00_overview.md) · [Globe page →](06_globe-page.md)

This step touches **3 files, committed together**: `globe-canvas.ts`, `globe-canvas.html`, `globe-canvas.scss`
(an Angular component is its class + template + styles — one unit). It's the seam between Angular and the plain
three.js renderer.

## Glossary for this step
> **`afterNextRender`** — an Angular callback that runs **once**, in the browser only, right after the next DOM render — the safe moment to touch a real DOM element. We use it to mount the renderer into the host `<div>`. [docs](https://angular.dev/api/core/afterNextRender).
> **`DestroyRef`** — an injectable whose `onDestroy(fn)` runs when the component is destroyed. We use it to `dispose()` the renderer. [docs](https://angular.dev/api/core/DestroyRef).
> **`viewChild.required`** — the signal-based query for a template element/child; `.required` means "it must exist, don't hand me `undefined`". Here it grabs the host `<div>`. [docs](https://angular.dev/api/core/viewChild).
> **`output()`** — the signal-era event emitter (replaces `@Output`); the parent binds it like `(countryHover)="…"`. See [conventions](../foundation/conventions.md).

## Why / design — the lifecycle bridge
The renderer needs a real DOM element to attach its `<canvas>` to, and it must be torn down when the user
leaves. Those two moments are the whole job of this component:

> **Mental model — where the two worlds meet.** The [signal-free renderer](../foundation/decision-log.md#d4--signal-free-render-loop)
> can't be built in a field initializer (the host element doesn't exist yet) or in a constructor (still too
> early). `afterNextRender` is the *inbound* bridge — the first moment the host `<div>` is real, so that's
> where we `init(...)`. `DestroyRef.onDestroy` is the *outbound* bridge — Angular destroying the component is
> our cue to release the GPU. The renderer's own `setHoverHandler` callback carries hover events back out as an
> Angular `output`.

Note what's **not** here yet: there are **no signal inputs** in M4, so there are **no `effect()`s**. That half
of the bridge arrives in **M5**, when `heat` becomes the first live input and an `effect()` pushes it into
`renderer.applyHeat`. For now the bridge is purely lifecycle: mount once, dispose once. (This is why the
[glossary defines `effect()`](../foundation/glossary.md#effect) as the signal→renderer bridge — you'll wire
your first one next milestone.)

`init` is `async` because it awaits `geoData.features()` — the memoized load from step 02. The order matters:
register the hover handler **before** `init`, so no early hover can fire into an unset callback.

> **Reminder (classic Angular).** This is a *dumb* child component (`app-globe-canvas`): it takes/EMITs via
> signal IO and owns no store. The smart `globe-page` (next step) hosts it. `OnPush` + no zone means it only
> re-renders when an input signal changes — which is fine, because the globe animates itself off in
> three.js-land, not through Angular.

## Do this
1. **Create `src/app/features/globe/globe-canvas/globe-canvas.ts`** (below). It declares one `output`
   (`countryHover`), queries the host `<div>`, and owns a `GlobeRenderer` instance.
2. **In the constructor**, wire the two bridge points:
   1. `afterNextRender(async () => …)` — await features, `setHoverHandler`, then `init(host, features)`.
   2. `inject(DestroyRef).onDestroy(() => this.renderer.dispose())`.
3. **Create `globe-canvas.html`** — a single host `<div #host>` the renderer's canvas is appended into.
4. **Create `globe-canvas.scss`** — make the host fill its parent; the appended `<canvas>` is `display: block`
   so there's no inline-element gap.
5. **Keep the selector `app-globe-canvas`** — component selectors keep the `app-` prefix
   ([conventions](../foundation/conventions.md)). The class name `GlobeCanvas` is the suffix-less PascalCase of
   the file.

## Code
### `src/app/features/globe/globe-canvas/globe-canvas.ts`  *(M4 intermediate — heat/flight/palette inputs added in M5/M8)*
```ts
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
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

/** Dumb host for the three.js globe: owns the renderer's DOM lifecycle and forwards hover events. */
@Component({
  selector: 'app-globe-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './globe-canvas.html',
  styleUrl: './globe-canvas.scss',
})
export class GlobeCanvas {
  /** Emits the hovered country (or null off-country) with the cursor position, anchoring a card later. */
  readonly countryHover = output<CountryHoverEvent>();

  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  private readonly geoData = inject(GeoData);
  private readonly renderer = new GlobeRenderer();

  constructor() {
    // afterNextRender: the first moment the host <div> is a real DOM element — mount the renderer here.
    afterNextRender(async () => {
      const features = await this.geoData.features();
      this.renderer.setHoverHandler((code, x, y) => this.countryHover.emit({ code, x, y }));
      this.renderer.init(this.host().nativeElement, features);
    });

    // Component destroyed (e.g. navigating away from /globe) → release the WebGL context + GPU memory.
    inject(DestroyRef).onDestroy(() => this.renderer.dispose());
  }
}
```

### `src/app/features/globe/globe-canvas/globe-canvas.html`
```html
<div #host class="globe-host"></div>
```

### `src/app/features/globe/globe-canvas/globe-canvas.scss`
```scss
:host {
  display: block;
  width: 100%;
  height: 100%;
}

.globe-host {
  width: 100%;
  height: 100%;
  overflow: hidden;

  canvas {
    display: block;
  }
}
```

> **Scope flags.** The source component also has `heat`, `flightTarget`, `flightVisible`, `palette`, `dayMode`,
> `markerIcon` inputs, six `effect()`s, and a `capture()` method — all deferred (M5/M8/M11). M4's canvas is
> mount + dispose + hover only.

## Done when (this step)
- [ ] `npm run build` → compiles clean.
- [ ] The component isn't visible yet (nothing renders it) — that's the next step. This step's gate is the
      clean build; the visual payoff is step 08.

## If it breaks
- **`NG0950: viewChild.required() … no value`** → the `#host` template reference is missing/misspelled in
  `globe-canvas.html`. It must be exactly `#host`.
- **Nothing appended / canvas is 0×0** → the host `<div>` had no size when `afterNextRender` ran. That's the
  *page's* job (next step gives the canvas `width/height: 100%` inside a sized page); the SCSS above only
  fills the parent.
- **Renderer never disposes on navigation** → you put the cleanup somewhere other than `DestroyRef.onDestroy`,
  or the route isn't destroying the component. Verify in step 07/08.
