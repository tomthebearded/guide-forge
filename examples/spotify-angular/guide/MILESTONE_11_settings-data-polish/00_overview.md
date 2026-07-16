# Milestone 11 — Settings, data transfer & polish
> Features · milestone 11 of 12 · prev: [Library console](../MILESTONE_10_library-console/00_overview.md) · next: — (final milestone → back to the [README](../README.md))

## Goal
Make the globe **yours** and make your data **portable**, then ship. By the end: a pinned gear panel recolours
the globe live (sphere, atmosphere, country strokes, heat ramp, flight marker), flips studio ↔ day lighting,
and swaps the flight marker icon — and every change is mirrored to **both** the page's CSS custom properties
**and** the three.js renderer **and** `localStorage` (`evm.appearance`), so it survives a reload. The same panel
(and the Actions page) can **export** your whole dataset to a JSON file, **wipe** local data, and **import** it
into another browser — round-tripping everything except your Spotify login and per-browser transient state. A
"Save image" action downloads the current globe as a PNG. We close with the empty/first-run + error states, a
keyboard-accessibility pass on the panels, and the final consistency check with `format:check` / `lint` /
`build` clean across the whole app.

## Scope discipline
This is the **finale — no new features** beyond live appearance, portable data transfer, the globe PNG, and the
S3/S4 polish (empty/error states + a11y). Out of scope (per the plan, unchanged): a backend, unit tests, and
deployment/hosting. We do **not** invent settings the source doesn't have (no theme presets, no font pickers, no
Escape-to-close handlers the source lacks). The heat-mode toggle (D8) and everything M0–M10 built stay exactly
as they are.

## Prerequisite
M0–M10 complete: the whole app runs — log in (M1), resilient HTTP (M2), stream Liked Songs (M3), the globe
(M4), country resolution + heat (M5), hover panel (M6), live player (M7), trip/flight mode (M8), explore
filters + boot-sync + the Actions page (M9), and the library console (M10). In particular this milestone
extends: `flight-layer.ts`, `globe-renderer.ts`, `globe-canvas.*`, `globe-page.*` (M8/M9), `view-options.*` and
`actions-page.*` (M9), and reuses the shared `Confirm` (M10) + `Toast` (M1) services and the `storage-cache`
read/write helpers (M0/M3).

## Steps at a glance
**Sitting 1 — Live appearance (01–04)**
1. [Appearance cache + `MarkerKind`'s home](01_appearance-cache.md) — the persisted `evm.appearance` cache; `MarkerKind` is born here in `appearance-cache`.
2. [The settings store](02_settings-store.md) — read CSS custom properties as defaults, layer saved overrides, mirror every change to CSS + localStorage.
3. [Grow the flight layer + renderer](03_renderer-live-appearance.md) — the flight layer's full marker engine (icons/terrain/mirror/colours), then the renderer's `applyPalette` / `setLighting` / `setMarkerIcon` / `captureImage` (+ `preserveDrawingBuffer`).
4. [Grow the canvas: `palette` / `dayMode` inputs + `capture()`](04_canvas-palette-capture.md).

**Sitting 2 — Portable data + the panel (05–06)**
5. [The data-transfer service](05_data-transfer.md) — serialize / wipe / import the portable `evm.*` keys.
6. [The settings panel](06_settings-panel.md) — the gear: lighting, marker, colours, export/import/delete, reset.

**Sitting 3 — Wire it into the app (07–09)**
7. [Host the panel + wire the globe page](07_globe-page-settings.md) — palette/day/marker from the store; "Save image".
8. [View-options "Save image" action](08_view-options-save-image.md).
9. [Actions page "Clear all data"](09_actions-clear-data.md).

**Sitting 4 — Polish & ship (step 10 + verify)**
10. [Empty/first-run + error states + a keyboard-a11y pass](10_states-and-a11y.md) — S3 + S4.
- **Verify:** [Verify the milestone + the final consistency check](11_verify.md) — the gate for all 10 steps.

## Design / decisions folded in
- **CSS custom properties are the single source of appearance truth.** The store reads them once at
  construction (`getComputedStyle`) as **defaults**, layers any saved overrides from `evm.appearance` on top,
  then on every change writes back to *both* the CSS variables (so HTML/SCSS surfaces — panels, borders, the
  heat legend gradient — recolour live) *and* `localStorage`. The renderer consumes a derived `LivePalette` +
  `dayMode` + `markerIcon`. Taught in steps 02–04.
- **Signal → imperative bridge, unchanged ([D4](../foundation/decision-log.md#d4--signal-free-render-loop)).**
  The render loop still never touches signals. The canvas's `effect()`s push `palette` / `dayMode` /
  `markerIcon` into the imperative renderer (steps 03–04) — the same pattern M5/M8 used for `heat` / flight.
- **`MarkerKind` is born with its owner; the marker engine grows where it's used.** M8's flight overlay was
  plane-only, so `MarkerKind` is defined here in `appearance-cache.ts` (step 01) — appearance owns which marker
  the user picks. The flight layer then grows from plane-only into the full multi-glyph/terrain/mirror engine
  in step 03, right before the renderer that drives it. Building any of this in M8 would have been gold-plating
  (nothing there used it).
- **Portable data is discovered dynamically, not hard-coded.** `DataTransfer` walks every `evm.*` key at
  runtime and exports all of them **except** the secret auth keys (`evm.spotify.*`) and per-browser transient
  keys (`evm.ratelimit.*`, `evm.syncState`) — so a cache added in any milestone travels automatically. Import
  **validates before it wipes**, so a bad file changes nothing (step 05). Persistence rationale:
  [R6](../foundation/decision-log.md#r6--localstorage-only-persistence-accepted).
- **The globe PNG needs `preserveDrawingBuffer`.** WebGL clears its drawing buffer after each present, so
  `toDataURL` returns blank unless the context keeps it; we opt in and paint a solid space background just for
  the shot (step 03). Accepted suggestion **S2**.
- **Empty/error states + a11y** — accepted suggestions **S3** (first-run empty, offline, 403-needs-Premium) and
  **S4** (keyboard pass on the panels), folded into step 10. Premium tiering is
  [R4](../foundation/decision-log.md#r4--split-the-m7-gate-read-only-vs-premium-controls).
- New terms defined this milestone: **CSS custom property**, **`LivePalette`**, **PNG data URL**,
  **`preserveDrawingBuffer`** — see [glossary](../foundation/glossary.md) and the per-step "New concept"
  callouts. Naming + house style: [conventions](../foundation/conventions.md).

## Done-when gate
- [ ] Open `/globe`, open the gear, change **Globe ocean** and drag a **Heat** swatch → the globe **and** the
      panel chips recolour **instantly**; toggle **Day mode** → the sphere shifts to a lit-hemisphere/night look;
      pick a different marker → the flying icon changes. Reload → every choice persists
      (`JSON.parse(localStorage['evm.appearance'])` shows your colours, `dayMode`, and `markerIcon`).
- [ ] Gear → **Export** downloads `earthviewmusic-YYYY-MM-DD.json`; its `data` object contains `evm.origins`,
      `evm.appearance`, `evm.viewPrefs`, … but **no** `evm.spotify.*`, `evm.ratelimit.*`, or `evm.syncState`.
- [ ] **Delete** (or Actions → **Clear all data**) → confirm → the page reloads with an empty globe **and you're
      still logged in** (no re-login); then **Import** the file back → confirm → reload → the full dataset returns.
- [ ] View-options (or the gear) → **Save image** downloads `earthviewmusic-<date>.png` that opens to the current
      globe on a solid space background (not a blank/transparent image).
- [ ] First run (no data) shows the scan prompt, not a broken empty globe; pulling the network shows an error
      toast rather than a silent hang; a free (non-Premium) account sees the read-only player, not a crash.
- [ ] Every panel is reachable and operable by keyboard alone (Tab to the gear, Enter/Space to open, Tab through
      the toggles/swatches, screen-reader labels announce each control).
- [ ] `npm run format:check` && `npm run lint` && `npm run build` → all clean across the whole app.

## Handoff
### Recap
Added a live-appearance settings store (CSS-var defaults + saved overrides, mirrored to CSS + the renderer +
`localStorage`), a portable JSON export/import/wipe (`DataTransfer`), a gear panel and Actions "Clear all data"
control that drive them, a globe-to-PNG snapshot, and a final empty/error-state + keyboard-accessibility pass —
then a whole-app consistency check. **The guide is complete.**

### Done so far (cumulative)
- **M0** — Angular 21.2 zoneless scaffold, Material 3 "Deep Space Teal" theme, Prettier/ESLint gates, `evm.*` storage-cache foundation.
- **M1** — Spotify login via OAuth Authorization Code + PKCE, token store, auth guard + interceptor, `Toast`.
- **M2** — HTTP resilience: one adaptive AIMD rate-limit gate per host, retry (429 excluded), per-id fan-out.
- **M3** — Liked Songs streamed page-by-page (async generator) into the origins/liked datasets.
- **M4** — The three.js + three-globe country globe (signal-free render loop, hover picking, disposal).
- **M5** — Two-tier country resolution (Wikidata SPARQL → MusicBrainz) + the heat ramp; **reality-check gate** passed.
- **M6** — Hover/select card (flag + counts, D7), manual country fixups, the heat-mode toggle (D8).
- **M7** — The live player bar (now-playing, read-only for all; transport controls need Premium, R4).
- **M8** — Trip / Flight mode: the animated plane/arc/marker, follow camera, trip log, journey passport.
- **M9** — Explore filters (genre / era / timeline), boot-sync on any landing route, the Actions page.
- **M10** — The library console: master table, duplicate/relink tidy tools, playlist membership, per-artist tidy.
- **M11** — Live appearance settings, portable data export/import/wipe, globe PNG, empty/error states + a11y, final consistency check.

### Artifacts now in the project
This is the last milestone, so the inventory below is the **complete finished app** (not just the M11 delta).
Items added in M11 are marked **← new (M11)**; component folders (`*/`) hold a `.ts` + `.html` + `.scss` trio.

```
Root config   package.json · angular.json · tsconfig.json · tsconfig.app.json · eslint.config.js ·
              .prettierrc · .editorconfig · .gitignore · README.md
src/          main.ts · index.html · styles.scss · styles/_theme-colors.scss
src/environments/  environment.ts · environment.development.ts ·
                   spotify-client-id.example.ts · spotify-client-id.ts (gitignored)
public/geo/   countries-110m.geo.json

src/app/                       app.ts · app.html · app.scss · app.config.ts · app.routes.ts
  core/auth/                   pkce.ts · token-store.ts · spotify-auth.ts · auth-interceptor.ts · auth-guard.ts
  core/util/                   delay.ts
  core/cache/                  storage-cache.ts · liked-index-cache.ts · origins-cache.ts · trip-log-cache.ts ·
                               view-prefs-cache.ts · sync-state-cache.ts · playlist-index-cache.ts ·
                               discography-cache.ts · library-prefs-cache.ts ·
                               appearance-cache.ts ← new (M11) · data-transfer.ts ← new (M11)
  core/api/                    rate-limit-gate.ts · rate-limit-state-cache.ts · rate-limiters.ts ·
                               rate-limit-interceptor.ts · spotify-api.ts · wikidata-api.ts · musicbrainz-api.ts
  core/dto/                    spotify.dto.ts · wikidata.dto.ts · musicbrainz.dto.ts
  core/models/                 artist.ts · liked-track.ts · indexed-track.ts · country.ts · artist-origin.ts ·
                               origins-snapshot.ts · playback-state.ts · playlist.ts · playlist-index.ts ·
                               trip-stop.ts · album.ts · library-analysis.ts
  core/mappers/                spotify.mapper.ts · musicbrainz.mapper.ts
  core/pipeline/               http-retry.ts · liked-index.ts · artist-resolution.ts · playlist-index.ts ·
                               boot-sync.ts · boot-sync-guard.ts · track-matching.ts
  core/geo/                    geo-data.ts
  core/logging/                log-store.ts

  features/auth/               login-page/ · callback-page/
  features/globe/              globe-store.ts · globe-renderer.ts · globe-canvas/ · globe-page/ ·
                               country-flag/ · heat-legend/ · country-hover/ · country-stats/ ·
                               log-terminal/ · scan-list/ · unplaced-artists/ · flight-target.ts ·
                               flight-store.ts · flight-layer.ts · trip-log/ · journey-stats/ ·
                               view-options/ · genre-filter/ · era-filter/ · timeline-scrubber/
  features/player/             player-store.ts · player-bar/
  features/library/            library-store.ts · library-page/ · artist-table/ · alphabet-bar/ ·
                               artist-tidy/ · liked-songs/ · library-tidy/ · release-compare/ · relink-substitute/
  features/settings/           settings-store.ts ← new (M11) · settings-panel/ ← new (M11)
  features/actions/            actions-page/

  shared/                      toast.ts · confirm.ts
  shared/components/           header/ · country-picker/ · confirm-dialog/
```

**Modified in M11:** `flight-layer.ts` (grown from plane-only into the full marker engine; imports `MarkerKind`),
`globe-renderer.ts` (`applyPalette`/`setLighting`/`setMarkerIcon`/`captureImage`, 8-arg flight layer),
`globe-canvas.ts` (`palette`/`dayMode`/`markerIcon` inputs + `capture()`),
`globe-page.{ts,html,scss}` (host panel + save image), `view-options.{ts,html}` (save image),
`actions-page.{ts,html}` (clear all data).

### Decisions / open issues
- **No Escape-to-close on the panels** — the source panels close by re-clicking their fab; we don't invent a
  keyboard-close the source lacks (kept in-scope, noted in step 10). If you want it, it's a trivial
  future addition.
- **`--globe-land-empty-*` stays hard-coded** in the renderer — no-artist countries aren't user-configurable in
  `LivePalette`, matching the source's `LivePalette` field set.
- **Post-guide step (not a milestone):** actually **run and verify** the whole app against every milestone's
  Done-when gate — nobody has build-verified it yet (see [status.md](../foundation/status.md)). Use the
  `review-before-follow` skill before executing against live Spotify/Wikidata, and `clarify-step` on any step
  that reads unclearly.

### Next milestone
**None — this is the last milestone.** The guide is complete; continue back to the
**[README](../README.md)** for the overview and the suggested build order, then build and verify the app.

---
> Features · milestone 11 of 12 · prev: [Library console](../MILESTONE_10_library-console/00_overview.md) · next: — (final milestone → back to the [README](../README.md))
