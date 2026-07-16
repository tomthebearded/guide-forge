# M4 · Verify — The globe (three.js, no data)
> Nav: [← Globe route](07_globe-route.md) · [Overview](00_overview.md) · [Country resolution + heat →](../MILESTONE_5_country-resolution-heat/00_overview.md)

Run `ng serve --host 127.0.0.1 --port 4200` and work the gate by hand. Then confirm every file matches the
checkpoint below.

## Done-when gate (the real test — check every box by hand)
- [ ] **Pre-flight quality bar:** `npm run format:check`, `npm run lint`, `npm run build` → all exit `0`, no
      errors. The build output lists a separate lazy chunk for `globe-page`.
- [ ] **The globe mounts and self-animates.** Navigate to `http://127.0.0.1:4200/globe` → a blue globe with
      cyan country outlines and a faint lat/long grid fades in over the space-gradient background and **rotates
      slowly on its own** with no input.
- [ ] **OrbitControls work.** Drag → the globe orbits and glides to a stop (damping). Scroll → it zooms, but
      **clamps** (can't zoom closer than ~160 or past ~600 units). It **never pans** off-centre.
- [ ] **Hover highlights the correct country (raycast → ISO_A2).** Move the pointer over Brazil → that country
      **lifts slightly off the sphere and brightens toward white**, the idle rotation **pauses**, and the
      top-left readout reads `Hovering: BR`. Over the United States → `Hovering: US`. Over open ocean → the
      country drops back and the readout reads `Hovering: —`, rotation resumes.
- [ ] **The render loop never touches change detection.** Open DevTools → Performance, record ~3 s while just
      letting the globe spin (no interaction). The flame chart shows `requestAnimationFrame` / three.js
      `render` work each frame but **no Angular change-detection / `tick` frames** firing per animation frame.
- [ ] **Clean disposal, no leak.** From `/globe`, navigate back to your home/landing route, then return to
      `/globe`. Repeat ~5 times. Console shows **no errors** and **no** `WARNING: Too many active WebGL
      contexts` message; each departure removes the `<canvas>` from the DOM (inspect the page — only one canvas
      exists while on `/globe`, none after leaving).

## Files after this milestone (complete — the checkpoint)

### `public/geo/countries-110m.geo.json`
> Data asset (~800 KB, Natural Earth 110m admin-0 countries) — not reproduced here. It's the file you placed
> in step 01; each feature's `properties` carries `ISO_A2`, `ADMIN`/`NAME`, and `CONTINENT`.

### `src/app/core/models/country.ts`
```ts
/** A selectable country for the manual-override picker. */
export interface Country {
  /** ISO 3166-1 alpha-2. */
  code: string;
  name: string;
}
```

### `src/app/core/geo/geo-data.ts`
```ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Country } from '../models/country';

const COUNTRIES_URL = 'geo/countries-110m.geo.json';

/** GeoJSON polygon geometries — the only shapes the Natural Earth country file contains. */
export type GeoGeometry =
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] };

export interface GeoFeature {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: GeoGeometry;
}

interface GeoCollection {
  features: GeoFeature[];
}

/** Loads the bundled Natural Earth country polygons once and shares them (renderer + picker). */
@Injectable({ providedIn: 'root' })
export class GeoData {
  private readonly http = inject(HttpClient);
  private cached?: Promise<GeoFeature[]>;

  features(): Promise<GeoFeature[]> {
    // Don't cache a rejected fetch: drop it on failure so a transient error (offline, blip) can
    // retry on the next call instead of permanently breaking the globe and country picker.
    this.cached ??= firstValueFrom(this.http.get<GeoCollection>(COUNTRIES_URL))
      .then((collection) => collection.features)
      .catch((error: unknown) => {
        this.cached = undefined;
        throw error;
      });
    return this.cached;
  }

  /** Distinct, name-sorted countries that exist on the globe — the manual-picker options. */
  async countries(): Promise<Country[]> {
    const features = await this.features();
    const byCode = new Map<string, Country>();
    for (const feature of features) {
      const code = isoA2(feature.properties);
      const name = countryName(feature.properties);
      if (code !== null && name !== null && !byCode.has(code)) {
        byCode.set(code, { code, name });
      }
    }
    return [...byCode.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  /** ISO alpha-2 → continent name (Natural Earth `CONTINENT`), for the trip's journey stats. */
  async continents(): Promise<Map<string, string>> {
    const features = await this.features();
    const byCode = new Map<string, string>();
    for (const feature of features) {
      const code = isoA2(feature.properties);
      const continent = feature.properties['CONTINENT'];
      if (code !== null && typeof continent === 'string' && continent.length > 0) {
        byCode.set(code, continent);
      }
    }
    return byCode;
  }
}

/** Natural Earth uses `-99` placeholders; prefer ISO_A2, fall back to the "EH" variant. */
export function isoA2(properties: Record<string, unknown>): string | null {
  for (const key of ['ISO_A2', 'ISO_A2_EH']) {
    const value = properties[key];
    if (typeof value === 'string' && value.length === 2) {
      return value.toUpperCase();
    }
  }
  return null;
}

function countryName(properties: Record<string, unknown>): string | null {
  const value = properties['ADMIN'] ?? properties['NAME'];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** A representative point on the globe, in degrees. */
export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * ISO alpha-2 → centroid of each country's largest landmass — where the flight plane sits/circles.
 * Uses the polygon-area centroid of the biggest ring so overseas territories don't skew the point.
 */
export function countryCentroids(features: GeoFeature[]): Map<string, LatLng> {
  const centroids = new Map<string, LatLng>();
  for (const feature of features) {
    const code = isoA2(feature.properties);
    if (code === null || centroids.has(code)) {
      continue;
    }
    const centroid = largestRingCentroid(feature.geometry);
    if (centroid !== null) {
      centroids.set(code, centroid);
    }
  }
  return centroids;
}

/** Outer ring (per GeoJSON, rings[0]) of the largest-area polygon, reduced to its area-centroid. */
function largestRingCentroid(geometry: GeoGeometry): LatLng | null {
  const outerRings =
    geometry.type === 'Polygon'
      ? [geometry.coordinates[0]]
      : geometry.coordinates.map((polygon) => polygon[0]);

  let best: LatLng | null = null;
  let bestArea = -1;
  for (const ring of outerRings) {
    if (ring === undefined || ring.length < 3) {
      continue;
    }
    const { area, centroid } = ringAreaCentroid(ring);
    if (area > bestArea) {
      bestArea = area;
      best = centroid;
    }
  }
  return best;
}

/** Signed-area polygon centroid (degenerate rings fall back to the vertex average). */
function ringAreaCentroid(ring: number[][]): { area: number; centroid: LatLng } {
  let twiceArea = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    const cross = xj! * yi! - xi! * yj!;
    twiceArea += cross;
    cx += (xj! + xi!) * cross;
    cy += (yj! + yi!) * cross;
  }
  if (twiceArea === 0) {
    const avg = ring.reduce((acc, [x, y]) => ({ x: acc.x + x!, y: acc.y + y! }), { x: 0, y: 0 });
    return { area: 0, centroid: { lng: avg.x / ring.length, lat: avg.y / ring.length } };
  }
  return {
    area: Math.abs(twiceArea) / 2,
    centroid: { lng: cx / (3 * twiceArea), lat: cy / (3 * twiceArea) },
  };
}

/** Mean Earth radius in km — for the great-circle distance between two centroids. */
const EARTH_RADIUS_KM = 6371;

/** Great-circle (haversine) distance in km between two lat/lng points. */
export function greatCircleKm(a: LatLng, b: LatLng): number {
  const toRad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toRad;
  const dLng = (b.lng - a.lng) * toRad;
  const lat1 = a.lat * toRad;
  const lat2 = b.lat * toRad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** ISO alpha-2 of the country whose polygon contains (lat, lng), or null (e.g. over ocean). */
export function pickCountryCode(features: GeoFeature[], lat: number, lng: number): string | null {
  for (const feature of features) {
    if (geometryContains(feature.geometry, lng, lat)) {
      return isoA2(feature.properties);
    }
  }
  return null;
}

function geometryContains(geometry: GeoGeometry, x: number, y: number): boolean {
  return geometry.type === 'Polygon'
    ? polygonContains(geometry.coordinates, x, y)
    : geometry.coordinates.some((polygon) => polygonContains(polygon, x, y));
}

/** First ring is the outer boundary; any further rings are holes. */
function polygonContains(rings: number[][][], x: number, y: number): boolean {
  if (rings.length === 0 || !ringContains(rings[0]!, x, y)) {
    return false;
  }
  for (let i = 1; i < rings.length; i++) {
    if (ringContains(rings[i]!, x, y)) {
      return false;
    }
  }
  return true;
}

/** Even-odd ray-casting test over a ring of [lng, lat] vertices. */
function ringContains(ring: number[][], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    if (yi! > y !== yj! > y && x < ((xj! - xi!) * (y - yi!)) / (yj! - yi!) + xi!) {
      inside = !inside;
    }
  }
  return inside;
}
```

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

### `src/app/features/globe/globe-canvas/globe-canvas.ts`
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

### `src/app/features/globe/globe-page/globe-page.ts`
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

### `src/app/app.routes.ts` *(unchanged in M4 — shown complete; the `globe` route already exists from M0, guarded in M1)*
```ts
import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth-guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'globe' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./features/auth/callback-page/callback-page').then((m) => m.CallbackPage),
  },
  {
    path: 'globe',
    canActivate: [authGuard],
    loadComponent: () => import('./features/globe/globe-page/globe-page').then((m) => m.GlobePage),
  },
  { path: '**', redirectTo: 'globe' },
];
```
> M4/07 "wires" the globe route conceptually — connecting the now-real `GlobePage` to the URL — but the route
> object itself has existed since M0 and was guarded in M1, so no line of this file changes here.

## What you have now (cumulative)
The zoneless `spotify-angular` app runs with PKCE login (M1), the HTTP resilience layer (M2), and Liked Songs
streaming with a live count (M3). New in M4: a memoized geo-data service + pure geo functions, a signal-free
three.js `GlobeRenderer` that owns its render loop and disposes cleanly, the `globe-canvas` lifecycle bridge,
and a `globe-page` skeleton reachable at `/globe`. You can orbit a living globe and hover-pick countries — but
no library data colours it yet (that's M5).

## Troubleshooting
| Symptom | Likely cause → fix |
|---------|--------------------|
| Globe is black / no ocean | Materials rendering unlit — confirm the `AmbientLight` + `DirectionalLight` are added in `init` (step 03/04). |
| Country outlines but no filled land | GeoJSON reached the globe but `polygonsData` got an empty array, or features lack `ISO_A2` — recheck step 01's file. |
| `Too many active WebGL contexts` after a few nav round-trips | `dispose()` isn't running: the cleanup must be in `DestroyRef.onDestroy` (step 05) and the route must be lazy so the component is destroyed (step 07). |
| Hover never fires / readout stuck on `—` | `setHoverHandler` called *after* `init`, or `#host` template ref missing — check step 05. |
| Readout shows a code but the wrong country | Point-in-polygon mismatch — usually a GeoJSON without proper `ISO_A2`; use the Natural Earth admin_0 export (step 01). |
| Frame rate tanks / CD churns each frame | Something in the loop touches a signal. The loop must stay signal-free ([D4](../foundation/decision-log.md#d4--signal-free-render-loop)); the only bridge is the canvas component. |
| `/globe` blank, `NG04002` | Route object not inside the exported `routes` array, or a `**` wildcard precedes it — move the wildcard last (step 07). |

## Next
Continue to **[M5 — Country resolution + heat 🚦](../MILESTONE_5_country-resolution-heat/00_overview.md)** — the
reality-check gate: resolve liked artists to ISO countries, build a heat map, and light up the globe by how
much of your library comes from each country (adds the `heat` input + first `effect()` bridge + `applyHeat`).

---
> Nav: [← Globe route](07_globe-route.md) · [Overview](00_overview.md) · [Country resolution + heat →](../MILESTONE_5_country-resolution-heat/00_overview.md)
