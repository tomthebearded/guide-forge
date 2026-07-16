# M8 · Verify — Trip / Flight mode ✈️
> Nav: [← Wire it into the globe page](12_globe-page-wiring.md) · [Overview](00_overview.md) · [Explore controls & sync →](../MILESTONE_9_explore-filters-sync/00_overview.md)

Run the pre-flight quality bar, then work the gate by hand. When it passes, put on some music and watch the
plane fly your library.

## Done-when gate (the real test — check every box by hand)
Run `npm run format:check`, `npm run lint`, `npm run build` first — all clean (`Application bundle generation
complete`, no lint errors). Then `ng serve --host 127.0.0.1 --port 4200`, log in, open `/globe`, click **Load
my music** once (so the map has data), and start playing on any Spotify client:

- [ ] **Tooling clean.** `npm run format:check` / `npm run lint` → clean; `npm run build` → `Application bundle
      generation complete`, no `any`, no unused symbols.
- [ ] **New country → the plane flies; arrives as the song ends.** Play a track whose primary artist resolves to
      a *different* country from the last → a dotted arc draws from the plane's current point, the plane flies
      along it (nose pointing along travel, banking into turns), the destination country lights up cyan and
      lifts, and the plane **arrives + starts circling roughly when the song ends**. A follow-camera keeps the
      marker centred; the globe stops auto-rotating while following.
- [ ] **Same country → it just circles.** Skip to another track by an artist from the **same** country → no new
      arc; the plane keeps circling that country's centroid.
- [ ] **Unknown origin → mid-Pacific, no crash.** Play a track whose artist has no resolvable country → the
      plane flies out over the empty mid-Pacific (~`0°, -155°`) and circles there, **no** country highlighted,
      and the console shows **no** error or unhandled rejection.
- [ ] **Trip log + passport accumulate.** The **Trip log** (top-left, under the HUD) shows the now-playing
      destination on top (`Now playing`) and finished stops beneath with arrival times; the **Passport**
      (bottom-left, above the legend) climbs — e.g. `12.5k km flown · 4 countries · 2 continents · 6 songs`.
- [ ] **They persist across reload.** Reload `/globe` → the trip log + passport are still there. In the console:
      `JSON.parse(localStorage['evm.tripLog']).stops.length` equals the number of finished stops shown.
- [ ] **Flight resolutions never touch the map.** Note `JSON.parse(localStorage['evm.origins']).artists.length`,
      then play several artists **not** in your scanned library → re-check: the number is **unchanged**. Playing
      music never adds to `evm.origins`.
- [ ] **Flight toggle keeps the leg advancing.** Open the view-options fab (bottom-right), switch **Flight**
      off → plane + arc + highlight disappear. Wait ~10 s, switch it back on → the plane reappears at its
      **live** point of the trip (it kept flying), not restarted at the start.
- [ ] **Toggles persist.** Turn off **Leaderboards** and **Journey passport**, reload → both stay off;
      `JSON.parse(localStorage['evm.viewPrefs'])` shows `showStats:false, showJourney:false`.
- [ ] **Render loop stays signal-free.** DevTools → Performance, record ~3 s mid-flight → per-frame
      `requestAnimationFrame`/three.js work, but **no** Angular change-detection frames per animation frame.

## Files after this milestone (complete — the checkpoint)

### `src/app/core/models/trip-stop.ts`
```ts
/** A completed leg of the trip — a song that finished, logged with where and when it landed. */
export interface TripStop {
  /** The finished track's id (list key). */
  trackId: string;
  /** Primary artist's Spotify id — lets the trip log link to the artist page (e.g. to fix origin). */
  artistId: string | null;
  /** Destination country (ISO alpha-2), or null when the artist's origin was unknown. */
  countryCode: string | null;
  /** Primary artist name(s). */
  label: string;
  /** Artist photo URL, or null if unavailable. */
  imageUrl: string | null;
  /** Epoch ms when the song finished — i.e. when the plane arrived at this stop. */
  arrivedAt: number;
}
```

### `src/app/features/globe/flight-target.ts`
```ts
// TripStop is a persisted domain model (it rides in localStorage), so it lives in core/models;
// re-exported here so flight callers can keep importing both flight types from one place.
export type { TripStop } from '../../core/models/trip-stop';

/** What the globe needs to fly the plane for the currently-playing track. */
export interface FlightTarget {
  /** Identity — a change is what triggers a new leg (circle or flight). */
  trackId: string;
  /** Primary artist's Spotify id — lets the trip log link to the artist page (e.g. to fix origin). */
  artistId: string | null;
  /** Destination country (ISO alpha-2), or null when the artist's origin is unknown. */
  countryCode: string | null;
  /** Primary artist name(s), shown as the plane's label. */
  label: string;
  /** Artist photo URL for the plane badge, or null if unavailable. */
  imageUrl: string | null;
  /** Track runtime in ms. */
  durationMs: number;
  /** Playback position into the track in ms when this target was built. */
  progressMs: number;
}
```

### `src/app/core/cache/trip-log-cache.ts`
```ts
import { Injectable } from '@angular/core';

import { TripStop } from '../models/trip-stop';
import { readJson, removeJson, writeJson } from './storage-cache';

const STORAGE_KEY = 'evm.tripLog';
const VERSION = 1;

/** Persisted trip log: the most recent stops, newest-first (bounded by the flight store). */
export interface TripLogSnapshot {
  version: number;
  stops: TripStop[];
}

/**
 * Persists the Trip-mode passport (finished flight stops) to localStorage so the journey log + its
 * totals survive a reload, instead of resetting to empty every time. Portable like the other caches
 * (no `evm.spotify.` prefix), so it rides along in the data export/import.
 */
@Injectable({ providedIn: 'root' })
export class TripLogCache {
  load(): TripStop[] {
    return readJson(STORAGE_KEY, (parsed) => (isSnapshot(parsed) ? parsed.stops : undefined), []);
  }

  save(stops: TripStop[]): void {
    const snapshot: TripLogSnapshot = { version: VERSION, stops };
    writeJson(STORAGE_KEY, snapshot);
  }

  clear(): void {
    removeJson(STORAGE_KEY);
  }
}

function isSnapshot(value: unknown): value is TripLogSnapshot {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return candidate['version'] === VERSION && Array.isArray(candidate['stops']);
}
```

### `src/app/core/cache/view-prefs-cache.ts`
```ts
import { Injectable } from '@angular/core';

import { readJson, writeJson } from './storage-cache';

const STORAGE_KEY = 'evm.viewPrefs';

/** Which globe overlays the user has chosen to show. Persisted across reloads. Grows in M9. */
export interface ViewPrefs {
  showStats: boolean;
  showLegend: boolean;
  /** The flight overlay (plane + route arc + country highlight + follow camera). */
  showFlight: boolean;
  showTripLog: boolean;
  showJourney: boolean;
  // showFilters (genre + era) and showTimeline (scrubber) are added in M9.
}

const DEFAULTS: ViewPrefs = {
  showStats: true,
  showLegend: true,
  showFlight: true,
  showTripLog: true,
  showJourney: true,
};

/** Persists the globe view's overlay-visibility preferences to localStorage. */
@Injectable({ providedIn: 'root' })
export class ViewPrefsCache {
  load(): ViewPrefs {
    // Merge over defaults so prefs saved before a field existed keep their other choices.
    return readJson(
      STORAGE_KEY,
      (parsed) => (isViewPrefs(parsed) ? { ...DEFAULTS, ...parsed } : undefined),
      { ...DEFAULTS },
    );
  }

  save(prefs: ViewPrefs): void {
    writeJson(STORAGE_KEY, prefs);
  }
}

function isViewPrefs(value: unknown): value is ViewPrefs {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['showStats'] === 'boolean' && typeof candidate['showLegend'] === 'boolean'
  );
}
```

### `src/app/features/globe/flight-store.ts`
```ts
import { effect, inject, Injectable, signal } from '@angular/core';

import { SpotifyApi } from '../../core/api/spotify-api';
import { TripLogCache } from '../../core/cache/trip-log-cache';
import { largestImageUrl } from '../../core/mappers/spotify.mapper';
import { ArtistRef } from '../../core/models/artist';
import { PlaybackState } from '../../core/models/playback-state';
import { ArtistResolution } from '../../core/pipeline/artist-resolution';
import { PlayerStore } from '../player/player-store';
import { FlightTarget, TripStop } from './flight-target';
import { GlobeStore } from './globe-store';

/** How many past stops the trip log keeps. */
const MAX_HISTORY = 25;

/**
 * Bridges live Spotify playback to the globe's flight animation. On every **track change** it finds
 * the primary artist's country — from the scanned dataset first, then resolving any other played
 * artist on the fly via Wikidata — and fetches the artist photo, then publishes a {@link FlightTarget}.
 * Async lookups are memoised so repeated plays don't re-query. Signal-only; the renderer consumes it.
 */
@Injectable({ providedIn: 'root' })
export class FlightStore {
  private readonly player = inject(PlayerStore);
  private readonly globe = inject(GlobeStore);
  private readonly spotify = inject(SpotifyApi);
  private readonly resolution = inject(ArtistResolution);
  private readonly tripLog = inject(TripLogCache);

  private readonly _target = signal<FlightTarget | null>(null);
  readonly target = this._target.asReadonly();

  /** Past stops, newest first — each song logged with its arrival time as the plane moves on. */
  private readonly _history = signal<TripStop[]>(this.tripLog.load());
  readonly history = this._history.asReadonly();

  /** artistId → resolved country / photo, so we never re-query the same artist. Only *hits* are
   * memoised for country, so a transient lookup failure retries on the next play. */
  private readonly countryMemo = new Map<string, string>();
  private readonly photoMemo = new Map<string, string | null>();
  private lastTrackId: string | null = null;
  /** Guards against an older slow lookup overwriting a newer track's target. */
  private buildSeq = 0;

  constructor() {
    effect(() => {
      const state = this.player.state();
      const trackId = state?.trackId ?? null;
      if (trackId === this.lastTrackId) {
        return; // same track, just a progress/poll tick — nothing to fly
      }
      this.lastTrackId = trackId;
      // The track just changed, so the previous destination has now been reached — log it.
      this.archiveCurrent();
      if (state === null || trackId === null) {
        this._target.set(null);
        return;
      }
      void this.build(state, trackId);
    });
  }

  /** Append the current destination to the trip log as a finished stop (arrived = now). */
  private archiveCurrent(): void {
    this.archiveTarget(this._target());
  }

  /** Log a destination as a finished stop, unless it's empty or already the newest entry. */
  private archiveTarget(target: FlightTarget | null): void {
    if (target === null || this._history()[0]?.trackId === target.trackId) {
      return; // nothing playing, or already logged (e.g. a pause/resume of the same track)
    }
    const stop: TripStop = {
      trackId: target.trackId,
      artistId: target.artistId,
      countryCode: target.countryCode,
      label: target.label,
      imageUrl: target.imageUrl,
      arrivedAt: Date.now(),
    };
    this._history.update((stops) => [stop, ...stops].slice(0, MAX_HISTORY));
    this.tripLog.save(this._history());
  }

  private async build(state: PlaybackState, trackId: string): Promise<void> {
    const seq = ++this.buildSeq;
    const primary = state.artists[0] ?? null;
    const [countryCode, imageUrl] = await Promise.all([
      this.resolveCountry(primary),
      this.resolvePhoto(primary),
    ]);
    const target: FlightTarget = {
      trackId,
      artistId: primary?.id ?? null,
      countryCode,
      label: state.artistNames,
      imageUrl,
      durationMs: state.durationMs,
      progressMs: state.progressMs,
    };
    if (seq !== this.buildSeq) {
      // A newer track superseded this build before it resolved — the song still played, so log its
      // stop here (archiveCurrent() couldn't, the target wasn't set yet when the track changed).
      this.archiveTarget(target);
      return;
    }
    this._target.set(target);
    void this.prefetchNext(seq);
  }

  /**
   * Warm the country + photo memos for the next item in the playback queue, so when the track
   * actually changes its destination resolves instantly (the slow MusicBrainz fallback especially).
   * Best-effort and fire-and-forget: a missing queue, an unplaced artist, or a rate-limit just skips.
   */
  private async prefetchNext(seq: number): Promise<void> {
    if (seq !== this.buildSeq) {
      return; // already superseded — don't bother
    }
    try {
      const next = await this.spotify.getNextQueuedArtist();
      if (next === null || seq !== this.buildSeq) {
        return;
      }
      await Promise.all([this.resolveCountry(next), this.resolvePhoto(next)]);
    } catch {
      // Lookahead is purely an optimisation — ignore any failure.
    }
  }

  /**
   * Resolves a played artist's country for the flight only. Reads from the scanned dataset, but
   * misses are resolved into a local memo — never written back to {@link GlobeStore}. So playing a
   * song (favourite or not) flies the plane without ever adding the artist to the scanned map.
   */
  private async resolveCountry(artist: ArtistRef | null): Promise<string | null> {
    if (artist === null) {
      return null;
    }
    const fromData = this.globe.countryOf(artist.id);
    if (fromData !== null) {
      return fromData;
    }
    const memoised = this.countryMemo.get(artist.id);
    if (memoised !== undefined) {
      return memoised;
    }
    // Fast Wikidata-by-id pass, then the same MusicBrainz-by-name fallback the globe scan uses, so a
    // played artist resolves consistently whether it came from the dataset or live playback.
    const map = await this.resolution.resolveBatchBySpotifyId([artist.id]);
    const code = map.get(artist.id) ?? (await this.resolution.resolveByName(artist.name));
    // Memoise only a real hit — leaving misses unmemoised lets a transient failure retry next play.
    if (code !== null) {
      this.countryMemo.set(artist.id, code);
    }
    return code;
  }

  private async resolvePhoto(artist: ArtistRef | null): Promise<string | null> {
    if (artist === null) {
      return null;
    }
    if (this.photoMemo.has(artist.id)) {
      return this.photoMemo.get(artist.id) ?? null;
    }
    try {
      const dto = await this.spotify.getArtist(artist.id);
      const url = largestImageUrl(dto.images);
      this.photoMemo.set(artist.id, url);
      return url;
    } catch {
      this.photoMemo.set(artist.id, null);
      return null;
    }
  }
}
```

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

### `src/app/features/globe/globe-renderer.ts` *(modified — flight layer + follow camera)*
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

### `src/app/features/globe/globe-canvas/globe-canvas.ts` *(modified — flight inputs + effects)*
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
import { FlightTarget } from '../flight-target';
import { GlobeRenderer } from '../globe-renderer';

/** Hovered country (ISO alpha-2, or null off-country) plus the cursor position in canvas pixels. */
export interface CountryHoverEvent {
  code: string | null;
  x: number;
  y: number;
}

/** Dumb host for the three.js globe: owns the renderer's DOM lifecycle and bridges inputs into it. */
@Component({
  selector: 'app-globe-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './globe-canvas.html',
  styleUrl: './globe-canvas.scss',
})
export class GlobeCanvas {
  /** Per-country heat (ISO alpha-2 → liked-track count). Recolours the globe live as it changes. */
  readonly heat = input<ReadonlyMap<string, number>>(new Map());

  /** The currently-playing track's flight directive, or null when nothing is playing. */
  readonly flightTarget = input<FlightTarget | null>(null);
  /** Whether the flight overlay (plane + route) is drawn. Hidden keeps flying in the background. */
  readonly flightVisible = input(true);

  /** Emits the hovered country (or null off-country) with the cursor position, anchoring a card later. */
  readonly countryHover = output<CountryHoverEvent>();

  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  private readonly geoData = inject(GeoData);
  private readonly renderer = new GlobeRenderer();
  /** Guards the effects: the renderer's methods are unsafe until init() has run (afterNextRender). */
  private ready = false;

  constructor() {
    // afterNextRender: the first moment the host <div> is a real DOM element — mount the renderer here.
    afterNextRender(async () => {
      const features = await this.geoData.features();
      this.renderer.setHoverHandler((code, x, y) => this.countryHover.emit({ code, x, y }));
      this.renderer.init(this.host().nativeElement, features);
      this.ready = true;
      // Push whatever state already exists now that the renderer is live — effects that fired before
      // `ready` flipped would have skipped these.
      this.renderer.applyHeat(this.heat());
      this.renderer.setFlightVisible(this.flightVisible());
      this.renderer.setFlightTarget(this.flightTarget());
    });

    // Each effect is a signal→imperative bridge — the ONLY place a signal touches the renderer; the
    // render loop itself stays signal-free (D4).
    effect(() => {
      const heat = this.heat();
      if (this.ready) {
        this.renderer.applyHeat(heat);
      }
    });

    effect(() => {
      const target = this.flightTarget();
      if (this.ready) {
        this.renderer.setFlightTarget(target);
      }
    });

    effect(() => {
      const visible = this.flightVisible();
      if (this.ready) {
        this.renderer.setFlightVisible(visible);
      }
    });

    // Component destroyed (e.g. navigating away from /globe) → release the WebGL context + GPU memory.
    inject(DestroyRef).onDestroy(() => this.renderer.dispose());
  }
}
```

> `globe-canvas.html` (`<div #host class="globe-host"></div>`) and `globe-canvas.scss` are **unchanged** from M4.

### `src/app/core/dto/spotify.dto.ts` *(modified — artist + queue dtos)*
```ts
/** Raw Spotify Web API payloads. Never used outside mappers — domain code uses models. */
/** Grows in M10 (album images on tracks, playlist-item paging, full tracks, artists). */

export interface SpotifyArtistRefDto {
  id: string;
  name: string;
}

/** Album as it rides on a track — the bits the liked-songs index needs. */
export interface SpotifyAlbumRefDto {
  id: string;
  name: string;
  album_type: string;
  /** `YYYY` | `YYYY-MM` | `YYYY-MM-DD`, per `release_date_precision`. */
  release_date: string;
}

/** One entry from `GET /me/tracks` — the saved `track` plus when it was saved. */
export interface SpotifySavedTrackDto {
  added_at: string;
  track: {
    id: string;
    name: string;
    /** Spotify URI (e.g. `spotify:track:...`) — used to start Liked Songs playback. */
    uri: string;
    artists: SpotifyArtistRefDto[];
    duration_ms: number;
    /** International Standard Recording Code — same recording shares it across re-releases. */
    external_ids?: { isrc?: string };
    album: SpotifyAlbumRefDto;
  };
}

/** The `GET /me/tracks` paging object: a page of saved tracks + the `next` cursor + the grand `total`. */
export interface SpotifySavedTracksDto {
  items: SpotifySavedTrackDto[];
  next: string | null;
  total: number;
}

/** Payload of `GET /me` — only the current user's id is needed. (Added in M2.) */
export interface SpotifyMeDto {
  id: string;
}

// --- M7: playback, devices, playlists ---

/** One image (album art / artist photo). Spotify lists them largest-first; width may be null. */
export interface SpotifyImageDto {
  url: string;
  width: number | null;
  height: number | null;
}

/** The currently-playing item as it rides on the playback state — enough for the header. */
export interface SpotifyTrackDto {
  id: string;
  name: string;
  duration_ms: number;
  artists: SpotifyArtistRefDto[];
  album: { images: SpotifyImageDto[] };
}

/** Payload of `GET /me/player`. Returns 204 (null body) when no device is active. */
export interface SpotifyPlaybackStateDto {
  is_playing: boolean;
  shuffle_state: boolean;
  /** Playback position into the current item, in ms (null when nothing is loaded). */
  progress_ms: number | null;
  /** Null for non-track items (e.g. podcast episodes) or when nothing is loaded. */
  item: SpotifyTrackDto | null;
}

/** One Spotify Connect device from `GET /me/player/devices`. */
export interface SpotifyDeviceDto {
  /** Null only for restricted devices that can't be targeted; we skip those. */
  id: string | null;
  is_active: boolean;
  name: string;
}

/** Payload of `GET /me/player/devices`. */
export interface SpotifyDevicesDto {
  devices: SpotifyDeviceDto[];
}

/** One playlist from `GET /me/playlists`. */
export interface SpotifyPlaylistDto {
  id: string;
  name: string;
  public: boolean | null;
  collaborative: boolean;
  /** Track-count summary. The Feb 2026 Dev Mode migration renamed this field `tracks` → `items`. */
  items: { total: number };
  owner: { id: string };
  /** Opaque version tag — changes iff the playlist's contents change. Drives the incremental sync (M10). */
  snapshot_id: string;
}

export interface SpotifyPlaylistsDto {
  /** Spotify returns `null` entries for playlists the user can no longer access. */
  items: (SpotifyPlaylistDto | null)[];
  next: string | null;
}

// --- M8: flight lookups (artist photo + queue peek) ---

/**
 * Payload of `GET /artists/{id}` — used for the artist photo that rides the flight plane. Its
 * `genres` tags also drive the M9 globe genre filter (unused in M8). // grows in M9
 */
export interface SpotifyArtistDto {
  id: string;
  name: string;
  images: SpotifyImageDto[];
  /** Spotify's genre tags for the artist; may be empty. Consumed by the M9 genre filter. */
  genres: string[];
}

/**
 * Payload of `GET /me/player/queue`. `queue[0]` is the next item up. Items may be episodes (no
 * `artists`), so the array is typed loosely and the caller guards.
 */
export interface SpotifyQueueDto {
  currently_playing: SpotifyTrackDto | null;
  queue: (SpotifyTrackDto | { id: string | null })[];
}
```

### `src/app/core/mappers/spotify.mapper.ts` *(modified — `largestImageUrl`)*
```ts
/** Dto → domain mappers. Grows in M10 (album/playlist-item/track mappers). */
import {
  SpotifyImageDto,
  SpotifyPlaybackStateDto,
  SpotifyPlaylistDto,
  SpotifyPlaylistsDto,
  SpotifySavedTracksDto,
} from '../dto/spotify.dto';
import { IndexedTrack } from '../models/indexed-track';
import { AlbumType, LikedTrack } from '../models/liked-track';
import { PlaybackState } from '../models/playback-state';
import { Playlist } from '../models/playlist';

const ALBUM_TYPES: readonly AlbumType[] = ['album', 'single', 'compilation'];

/** Map one raw `/me/tracks` page to clean {@link LikedTrack} domain models. */
export function toLikedTracks(page: SpotifySavedTracksDto): LikedTrack[] {
  return page.items.map((item) => ({
    id: item.track.id,
    name: item.track.name,
    uri: item.track.uri,
    isrc: item.track.external_ids?.isrc ?? null,
    addedAt: item.added_at,
    durationMs: item.track.duration_ms,
    artists: item.track.artists.map((artist) => ({ id: artist.id, name: artist.name })),
    album: {
      id: item.track.album.id,
      name: item.track.album.name,
      albumType: toAlbumType(item.track.album.album_type),
      releaseDate: item.track.album.release_date,
    },
  }));
}

/** Flatten a liked track into the persisted, per-artist-lookup index entry. */
export function toIndexedTrack(track: LikedTrack): IndexedTrack {
  return {
    id: track.id,
    name: track.name,
    uri: track.uri,
    isrc: track.isrc,
    durationMs: track.durationMs,
    addedAt: track.addedAt,
    albumId: track.album.id,
    albumName: track.album.name,
    albumType: track.album.albumType,
    releaseDate: track.album.releaseDate,
    artistIds: track.artists.map((artist) => artist.id),
  };
}

/** Null when no device is active or the current item is not a track (e.g. a podcast episode). */
export function toPlaybackState(dto: SpotifyPlaybackStateDto | null): PlaybackState | null {
  if (dto === null || dto.item === null) {
    return null;
  }
  return {
    isPlaying: dto.is_playing,
    shuffle: dto.shuffle_state,
    trackId: dto.item.id,
    trackName: dto.item.name,
    artists: dto.item.artists.map((artist) => ({ id: artist.id, name: artist.name })),
    artistNames: dto.item.artists.map((artist) => artist.name).join(', '),
    albumImageUrl: smallestImageUrl(dto.item.album.images),
    durationMs: dto.item.duration_ms,
    progressMs: dto.progress_ms ?? 0,
  };
}

/** The user's playlists, skipping the `null` entries Spotify sprinkles in for inaccessible playlists. */
export function toPlaylists(dto: SpotifyPlaylistsDto): Playlist[] {
  return dto.items.filter((item): item is SpotifyPlaylistDto => item !== null).map(toPlaylist);
}

function toPlaylist(dto: SpotifyPlaylistDto): Playlist {
  return {
    id: dto.id,
    name: dto.name,
    isPublic: dto.public,
    collaborative: dto.collaborative,
    trackCount: dto.items.total,
    ownerId: dto.owner.id,
    snapshotId: dto.snapshot_id,
  };
}

/** Coerce Spotify's free-text `album_type` to our union, defaulting unknowns to `album`. */
function toAlbumType(value: string): AlbumType {
  return (ALBUM_TYPES as readonly string[]).includes(value) ? (value as AlbumType) : 'album';
}

/** Smallest available image (Spotify lists them largest-first) — the compact header thumbnail. */
function smallestImageUrl(images: SpotifyImageDto[]): string | null {
  if (images.length === 0) {
    return null;
  }
  const smallest = images.reduce((min, image) =>
    (image.width ?? Infinity) < (min.width ?? Infinity) ? image : min,
  );
  return smallest.url;
}

/** Largest available image (Spotify lists them largest-first) — used for the plane's artist photo. */
export function largestImageUrl(images: SpotifyImageDto[]): string | null {
  if (images.length === 0) {
    return null;
  }
  const largest = images.reduce((max, image) =>
    (image.width ?? 0) > (max.width ?? 0) ? image : max,
  );
  return largest.url;
}
```

### `src/app/core/api/spotify-api.ts` *(modified — `getArtist` + `getNextQueuedArtist`)*
```ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  SpotifyArtistDto,
  SpotifyDevicesDto,
  SpotifyMeDto,
  SpotifyPlaybackStateDto,
  SpotifyPlaylistsDto,
  SpotifyQueueDto,
  SpotifySavedTracksDto,
} from '../dto/spotify.dto';
import { toLikedTracks, toPlaylists } from '../mappers/spotify.mapper';
import { ArtistRef } from '../models/artist';
import { LikedTrack } from '../models/liked-track';
import { Playlist } from '../models/playlist';
import { withRetry } from '../pipeline/http-retry';

/** `GET /me/tracks` and `GET /me/playlists` return at most 50 items per page. */
const PAGE_SIZE = 50;
/** Library save/remove/contains batch their uris ≤50; playlist adds cap at 100 uris. */
const ID_BATCH = 50;
const URI_BATCH = 100;

const trackUri = (id: string): string => `spotify:track:${id}`;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/**
 * Typed client for the Spotify Web API. The M1 auth interceptor adds the bearer token; the M2
 * rate-limit gate (via `rateLimitInterceptor`) is the **single** pacer for every call here — spacing,
 * an adaptive rolling-window cap, and 429 cooldowns across all Spotify traffic (paging, the player
 * poll, controls). This service keeps no throttle of its own. Grows again in M10 (artist enrichment,
 * discography, playlist-membership index, library relink).
 */
@Injectable({ providedIn: 'root' })
export class SpotifyApi {
  private readonly http = inject(HttpClient);

  /**
   * Streams the user's Liked Songs newest-first, one page (≤50) at a time, following Spotify's
   * `next` cursor. Consumers may stop iterating early. Each page is mapped to clean {@link LikedTrack}s.
   */
  async *streamLikedTracks(): AsyncIterable<LikedTrack[]> {
    let url: string | null = `${environment.spotify.apiBaseUrl}/me/tracks?limit=${PAGE_SIZE}`;
    while (url !== null) {
      const next: string = url;
      const page: SpotifySavedTracksDto = await withRetry(() =>
        firstValueFrom(this.http.get<SpotifySavedTracksDto>(next)),
      );
      yield toLikedTracks(page);
      url = page.next;
    }
  }

  /**
   * A one-call summary of the user's Liked Songs — total count + newest `added_at` — via
   * `GET /me/tracks?limit=1`. The cheap diff a boot sync uses (M9) to decide whether the library changed.
   */
  async getLikedTracksSummary(): Promise<{ total: number; newest: string | null }> {
    const base = environment.spotify.apiBaseUrl;
    const page = await withRetry(() =>
      firstValueFrom(this.http.get<SpotifySavedTracksDto>(`${base}/me/tracks?limit=1`)),
    );
    return { total: page.total, newest: page.items[0]?.added_at ?? null };
  }

  /**
   * URIs of the user's Liked Songs, newest-first, up to `limit` — used by the player to auto-start
   * favourites when nothing is playing. Pages in ≤50s only as far as `limit` requires.
   */
  async getLikedTrackUris(limit: number): Promise<string[]> {
    const base = environment.spotify.apiBaseUrl;
    let url: string | null = `${base}/me/tracks?limit=${Math.min(PAGE_SIZE, limit)}`;
    const uris: string[] = [];
    while (url !== null && uris.length < limit) {
      const next: string = url;
      const page: SpotifySavedTracksDto = await withRetry(() =>
        firstValueFrom(this.http.get<SpotifySavedTracksDto>(next)),
      );
      for (const item of page.items) {
        uris.push(item.track.uri);
      }
      url = page.next;
    }
    return uris.slice(0, limit);
  }

  /** The current user's profile — only the id is used (to decide playlist ownership). */
  async getMe(): Promise<SpotifyMeDto> {
    const base = environment.spotify.apiBaseUrl;
    return await firstValueFrom(this.http.get<SpotifyMeDto>(`${base}/me`));
  }

  // --- M7: playback read ---

  /** Current playback state, or `null` when no device is active (Spotify replies 204). */
  async getPlaybackState(): Promise<SpotifyPlaybackStateDto | null> {
    const base = environment.spotify.apiBaseUrl;
    return await firstValueFrom(this.http.get<SpotifyPlaybackStateDto | null>(`${base}/me/player`));
  }

  /** Targetable Spotify Connect devices (restricted ones with no id are dropped). */
  async getDevices(): Promise<{ id: string; isActive: boolean }[]> {
    const base = environment.spotify.apiBaseUrl;
    const dto = await firstValueFrom(this.http.get<SpotifyDevicesDto>(`${base}/me/player/devices`));
    return dto.devices
      .filter((device): device is typeof device & { id: string } => device.id !== null)
      .map((device) => ({ id: device.id, isActive: device.is_active }));
  }

  // --- M7: transport controls ---

  /**
   * Resume or start playback. With no options, resumes the active device; pass `uris` to start a
   * specific set of tracks and `deviceId` to target / wake a specific device.
   */
  async play(options: { uris?: string[]; deviceId?: string } = {}): Promise<void> {
    const base = environment.spotify.apiBaseUrl;
    const query = options.deviceId ? `?device_id=${options.deviceId}` : '';
    const body = options.uris ? { uris: options.uris } : {};
    await firstValueFrom(this.http.put(`${base}/me/player/play${query}`, body));
  }

  /** Pause playback on the active device. */
  async pause(): Promise<void> {
    await firstValueFrom(this.http.put(`${environment.spotify.apiBaseUrl}/me/player/pause`, {}));
  }

  /** Skip to the next track. */
  async next(): Promise<void> {
    await firstValueFrom(this.http.post(`${environment.spotify.apiBaseUrl}/me/player/next`, {}));
  }

  /** Skip to the previous track. */
  async previous(): Promise<void> {
    await firstValueFrom(this.http.post(`${environment.spotify.apiBaseUrl}/me/player/previous`, {}));
  }

  /** Toggle shuffle on the active device. */
  async setShuffle(state: boolean): Promise<void> {
    const base = environment.spotify.apiBaseUrl;
    await firstValueFrom(this.http.put(`${base}/me/player/shuffle?state=${state}`, {}));
  }

  /** Make a device the active one, optionally starting playback on it. */
  async transferPlayback(deviceId: string, play: boolean): Promise<void> {
    const base = environment.spotify.apiBaseUrl;
    await firstValueFrom(this.http.put(`${base}/me/player`, { device_ids: [deviceId], play }));
  }

  // --- M7: Liked Songs (❤) ---

  /** Whether each of the given track ids is in the user's Liked Songs (`user-library-read`). */
  async areTracksSaved(ids: string[]): Promise<boolean[]> {
    return this.libraryContains(ids.map(trackUri));
  }

  /** Add tracks to Liked Songs. */
  async saveTracks(ids: string[]): Promise<void> {
    await this.saveToLibrary(ids.map(trackUri));
  }

  /** Remove tracks from Liked Songs. */
  async removeSavedTracks(ids: string[]): Promise<void> {
    await this.removeFromLibrary(ids.map(trackUri));
  }

  /**
   * Save the given Spotify URIs to the user's library. The Feb 2026 Dev Mode migration replaced the
   * entity-specific save/follow endpoints with one generic `PUT /me/library` keyed by URI.
   */
  private async saveToLibrary(uris: string[]): Promise<void> {
    const base = environment.spotify.apiBaseUrl;
    for (const batch of chunk(uris, ID_BATCH)) {
      await withRetry(() => firstValueFrom(this.http.put(`${base}/me/library`, { uris: batch })));
    }
  }

  /** Remove the given Spotify URIs from the user's library (the `DELETE /me/library` counterpart). */
  private async removeFromLibrary(uris: string[]): Promise<void> {
    const base = environment.spotify.apiBaseUrl;
    for (const batch of chunk(uris, ID_BATCH)) {
      await withRetry(() =>
        firstValueFrom(this.http.delete(`${base}/me/library`, { body: { uris: batch } })),
      );
    }
  }

  /**
   * Whether each given URI is in the user's library, order preserved — the `GET /me/library/contains`
   * replacement. The response shape isn't documented in the migration guide; we assume an ordered
   * boolean array and validate it so a changed response fails loud here rather than silently corrupting
   * "is it saved?" downstream.
   */
  private async libraryContains(uris: string[]): Promise<boolean[]> {
    const base = environment.spotify.apiBaseUrl;
    const out: boolean[] = [];
    for (const batch of chunk(uris, ID_BATCH)) {
      const url = `${base}/me/library/contains?uris=${batch.join(',')}`;
      const flags = await withRetry(() => firstValueFrom(this.http.get<unknown>(url)));
      if (
        !Array.isArray(flags) ||
        flags.length !== batch.length ||
        flags.some((f) => typeof f !== 'boolean')
      ) {
        throw new Error(`Unexpected /me/library/contains response shape: ${JSON.stringify(flags)}`);
      }
      out.push(...(flags as boolean[]));
    }
    return out;
  }

  // --- M7: playlists ---

  /** The user's playlists, following the `next` cursor. */
  async getMyPlaylists(): Promise<Playlist[]> {
    const base = environment.spotify.apiBaseUrl;
    let url: string | null = `${base}/me/playlists?limit=${PAGE_SIZE}`;
    const playlists: Playlist[] = [];
    while (url !== null) {
      const next: string = url;
      const page = await withRetry(() => firstValueFrom(this.http.get<SpotifyPlaylistsDto>(next)));
      playlists.push(...toPlaylists(page));
      url = page.next;
    }
    return playlists;
  }

  /**
   * Append track URIs to a playlist (batched ≤100). Endpoint uses the migrated `…/items` path. Gains a
   * `position` parameter in M10 for the relink substitution (drop the new copy where the old one sat).
   */
  async addTracksToPlaylist(playlistId: string, uris: string[]): Promise<void> {
    const base = environment.spotify.apiBaseUrl;
    for (const batch of chunk(uris, URI_BATCH)) {
      await withRetry(() =>
        firstValueFrom(this.http.post(`${base}/playlists/${playlistId}/items`, { uris: batch })),
      );
    }
  }

  // --- M8: flight lookups (artist photo + queue peek) ---

  /**
   * Full artist object — used for the artist photo that rides the flight plane. Public data: needs
   * only a valid token. (The `genres` tags on the same payload drive the M9 genre filter.)
   */
  async getArtist(id: string): Promise<SpotifyArtistDto> {
    const base = environment.spotify.apiBaseUrl;
    return await firstValueFrom(this.http.get<SpotifyArtistDto>(`${base}/artists/${id}`));
  }

  /**
   * Primary artist of the next item in the playback queue, or null when the queue is empty or the
   * next item is a non-track (e.g. a podcast episode with no artists). Lets the flight store
   * pre-resolve the upcoming destination so the plane can launch the instant the track changes.
   */
  async getNextQueuedArtist(): Promise<ArtistRef | null> {
    const base = environment.spotify.apiBaseUrl;
    const dto = await firstValueFrom(this.http.get<SpotifyQueueDto>(`${base}/me/player/queue`));
    const next = dto.queue[0];
    if (next === undefined || !('artists' in next)) {
      return null;
    }
    const artist = next.artists[0];
    return artist === undefined ? null : { id: artist.id, name: artist.name };
  }
}
```

### `src/app/features/globe/trip-log/trip-log.ts`
```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { CountryFlag } from '../country-flag/country-flag';
import { FlightTarget, TripStop } from '../flight-target';

/** One line in the trip log — the current destination (`when` null) or a finished stop. */
interface LogRow {
  key: string;
  artistId: string | null;
  countryCode: string | null;
  label: string;
  imageUrl: string | null;
  /** Arrival date/time for finished stops; null for the destination currently being played. */
  when: string | null;
}

/** Date + time a song finished, e.g. "11 Jun, 14:32". */
const ARRIVAL_FORMAT = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Trip log for Trip mode: the destination currently playing (flag only, no time) on top, then the
 * stops already reached — each with its country flag, the band that played, its photo, and the
 * arrival time (when that song finished). Dumb: inputs only; {@link FlightStore} owns the data.
 */
@Component({
  selector: 'app-trip-log',
  imports: [MatIconModule, CountryFlag, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trip-log.html',
  styleUrl: './trip-log.scss',
})
export class TripLog {
  readonly current = input<FlightTarget | null>(null);
  readonly history = input<readonly TripStop[]>([]);

  protected readonly rows = computed<LogRow[]>(() => {
    const rows: LogRow[] = [];
    const cur = this.current();
    if (cur !== null) {
      rows.push({
        key: 'current',
        artistId: cur.artistId,
        countryCode: cur.countryCode,
        label: cur.label,
        imageUrl: cur.imageUrl,
        when: null,
      });
    }
    for (const stop of this.history()) {
      rows.push({
        key: `${stop.trackId}-${stop.arrivedAt}`,
        artistId: stop.artistId,
        countryCode: stop.countryCode,
        label: stop.label,
        imageUrl: stop.imageUrl,
        when: ARRIVAL_FORMAT.format(stop.arrivedAt),
      });
    }
    return rows;
  });
}
```

### `src/app/features/globe/trip-log/trip-log.html`
```html
<section class="log">
  <h2 class="title">
    <mat-icon>route</mat-icon>
    Trip log
  </h2>

  @if (rows().length === 0) {
    <p class="empty">Play a song to start your trip.</p>
  } @else {
    <ol class="stops">
      @for (row of rows(); track row.key) {
        <li class="stop" [class.current]="row.when === null">
          @if (row.imageUrl !== null) {
            <img class="photo" [src]="row.imageUrl" [alt]="row.label" width="40" height="40" />
          } @else {
            <span class="photo placeholder"><mat-icon>music_note</mat-icon></span>
          }

          <div class="info">
            <span class="band" [title]="row.label">{{ row.label }}</span>
            <span class="when">
              @if (row.when === null) {
                Now playing
              } @else {
                {{ row.when }}
              }
            </span>
          </div>

          @if (row.countryCode !== null) {
            <app-country-flag [code]="row.countryCode" />
          } @else if (row.artistId !== null) {
            <a
              class="flag-unknown link"
              [routerLink]="['/library/artist', row.artistId]"
              title="Origin unknown — open the artist page to set it"
            >
              ?
            </a>
          } @else {
            <span class="flag-unknown" title="Origin unknown">?</span>
          }
        </li>
      }
    </ol>
  }
</section>
```

### `src/app/features/globe/trip-log/trip-log.scss`
```scss
.log {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 17rem;
  max-height: min(70vh, 34rem);
  padding: 0.9rem 1rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--space-surface) 88%, transparent);
  border: 1px solid color-mix(in srgb, var(--neon-teal) 25%, transparent);
  backdrop-filter: blur(8px);
  box-shadow: var(--glow-shadow);
}

.title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  font: var(--mat-sys-title-small);
  color: var(--neon-teal);

  mat-icon {
    font-size: 1.2rem;
    width: 1.2rem;
    height: 1.2rem;
  }
}

.empty {
  margin: 0;
  font: var(--mat-sys-body-small);
  color: var(--mat-sys-on-surface-variant);
}

.stops {
  list-style: none;
  margin: 0 -0.5rem;
  padding: 0 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: calc(5 * 40px + 4 * 0.5rem + 0.8rem);
  overflow-x: hidden;
  overflow-y: auto;
}

.stop {
  display: flex;
  align-items: center;
  gap: 0.6rem;

  &.current {
    padding: 0.4rem 0.5rem;
    margin: -0.1rem -0.5rem;
    border-radius: 0.5rem;
    background: color-mix(in srgb, var(--neon-cyan) 14%, transparent);
  }
}

.photo {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid color-mix(in srgb, var(--neon-teal) 35%, transparent);
}

.photo.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--space-void) 60%, transparent);
  color: var(--mat-sys-on-surface-variant);

  mat-icon {
    font-size: 1.2rem;
    width: 1.2rem;
    height: 1.2rem;
  }
}

.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.band {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--mat-sys-on-surface);
}

.when {
  font: var(--mat-sys-body-small);
  color: var(--mat-sys-on-surface-variant);
  font-variant-numeric: tabular-nums;
}

.flag-unknown {
  flex: 0 0 auto;
  width: 32px;
  text-align: center;
  color: var(--mat-sys-on-surface-variant);
  font-weight: 600;
}

a.flag-unknown.link {
  text-decoration: none;
  border-radius: 50%;
  border: 1px dashed color-mix(in srgb, var(--neon-cyan) 45%, transparent);
  color: var(--neon-cyan);
  cursor: pointer;

  &:hover {
    background: color-mix(in srgb, var(--neon-cyan) 16%, transparent);
  }
}
```

### `src/app/features/globe/journey-stats/journey-stats.ts`
```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Running totals for the current trip — distance flown and where it has reached. */
export interface JourneyTotals {
  /** Total great-circle distance flown across all legs, in km. */
  distanceKm: number;
  /** Distinct countries visited (known origins only). */
  countries: number;
  /** Distinct continents touched. */
  continents: number;
  /** Songs played this trip (every stop, including unknown origins). */
  songs: number;
  /** Songs whose artist origin couldn't be placed — they drift over open water. */
  unknown: number;
}

interface StatRow {
  icon: string;
  value: string;
  label: string;
}

/** Compact "passport" of the trip's distance, countries, and continents. Dumb: one input. */
@Component({
  selector: 'app-journey-stats',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './journey-stats.html',
  styleUrl: './journey-stats.scss',
})
export class JourneyStats {
  readonly stats = input.required<JourneyTotals>();

  protected readonly rows = computed<StatRow[]>(() => {
    const s = this.stats();
    const rows: StatRow[] = [
      { icon: 'flight_takeoff', value: formatDistance(s.distanceKm), label: 'flown' },
      {
        icon: 'public',
        value: `${s.countries}`,
        label: plural(s.countries, 'country', 'countries'),
      },
      {
        icon: 'travel_explore',
        value: `${s.continents}`,
        label: plural(s.continents, 'continent', 'continents'),
      },
      { icon: 'music_note', value: `${s.songs}`, label: plural(s.songs, 'song', 'songs') },
    ];
    if (s.unknown > 0) {
      rows.push({ icon: 'help_outline', value: `${s.unknown}`, label: 'unknown' });
    }
    return rows;
  });
}

/** "1,240 km" up to four digits, then "1.2k km" so the card never overflows on a long trip. */
function formatDistance(km: number): string {
  const rounded = Math.round(km);
  if (rounded < 10_000) {
    return `${rounded.toLocaleString()} km`;
  }
  return `${(rounded / 1000).toFixed(rounded < 100_000 ? 1 : 0)}k km`;
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}
```

### `src/app/features/globe/journey-stats/journey-stats.html`
```html
<section class="journey">
  <h2 class="title">
    <mat-icon>luggage</mat-icon>
    Passport
  </h2>

  <ul class="rows">
    @for (row of rows(); track row.label) {
      <li class="row">
        <mat-icon class="icon">{{ row.icon }}</mat-icon>
        <span class="value">{{ row.value }}</span>
        <span class="label">{{ row.label }}</span>
      </li>
    }
  </ul>
</section>
```

### `src/app/features/globe/journey-stats/journey-stats.scss`
```scss
.journey {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 12rem;
  padding: 0.7rem 0.85rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--space-surface) 88%, transparent);
  border: 1px solid color-mix(in srgb, var(--neon-teal) 25%, transparent);
  backdrop-filter: blur(8px);
  box-shadow: var(--glow-shadow);
}

.title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  font: var(--mat-sys-title-small);
  color: var(--neon-teal);

  mat-icon {
    font-size: 1.2rem;
    width: 1.2rem;
    height: 1.2rem;
  }
}

.rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.icon {
  flex: 0 0 auto;
  align-self: center;
  font-size: 1.05rem;
  width: 1.05rem;
  height: 1.05rem;
  color: color-mix(in srgb, var(--neon-cyan) 80%, transparent);
}

.value {
  font: var(--mat-sys-title-small);
  color: var(--mat-sys-on-surface);
  font-variant-numeric: tabular-nums;
}

.label {
  font: var(--mat-sys-body-small);
  color: var(--mat-sys-on-surface-variant);
}
```

### `src/app/features/globe/view-options/view-options.ts`
```ts
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

/**
 * Pinned control to toggle which globe overlays are visible — and hide them all at once for a
 * globe-only view. Dumb: inputs/outputs only; the page owns and persists the state. The open/closed
 * state of its little panel is purely local view state. Grows in M9 (filters + timeline toggles) and
 * M11 (a "save image" action).
 */
@Component({
  selector: 'app-view-options',
  imports: [MatButtonModule, MatIconModule, MatSlideToggleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './view-options.html',
  styleUrl: './view-options.scss',
})
export class ViewOptions {
  readonly showStats = input(true);
  readonly showLegend = input(true);
  readonly showFlight = input(true);
  readonly showTripLog = input(true);
  readonly showJourney = input(true);

  readonly toggleStats = output<boolean>();
  readonly toggleLegend = output<boolean>();
  readonly toggleFlight = output<boolean>();
  readonly toggleTripLog = output<boolean>();
  readonly toggleJourney = output<boolean>();
  readonly hideAll = output<void>();

  protected readonly open = signal(false);
}
```

### `src/app/features/globe/view-options/view-options.html`
```html
@if (open()) {
  <div class="panel">
    <mat-slide-toggle [checked]="showStats()" (change)="toggleStats.emit($event.checked)">
      Leaderboards
    </mat-slide-toggle>
    <mat-slide-toggle [checked]="showLegend()" (change)="toggleLegend.emit($event.checked)">
      Heat legend
    </mat-slide-toggle>
    <mat-slide-toggle [checked]="showFlight()" (change)="toggleFlight.emit($event.checked)">
      Flight (plane &amp; route)
    </mat-slide-toggle>
    <mat-slide-toggle [checked]="showTripLog()" (change)="toggleTripLog.emit($event.checked)">
      Trip log
    </mat-slide-toggle>
    <mat-slide-toggle [checked]="showJourney()" (change)="toggleJourney.emit($event.checked)">
      Journey passport
    </mat-slide-toggle>
    <button mat-stroked-button class="hide-all" (click)="hideAll.emit()">
      <mat-icon>visibility_off</mat-icon>
      Hide all
    </button>
  </div>
}

<button
  mat-mini-fab
  class="trigger"
  (click)="open.set(!open())"
  [attr.aria-label]="open() ? 'Close overlay options' : 'Show or hide globe overlays'"
>
  <mat-icon>{{ open() ? 'close' : 'visibility' }}</mat-icon>
</button>
```

### `src/app/features/globe/view-options/view-options.scss`
```scss
:host {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--space-surface) 90%, transparent);
  border: 1px solid color-mix(in srgb, var(--neon-teal) 25%, transparent);
  backdrop-filter: blur(8px);
  box-shadow: var(--glow-shadow);
}

.hide-all {
  margin-top: 0.25rem;
}

.trigger {
  box-shadow: var(--glow-shadow);
}
```

### `src/app/features/globe/globe-page/globe-page.ts` *(modified)*
```ts
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';

import { ViewPrefsCache } from '../../../core/cache/view-prefs-cache';
import { countryCentroids, GeoData, greatCircleKm, LatLng } from '../../../core/geo/geo-data';
import { LogStore } from '../../../core/logging/log-store';
import { Country } from '../../../core/models/country';
import { CountryHover } from '../country-hover/country-hover';
import { CountryStat, CountryStats, StatBoard } from '../country-stats/country-stats';
import { FlightStore } from '../flight-store';
import { CountryHoverEvent, GlobeCanvas } from '../globe-canvas/globe-canvas';
import { GlobeStore } from '../globe-store';
import { HeatLegend } from '../heat-legend/heat-legend';
import { JourneyStats, JourneyTotals } from '../journey-stats/journey-stats';
import { LogTerminal } from '../log-terminal/log-terminal';
import { ScanList } from '../scan-list/scan-list';
import { TripLog } from '../trip-log/trip-log';
import { UnplacedArtists } from '../unplaced-artists/unplaced-artists';
import { ViewOptions } from '../view-options/view-options';

@Component({
  selector: 'app-globe-page',
  imports: [
    GlobeCanvas,
    CountryHover,
    CountryStats,
    HeatLegend,
    LogTerminal,
    ScanList,
    UnplacedArtists,
    TripLog,
    JourneyStats,
    ViewOptions,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './globe-page.html',
  styleUrl: './globe-page.scss',
})
export class GlobePage {
  protected readonly store = inject(GlobeStore);
  /** Live progress lines for the loading-terminal overlay. */
  protected readonly log = inject(LogStore);
  private readonly flight = inject(FlightStore);
  /** Drives the plane animation from live Spotify playback. */
  protected readonly flightTarget = this.flight.target;
  /** Finished stops for the trip log (newest first). */
  protected readonly tripHistory = this.flight.history;

  /** Countries for the fixup picker, loaded once from the GeoJSON. */
  protected readonly countries = signal<Country[]>([]);
  /** Country centroids + continents, loaded from the GeoJSON for the Trip-mode journey stats. */
  private readonly centroids = signal<ReadonlyMap<string, LatLng>>(new Map());
  private readonly continents = signal<ReadonlyMap<string, string>>(new Map());
  /** Whether the couldn't-place fixup panel is open. */
  protected readonly showFixups = signal(false);

  // --- Overlay visibility (persisted; D5 — independent toggles, not a mode switch) ---
  private readonly viewPrefs = inject(ViewPrefsCache);
  protected readonly showStats = signal(true);
  protected readonly showLegend = signal(true);
  /** The flight overlay (plane + route + follow camera). When off it keeps flying, just hidden. */
  protected readonly showFlight = signal(true);
  protected readonly showTripLog = signal(true);
  protected readonly showJourney = signal(true);

  // --- Hover card state ---
  /** ISO alpha-2 of the country under the pointer, fed by the globe canvas. */
  protected readonly hoveredCode = signal<string | null>(null);
  /** Cursor position (canvas px) where the current country was entered — anchors the hover card. */
  protected readonly hoverPos = signal({ x: 0, y: 0 });
  /** Place the card below the cursor when there's more room there than above, so it never clips. */
  protected readonly hoverBelow = signal(false);
  /** Max height (px) for the card's artist list, sized to the free space on the chosen side. */
  protected readonly hoverListMax = signal(240);
  /** Pending card dismissal — deferred so the pointer can travel from globe onto the card. */
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly hoveredArtists = computed(() => {
    const code = this.hoveredCode();
    return code === null ? [] : (this.store.artistsByCountry().get(code) ?? []);
  });
  protected readonly hoveredCountryName = computed(() => {
    const code = this.hoveredCode();
    return code === null ? '' : this.countryName(code);
  });

  // --- Heat legend (adapts to the heat mode; the toggle is a guide extension, D8) ---
  protected readonly legendCaption = computed(() =>
    this.store.heatMode() === 'hours' ? 'Hours per country' : 'Tracks per country',
  );
  protected readonly legendUnit = computed(() => (this.store.heatMode() === 'hours' ? 'h' : '♪'));
  /** The hot end of the legend scale, converted to whole hours in 'hours' mode. */
  protected readonly legendMax = computed(() =>
    this.store.heatMode() === 'hours'
      ? Math.round(this.store.maxHeat() / 3_600_000)
      : this.store.maxHeat(),
  );

  /** Top-10 country leaderboards by artists, liked tracks, and liked-music hours. */
  protected readonly statBoards = computed<StatBoard[]>(() => {
    const byArtists = [...this.store.artistsByCountry().entries()].map(([code, artists]) => ({
      code,
      name: this.countryName(code),
      value: artists.length,
    }));
    const byTracks = [...this.store.tracksByCountry().entries()].map(([code, value]) => ({
      code,
      name: this.countryName(code),
      value,
    }));
    const byHours = [...this.store.durationByCountry().entries()].map(([code, ms]) => ({
      code,
      name: this.countryName(code),
      // ms → hours, one decimal place.
      value: Math.round(ms / 360_000) / 10,
    }));
    return [
      { caption: 'Top countries · artists', rows: top10(byArtists) },
      { caption: 'Top countries · tracks', unit: '♪', rows: top10(byTracks) },
      { caption: 'Top countries · hours', unit: 'h', rows: top10(byHours) },
    ];
  });

  /**
   * Running totals for the Trip-mode passport. The chronological stop sequence is the history
   * (newest-first) reversed, with the now-playing destination appended as the latest stop; distance
   * sums the great-circle hops between consecutive *known, distinct* countries.
   */
  protected readonly journeyTotals = computed<JourneyTotals>(() => {
    const current = this.flightTarget();
    const stops = [...this.tripHistory()].reverse();
    const codes = stops.map((s) => s.countryCode);
    if (current !== null) {
      codes.push(current.countryCode);
    }

    const centroids = this.centroids();
    const continents = this.continents();
    const countries = new Set<string>();
    const seenContinents = new Set<string>();
    let distanceKm = 0;
    let unknown = 0;
    let prev: LatLng | null = null;
    let prevCode: string | null = null;

    for (const code of codes) {
      if (code === null) {
        unknown++;
        continue;
      }
      countries.add(code);
      const continent = continents.get(code);
      if (continent !== undefined) {
        seenContinents.add(continent);
      }
      const here = centroids.get(code) ?? null;
      if (here !== null && prev !== null && code !== prevCode) {
        distanceKm += greatCircleKm(prev, here);
      }
      if (here !== null) {
        prev = here;
        prevCode = code;
      }
    }

    return {
      distanceKm,
      countries: countries.size,
      continents: seenContinents.size,
      songs: codes.length,
      unknown,
    };
  });

  constructor() {
    // Restore the persisted dataset synchronously — NO network. A reload recolours instantly; the
    // scan runs only on demand (the HUD button). (Boot-sync moves this to app root in M9.)
    this.store.restore();
    // Load the country list (fixup picker) + centroids/continents (journey stats) from the GeoJSON.
    const geoData = inject(GeoData);
    void geoData.countries().then((countries) => this.countries.set(countries));
    void geoData.features().then((features) => this.centroids.set(countryCentroids(features)));
    void geoData.continents().then((continents) => this.continents.set(continents));

    // Load overlay-visibility prefs, then persist any change back (D5).
    const prefs = this.viewPrefs.load();
    this.showStats.set(prefs.showStats);
    this.showLegend.set(prefs.showLegend);
    this.showFlight.set(prefs.showFlight);
    this.showTripLog.set(prefs.showTripLog);
    this.showJourney.set(prefs.showJourney);
    effect(() =>
      this.viewPrefs.save({
        showStats: this.showStats(),
        showLegend: this.showLegend(),
        showFlight: this.showFlight(),
        showTripLog: this.showTripLog(),
        showJourney: this.showJourney(),
      }),
    );

    // Drop any stale hover when leaving the globe view (the canvas is destroyed then).
    effect(() => {
      if (this.store.phase() !== 'globe') {
        this.hoveredCode.set(null);
      }
    });
  }

  /** Scan Liked Songs and resolve countries. The store picks full-vs-incremental from its own state. */
  protected load(): void {
    void this.store.recalculate();
  }

  /** Hide every overlay for a bare-globe view. */
  protected hideAll(): void {
    this.showStats.set(false);
    this.showLegend.set(false);
    this.showFlight.set(false);
    this.showTripLog.set(false);
    this.showJourney.set(false);
  }

  /**
   * Globe hover changed. A country anchors and shows the card; leaving a country (null) defers the
   * dismissal so the pointer can cross the gap onto the card — `cancelHide` (card mouseenter) keeps
   * it open. The anchor only moves on a country change, so the card stays put to be hovered.
   */
  protected onHover(event: CountryHoverEvent): void {
    if (event.code === null) {
      this.scheduleHide();
      return;
    }
    this.cancelHide();
    // Keep the card on-screen horizontally; translateX(-50%) centres it on this x.
    const half = 192;
    const x = Math.min(Math.max(event.x, half), window.innerWidth - half);
    this.hoverPos.set({ x, y: event.y });

    // Flip the card to whichever side of the cursor has more room, then cap its scroll list to that
    // side's free height so it grows to fit and only scrolls when it genuinely can't.
    const above = event.y;
    const below = window.innerHeight - event.y;
    const placeBelow = below > above;
    const RESERVED = 130; // card header + summary + paddings + 14px cursor gap + edge margin
    this.hoverBelow.set(placeBelow);
    this.hoverListMax.set(Math.max(120, (placeBelow ? below : above) - RESERVED));

    this.hoveredCode.set(event.code);
  }

  protected scheduleHide(): void {
    this.cancelHide();
    this.hideTimer = setTimeout(() => this.hoveredCode.set(null), 220);
  }

  protected cancelHide(): void {
    if (this.hideTimer !== null) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  /** code → country, rebuilt only when the country list changes — so name lookups aren't a linear
   * scan repeated for every leaderboard row on each `statBoards` recompute. */
  private readonly countryByCode = computed(
    () => new Map(this.countries().map((c) => [c.code, c])),
  );

  private countryName(code: string): string {
    return this.countryByCode().get(code)?.name ?? code;
  }
}

/** Highest-value 10, sorted descending. */
function top10(stats: CountryStat[]): CountryStat[] {
  return [...stats].sort((a, b) => b.value - a.value).slice(0, 10);
}
```

### `src/app/features/globe/globe-page/globe-page.html` *(modified)*
```html
@if (store.phase() === 'globe') {
  <app-globe-canvas
    class="globe"
    [heat]="store.heat()"
    [flightTarget]="flightTarget()"
    [flightVisible]="showFlight()"
    (countryHover)="onHover($event)"
  />

  <!-- Top-left column: scan HUD (moves to the Actions page in M9) over the trip log. -->
  <div class="stack-tl">
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

        @if (store.unplaced().length > 0) {
          <button type="button" class="hud__link" (click)="showFixups.set(!showFixups())">
            {{ showFixups() ? 'Hide' : 'Fix' }} {{ store.unplaced().length }} unplaced
          </button>
        }
      } @else {
        <p class="hud__hint">Load your Liked Songs to colour the globe by artist country.</p>
      }
    </div>

    @if (showTripLog()) {
      <app-trip-log [current]="flightTarget()" [history]="tripHistory()" />
    }
  </div>

  <!-- Hover card, anchored to the cursor. -->
  @if (hoveredCode() !== null && hoveredArtists().length > 0) {
    <app-country-hover
      class="hover"
      [class.below]="hoverBelow()"
      [style.left.px]="hoverPos().x"
      [style.top.px]="hoverPos().y"
      [style.--artists-max]="hoverListMax() + 'px'"
      [countryCode]="hoveredCode() ?? ''"
      [countryName]="hoveredCountryName()"
      [artists]="hoveredArtists()"
      (mouseenter)="cancelHide()"
      (mouseleave)="scheduleHide()"
    />
  }

  <!-- Bottom-left column: journey passport over the heat-mode toggle + legend. -->
  <div class="stack-bl">
    @if (showJourney() && journeyTotals().songs > 0) {
      <app-journey-stats [stats]="journeyTotals()" />
    }

    @if (store.heat().size > 0) {
      <div class="heat-toggle" role="group" aria-label="Heat metric">
        <button
          type="button"
          [class.active]="store.heatMode() === 'tracks'"
          (click)="store.setHeatMode('tracks')"
        >
          ♪ Tracks
        </button>
        <button
          type="button"
          [class.active]="store.heatMode() === 'hours'"
          (click)="store.setHeatMode('hours')"
        >
          h Hours
        </button>
      </div>
      @if (showLegend()) {
        <app-heat-legend [max]="legendMax()" [caption]="legendCaption()" [unit]="legendUnit()" />
      }
    }
  </div>

  <!-- Bottom-right: leaderboards, above the view-options fab. -->
  @if (showStats() && store.heat().size > 0) {
    <app-country-stats class="stats" [boards]="statBoards()" />
  }

  <!-- Overlay-visibility fab (bottom-right corner). -->
  <app-view-options
    class="view-options"
    [showStats]="showStats()"
    [showLegend]="showLegend()"
    [showFlight]="showFlight()"
    [showTripLog]="showTripLog()"
    [showJourney]="showJourney()"
    (toggleStats)="showStats.set($event)"
    (toggleLegend)="showLegend.set($event)"
    (toggleFlight)="showFlight.set($event)"
    (toggleTripLog)="showTripLog.set($event)"
    (toggleJourney)="showJourney.set($event)"
    (hideAll)="hideAll()"
  />

  <!-- Fixup overlay: couldn't-place list + inline picker → sticky setCountry. -->
  @if (showFixups() && store.unplaced().length > 0) {
    <app-unplaced-artists
      class="fixups"
      [artists]="store.unplaced()"
      [countries]="countries()"
      (place)="store.setCountry($event.artistId, $event.code)"
      (hide)="store.hideUnplaced($event)"
    />
  }
} @else {
  <app-scan-list
    class="scan"
    [artists]="store.artists()"
    [phase]="store.phase()"
    [resolving]="store.isResolving()"
    (done)="store.showGlobe()"
  />
}

<!-- Loading terminal: a blocking, semi-transparent overlay streaming what's being loaded. Keeps a
     live spinner and prevents any action on the controls beneath until the scan finishes. -->
@if (store.isResolving()) {
  <app-log-terminal
    [entries]="log.entries()"
    [resolvedCount]="store.resolvedCount()"
    [pendingCount]="store.pendingCount()"
    [failedCount]="store.failedCount()"
    [total]="store.total()"
  />
}
```

### `src/app/features/globe/globe-page/globe-page.scss` *(modified)*
```scss
:host {
  display: block;
  position: relative;
  // Fill the viewport below the 64px toolbar so the globe sits in full-bleed space.
  height: calc(100dvh - 64px);
  overflow: hidden;
  background: radial-gradient(circle at 50% 40%, #0b1626 0%, var(--space-void, #070b14) 70%);
}

.globe,
.scan {
  display: block;
  width: 100%;
  height: 100%;
}

// Top-left column: the scan HUD over the trip log. Each child hides independently; the column
// collapses around whatever's left so they never overlap.
.stack-tl {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  max-width: 17rem;
}

.hud {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 100%;
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

// Text-style button that opens the fixup panel.
.hud__link {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  color: var(--neon-violet, #c39bff);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

// Bottom-left column: journey passport → heat-mode toggle → legend.
.stack-bl {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.6rem;
}

// Segmented tracks/hours toggle (guide extension, D8).
.heat-toggle {
  display: inline-flex;
  border-radius: 0.6rem;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--neon-teal) 25%, transparent);
  background: color-mix(in srgb, var(--space-surface) 80%, transparent);
  backdrop-filter: blur(8px);

  button {
    padding: 0.35rem 0.75rem;
    border: 0;
    background: transparent;
    color: var(--mat-sys-on-surface-variant);
    font: var(--mat-sys-body-small);
    cursor: pointer;

    &.active {
      background: color-mix(in srgb, var(--neon-teal) 22%, transparent);
      color: var(--mat-sys-on-surface);
      font-weight: 700;
    }
  }
}

// Leaderboards sit above the view-options fab (bottom-right) so both share the corner.
.stats {
  position: absolute;
  bottom: 4.5rem;
  right: 1rem;
  z-index: 1;
}

.view-options {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  z-index: 2;
}

// Fixup overlay: centred sheet above the other controls; the panel handles its own scroll.
.fixups {
  position: absolute;
  top: 5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 4;
  width: min(48rem, calc(100vw - 2rem));
}

.hover {
  position: absolute;
  // left/top are bound to the cursor position (canvas px); sit just above the cursor by default.
  z-index: 3;
  transform: translate(-50%, calc(-100% - 14px));
  // Hoverable: the user moves onto the card to scroll it and click artist links.
  pointer-events: auto;
}

// Near the top edge, flip below the cursor so the card never clips off-screen.
.hover.below {
  transform: translate(-50%, 14px);
}
```

## What you have now (cumulative)
On top of the logged-in, resilient, globe-colouring app with a live player (M0–M7), the globe is now a **live
music trip**. A root-singleton `FlightStore` watches the M7 player and, on every track change, publishes a
`FlightTarget` — resolving the artist's country *in isolation* (a local memo, never written to `evm.origins`).
The signal-free `FlightLayer` flies a plane along a timed Bézier arc to a new country (or circles the same one),
arriving as the song ends; unknown origins drift to the mid-Pacific. A follow-camera tracks the marker. A
persisted **trip log** and **passport** (great-circle distance, countries, continents) accumulate across
reloads (`evm.tripLog`), and five independent, persisted overlay toggles (`evm.viewPrefs`) let you compose the
view — Trip and Explore are just toggles on one globe, not a mode switch.

## Troubleshooting
| Symptom | Likely cause → fix |
|---------|--------------------|
| Playing a song does nothing | `FlightStore` was never instantiated (nothing injected it) → the globe page injects it (step 12). Or the canvas `[flightTarget]` binding is missing. |
| Plane teleports instead of flying | The song was detected late (its `progressMs` near `durationMs`); `MIN_FLIGHT_MS` gives a 2.5 s floor — if it still snaps, the arc `duration` is ≤0 (check `durationMs - progressMs`). |
| Plane flies to the wrong place / always the Pacific | The artist's country isn't resolving. Expected for genuinely unknown artists (→ Pacific). Otherwise check `resolveCountry` — it must read `globe.countryOf` then the two-tier chain. |
| `evm.origins` grows while just playing music | A flight resolution was written back to `GlobeStore`. `FlightStore.resolveCountry` must memoise locally only — never call `setCountry`/`accumulate`. |
| Trip log/passport reset on reload | `evm.tripLog` key drift, or `FlightStore._history` wasn't seeded from `tripLog.load()` / `archiveTarget` didn't `tripLog.save(...)`. |
| Flight toggle restarts the trip when re-shown | `setFlightVisible` disposed/rebuilt the layer instead of toggling `setHidden`; the layer must keep `update()`-ing while hidden. |
| Toggles don't persist | The `viewPrefs.save(...)` `effect()` was dropped, or a `show*` signal isn't read inside it (so it doesn't re-run). |
| Globe won't auto-rotate anymore | `follow` is stuck true — `updateFollow()` must be called after `setFlightTarget(null)`; `updateAutoRotate()` gates on `!follow && hoveredCode === null`. |
| `Cannot find module '../../core/cache/appearance-cache'` / stray `MarkerKind` import | You pulled in the source's marker system; M8 is plane-only — there's no `MarkerKind` here (it's born in M11). Drop the import. |
| CD frames fire every animation frame | Something in the loop reads a signal → the loop must stay signal-free ([D4](../foundation/decision-log.md#d4--signal-free-render-loop)); the canvas `effect()`s are the only bridge. |

## Next
Continue to **[M9 — Explore controls & sync](../MILESTONE_9_explore-filters-sync/00_overview.md)** — the
timeline scrubber (as-of month), era + genre filters (+ the genre worker), boot-sync, and the Actions page that
takes over the scan controls from this milestone's HUD.

---
> Nav: [← Wire it into the globe page](12_globe-page-wiring.md) · [Overview](00_overview.md) · [Explore controls & sync →](../MILESTONE_9_explore-filters-sync/00_overview.md)
