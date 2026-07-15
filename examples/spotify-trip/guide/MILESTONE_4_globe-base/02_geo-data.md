# M4 · Step 02 of 8 — The `Country` model + `geo-data.ts`
> Nav: [← Install & data](01_deps-and-geojson.md) · [Overview](00_overview.md) · [Renderer scene →](03_renderer-scene.md)

This step touches **2 files, committed together**: `core/models/country.ts` (a tiny domain type) and
`core/geo/geo-data.ts` (the service + pure geo functions). The service imports the model, so they belong in
one commit.

## Glossary for this step
> **memoize** — cache a function's result the first time it runs and return that cache on later calls. Here `GeoData` caches the fetched-and-parsed GeoJSON so it's loaded and parsed **once**, shared by the renderer and the picker.
> **centroid** — a country's representative point (roughly its centre of mass). See [glossary](../foundation/glossary.md#centroid). Used later (M8) to place the flying marker; computed now because it's pure geo.
> **point-in-polygon** — testing whether a lat/lng falls inside a polygon. `pickCountryCode` uses the even-odd **ray-casting** rule (count how many times a ray from the point crosses the ring's edges; odd = inside).
> **great-circle distance** — the shortest distance between two points on a sphere, via the **haversine** formula. Built now (pure geo), consumed by M8's trip stats.

## Why / design
The renderer and the country picker both need the same parsed polygons — loading the ~800 KB file twice would
be wasteful. So `GeoData` is a root-singleton service that **memoizes** the fetch: the first `features()` call
starts the HTTP GET and caches the *promise*; every later call awaits the same promise. One deliberate twist:
if the fetch **fails**, we drop the cache so a transient blip (offline, a flaky reload) can retry next call
instead of permanently breaking the globe.

Everything else in this file is a **pure function** over the loaded features — no Angular, no state:
`isoA2` (read the two-letter code, working around Natural Earth's `-99` placeholders), `countryCentroids`,
`greatCircleKm`, and `pickCountryCode`. Pure functions are trivial to reuse from the plain (non-Angular)
renderer, which matters because the renderer must stay signal-free
([decision-log D4](../foundation/decision-log.md#d4--signal-free-render-loop)).

> **Mental model — DTO vs domain, again.** GeoJSON `properties` is an untyped `Record<string, unknown>` (a raw
> external shape). We never let that leak into the UI: `isoA2`/`countryName` read it defensively and hand back
> clean values, and `countries()` returns `Country[]` — the domain model. You'll see this Dto→domain split
> throughout the Spotify/Wikidata code too.

> **Forward-looking:** M4 itself only needs `features` + the pure functions to draw and hover-pick the globe.
> The two async read accessors `countries()` and `continents()` are built now (they belong with the service)
> but aren't consumed until later — `countries()` feeds the manual-override picker in **M6**, and
> `continents()` labels legs/regions from **M8** on. Expect them to sit unused until then.

## Do this
1. **Create `src/app/core/models/country.ts`** — the selectable-country domain type. Its two fields (`code`,
   `name`) are the contract the manual-override picker (a later milestone) and the readout use.
2. **Create `src/app/core/geo/geo-data.ts`** — paste the file below verbatim. Notes on the load-bearing bits:
   - `COUNTRIES_URL = 'geo/countries-110m.geo.json'` **must** match the asset path from step 01 (no leading slash — it's relative to the app's base href).
   - `@Injectable({ providedIn: 'root' })` makes `GeoData` a singleton, so the memo is app-wide.
   - `inject(HttpClient)` needs `provideHttpClient()`, already wired in **M2** — no new provider here.
   - The many `!` non-null assertions are required by our strict `noUncheckedIndexedAccess` tsconfig; leave them.
   - `isoA2` prefers `ISO_A2`, falls back to `ISO_A2_EH` — Natural Earth stores `-99` placeholders for disputed
     borders, and the `_EH` ("EH" = a de-facto variant) column fills some of those gaps.

## Code
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

> **Note — `greatCircleKm` and `countryCentroids` are exported but unused in M4.** That's intentional: they're
> pure geo, cheap to write now, and M8's flight/trip stats consume them. Don't delete them as "dead code."

## Done when (this step)
- [ ] `npm run build` → compiles clean (no TS errors about `noUncheckedIndexedAccess` or missing imports).
- [ ] The files exist at `src/app/core/models/country.ts` and `src/app/core/geo/geo-data.ts`; nothing imports
      them yet (the renderer, next, is the first consumer) — that's expected.

## If it breaks
- **`Property 'get' does not exist` / no `HttpClient` provider at runtime** → `provideHttpClient()` isn't in
  `app.config.ts`. It was added in M2; re-check the providers array.
- **TS error `Object is possibly 'undefined'` on `ring[i]`** → you dropped a `!` when pasting. The strict
  `noUncheckedIndexedAccess` setting requires them; paste the file verbatim.
- **`countries()` returns an empty array at runtime** → the fetch resolved but features lack `ISO_A2`/`ADMIN`.
  Confirm step 01's file is the admin_0 countries export.
