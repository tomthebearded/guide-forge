# Milestone 6 — Hover/select panel + fixups
> Features · milestone 6 of 12 · prev: [Country resolution + heat](../MILESTONE_5_country-resolution-heat/00_overview.md) · next: [The live player](../MILESTONE_7_live-player/00_overview.md)

## Goal
Turn the coloured globe from M5 into something you can **read** and **correct**. By the end you can hover a
country and get a card (flag + name + the artists placed there), scan side-by-side **leaderboards** of your
top countries by artists / tracks / hours, flip the **heat metric** between liked-track count and listening
hours (the globe recolours), watch a live **log terminal** stream scan progress, and **manually place** an
artist the resolver couldn't — a fixup that sticks across reloads and wins over auto-resolution.

## Scope discipline
This milestone only **reads and repairs the existing dataset**. It deliberately does **not** add:
- the **live player**, plane **flight**, or **trip log / journey stats** → M7–M8.
- the **timeline scrubber / as-of-month**, **release-era filter**, **genre filter** (+ genre worker), the
  **settings panel**, **view-options** overlay toggles, or **save-image** → M9+.
- **boot-sync**, the **Actions page**, or the **recalculate/recheck panel** (`globe-hud`) → M9. M6 keeps M5's
  simple HUD button to trigger a scan.
- the **library** feature (artist pages, the master table's inline picker) → M10.

Where the store gains hooks those later milestones extend (genre/era/timeline aggregates, follow/genre
enrichment), they are marked `// grows in M9` and left out of M6.

## Two decisions specific to this milestone
- **REST Countries is descoped.** The plan's placeholder mentioned "REST-Countries facts" on the card. The
  source app has **no** REST Countries client — the hover card shows only the **flag** (via `country-flag`,
  which uses [flagcdn](https://flagcdn.com)), the **geo-data country name**, and **store-derived counts**
  (artists / tracks / hours placed there). We build the card exactly as the source does — no REST Countries
  client, no country-facts DTO. See [decision-log D7](../foundation/decision-log.md#d7--hover-card-is-descoped-to-match-the-code-no-rest-countries).
- **The heat-mode toggle is a guide extension.** The source hard-codes `heat = tracksByCountry`. We add a
  small `heatMode` (`'tracks' | 'hours'`) signal to `GlobeStore`, make `heat` a computed that switches between
  the two per-country aggregates M5 already builds, and add a toggle control. It is the one deliberate step
  beyond the source in this milestone. See [decision-log D8](../foundation/decision-log.md#d8--heat-mode-toggle-tracks--hours-added-as-a-small-guide-extension).

## Prerequisite
**M5 complete** — `GlobeStore` scans Liked Songs, resolves countries (Wikidata + MusicBrainz), builds the
per-country aggregates (`tracksByCountry`, `durationByCountry`, `artistsByCountry`, `maxHeat`), persists to
`evm.origins`, and the `/globe` page paints a heat map with an HUD. `GeoData.countries()` and the `Country`
model exist from M4. The M0 theme (`styles/_theme-colors.scss`) defines `--neon-teal`, `--neon-violet`,
`--globe-land-cold/mid/hot`, `--space-surface`, `--space-void`, `--glow-shadow`, and Material 3's `--mat-sys-*`
tokens — every component below styles against those.

## Steps at a glance

**Sitting 1 — The shared flag + the legend (01–02)**
1. [The `country-flag` component (flagcdn)](01_country-flag.md) — the shared dependency every panel reuses.
2. [The `heat-legend` gradient scale](02_heat-legend.md) — the cold→hot ramp with a labelled max.

**Sitting 2 — Reading the dataset: hover card + leaderboards (03–04)**
3. [The `country-hover` card](03_country-hover.md) — flag + name + the artists placed there.
4. [The `country-stats` leaderboards](04_country-stats.md) — top countries by artists / tracks / hours.

**Sitting 3 — Live scan feedback (05–06)**
5. [The `log-terminal` overlay](05_log-terminal.md) — the blocking, streaming progress terminal.
6. [The `scan-list` reveal](06_scan-list.md) — the phase-gated scan→place animation (ported as-is).

**Sitting 4 — The manual-override fixup (07–09)**
7. [Grow `GlobeStore`: heat-mode + `setCountry` + `hideUnplaced`](07_globe-store-grow.md) — the sticky override.
8. [The `country-picker` autocomplete](08_country-picker.md) — searchable ISO-code picker (shared control).
9. [The `unplaced-artists` fixup list](09_unplaced-artists.md) — couldn't-place list wired to the picker.

**Sitting 5 — Wire it all onto the page, then verify (10–11)**
10. [Wire the globe page](10_globe-page-wiring.md) — hover, legend + toggle, stats, log-terminal, fixup panel.
11. [Verify M6](11_verify.md) — the full Done-when gate + the file checkpoint.

## Design / decisions folded in
- **Dumb child, smart page.** Every component here is a **dumb** presentational component: `input()` in,
  `output()` out, no store injection ([conventions](../foundation/conventions.md#structure--architecture-feature-first)).
  The smart `GlobePage` owns the `GlobeStore`, feeds each child its slice, and turns each `output` into a store
  call. This is the recurring model taught in step 03 and reinforced in step 10.
- **The store is the single source of aggregates** (M5's `aggregates` computed). The card, the leaderboards,
  the legend, and the globe heat all read the *same* per-country maps, so they can never disagree. Taught at
  step 04.
- **The manual-override pattern (sticky, wins over auto).** `setCountry` writes into `manualOverrides` and
  flips the artist's `manual` flag; `restore()` re-seeds `manualOverrides` from persisted `manual` artists;
  `accumulate()` (M5) already prefers a manual override over any auto-resolved country on a rescan. Taught at
  step 07 — this is the milestone's core lesson. See [glossary: manual override](../foundation/glossary.md#manual-override).
- **Heat-mode toggle** — the guide extension (step 07 store, step 10 UI), noted above.
- **REST Countries descoped** — the card is flag + name + counts only (step 03), noted above.
- **`scan-list` is phase-gated dormant UI.** `phase` stays `'globe'` throughout (the Liked-Songs source never
  flips to `'scanning'`/`'placing'`), so the `scan-list` reveal animation is ported faithfully but never shown;
  the live-progress requirement is met by the `log-terminal` overlay (steps 05–06).
- **`unplaced-artists` keeps its inline picker (M6 reconstruction).** The *final* source dropped the inline
  picker (fixups moved to the M10 library table). Since that table doesn't exist yet, M6 keeps a per-row
  `country-picker` so the fixup actually works — the component's own SCSS still carries the `.picker` styles
  from when it had it. Flagged in step 09.

## Done-when gate
- [ ] **Hover → card.** Hover a coloured country → a light card appears anchored to the cursor showing that
      country's **flag**, its **name**, a scrollable ranked list of the **artists placed there**, and a footer
      like `12 artists · 240 liked tracks · 63 h`.
- [ ] **Leaderboards.** With data loaded, three columns show bottom-right: **Top countries · artists**,
      **· tracks** (values suffixed `♪`), **· hours** (suffixed `h`), each a ranked top-10 with flags.
- [ ] **Heat-mode toggle recolours.** Click the **Hours** toggle in the legend → the globe re-ramps to
      per-country listening hours and the legend caption reads `Hours per country` with an `h`-suffixed max;
      click **Tracks** → it returns to `Tracks per country` / `♪`.
- [ ] **Manual fixup is immediate + sticky.** Open the **Couldn't place** panel, pick a country for an
      unplaced artist → that country colours on the globe **immediately**, the artist leaves the couldn't-place
      list, and after a full page **reload** the country stays coloured (no scan). In the console,
      `JSON.parse(localStorage['evm.origins']).artists.find(a => a.name === '<that artist>').manual` → `true`.
- [ ] **Manual wins over auto.** Click **Recalculate** after a manual fixup → the manually-set country is
      **unchanged** (the resolver never overwrites it).
- [ ] **Log terminal reflects progress.** Click **Load my music / Recalculate** → a blocking terminal overlay
      streams lines like `Wikidata: placed 34 of 50 artists` and `MusicBrainz: <name> → US`, with a live
      spinner and a `placed / pending / unplaced / artists` footer; it disappears when the scan ends.

## Handoff
### Recap
M6 makes the M5 globe explorable and correctable: a hover card and leaderboards read the store's per-country
aggregates, a heat-mode toggle switches the metric, a log terminal streams scan progress, and a
manual-override fixup places unresolved artists stickily.

### Done so far (cumulative)
- **M0** — Angular 21.2 zoneless scaffold, Material 3 theme, `styles/_theme-colors.scss`, strict TS + lint +
  Prettier gate.
- **M1** — Spotify OAuth PKCE login, `callback` route, token storage, auth guard.
- **M2** — resilience layer: adaptive per-host rate-limit gate, `withRetry`, typed HTTP clients.
- **M3** — Liked Songs streamed via async generator into a persisted `LikedIndex` (`evm.likedIndex`).
- **M4** — the three.js / three-globe scene: `GeoData` + `geo-data.ts` (memoized GeoJSON, `countries()`,
  `pickCountryCode`, centroids), `GlobeRenderer`, `GlobeCanvas`, the `/globe` route.
- **M5** — two-tier country resolution (Wikidata batch + MusicBrainz fallback), `GlobeStore` orchestrator
  (scan + fast/slow workers + per-country aggregates + persist to `evm.origins` + instant restore), heat
  colouring, `origins-cache`, `log-store`, the progress HUD.
- **M6** — `country-flag`, `heat-legend`, `country-hover`, `country-stats`, `log-terminal`, `scan-list`,
  `country-picker`, `unplaced-artists`; `GlobeStore` grown with `heatMode` + `setHeatMode`/`toggleHeatMode`,
  `setCountry` (sticky manual override), `hideUnplaced`, `showGlobe`; the `/globe` page wired to all of them.

### Artifacts now in the project
- `src/app/features/globe/country-flag/{country-flag.ts,.html,.scss}`
- `src/app/features/globe/heat-legend/{heat-legend.ts,.html,.scss}`
- `src/app/features/globe/country-hover/{country-hover.ts,.html,.scss}`
- `src/app/features/globe/country-stats/{country-stats.ts,.html,.scss}`
- `src/app/features/globe/log-terminal/{log-terminal.ts,.html,.scss}`
- `src/app/features/globe/scan-list/{scan-list.ts,.html,.scss}`
- `src/app/shared/components/country-picker/{country-picker.ts,.html,.scss}`
- `src/app/features/globe/unplaced-artists/{unplaced-artists.ts,.html,.scss}`
- **Modified:** `src/app/features/globe/globe-store.ts` (heat-mode + fixup methods), and
  `src/app/features/globe/globe-page/{globe-page.ts,.html,.scss}` (wiring).

### Decisions / open issues
- **D7 — REST Countries descoped** (card = flag + name + counts). **D8 — heat-mode toggle is a guide
  extension.** Both logged in the [decision log](../foundation/decision-log.md).
- `country-hover`'s artist rows link to `/library/artist/:id` via `RouterLink` (faithful to the source). That
  **route does not exist until M10**, so clicking a name currently no-ops/logs a router warning; the Spotify
  external link works today. Flagged in step 03.
- `unplaced-artists` keeps a per-row inline picker (M6 reconstruction); the final source relocates fixups to
  the M10 library table. Flagged in step 09.

### Next milestone
**[M7 — The live player](../MILESTONE_7_live-player/00_overview.md):** a Spotify Web Playback / now-playing
panel with transport controls. Done-when: the app shows the currently-playing track and (Premium) can
play/pause/skip.

---
> Features · milestone 6 of 12 · prev: [Country resolution + heat](../MILESTONE_5_country-resolution-heat/00_overview.md) · next: [The live player](../MILESTONE_7_live-player/00_overview.md)
