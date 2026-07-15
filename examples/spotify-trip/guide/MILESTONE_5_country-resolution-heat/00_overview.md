# Milestone 5 — Country resolution + heat 🚦
> Core · milestone 5 of 12 · prev: [The globe](../MILESTONE_4_globe-base/00_overview.md) · next: [Hover/select panel + fixups](../MILESTONE_6_hover-panel-fixups/00_overview.md)

## Goal
Turn the streamed Liked Songs into a **coloured globe**. You'll build the **two-tier resolver** that maps a
Spotify artist to an ISO country — a fast batched **Wikidata SPARQL** query keyed by Spotify id, falling back
per-artist to **MusicBrainz** by name — then an orchestrating `GlobeStore` that pages `/me/tracks`, dedupes
artists with a real per-artist track count + Σ runtime, runs the fast and slow resolvers **concurrently** while
pages stream, aggregates a per-country heat map, and persists the whole dataset to `localStorage`. Finally the
renderer gains `applyHeat()` so land is coloured on a **cold → hot ramp** by how much of your library comes from
each country. End state: **log in → likes stream → the globe colours by artist country of origin as resolution
progresses, and it survives a reload with no refetch.**

## 🚦 Reality-check gate
This is the first point the app is genuinely useful. When the Done-when gate passes, **stop and actually use
it** — log in, watch your music colour the planet, reload and confirm it persists — and decide it's worth
continuing before the feature-expansion milestones (M6–M11). Everything after this adds polish and features onto
a core that already works.

## Scope discipline
This milestone resolves → colours → persists, end to end, and **nothing more**. Deliberately deferred (do not
add them here, even if a step seems to invite it):
- **Genre enrichment** — `genreWorker`, `availableGenres`, `reuseGenres`, the genre filter → **M9**.
- **Manual fixups** — `setCountry`, the `manualOverrides` write path, the "couldn't place" placement UI, the
  recheck-unplaced action → **M6**. (M5 exposes the `unplaced` signal for progress counts only — no UI.)
- **Temporal filters** — timeline scrubber / `setAsOfMonth`, release-era chips / `setEraDecades`, the
  per-track aggregation pass → **M9**.
- **Hover/select card (flag + name + counts), legend, country leaderboards** → **M6** (REST Countries is descoped, D7).
- **Player, flight/trip mode, library, settings, follow-state sweep, playlist sync** → M7–M11.

The `GlobeStore` you build is a **compiling intermediate**: it contains only the responsibilities above, with
`// grows in M6/M9` markers where later milestones extend it.

## Prerequisite
[M4 — The globe](../MILESTONE_4_globe-base/00_overview.md) done: a signal-free `GlobeRenderer` with its own
render loop, the `globe-canvas` lifecycle bridge, a `globe-page` at `/globe`, and `geo-data` with `isoA2()` +
`pickCountryCode()`. Also needed and already in place: M3's `streamLikedTracks()` + `LikedIndex`, M2's
resilience layer (`withRetry`, the per-host rate-limit gate that already paces Wikidata + MusicBrainz by URL),
and the `environment.wikidata` / `environment.musicbrainz` config (added in M2).

## Steps at a glance

**Sitting 1 — Resolve a country (Wikidata + MusicBrainz + the two-tier resolver) (01–03)**
1. [The Wikidata SPARQL client (batched, by Spotify id)](01_wikidata-sparql.md)
2. [The MusicBrainz fallback (search by name)](02_musicbrainz-fallback.md)
3. [The two-tier resolver](03_two-tier-resolver.md)

**Sitting 2 — The dataset store & persistence (04–06)**
4. [The origin models](04_origin-models.md)
5. [Persistence (`origins-cache`) + the log store](05_persistence-and-log.md)
6. [`GlobeStore` — the orchestrator](06_globe-store.md)

**Sitting 3 — Colour the globe (heat) + verify (07–10)**
7. [Heat in the renderer (`applyHeat` + the cold→hot ramp)](07_heat-ramp.md)
8. [The canvas `heat` input + first `effect()`](08_canvas-heat-input.md)
9. [Wire the globe page (heat + progress)](09_globe-page-wiring.md)
10. [Verify the milestone](10_verify.md)

## Design / decisions folded in
- **Two-tier resolution** ([D3](../foundation/decision-log.md#d3--two-tier-country-resolution)) — taught in
  steps 01–03. Fast batched Wikidata (one query per 50 artists), MusicBrainz for the long tail. Neither pass
  throws, so one failure never stalls the queue.
- **Determinism** — `ORDER BY ?spotifyId ?iso` + keep-first-row-per-id (step 01) makes a multi-nationality
  artist resolve to the **same** ISO code every run. New terms defined at first use: [SPARQL](../foundation/glossary.md#sparql),
  [P-property](../foundation/glossary.md#p-property), [MBID](../foundation/glossary.md#mbid),
  [two-tier resolution](../foundation/glossary.md#two-tier-resolution).
- **localStorage-only persistence** ([R6](../foundation/decision-log.md#r6--localstorage-only-persistence-accepted))
  — the whole dataset is one versioned, quota-safe `evm.origins` snapshot (step 05), restored synchronously on
  reload (no auto-refetch).
- **Signal-free render loop** ([D4](../foundation/decision-log.md#d4--signal-free-render-loop)) — the renderer
  stays a plain class; the canvas component's `effect()` is the only bridge that pushes `heat` in (steps 07–08).
- **Heat ramp** — hardcoded cold/hot endpoints, `sqrt`-spread + HSL interpolation (step 07). Live palette
  customization is **M11**.
- **Note on `artist.ts`** — the plan hinted the origin fields would grow onto `artist.ts`; the source keeps
  them in a separate `artist-origin.ts` (`ArtistRef` in `artist.ts` stays exactly as M3 left it). We follow the
  source — `artist.ts` is **not** modified this milestone.

## Done-when gate
Run `npm run format:check`, `npm run lint`, and `npm run build` first — all three clean
(`Application bundle generation complete`, no lint errors). Then, with `ng serve --host 127.0.0.1 --port 4200`
running and logged in:

- [ ] **Resolution streams.** Open `/globe`, click **Load my music** → the globe starts colouring within the
      first page or two: countries fade from the muted "no data" tone onto a blue→warm ramp as artists resolve.
      The HUD's **Resolved** count climbs, **Pending** falls toward 0. In the Network panel you see batched
      `GET https://query.wikidata.org/sparql?query=…` calls (fast pass) and, for the misses, individual
      `GET https://musicbrainz.org/ws/2/artist?query=…` calls (slow pass) — both visibly paced by the gate.
- [ ] **Neither pass stalls on a failure.** Kill your network mid-scan for a moment, then restore it → the scan
      logs an error line but keeps going; no unhandled promise rejection appears in the console, and resolution
      resumes on the next page.
- [ ] **Counts are visible + correct.** After the scan settles, the HUD reads
      `Resolved N · Unplaced M · Pending 0 · Artists N+M`, where `Resolved + Unplaced = Artists`, plus a date
      range like `2019-04-12 → 2026-06-30`.
- [ ] **Persisted.** In DevTools → Application → Local Storage, key `evm.origins` holds
      `{"version":2,"computedAt":<epoch ms>,"oldest":"…","newest":"…","artists":[…]}` and `artists.length`
      equals the HUD's **Artists** count.
- [ ] **Reload restores instantly, no refetch.** Reload `/globe` → the coloured globe reappears immediately with
      the same counts, and the Network panel shows **no** `sparql`, `musicbrainz`, or `/me/tracks` request until
      you click **Recalculate**.
- [ ] **Deterministic tie-break (force a *fresh* resolve).** A plain **Recalculate** reuses countries already
      resolved — it won't re-query Wikidata for an artist it's already placed, so it proves persistence, not the
      `ORDER BY ?iso` tie-break. To exercise the tie-break, note a known multi-nationality artist's code (e.g.
      Rihanna — `BB` + `US` in Wikidata), then in DevTools run `localStorage.removeItem('evm.origins')`, reload
      `/globe`, and run a full scan. The fresh resolve returns the **same** ISO (`BB`, the alphabetically-first) —
      an identical result across an *independent* re-resolution is the determinism proof. Read it back with
      `JSON.parse(localStorage['evm.origins']).artists.find(a => a.name === 'Rihanna').countryCode`.

## Handoff
### Recap
Built the two-tier country resolver (Wikidata batched SPARQL + MusicBrainz fallback), the `GlobeStore` that
scans + resolves + aggregates + persists, and the heat colouring in the renderer/canvas/page. The globe now
tells you where your music comes from.

### Done so far (cumulative)
- **M0** — Scaffolded zoneless Angular 21.2 app: SCSS, Material 3 theme, Prettier + ESLint, `environment(.development).ts`, `npm start` on `127.0.0.1:4200`.
- **M1** — Spotify login via **PKCE**: `callback` route + `http://127.0.0.1:4200/callback` redirect, token store, auth interceptor attaching the bearer.
- **M2** — HTTP resilience layer: `delay`, `storage-cache`, `withRetry` (429 excluded), the AIMD **rate-limit gate** + persisted schedule + `RateLimiters` (one gate per host: Spotify, Wikidata, MusicBrainz) + interceptors, with each host's `rateLimit` config in `environment`.
- **M3** — Liked Songs **streaming**: Spotify track DTOs + mapper, `LikedTrack`/`IndexedTrack`/`ArtistRef` models, `streamLikedTracks()`, the persisted `LikedIndex` + `liked-index-cache`.
- **M4** — The **globe**: `geo-data` (memoized GeoJSON + `isoA2`/`pickCountryCode`/centroids) + `Country`, the signal-free `GlobeRenderer` (base + hover), the `globe-canvas` bridge, the `globe-page` skeleton, the `/globe` route, the Natural Earth GeoJSON asset.
- **M5** — **Country resolution + heat**: `wikidata-api` + `musicbrainz-api` clients (+ DTOs + MusicBrainz mapper), the `ArtistResolution` two-tier resolver, the `ArtistOrigin`/`OriginsSnapshot` models, `origins-cache`, the `LogStore`, the `GlobeStore` orchestrator, and `applyHeat` wired renderer → canvas → page. The globe colours by artist country and persists to `evm.origins`.

### Artifacts now in the project
- `src/app/core/dto/wikidata.dto.ts` *(new)*
- `src/app/core/dto/musicbrainz.dto.ts` *(new)*
- `src/app/core/api/wikidata-api.ts` *(new)*
- `src/app/core/api/musicbrainz-api.ts` *(new)*
- `src/app/core/mappers/musicbrainz.mapper.ts` *(new)*
- `src/app/core/pipeline/artist-resolution.ts` *(new)*
- `src/app/core/models/artist-origin.ts` *(new)*
- `src/app/core/models/origins-snapshot.ts` *(new)*
- `src/app/core/cache/origins-cache.ts` *(new)*
- `src/app/core/logging/log-store.ts` *(new)*
- `src/app/features/globe/globe-store.ts` *(new)*
- `src/app/features/globe/globe-renderer.ts` *(modified — `applyHeat` + heat ramp)*
- `src/app/features/globe/globe-canvas/globe-canvas.ts` *(modified — `heat` input + first `effect()`)*
- `src/app/features/globe/globe-page/globe-page.ts` · `.html` · `.scss` *(modified — heat + progress HUD)*

### Decisions / open issues
- `LogStore` is introduced here as a **prerequisite** of `GlobeStore` (the store logs progress lines to it);
  the loading-terminal overlay that renders those lines is polished later. It's transient (not persisted).
- The `unplaced` signal is exposed for the progress count only; the manual-placement UI is **M6**.
- The M5 `GlobeStore` intentionally omits the follow-state / genre / playlist / temporal / manual-override
  machinery — all flagged `// grows in M6/M9` at their hook points.

### Next milestone
[M6 — Hover/select panel + fixups](../MILESTONE_6_hover-panel-fixups/00_overview.md): a hover card with the
country's flag + name + track/hour/artist counts (REST Countries is descoped, D7) + the manual "couldn't place"
fixup UI. Done-when: hovering a coloured country shows its artists + counts, and you can manually assign a
country to an unplaced artist and have it stick across reloads.
