# M5 · Step 07 of 10 — Heat in the renderer (`applyHeat` + the cold→hot ramp)
> Nav: [← GlobeStore](06_globe-store.md) · [Overview](00_overview.md) · [Canvas heat input →](08_canvas-heat-input.md)

## Glossary for this step
> **heat** — colouring a country by how much of your library comes from it (here, its liked-track count).
> [glossary](../foundation/glossary.md#heat).
> **heat ramp** — the gradient from a "cold" colour (low count) to a "hot" colour (highest count) that every
> country's fill is interpolated along.
> **HSL lerp** — interpolating two colours through Hue/Saturation/Lightness instead of raw RGB, so the midpoint
> stays vivid instead of turning muddy grey.

## Why / design
The renderer is still M4's plain, signal-free class. This step teaches it to colour land from a heat map. Three
methods change, and one is added:
- `applyHeat(map)` — the new public entry point. Stores the map, computes the max weight (the hot end of the
  scale), and asks three-globe to re-evaluate every polygon's cap colour by calling `polygonsData(features)`
  again. Safe to call repeatedly — the `GlobeStore` calls it ~5×/s during a scan.
- `capColor(feature)` — now returns a heat colour instead of a flat land colour. A country with **no** liked
  artists (weight 0 or absent) gets a muted "no data" fill so it recedes; a country with artists gets a point
  on the cold→hot ramp.
- `weightColor(code)` + `isEmpty(code)` — the ramp maths.

> 📚 New concept — **why `sqrt` and why HSL.** Two deliberate choices in `weightColor`:
> - **`Math.sqrt(weight / maxWeight)`** spreads the ramp. Music libraries are lopsided — one or two countries
>   often dwarf the rest. A linear ratio would leave every other country stuck near "cold"; the square root
>   pulls the mid-range up so the whole map reads.
> - **`cold.lerpHSL(hot, t)`** interpolates through HSL. A straight RGB lerp between, say, blue and warm-orange
>   passes through a muddy grey at the midpoint; HSL sweeps the hue so the mid-tones stay saturated. `lerpHSL`
>   is a built-in three.js `Color` method ([docs](https://threejs.org/docs/#api/en/math/Color.lerpHSL)).

> 📚 Recurring model — **the render loop stays signal-free** ([D4](../foundation/decision-log.md#d4--signal-free-render-loop)).
> `applyHeat` is an imperative method a *component* calls; the render loop itself reads no signals and no heat
> map — it just renders whatever `polygonsData` was last told. Step 08 adds the single `effect()` that bridges
> the store's `heat` signal to this method. That's the only place signals touch three.js.

**Hardcoded colours (for now).** The cold/hot/empty endpoints are constants here. **Live palette customization —
reading the endpoints from user settings — is M11.** Keeping them hardcoded keeps this step about the *ramp*, not
about settings plumbing.

## Do this
1. Open `src/app/features/globe/globe-renderer.ts` (the M4 file). This step **replaces** it with the version
   below — the diff from M4 is: the constants block (`LAND` becomes `LAND_COLD`/`LAND_HOT`/`LAND_EMPTY`), five
   new fields (`cold`, `hot`, `empty`, `heat`, `maxWeight`), the new `applyHeat` method, and the rewritten
   `capColor` + new `isEmpty`/`weightColor`. Everything else (init, buildGlobe, hover picking, disposal, the
   loop) is exactly as M4 left it.
2. `LAND_COLD` / `LAND_HOT` / `LAND_EMPTY` are the ramp endpoints. Their **values** are illustrative (a blue →
   warm-coral ramp, muted slate for empty); the *mechanism* is what's load-bearing. `applyHeat` is load-bearing
   by name — step 08's `effect()` calls it.
3. Leave `OCEAN`, `STROKE`, `ATMOSPHERE`, the `MeshPhongMaterial`, and all the M4 hover/dispose code exactly as
   they are — you're adding heat, not touching the M4 behaviour.

## Code
### `src/app/features/globe/globe-renderer.ts`
```ts
import {
  AmbientLight,
  Color,
  DirectionalLight,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import ThreeGlobe from 'three-globe';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { GeoFeature, isoA2, pickCountryCode } from '../../core/geo/geo-data';

/** three-globe renders the sphere at this radius; frame the camera + picking relative to it. */
const GLOBE_RADIUS = 100;
const INITIAL_DISTANCE = 320;
/** White, lerped into the hovered country's cap colour so it reads as highlighted. */
const HIGHLIGHT = new Color(0xffffff);

// Base globe colours. Ocean/stroke/atmosphere hardcoded since M4. The heat-ramp endpoints below are
// hardcoded for M5; live palette customization (reading them from user settings) is M11.
const OCEAN = '#112233';
const STROKE = '#9fe0cf';
const ATMOSPHERE = '#a9d4f0';
/** Heat-ramp endpoints: cold = fewest liked tracks, hot = the busiest country. */
const LAND_COLD = '#7fa8c9';
const LAND_HOT = '#ef9a8a';
/** Flat fill for countries with no liked artists — a muted "no data" tone, set apart from the ramp. */
const LAND_EMPTY = '#5a6672';
/** Where the single "sun" sits — a soft directional light so the sphere isn't flat. */
const SUN_POSITION = new Vector3(-200, 120, 220);

/**
 * Owns the three.js + three-globe scene for the country globe. Plain three.js with its own render
 * loop — it never touches signals / Angular change detection, which is what keeps the zoneless app
 * cheap. `init(host, features)` once; `applyHeat(map)` to recolour land by country weight;
 * `setHoverHandler` to be told which country is hovered; `dispose()` to tear down. (Flight + live
 * palette are added in later milestones.)
 */
export class GlobeRenderer {
  private readonly scene = new Scene();
  private renderer?: WebGLRenderer;
  private camera?: PerspectiveCamera;
  private controls?: OrbitControls;
  private globe?: ThreeGlobe;
  private resizeObserver?: ResizeObserver;
  private frameId = 0;

  private features: GeoFeature[] = [];

  // Heat state: the current per-country weights, the max (hot end of the scale), and the ramp colours.
  private readonly cold = new Color(LAND_COLD);
  private readonly hot = new Color(LAND_HOT);
  private readonly empty = new Color(LAND_EMPTY);
  private heat: ReadonlyMap<string, number> = new Map();
  private maxWeight = 0;

  private ambient?: AmbientLight;
  private sun?: DirectionalLight;

  // Hover picking: raycast the pointer against an invisible sphere, then point-in-polygon the hit.
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private pickSphere?: Mesh;
  private pendingPick = false;
  private hoveredCode: string | null = null;
  /** Last pointer position in canvas pixels — passed to the hover handler to anchor a card later. */
  private readonly pointerPx = { x: 0, y: 0 };
  private hoverHandler?: (code: string | null, x: number, y: number) => void;

  init(host: HTMLElement, features: GeoFeature[]): void {
    this.features = features;

    const { clientWidth: width, clientHeight: height } = host;
    // alpha: true → transparent background, so the page's space gradient shows through the canvas.
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    // Cap the device-pixel-ratio at 2: retina sharpness without rendering 3–4× the pixels on phones.
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    host.appendChild(this.renderer.domElement);

    // FOV 50°, aspect from the host, near/far clip planes. Pull back so the whole globe is in frame.
    this.camera = new PerspectiveCamera(50, width / height, 0.1, 4000);
    this.camera.position.z = INITIAL_DISTANCE;

    // Studio lighting: bright ambient (flat, fully lit) + a soft directional sun for a little shape.
    this.ambient = new AmbientLight(0xffffff, 0.95);
    this.scene.add(this.ambient);
    this.sun = new DirectionalLight(0xffffff, 0.6);
    this.sun.position.copy(SUN_POSITION);
    this.scene.add(this.sun);

    this.globe = this.buildGlobe();
    this.globe.polygonsData(this.features);
    this.scene.add(this.globe);

    // Invisible sphere at the globe surface — the raycast target for hover picking.
    this.pickSphere = new Mesh(new SphereGeometry(GLOBE_RADIUS, 64, 64), new MeshBasicMaterial());
    this.pickSphere.visible = false;
    this.scene.add(this.pickSphere);

    const dom = this.renderer.domElement;
    dom.addEventListener('pointermove', this.onPointerMove);
    dom.addEventListener('pointerleave', this.onPointerLeave);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // inertia: the globe glides to a stop after a drag
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.6;
    this.controls.enablePan = false; // never slide the globe off-centre
    this.controls.minDistance = 160; // zoom clamps (relative to GLOBE_RADIUS = 100)
    this.controls.maxDistance = 600;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.12; // a slow idle spin

    this.observeResize(host);
    this.start();
  }

  /** Recolour countries from a heat map (ISO alpha-2 → weight). Safe to call repeatedly/live. */
  applyHeat(heat: ReadonlyMap<string, number>): void {
    this.heat = heat;
    this.maxWeight = heat.size > 0 ? Math.max(...heat.values()) : 0;
    this.globe?.polygonsData(this.features); // re-evaluates every cap colour
  }

  /**
   * Register a callback fired whenever the hovered country changes, with its ISO alpha-2 (or null)
   * and the pointer's canvas-pixel position so a page can anchor a hover card to the cursor.
   */
  setHoverHandler(handler: (code: string | null, x: number, y: number) => void): void {
    this.hoverHandler = handler;
  }

  dispose(): void {
    // 1. Stop the loop so no frame runs against a half-freed scene.
    cancelAnimationFrame(this.frameId);
    // 2. Stop observing resize, drop pointer + controls listeners, dispose the pick sphere's GPU mem.
    this.resizeObserver?.disconnect();
    this.controls?.dispose();
    if (this.pickSphere) {
      this.pickSphere.geometry.dispose();
      (this.pickSphere.material as MeshBasicMaterial).dispose();
    }
    // 3. Release the GPU: detach the canvas, dispose the renderer, force the WebGL context to close.
    //    Browsers allow only a handful of live contexts — skipping this leaks one per navigation and
    //    eventually throws "Too many active WebGL contexts".
    if (this.renderer) {
      this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);
      this.renderer.domElement.removeEventListener('pointerleave', this.onPointerLeave);
      this.renderer.domElement.remove();
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }
  }

  private buildGlobe(): ThreeGlobe {
    const globe = new ThreeGlobe()
      .showAtmosphere(true)
      .atmosphereColor(ATMOSPHERE)
      .atmosphereAltitude(0.16)
      .showGraticules(true) // the faint lat/long grid
      .polygonCapColor((feature) => this.capColor(feature as GeoFeature))
      .polygonSideColor(() => 'rgba(40, 60, 80, 0.5)')
      .polygonStrokeColor(() => STROKE)
      .polygonAltitude((feature) => this.capAltitude(feature as GeoFeature))
      // Short transition so the hover lift/whiten + heat recolour feel responsive (default is ~1s).
      .polygonsTransitionDuration(200);

    // A plain lit ocean sphere. (The source uses a cel-shaded toon material — cosmetic, trimmed here.)
    globe.globeMaterial(new MeshPhongMaterial({ color: new Color(OCEAN) }));
    return globe;
  }

  /** A country is "empty" (no liked artists) when its heat weight is zero/absent. */
  private isEmpty(code: string | null): boolean {
    return code === null || (this.heat.get(code) ?? 0) <= 0;
  }

  /** Cap (top face) colour per country: muted when empty, on the heat ramp otherwise, whitened on hover. */
  private capColor(feature: GeoFeature): string {
    const code = isoA2(feature.properties);
    const color = this.isEmpty(code) ? this.empty.clone() : this.weightColor(code);
    if (code !== null && code === this.hoveredCode) {
      color.lerp(HIGHLIGHT, 0.5);
    }
    return color.getStyle();
  }

  /** Heat colour for a country, as a fresh Color (caller may mutate it). */
  private weightColor(code: string | null): Color {
    const weight = code !== null ? (this.heat.get(code) ?? 0) : 0;
    if (weight <= 0 || this.maxWeight <= 0) {
      return this.cold.clone();
    }
    // sqrt spreads the ramp so a few dominant countries don't wash out the rest.
    const intensity = Math.sqrt(weight / this.maxWeight);
    // Interpolate cold → hot in HSL so the two endpoints yield a vivid ramp
    // (a straight RGB lerp would pass through a muddy grey mid-tone).
    return this.cold.clone().lerpHSL(this.hot, intensity);
  }

  /** Lift the hovered country slightly off the sphere so it reads as raised. */
  private capAltitude(feature: GeoFeature): number {
    const code = isoA2(feature.properties);
    return code !== null && code === this.hoveredCode ? 0.03 : 0.006;
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.renderer) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointerPx.x = event.clientX - rect.left;
    this.pointerPx.y = event.clientY - rect.top;
    // Canvas pixels → normalized device coordinates (−1…+1), y flipped (screen y grows downward).
    this.pointer.x = (this.pointerPx.x / rect.width) * 2 - 1;
    this.pointer.y = -(this.pointerPx.y / rect.height) * 2 + 1;
    this.pendingPick = true; // resolved in the render loop to throttle to frame rate
  };

  private readonly onPointerLeave = (): void => {
    this.pendingPick = false;
    this.setHovered(null);
  };

  private pick(): void {
    if (!this.camera || !this.pickSphere || !this.globe) return;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObject(this.pickSphere, false)[0];
    if (hit === undefined) {
      this.setHovered(null);
      return;
    }
    const { lat, lng } = this.globe.toGeoCoords(hit.point);
    this.setHovered(pickCountryCode(this.features, lat, lng));
  }

  private setHovered(code: string | null): void {
    if (code === this.hoveredCode) return;
    this.hoveredCode = code;
    // Stop auto-rotating while inspecting a country so it doesn't drift out from under the cursor.
    if (this.controls) this.controls.autoRotate = this.hoveredCode === null;
    this.globe?.polygonsData(this.features); // re-evaluates cap colour + altitude
    this.hoverHandler?.(code, this.pointerPx.x, this.pointerPx.y);
  }

  private observeResize(host: HTMLElement): void {
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.renderer || !this.camera) return;
      const { clientWidth: width, clientHeight: height } = host;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix(); // must call after changing aspect
      this.renderer.setSize(width, height);
    });
    this.resizeObserver.observe(host);
  }

  private start(): void {
    const tick = (): void => {
      if (this.pendingPick) {
        this.pendingPick = false;
        this.pick();
      }
      this.controls?.update(); // required every frame when damping/auto-rotate are on
      if (this.renderer && this.camera) this.renderer.render(this.scene, this.camera);
      this.frameId = requestAnimationFrame(tick);
    };
    this.frameId = requestAnimationFrame(tick);
  }
}
```

## Done when (this step)
- [ ] `npm run build` is clean. The visible proof comes once heat is fed in (steps 08–09), but you can force it
      now: in the DevTools console after the globe mounts, there's no public hook yet — so instead confirm the
      ramp maths by eye later. For this step, the gate is: build clean, no unused-import warnings (`LAND` is
      gone; `LAND_COLD`/`LAND_HOT`/`LAND_EMPTY` are all referenced).

## If it breaks
- **`Property 'lerpHSL' does not exist on type 'Color'`** → wrong three types version. `lerpHSL` has existed for
  years; ensure `@types/three@~0.184` is installed (M4) and you didn't shadow `Color`.
- **Every country is the same colour** → `applyHeat` never ran with real data (that's steps 08–09), or
  `maxWeight` stayed 0 so every `weightColor` returns `cold`. Expected until the store feeds heat.
- **Land is invisible / all ocean colour** → `capColor` returned an unparseable string. It must return
  `color.getStyle()` (a CSS `rgb(...)`), not the `Color` object.
- **`'LAND' is not defined`** → you kept an M4 reference to the removed flat-land constant. `capColor` now goes
  through `isEmpty`/`weightColor`; there's no `LAND` anymore.

---
> Nav: [← GlobeStore](06_globe-store.md) · [Overview](00_overview.md) · [Canvas heat input →](08_canvas-heat-input.md)
