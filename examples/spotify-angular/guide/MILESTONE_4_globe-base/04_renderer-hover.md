# M4 · Step 04 of 8 — Add raycast hover picking to the renderer
> Nav: [← Renderer scene](03_renderer-scene.md) · [Overview](00_overview.md) · [Globe canvas →](05_globe-canvas.md)

You edit `globe-renderer.ts` from the previous step to add hover picking: figure out which country the pointer
is over and highlight it. This is an **edit** to the existing file — the complete updated file is shown below
(and again in [`08_verify.md`](08_verify.md)), so you never have to reassemble fragments.

## Glossary for this step
> **Mesh / Geometry / Material (recap)** — a drawable is a **Geometry** (shape) wrapped in a **Material**
> (surface); see [M4/03](03_renderer-scene.md#glossary-for-this-step). The pick sphere below is your first
> hand-built one: `new Mesh(new SphereGeometry(…), new MeshBasicMaterial())`.
> **SphereGeometry** — a sphere *shape*: `new SphereGeometry(radius, widthSegments, heightSegments)`. Here
> `(GLOBE_RADIUS, 64, 64)` is a smooth 64×64-segment sphere at the globe's surface radius, so raycast hits land
> right on the visible surface. [docs](https://threejs.org/docs/#api/en/geometries/SphereGeometry).
> **MeshBasicMaterial** — an **unlit** material: a flat colour that ignores every light. Perfect for the pick
> sphere because it's invisible (`visible = false`) — a raycast target only, so it never needs shading. [docs](https://threejs.org/docs/#api/en/materials/MeshBasicMaterial).
> **Raycaster** — a three.js helper that shoots a ray from the camera through a screen point and reports what it hits. Used here to turn a mouse position into a point on the globe. [docs](https://threejs.org/docs/#api/en/core/Raycaster).
> **NDC (normalized device coordinates)** — the −1…+1 coordinate space the raycaster expects for the pointer: (−1,−1) is bottom-left of the canvas, (+1,+1) top-right. You convert canvas pixels → NDC.
> **pick sphere** — an invisible `Mesh` sphere at the globe's surface radius, used purely as the raycast target. We hit *it* (a clean sphere), then convert the hit point to lat/lng — far cheaper and more robust than raycasting thousands of polygon triangles.
> **`toGeoCoords`** — three-globe's method that converts a 3D point on the globe back to `{ lat, lng }`. [three-globe docs](https://github.com/vasturiano/three-globe).
> **lerp (linear interpolation)** — blend two values by a fraction `t` (0…1): at `t=0` you get the first, at `t=1` the second, in between a mix. `Color.lerp(target, t)` blends colours — the hover code does `capColor.lerp(HIGHLIGHT, 0.5)` to push a country's colour **halfway toward white** so it reads as highlighted. [Color.lerp docs](https://threejs.org/docs/#api/en/math/Color.lerp).

## Why / design
Hover picking is a four-hop pipeline, and each hop is a small, well-known trick:

> **Mental model — screen → country in four hops.**
> 1. **pointermove** records the cursor in canvas pixels, converts to **NDC**, and sets a `pendingPick` flag.
> 2. The **render loop** (not the event) resolves the pick — so we pick at most once per frame no matter how
>    fast the mouse moves (natural throttling; the loop is already running).
> 3. The **raycaster** shoots through the NDC point at the invisible **pick sphere**; the hit point →
>    `toGeoCoords` → `{ lat, lng }`.
> 4. `pickCountryCode` (from `geo-data.ts`) point-in-polygons the lat/lng → an **ISO_A2** code (or `null` over
>    ocean). If it changed, we redraw the caps (so the hovered one lifts + whitens), pause auto-rotate, and
>    call the **hover handler** — the callback the canvas registers to forward the code to Angular.

The hover handler is the renderer's *outbound* seam: instead of the renderer knowing about Angular, the canvas
hands it a plain callback (`setHoverHandler`) and the renderer just calls it. Same signal-free discipline as
the render loop.

## Do this
1. **Add the new imports** to the top of `globe-renderer.ts`: `Mesh`, `MeshBasicMaterial`, `Raycaster`,
   `SphereGeometry`, `Vector2` (from `three`), and `pickCountryCode` (from `../../core/geo/geo-data`).
2. **Add the hover fields** (raycaster, pointer vector, pick sphere, `pendingPick`, pointer-pixel record, and
   the `hoverHandler` slot).
3. **In `init`**, after adding the globe: create the invisible pick sphere and add it to the scene; register
   the `pointermove` / `pointerleave` listeners on the canvas.
4. **Add `setHoverHandler`**, the pointer handlers, `pick()`, and `setHovered()`.
5. **In `start()`**, resolve a pending pick at the top of each frame.
6. **In `dispose()`**, remove the pointer listeners and dispose the pick sphere's geometry + material — its GPU
   memory leaks otherwise.
7. Replace your file with the complete version below (it folds in all of the above).

> The `OrbitControls` block is unchanged from step 03. Reminder: `dampingFactor = 0.08` (three.js default
> **0.05**), `rotateSpeed = 0.6` (default **1.0**), and `autoRotateSpeed = 0.12` (default **2.0**) are
> deliberate overrides — keep the exact numbers. Note the one hover-related tweak in this step: `autoRotate`
> is now toggled off whenever a country is hovered (`controls.autoRotate = this.hoveredCode === null`).

## Code
### `src/app/features/globe/globe-renderer.ts`  *(complete — the M4 renderer)*
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
 * cheap. `init(host, features)` once; `setHoverHandler` to be told which country is hovered;
 * `dispose()` to tear down. (Heat/flight/palette are added in later milestones.)
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
      // Short transition so the hover lift/whiten feels responsive (default is ~1s).
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

> **Why the handlers are arrow-function fields.** `onPointerMove`/`onPointerLeave` are declared as `= (…) =>`
> so `this` stays bound to the renderer instance, and so the **exact same function reference** can be both
> added and removed (`addEventListener`/`removeEventListener`). A normal method would need `.bind(this)` and
> couldn't be un-registered — a subtle leak.

## Done when (this step)
- [ ] `npm run build` → compiles clean (the new `three` imports and `pickCountryCode` resolve).
- [ ] The class now exposes `init`, `setHoverHandler`, and `dispose` — the exact surface the canvas component
      (next step) calls. No heat/flight/palette methods exist (correct for M4).

## If it breaks
- **`Property 'toGeoCoords' does not exist on type 'ThreeGlobe'`** → your `three-globe` isn't `2.45.2`. Re-pin
  it (step 01). `toGeoCoords` is a three-globe instance method.
- **Removing the listener doesn't work / leak on dispose** → you rewrote the handlers as methods. Keep them as
  arrow-function class fields so the reference is stable.
- **Hover picks the wrong / no country later** → that's `geo-data.ts`, not this file; confirm the GeoJSON has
  `ISO_A2` (step 01) — `pickCountryCode` returns `null` when no polygon contains the point.

---
> Nav: [← Renderer scene](03_renderer-scene.md) · [Overview](00_overview.md) · [Globe canvas →](05_globe-canvas.md)
