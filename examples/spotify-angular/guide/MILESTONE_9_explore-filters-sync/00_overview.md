# Milestone 9 — Explore controls & sync
> Features · milestone 9 of 12 · prev: [Trip / Flight mode](../MILESTONE_8_trip-flight-mode/00_overview.md) · next: [Library console](../MILESTONE_10_library-console/00_overview.md)

## Goal

Turn the globe from a static snapshot into something you can **explore in time and taste**, and make the app
**reconcile itself cheaply on every open**. By the end you can:

- **Scrub the timeline** to watch the globe fill in month by month — with a guarantee: when no time filter is
  set, the slow per-track aggregation pass produces *exactly* the same country totals as the fast artist-level
  pass.
- **Filter the heat by release decade and by genre**, recolouring the map by *when* the music was made and
  *what* it is — with the genre tags enriched **live, spread across the scan** by a background genre worker,
  never bursted.
- **Reopen the app and have it diff-sync**: a boot sync reconciles Liked Songs → playlists → artist info, but
  **skips any domain synced less than 15 minutes ago**, so a warm reopen costs ≈ zero network; a changed
  library diff-syncs only what changed (a one-call cheap diff decides).
- **Manage data from a dedicated Actions page**: incremental vs full recalculate, recheck-unplaced, and a
  playlist index built by **snapshot-id diff** (only changed playlists are re-paged).

## Scope discipline

This milestone builds the **explore controls, the sync engine, and the playlist index** — nothing downstream.
It deliberately does **not**:

- Build the **library console** — the artist table, artist-tidy, liked-songs page, library-tidy, relink/dedup,
  track-matching, discography. → **M10**. The playlist index is *built and synced* here, but its heavy library
  consumers (substitute/relink, membership editing UI) are M10. The `/library*` routes are **not** added here —
  only `/actions`.
- Build the **settings panel**, appearance customization, or **data export/import/wipe**. → **M11**. The
  Actions page's "Clear all data" control (which needs the M11 data-transfer service) is deferred; M9 ships the
  three per-domain sync groups + recheck-unplaced only.
- Add the **"save image"** view-option (needs the M11 canvas-capture + settings palette). The globe page keeps
  the M8 flight canvas bindings (`[flightTarget]` / `[flightVisible]`); the marker picker, live palette + lighting
  are M11.
- Wire the `following` / `genres` store read helpers into any UI — M9 *populates* those fields (the sweeps run),
  but the library list that *reads* them lands in M10.

Files that later milestones extend are marked `// grows in M10/M11` at the point of extension.

## Prerequisite

**M8 complete** (`npm run build` clean; the plane flies; overlay toggles persist). You have: the coloured,
persisted globe with hover card + leaderboards + manual fixup (M5–M6), the live player (M7), and the flight
overlay + trip log + `view-prefs-cache` + `view-options` (M8). This milestone extends `globe-store`,
`globe-page`, `spotify-api`, `spotify.dto`, `spotify.mapper`, `view-prefs-cache`, `view-options`, `header`,
`app.routes`, and `app` — build on their M8 state exactly.

## Steps at a glance

**Sitting 1 — The playlist index (snapshot-id diff) (01–03)**
1. [Playlist index model + cache](01_playlist-model-cache.md) — the two data types the index rides on (on top of M7's `Playlist` model).
2. [Grow the Spotify client: playlist refs, genres, follow state](02_spotify-client-grow.md) — the DTOs,
   mappers, and per-id fan-out endpoints M9 needs.
3. [The PlaylistIndex service (snapshot-id diff)](03_playlist-index.md) — build/refresh membership, re-paging
   only playlists whose `snapshot_id` changed.

**Sitting 2 — Live enrichment + boot-sync (04–06)**
4. [Grow GlobeStore: genre worker, temporal pass, filters, artist-info sweeps](04_globe-store-grow.md) — the
   big one.
5. [Persist per-domain sync timestamps](05_sync-state-cache.md) — the staleness-guard store.
6. [BootSync + the nav guard](06_boot-sync.md) — the cheap-diff, staleness-guarded reconcile.

**Sitting 3 — Explore controls (filters + timeline) (07–11)**
7. [The genre filter](07_genre-filter.md)
8. [The release-era filter](08_era-filter.md)
9. [The timeline scrubber](09_timeline-scrubber.md)
10. [View prefs + view-options: filters & timeline toggles](10_view-prefs-toggles.md)
11. [Wire filters + timeline into the globe page](11_globe-page-wiring.md) — and hand the scan controls off to
    the Actions page.

**Sitting 4 — The Actions page + boot on open (12–15)**
12. [The Actions page](12_actions-page.md) — per-domain reload + recheck-unplaced.
13. [Header nav + routes: `/actions` + the busy-lock](13_header-routes.md)
14. [App root: restore + boot-sync on open + the blocking overlay](14_app-boot.md)
15. [Verify](15_verify.md)

## Design / decisions folded in

- **The temporal aggregation swap** (step 04). Country totals normally come from a **fast artist-level pass**
  (sum each placed artist's lifetime `trackCount`/`durationMs`). The moment a timeline or release-era filter is
  active, the store swaps to a **per-track pass** that walks the persisted `LikedIndex`, attributes each track
  to its primary artist's country, and applies the month / decade / genre filters before summing. The two
  passes **agree exactly** when no temporal filter is set — that equivalence is a Done-when.
- **The genre worker** (step 04) enriches placed artists with Spotify genre tags **live, during the scan** —
  queued the instant an artist is placed, drained in batches that fan out per-id (the Feb-2026 migration removed
  the bulk `/artists?ids=`, so each artist is one request, [decision-log D6](../foundation/decision-log.md#d6--isrc-only-duplicate-detection-per-id-fan-out-after-bulk-endpoint-removal)). Spreading those calls across the
  rate-limited paging is gentler than bursting them at the end.
- **Boot-sync's cheap diff + 15-min staleness guard + `pauseIfLimited`** (steps 05–06). A one-call
  `GET /me/tracks?limit=1` summary (total + newest `added_at`) decides whether the library changed at all before
  paging anything; a domain synced under 15 min ago is skipped; an open 429 cooldown pauses the sequence rather
  than re-tripping the ban ([decision-log D2](../foundation/decision-log.md#d2--single-rate-limit-authority-429-excluded-from-retry)).
- **Snapshot-id-diff playlist indexing** (step 03). Spotify's [snapshot ID](../foundation/glossary.md#snapshot-id)
  is a playlist's content-version token; comparing it tells the index which playlists actually changed, so
  unchanged ones cost zero item requests.
- **Incremental-vs-full recalculate** (step 04). `recalculate(false)` pages only likes newer than the last
  scan's watermark and retries prior failures; `recalculate(true)` re-pages everything, reusing already-resolved
  countries **and genres** so a full rescan doesn't re-hit the network for known artists.
- **Trip/Explore are overlay toggles, not a mode** ([decision-log D5](../foundation/decision-log.md#d5--likedindex-is-a-byproduct-of-the-globe-scan-tripexplore-are-overlay-toggles)) — the filters + timeline are two
  more persisted `view-prefs` toggles, joining M8's five.
- **The globe becomes a pure visualization**: the scan HUD + couldn't-place fixup list move off the globe page
  onto the new Actions page (step 11 removes them; step 12 rebuilds them there).

## Done-when gate

Run `npm run format:check`, `npm run lint`, `npm run build` first — all clean (`Application bundle generation
complete`, no lint errors, no `any`). Then `ng serve --host 127.0.0.1 --port 4200`, log in, and scan once from
**Actions** so the globe has data:

- [ ] **Timeline replays the fill-in.** Drag the bottom-centre scrubber back a few months → the globe recolours
      to show only the music you'd liked **through that month**; the label reads e.g. `Mar 2024`; sliding to the
      right end reads `Now` and restores the full map. Pressing play animates it forward one month per ~0.65 s.
- [ ] **No-filter passes agree exactly.** With the scrubber at `Now` and no era/genre filter, note a country's
      tracks value in the leaderboard. Drag the scrubber one step off `Now` and back to `Now` (re-engaging then
      releasing the per-track pass) → the value is **identical**. (The per-track pass at `Now` == the fast pass.)
- [ ] **Era filter recolours.** In the top-centre filters bar, click a decade chip (e.g. `90s`) → the globe
      re-ramps to only tracks released that decade; the legend caption notes `90s`; click **All eras** to clear.
- [ ] **Genre filter recolours.** Pick a genre from the dropdown → the globe re-ramps to only artists carrying
      that tag; the caption notes the genre; **All genres** clears it. (Genres appear as the scan enriches them.)
- [ ] **Warm reopen ≈ zero network.** Reload the app within 15 min of a scan → DevTools ▸ Network shows **no**
      `/me/tracks`, `/me/playlists`, or `/artists/*` calls; the log shows domains skipped as fresh.
- [ ] **Changed library diff-syncs.** Like one new song on Spotify, then reload → the boot sync's cheap diff
      (`/me/tracks?limit=1`) detects the change and pages only the new like; the new artist colours in.
- [ ] **Actions recalculate works.** On `/actions`, **Check for updates** (liked) pages only newer likes; **Full
      re-scan** re-pages everything and retries failures; **Recheck unplaced** re-resolves only the couldn't-place
      artists — each with a visible status line and last-synced label.
- [ ] **Playlist index builds via snapshot diff.** On `/actions`, **Check for updates** (playlists) → only
      playlists whose `snapshot_id` changed are re-paged (`Checking your playlists… N of M`); reopening within
      15 min re-pages nothing.
- [ ] **Nav locks during boot.** While the boot overlay is up, the header's Globe/Actions links are disabled and
      route switches are blocked until the sync finishes.

## Handoff

### Recap
M9 makes the globe explorable across time and genre, adds a background genre worker that enriches placed artists
live, and adds a cheap, staleness-guarded boot sync (Liked Songs → playlists → artist info) plus a dedicated
Actions page. The playlist-membership index is built here (snapshot-id diff) ready for M10's library tools.

### Done so far (cumulative)
- **M0** — zoneless Angular 21 + Material 3 shell, routed placeholders, custom dark palette.
- **M1** — Spotify PKCE login; token in `localStorage`; `authGuard`-protected `/globe`; logout.
- **M2** — HTTP resilience: `withRetry` + adaptive AIMD rate-limit gate + interceptor (single pacer).
- **M3** — Liked Songs streaming generator + DTO/mapper/models + persisted `LikedIndex` (with `all()`/`revision()`/`releaseDate`).
- **M4** — signal-free three.js globe with Natural-Earth polygons + hover picking.
- **M5** 🚦 — two-tier country resolver (Wikidata → MusicBrainz) + `GlobeStore` orchestrator + heat colouring + persistence.
- **M6** — hover card + leaderboards + manual fixup (sticky `setCountry`) + heat-mode toggle (tracks↔hours, D8) + log terminal.
- **M7** — live player: `PlayerStore` polling + player-bar in the header + transport/❤ controls.
- **M8** — Trip/Flight: `FlightStore` + signal-free `FlightLayer` + trip log + journey passport + `view-prefs-cache` + `view-options` overlay toggles; `getArtist`/queue on `SpotifyApi`.
- **M9** — **explore controls & sync**: timeline scrubber (as-of month) + era + genre filters + the genre worker + per-track temporal aggregation; boot-sync (cheap diff + 15-min staleness guard + `pauseIfLimited`) + nav guard; snapshot-id-diff playlist index; incremental-vs-full recalculate + recheck-unplaced; the Actions page; boot-on-open in the app root.

### Artifacts now in the project
New: `core/cache/sync-state-cache.ts`, `core/cache/playlist-index-cache.ts`,
`core/models/playlist-index.ts`, `core/pipeline/playlist-index.ts`, `core/pipeline/boot-sync.ts`,
`core/pipeline/boot-sync-guard.ts`, `features/globe/genre-filter/*`, `features/globe/era-filter/*`,
`features/globe/timeline-scrubber/*`, `features/actions/actions-page/*`.
Grown: `features/globe/globe-store.ts`, `core/api/spotify-api.ts`, `core/dto/spotify.dto.ts`,
`core/mappers/spotify.mapper.ts`, `features/globe/globe-page/*`, `core/cache/view-prefs-cache.ts`,
`features/globe/view-options/*`, `shared/components/header/*`, `app.routes.ts`, `app.ts` + `app.html` + `app.scss`.

### Decisions / open issues
- **Deferred to M10:** the whole library console (artist table, artist-tidy, liked-songs page, library-tidy,
  relink/dedup, track-matching, discography); the `/library*` routes; the `GlobeStore` `following`/`genres` read
  helpers' UI; `PlaylistIndex`'s membership-editing consumers.
- **Deferred to M11:** the settings panel + appearance; data export/import/wipe (so the Actions "Clear all data"
  group and the view-options "Save image" action are M11).
- **Source note:** the source has an orphaned `features/globe/globe-hud/*` component with no importer (the real
  Actions page builds its controls inline). It is **not** ported — porting dead code teaches nothing.

### Next milestone
**M10 — Library console.** Proves: browse artists A–Z, open one, relink a Like to a playable copy, dedupe by
ISRC, undo — all reflected without a rescan. One-line Done-when: a reversible `applyChange` commits to Spotify
then patches the local index; Undo restores.

---
> Features · milestone 9 of 12 · prev: [Trip / Flight mode](../MILESTONE_8_trip-flight-mode/00_overview.md) · next: [Library console](../MILESTONE_10_library-console/00_overview.md)
