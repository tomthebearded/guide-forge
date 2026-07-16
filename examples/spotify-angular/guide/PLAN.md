# spotify-angular — Build-Guide Plan

> **Stage-1 deliverable** (GuideForge `/plan-guide`). This is the *plan*, not the guide. Nothing under
> `guide/` except this file has been written yet. After you approve, `/scaffold-guide` stamps the skeleton
> and `/draft-milestone` drafts the whole guide (all milestones) in one pass.

A learn-as-you-go guide that builds **spotify-angular**: a pure **Angular 21 (zoneless) + Angular Material 3 +
three.js / three-globe** single-page app that colors a 3D globe by where your favourite Spotify artists come
from — with a live player, a Trip flight mode (a plane that flies to the now-playing artist's country), a
library-management console, and a live settings/appearance panel. The dataset persists in `localStorage` and
can be exported/imported.

**Source project (authoritative):** `C:\Users\Tommaso\Downloads\EarthViewMusic (2)\EarthViewMusic`
(project name `earthviewmusic`; `spotify-angular` is the guide's teaching name). The guide is reverse-engineered
from the **real code**, which has grown well past the source `PLAN.md`. Where they disagree, **the code
wins** — this plan already reflects the code (e.g. the adaptive rate-limit gate, the library console, the
Actions page, the genre worker), not the stale original design.

---

## 1. Brief & audience model

### Resolved Phase 0 answers (provided in the idea — not re-asked)

| # | Question | Answer |
|---|----------|--------|
| Q1 | Per-topic expertise | Graded — see the matrix below. |
| Q2 | Granularity | **Standard** atomic steps: spell out every sub-action within a step, but bundle files created together into one step/commit. (Not max granularity — whole-app scope would be unusable.) |
| Q3 | Target end state | A running app at **http://127.0.0.1:4200** where the reader logs into Spotify (PKCE), their Liked Songs stream in and color a 3D globe by artist country of origin, a live player bar reflects/controls playback, Trip mode flies a plane to the now-playing artist's country, the library tools + settings panel work, and the dataset persists across reloads via `localStorage` (with export/import). |
| Q4 | Stack | Angular 21.2 (zoneless) · Angular Material 21.2 + CDK (Material 3, custom dark "Deep Space Teal") · TS ~5.9 · RxJS ~7.8 · three ^0.184 · three-globe ^2.45 · Node 22+ / npm 11 / Angular CLI 21. Browser platform, dev on 127.0.0.1 (Spotify PKCE requires loopback, not `localhost`). No unit tests by design. **Verified & pinned in §2.** |
| Q5 | Scope | **The whole app.** Core (auth → Liked Songs pipeline → globe heat → country resolution/cache → hover/select panel) **and** player **and** Trip flight mode **and** library console **and** settings/appearance **and** data export/import. Multi-week, 12 milestones (M0–M11). **Out of scope:** backend/server (pure SPA), unit tests, deployment/hosting, Spotify Premium-only playback edge cases beyond a note that control needs Premium + an active device. |
| Q6 | Hard constraints (house style) | Suffix-less naming (`globe-page.ts → class GlobePage`); OnPush always; signal IO only (never `@Input`/`@Output`); new control flow (never `*ngIf`/`*ngFor`); separate `.html`+`.scss` (no inline); `inject()` for DI; one store service per feature (`providedIn:'root'`, readonly signals + methods); signals by default, RxJS only at HTTP edges → `toSignal`; **no NgRx**; three.js render loop **never** touches signals/CD; strict TS + `noUncheckedIndexedAccess` + `noPropertyAccessFromIndexSignature`, no `any`; raw payloads suffixed `Dto`, mappers `Dto → domain`; all HTTP through typed clients in `core/api/` (never from components); persistence is `localStorage`; Spotify client id is public by design (PKCE). |
| Q7 | Format & size | A **folder of many small files** — multi-week course. One milestone folder per milestone, atomic step files inside, plus the foundation docs. |

### Per-topic expertise matrix (the north star — drives explanation depth everywhere)

Depth policy: **Expert** → name it, no gloss. **Intermediate** → one-line reminder + doc link. **Beginner**
→ define on first use + doc link + brief *why*. **New** → define + doc link + a short deep-dive callout +
extra failure-mode notes.

| Topic | Level | Depth policy applied |
|-------|-------|----------------------|
| Classic Angular (components, services, DI, RxJS, routing, guards) | **Intermediate (rusty)** | One-line reminders; assume they've seen it, refresh the shape. |
| Modern Angular (signals, zoneless CD, standalone, `@if`/`@for`, `inject()`, `input()`/`output()`, Material 3 theming) | **New** | Teach from scratch — define + doc link + deep-dive callout + failure notes. |
| three.js / three-globe (scene/camera/renderer, render loop, disposal, globe polygons, custom layers) | **New (deepest tier)** | Fullest teaching: every concept defined, deep-dive callouts, disposal/leak failure notes. |
| OAuth Authorization Code + PKCE / Spotify Web API | **New** | Teach the flow end to end from scratch. |
| Wikidata SPARQL + MusicBrainz (batch queries, P-properties, throttling) | **New** | Teach SPARQL shape, P-property chain, throttling from scratch. |
| GeoJSON / geo data (Natural Earth, ISO_A2 matching, centroids) | **New** | Define GeoJSON, ISO alpha-2, centroid; why 110m; failure notes. |
| localStorage persistence (snapshot cache, incremental rescan, export) | **New** | Teach the read/write/validate pattern, quota, versioning from scratch. |

### Advise-back (mandatory gate close)

Because the idea pre-answered Phase 0, I still owe both lists. **These are suggestions and risk flags — I
have changed nothing in scope; you decide what (if any) to fold in before I draft M0.**

#### Suggested capabilities (not requested — you pick)

| # | Suggestion | Why it pairs | Verdict |
|---|-----------|--------------|---------|
| S1 | **"Verify your setup" health check** in M2 (show *"You have N liked songs"* from a paced `/me` call) | Gives the otherwise-invisible resilience layer a real observable gate and smoke-tests auth+HTTP end to end before any globe work | **Fold in** — already the M2 done-when below |
| S2 | **Globe screenshot / share (PNG)** | The source already has `captureImage()`/`saveImage()`; surfacing it is a satisfying, cheap win | **Fold in** — it's in the code; covered in M11 polish |
| S3 | **Empty/first-run + error UX states** (no likes yet, offline, 403-needs-Premium) | A 12-milestone app that never shows a graceful empty state feels broken to a follower | **Fold in** — woven into each milestone's states, consolidated in M11 |
| S4 | **Keyboard a11y for the globe & panels** | Canvas apps routinely ship inaccessible; a small pass matters | **Fold in lightly** — M11 a11y pass |
| S5 | **Deploy the SPA (prod PKCE redirect on https)** | Natural "what next" after a working app | **Later / out of scope** (Q5 excludes hosting) — note only |
| S6 | **Automated tests (Vitest/Playwright)** | Would make the app maintainable | **Out of scope** (Q4/Q6: no tests by design) — logged as an accepted risk |

#### Long-run risks of the pinned choices (decide: accept or change)

| # | Choice | Future problem | Cheaper alternative / mitigation |
|---|--------|----------------|----------------------------------|
| R1 | **Angular 21.2** (Q4) | v22 is already the latest stable (June 2026); 21 is LTS only until **~May 2027**. A reader who runs `ng new` fresh gets **22**, drifting from the guide. | Pin **21.2.18 exactly**, matching the source (proven-together with Material 21 + three-globe). Document the pin loudly in `stack.md`; note `/update-stack` → 22 as the upgrade path. **Recommended: accept the pin** for source fidelity. |
| R2 | **three ^0.184** while three moves fast (r185 shipped July 2026) | `npm i three` fresh may pull 0.185+, which can break three-globe 2.45.2's peer expectations. | Pin `three@~0.184` + `three-globe@2.45.2` (the lockfile pair the source shipped). Note three-globe's peer range in `stack.md`. |
| R3 | **Spotify Dev-Mode quota + removed bulk endpoints** (the reason the whole adaptive gate + per-id fan-out exists) | Spotify keeps changing quotas/endpoints; a Dev-Mode app is capped at **25 manually-allowlisted users** and the bulk `?ids=` endpoints were removed Feb 2026. Readers will be surprised their app "only works for me". | Teach the *mechanism* (AIMD gate, `mapWithConcurrency`), not magic constants. Document Dev-Mode limits up front (M0/M1). |
| R4 | **Playback control needs Premium + active device** (Q5) | A free-tier reader can't verify M7's transport controls. | Split M7's gate: **read-only now-playing** (works for everyone) vs **controls** (Premium gate). Free readers still pass an observable gate. |
| R5 | **No automated tests** (Q4/Q6) | 12 milestones, every gate manual — fragile to teach and maintain. | Lean hard on concrete **expected-output** per gate + the pre-ship consistency check. **Accept** (house style); logged in decision-log. |
| R6 | **localStorage-only persistence** | Quota (~5–10 MB) can be hit by a large library (10k+ likes + discographies + playlist index) — the code *already* has quota-safe writes + once-per-session warnings, so the risk is real. | Teach the quota-safe write pattern + versioned snapshot; note **IndexedDB** as the scale path (ironically the *original* `PLAN.md` used `idb`). **Accept**, logged. |
| R7 | **Whole-app scope in one guide** (Q5) | 12 milestones is long; reader fatigue and cross-milestone drift. | Strict per-milestone **Handoff** + a single **status authority** + the **reality-check gate at M5** so a reader can stop with a genuinely complete *core* app. |

> **Awaiting your call on S1–S6 and R1–R7.** My defaults: fold in S1–S4, note S5, accept-and-log S6/R5/R6,
> pin per R1/R2, teach-the-mechanism per R3, split-the-gate per R4, structure per R7. Say "use your defaults"
> or override, and I'll record the acknowledged risks in the decision log.

---

## 2. Verified stack (Phase 0.5 — checked online 2026-07-10)

Pin **one** version per tool for the whole guide. Every milestone imports these; drift between steps is the
top cause of a multi-milestone guide breaking.

| Tool / library | Pinned for guide | Latest stable (as of 2026-07-10) | Official docs | Notes |
|----------------|------------------|----------------------------------|---------------|-------|
| Angular | **21.2.18** | 21.2.18 (patch, 2026-07-08); **22.0.5** is newest major (2026-06) | https://angular.dev · [versions](https://angular.dev/reference/versions) | 21 is LTS to ~May 2027. **Pin 21.2 for source fidelity** (R1). Requires TS ≥5.9, Node `^20.19 \|\| ^22.12 \|\| ^24`. |
| Angular Material + CDK | **21.2.x** | tracks Angular major (22.x exists) | https://material.angular.dev · [theming](https://material.angular.dev/guide/theming) | Material 3; custom palette via `ng generate @angular/material:theme-color`. Version-matched to Angular — bump together. |
| TypeScript | **~5.9** | 5.9.x | https://www.typescriptlang.org/docs/ | Angular 21 requires ≥5.9. 5.9 tightened inference — watch generic/conditional-type errors. |
| RxJS | **~7.8** | 7.8.x | https://rxjs.dev | Used only at HTTP edges, then `toSignal`. |
| three | **~0.184** | 0.185.1 (r185, 2026-07-01) | https://threejs.org/docs/ | Pin 0.184 to match three-globe 2.45.2 (R2). WebGPU is now production-ready but **not** used here (WebGL path). |
| three-globe | **2.45.2** | 2.45.2 | https://github.com/vasturiano/three-globe | Peer: `three`. Ship the lockfile pair. |
| Node.js | **24 LTS** (or 22.12+) | 26.5.0 Current; 24 LTS to Apr 2028 | https://nodejs.org | Angular 21 needs `^20.19 \|\| ^22.12 \|\| ^24`. **Recommend 24 LTS**; 22 is entering maintenance. |
| npm | **11.x** | 11.x | https://docs.npmjs.com | `packageManager: npm@11.8.0` in the source lockfile. |
| Angular CLI | **21.x** | 21.x / 22.x | https://angular.dev/cli | Run via `npx @angular/cli@21`. |
| angular-eslint / typescript-eslint | 21.x / 8.x | — | https://github.com/angular-eslint/angular-eslint | Lint gate (no tests). |
| Prettier + organize-imports | 3.x / 4.x | — | https://prettier.io | `printWidth 100`, single quotes, trailing `all`. |

**External services / data (no version pin — API contracts, verified reachable & current):**

| Service | Used for | Docs |
|---------|----------|------|
| Spotify Web API — Authorization Code + PKCE | Login, Liked Songs, playback, playlists, follow/save | [PKCE flow](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow) · [Web API ref](https://developer.spotify.com/documentation/web-api) |
| Wikidata Query Service (SPARQL) | Artist → ISO country (P1902/P495/P740/P27/P297) | [WDQS](https://query.wikidata.org) · [SPARQL service](https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service) |
| MusicBrainz API (ws/2) | Name-based artist fallback (`area`, MBID→Wikidata P434) | https://musicbrainz.org/doc/MusicBrainz_API |
| REST Countries v3.1 | Country facts for the hover/select panel | https://restcountries.com |
| Natural Earth 110m (GeoJSON) | Country polygons + centroids on the globe | https://github.com/nvkelso/natural-earth-vector |

> ⚠️ **Spotify Dev-Mode reality (teach up front, R3):** a new Spotify app is in *Development Mode* — capped at
> **25 users you manually allowlist** in the dashboard, and (since Feb 2026) the **bulk `?ids=` endpoints were
> removed**, so the app fans out per-id at bounded concurrency. Both facts shape the architecture; don't hide
> them.

---

## 3. Foundation docs (the cross-cutting layer — `foundation/`)

Written once, referenced everywhere so no step re-argues them.

- **`README.md`** (guide root) — thin front door: objective (the observable end state), one-line stack, the
  3–4 headline decisions (zoneless + signals; two-tier country resolution; adaptive rate-limit gate;
  localStorage snapshot), an **Updates** log, and a **"Following this guide"** note (type the code, don't
  paste; the complete files are a reference to diff against). Links to the detail docs; does **not** duplicate
  them. `status.md` owns progress.
- **`foundation/stack.md`** — the §2 Verified-stack table (pinned versions + docs + check date). Every
  milestone imports versions from here. Carries the R1/R2 pin rationale and the Dev-Mode note.
- **`foundation/audience-model.md`** — the §1 per-topic matrix + the Standard granularity setting, written
  as the guide's north star: *match explanation depth to the reader's level on that specific topic*.
- **`foundation/conventions.md`** — the Q6 house style, one place: suffix-less naming, OnPush + signal IO,
  new control flow, separate templates, `inject()`, one store per feature, DTO→domain mappers, HTTP only via
  `core/api/`, strict TS flags, Prettier/ESLint config. The feature-first folder map (`core/ features/
  shared/`).
- **`foundation/glossary.md`** — running plain-language definitions (zoneless CD, signal, `effect`, PKCE,
  code verifier/challenge, SPARQL, P-property, ISO alpha-2, centroid, GeoJSON, AIMD, rolling window, snapshot
  ID, `recordingKey`, ISRC, optimistic update, async generator, …). Steps link into it; it grows as concepts
  land.
- **`foundation/decision-log.md`** — the non-obvious *why*s: pin-21-not-22 (R1), single rate-limit authority
  (429 excluded from retry), signal-free render loop, two-tier resolution with deterministic tie-break,
  LikedIndex as a byproduct of the globe scan, ISRC-only dedup, localStorage-not-idb (R6), no tests (R5),
  Trip/Explore are overlay toggles not a mode enum, per-id fan-out after the Feb-2026 bulk-endpoint removal.
  Every acknowledged advise-back risk lands here.
- **`status.md`** (guide root) — **the single source of truth** for what is actually done and verified (vs.
  what the guide *intends*). Guides describe intent; only this file states reality. Updated after each
  milestone gate.

---

## 4. Milestone ladder

Each milestone is a **vertical slice** that proves one thing end-to-end, depends only on earlier milestones,
and has a hand-checkable **Done-when** gate. Ordered strictly by dependency (confirmed against the code's
build order). 🚦 marks the **reality-check gate**.

| # | Milestone | Proves (observable end state) | Depends on | Done-when (one line) |
|---|-----------|-------------------------------|------------|----------------------|
| **M0** | **Scaffold & tooling** | A Material-3-themed, zoneless app shell serves on 127.0.0.1 with routed placeholder pages | — | `format:check`/`lint`/`build` clean; shell serves; no `zone.js`; `/login` `/globe` placeholders route; custom dark palette visible |
| **M1** | **Spotify login (PKCE)** | You click "Log in with Spotify", authorize, land back logged-in on a protected `/globe` | M0 | Full PKCE round-trip: token in `localStorage`, `/globe` reachable only when authed, logout clears + redirects to `/login` |
| **M2** | **HTTP resilience layer** (retry + adaptive rate-limit gate + interceptor) | A paced, retried authenticated call shows *"You have N liked songs"* on the globe placeholder (S1) | M1 | `/me` (or liked-summary) call succeeds through `withRetry` + the gate + interceptor; requests are visibly spaced; a forced 429 trips a cooldown toast |
| **M3** | **Liked Songs streaming** (DTO/mapper/model foundation + generator + LikedIndex) | Your Liked Songs stream in page-by-page and render as a live, growing count/list | M2 | `streamLikedTracks()` pages newest-first; count rises as pages arrive; index persists to `localStorage`; reload restores instantly (no auto-refetch) |
| **M4** | **The globe** (three.js, signal-free renderer, no data) | A rotating 3D globe with Natural-Earth country polygons renders; hover highlights a country | M0 (parallel-able w/ M1–M3) | Globe mounts once, animates via its own rAF loop (never touches signals), disposes cleanly on navigate-away; hover picks the correct `ISO_A2` |
| 🚦 **M5** | **Country resolution + heat** (two-tier resolver + globe-store orchestrator + coloring + persist) | **Log in → likes stream → the globe colors by artist country of origin, and it survives a reload** | M3, M4 | The two-tier chain (Wikidata batch → MusicBrainz fallback) resolves artists as pages stream; `applyHeat()` colors matched countries; dataset persists + restores. **Stop here and actually use it.** |
| **M6** | **Hover/select panel + fixups** (legend, hover card, country stats/leaderboards, picker, unplaced, manual override, scan list, log terminal) | Hover/select a country → flag + name + counts + its artists; toggle heat (tracks↔hours); manually place an unresolved artist and it sticks | M5 | Card shows flag + name + tracks/hours/artists-placed counts + filtered artists (no REST Countries — descoped, see decision-log D7); heat-mode toggle re-colors (D8); a manual `setCountry` override persists and wins over auto |
| **M7** | **The live player** (playback model + Spotify controls + polling store + player-bar) | The header shows the now-playing track live; play/pause/skip/shuffle work (Premium + device); the heart toggles a Like | M2 (auth+HTTP); M3 (LikedIndex for ❤ memo) | **Read-only:** now-playing reflects Spotify within 3 s for anyone. **Controls (Premium+device):** optimistic play/pause/next/shuffle/❤ succeed; 404 auto-activates a device; 403 → "needs Premium" toast (R4) |
| **M8** | **Trip / Flight mode** (flight-store bridge + flight-layer three.js + trip-log + journey-stats + overlay toggles) | Play a song → a plane flies across the globe to the artist's country, arriving as the song ends; the trip log + passport accumulate | M5 (globe+dataset), M7 (playback) | On each track-change the plane flies/circles to the resolved country (isolated from the globe dataset); trip log persists; overlay visibility toggles + persist |
| **M9** | **Explore controls & sync** (timeline scrubber + era/genre filters + genre worker + boot-sync + Actions page) | Scrub time to see the globe as-of a month; filter by decade/genre; reopen the app and it cheaply diff-syncs; recalculate full/incremental | M5, M6 | Timeline drives an as-of month (per-track aggregation pass agrees with the fast pass when no filter); era+genre filters re-color; boot-sync skips fresh (<15 min) domains; Actions page recalculate works |
| **M10** | **Library console** (track-matching engine + playlist-index + discography/prefs caches + library-store + tables + artist-tidy + dialogs) | Browse artists A–Z, open one, relink a Like to a playable copy, dedupe by ISRC, undo — all reflected without a rescan | M3 (LikedIndex), M5 (dataset), M7 (Spotify mutate) | Master table filters/sorts; artist detail shows discography + analysis; a reversible `applyChange` (relink/dedupe/follow/origin) commits to Spotify **then** patches the local index; Undo restores |
| **M11** | **Settings, data transfer & polish** (settings-store + panel + appearance/view-prefs caches + export/import/wipe + a11y/empty-states/consistency) | Change colors/lighting/marker live; export the whole dataset to JSON, wipe, re-import it in another browser; final polish | M5 (renderer palette), M6 (view prefs), M8 (marker) | Settings mirror live to CSS vars + renderer + `localStorage`; export→wipe→import round-trips (auth + transient keys excluded); a11y/empty/error states pass; consistency + `format:check`/`lint`/`build` clean |

**Sittings:** M5, M8, M10, and M11 are large — each milestone's `00_overview.md` groups its steps into
sittings (natural pause+checkpoint points). Every other milestone is one or two sittings.

**Reality-check gate (🚦 M5):** the first point the app is minimally *useful* — log in, watch your music
color the planet, reload and it's still there. The M5 overview ends with an explicit *"stop, actually use it,
decide it's worth continuing"* checkpoint before the feature-expansion milestones (M6–M11).

**Corrections to the idea, baked into the ladder (code > docs):**
- **"Trip/Explore" is not a mode switch.** Both live on the same globe page; each overlay group (flight +
  trip-log + journey-stats vs. heat + stats + legend + filters + timeline) is an independent, persisted
  visibility toggle. The ladder teaches it that way (M8 + M9), not as a mode enum.
- **The "1 req/s throttle" is a full adaptive gate.** M2 teaches an AIMD rate-limit gate with cross-tab/
  cross-reload persistence for all three hosts — not a single MusicBrainz throttle — because the Feb-2026
  Spotify Dev-Mode migration made pacing load-bearing.
- **An Actions page exists** (the recalculate/`globe-hud` panel) — folded into M9.

---

## 5. Templates

### Per-step template (tuned to Standard granularity)

```
# <Milestone> · Step NN of <TOTAL> — <single action title>
> Nav: [← prev](<file>) · [Overview](00_overview.md) · [next →](<file>)

## Glossary for this step        (only terms THIS step introduces; link foundation/glossary.md; omit if none)
## Why / design                  (the rationale the reader needs; omit only for pure mechanics)
## Do this                       (numbered, atomic actions — every action names WHERE + WHAT + WHY)
## Code                          (COMPLETE file(s), never partial snippets; omit if no code)
## Done when (this step)         (the sub-slice of the milestone gate this step satisfies, with expected output)
```

### Milestone-overview template (`00_overview.md`)

```
# Milestone <N> — <title>
Goal · Scope discipline (what this milestone deliberately does NOT do) · Prerequisite (prior gate) ·
Steps-at-a-glance (grouped into sittings) · Design/decisions folded in (link decision-log) ·
Done-when gate (aggregated, each condition + expected output) · Handoff (recap + cumulative "what exists
so far" + open issues + pointer to next milestone).
```

The **Handoff** is what makes the series learnable as a whole — the reader always knows where they are in the
arc.

---

## 6. Writing contract (pedagogy + verification)

### Pedagogical rules (every step must satisfy these)

1. **Explain every concept on first use — at the depth its topic's level demands** (§1 matrix). three.js and
   modern-Angular/signals/SPARQL/PKCE topics get the fullest treatment (New/deepest); classic Angular gets
   one-line reminders (Intermediate-rusty). Never a bare term with no gloss/link for a non-Expert topic.
   Inline gloss or a "New concept" callout right above the line it lands on; link `foundation/glossary.md`
   and the official docs page from `stack.md`.
2. **Every action says WHERE** — which file / Angular Material component / Spotify dashboard field / terminal /
   URL. Never assume the reader can locate it.
3. **Every action says WHAT it does and WHY** — the mechanism, not just keystrokes.
4. **Be exact where outcome depends on it** — concrete values (redirect URI `http://127.0.0.1:4200/callback`,
   scopes, P-property numbers, `evm.*` storage keys). Where a value is free, say so.
5. **Separate MANDATORY from ILLUSTRATIVE** — what the gate requires vs. an example/embellishment.
6. **State which fields to change and which to LEAVE AT DEFAULT** — exhaustively for the thing in hand (e.g.
   `ng new` prompts, Material theme generation, dashboard app settings).
7. **Teach the mental model where it recurs** — the load-bearing framings, repeated at point of use:
   *signals are the state, `effect` bridges signals→imperative, the render loop is signal-free*; *the gate is
   the single rate-limit authority*; *DTO at the edge, domain everywhere else*; *the scan is a streaming
   generator, not fetch-all*.
8. **Flag load-bearing names vs cosmetic ones** — e.g. the `callback` route + redirect URI **must** match
   Spotify exactly; `localStorage` keys (`evm.origins`, `evm.likedIndex`, …) must match across steps; class
   selectors keep `app-`. Say which before the reader types.
9. **Sequences are numbered lists, never arrow-chains.** Arrows only for a single navigation path within one
   action.
10. **Name the common failure and its usual cause** — e.g. *"`INVALID_CLIENT`" → redirect URI mismatch or
    `localhost` instead of `127.0.0.1`*; *blank globe → GeoJSON fetch failed / renderer init before
    `afterNextRender`*; *no country colors → scopes missing `user-library-read`*; *`QuotaExceededError` →
    localStorage full, see the quota-safe write*.

### Verification & maintenance design

- **Per-step and per-milestone gates with expected output.** Every condition pairs with the exact result the
  reader observes — a response body, a console line, an on-screen state, an exit code — never a bare "it
  works". Since there are **no automated tests by design (R5)**, gates + expected output *are* the test suite;
  the pre-ship bar per milestone is `npm run format:check`, `npm run lint`, `npm run build` clean.
- **Consistency check before ship:** every command/code block uses the pinned §2 versions, and every
  load-bearing name/path/key is spelled identically wherever it recurs (version/name drift is the top killer
  of a 12-milestone guide).
- **Troubleshooting sheet** (per milestone + a global one): the traps a first-timer hits — Spotify dashboard
  misconfig, `localhost` vs `127.0.0.1`, Dev-Mode 25-user cap, missing scopes, three.js disposal leaks,
  localStorage quota, Premium-required controls — each with the fix.
- **Reconcile-before-follow rule:** if the guide is ever followed against a source/tool that has drifted,
  **reality wins** — patch the guide and log the drift in `status.md`. (`/review-before-follow` +
  `/update-stack` are the tools for this.)

---

## 7. Folder / file layout (canonical skeleton — `/scaffold-guide` stamps it)

```
examples/spotify-angular/
└─ guide/
   ├─ README.md                        # thin front door (§3)
   ├─ PLAN.md                          # ← this file
   ├─ TOKEN_USAGE.md                   # the one cost ledger (hook meters it; scaffold seeds row 1 from the line below)
   ├─ feedback-log.md                  # reader-friction log (/log-feedback)
   ├─ foundation/
   │  ├─ stack.md
   │  ├─ status.md                     # single source of truth for what's actually done
   │  ├─ audience-model.md             # per-topic expertise matrix (drafter's north star)
   │  ├─ conventions.md
   │  ├─ glossary.md
   │  └─ decision-log.md
   ├─ MILESTONE_0_scaffold/            # 00_overview.md · NN_*.md steps · NN_verify.md
   ├─ MILESTONE_1_spotify-auth-pkce/
   ├─ MILESTONE_2_http-resilience/
   ├─ MILESTONE_3_liked-songs-stream/
   ├─ MILESTONE_4_globe-base/
   ├─ MILESTONE_5_country-resolution-heat/
   ├─ MILESTONE_6_hover-panel-fixups/
   ├─ MILESTONE_7_live-player/
   ├─ MILESTONE_8_trip-flight-mode/
   ├─ MILESTONE_9_explore-filters-sync/
   ├─ MILESTONE_10_library-console/
   └─ MILESTONE_11_settings-data-polish/
```

Each `MILESTONE_<N>_<slug>/` holds `00_overview.md`, atomic step files (`01_*.md` … `NN_*.md`), and a
`NN_verify.md` that runs the aggregated Done-when gate.

---

## 8. First move

`/draft-milestone` drafts the **whole guide in one pass** — every milestone M0→M11 — so you have the finished
guide before you build. The default drafting order is M0 → M1 → … → M11 so each milestone builds on a proven
base; M4 (globe base) has no dependency on M1–M3, so when you *follow* the guide you can tackle it right after
M0 if you'd rather reach the visual payoff early.

Sequence from here: **you approve this plan → `/scaffold-guide` stamps the skeleton + five foundation docs
(pre-filled from this plan) → `/draft-milestone` drafts the whole guide (M0→M11).** Once it's drafted I
reconcile `status.md`, the README Updates log, and run the dead-link check; you then follow the guide,
verifying each Done-when gate as you build.

---

> **STOP — approval gate.** This is the plan, not the guide. Tell me your calls on **S1–S6** and **R1–R7**
> (or "use your defaults"), and approve the ladder — then I'll scaffold and draft M0. Nothing else under
> `guide/` has been written.

---

*Planning cost (est.): 2026-07-10 ~14:20 UTC · `plan-guide` · ~90k tokens in / ~11k out (est., incl. 2
source-mapping subagents ~213k combined) ≈ $2.1 (est., Opus 4.8). Labeled an estimate — Claude can't meter
its own tokens mid-run. `/scaffold-guide` seeds `guide/TOKEN_USAGE.md`'s first row from this line.*
