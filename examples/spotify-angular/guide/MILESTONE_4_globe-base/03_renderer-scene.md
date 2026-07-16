# M4 · Step 03 of 8 — `globe-renderer.ts`: scene, camera, renderer, globe, loop, disposal
> Nav: [← Geo data](02_geo-data.md) · [Overview](00_overview.md) · [Renderer hover →](04_renderer-hover.md)

This is the heart of the milestone: the plain three.js class that owns the globe. You build it in two steps —
**this** step gets everything except hover picking (a rotating, orbitable, cleanly-disposing globe); the
[next step](04_renderer-hover.md) adds raycast hover. Both steps show the whole file at its current state, so
you always have a complete file to paste.

## Glossary for this step
Everything here is three.js — the deepest-taught topic. Each term links the official docs.
> **Mesh = Geometry + Material** — the one mental model under everything three.js draws, so learn it first. A
> **Geometry** is the *shape* (its vertices and faces — a sphere, a cone); a **Material** is the *surface* (its
> colour and how it reacts to light). A **Mesh** is a single Geometry wrapped in a single Material — the actual
> drawable object you add to the [Scene](https://threejs.org/docs/#api/en/objects/Mesh). three-globe builds the
> sphere + country-cap meshes for you in this step; you only hand it the ocean's **material** below, and you'll
> build your first Mesh by hand in the next step (the invisible pick sphere).
> **Material** — the surface half of the pair: colour + lighting response. A *light-responsive* material renders
> **black** with no light in the scene (why the lights below exist); an *unlit* one ignores light entirely.
> **MeshPhongMaterial** — a light-responsive material (Phong shading): soft highlights, and black without a
> light. Used for the ocean sphere so the ambient + directional "sun" give it shape. [docs](https://threejs.org/docs/#api/en/materials/MeshPhongMaterial).
> **Scene** — the container/graph of everything to be drawn (globe, lights, camera targets). [docs](https://threejs.org/docs/#api/en/scenes/Scene).
> **PerspectiveCamera** — the viewpoint; parameters are field-of-view, aspect ratio, and near/far clip planes. [docs](https://threejs.org/docs/#api/en/cameras/PerspectiveCamera).
> **WebGLRenderer** — draws a scene from a camera onto a `<canvas>` using the GPU (WebGL). Owns the GPU **context** you must later release. [docs](https://threejs.org/docs/#api/en/renderers/WebGLRenderer).
> **render loop** — a function that draws one frame then schedules the next via **`requestAnimationFrame`** (the browser's "call me before the next repaint" hook, ~60/s). [rAF docs](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame).
> **OrbitControls** — a three.js add-on that turns pointer drag/scroll into camera orbit + zoom around a target. [docs](https://threejs.org/docs/#examples/en/controls/OrbitControls).
> **disposal** — three.js allocates GPU memory (geometries, materials, the WebGL context) that JavaScript's garbage collector **cannot** reclaim. You must call `.dispose()` yourself or the memory leaks. This is the single most common three.js-in-a-SPA bug.
> **`ResizeObserver`** — a browser API (not three.js) that fires a callback whenever an element's box size changes. We watch the host `<div>` with it so the camera aspect + canvas size stay correct when the window/layout resizes. [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver).

## Why / design — the signal-free render loop
This class is **plain three.js**. It imports nothing from Angular, holds no signals, and its render loop never
touches change detection. That is the whole point of
[decision-log D4](../foundation/decision-log.md#d4--signal-free-render-loop):

> **Mental model — two worlds, one seam.** Angular's reactive world (signals, CD) and three.js's imperative
> world (mutate objects, draw a frame) run side by side. If the render loop read a signal every frame, our
> [zoneless](../foundation/glossary.md#zoneless) app would re-run change detection ~60×/second and the "cheap"
> promise of zoneless evaporates. So the loop stays signal-free; the **only** bridge is the canvas component
> (step 05), which pushes values *into* imperative methods. Keep that wall in your head for the rest of the app.

The lifecycle is three methods: `init(host, features)` builds the scene and starts the loop; (step 04 adds
`setHoverHandler`); `dispose()` tears everything down. `init` takes the already-loaded features so the renderer
never does I/O or dependency injection — it stays a pure, testable, framework-free object.

> **Why lights at all?** three-globe's ocean sphere and country caps use light-responsive materials, so without
> a light they'd render black. M4 uses fixed **studio** lighting (bright ambient + a soft directional sun).
> M5/M11 add live palette + day/night methods — **out of scope here**.

## Do this
1. **Create `src/app/features/globe/globe-renderer.ts`** with the file below. It's long; read the section
   comments as you paste — they are the lesson.
2. **Understand the constructor-to-loop flow** (`init`):
   1. Build the `WebGLRenderer`, size it to the host element, append its `<canvas>` to the DOM.
   2. Build the `PerspectiveCamera` and pull it back to `INITIAL_DISTANCE` so the whole globe is in frame.
   3. Add an ambient light + a directional "sun" so the materials are lit.
   4. Build the three-globe object, hand it the features via `.polygonsData(...)`, add it to the scene.
   5. Wire `OrbitControls` (damped drag, clamped zoom, **no pan**, gentle auto-rotate).
   6. Observe host resize (keep the camera aspect + canvas size correct).
   7. `start()` the `requestAnimationFrame` loop.

   > **These three `OrbitControls` values deliberately override the three.js defaults** — they're what give the
   > globe its calm feel, so use the exact numbers:
   > - `dampingFactor = 0.08` (default **0.05**) — a touch more glide after a drag.
   > - `rotateSpeed = 0.6` (default **1.0**) — a slower, less twitchy drag.
   > - `autoRotateSpeed = 0.12` (default **2.0**) — a barely-there idle spin, not the default fast turntable.
   >
   > `enableDamping`/`autoRotate` default to `false`; we set both `true`. Everything else on the controls stays
   > at its default.
   >
   > **The other hand-picked scene values** are look-and-feel, not load-bearing — retune them freely:
   > - Camera **FOV `50`** — the vertical field of view in degrees. ~50° is a natural, low-distortion lens for a
   >   single centred object (three.js's `PerspectiveCamera` has no "standard" default — you always pass one; a
   >   wide 75° would fish-eye the globe, a narrow 25° would flatten it).
   > - `atmosphereAltitude(0.16)` — the glow shell's thickness as a fraction of the globe radius (three-globe's
   >   default is **0.15**); 0.16 gives a slightly softer halo.
   > - `AmbientLight(…, 0.95)` and `DirectionalLight(…, 0.6)` — light **intensities** (three.js defaults are
   >   **1.0** for both). The bright, near-flat ambient plus a dimmer directional "sun" is deliberate *studio*
   >   lighting so the globe reads evenly lit with just a hint of shape, rather than half in shadow.
3. **Note the load-bearing constants.** `GLOBE_RADIUS = 100` is three-globe's fixed sphere radius — the pick
   sphere (next step) and camera clamps are all relative to it; don't change it in isolation. The colour
   constants are **cosmetic** (rename/retint freely). `polygonsTransitionDuration(200)` keeps the hover
   lift/whiten snappy (three-globe's default is ~1 s).

## Code
### `src/app/features/globe/globe-renderer.ts`  *(M4 intermediate — hover picking added next step)*
```ts
import {
  AmbientLight,
  Color,
  DirectionalLight,
  MeshPhongMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import ThreeGlobe from 'three-globe';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { GeoFeature, isoA2 } from '../../core/geo/geo-data';

/** three-globe renders the sphere at this radius; frame the camera + picking relative to it. */
const GLOBE_RADIUS = 100;
const INITIAL_DISTANCE = 320;
/** White, lerped into the hovered country's cap colour so it reads as highlighted. */
const HIGHLIGHT = new Color(0xffffff);

// Base globe colours. Hardcoded for M4; M5 makes land encode heat, M11 makes them live from settings.
const OCEAN = '#112233';
const LAND = '#7fa8c9';
const STROKE = '#9fe0cf';
const ATMOSPHERE = '#a9d4f0';
/** Where the single "sun" sits — a soft directional light so the sphere isn't flat. */
const SUN_POSITION = new Vector3(-200, 120, 220);

/**
 * Owns the three.js + three-globe scene for the country globe. Plain three.js with its own render
 * loop — it never touches signals / Angular change detection, which is what keeps the zoneless app
 * cheap. `init(host, features)` once; `dispose()` to tear down. (Hover picking is added next step;
 * heat/flight/palette are added in later milestones.)
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
  /** ISO alpha-2 of the country under the pointer (set by hover picking, added next step). */
  private hoveredCode: string | null = null;

  private ambient?: AmbientLight;
  private sun?: DirectionalLight;

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

  dispose(): void {
    // 1. Stop the loop so no frame runs against a half-freed scene.
    cancelAnimationFrame(this.frameId);
    // 2. Stop observing resize and drop the controls' own listeners.
    this.resizeObserver?.disconnect();
    this.controls?.dispose();
    // 3. Release the GPU: detach the canvas, dispose the renderer, force the WebGL context to close.
    //    Browsers allow only a handful of live contexts — skipping this leaks one per navigation and
    //    eventually throws "Too many active WebGL contexts".
    if (this.renderer) {
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
      // Short transition so the hover lift/whiten (next step) feels responsive (default is ~1s).
      .polygonsTransitionDuration(200);

    // A plain lit ocean sphere. (The source uses a cel-shaded toon material — cosmetic, trimmed here.)
    globe.globeMaterial(new MeshPhongMaterial({ color: new Color(OCEAN) }));
    return globe;
  }

  /** Cap (top face) colour per country: flat land, brightened toward white when hovered. */
  private capColor(feature: GeoFeature): string {
    const code = isoA2(feature.properties);
    const color = new Color(LAND);
    if (code !== null && code === this.hoveredCode) {
      color.lerp(HIGHLIGHT, 0.5);
    }
    return color.getStyle();
  }

  /** Lift the hovered country slightly off the sphere so it reads as raised. */
  private capAltitude(feature: GeoFeature): number {
    const code = isoA2(feature.properties);
    return code !== null && code === this.hoveredCode ? 0.03 : 0.006;
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
      this.controls?.update(); // required every frame when damping/auto-rotate are on
      if (this.renderer && this.camera) this.renderer.render(this.scene, this.camera);
      this.frameId = requestAnimationFrame(tick);
    };
    this.frameId = requestAnimationFrame(tick);
  }
}
```

> **Scope flags.** This file has **no** `applyHeat` (M5), **no** flight fields/methods (M8), and **no**
> `applyPalette`/`setLighting`/`setMarkerIcon` (M5/M11) — all deliberately deferred per the overview's Scope
> discipline. `hoveredCode` and the hover branches in `capColor`/`capAltitude` are wired but only *set* once
> the next step adds the pointer handlers.

## Done when (this step)
- [ ] `npm run build` → compiles clean.
- [ ] (You can't see it on screen until the canvas component mounts it in step 05 — this step's gate is the
      clean build. The visual gate lands in step 08's verify.)

## If it breaks
- **`Cannot find module 'three/examples/jsm/controls/OrbitControls.js'`** → the `.js` extension is required in
  the import path, and `@types/three` (step 01) must be installed. Check both.
- **TS complains `feature` is `object`, not `GeoFeature`** → keep the `as GeoFeature` casts in the
  `polygonCapColor`/`polygonAltitude` callbacks; three-globe types the feature loosely.
- **`ThreeGlobe is not a constructor`** → use the default import `import ThreeGlobe from 'three-globe'`, not a
  named import.

---
> Nav: [← Geo data](02_geo-data.md) · [Overview](00_overview.md) · [Renderer hover →](04_renderer-hover.md)
