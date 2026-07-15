# M8 · Step 05 of 12 — `FlightLayer` — the three.js plane & flight arc
> Nav: [← FlightStore](04_flight-store.md) · [Overview](00_overview.md) · [Grow the renderer →](06_globe-renderer-flight.md)

## Glossary for this step
> **layer (three.js `Group`)** — a `Group` is a container node; adding it to the globe lets us move/hide the
> whole flight overlay (plane + arcs) as one, and dispose it in one call.
> **leg** — one segment of the trip: either `circle` (orbit a country's centroid) or `fly` (a curved arc from
> the plane's current point to a new country, parametrised by time so it lands as the song ends).
> **billboard sprite** — a textured quad that always faces the camera; the plane is a sprite, so we rotate its
> *texture* to point along travel rather than rotating a 3D mesh.
> **quadratic Bézier** — a curve defined by a start, an end, and one control point; the arc bows the control
> point up off the surface so the route rises and falls.
> **`LineDashedMaterial` + `computeLineDistances()`** — the flight arc is a *dashed* line. `LineDashedMaterial`
> defines the dash/gap sizes, but three.js only knows where to break the dashes if you call
> `line.computeLineDistances()` **once, after the geometry's points are set** — it walks the vertices and stores
> the running distance of each. **Miss that call and the line renders solid** — no error, no dashes; it's the
> classic "why are my dashes gone?" trap. [docs](https://threejs.org/docs/#api/en/materials/LineDashedMaterial).
> **`ConeGeometry`** — a cone *shape*; here `new ConeGeometry(radius, height, segments)` is the little arrowhead
> at the arc's destination, rotated to point along the arc so you can see where the plane is headed. [docs](https://threejs.org/docs/#api/en/geometries/ConeGeometry).
> **`CanvasTexture`** — a texture whose pixels come from a `<canvas>` you draw into with the 2D context. The
> plane glyph is drawn once to an offscreen canvas (silhouette + a stamped black outline) and wrapped as a
> `CanvasTexture` for the billboard sprite — the marker is plain 2D drawing, not a 3D model. [docs](https://threejs.org/docs/#api/en/textures/CanvasTexture).

## Why / design
This is the animation, and it obeys [D4](../foundation/decision-log.md#d4--signal-free-render-loop): it is a
**plain class, no signals, no change detection**. The renderer owns it and drives it imperatively —
`setTarget(target, now)` when the track changes, `update(now)` every frame. The only Angular touch-point is far
away in the canvas `effect()`s (step 07).

The core behaviours the milestone gate checks:
- **New country → fly; same country → circle.** `setTarget` compares the destination to where the plane is
  heading. A change starts a `fly` leg (a Bézier arc from the plane's *live* point); an unchanged one is a
  no-op (it keeps circling).
- **Arrive as the song ends.** The `fly` leg's `duration` is `durationMs - progressMs` (clamped to a 2.5 s
  minimum so a late-detected song still hops). The position is `curve.getPoint(easeInOut(t))` with
  `t = elapsed / duration` — time-parametrised, so it lands on schedule regardless of frame rate.
- **Unknown origin → mid-Pacific.** When `countryCode` is null (or the code has no centroid), the destination
  is a fixed empty point in the Pacific (`{ lat: 0, lng: -155 }`), and the plane flies out over only the first
  third of the song, then circles there. No crash, no highlight.
- **Hidden but still flying.** `setHidden(true)` toggles the `Group`'s visibility but **`update()` keeps
  advancing the leg** — so switching the overlay back on resumes at the plane's live point, not a restart.

Everything else (heading easing, banking into turns, arc fade-out) is cosmetic polish, done with
**frame-rate-independent time constants** so a dropped frame never lurches. The plane is drawn to a canvas
texture — one uniform black outline is stamped behind it so it reads on any globe colour. Because the plane is
always directional (it never mirrors or holds an upright glyph), its forward is a single `PLANE_FORWARD`
constant rather than a per-kind lookup.

> The marker *system* — choosing a different icon (boat/car/train/bike/note/record), the marker + accent
> colours, and the terrain-aware boat-over-water swap with sprite mirroring — arrives in **M11** with the
> settings panel that actually drives it. `MarkerKind` is born there too (in `core/cache/appearance-cache.ts`).
> M8 flies a fixed plane.

## Do this
1. Create `src/app/features/globe/flight-layer.ts`.
2. Build the `FlightLayer` class: a `Group` holding the plane sprite; `setTarget`/`setHidden`/`update`/`dispose`
   as the public surface; `planePosition()` + `highlightCode()` for the renderer's follow-camera + country tint.
3. Add the private geometry (arc building, circling, heading/bank easing) and the plane-texture drawing helpers.

Paste the file whole — it's long but self-contained, and every helper is commented.

> **Two tunables worth knowing (illustrative — retune freely):**
> - `curve.getPoints(72)` — how many points the arc curve is sampled into before drawing the dashed line. 72 is
>   enough for a visually smooth great-circle arc without generating excess geometry; too few would look faceted.
> - `CIRCLE_RADIUS_DEG = 7` — the loiter circle's radius in **degrees of latitude** (~7° ≈ 780 km) once the
>   plane arrives over a country. Big enough to read as an orbit at globe zoom, small enough to stay over the
>   target country.

## Code
### `src/app/features/globe/flight-layer.ts`
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
 * Easing of the plane's heading toward its travel direction, expressed as a time constant (ms)
 * rather than a per-frame factor — so the turn rate is identical whether frames arrive every 8 ms or
 * 33 ms, and a dropped frame can't make the heading lurch to catch up to the time-based position.
 * Larger = a softer, slower turn.
 */
const ROTATION_TIME_CONSTANT_MS = 100;
/**
 * Subtle bank: the plane leans into a turn by an extra roll proportional to how fast its heading is
 * changing (rad/s), clamped so a hard turn never rolls it flat. Purely cosmetic. Set to 0 to disable.
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
 * On-screen direction the plane's artwork points at zero rotation, measured CCW from screen-right (the
 * plane is drawn nose-up, so its forward is π/2). One constant suffices because the plane is always
 * directional; M11's multi-glyph marker engine replaces it with a per-kind lookup.
 */
const PLANE_FORWARD = Math.PI / 2;

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
 *
 * M8 flies a fixed plane. The marker system (icon choice, marker/accent colours, the terrain-aware
 * boat swap + mirroring) is added in M11 with the settings panel that drives it.
 */
export class FlightLayer {
  /** Country to highlight (the one being circled), or null mid-flight. */
  onHighlightChange?: () => void;

  private readonly layer = new Group();
  private readonly plane = new Group();
  private readonly glyphSprite: Sprite;

  /** Accent colour for the flight arcs, brightened once from the constructor's accent. */
  private readonly arcColor: Color;
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

  /** Last frame's plane position + scratch vectors, used to orient the plane along its travel. */
  private readonly prevPos = new Vector3();
  private hasPrev = false;
  /** Wall-clock of the previous frame and this frame's derived (frame-rate-independent) ease alpha. */
  private lastFrame = 0;
  private frameDtMs = NOMINAL_FRAME_MS;
  private rotationAlpha = 0;
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
  ) {
    this.arcColor = new Color(vivid(accentColor));

    this.glyphSprite = new Sprite(
      new SpriteMaterial({
        map: makeMarkerTexture(markerColor),
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
   * plane's own visibility (track playing or not) and the arcs are children of it.
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
   * The plane's live world position, or null when it isn't placed/visible. The globe sits at the
   * origin with no rotation (the camera orbits it), so the plane's local position is also its world
   * position — letting the renderer steer a follow-camera straight at it.
   */
  planePosition(): Vector3 | null {
    return this.leg !== null && this.plane.visible ? this.plane.position : null;
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
   * Rotate the plane so its artwork points along its on-screen travel direction. The sprite billboards
   * to the camera, so the screen axes are the camera's right/up — project the world-space velocity onto
   * them and the `atan2` of the result is the on-screen heading.
   */
  private orientToHeading(): void {
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
    // Lean into the turn by an extra roll proportional to how fast the heading is sweeping — but only
    // apply the bank mid-flight: a steady orbit would otherwise hold a constant, odd-looking tilt
    // instead of circling level. Sample the rate every frame so it stays current.
    const bank = this.leg?.mode === 'fly' ? this.bankFor(theta) : 0;
    this.applyHeading(theta, bank, false);
  }

  /**
   * Snap the plane to point along a world-space direction immediately (no easing). Used at the start
   * of a flight so the plane aligns with the fresh arc on frame one, instead of holding the old
   * orbit's heading while the eased position slowly accelerates out of the turn.
   */
  private snapHeadingTo(direction: Vector3): void {
    this.applyHeading(this.headingFromDirection(direction), 0, true);
  }

  /** The on-screen heading (CCW from screen-right) of a world-space direction, via the camera axes. */
  private headingFromDirection(direction: Vector3): number {
    this.camRight.setFromMatrixColumn(this.camera.matrixWorld, 0);
    this.camUp.setFromMatrixColumn(this.camera.matrixWorld, 1);
    return Math.atan2(direction.dot(this.camUp), direction.dot(this.camRight));
  }

  /**
   * Point the plane along screen-space heading `theta`, offsetting by its nose-up {@link PLANE_FORWARD}
   * and the turn bank, then either snap to that rotation or ease toward it.
   */
  private applyHeading(theta: number, bank: number, snap: boolean): void {
    const target = theta - PLANE_FORWARD + bank;
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
   * Ease the plane's rotation toward `target` along the shortest angular path, so a heading change
   * (a new arc on track change, or the flight→circle hand-off) turns smoothly instead of snapping.
   */
  private easeRotation(target: number): void {
    const material = this.glyphSprite.material;
    let delta = (target - material.rotation) % (Math.PI * 2);
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    material.rotation += delta * this.rotationAlpha;
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
    // Align the plane with the fresh arc right away. The eased position barely moves for the first
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
    // Required for LineDashedMaterial: it records each vertex's cumulative distance so the dashes have
    // somewhere to break. Omit it and the arc silently renders as a solid line (no error, no dashes).
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
 * Brighten the accent into a punchier variant for the arcs + plane, so they stay legible against
 * both the pale heat ramp and the dark ocean — the soft pastel accent alone tends to wash out.
 */
function vivid(hex: string): string {
  const color = new Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  color.setHSL(hsl.h, Math.min(1, hsl.s + 0.35), Math.min(0.62, Math.max(0.5, hsl.l - 0.18)));
  return `#${color.getHexString()}`;
}

/** Canvas size the plane is drawn into; sprite scale maps it to world units. */
const MARKER_SIZE = 128;
/** Black outline width (px) ringed around the plane so it reads on any globe colour. */
const MARKER_OUTLINE = 5;

/**
 * Draw the plane icon, tinted with `color` and ringed with a black outline, to a billboard texture.
 * The plane is rendered once to an offscreen canvas, then a dilated black silhouette of it is stamped
 * behind the colour — one uniform outline that works without having to stroke the drawing by hand.
 */
function makeMarkerTexture(color: string): CanvasTexture {
  const glyph = drawGlyphCanvas(color);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = MARKER_SIZE;
  const ctx = canvas.getContext('2d')!;
  stampOutline(ctx, blackSilhouette(glyph));
  ctx.drawImage(glyph, 0, 0);
  return new CanvasTexture(canvas);
}

/** Render just the tinted plane (no outline) to its own canvas. */
function drawGlyphCanvas(color: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = MARKER_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineJoin = 'round';
  drawPlane(ctx);
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

/**
 * Top-down airplane silhouette, nose pointing UP (−y) so its forward direction is a known
 * {@link PLANE_FORWARD} of π/2 — independent of any system font's glyph orientation.
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

## Done when (this step)
- [ ] `npm run build` → clean (`Application bundle generation complete`), no `any`, no unused import. The file
      compiles standalone even though nothing constructs it yet (the renderer does that next step).
- [ ] `FlightLayer` exposes exactly `setTarget` / `setHidden` / `update` / `dispose` / `planePosition` /
      `highlightCode` publicly — no marker-icon or colour setters (those arrive in M11).

## If it breaks
- **`getCoords`/`toGeoCoords` not on `ThreeGlobe`** → the pinned `three-globe@2.45.2` exposes both; a version
  drift is the usual cause. Check `stack.md`.
- **`'PLANE_FORWARD'`/`vivid` reported unused** → you removed a caller by mistake; `PLANE_FORWARD` is read in
  `applyHeading`, `vivid` in the constructor. Keep the plane-orientation + arc-colour paths intact.
- **Tempted to add a boat/car/train icon or a `setMarker` method here** → don't. M8's overlay is plane-only;
  the whole marker system (icons, terrain/mirror, live colours) lands in M11 where the settings panel drives it.
