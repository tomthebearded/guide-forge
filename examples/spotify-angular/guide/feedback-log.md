# Feedback log — spotify-angular

> Append-only field log of friction readers hit while following this guide. Its purpose is to improve the
> guide **and** the GuideForge method over time — so entries are captured even when the guide is not (yet)
> changed. This is a **record, not a to-do**: logging an entry here does not by itself change the guide. To
> actually fix the guide from a report, run `/report-issue` (it fixes the root cause and sweeps for siblings).
>
> Written by `/log-feedback` (capture) and, when a fix ships, by `/report-issue`. Newest entries on top; one
> entry per distinct piece of friction. Use absolute dates (`2026-07-09`), never "today".

### 2026-07-13 · M5 → M10 · `LikedIndex.clear()` forward reference
- **Where:** first surfaces at M5 step 06 (`GlobeStore.clearData()` calls `this.likedIndex.clear()`); reported at M9 step 04 (same call in the grown store).
- **Reader:** guide audit (building milestones in order).
- **What happened:** `npm run build` at the M5 gate fails — `Property 'clear' does not exist on type 'LikedIndex'`. The method was only defined in M10 step 05, five milestones later.
- **Suspected class:** forward reference / public surface split across milestones.
- **Severity:** blocker (breaks the build gate of every milestone from M5 on).
- **Tags:** `forward-ref` `build-gate` `store-surface`
- **Quote:** "GlobeStore.clearData() chiama this.likedIndex.clear(), ma LikedIndex.clear() nasce solo in M10."
- **Status:** fixed via /report-issue (2026-07-13) — `clear()` defined in M3 step 06; M10/05 reframed; verify copies synced; rule 5.1 guards added at M3/06 + M5/06.

