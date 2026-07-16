# Decision log — spotify-angular

> Why the guide is the way it is. Each entry: the decision, the reasoning, and what it rules out.
> `R#` entries are the acknowledged long-run risks from the plan's advise-back (accepted with defaults on
> 2026-07-10). `D#` entries are architectural choices reverse-engineered from the source code.

## R1 — Pin Angular 21.2, not 22
- **Date:** 2026-07-10
- **Source:** Phase 0.5 web check + source lockfile.
- **Decision:** Pin **Angular 21.2.18** (and CLI 21) even though 22.0.5 is the newest major.
- **Why:** The source project is built on 21.2; pinning it keeps the guide's code byte-for-byte reproducible and proven-together with Material 21 + three-globe 2.45.2. Angular 21 is LTS until ~May 2027.
- **Rules out / trade-off:** A reader who runs a bare `ng new` gets 22 and drifts — so the guide pins `@angular/cli@21`. The guide will need an `/update-stack` pass to reach 22 later.
- **Revisit if:** Angular 21 nears EOL (2027) or a reader specifically wants the 22 feature set.

## R2 — Pin three ~0.184 with three-globe 2.45.2
- **Date:** 2026-07-10
- **Source:** Phase 0.5 web check.
- **Decision:** Pin `three@~0.184` alongside `three-globe@2.45.2` — the lockfile pair the source shipped.
- **Why:** three moves fast (0.185/r185 is out); three-globe 2.45.2 was built against ~0.184. A fresh `npm i three` can pull a version that breaks three-globe's peer expectations.
- **Rules out / trade-off:** No newest three features (irrelevant here — WebGL path, no WebGPU).
- **Revisit if:** three-globe releases a version tested against three ≥0.185.

## R3 — Teach the rate-limit mechanism; document Dev-Mode limits up front
- **Date:** 2026-07-10
- **Source:** Source code (adaptive gate) + Spotify Dev-Mode reality.
- **Decision:** M2 teaches the *mechanism* (AIMD adaptive gate, `mapWithConcurrency` per-id fan-out), not magic constants, and M0/M1 state the Dev-Mode facts plainly.
- **Why:** Spotify's Dev-Mode quota is undocumented and adaptive; its bulk `?ids=` endpoints were removed Feb 2026; a Dev-Mode app is capped at 25 manually-allowlisted users. Hard-coded numbers would rot; hidden limits surprise readers ("it only works for me").
- **Rules out / trade-off:** More conceptual teaching up front (worth it).
- **Revisit if:** Spotify publishes a stable quota or restores bulk endpoints.

## R4 — Split the M7 gate: read-only vs Premium controls
- **Date:** 2026-07-10
- **Source:** Q5 constraint + source `player-store` error mapping.
- **Decision:** M7's Done-when has two tiers — **read-only now-playing** (works for any account) and **transport controls** (require Premium + an active device).
- **Why:** Playback control needs Premium; a free-tier reader must still be able to pass an observable gate.
- **Rules out / trade-off:** Free readers can't verify the control path — noted, not blocking.
- **Revisit if:** Spotify changes playback API entitlements.

## R5 — No automated tests (accepted)
- **Date:** 2026-07-10
- **Source:** Q4/Q6 house style.
- **Decision:** Ship with no `.spec.ts`; gates + expected output are the test suite; `format:check`/`lint`/`build` is the per-milestone bar.
- **Why:** Matches the source project's deliberate no-tests policy.
- **Rules out / trade-off:** No regression safety net across 12 milestones — mitigated by concrete gates + the pre-ship consistency check.
- **Revisit if:** The guide is adapted for a team that wants CI.

## R6 — localStorage-only persistence (accepted)
- **Date:** 2026-07-10
- **Source:** Q6 constraint + source caches.
- **Decision:** Persist the whole dataset in `localStorage` via one quota-safe `storage-cache`.
- **Why:** Matches the source; simple, synchronous, portable (enables the JSON export/import).
- **Rules out / trade-off:** ~5–10 MB quota — a very large library can hit it (the code already warns once per session). IndexedDB is the scale path (ironically the *original* PLAN.md used `idb`).
- **Revisit if:** A reader's library routinely exceeds the quota.

## R7 — Whole-app scope, 12 milestones, reality-check gate at M5
- **Date:** 2026-07-10
- **Source:** Q5/Q7.
- **Decision:** One guide covers the whole app (M0–M11); the reality-check gate sits at M5.
- **Why:** The idea asked for the whole app. The M5 gate gives a reader a genuinely complete *core* (log in → music colors the globe → persists) before the feature-expansion milestones.
- **Rules out / trade-off:** Length/fatigue — mitigated by strict per-milestone Handoffs + a single status authority.
- **Revisit if:** Readers consistently stop before M5 (split the guide).

## D2 — Single rate-limit authority (429 excluded from retry)
- **Date:** 2026-07-10
- **Source:** Source code (`rate-limit-gate.ts`, `http-retry.ts`, `app.config.ts`).
- **Decision:** One adaptive gate per host is the *only* pacer; `withRetry` deliberately excludes 429; the API service keeps no throttle of its own.
- **Why:** Retrying a 429 would re-enter the gate and multiply the ban. AIMD (halve on a 429 episode's leading edge, +1 per clean window) self-tunes to Spotify's undocumented ceiling. The schedule persists under a Web Lock so N tabs ≠ N× rate and a reload doesn't burst.
- **Rules out / trade-off:** More complex than a fixed `setTimeout` throttle — but a fixed guess either bans you or wastes throughput.
- **Revisit if:** All target APIs publish stable, generous limits.

## D3 — Two-tier country resolution
- **Date:** 2026-07-10
- **Source:** Source code (`artist-resolution.ts`, `wikidata-api.ts`, `musicbrainz-api.ts`).
- **Decision:** Fast pass = one batched Wikidata SPARQL query per 50 artists keyed by Spotify id (P1902), preferring P495→P740/P17→P27, mapped to ISO alpha-2 (P297); misses fall back per-artist to MusicBrainz by name (its `area`, else MBID→Wikidata P434). Neither pass throws.
- **Why:** Batched Wikidata is fast and free; MusicBrainz catches the long tail. `ORDER BY ?iso` + first-row-wins makes a multi-nationality artist resolve to the *same* country every run.
- **Rules out / trade-off:** Two APIs to teach and pace — but no single source covers enough artists.
- **Revisit if:** A single API gains sufficient coverage.

## D4 — Signal-free render loop
- **Date:** 2026-07-10
- **Source:** Source code (`globe-renderer.ts`, `globe-canvas.ts`).
- **Decision:** The three.js renderer is a plain class with its own `requestAnimationFrame` loop that never reads/writes Angular signals; the canvas component's `effect()`s are the only bridge, pushing inputs into imperative methods.
- **Why:** In a zoneless app, touching signals every frame would thrash change detection. Keeping the loop signal-free is what keeps it cheap.
- **Rules out / trade-off:** Renderer state and Angular state are two worlds you must consciously bridge.
- **Revisit if:** Never for this design — it's the core reason zoneless pays off here.

## D5 — LikedIndex is a byproduct of the globe scan; Trip/Explore are overlay toggles
- **Date:** 2026-07-10
- **Source:** Source code (`liked-index.ts`, `globe-store.ts`, `view-prefs-cache.ts`).
- **Decision:** The flattened per-track `LikedIndex` is built during the globe's single `/me/tracks` pass (Library and Globe share one scan). "Trip" and "Explore" are **not** a mode enum — they're independent, persisted overlay-visibility toggles on one globe page.
- **Why:** Avoids a second full paging pass for the library; overlay toggles are simpler and composable (`hideAll` → bare globe).
- **Rules out / trade-off:** The library depends on the globe scan having run — handled by boot-sync + `initMaster()`.
- **Revisit if:** The library needs data the globe scan doesn't collect.

## D6 — ISRC-only duplicate detection; per-id fan-out after bulk-endpoint removal
- **Date:** 2026-07-10
- **Source:** Source code (`track-matching.ts`, `spotify-api.ts`, `http-retry.ts`).
- **Decision:** Duplicates are grouped by **ISRC only** (never fuzzy); relink/compare use fuzzy `recordingKey` but only ever suggest (user-reviewed), never auto-delete. Post-Feb-2026, `getTracks`/`getArtistGenres`/album tracks fan out per-id at concurrency 6 via `mapWithConcurrency`, distinguishing `[]` (confirmed empty) from `null` (fetch failed).
- **Why:** Fuzzy auto-delete would conflate generic short tracks and lose data; the bulk `?ids=` endpoints no longer exist.
- **Rules out / trade-off:** More requests than a bulk call — paced by the gate.
- **Revisit if:** Spotify restores bulk endpoints.

## D7 — Hover card is descoped to match the code (no REST Countries)
- **Date:** 2026-07-10
- **Source:** Source code inspection during M6 drafting (reconciling the plan against reality).
- **Decision:** The M6 hover/select card shows the country flag (flagcdn, via the source's `country-flag` component), the geo-data country name, and store-derived counts (tracks / hours / artists placed there) — **not** REST Countries facts.
- **Why:** The source's `CLAUDE.md` mentioned REST Countries, but the **code never wired it**: `environment.restCountries` has zero consumers, and `country-stats.ts` fetches nothing. "Trust the code over the docs" → the plan over-claimed; M6 matches what the app actually does. Building a client the app never had would be inventing a feature, not teaching the source.
- **Rules out / trade-off:** No capital/region/population in the card. Cheap to add later (env config already present) if desired.
- **Revisit if:** A future version of the app actually wires a REST Countries client.

## D8 — Heat-mode toggle (tracks ↔ hours) added as a small guide extension
- **Date:** 2026-07-10
- **Source:** User decision during M6 drafting (the source has no such toggle).
- **Decision:** M6 adds a small `heatMode` signal (`'tracks' | 'hours'`) to `GlobeStore` and makes `heat` a computed that switches between `tracksByCountry` and `durationByCountry`, plus a UI toggle.
- **Why:** The source hard-codes `heat = tracksByCountry` (hours is only a leaderboard column). Both aggregates already exist in the store, so the toggle is a tiny, low-risk addition and a good teaching beat. Flagged in the M6 overview as a **deliberate extension beyond the source**, not a port.
- **Rules out / trade-off:** A small divergence from the source project (the only intentional one) — documented so it's not mistaken for fidelity drift.
- **Revisit if:** Reconverging the guide with the source exactly.
