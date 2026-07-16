# Milestone 3 — Liked Songs streaming
> Core · milestone 3 of 12 · prev: [HTTP resilience layer](../MILESTONE_2_http-resilience/00_overview.md) · next: [The globe](../MILESTONE_4_globe-base/00_overview.md)

## Goal
Lay the **DTO → mapper → domain-model** foundation the rest of the app rides on, then stream your Liked
Songs into it with an **async generator**. You add `streamLikedTracks()` to `SpotifyApi` (it pages
`GET /me/tracks` newest-first via the `next` cursor), build the `LikedIndex` pipeline that flattens each track
for lookup, and persist it through `liked-index-cache.ts` under `localStorage` key `evm.likedIndex`. The
`/globe` placeholder page becomes a live view: a count and a track list that **grow page-by-page** as the scan
runs, and that come **straight back from `localStorage` on reload with no network call**.

## Scope discipline
This milestone proves the streaming + persist pipeline and the DTO→domain pattern — nothing more.

- **No country resolution** (Wikidata / MusicBrainz) — that's M5.
- **No globe rendering, no three.js, no heat coloring** — the globe canvas is M4; coloring is M5. The likes
  render as a plain HTML count/list on the placeholder page (M4/M5 replace that UI with the real globe).
- **No `GlobeStore` orchestrator** — the M3 page drives the scan directly; the big store arrives in M5.
- **No player, no relink/dedup mutations** — `LikedIndex.removeTracks`/`addTracks` and the player's
  use of `getLikedTrackUris()` land in M7/M10. (We build `getLikedTrackUris()` now — it's a sibling paging
  method — but nothing consumes it until M7. `LikedIndex.clear()` *is* built here in step 06: the globe store
  calls it from M5, two milestones before its own mutations, so the whole store surface lives in one file.)
- **No boot-sync / incremental rescan wiring** — `beginIncremental()` exists but the M3 page only runs a full
  scan on demand; boot-sync is M9.

## Prerequisite
**M2 — HTTP resilience layer** is done and its gate passed: `SpotifyApi` exists with `getMe()` +
`getLikedTracksSummary()`, every Spotify call flows through `withRetry` and the adaptive rate-limit gate via
the interceptor, and the `/globe` placeholder renders "You have N liked songs". You are logged in (M1) so a
bearer token rides every request.

## Steps at a glance
**Sitting 1 — The DTO → domain foundation (01–03)**
1. [The raw edge — track & paging DTOs](01_track-dtos.md)
2. [The clean domain — `LikedTrack`, `IndexedTrack`, `ArtistRef`](02_domain-models.md)
3. [The crossing — the mapper](03_mapper.md)

**Sitting 2 — Stream the library (04)**
4. [`streamLikedTracks()` — the async generator](04_stream-liked-tracks.md)

**Sitting 3 — Persist the index (05–06)**
5. [The cache — `liked-index-cache.ts`](05_liked-index-cache.md)
6. [The pipeline — the `LikedIndex` store](06_liked-index.md)

**Sitting 4 — Render it live (07)**
7. [Stream the likes onto the page](07_render-likes.md)

**Verify**
8. [Verify the milestone](08_verify.md)

## Design / decisions folded in
- **DTO at the edge, domain everywhere else.** Raw Spotify payloads are typed with a `Dto` suffix and never
  leave the mapper; the app only ever sees clean models. This is the recurring mental model introduced in
  step 01 and enforced in step 07 (no `…Dto` reaches the component). See
  [conventions](../foundation/conventions.md) and [glossary: DTO](../foundation/glossary.md#dto).
- **Streaming, not fetch-all.** A large library is paged lazily with an **async generator** (step 04): the
  page consumer pulls one page at a time and can stop early. See
  [glossary: async generator](../foundation/glossary.md#async-generator).
- **The `LikedIndex` is a byproduct of one `/me/tracks` scan.** M3 owns that scan directly; from M5 on it's
  the globe store's single pass. → [decision-log D5](../foundation/decision-log.md#d5--likedindex-is-a-byproduct-of-the-globe-scan-tripexplore-are-overlay-toggles).
- **localStorage-only persistence, versioned + validated.** The index is a `version`-stamped snapshot written
  through the shared `storage-cache` primitives; reload restores it synchronously with **no auto-refetch**. →
  [decision-log R6](../foundation/decision-log.md#r6--localstorage-only-persistence-accepted).
- **Per-page commit of the watermark.** Here the *watermark* is the saved "newest liked track seen so far"
  marker (a resumable high-water cursor). `commit(newest)` persists it after **each** page, so a reload
  mid-scan keeps everything fetched so far and records the newest `added_at` seen — the cursor a later
  incremental sync (M9) resumes from.

## Done-when gate
- [ ] Click **Load my Liked Songs** → the on-screen count rises page-by-page (e.g. `50` → `100` → … → your
      real total) and the track list grows, newest track first.
- [ ] After the scan finishes, `localStorage` key `evm.likedIndex` exists and holds
      `{"version":1,"newest":"<ISO date>","tracks":[…]}` with `tracks.length` equal to the count shown.
- [ ] Reload the page → the same count and list appear **instantly**, and the Network panel shows **no**
      request to `api.spotify.com/v1/me/tracks` until you click **Recalculate**.
- [ ] In the running app, a track object read by the component is a clean `IndexedTrack`
      (`{ id, name, albumName, artistIds, … }`) — no `…Dto` shape and no `snake_case` field reaches the page.

## Handoff
### Recap
You built the app's data spine: raw Spotify DTOs, the domain models they map to, the mapper between them, an
async-generator scan of Liked Songs, and a versioned `localStorage` index that survives reloads — all
rendered as a live, growing count/list on the `/globe` placeholder.

### Done so far (cumulative)
- **M0 — Scaffold & tooling:** zoneless Angular 21 `spotify-angular` project, Material 3 "Deep Space Teal" theme,
  strict-TS + ESLint + Prettier, feature-first folder tree, `environment` + gitignored `spotify-client-id`,
  `/login` and `/globe` placeholder routes, README with Spotify dashboard registration.
- **M1 — Spotify login (PKCE):** `pkce.ts`, `token-store.ts`, `spotify-auth.ts`, `login-page`,
  `callback-page`, functional `auth-interceptor` (bearer + one refresh-retry on 401), `auth-guard` protecting
  `/globe`; tokens persist in `localStorage`.
- **M2 — HTTP resilience layer:** `delay.ts`, `storage-cache.ts`, `http-retry.ts` (`withRetry` +
  `mapWithConcurrency`), the adaptive AIMD `rate-limit-gate.ts`, `rate-limit-state-cache.ts` (Web-Lock
  persistence), `rate-limiters.ts` (one gate per host), `rate-limit-interceptor.ts` wired in `app.config.ts`;
  minimal `SpotifyApi` (`getMe`, `getLikedTracksSummary`) rendering "You have N liked songs".
- **M3 — Liked Songs streaming (this milestone):** `core/dto/spotify.dto.ts` (track/paging DTOs),
  `core/models/artist.ts` + `liked-track.ts` + `indexed-track.ts`, `core/mappers/spotify.mapper.ts`
  (`toLikedTracks` / `toIndexedTrack`), `SpotifyApi.streamLikedTracks()` + `getLikedTrackUris()`,
  `core/cache/liked-index-cache.ts`, `core/pipeline/liked-index.ts` (the `LikedIndex` store), and a `/globe`
  placeholder that streams the likes into a live count/list persisted under `evm.likedIndex`.

### Artifacts now in the project
- `src/app/core/dto/spotify.dto.ts` *(grown this milestone with the track/paging DTOs)*
- `src/app/core/models/artist.ts` *(new)*
- `src/app/core/models/liked-track.ts` *(new)*
- `src/app/core/models/indexed-track.ts` *(new)*
- `src/app/core/mappers/spotify.mapper.ts` *(new)*
- `src/app/core/api/spotify-api.ts` *(grown: `streamLikedTracks` + `getLikedTrackUris`)*
- `src/app/core/cache/liked-index-cache.ts` *(new)*
- `src/app/core/pipeline/liked-index.ts` *(new)*
- `src/app/features/globe/globe-page/globe-page.ts` + `.html` + `.scss` *(reworked: live likes view)*

### Decisions / open issues
- The likes count/list on `/globe` is a **transitional placeholder** — M4 replaces it with the three.js
  canvas and M5 turns the same scan into globe heat. The `LikedIndex` pipeline and cache are permanent.
- `getLikedTrackUris()` and `LikedIndex.beginIncremental()` are built now but unused until M7/M9 — deferred by
  the scope gate, not omitted, because they're siblings of code shipped here.

### Next milestone
**M4 — The globe (three.js, no data):** render a rotating 3D globe with Natural-Earth country polygons and
hover-to-highlight, via a signal-free renderer. Done-when: the globe mounts once, animates on its own rAF loop
that never touches signals, and disposes cleanly on navigate-away.

---
> Core · milestone 3 of 12 · prev: [HTTP resilience layer](../MILESTONE_2_http-resilience/00_overview.md) · next: [The globe](../MILESTONE_4_globe-base/00_overview.md)
