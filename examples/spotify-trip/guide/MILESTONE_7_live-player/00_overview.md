# Milestone 7 — The live player
> Features · milestone 7 of 12 · prev: [Hover/select panel + fixups](../MILESTONE_6_hover-panel-fixups/00_overview.md) · next: [Trip / Flight mode](../MILESTONE_8_trip-flight-mode/00_overview.md)

## Goal
Put a live Spotify player in the header. A root-singleton `PlayerStore` polls `GET /me/player` about every
3 seconds while a session exists and the tab is visible, exposes readonly playback signals, and issues
**optimistic** control actions (play/pause, skip, shuffle, ❤ Like, add-to-playlist). Controls apply to the UI
instantly, then reconcile against Spotify's real state; a failed control reverts. A control that finds **no
active device** (404) auto-activates an available Spotify Connect device and retries once; a non-Premium /
stale-permission failure (403) surfaces a toast instead of failing silently. A dumb `player-bar` component
renders it, embedded in the app header.

By the end: the header shows what's playing on your Spotify — for **any** account — and (with Premium + an
active device) its buttons drive playback.

## Scope discipline
This milestone builds **only** the header player. It deliberately does **not**:

- **No flight/trip visuals (M8).** The player drives the header alone. `getNextQueuedArtist()` (the queue
  peek that lets the plane pre-launch) and any globe/plane reaction to the current track are M8 — not added
  here.
- **The favourite indicator never feeds the globe dataset.** The ❤ tri-state is a per-track lookup for the
  header only; playing a song (liked or not) must not colour a country. The globe's dataset comes solely from
  the scanned Liked-Songs index (M3/M5).
- **No library relink/dedup, playlist-membership index, or artist enrichment (M10).** `SpotifyApi` grows the
  playback slice only. The per-id fan-out methods (`getTracks`, `getArtistGenres`, `getArtistAlbums`,
  playlist-item paging, follow/unfollow) and `getArtist` arrive with their owning milestones.
- **No new routes or nav.** The header still shows only the brand + Log out; `/library` and `/actions` nav and
  the boot-sync lock land in M9/M10.

## Prerequisite
M6 complete: the colored, explorable globe. More specifically this milestone builds on:

- **M1** — `TokenStore` (with `hasSession()`), the auth interceptor's lazy 401-refresh, `Toast`, and the
  `Header` shell.
- **M2** — the rate-limit gate (`RateLimiters.spotify`, its `.limited` flag), `withRetry`, `delay`.
- **M3** — `SpotifyApi` (with `getMe`, `getLikedTrackUris`), the DTO→domain mapper file, and `ArtistRef`.

## Steps at a glance

**Sitting 1 — Read playback (01–03)**
1. [The playback data layer — model, DTOs, mappers](01_playback-data-layer.md)
2. [The playback slice of `SpotifyApi`](02_playback-api.md)
3. [`PlayerStore`: the polling read core](03_player-store-polling.md)

**Sitting 2 — Control playback (04)**
4. [Optimistic controls + device auto-activation](04_optimistic-controls.md)

**Sitting 3 — Favourite, playlists & wiring (05–08)**
5. [Toggle ❤ + add-to-playlist](05_favourite-and-playlists.md)
6. [The `player-bar` component](06_player-bar.md)
7. [Embed `<app-player-bar>` in the header](07_header-embed.md)
8. [Verify — the live player](08_verify.md)

## Design / decisions folded in
- **Optimistic updates** (apply → reconcile → revert) — the core mental model of this milestone, taught in
  step 04. Glossary: [optimistic update](../foundation/glossary.md#optimistic-update). Why controls feel instant despite
  Spotify's read lag.
- **The suppress-poll grace window** (`suppressPollUntil`) — a background poll that was already in flight when
  you press a control still returns Spotify's *old* state; the grace window drops those late reads so they
  can't undo your optimistic patch. Step 03 declares it; step 04 uses it.
- **The poll gate is `hasSession()`, not `isAuthenticated()`** — the poll must keep running once the access
  token ages out (the interceptor refreshes it lazily on the poll's first 401). Gating on `isAuthenticated`
  would freeze the bar the moment the token lapsed. See `TokenStore` (M1) and step 03.
- **Premium + active-device requirement, surfaced via 403/404 mapping** — decision-log
  [R4](../foundation/decision-log.md#r4--split-the-m7-gate-read-only-vs-premium-controls) splits the gate: read-only now-playing works for any account; transport
  controls need Premium and an active device. The store maps 404 → auto-activate a device and retry once,
  403 → "needs Premium + latest permissions", 401 → re-login, 429 → rate-limited. Step 04.
- **The gate is the single pacer** ([D2](../foundation/decision-log.md#d2--single-rate-limit-authority-429-excluded-from-retry)) — the poll skips (never queues) while
  `RateLimiters.spotify.limited`, so lagging polls can't pile up and re-trip a cooldown. Step 03.
- **Conventions** ([../foundation/conventions.md](../foundation/conventions.md)): one root-singleton store per
  feature; all HTTP through the typed `SpotifyApi`; DTO→domain mappers; signal IO; OnPush; separate
  `.html`/`.scss`.

## Done-when gate
Run `npm run format:check`, `npm run lint`, `npm run build` — all clean — then, with `npm start` running and
logged in:

- [ ] **Read-only (any account).** Start playing something on any Spotify client (phone, desktop, web). Within
  ~3 s the header player shows that track's album art, title, and artist. Skip on the other client → the
  header follows within ~3 s. → observable: the header text changes to match, no reload.
- [ ] **Optimistic controls (Premium + active device).** Click play/pause → the icon flips **immediately**
  (before the network settles) and stays flipped after Spotify reconciles ~0.4 s later. Next/previous change
  the track; the shuffle button lights (`--mat-sys-primary`) and Spotify's shuffle state matches on the next
  poll.
- [ ] **❤ toggles a Like.** On a track you don't have liked, the heart is outlined; click it → it fills
  immediately, and on Spotify the track is now in your Liked Songs (verify in the Spotify app). Click again →
  it un-likes.
- [ ] **404 → device auto-activation.** With Spotify idle (no active device — e.g. you paused a while ago),
  press play in the header → after a brief settle the music starts on an available device (no manual "pick a
  device"). → observable: playback begins and the bar shows the track.
- [ ] **403 → Premium toast.** On a **free** account, press play → a red toast reads *"Playback control needs
  Spotify Premium and the latest permissions — log out and back in."* (not a silent no-op).

## Handoff
### Recap
Added a live header player: a polling, optimistic `PlayerStore` root singleton over a new Spotify playback API
slice, rendered by a `player-bar` embedded in the header.

### Done so far (cumulative)
- **M0** — scaffolded zoneless Angular 21 app, Material 3 "Deep Space Teal", serves on `127.0.0.1:4200`.
- **M1** — Spotify OAuth **PKCE** login; tokens persisted (`evm.spotify.tokens`); route guard; header Log out.
- **M2** — HTTP resilience: adaptive **AIMD** rate-limit gate (per host, cross-tab persisted), `withRetry`,
  one interceptor chokepoint; 429 handling.
- **M3** — Liked-Songs **streaming** (`streamLikedTracks` async generator) into a persisted `LikedIndex`
  (`evm.likedIndex`); DTO→domain mappers.
- **M4** — the three.js / three-globe base globe (signal-free render loop).
- **M5** — two-tier country resolution (Wikidata SPARQL + MusicBrainz), the `GlobeStore` orchestrator,
  `origins-cache`, `log-store`, heat colouring, persistence.
- **M6** — hover/select panel (`country-stats`, `country-hover`, `heat-legend`; REST Countries was **descoped**, D7),
  `country-picker`, `scan-list`, `log-terminal`, `unplaced-artists`, manual `setCountry`, heat-mode toggle.
- **M7** — **this milestone:** header live player — `PlayerStore` (polling + optimistic controls + device
  activation + ❤ tri-state + playlists) over the `SpotifyApi` playback slice, rendered by `player-bar` in the
  header.

### Artifacts now in the project
- `src/app/core/models/playback-state.ts` — the `PlaybackState` domain model (new).
- `src/app/core/models/playlist.ts` — the `Playlist` domain model (new).
- `src/app/core/dto/spotify.dto.ts` — playback / device / playlist / image DTOs (extended).
- `src/app/core/mappers/spotify.mapper.ts` — `toPlaybackState`, `toPlaylists` + image helper (extended).
- `src/app/core/api/spotify-api.ts` — the playback slice (extended).
- `src/app/features/player/player-store.ts` — the root-singleton `PlayerStore` (new).
- `src/app/features/player/player-bar/player-bar.{ts,html,scss}` — the header player component (new).
- `src/app/shared/components/header/header.{ts,html,scss}` — embeds `<app-player-bar>` (modified).

### Decisions / open issues
- **Free-tier readers** can verify only the read-only gate (R4). The control gates need Premium + an active
  device — this is expected, not a bug.
- `playTrack(uri)` is defined on `PlayerStore` now (a public "play this track" affordance) but is first
  *used* by the M10 library page — it costs nothing to ship it beside the other controls.
- `getArtist` and the per-id fan-out API methods are **deferred** to their owning milestones (M8/M10); the M7
  `SpotifyApi` carries the playback slice only.

### Next milestone
**M8 — Trip / Flight mode:** the current track drives a plane flying from the previous artist's country to the
new one across the globe. One-line Done-when: skipping to a track resolves its artist's country and animates a
flight to that centroid.
