# M8 · Step 06 of 12 — Grow the renderer: fly the plane + follow camera
> Nav: [← FlightLayer](05_flight-layer.md) · [Overview](00_overview.md) · [Grow the canvas →](07_globe-canvas-flight.md)

## Glossary for this step
> **follow camera** — instead of free-orbiting, the camera eases its *direction* toward the moving marker each
> frame (keeping the orbit distance fixed, so it never zooms). Engaged only while the flight overlay is visible
> and a track is playing; a user drag temporarily yields.
> **time-constant easing** — `alpha = 1 - exp(-dt / τ)`: the fraction to move this frame, derived from real
> elapsed time `dt`, so the follow feels identical at any frame rate and never lurches on a dropped frame.

## Why / design
The renderer owns the `FlightLayer` and is the bridge from the (signal-based) canvas inputs to the (signal-free)
animation. It gains, on top of M5's heat renderer:
- **A `FlightLayer` instance**, built in `init()` after the globe exists, seeded with the country centroids
  (`countryCentroids(features)`) and a hardcoded accent + marker colour. (The marker icon, the terrain-aware
  boat swap, and live colours all arrive in M11 — M8's overlay flies a fixed plane.)
- **`setFlightTarget` / `setFlightVisible`** — the imperative API the canvas `effect()`s call.
  `setFlightTarget` is fed **even while the overlay is hidden**, so the flight keeps advancing in the background.
- **A follow camera.** `trackMarker(dt)` eases the camera's view direction toward `flightLayer.planePosition()`
  each frame. It engages only when the overlay is visible *and* something is playing (`updateFollow`), pauses
  while the user is dragging (OrbitControls `start`/`end` events), and shares one `updateAutoRotate()` gate with
  hover so auto-rotate, hover-inspect, and follow never fight.
- **A flight country tint.** `capColor`/`capAltitude` lift + tint the country the plane is circling
  (`flightLayer.highlightCode()`), and `onHighlightChange` re-runs the polygon draw when it changes.

The render loop stays **signal-free** ([D4](../foundation/decision-log.md#d4--signal-free-render-loop)): `tick()`
computes `dt` from `performance.now()`, optionally follows, updates controls, and calls `flightLayer.update(now)`
— no signal reads anywhere.

> Flight colours (`FLIGHT_ACCENT`, `FLIGHT_MARKER`) are **hardcoded** here. The settings panel that lets the
> user change them — plus the marker-icon picker and the terrain-aware marker system — is M11 (`// grows in
> M11`). This mirrors M5, where the heat-ramp endpoints are hardcoded pending M11's live palette.

## Do this
Replace `src/app/features/globe/globe-renderer.ts` with the version below (it's the M5 renderer plus the flight
integration). The changes vs M5:
1. New imports: `FlightLayer` (from `./flight-layer`), `FlightTarget` (from `./flight-target`),
   and `countryCentroids` (added to the geo-data import).
2. New constants: `FOLLOW_TIME_CONSTANT_MS`, `NOMINAL_FRAME_MS`, `MAX_FRAME_MS`, `FLIGHT_ACCENT`,
   `FLIGHT_MARKER`.
3. New fields + methods for the flight layer and follow camera.
4. `capColor` / `capAltitude` / `setHovered` now account for the flight highlight, via a shared
   `updateAutoRotate()`.
5. `start()` computes `dt`, runs the follow, and calls `flightLayer.update(now)`; `dispose()` tears the layer
   down and removes the drag listeners.

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

import { countryCentroids, GeoFeature, isoA2, pickCountryCode } from '../../core/geo/geo-data';
import { FlightLayer } from './flight-layer';
import { FlightTarget } from './flight-target';

/** three-globe renders the sphere at this radius; frame the camera + picking relative to it. */
const GLOBE_RADIUS = 100;
const INITIAL_DISTANCE = 320;
/**
 * Easing of the follow camera toward the marker, expressed as a time constant (ms) rather than a
 * per-frame factor — so the track stays equally gentle at any frame rate and never lurches on a
 * dropped frame. Larger = a slower, more lagging follow.
 */
const FOLLOW_TIME_CONSTANT_MS = 360;
/** Nominal 60 fps frame, used for the first frame when there's no prior timestamp to diff against. */
const NOMINAL_FRAME_MS = 1000 / 60;
/** Cap a frame's dt so a long stall (e.g. a backgrounded tab) eases gently instead of snapping. */
const MAX_FRAME_MS = 100;
/** White, lerped into the hovered country's cap colour so it reads as highlighted. */
const HIGHLIGHT = new Color(0xffffff);

// Base globe colours. Ocean/stroke/atmosphere hardcoded since M4; the heat-ramp endpoints since M5.
// Live palette customization (reading these from user settings) is M11.
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

// Flight overlay colours, hardcoded in M8. The settings panel that lets the user change the marker
// icon + these colours lands in M11. // grows in M11
const FLIGHT_ACCENT = ATMOSPHERE; // dotted route arcs + the circled-country highlight tint
const FLIGHT_MARKER = '#4cc9f0'; // marker glyph fill (drawn with a black outline)

/**
 * Owns the three.js + three-globe scene for the country globe. Plain three.js with its own render
 * loop — it never touches signals / Angular change detection, which is what keeps the zoneless app
 * cheap. `init(host, features)` once; `applyHeat(map)` to recolour land; `setFlightTarget` /
 * `setFlightVisible` to drive the flight overlay; `dispose()` to tear down. (Live palette + the marker
 * icon are added in M11.)
 */
export class GlobeRenderer {
  private readonly scene = new Scene();
  private renderer?: WebGLRenderer;
  private camera?: PerspectiveCamera;
  private controls?: OrbitControls;
  private globe?: ThreeGlobe;
  private resizeObserver?: ResizeObserver;
  private frameId = 0;
  /** Wall-clock of the previous frame, for frame-rate-independent follow-camera easing. */
  private lastFrameTime = 0;

  private features: GeoFeature[] = [];

  // Heat state: the current per-country weights, the max (hot end of the scale), and the ramp colours.
  private readonly cold = new Color(LAND_COLD);
  private readonly hot = new Color(LAND_HOT);
  private readonly empty = new Color(LAND_EMPTY);
  private heat: ReadonlyMap<string, number> = new Map();
  private maxWeight = 0;

  // Flight state.
  private flightLayer?: FlightLayer;
  /** Tint lerped into the country the plane is currently circling. */
  private readonly flightHighlight = new Color(FLIGHT_ACCENT);
  /** Latest flight directive + whether the user has the overlay switched on — together they decide
   * whether the follow camera engages. The target keeps feeding the layer even while hidden so the
   * flight advances in the background. */
  private flightTarget: FlightTarget | null = null;
  private flightVisible = true;
  /** Steer the camera to keep the moving marker centred (and pause auto-rotate) while following. */
  private follow = false;
  /** True while the user is actively dragging the globe — the follow camera yields so it doesn't fight. */
  private userDragging = false;
  /** Scratch vectors for the follow camera, reused each frame to avoid per-frame allocation. */
  private readonly followDir = new Vector3();
  private readonly markerDir = new Vector3();

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

    // The flight overlay lives inside the globe group, seeded with the country centroids so a flight
    // can circle a country's centroid and arc between them.
    this.flightLayer = new FlightLayer(
      this.globe,
      this.camera,
      countryCentroids(this.features),
      GLOBE_RADIUS,
      FLIGHT_ACCENT,
      FLIGHT_MARKER,
    );
    // Re-draw the polygons when the circled country (flight highlight) changes.
    this.flightLayer.onHighlightChange = () => this.refreshPolygons();

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
    // While the user drags, suspend the follow camera so it stops pulling the view back; once they
    // let go it eases toward the marker again from wherever they left it.
    this.controls.addEventListener('start', this.onControlsStart);
    this.controls.addEventListener('end', this.onControlsEnd);

    this.observeResize(host);
    this.start();
  }

  /** Recolour countries from a heat map (ISO alpha-2 → weight). Safe to call repeatedly/live. */
  applyHeat(heat: ReadonlyMap<string, number>): void {
    this.heat = heat;
    this.maxWeight = heat.size > 0 ? Math.max(...heat.values()) : 0;
    this.globe?.polygonsData(this.features); // re-evaluates every cap colour
  }

  /** Fly the plane for the currently-playing track (circle same country, arc to a new one). Always
   * fed, even while the overlay is hidden, so the flight keeps advancing in the background. */
  setFlightTarget(target: FlightTarget | null): void {
    this.flightTarget = target;
    this.flightLayer?.setTarget(target, performance.now());
    this.updateFollow();
  }

  /**
   * Show or hide the flight overlay without interrupting the flight: the layer keeps animating while
   * hidden, so switching it back on resumes at the plane's live point of the trip. Only follows the
   * marker while the overlay is visible *and* something is playing.
   */
  setFlightVisible(visible: boolean): void {
    this.flightVisible = visible;
    this.flightLayer?.setHidden(!visible);
    this.updateFollow();
  }

  /** Follow the marker only when the overlay is shown and a track is playing; otherwise free-orbit. */
  private updateFollow(): void {
    this.setFollow(this.flightVisible && this.flightTarget !== null);
  }

  private setFollow(on: boolean): void {
    if (on === this.follow) return;
    this.follow = on;
    this.updateAutoRotate();
  }

  /** Auto-rotate only when free-orbiting: never while following the marker or inspecting a country. */
  private updateAutoRotate(): void {
    if (this.controls) this.controls.autoRotate = !this.follow && this.hoveredCode === null;
  }

  /** Re-evaluate polygon cap colour + altitude (hover / flight highlight changed). */
  private refreshPolygons(): void {
    this.globe?.polygonsData(this.features);
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
    // 2. Tear down the flight overlay (arcs, sprite texture, the layer group).
    this.flightLayer?.dispose();
    // 3. Stop observing resize, drop pointer + controls listeners, dispose the pick sphere's GPU mem.
    this.resizeObserver?.disconnect();
    this.controls?.removeEventListener('start', this.onControlsStart);
    this.controls?.removeEventListener('end', this.onControlsEnd);
    this.controls?.dispose();
    if (this.pickSphere) {
      this.pickSphere.geometry.dispose();
      (this.pickSphere.material as MeshBasicMaterial).dispose();
    }
    // 4. Release the GPU: detach the canvas, dispose the renderer, force the WebGL context to close.
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

  /**
   * Cap (top face) colour per country: muted when empty, on the heat ramp otherwise, whitened on
   * hover, or tinted toward the flight accent while the plane circles it.
   */
  private capColor(feature: GeoFeature): string {
    const code = isoA2(feature.properties);
    const color = this.isEmpty(code) ? this.empty.clone() : this.weightColor(code);
    if (code !== null && code === this.hoveredCode) {
      color.lerp(HIGHLIGHT, 0.5);
    } else if (code !== null && code === this.flightLayer?.highlightCode()) {
      color.lerp(this.flightHighlight, 0.6);
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

  /** Lift the hovered or currently-circled country slightly off the sphere so it reads as raised. */
  private capAltitude(feature: GeoFeature): number {
    const code = isoA2(feature.properties);
    const lifted = code === this.hoveredCode || code === this.flightLayer?.highlightCode();
    return code !== null && lifted ? 0.03 : 0.006;
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

  private readonly onControlsStart = (): void => {
    this.userDragging = true;
  };

  private readonly onControlsEnd = (): void => {
    this.userDragging = false;
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
    // Stop auto-rotating while inspecting a country so it doesn't drift out from under the cursor
    // (shared with the follow-camera gate).
    this.updateAutoRotate();
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

  /**
   * Ease the camera so the moving marker stays centred. Keeps the orbit distance fixed (the controls'
   * target is the globe centre) and only rotates the view direction toward the marker, so following
   * never zooms — and the small ease lets a user drag still nudge the view before it eases back.
   */
  private trackMarker(dt: number): void {
    if (!this.camera) return;
    const marker = this.flightLayer?.planePosition();
    if (!marker) return;
    const alpha = 1 - Math.exp(-dt / FOLLOW_TIME_CONSTANT_MS);
    const radius = this.camera.position.length();
    this.markerDir.copy(marker).normalize();
    this.followDir.copy(this.camera.position).normalize().lerp(this.markerDir, alpha);
    this.camera.position.copy(this.followDir.normalize().multiplyScalar(radius));
  }

  private start(): void {
    const tick = (): void => {
      const now = performance.now();
      const dt =
        this.lastFrameTime === 0
          ? NOMINAL_FRAME_MS
          : Math.min(MAX_FRAME_MS, now - this.lastFrameTime);
      this.lastFrameTime = now;
      if (this.pendingPick) {
        this.pendingPick = false;
        this.pick();
      }
      if (this.follow && !this.userDragging) this.trackMarker(dt);
      this.controls?.update(); // required every frame when damping/auto-rotate are on
      this.flightLayer?.update(now); // advance the plane/arc — even while hidden
      if (this.renderer && this.camera) this.renderer.render(this.scene, this.camera);
      this.frameId = requestAnimationFrame(tick);
    };
    this.frameId = requestAnimationFrame(tick);
  }
}
```

## Done when (this step)
- [ ] `npm run build` clean. On `/globe`, the globe still hovers/heats exactly as in M6 (nothing regressed).
- [ ] DevTools → Performance, record ~3 s while the globe spins → still **no** Angular change-detection frames
      per animation frame (the loop stays signal-free). The plane won't move yet — the canvas feeds it next step.

## If it breaks
- **`countryCentroids`/`FlightLayer` not found** → the M8 imports weren't added (see step's imports list); the
  geo helper is exported from `core/geo/geo-data.ts` (since M4).
- **Globe stops auto-rotating even with nothing playing** → `updateAutoRotate()` isn't gating on `!this.follow`
  correctly, or `follow` got stuck true because `updateFollow()` isn't called after `setFlightTarget(null)`.
- **`Cannot read properties of undefined (reading 'setTarget')`** → `setFlightTarget` was called before `init()`
  built `flightLayer`; the `?.` guards this — keep the optional-chaining calls.
- **Follow camera fights the user's drag** → the `start`/`end` OrbitControls listeners didn't register, so
  `userDragging` never flips; confirm they're added in `init()` and removed in `dispose()`.
