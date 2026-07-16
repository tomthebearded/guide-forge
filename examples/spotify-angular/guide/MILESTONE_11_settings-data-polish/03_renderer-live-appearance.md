# M11 · Step 03 of 10 — Grow the flight layer (marker engine) + the renderer (live palette, lighting, PNG)
> Nav: [← The settings store](02_settings-store.md) · [Overview](00_overview.md) · [Grow the canvas →](04_canvas-palette-capture.md)

> **This step touches 2 files, committed together:** `features/globe/flight-layer.ts` (regains the full marker
> engine) and `features/globe/globe-renderer.ts` (live palette/lighting/PNG). The renderer constructs the 8-arg
> `FlightLayer`, so it **won't compile without the grown layer** — the two land in one commit, layer first.

## Glossary for this step
> **PNG data URL** — a string like `data:image/png;base64,…` produced by `canvas.toDataURL('image/png')`; it can
> be set as a link's `href` + `download` to save the image, no server round-trip.

> 📚 New concept — [`preserveDrawingBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext):
> a WebGL context flag. By default the GPU is free to clear (and reuse) the drawing buffer right after each
> present, so reading it back with `toDataURL` after the fact returns a **blank** image. Setting
> `preserveDrawingBuffer: true` keeps the last frame readable. It costs a little memory/perf — fine for one
> globe — and it's the only way the "Save image" feature can work.

## Why / design
Two files grow here, and the order matters: the **flight layer** regains its full marker engine first, then the
**renderer** reconstructs it (8 args) and drives it. M8's overlay was plane-only; M11 is the milestone whose
settings panel actually picks an icon, so this is where that engine belongs.

The **flight layer** grows from the plane-only M8 version into the full marker system:
- **Imports `MarkerKind`** from `core/cache/appearance-cache` (born in step 01).
- **Constructor regains `markerKind` + `isWater`** — the two params M8 dropped (8 args again).
- **Restores the marker constants/fields/methods** — `MARKER_FORWARD` / `MIRROR_KINDS` / `TERRAIN_KINDS` /
  `TERRAIN_CHECK_MS`; the `selectedKind` / `displayedKind` / `isWater` / `facingMirror` / `lastTerrainCheck`
  fields; `setMarker` / `setAccent` / `setMarkerColor` / `refreshMarker` / `renderGlyph` / `setMirror` /
  `currentLatLng`; the throttled terrain-check block in `update()`; and the six glyph drawings
  (`drawBoat` / `drawCar` / `drawTrain` / `drawBike` / `drawRecord` + the `♫` note). `makeMarkerTexture` /
  `drawGlyphCanvas` regain their `kind` switch.

The M8 renderer hard-coded its colours (`OCEAN`, `STROKE`, `ATMOSPHERE`, `LAND_COLD/HOT`, the flight accent +
marker) and ran one flat studio-lighting setup, and flew a fixed plane. M11 makes all of that **live**, driven
by the settings store, while the render loop stays **signal-free**
([D4](../foundation/decision-log.md#d4--signal-free-render-loop)) — the canvas calls these imperative methods;
the renderer never reads a signal. Five additions to the renderer:
- **`readPalette()` + a `palette` field.** The renderer reads the same CSS custom properties as its *initial*
  seed (so `init()` has colours before the canvas pushes any), reusing the store's `LivePalette` type. The
  colour constants are gone; `buildGlobe()` and the cap/stroke callbacks read `this.palette` / `this.cold` /
  `this.hot`.
- **A `markerIcon` field + `setMarkerIcon(kind)`** and the 8-arg `FlightLayer` construction (marker icon +
  the `isWater` lambda) — new here, since M8's renderer never carried them.
- **`applyPalette(palette)`** — recolours everything live: heat endpoints, the flight-highlight tint, the
  atmosphere, the ocean material, and (via `flightLayer.setAccent` / `setMarkerColor`, both added above) the
  arcs + marker. A `refreshPolygons()` redraw re-runs the cap/stroke callbacks so strokes + heat pick up the
  new palette.
- **`setLighting(dayMode)`** — rebalances the ambient + sun intensities between a flat, fully-lit **studio**
  look and a single-sun **day** look (one lit hemisphere, dark night side). The lights already exist from M8;
  this just retunes their intensities.
- **`captureImage()`** — renders one frame onto a solid space-coloured background (the canvas is normally
  transparent, so a transparent screenshot looks wrong), reads it back as a PNG data URL, then restores
  transparency. Needs `preserveDrawingBuffer: true` on the `WebGLRenderer`.

> `LAND_EMPTY` (no-artist countries) stays a hard-coded constant — it isn't in `LivePalette`, matching the
> source's field set.

## Do this
1. Replace `src/app/features/globe/flight-layer.ts` with the marker-complete version below (the plane-only M8
   file grown back into the full marker engine — `MarkerKind` import, 8-arg constructor, marker
   constants/fields/methods, and the six glyph drawings). Paste it whole.
2. Replace `src/app/features/globe/globe-renderer.ts` with the version below. Changes vs M8:
   1. Imports: add `import { MarkerKind } from '../../core/cache/appearance-cache';` (new) and
      `import { LivePalette } from '../settings/settings-store';`; keep `FlightLayer` from `./flight-layer`.
   2. Constants: delete `OCEAN` / `STROKE` / `ATMOSPHERE` / `LAND_COLD` / `LAND_HOT` / `FLIGHT_ACCENT` /
      `FLIGHT_MARKER`; keep `LAND_EMPTY`; add the `LIGHTING` object.
   3. Fields: add `palette` (seeded from `readPalette()`) + the `markerIcon` field; `cold` / `hot` /
      `flightHighlight` become non-`readonly` (they're reassigned by `applyPalette`).
   4. `init()`: re-seed from `readPalette()`; add `preserveDrawingBuffer: true`; construct the flight layer
      (8 args, with the `isWater` lambda) + globe from `this.palette`.
   5. Add `captureImage()`, `applyPalette()`, `setLighting()`, `setMarkerIcon()`; add the `readPalette()`
      helper at the bottom.

## Code
### `src/app/features/globe/flight-layer.ts`
Grow the plane-only M8 overlay into the full marker engine. It imports `MarkerKind` from `appearance-cache`
(step 01), the constructor regains its `markerKind` + `isWater` params, and the marker constants / fields /
methods / glyph drawings are all restored so the renderer below can construct it (8 args) and drive
`setMarker` / `setAccent` / `setMarkerColor`. Paste the file whole.

```ts
import {
  BufferGeometry,
  type Camera,
  CanvasTexture,
  Color,
  ConeGeometry,
  Group,
  Line,
  LineDashedMaterial,
  Mesh,
  MeshBasicMaterial,
  QuadraticBezierCurve3,
  Sprite,
  SpriteMaterial,
  Texture,
  Vector3,
} from 'three';
import type ThreeGlobe from 'three-globe';

import { MarkerKind } from '../../core/cache/appearance-cache';
import { LatLng } from '../../core/geo/geo-data';
import { FlightTarget } from './flight-target';

const DEG2RAD = Math.PI / 180;

/** Plane sits/circles clearly above the surface so its sprites never clip into terrain. */
const PLANE_ALT = 0.13;
/** Arc endpoints ride at cruise altitude so a flight departs/arrives continuous with the circle —
 * no vertical pop down to the surface and back. The trail bows higher than this between them. */
const ARC_MIN_ALT = 0.14;
const ARC_DIST_ALT = 0.55;

/** Circle radius around the country centroid, in degrees, and one loop's period. */
const CIRCLE_RADIUS_DEG = 7;
const CIRCLE_PERIOD_MS = 9000;

/**
 * Easing of the marker's heading toward its travel direction, expressed as a time constant (ms)
 * rather than a per-frame factor — so the turn rate is identical whether frames arrive every 8 ms or
 * 33 ms, and a dropped frame can't make the heading lurch to catch up to the time-based position.
 * Larger = a softer, slower turn.
 */
const ROTATION_TIME_CONSTANT_MS = 100;
/**
 * Subtle bank: the marker leans into a turn by an extra roll proportional to how fast its heading is
 * changing (rad/s), clamped so a hard turn never rolls it flat. Purely cosmetic; directional glyphs
 * only. Set to 0 to disable.
 */
const BANK_PER_RAD_PER_S = 0.4;
const BANK_MAX = 0.22;
/** Nominal 60 fps frame, used for the first frame when there's no prior timestamp to diff against. */
const NOMINAL_FRAME_MS = 1000 / 60;
/** Cap a frame's dt so a long stall (e.g. a backgrounded tab) eases gently instead of snapping. */
const MAX_FRAME_MS = 100;

/** A late-detected song still gets a visible hop rather than teleporting. */
const MIN_FLIGHT_MS = 2500;

/** Where the plane goes when an artist's country is unknown — the empty mid-Pacific. */
const PACIFIC: LatLng = { lat: 0, lng: -155 };
/** Unknown destinations fly out over only the first third of the song, then circle the rest. */
const UNKNOWN_FLIGHT_FRACTION = 1 / 3;

/** Past dotted paths kept on the map; the oldest fades out once exceeded. */
const MAX_ARCS = 10;
const ARC_FADE_MS = 1500;
const ARC_OPACITY = 0.9;

const UP = new Vector3(0, 1, 0);
/** The arc's destination arrowhead — large enough to read clearly as "the plane is heading here". */
const ARROW_RADIUS = 3.4;
const ARROW_HEIGHT = 9;
const ARROW_GEOMETRY = new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 16);

/**
 * On-screen direction each marker's artwork points at zero rotation, measured CCW from screen-right
 * (the canvas is drawn facing right; the plane is drawn nose-up). `null` marks a non-directional
 * glyph (note/record) that should stay upright. Land/water vehicles in {@link MIRROR_KINDS} mirror
 * rather than rotate past vertical, so they never ride upside-down when heading screen-left.
 */
const MARKER_FORWARD: Record<MarkerKind, number | null> = {
  plane: Math.PI / 2,
  note: null,
  boat: 0,
  car: 0,
  train: 0,
  bike: 0,
  record: null,
};
const MIRROR_KINDS = new Set<MarkerKind>(['boat', 'car', 'train', 'bike']);

/** Land-bound markers that hop into a boat across open water; plane + music markers never change. */
const TERRAIN_KINDS = new Set<MarkerKind>(['car', 'train', 'bike']);
/** How often (ms) to re-check the terrain under the marker — cheap, and coastlines pass slowly. */
const TERRAIN_CHECK_MS = 200;

interface Arc {
  line: Line;
  lineMaterial: LineDashedMaterial;
  head: Mesh;
  headMaterial: MeshBasicMaterial;
  fading: boolean;
  fadeStart: number;
}

type Leg =
  | { mode: 'circle'; center: LatLng }
  | {
      mode: 'fly';
      curve: QuadraticBezierCurve3;
      dest: LatLng;
      /** Country to highlight on arrival, or null for the unknown/Pacific destination. */
      destCode: string | null;
      start: number;
      duration: number;
    };

/**
 * The animated plane + its dotted trail, layered onto the three-globe. Owned by {@link GlobeRenderer}
 * and driven imperatively (no signals): `setTarget` on each track change, `update(now)` every frame.
 * Same country → circle it; new country → fly a curved arc, arriving as the song ends.
 */
export class FlightLayer {
  /** Country to highlight (the one being circled), or null mid-flight. */
  onHighlightChange?: () => void;

  private readonly layer = new Group();
  private readonly plane = new Group();
  private readonly glyphSprite: Sprite;

  /** Accent colour for the flight arcs; updated live from settings. */
  private readonly arcColor: Color;
  /** The raw accent from settings (for change-detection) and its brightened, more-visible variant. */
  private rawAccent: string;
  private accentHex: string;
  /** The marker glyph's fill colour, chosen independently of the accent — drawn with a black outline. */
  private markerColor: string;
  /** The marker the user chose, and what's actually drawn — a land vehicle becomes a boat over water. */
  private selectedKind: MarkerKind;
  private displayedKind: MarkerKind;
  /** True when a lat/lng is open water (no country under it); drives the land-vehicle → boat swap. */
  private readonly isWater: (lat: number, lng: number) => boolean;
  /** Throttle the terrain check — point-in-polygon every frame would be wasteful. */
  private lastTerrainCheck = 0;
  private leg: Leg | null = null;
  /** User toggled the overlay off: the plane keeps flying (the leg still advances every frame), it's
   * just not drawn — so toggling back on resumes at the live position rather than restarting. */
  private hidden = false;
  /** Where the plane currently rests/circles; null until the first track places it. */
  private currentCenter: LatLng | null = null;
  private currentCode: string | null = null;
  private highlight: string | null = null;
  private readonly arcs: Arc[] = [];
  private activeArc: Arc | null = null;

  /** Last frame's plane position + scratch vectors, used to orient the marker along its travel. */
  private readonly prevPos = new Vector3();
  private hasPrev = false;
  /** Wall-clock of the previous frame and this frame's derived (frame-rate-independent) ease alpha. */
  private lastFrame = 0;
  private frameDtMs = NOMINAL_FRAME_MS;
  private rotationAlpha = 0;
  private facingMirror = false;
  /** Previous frame's screen-space travel heading, to derive the turn rate that drives the bank. */
  private prevHeading = 0;
  private hasHeading = false;
  private readonly camRight = new Vector3();
  private readonly camUp = new Vector3();
  private readonly velocity = new Vector3();

  constructor(
    private readonly globe: ThreeGlobe,
    private readonly camera: Camera,
    private readonly centroids: ReadonlyMap<string, LatLng>,
    private readonly radius: number,
    accentColor: string,
    markerColor: string,
    markerKind: MarkerKind,
    isWater: (lat: number, lng: number) => boolean,
  ) {
    this.rawAccent = accentColor;
    this.accentHex = vivid(accentColor);
    this.arcColor = new Color(this.accentHex);
    this.markerColor = markerColor;
    this.selectedKind = markerKind;
    this.displayedKind = markerKind;
    this.isWater = isWater;

    this.glyphSprite = new Sprite(
      new SpriteMaterial({
        map: makeMarkerTexture(markerKind, this.markerColor),
        transparent: true,
        depthWrite: false,
      }),
    );
    this.glyphSprite.scale.set(8, 8, 1);

    this.plane.add(this.glyphSprite);
    this.plane.visible = false;
    this.layer.add(this.plane);
    this.globe.add(this.layer);
  }

  highlightCode(): string | null {
    // The highlight is part of the overlay — suppress it while hidden so the globe shows no flight tint.
    return this.hidden ? null : this.highlight;
  }

  /**
   * Show or hide the whole overlay (plane + route arcs + country highlight) without disturbing the
   * flight: `update()` keeps advancing the leg every frame, so re-showing it picks up at the plane's
   * current point of the trip instead of restarting. Toggling the parent group is all it takes — the
   * marker's own visibility (track playing or not) and the arcs are children of it.
   */
  setHidden(hidden: boolean): void {
    if (hidden === this.hidden) {
      return;
    }
    this.hidden = hidden;
    this.layer.visible = !hidden;
    this.onHighlightChange?.();
  }

  /**
   * The marker's live world position, or null when it isn't placed/visible. The globe sits at the
   * origin with no rotation (the camera orbits it), so the plane's local position is also its world
   * position — letting the renderer steer a follow-camera straight at it.
   */
  planePosition(): Vector3 | null {
    return this.leg !== null && this.plane.visible ? this.plane.position : null;
  }

  /** Swap the marker icon live; re-evaluates the terrain so a land vehicle may show as a boat. */
  setMarker(kind: MarkerKind): void {
    if (kind === this.selectedKind) {
      return;
    }
    this.selectedKind = kind;
    this.refreshMarker();
  }

  /** Recolour the future flight arcs when the secondary accent changes. */
  setAccent(color: string): void {
    if (color === this.rawAccent) {
      return;
    }
    this.rawAccent = color;
    this.accentHex = vivid(color);
    this.arcColor.set(this.accentHex);
  }

  /** Recolour the marker glyph live when the user picks a new marker colour. */
  setMarkerColor(color: string): void {
    if (color === this.markerColor) {
      return;
    }
    this.markerColor = color;
    this.renderGlyph();
  }

  /** Redraw the marker glyph onto its sprite for the currently-displayed kind + marker colour. */
  private renderGlyph(): void {
    const material = this.glyphSprite.material;
    material.map?.dispose();
    material.map = makeMarkerTexture(this.displayedKind, this.markerColor);
    material.needsUpdate = true;
    // The fresh texture starts unmirrored; let the next orient step re-apply a flip if needed.
    this.facingMirror = false;
    // Forget the heading sample so a kind swap can't spike the bank against a stale heading.
    this.hasHeading = false;
  }

  /**
   * Keep the drawn marker in step with the chosen kind and the terrain underneath it: land vehicles
   * (car/train/bike) ride a boat across open water; plane and the music markers never change. Only
   * redraws when the displayed kind actually flips, so it's cheap to call.
   */
  private refreshMarker(): void {
    const at = this.currentLatLng();
    const overWater = at !== null && this.isWater(at.lat, at.lng);
    const want = TERRAIN_KINDS.has(this.selectedKind) && overWater ? 'boat' : this.selectedKind;
    if (want !== this.displayedKind) {
      this.displayedKind = want;
      this.renderGlyph();
    }
  }

  /** The plane's live lat/lng, or null before the first track has placed it. */
  private currentLatLng(): LatLng | null {
    if (this.leg === null) {
      return null;
    }
    const { lat, lng } = this.globe.toGeoCoords(this.plane.position);
    return { lat, lng };
  }

  setTarget(target: FlightTarget | null, now: number): void {
    if (target === null) {
      // Nothing playing: park the plane out of sight; faded arcs fade on their own. (Hiding the
      // overlay via the view toggle goes through setHidden, which leaves the live leg untouched.)
      this.plane.visible = false;
      this.leg = null;
      this.hasPrev = false; // forget stale heading so it doesn't jolt when the plane reappears
      this.hasHeading = false;
      this.setHighlight(null);
      return;
    }
    this.plane.visible = true;

    const code = target.countryCode;
    const known = code !== null && this.centroids.has(code);
    const dest = known ? this.centroids.get(code)! : PACIFIC;
    const destCode = known ? code : null;
    const remaining = Math.max(MIN_FLIGHT_MS, target.durationMs - target.progressMs);
    // Unknown origin: fly out over only the first third of the song, then circle the Pacific.
    const duration = known
      ? remaining
      : Math.max(MIN_FLIGHT_MS, remaining * UNKNOWN_FLIGHT_FRACTION);

    // First track: just drop the plane on the destination and circle.
    if (this.leg === null) {
      this.settleAt(dest, destCode);
      return;
    }
    // Already sitting on / flying toward this same place → nothing to do (e.g. same-country skip).
    const headingTo = this.leg.mode === 'fly' ? this.leg.destCode : this.currentCode;
    if (destCode === headingTo) {
      return;
    }
    // Country changed (including a mid-flight skip): retarget now, from where the plane actually is.
    this.startFlight(this.currentFrom(), this.currentAlt(), dest, destCode, duration, now);
    // Light the destination for the whole flight so you can see where the plane is heading; it stays
    // lit through arrival (settleAt re-sets the same code, a no-op). A null code (unknown/Pacific
    // origin) clears the highlight, as before.
    this.setHighlight(destCode);
  }

  /**
   * The plane's live position as lat/lng — used as a flight's start so a new leg departs from exactly
   * where the marker is (mid-orbit or mid-flight), never snapping to the country centroid.
   */
  private currentFrom(): LatLng {
    if (this.leg === null) {
      return this.currentCenter ?? PACIFIC;
    }
    const { lat, lng } = this.globe.toGeoCoords(this.plane.position);
    return { lat, lng };
  }

  /** The plane's current altitude (globe radii above the surface), so a flight departs at cruise. */
  private currentAlt(): number {
    if (this.leg === null) {
      return PLANE_ALT;
    }
    return this.plane.position.length() / this.radius - 1;
  }

  update(now: number): void {
    // Derive this frame's easing alpha from real elapsed time, so heading turns stay smooth and
    // frame-rate independent — matching the time-parametrised position rather than lagging on hitches.
    const dt =
      this.lastFrame === 0 ? NOMINAL_FRAME_MS : Math.min(MAX_FRAME_MS, now - this.lastFrame);
    this.lastFrame = now;
    this.frameDtMs = dt;
    this.rotationAlpha = 1 - Math.exp(-dt / ROTATION_TIME_CONSTANT_MS);
    this.animatePlane(now);
    this.fadeArcs(now);
    // Coastline crossings are gradual; a few checks a second is plenty and keeps picking cheap.
    if (now - this.lastTerrainCheck > TERRAIN_CHECK_MS) {
      this.lastTerrainCheck = now;
      this.refreshMarker();
    }
  }

  dispose(): void {
    for (const arc of [...this.arcs, this.activeArc]) {
      if (arc !== null) {
        this.disposeArc(arc);
      }
    }
    disposeSprite(this.glyphSprite);
    this.globe.remove(this.layer);
  }

  private animatePlane(now: number): void {
    if (this.leg === null) {
      return;
    }
    if (this.leg.mode === 'circle') {
      const angle = (now / CIRCLE_PERIOD_MS) * Math.PI * 2;
      this.plane.position.copy(this.circlePosition(this.leg.center, angle));
      this.orientToHeading();
      return;
    }
    const t = Math.min(1, (now - this.leg.start) / this.leg.duration);
    // Ease the position along the curve so the leg accelerates out of the orbit and decelerates into
    // the destination, instead of a constant-velocity slide. Arrival still lands as the song ends.
    this.leg.curve.getPoint(easeInOut(t), this.plane.position);
    this.orientToHeading();
    if (t >= 1) {
      if (this.activeArc !== null) {
        this.arcs.push(this.activeArc);
        this.activeArc = null;
        this.enforceCap(now);
      }
      this.settleAt(this.leg.dest, this.leg.destCode);
    }
  }

  /**
   * Rotate the marker so its artwork points along the plane's on-screen travel direction. The sprite
   * billboards to the camera, so the screen axes are the camera's right/up — project the world-space
   * velocity onto them and the `atan2` of the result is the on-screen heading. Land/water vehicles
   * mirror past vertical instead of rolling upside-down; non-directional glyphs stay upright.
   */
  private orientToHeading(): void {
    if (MARKER_FORWARD[this.displayedKind] === null) {
      this.setMirror(false);
      this.hasHeading = false;
      this.glyphSprite.material.rotation = 0;
      return;
    }
    if (!this.hasPrev) {
      this.prevPos.copy(this.plane.position);
      this.hasPrev = true;
      return;
    }
    this.velocity.subVectors(this.plane.position, this.prevPos);
    this.prevPos.copy(this.plane.position);
    if (this.velocity.lengthSq() < 1e-6) {
      return; // barely moving — keep the last heading rather than spin to noise
    }
    const theta = this.headingFromDirection(this.velocity);
    // Lean into the turn by an extra roll proportional to how fast the heading is sweeping — only the
    // plane banks; a leaning car/train/bike would look wrong, so they track the heading flat. Sample
    // the rate every frame (keeps it current), but only apply the bank mid-flight: a steady orbit
    // would otherwise hold a constant, odd-looking tilt instead of circling level.
    const rawBank = this.displayedKind === 'plane' ? this.bankFor(theta) : 0;
    const bank = this.leg?.mode === 'fly' ? rawBank : 0;
    this.applyHeading(theta, bank, false);
  }

  /**
   * Snap the marker to point along a world-space direction immediately (no easing). Used at the start
   * of a flight so the plane aligns with the fresh arc on frame one, instead of holding the old
   * orbit's heading while the eased position slowly accelerates out of the turn.
   */
  private snapHeadingTo(direction: Vector3): void {
    if (MARKER_FORWARD[this.displayedKind] === null) {
      this.setMirror(false);
      this.glyphSprite.material.rotation = 0;
      return;
    }
    this.applyHeading(this.headingFromDirection(direction), 0, true);
  }

  /** The on-screen heading (CCW from screen-right) of a world-space direction, via the camera axes. */
  private headingFromDirection(direction: Vector3): number {
    this.camRight.setFromMatrixColumn(this.camera.matrixWorld, 0);
    this.camUp.setFromMatrixColumn(this.camera.matrixWorld, 1);
    return Math.atan2(direction.dot(this.camUp), direction.dot(this.camRight));
  }

  /**
   * Point the marker along screen-space heading `theta`: mirror an asymmetric vehicle past vertical
   * rather than roll it upside-down, then either snap to the resulting rotation or ease toward it.
   */
  private applyHeading(theta: number, bank: number, snap: boolean): void {
    const forward = MARKER_FORWARD[this.displayedKind]!;
    let target: number;
    if (MIRROR_KINDS.has(this.displayedKind) && Math.cos(theta) < 0) {
      this.setMirror(true);
      // Mirrored art faces left at zero rotation; the bank's screen sense flips with it.
      target = theta - Math.PI - forward - bank;
    } else {
      this.setMirror(false);
      target = theta - forward + bank;
    }
    if (snap) {
      this.glyphSprite.material.rotation = target;
    } else {
      this.easeRotation(target);
    }
  }

  /** Clamped roll proportional to the screen-heading turn rate (rad/s); 0 on the first sample. */
  private bankFor(heading: number): number {
    if (!this.hasHeading) {
      this.prevHeading = heading;
      this.hasHeading = true;
      return 0;
    }
    let delta = (heading - this.prevHeading) % (Math.PI * 2);
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    this.prevHeading = heading;
    const ratePerS = delta / (this.frameDtMs / 1000);
    return clamp(BANK_PER_RAD_PER_S * ratePerS, -BANK_MAX, BANK_MAX);
  }

  /**
   * Ease the marker's rotation toward `target` along the shortest angular path, so a heading change
   * (a new arc on track change, or the flight→circle hand-off) turns smoothly instead of snapping.
   */
  private easeRotation(target: number): void {
    const material = this.glyphSprite.material;
    let delta = (target - material.rotation) % (Math.PI * 2);
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    material.rotation += delta * this.rotationAlpha;
  }

  /** Flip the marker texture horizontally so an asymmetric vehicle stays upright heading screen-left. */
  private setMirror(on: boolean): void {
    if (on === this.facingMirror) {
      return;
    }
    this.facingMirror = on;
    const map = this.glyphSprite.material.map;
    if (map === null) {
      return;
    }
    map.repeat.x = on ? -1 : 1;
    map.offset.x = on ? 1 : 0;
  }

  /** Park the plane over a destination and circle it; highlight its country (none for Pacific). */
  private settleAt(dest: LatLng, destCode: string | null): void {
    this.currentCenter = dest;
    this.currentCode = destCode;
    this.setHighlight(destCode);
    this.leg = { mode: 'circle', center: dest };
  }

  private startFlight(
    from: LatLng,
    fromAlt: number,
    to: LatLng,
    destCode: string | null,
    duration: number,
    now: number,
  ): void {
    // Skipping mid-flight abandons the previous leg — drop its half-drawn arc rather than leak it.
    if (this.activeArc !== null) {
      this.disposeArc(this.activeArc);
      this.activeArc = null;
    }
    const curve = this.buildArc(from, fromAlt, to);
    this.activeArc = this.addArcVisual(curve);
    this.leg = { mode: 'fly', curve, dest: to, destCode, start: now, duration };
    // Align the marker with the fresh arc right away. The eased position barely moves for the first
    // frames (easeInOut starts near zero velocity), so without this snap the plane would hold its old
    // orbit heading — visibly off the arc and its arrowhead — until the easing slowly caught up.
    this.prevPos.copy(this.plane.position);
    this.hasPrev = true;
    this.hasHeading = false;
    this.snapHeadingTo(curve.getTangent(0));
  }

  /**
   * A quadratic arc from the plane's live point to the destination. Endpoints sit at cruise altitude
   * (the start at wherever the plane currently is, the end at {@link PLANE_ALT}) so a flight blends
   * seamlessly out of and back into the circling orbit, with the control point bowed higher between.
   */
  private buildArc(from: LatLng, fromAlt: number, to: LatLng): QuadraticBezierCurve3 {
    const p0 = this.coords(from.lat, from.lng, fromAlt);
    const p1 = this.coords(to.lat, to.lng, PLANE_ALT);
    const s0 = this.coords(from.lat, from.lng, 0);
    const s1 = this.coords(to.lat, to.lng, 0);
    // Bow the arc higher the farther apart the endpoints are — but never below the (possibly high)
    // departure altitude of a mid-flight skip, so the fresh arc rises away rather than dipping first.
    const baseLift = ARC_MIN_ALT + ARC_DIST_ALT * (s0.angleTo(s1) / Math.PI);
    const lift = Math.max(baseLift, fromAlt + 0.05);
    const mid = s0
      .clone()
      .add(s1)
      .normalize()
      .multiplyScalar(this.radius * (1 + lift));
    return new QuadraticBezierCurve3(p0, mid, p1);
  }

  private addArcVisual(curve: QuadraticBezierCurve3): Arc {
    const points = curve.getPoints(72);
    const geometry = new BufferGeometry().setFromPoints(points);
    const lineMaterial = new LineDashedMaterial({
      color: this.arcColor,
      transparent: true,
      opacity: ARC_OPACITY,
      dashSize: 2.2,
      gapSize: 2,
    });
    const line = new Line(geometry, lineMaterial);
    line.computeLineDistances();
    this.layer.add(line);

    const headMaterial = new MeshBasicMaterial({
      color: this.arcColor,
      transparent: true,
      opacity: ARC_OPACITY,
    });
    const head = new Mesh(ARROW_GEOMETRY, headMaterial);
    const tip = points[points.length - 1]!;
    const direction = curve.getTangent(1).normalize();
    head.quaternion.setFromUnitVectors(UP, direction);
    // Pull the cone back by half its height so its point — not its centre — sits on the arc tip,
    // i.e. the arrow's nose touches down on the destination country.
    head.position.copy(tip).addScaledVector(direction, -ARROW_HEIGHT / 2);
    this.layer.add(head);

    return { line, lineMaterial, head, headMaterial, fading: false, fadeStart: 0 };
  }

  private enforceCap(now: number): void {
    const live = this.arcs.filter((arc) => !arc.fading);
    for (let i = 0; i < live.length - MAX_ARCS; i++) {
      live[i]!.fading = true;
      live[i]!.fadeStart = now;
    }
  }

  private fadeArcs(now: number): void {
    for (let i = this.arcs.length - 1; i >= 0; i--) {
      const arc = this.arcs[i]!;
      if (!arc.fading) {
        continue;
      }
      const progress = (now - arc.fadeStart) / ARC_FADE_MS;
      if (progress >= 1) {
        this.disposeArc(arc);
        this.arcs.splice(i, 1);
      } else {
        // Ease-out so the trail lingers, then drops away quickly at the end — softer than a linear ramp.
        const remaining = 1 - easeOut(progress);
        arc.lineMaterial.opacity = ARC_OPACITY * remaining;
        arc.headMaterial.opacity = ARC_OPACITY * remaining;
      }
    }
  }

  private circlePosition(center: LatLng, angle: number): Vector3 {
    const cosLat = Math.max(0.2, Math.cos(center.lat * DEG2RAD));
    const lat = center.lat + CIRCLE_RADIUS_DEG * Math.sin(angle);
    const lng = center.lng + (CIRCLE_RADIUS_DEG * Math.cos(angle)) / cosLat;
    return this.coords(lat, lng, PLANE_ALT);
  }

  /** three-globe's `getCoords` returns a plain `{x,y,z}`; wrap it as a real Vector3. */
  private coords(lat: number, lng: number, alt: number): Vector3 {
    const { x, y, z } = this.globe.getCoords(lat, lng, alt);
    return new Vector3(x, y, z);
  }

  private setHighlight(code: string | null): void {
    if (code === this.highlight) {
      return;
    }
    this.highlight = code;
    this.onHighlightChange?.();
  }

  private disposeArc(arc: Arc): void {
    this.layer.remove(arc.line, arc.head);
    arc.line.geometry.dispose();
    arc.lineMaterial.dispose();
    arc.headMaterial.dispose();
  }
}

/**
 * Brighten the accent into a punchier variant for the arcs + marker, so they stay legible against
 * both the pale heat ramp and the dark ocean — the soft pastel accent alone tends to wash out.
 */
function vivid(hex: string): string {
  const color = new Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  color.setHSL(hsl.h, Math.min(1, hsl.s + 0.35), Math.min(0.62, Math.max(0.5, hsl.l - 0.18)));
  return `#${color.getHexString()}`;
}

/** Canvas size every marker is drawn into; sprite scale maps it to world units. */
const MARKER_SIZE = 128;
/** Black outline width (px) ringed around each glyph so it reads on any globe colour. */
const MARKER_OUTLINE = 5;

/**
 * Draw the chosen marker icon, tinted with `color` and ringed with a black outline, to a billboard
 * texture. The glyph is rendered once to an offscreen canvas, then a dilated black silhouette of it
 * is stamped behind the colour — one uniform outline that works for every glyph shape without having
 * to stroke each drawing by hand.
 */
function makeMarkerTexture(kind: MarkerKind, color: string): CanvasTexture {
  const glyph = drawGlyphCanvas(kind, color);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = MARKER_SIZE;
  const ctx = canvas.getContext('2d')!;
  stampOutline(ctx, blackSilhouette(glyph));
  ctx.drawImage(glyph, 0, 0);
  return new CanvasTexture(canvas);
}

/** Render just the tinted glyph (no outline) to its own canvas. */
function drawGlyphCanvas(kind: MarkerKind, color: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = MARKER_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineJoin = 'round';
  switch (kind) {
    case 'plane':
      drawPlane(ctx);
      break;
    case 'note':
      // ♫ has a monochrome (text) default presentation, so it tints with fillStyle.
      drawGlyph(ctx, '♫');
      break;
    case 'boat':
      drawBoat(ctx);
      break;
    case 'car':
      drawCar(ctx);
      break;
    case 'train':
      drawTrain(ctx);
      break;
    case 'bike':
      drawBike(ctx);
      break;
    case 'record':
      drawRecord(ctx);
      break;
  }
  return canvas;
}

/** A solid-black copy of `glyph`, masked to its alpha — the shape that gets dilated into an outline. */
function blackSilhouette(glyph: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = MARKER_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(glyph, 0, 0);
  // Keep only where the glyph is opaque, then flood it black — a clean silhouette of any shape.
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, MARKER_SIZE, MARKER_SIZE);
  return canvas;
}

/** Stamp the silhouette around a ring of offsets, dilating it into an even {@link MARKER_OUTLINE} edge. */
function stampOutline(ctx: CanvasRenderingContext2D, silhouette: HTMLCanvasElement): void {
  const steps = 16;
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    ctx.drawImage(silhouette, Math.cos(angle) * MARKER_OUTLINE, Math.sin(angle) * MARKER_OUTLINE);
  }
}

/** Centre a single text glyph in the marker box. */
function drawGlyph(ctx: CanvasRenderingContext2D, glyph: string): void {
  ctx.font = `${MARKER_SIZE * 0.7}px "Material Icons", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(glyph, MARKER_SIZE / 2, MARKER_SIZE / 2);
}

/**
 * Top-down airplane silhouette, nose pointing UP (−y) so its forward direction is a known
 * {@link MARKER_FORWARD} of π/2 — independent of any system font's glyph orientation.
 */
function drawPlane(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(64, 18); // nose
  ctx.lineTo(72, 58); // right shoulder
  ctx.lineTo(108, 80); // right wingtip (leading)
  ctx.lineTo(108, 88); // right wingtip (trailing)
  ctx.lineTo(72, 72); // right wing root
  ctx.lineTo(70, 96); // right fuselage toward tail
  ctx.lineTo(88, 108); // right tailplane tip (leading)
  ctx.lineTo(88, 114); // right tailplane tip (trailing)
  ctx.lineTo(64, 104); // tail centre
  ctx.lineTo(40, 114); // left tailplane tip (trailing)
  ctx.lineTo(40, 108); // left tailplane tip (leading)
  ctx.lineTo(58, 96); // left fuselage toward tail
  ctx.lineTo(56, 72); // left wing root
  ctx.lineTo(20, 88); // left wingtip (trailing)
  ctx.lineTo(20, 80); // left wingtip (leading)
  ctx.lineTo(56, 58); // left shoulder
  ctx.closePath();
  ctx.fill();
}

/** Sailboat silhouette: a hull under a mast with a mainsail and jib. Centred in the 128 box. */
function drawBoat(ctx: CanvasRenderingContext2D): void {
  // Hull.
  ctx.beginPath();
  ctx.moveTo(26, 82);
  ctx.lineTo(102, 82);
  ctx.lineTo(86, 100);
  ctx.lineTo(42, 100);
  ctx.closePath();
  ctx.fill();
  // Mast.
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(64, 18);
  ctx.lineTo(64, 82);
  ctx.stroke();
  // Mainsail (right of the mast).
  ctx.beginPath();
  ctx.moveTo(70, 24);
  ctx.lineTo(70, 76);
  ctx.lineTo(100, 76);
  ctx.closePath();
  ctx.fill();
  // Jib (left of the mast).
  ctx.beginPath();
  ctx.moveTo(58, 38);
  ctx.lineTo(58, 76);
  ctx.lineTo(34, 76);
  ctx.closePath();
  ctx.fill();
}

/** Side-on car silhouette: a body with a domed cabin and two wheels. */
function drawCar(ctx: CanvasRenderingContext2D): void {
  // Body + cabin as one outline.
  ctx.beginPath();
  ctx.moveTo(20, 76);
  ctx.lineTo(24, 62);
  ctx.lineTo(44, 62);
  ctx.lineTo(54, 46);
  ctx.lineTo(84, 46);
  ctx.lineTo(94, 62);
  ctx.lineTo(106, 64);
  ctx.lineTo(108, 76);
  ctx.closePath();
  ctx.fill();
  // Wheels.
  ctx.beginPath();
  ctx.arc(44, 80, 11, 0, Math.PI * 2);
  ctx.arc(86, 80, 11, 0, Math.PI * 2);
  ctx.fill();
}

/** Side-on locomotive silhouette: a body with a cab roof, smokestack and wheels. */
function drawTrain(ctx: CanvasRenderingContext2D): void {
  // Body.
  ctx.beginPath();
  ctx.moveTo(26, 44);
  ctx.lineTo(78, 44);
  ctx.lineTo(78, 36);
  ctx.lineTo(98, 36);
  ctx.lineTo(98, 80);
  ctx.lineTo(26, 80);
  ctx.closePath();
  ctx.fill();
  // Smokestack.
  ctx.fillRect(34, 30, 12, 16);
  // Wheels.
  ctx.beginPath();
  ctx.arc(42, 86, 9, 0, Math.PI * 2);
  ctx.arc(66, 86, 9, 0, Math.PI * 2);
  ctx.arc(88, 86, 9, 0, Math.PI * 2);
  ctx.fill();
}

/** Side-on bicycle silhouette: two spoked-looking wheels with a stroked frame. */
function drawBike(ctx: CanvasRenderingContext2D): void {
  ctx.lineWidth = 5;
  // Wheels as rings.
  ctx.beginPath();
  ctx.arc(38, 78, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(90, 78, 18, 0, Math.PI * 2);
  ctx.stroke();
  // Frame, handlebar and seat.
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(38, 78); // rear hub
  ctx.lineTo(62, 78); // bottom bracket
  ctx.lineTo(54, 50); // up the seat tube
  ctx.lineTo(38, 78); // back to rear hub
  ctx.moveTo(62, 78);
  ctx.lineTo(78, 50); // down tube to head
  ctx.lineTo(54, 50); // top tube
  ctx.moveTo(78, 50);
  ctx.lineTo(90, 78); // fork to front hub
  ctx.moveTo(74, 46);
  ctx.lineTo(86, 46); // handlebar
  ctx.moveTo(50, 48);
  ctx.lineTo(60, 48); // seat
  ctx.stroke();
}

/** Vinyl record silhouette: a disc with a groove ring and centre hole punched out. */
function drawRecord(ctx: CanvasRenderingContext2D): void {
  // Disc (keeps the drop shadow).
  ctx.beginPath();
  ctx.arc(64, 64, 42, 0, Math.PI * 2);
  ctx.fill();
  // Punch the groove + centre hole to transparent so it reads as a record, not a plain dot.
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(64, 64, 27, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(64, 64, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
}

/** Symmetric cubic ease-in-out over [0,1] — gentle at both ends, fastest in the middle. */
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Cubic ease-out over [0,1] — fast then settling. */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function disposeSprite(sprite: Sprite): void {
  const material = sprite.material as SpriteMaterial;
  (material.map as Texture | null)?.dispose();
  material.dispose();
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

import { MarkerKind } from '../../core/cache/appearance-cache';
import { countryCentroids, GeoFeature, isoA2, pickCountryCode } from '../../core/geo/geo-data';
import { LivePalette } from '../settings/settings-store';
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

/** Flat fill for countries with no liked artists — a muted "no data" tone, not user-configurable. */
const LAND_EMPTY = '#5a6672';
/** Where the single "sun" sits — a soft directional light so the sphere isn't flat. */
const SUN_POSITION = new Vector3(-200, 120, 220);
/** Ambient/sun balance per mode. Studio: flat & fully lit. Day: one lit hemisphere + dark night. */
const LIGHTING = {
  studio: { ambient: 0.95, sun: 0.6 },
  day: { ambient: 0.16, sun: 1.35 },
} as const;

/**
 * Owns the three.js + three-globe scene for the country globe. Plain three.js with its own render
 * loop — it never touches signals / Angular change detection, which is what keeps the zoneless app
 * cheap. `init(host, features)` once; `applyHeat(map)` to recolour land; `applyPalette` / `setLighting`
 * / `setMarkerIcon` to restyle live; `captureImage()` for a PNG snapshot; `dispose()` to tear down.
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

  // Live palette (seeded from the stylesheet, updated by applyPalette) + its derived Colors.
  private palette: LivePalette = readPalette();
  private cold = new Color(this.palette.landCold);
  private hot = new Color(this.palette.landHot);
  private readonly empty = new Color(LAND_EMPTY);
  /** Tint lerped into the country the plane is currently circling. */
  private flightHighlight = new Color(this.palette.cyan);
  private heat: ReadonlyMap<string, number> = new Map();
  private maxWeight = 0;

  // Flight state.
  private flightLayer?: FlightLayer;
  private markerIcon: MarkerKind = 'plane'; // default until the settings store pushes one
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
    // Re-read the palette here: the settings store has already run by app start, so the CSS custom
    // properties now hold the user's saved colours (or the stylesheet defaults on first run).
    this.palette = readPalette();
    this.cold = new Color(this.palette.landCold);
    this.hot = new Color(this.palette.landHot);
    this.flightHighlight = new Color(this.palette.cyan);

    const { clientWidth: width, clientHeight: height } = host;
    // alpha: true → transparent background, so the page's space gradient shows through the canvas.
    // preserveDrawingBuffer → captureImage() can read the canvas back to a PNG (otherwise the buffer
    // is cleared after each present and toDataURL returns blank). Minor perf cost, fine for a globe.
    this.renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    // Cap the device-pixel-ratio at 2: retina sharpness without rendering 3–4× the pixels on phones.
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    host.appendChild(this.renderer.domElement);

    // FOV 50°, aspect from the host, near/far clip planes. Pull back so the whole globe is in frame.
    this.camera = new PerspectiveCamera(50, width / height, 0.1, 4000);
    this.camera.position.z = INITIAL_DISTANCE;

    // Studio lighting to start: bright ambient (flat, fully lit) + a soft directional sun for shape.
    this.ambient = new AmbientLight(0xffffff, LIGHTING.studio.ambient);
    this.scene.add(this.ambient);
    this.sun = new DirectionalLight(0xffffff, LIGHTING.studio.sun);
    this.sun.position.copy(SUN_POSITION);
    this.scene.add(this.sun);

    this.globe = this.buildGlobe();
    this.globe.polygonsData(this.features);
    this.scene.add(this.globe);

    // The flight overlay lives inside the globe group, seeded with country centroids + a water test
    // (open water = no country under the point) so a land vehicle can ride a boat across the sea.
    this.flightLayer = new FlightLayer(
      this.globe,
      this.camera,
      countryCentroids(this.features),
      GLOBE_RADIUS,
      this.palette.cyan,
      this.palette.marker,
      this.markerIcon,
      (lat, lng) => pickCountryCode(this.features, lat, lng) === null,
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

  /**
   * Render one frame onto a solid space background and read it back as a PNG data URL, for the
   * "save image" share feature. The canvas is normally transparent (`alpha: true`) so the page
   * gradient shows through; a transparent capture looks wrong, so we paint a flat space fill for the
   * shot and restore transparency right after. Returns '' if the renderer isn't ready.
   */
  captureImage(): string {
    if (!this.renderer || !this.camera) {
      return '';
    }
    const styles = getComputedStyle(document.documentElement);
    const space = styles.getPropertyValue('--space-void').trim() || '#070b14';
    const previous = this.scene.background;
    this.scene.background = new Color(space);
    this.renderer.render(this.scene, this.camera);
    const url = this.renderer.domElement.toDataURL('image/png');
    this.scene.background = previous;
    return url;
  }

  /** Recolour countries from a heat map (ISO alpha-2 → weight). Safe to call repeatedly/live. */
  applyHeat(heat: ReadonlyMap<string, number>): void {
    this.heat = heat;
    this.maxWeight = heat.size > 0 ? Math.max(...heat.values()) : 0;
    this.globe?.polygonsData(this.features); // re-evaluates every cap colour
  }

  /** Recolour the globe live from user settings (sphere, atmosphere, strokes, heat ramp, flight). */
  applyPalette(palette: LivePalette): void {
    this.palette = palette;
    this.cold = new Color(palette.landCold);
    this.hot = new Color(palette.landHot);
    this.flightHighlight = new Color(palette.cyan);
    this.flightLayer?.setAccent(palette.cyan);
    this.flightLayer?.setMarkerColor(palette.marker);
    if (this.globe) {
      this.globe.atmosphereColor(palette.cyan);
      (this.globe.globeMaterial() as MeshPhongMaterial).color = new Color(palette.ocean);
      // Stroke + cap colours read this.palette / this.cold / this.hot, so a redraw applies them.
      this.refreshPolygons();
    }
  }

  /** Switch between flat studio lighting and a single-sun day/night look. */
  setLighting(dayMode: boolean): void {
    const { ambient, sun } = dayMode ? LIGHTING.day : LIGHTING.studio;
    if (this.ambient) this.ambient.intensity = ambient;
    if (this.sun) this.sun.intensity = sun;
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

  /** Swap the flight marker icon live. */
  setMarkerIcon(kind: MarkerKind): void {
    this.markerIcon = kind;
    this.flightLayer?.setMarker(kind);
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

  /** Re-evaluate polygon cap colour + altitude (hover / flight highlight / palette changed). */
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
      .atmosphereColor(this.palette.cyan)
      .atmosphereAltitude(0.16)
      .showGraticules(true) // the faint lat/long grid
      .polygonCapColor((feature) => this.capColor(feature as GeoFeature))
      .polygonSideColor(() => 'rgba(40, 60, 80, 0.5)')
      .polygonStrokeColor(() => this.palette.teal)
      .polygonAltitude((feature) => this.capAltitude(feature as GeoFeature))
      // Short transition so the hover lift/whiten + heat recolour feel responsive (default is ~1s).
      .polygonsTransitionDuration(200);

    // A plain lit ocean sphere. (The source uses a cel-shaded toon material — cosmetic, trimmed here.)
    globe.globeMaterial(new MeshPhongMaterial({ color: new Color(this.palette.ocean) }));
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

/** Read the renderer's colours from the stylesheet's custom properties (the settings store's mirror). */
function readPalette(): LivePalette {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string): string =>
    styles.getPropertyValue(name).trim() || fallback;
  return {
    teal: read('--neon-teal', '#9fe0cf'),
    cyan: read('--neon-cyan', '#a9d4f0'),
    ocean: read('--globe-ocean', '#112233'),
    landCold: read('--globe-land-cold', '#7fa8c9'),
    landHot: read('--globe-land-hot', '#ef9a8a'),
    marker: read('--flight-marker', '#4cc9f0'),
  };
}
```

## Done when (this step)
- [ ] `npm run build` → clean. On `/globe`, the globe renders exactly as after M8/M9 (nothing regressed) — the
      initial palette read from CSS matches the old hard-coded colours.
- [ ] In the console: `getRenderer().applyPalette({teal:'#ff0000',cyan:'#00ffff',ocean:'#001133',landCold:'#7fa8c9',landHot:'#ef9a8a',marker:'#4cc9f0'})`
      isn't reachable directly, but after step 04 wires it, dragging a swatch recolours the globe. For now, confirm
      no runtime error and the atmosphere/ocean/strokes are drawn.

## If it breaks
- **`Property 'setAccent'/'setMarkerColor'/'setMarker' does not exist on FlightLayer`** → those methods are
  added in **this step's** flight-layer growth (the first code block above); if missing, you pasted only the
  renderer and left the plane-only M8 `flight-layer.ts` in place.
- **`toDataURL` returns a blank PNG** → `preserveDrawingBuffer: true` wasn't set on the `WebGLRenderer`, or you
  read the buffer *without* rendering a frame first — `captureImage()` renders one right before `toDataURL`.
- **Cannot find name `MarkerKind`** → the import must now come from `../../core/cache/appearance-cache` (step 01),
  not `./flight-layer`.
- **Globe goes black after `applyPalette`** → the ocean cast: `globeMaterial()` returns the base material; in this
  guide it's a `MeshPhongMaterial` (the cast target), not the source's `MeshToonMaterial`.

---
> Nav: [← The settings store](02_settings-store.md) · [Overview](00_overview.md) · [Grow the canvas →](04_canvas-palette-capture.md)
