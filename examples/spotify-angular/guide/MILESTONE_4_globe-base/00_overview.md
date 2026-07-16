# Milestone 4 — The globe (three.js, no data)
> Core · milestone 4 of 12 · prev: [Liked Songs streaming](../MILESTONE_3_liked-songs-stream/00_overview.md) · next: [Country resolution + heat](../MILESTONE_5_country-resolution-heat/00_overview.md)

## Goal
Render a slowly rotating 3D globe with Natural-Earth country polygons using **three.js + three-globe**, and
highlight whichever country the pointer is over. You build the geo layer (`geo-data.ts` — load the 110m
GeoJSON once, memoized; plus pure functions for centroids, great-circle distance, and point-in-polygon
country picking), the **signal-free** `globe-renderer.ts` (a plain class with its own
`requestAnimationFrame` loop, `OrbitControls`, raycast hover picking, and — critically — clean WebGL
disposal), the `globe-canvas` component (the Angular↔three.js lifecycle bridge: `afterNextRender` to mount,
`DestroyRef` to tear down), and a `globe-page` skeleton reachable at `/globe`. The end state: you orbit a
living globe, hovering a country lifts and whitens it, and the corner readout shows its ISO code.

> Depends only on M0's shell (plus M2's `provideHttpClient` for loading the GeoJSON). It sits after M3 in the
> default order, but nothing in M4 needs the Spotify data — it's the visual spine everything later hangs on.

## Scope discipline
This milestone puts **no data** on the globe. Deliberately deferred, and a step that adds any of these is out
of scope — stop and flag it:
- **Heat coloring** (country fill by liked-track count/hours) → **M5**. M4's land is one flat colour; the
  renderer has **no** `applyHeat`, no heat map, no cold→hot ramp.
- **The flight overlay** (plane marker, great-circle routes, follow camera, `FlightLayer`/`FlightTarget`) →
  **M8**. The renderer has **no** flight fields or methods; the great-circle helper is built now (it's pure
  geo) but nothing calls it yet.
- **Live palette / day-night lighting / marker-icon** swap methods (`applyPalette`, `setLighting`,
  `setMarkerIcon`) → **M5/M11**. M4 uses fixed studio lighting and hardcoded base colours.
- **The hover/select country card, stats, legend, filters, timeline, settings panel, `GlobeStore`** → **M5/M6+**.
  M4's page is a bare host with a **temporary** ISO-code readout (replaced by the real card in M6).
- **The "save image" snapshot** (`captureImage`, `preserveDrawingBuffer`) → **M11**.

Cosmetic simplifications (not deferrals, just trimmed for teaching): the source also paints a starfield and a
cel-shaded (toon) ocean; M4 uses a plain lit sphere so the teaching stays on the six core concerns.

## Prerequisite
M3 complete: the zoneless `spotify-angular` app runs, `provideHttpClient()` is wired (M2), and `three` +
`three-globe` were installed during the M0 scaffold (per `foundation/stack.md`). You have a home/landing route
you can navigate back to — you'll need it to prove the globe disposes when you leave `/globe`.

## Steps at a glance
**Sitting 1 — Geo foundation (01–02)**
1. [Install three deps + add the country GeoJSON](01_deps-and-geojson.md)
2. [The `Country` model + `geo-data.ts` (load, pick, centroids, distance)](02_geo-data.md)

**Sitting 2 — The signal-free renderer (03–04)**
3. [`globe-renderer.ts` — scene, camera, renderer, globe, loop, disposal](03_renderer-scene.md)
4. [Add raycast hover picking to the renderer](04_renderer-hover.md)

**Sitting 3 — The Angular bridge & page (05–08)**
5. [`globe-canvas` — the afterNextRender/DestroyRef bridge](05_globe-canvas.md)
6. [`globe-page` skeleton + temporary hover readout](06_globe-page.md)
7. [Wire the `/globe` route](07_globe-route.md)
8. [Verify — orbit, hover, dispose](08_verify.md)

## Design / decisions folded in
- **The render loop is signal-free — [decision-log D4](../foundation/decision-log.md#d4--signal-free-render-loop).**
  Taught in steps 03–05: the renderer is a plain class with its own `requestAnimationFrame`; it never reads or
  writes Angular signals. In a **zoneless** app ([glossary](../foundation/glossary.md#zoneless)) touching a
  signal every frame would thrash [change detection](../foundation/glossary.md#change-detection-cd). The only
  Angular↔renderer seam is the canvas component's lifecycle hooks (and, from M5, `effect()`s).
- **Load the GeoJSON once, memoized.** Step 02: `GeoData` caches the fetch promise so the renderer and the
  picker share one parse — but drops the cache on failure so a transient error can retry.
- **Point-in-polygon picking, not per-country meshes.** Step 04: hover raycasts an invisible sphere, converts
  the hit to lat/lng, then does an even-odd ray-cast test against the polygons — cheap and exact.
- **Pin `three@~0.184` with `three-globe@2.45.2`** — [decision-log R2](../foundation/decision-log.md#r2--pin-three-0184-with-three-globe-2452).
- Conventions in play: [suffix-less naming, OnPush, signal IO, separate html/scss, `inject()`](../foundation/conventions.md).

## Done-when gate
- [ ] Navigate to `/globe` → a blue globe with country outlines fades in and **rotates slowly on its own**;
      dragging orbits it, the scroll wheel zooms (clamped), and it never pans.
- [ ] Hover a country (e.g. Brazil) → that country **lifts slightly and brightens toward white**, auto-rotation
      pauses, and the top-left readout shows `Hovering: BR`. Move to the ocean → readout shows `Hovering: —`.
- [ ] Open DevTools → **Performance/FPS**: the frame loop runs continuously **without** triggering Angular
      change detection each frame (no CD churn in the profiler while you're just orbiting).
- [ ] Navigate away from `/globe` (back to home), then check the Console → **no errors**, and DevTools shows
      the WebGL context released (the canvas element is gone from the DOM; no "too many WebGL contexts" warning
      after several round-trips).

## Handoff
### Recap
M4 stands up the whole three.js layer: a memoized geo-data service, a plain signal-free renderer that owns its
render loop and disposes cleanly, and the thin Angular components that mount and tear it down. The globe spins
and hover-picks countries — but carries no library data yet.

### Done so far (cumulative)
- **M0** — Zoneless `spotify-angular` Angular 21.2 project; Material 3 custom theme; ESLint/Prettier tooling; app
  shell + `app.routes.ts` + `app.config.ts`; `three@~0.184` + `three-globe@2.45.2` installed.
- **M1** — Spotify **PKCE** login: authorize + `callback` route (`http://127.0.0.1:4200/callback`), token
  exchange/refresh, `evm.*` token storage.
- **M2** — HTTP resilience layer: adaptive **AIMD** rate-limit gate (one authority per host), `withRetry`
  (429 excluded), `provideHttpClient()` wiring.
- **M3** — Liked Songs streaming: track DTOs → domain mappers/models, the `streamLikedTracks` async generator,
  the `LikedIndex` + its `evm.likedIndex` cache; the landing page renders a live liked-track count.
- **M4** — The globe: geo-data service + pure geo functions, the signal-free `GlobeRenderer`, the
  `globe-canvas` bridge, the `globe-page` skeleton at `/globe`. **(this milestone)**

### Artifacts now in the project
- `public/geo/countries-110m.geo.json` — Natural Earth 110m country polygons.
- `src/app/core/models/country.ts` — the `Country` domain model.
- `src/app/core/geo/geo-data.ts` — `GeoData` service (`features`, `countries`, `continents`) + pure functions
  (`isoA2`, `countryCentroids`, `greatCircleKm`, `pickCountryCode`) and types (`GeoFeature`, `LatLng`).
- `src/app/features/globe/globe-renderer.ts` — the signal-free three.js renderer (M4 intermediate: no
  heat/flight/palette).
- `src/app/features/globe/globe-canvas/{globe-canvas.ts,globe-canvas.html,globe-canvas.scss}` — the canvas
  bridge component (M4 intermediate: base globe + hover only).
- `src/app/features/globe/globe-page/{globe-page.ts,globe-page.html,globe-page.scss}` — the page skeleton.
- `src/app/app.routes.ts` — **unchanged**: the `/globe` route has existed since M0 (guarded in M1); it now
  resolves to the real `GlobePage` instead of the placeholder, but no line of the file changes in M4.

### Decisions / open issues
- `greatCircleKm` and `countryCentroids` are built and exported now (pure geo) but **unused in M4** — M8's
  flight consumes them. This is intentional, not dead code to delete.
- The `globe-page` ISO readout is a **temporary** M4 dev affordance; M6 replaces it with the real
  hover/select country card.
- Base colours + studio lighting are hardcoded in the renderer; M5 makes land encode heat, M11 makes the
  palette live from settings.

### Next milestone
**M5 — Country resolution + heat 🚦** (the reality-check gate): resolve each liked artist to an ISO country
(batched Wikidata SPARQL → MusicBrainz fallback), fold the counts into a heat map, and feed it into the globe
via a new `heat` signal input + `effect()` bridge + the renderer's `applyHeat`. Done-when: countries light up
by how much of your library comes from them.

---
> Core · milestone 4 of 12 · prev: [Liked Songs streaming](../MILESTONE_3_liked-songs-stream/00_overview.md) · next: [Country resolution + heat](../MILESTONE_5_country-resolution-heat/00_overview.md)
