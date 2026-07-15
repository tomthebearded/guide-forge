# Milestone 8 — Trip / Flight mode
> Features · milestone 8 of 12 · prev: [The live player](../MILESTONE_7_live-player/00_overview.md) · next: [Explore controls & sync](../MILESTONE_9_explore-filters-sync/00_overview.md)

## Goal
Turn live playback into a plane flying across the globe. On every **track change**, a signal-free three.js
layer flies (or circles) a marker to the playing artist's country — arriving roughly **as the song ends** — a
follow-camera keeps the marker centred, a persisted **trip log** + **passport** (great-circle distance,
countries, continents) accumulate, and independent **overlay toggles** let you show/hide each panel and
persist the choice. Crucially, the flight resolves the artist's country **in isolation**: playing a song
*never* writes to the scanned globe dataset (`evm.origins`), so it can't pollute the map.

## Scope discipline
This milestone deliberately does **not** do:
- **Timeline scrubber / as-of month / era + genre filters / the genre worker** → M9. Don't add
  `setAsOfMonth`, `genreFilter`, `eraDecades`, `timelineMonths`, `availableGenres`, or the filter/scrubber
  components. The `view-prefs` model here holds **only** the five M8 toggles (`showStats`, `showLegend`,
  `showFlight`, `showTripLog`, `showJourney`); `showFilters`/`showTimeline` are added in M9.
- **Boot-sync / the Actions page / `globe-hud`** → M9. The scan controls stay on the globe HUD from M6 (they
  move to the Actions page in M9).
- **The settings panel UI** (colours / lighting / marker picker) → M11. M8's overlay flies a **fixed plane**:
  the flight arc/marker colours are hardcoded in the renderer, and the whole marker system — the icon picker
  (`markerIcon`), the terrain-aware boat swap, live colours, and the `MarkerKind` type itself — lands in M11.
  No `SettingsStore`, `SettingsPanel`, `applyPalette`, `dayMode`, `markerIcon`, or `captureImage`.
- **Library / artist page** → M10. The trip log links to `/library/artist/:id` (a route that lands in M10);
  clicking it before then is an expected dead link.

> Reminder ([decision-log D5](../foundation/decision-log.md#d5--likedindex-is-a-byproduct-of-the-globe-scan-tripexplore-are-overlay-toggles)):
> **"Trip" and "Explore" are not a mode switch** — they're independent, persisted overlay toggles on the same
> globe page. There is no mode enum; each panel is shown/hidden on its own.

## Prerequisite
M7 complete: the header player polls `/me/player` and exposes `PlayerStore.state()` (a `PlaybackState | null`).
You also rely on **M5** (`GlobeStore.countryOf()`, the two-tier `ArtistResolution`, the signal-free
`GlobeRenderer` + `GlobeCanvas`) and **M4**'s geo helpers (`countryCentroids`, `greatCircleKm`, `LatLng`,
`GeoData.continents()`), which already exist. `npm run build` is clean on the M7 state.

## Steps at a glance

**Sitting 1 — The flight data bridge (01–04)**
1. [Trip types: `TripStop` + `FlightTarget`](01_flight-target-model.md)
2. [Persist the trip log (`evm.tripLog`)](02_trip-log-cache.md)
3. [Spotify: artist photo + queue peek](03_spotify-artist-queue.md)
4. [`FlightStore` — the isolated playback→flight bridge](04_flight-store.md)

**Sitting 2 — The signal-free flight animation (05–07)**
5. [`FlightLayer` — the three.js plane, arc & marker](05_flight-layer.md)
6. [Grow the renderer: fly the plane + follow camera](06_globe-renderer-flight.md)
7. [Grow the canvas: `flightTarget` / `flightVisible` inputs](07_globe-canvas-flight.md)

**Sitting 3 — Trip log, passport & overlay toggles (08–13)**
8. [`TripLog` component](08_trip-log.md)
9. [`JourneyStats` (the passport) component](09_journey-stats.md)
10. [Persist the overlay prefs (`evm.viewPrefs`)](10_view-prefs-cache.md)
11. [`ViewOptions` toggle panel](11_view-options.md)
12. [Wire it all into the globe page](12_globe-page-wiring.md)
13. [Verify the milestone](13_verify.md)

## Design / decisions folded in
- **Isolated flight resolution (never pollute the map).** `FlightStore` reads the scanned dataset via
  `GlobeStore.countryOf()`, but a *miss* is resolved into a **local memo** — never written back to
  `GlobeStore`. Taught in step 04; it's the mechanism behind the D5 promise that Trip and Explore stay
  separate.
- **Signal-free render loop ([D4](../foundation/decision-log.md#d4--signal-free-render-loop)).** `FlightLayer`
  is a plain three.js class driven imperatively (`setTarget` on a track change, `update(now)` per frame). The
  only signal→imperative bridge is the canvas `effect()`s (step 07). Taught across steps 05–07.
- **Overlay toggles, not a mode switch (D5).** `view-prefs-cache` persists five independent booleans; the
  page reads them into signals and an `effect()` saves them back (steps 10, 12).
- **Time-based, frame-rate-independent animation.** The flight arrives as the song ends by parametrising the
  arc on real elapsed time; heading/bank/follow easing use time-constants so a dropped frame never lurches
  (steps 05, 06). New terms — `FlightTarget`, `TripStop`, great-circle distance, follow camera — are defined at
  first use in the steps below.

## Done-when gate
Run `npm run format:check`, `npm run lint`, `npm run build` — all clean (`Application bundle generation
complete`, no lint errors). Then `ng serve --host 127.0.0.1 --port 4200`, log in, open `/globe`, load your
music once so the map has data, and start playing on any Spotify client:
- [ ] **Play a song → the plane flies (or circles).** On a track whose artist resolves to a *different*
      country from the last, a dotted arc draws and the plane flies along it, the destination country lights
      up, and it arrives (then circles) **roughly as the song ends**. A same-country skip just keeps circling.
- [ ] **Unknown origin → mid-Pacific, no crash.** Play a track whose artist has no resolvable country → the
      plane flies out over the empty mid-Pacific and circles there; no console error, no unhandled rejection.
- [ ] **Trip log + passport accumulate and persist.** As songs change, the **Trip log** panel grows
      (now-playing on top, finished stops below with arrival times) and the **Passport** totals climb
      (`… km flown`, countries, continents, songs). Reload `/globe` → both survive;
      `JSON.parse(localStorage['evm.tripLog']).stops.length` matches the finished-stop count.
- [ ] **Flight resolutions never touch the map.** Play several artists (some *not* in your scanned library).
      `JSON.parse(localStorage['evm.origins']).artists.length` is **unchanged** by playback — flying a plane
      never adds an artist to `evm.origins`.
- [ ] **Overlay toggle keeps the leg advancing.** Open the view-options fab, switch **Flight** off → the
      plane/arc/highlight vanish but time still passes; switch it back on → it reappears at the plane's *live*
      point of the trip (not restarted). The choice survives a reload (`evm.viewPrefs`).

## Handoff
### Recap
M8 bridges the live player to the globe: a signal-free flight layer flies a marker to the now-playing artist's
country (isolated from the scanned dataset), a follow-camera tracks it, and a persisted trip log + passport +
overlay toggles turn the globe into a live "music trip".

### Done so far (cumulative)
- **M0** — zoneless Angular 21 + Material 3 shell, routed placeholders, custom dark palette, serves on 127.0.0.1.
- **M1** — Spotify PKCE login; token in `localStorage`; guarded `/globe`; logout clears + redirects.
- **M2** — HTTP resilience: `withRetry` + the adaptive AIMD rate-limit gate + auth/rate-limit interceptors.
- **M3** — Liked Songs stream in as an async generator; `LikedIndex` persists + restores.
- **M4** — the three.js globe: signal-free renderer, Natural-Earth polygons, hover picking, clean disposal.
- **M5** 🚦 — two-tier country resolution (Wikidata batch → MusicBrainz), `GlobeStore`, live heat, persist to `evm.origins`.
- **M6** — hover card + leaderboards + heat-mode toggle + sticky manual `setCountry` fixups + log terminal.
- **M7** — the live header player: `PlayerStore` polling, optimistic controls, device activation, ❤, playlists.
- **M8** — Trip mode: `FlightStore` bridge, `FlightLayer` animation, follow camera, persisted trip log + passport, overlay toggles.

### Artifacts now in the project
- `src/app/core/models/trip-stop.ts` — persisted finished-leg model.
- `src/app/core/cache/trip-log-cache.ts` — `evm.tripLog` persistence.
- `src/app/core/cache/view-prefs-cache.ts` — `evm.viewPrefs` overlay-toggle persistence (five M8 fields).
- `src/app/features/globe/flight-target.ts` — `FlightTarget` (+ re-exported `TripStop`).
- `src/app/features/globe/flight-store.ts` — the isolated playback→flight bridge (root singleton).
- `src/app/features/globe/flight-layer.ts` — the signal-free three.js plane + flight-arc layer (plane-only; the marker system grows in M11).
- `src/app/features/globe/trip-log/*` — the trip-log panel.
- `src/app/features/globe/journey-stats/*` — the passport panel.
- `src/app/features/globe/view-options/*` — the overlay-toggle fab + panel.
- **Modified:** `globe-renderer.ts` (flight layer + follow camera), `globe-canvas/*` (flight inputs + effects),
  `globe-page/*` (flight wiring, trip-log/passport overlays, view-prefs), `spotify-api.ts` + `spotify.dto.ts`
  + `spotify.mapper.ts` (`getArtist`, `getNextQueuedArtist`, `largestImageUrl`).

### Decisions / open issues
- M8's flight overlay is **plane-only** by design — it only ever shows a fixed plane. The full marker system
  (icon picker, terrain-aware boat swap, sprite mirroring, live colours) and the `MarkerKind` type are **born
  in M11** (`core/cache/appearance-cache.ts`), the milestone whose settings panel actually uses them. Building
  them here would be gold-plating.
- Flight arc/marker colours are hardcoded here; the settings UI that changes them is M11 (`// grows in M11`).
- `view-prefs` has two more fields (`showFilters`, `showTimeline`) in M9 when the filter panel + scrubber land.

### Next milestone
**M9 — Explore controls & sync:** the timeline scrubber (as-of month), era + genre filters (+ genre worker),
boot-sync, and the Actions page. Done-when: scrubbing time re-colours the globe as-of a month, filters
re-colour, and reopening the app cheaply diff-syncs.
