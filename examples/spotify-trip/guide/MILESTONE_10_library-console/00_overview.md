# Milestone 10 — Library console
> Features · milestone 10 of 12 · prev: [Explore controls & sync](../MILESTONE_9_explore-filters-sync/00_overview.md) · next: [Settings, data transfer & polish](../MILESTONE_11_settings-data-polish/00_overview.md)

## Goal
Build a management console over your Liked Songs and playlists. Browse every liked artist A–Z with
letter/search/status filters and sort; open one to see its **discography + analysis** — each liked track
annotated `ok` / `relink` / `unavailable`, plus relink suggestions and ISRC-only duplicate groups. Run
**reversible** actions — relink a like to a newer *playable* copy, drop duplicates, follow/unfollow, edit
playlist membership — that commit to Spotify **first** and only then patch the local index (no rescan), each
undoable from a toast. The engine that powers all of it is a pure, framework-free module
(`recordingKey` → `analyseArtist` → `compareAlbum`) you can reason about in isolation.

## Scope discipline
This milestone deliberately does **not** build:
- **The settings / appearance panel** and **live theming** → M11.
- **Data export / import / wipe** (`DataTransfer`) → M11. If a library action references clearing all data,
  it's out of scope here — the shared `Confirm` dialog we add is the *primitive* those M11 controls will use,
  nothing more.
- **Fuzzy auto-delete.** Duplicate removal is grouped by **ISRC only**; fuzzy `recordingKey` matches are used
  to *suggest* relinks and compares (user-reviewed), never to auto-delete a like — [decision-log D6](../foundation/decision-log.md#d6--isrc-only-duplicate-detection-per-id-fan-out-after-bulk-endpoint-removal).

This is the largest milestone, so it's grouped into six sittings — each ends at a clean
`format:check` / `lint` / `build`, a natural place to stop.

## Prerequisite
M9 complete: boot-sync + the Actions page + the `PlaylistIndex` build/sync engine + `GlobeStore` populating
`following` / `genres` on the dataset. You also rely on M3 (`LikedIndex`), M5 (the globe dataset), M6
(`CountryPicker`, `LogTerminal`, `GeoData`), and M7 (`SpotifyApi` save/remove + `PlayerStore.playTrack`).

## Steps at a glance

**Sitting 1 — The matching engine (01–02)**
1. [Domain models: `Album` + library-analysis types](01_library-models.md)
2. [The pure `track-matching` engine](02_track-matching.md)

**Sitting 2 — Data plumbing (03–07)**
3. [Grow the Spotify client: discography + relink write endpoints](03_spotify-client-grow.md)
4. [The discography + library-prefs caches](04_library-caches.md)
5. [Grow `LikedIndex`: local relink/dedup mutations](05_liked-index-grow.md)
6. [Grow `PlaylistIndex`: membership reads + edits](06_playlist-index-grow.md)
7. [Grow `GlobeStore`: follow / genre write-back helpers](07_globe-store-grow.md)

**Sitting 3 — The orchestrator (08)**
8. [The `LibraryStore` orchestrator (reversible `applyChange`)](08_library-store.md)

**Sitting 4 — The master console (09–12)**
9. [Shared `ConfirmDialog` + `Confirm` service](09_confirm-dialog.md)
10. [The alphabet bar](10_alphabet-bar.md)
11. [The artist master table](11_artist-table.md)
12. [The library page](12_library-page.md)

**Sitting 5 — The detail view + dialogs (13–16)**
13. [The two relink dialogs (`ReleaseCompare` + `RelinkSubstitute`)](13_relink-dialogs.md)
14. [The `ArtistTidy` detail view](14_artist-tidy.md)
15. [The all-liked-songs page](15_liked-songs.md)
16. [The library-wide tidy page](16_library-tidy.md)

**Sitting 6 — Wire it up + verify (17–18)**
17. [Header Library link + the four `/library*` routes](17_header-routes.md)
18. [Verify the milestone](18_verify.md)

## Design / decisions folded in
- **ISRC-first `recordingKey`; fuzzy only suggests** — step 02, [decision-log D6](../foundation/decision-log.md#d6--isrc-only-duplicate-detection-per-id-fan-out-after-bulk-endpoint-removal). Duplicate groups require an
  `isrc:` key; the title+duration fallback drives relink/compare only, never a delete.
- **The `applyChange` → `commitChange` reversible pattern** — step 08. Save the new copies *before* removing
  the old (a partial failure can dup, never lose a like), mirror each step into `LikedIndex` **only after
  Spotify confirms**, then offer a symmetric Undo via the toast. See [glossary: optimistic update](../foundation/glossary.md#optimistic-update).
- **Per-id fan-out after the Feb-2026 bulk-endpoint removal** — step 03, [decision-log D6](../foundation/decision-log.md#d6--isrc-only-duplicate-detection-per-id-fan-out-after-bulk-endpoint-removal). `getTracks` /
  `getAlbumTrackIdsBatch` fetch each id individually at bounded concurrency; the M2 gate is still the single pacer.
- **Position-preserving playlist substitution** — step 08. A relink reads each editable playlist's order,
  inserts the new copy at the old one's slot, then removes the old — order preserved.
- **Follow/origin write-back to `GlobeStore`** — step 07. Following state and manual origins live on the globe
  dataset (resolved in bulk during a scan), so the library's optimistic follow toggle + inline origin picker
  go through the globe store, which persists them and re-colours the map. Ties into [decision-log D5](../foundation/decision-log.md#d5--likedindex-is-a-byproduct-of-the-globe-scan-tripexplore-are-overlay-toggles).
- **The library depends on the globe scan** — `initMaster()` hydrates `LikedIndex` + `PlaylistIndex` from cache
  and restores the globe dataset, so opening `/library` cold shows data without a rescan (D5).

## Done-when gate
- [ ] Visit `/library` with a prior scan → the master table lists artists; pick a letter, type a search, click a
      status chip (**Needs review** / **Not following** / **No origin**), and click a column header → the rows
      re-filter and re-sort accordingly (e.g. **Liked** desc puts your most-liked artist first).
- [ ] Click an artist → the detail view shows tabs **Duplicates (N)** / **Relink (N)** / **Discography**; the
      Discography lists releases with each liked track flagged ❤ (liked) or 🔗 (liked elsewhere).
- [ ] On the **Relink** tab, click **Relink** for a track whose newer copy is playable → a toast *"Relinked 1
      track(s) to <album>."* appears with **Undo**; the ❤ moves to the target copy **without a rescan**, and if
      the old copy was in a playlist you're offered a position-preserving substitution.
- [ ] Follow/unfollow an artist from the master table → the icon flips immediately (`how_to_reg` ↔
      `person_add_alt`) and stays flipped after a reload (persisted on the globe dataset); the globe reflects it.
- [ ] On the **Duplicates** tab, only groups sharing an **ISRC** appear; click **Remove N other(s)** → the app
      saves the keep copy *before* removing the others, then toasts *"Removed N duplicate(s)."* with **Undo**.
- [ ] Click **Undo** on any action toast → the change reverses (the removed like returns / the saved copy goes)
      and the view updates without a rescan.
- [ ] `/library/tracks` lists every liked song (searchable, sortable, playable); `/library/tidy` **Scan library**
      streams per-artist relink/duplicate findings with a progress bar.
- [ ] `npm run format:check`, `npm run lint`, `npm run build` → all clean, no `any`.

## Handoff
### Recap
Added the whole library-management console: a pure matching engine, discography/prefs caches, the library API
surface, membership/follow/genre helpers on the existing stores, the `LibraryStore` orchestrator with reversible
Spotify actions, and four routed pages (`/library`, `/library/tracks`, `/library/tidy`, `/library/artist/:id`)
plus two dialogs and the shared confirm modal.

### Done so far (cumulative)
- **M0** — Scaffolded, Material-3-themed, zoneless Angular 21 shell serving on `127.0.0.1:4200`.
- **M1** — Spotify PKCE login; token in `localStorage`; `authGuard`-protected routes; logout.
- **M2** — HTTP resilience: `withRetry`, the adaptive AIMD rate-limit gate, the auth + rate-limit interceptors.
- **M3** — Liked Songs streaming: DTO/mapper/model foundation, the paging generator, the persisted `LikedIndex`.
- **M4** — The three.js globe: signal-free renderer, Natural-Earth polygons, hover picking, clean disposal.
- **M5** — Country resolution + heat: two-tier Wikidata→MusicBrainz resolver, `GlobeStore`, live colouring, persist.
- **M6** — Hover/select panel, legend, leaderboards, `CountryPicker`, manual overrides, log terminal, heat-mode toggle.
- **M7** — The live player: polling `PlayerStore`, optimistic transport controls, ❤ toggle, add-to-playlist.
- **M8** — Trip / Flight mode: the plane flies to the now-playing artist's country; trip log + passport.
- **M9** — Explore controls: timeline scrubber, era/genre filters, the genre worker, boot-sync, the Actions page,
  the `PlaylistIndex` build/sync engine.
- **M10** — **The library console** (this milestone): matching engine, reversible relink/dedup/follow actions,
  master table + artist detail + all-liked-songs + library-wide tidy, position-preserving playlist edits.

### Artifacts now in the project
- **Core:** `core/models/album.ts`, `core/models/library-analysis.ts`, `core/pipeline/track-matching.ts`,
  `core/cache/discography-cache.ts`, `core/cache/library-prefs-cache.ts`.
- **Grown:** `core/dto/spotify.dto.ts`, `core/mappers/spotify.mapper.ts`, `core/api/spotify-api.ts`,
  `core/pipeline/liked-index.ts`, `core/pipeline/playlist-index.ts`, `features/globe/globe-store.ts`.
- **Feature:** `features/library/library-store.ts`, `library-page/*`, `artist-table/*`, `alphabet-bar/*`,
  `artist-tidy/*`, `liked-songs/*`, `library-tidy/*`, `release-compare/*`, `relink-substitute/*`.
- **Shared:** `shared/components/confirm-dialog/*`, `shared/confirm.ts`.
- **Wiring:** `shared/components/header/*` (Library link), `app.routes.ts` (four `/library*` routes).

### Decisions / open issues
- Fuzzy matches never auto-delete (D6) — a deliberate safety limit; the reader may notice "obvious" dupes that
  aren't grouped because the two copies carry no shared ISRC.
- The `Confirm` dialog is introduced here as a shared primitive; its M11 consumer (the "Clear all data" control)
  is deferred with the rest of `DataTransfer`.
- `MAX_ARTISTS = 40` caps the persisted discography cache to stay under the `localStorage` quota ([R6](../foundation/decision-log.md#r6--localstorage-only-persistence-accepted)).

### Next milestone
**M11 — Settings, data transfer & polish:** live appearance/lighting/marker settings mirrored to CSS vars +
the renderer, and `localStorage` export → wipe → re-import round-tripping the whole dataset. One-line Done-when:
change a colour and see it live; export the dataset, wipe, re-import it, and the globe returns identical.
