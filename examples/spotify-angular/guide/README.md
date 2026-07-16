# spotify-angular — build a 3D globe that colors itself by where your Spotify artists come from

> The front door to this guide. Skim this, then follow the milestones. **Progress lives in
> [foundation/status.md](foundation/status.md), not here** — this page describes intent; `status.md` states reality.

## Objective

You'll build a running single-page app at **http://127.0.0.1:4200** where you log into Spotify (PKCE), your
Liked Songs stream in and **color a 3D globe by each artist's country of origin**, a live player bar
reflects and controls playback, a **Trip mode** flies a plane to the now-playing artist's country, a
**library console** lets you tidy your likes and playlists, and a **settings panel** recolors everything
live. The whole dataset persists in `localStorage` and can be exported/imported between browsers. It's a
pure SPA — no backend.

## Stack (summary)

Angular 21.2 (zoneless) · Angular Material 21.2 (Material 3) · three ~0.184 + three-globe 2.45.2 ·
TypeScript ~5.9 · Node 24 LTS — full verified table + check date: **[foundation/stack.md](foundation/stack.md)**.

## Key decisions

- **Pin Angular 21.2, not the newer 22** — match the source project exactly; 21 is LTS to ~May 2027. → [foundation/decision-log.md](foundation/decision-log.md#r1--pin-angular-212-not-22)
- **One adaptive rate-limit gate is the single pacing authority** (AIMD, cross-tab persisted) — Spotify's Dev-Mode quota is undocumented and its bulk endpoints were removed. → [foundation/decision-log.md](foundation/decision-log.md#d2--single-rate-limit-authority-429-excluded-from-retry)
- **Two-tier country resolution** (Wikidata batch → MusicBrainz fallback), deterministic per run. → [foundation/decision-log.md](foundation/decision-log.md#d3--two-tier-country-resolution)
- **The three.js render loop never touches signals** — the key to a cheap zoneless app. → [foundation/decision-log.md](foundation/decision-log.md#d4--signal-free-render-loop)

## Updates

- 2026-07-13 — audit-fix pass (minor/low): first-step nav tidy, `[Overview]` nav anchor codified in conventions, full `app.routes.ts` in M4/08, same-commit bundle banners, bundle-count fix (M10/09), cumulative M11 artifacts, new global [troubleshooting.md](troubleshooting.md), author email → placeholder, EarthViewMusic cosmetic-brand notes, build-only gate rationale, R1 term glosses, R9 arrow-chains → lists, OrbitControls defaults declared, zone.js PowerShell gate. Touched milestones flagged for re-verify.
- 2026-07-13 — fixed: M8 flight overlay trimmed to plane-only; marker system (icons/terrain/mirror/colours) relocated to M11 where it's used.
- 2026-07-13 — fixed: `LikedIndex.clear()` forward reference broke the build gate from M5 on — `clear()` now defined in M3 step 06 (M3/M5/M9/M10 flagged for re-verify).
- 2026-07-10 — All 12 milestones (M0–M11) drafted — 140 step files, 0 dead links. Two scope reconciliations vs the source docs: REST Countries descoped (D7), heat-mode toggle added (D8). Whole-guide audit pending; app not yet build-verified.
- 2026-07-10 — Guide created.

## Following this guide

1. Read **[foundation/status.md](foundation/status.md)** first — the single source of truth for what's done and verified.
2. Start at **[Milestone 0](MILESTONE_0_scaffold/00_overview.md)**; do the milestones in order (each builds on the last). The **reality-check gate is at [Milestone 5](MILESTONE_5_country-resolution-heat/00_overview.md)** — the first point the app is genuinely useful.
3. **Type the code — don't paste it.** The complete files are included so you always have an authoritative
   copy to diff against, *not* so you can paste blindly. You'll learn far more by typing each file, reading it
   as you go, and predicting a step's expected output *before* you run it. Reach for paste only to unstick
   yourself when something won't work.
4. If you're following this a while after it was written, run the **review-before-follow** gate first —
   re-check the stack's "Latest stable" column and reconcile any drift before executing (reality wins).
5. Stuck? The **[global troubleshooting sheet](troubleshooting.md)** collects the cross-cutting first-timer
   traps (Spotify dashboard setup, `127.0.0.1` vs `localhost`, Dev-Mode 25-user cap, disposal leaks, Premium
   controls, localStorage quota); each milestone's `NN_verify.md` has its own section for local failures.
