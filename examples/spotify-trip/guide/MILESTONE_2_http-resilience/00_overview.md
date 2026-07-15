# Milestone 2 — HTTP resilience layer (retry + adaptive rate-limit gate)
> Core · milestone 2 of 12 · prev: [Spotify login (PKCE)](../MILESTONE_1_spotify-auth-pkce/00_overview.md) · next: [Liked Songs streaming](../MILESTONE_3_liked-songs-stream/00_overview.md)

## Goal
Build the resilience foundation **every** API client in this app rides on, then prove it end-to-end with a
single paced, retried, authenticated Spotify call that renders **"You have N liked songs"** on the `/globe`
placeholder page (suggestion [S1](../PLAN.md)).

By the end you have:

- `delay.ts` — the one timer primitive backoff, spacing, and polling all share.
- `storage-cache.ts` — `readJson` / `writeJson` / `removeJson`: the quota-safe, validate-on-read localStorage
  helpers every `evm.*` cache is built on.
- `http-retry.ts` — `withRetry` (exponential backoff on transient statuses `{0,500,502,503,504}`, honouring
  `Retry-After`; **429 deliberately excluded**) and `mapWithConcurrency` (bounded per-id fan-out).
- `rate-limit-gate.ts` — the **adaptive AIMD gate**: minimum spacing + a rolling-window cap that **halves** on
  a 429 episode's leading edge and **grows +1 per clean window**, plus a 429 cooldown — all serialized through
  a FIFO chain and a cross-tab `navigator.locks` lock.
- `rate-limit-state-cache.ts` — persists the whole schedule under `evm.ratelimit.<host>` so tabs and reloads
  share one budget.
- `rate-limiters.ts` — one gate per host (Spotify / Wikidata / MusicBrainz), matched by URL prefix.
- `rate-limit-interceptor.ts` — the single chokepoint (`from(gate.acquire()).pipe(switchMap(next))`) that
  paces every configured call, and calls `succeeded()` / `trip()` on the way back.
- A minimal `SpotifyApi` (`getMe()` + `getLikedTracksSummary()`) and the `SpotifyMeDto` / `SpotifySavedTracksDto`
  slices those two calls need — plus the `/globe` page wired to show the count.

## Scope discipline
This milestone builds the *plumbing* and one smoke call. It deliberately does **not**:

- **Stream the Liked Songs library** (the `streamLikedTracks()` async generator + `LikedIndex` + DTO→domain
  mappers) — that's **M3**. `SpotifyApi` here is a two-method stub; a `// grows in M3/M5/M7/M10` note marks it.
- **Render a real globe** (three.js / three-globe / GeoJSON) — the `/globe` page stays a placeholder that just
  prints the count; the actual globe arrives in **M4**.
- **Add the other API clients** (Wikidata / MusicBrainz / REST Countries) or any Spotify method beyond the two
  smoke calls — **M5**/**M6**/**M7**/**M10**. The Wikidata + MusicBrainz *gates* are wired now (the source's
  `RateLimiters` instantiates all three), but no code calls those hosts until later milestones.
- **Tune magic constants.** We teach the *mechanism* (AIMD), not a hand-picked req/s number
  ([decision-log R3](../foundation/decision-log.md#r3--teach-the-rate-limit-mechanism-document-dev-mode-limits-up-front)).

## Prerequisite
**M1 — Spotify login (PKCE)** complete and its Done-when green: you can log in, land on a protected `/globe`,
and an access + refresh token sits in `localStorage`. M2's smoke call needs that bearer token; the
`authInterceptor` from M1 attaches it. If `/globe` isn't reachable while logged in, fix M1 first.

## Steps at a glance

**Sitting 1 — Timing, storage & retry primitives (01–03)**
1. [The `delay` primitive](01_delay.md) — the shared timer.
2. [The localStorage cache helpers](02_storage-cache.md) — `readJson` / `writeJson` / `removeJson`.
3. [`withRetry` + `mapWithConcurrency`](03_http-retry.md) — backoff that excludes 429; bounded fan-out.

**Sitting 2 — The adaptive rate-limit gate (04–09)**
4. [The AIMD rate-limit gate](04_rate-limit-gate.md) — spacing + rolling-window cap + cooldown, serialized.
5. [Persist the schedule](05_rate-limit-state-cache.md) — `evm.ratelimit.<host>` cross-tab/cross-reload.
6. [Environment: the per-host rate-limit config](06_environment-config.md) — the AIMD tuning blocks.
7. [One gate per host](07_rate-limiters.md) — `RateLimiters`, URL-prefix matching.
8. [The rate-limit interceptor](08_rate-limit-interceptor.md) — the single chokepoint.
9. [Wire the interceptor into the app](09_wire-interceptor.md) — `app.config.ts` provider order.

**Sitting 3 — Prove it: a paced Spotify call (10–12)**
10. [The minimal Spotify client](10_spotify-client.md) — `SpotifyApi` + the two DTO slices.
11. [Show "You have N liked songs"](11_liked-summary.md) — the `/globe` placeholder calls the gated client.
12. [Verify the milestone](12_verify.md) — the full Done-when gate + the file checkpoint.

## Design / decisions folded in
- **The gate is the single rate-limit authority; 429 is excluded from retry.** `withRetry` retries only
  transient statuses `{0,500,502,503,504}`; a 429 propagates untouched so the gate — and *only* the gate —
  opens the cooldown. Retrying a 429 would re-enter the gate and multiply the ban.
  → [decision-log D2](../foundation/decision-log.md#d2--single-rate-limit-authority-429-excluded-from-retry).
  Taught in steps [03](03_http-retry.md) and [08](08_rate-limit-interceptor.md).
- **AIMD (Additive-Increase / Multiplicative-Decrease)** — the self-tuning cap: halve hard on a limit, grow
  slowly when clean, so it converges just under an unknown ceiling. Spotify's Dev-Mode quota is undocumented,
  so a fixed guess either bans you or wastes throughput.
  → [glossary: AIMD](../foundation/glossary.md#aimd-additive-increase--multiplicative-decrease) · [decision-log R3](../foundation/decision-log.md#r3--teach-the-rate-limit-mechanism-document-dev-mode-limits-up-front).
  Taught in step [04](04_rate-limit-gate.md).
- **Persist the whole schedule, guarded by a Web Lock.** N tabs must not send at N× the rate, and a reload
  must not reset the window into a fresh burst — so the cooldown *and* the rolling-window log *and* the learned
  cap are persisted per host and every read-modify-write runs inside `navigator.locks`.
  → [decision-log R6](../foundation/decision-log.md#r6--localstorage-only-persistence-accepted). Taught in
  steps [05](05_rate-limit-state-cache.md) and [04](04_rate-limit-gate.md).
- **localStorage read/write/validate pattern.** Every `evm.*` cache reads through a `revive` validator (bad or
  legacy data falls back, never throws) and writes quota-safe (a failed `setItem` returns `false`, never
  crashes a scan). → [conventions: Data vs code](../foundation/conventions.md#data-vs-code). Taught in step
  [02](02_storage-cache.md).

## Done-when gate
- [ ] Log in and open `http://127.0.0.1:4200/globe` → after a moment the page reads **"You have N liked songs."**
  (N = your real Liked Songs count; `0` if you have none).
- [ ] Open DevTools → Network, filter `api.spotify.com`, reload `/globe` → you see **two** requests (`/v1/me`
  and `/v1/me/tracks?limit=1`) and the second **starts ≥ 600 ms after** the first (the gate's `minSpacingMs`).
- [ ] In DevTools → Application → Local Storage, `evm.ratelimit.spotify` exists after the calls, e.g.
  `{"blockedUntil":0,"consecutive":0,"recent":[...],"lastSent":<ms>,"lastGrewAt":0,"cap":20}`; reload once more
  and the next request is still spaced off the persisted `lastSent` (no fresh burst).
- [ ] With the temporary one-shot forced-429 edit (step [12](12_verify.md)) in place, reload `/globe` →
  **exactly one** red toast *"Spotify is rate-limiting the app — please try again in a while."*, and
  `evm.ratelimit.spotify` shows `blockedUntil` ≈ 5 s in the future with **`cap":10`** (halved from 20). After
  the cooldown the count renders on its own; revert the edit.
- [ ] `npm run format:check`, `npm run lint`, `npm run build` all exit clean.

## Handoff
### Recap
M2 turns "we can log in" into "we can talk to Spotify safely." A minimum-spaced, adaptively-capped,
cooldown-aware gate now paces every configured host through one persisted schedule, `withRetry` rides out
transient blips (but leaves 429s to the gate), and a smoke call proves the whole path by counting your Liked
Songs on the placeholder page.

### Done so far (cumulative)
- **M0** — Zoneless Angular 21 app shell on `http://127.0.0.1:4200`; Material 3 dark "Deep Space Teal" theme;
  strict-TS + Prettier + ESLint; feature-first folder tree (`core/ features/ shared/`); `environment` +
  gitignored `spotify-client-id`; README with Spotify dashboard registration (incl. the Dev-Mode 25-user cap);
  `/login` + `/globe` placeholder routes; `app.config.ts` with `provideZonelessChangeDetection()`.
- **M1** — Full PKCE login: `pkce.ts`, `token-store.ts`, `spotify-auth.ts`, functional `auth-interceptor.ts`
  (bearer + one 401 refresh-and-retry), `auth-guard.ts`, `login-page`, `callback-page`. `app.config.ts` wires
  `authInterceptor`; `app.routes.ts` guards `/globe`; `environment` carries the Spotify OAuth config + scopes.
- **M2** — `delay.ts`; `storage-cache.ts`; `http-retry.ts` (`withRetry` + `mapWithConcurrency`);
  `rate-limit-gate.ts` (adaptive AIMD gate); `rate-limit-state-cache.ts`; `rate-limiters.ts`;
  `rate-limit-interceptor.ts`; the per-host `rateLimit` config in both `environment` files; `app.config.ts`
  now wires `rateLimitInterceptor` after `authInterceptor`; a minimal `SpotifyApi` (`getMe` +
  `getLikedTracksSummary`) with its `SpotifyMeDto` / `SpotifySavedTracksDto` slices; the `/globe` placeholder
  renders the live liked-songs count.

### Artifacts now in the project
```
src/app/core/util/delay.ts                     ← new
src/app/core/cache/storage-cache.ts            ← new
src/app/core/pipeline/http-retry.ts            ← new
src/app/core/api/rate-limit-gate.ts            ← new
src/app/core/api/rate-limit-state-cache.ts     ← new
src/app/core/api/rate-limiters.ts              ← new
src/app/core/api/rate-limit-interceptor.ts     ← new
src/app/core/api/spotify-api.ts                ← new (minimal; grows in M3/M5/M7/M10)
src/app/core/dto/spotify.dto.ts                ← new (minimal; grows in M3/M5/M7)
src/environments/environment.ts                ← edited (+ per-host rateLimit + wikidata/musicbrainz hosts)
src/environments/environment.development.ts     ← edited (same additions)
src/app/app.config.ts                          ← edited (+ rateLimitInterceptor)
src/app/features/globe/globe-page/globe-page.ts    ← edited (calls SpotifyApi)
src/app/features/globe/globe-page/globe-page.html  ← edited (shows the count)
src/app/features/globe/globe-page/globe-page.scss  ← edited (placeholder styles)
```

### Decisions / open issues
- **429 is not retried anywhere** — only the gate reacts to it (D2). If you later add a client, route it
  through the gate; never add a private throttle or a 429 retry.
- **restCountries host is *not* in the environment yet** — it's added in M6 with the REST Countries client.
- **Wikidata + MusicBrainz gates are wired but inert** until M5/M6 call those hosts.
- **Reproducing a real 429 is impractical** in dev, so the milestone verifies the cooldown/cap-halving path
  with a temporary, clearly-reverted one-shot forced-429 edit (step 12).

### Next milestone
**M3 — Liked Songs streaming**: the `streamLikedTracks()` async generator pages your library newest-first
through this gate, mappers turn DTOs into a domain `LikedTrack`, and a persisted `LikedIndex` grows as pages
arrive. Done-when: the count rises page-by-page and a reload restores it instantly without re-fetching.
