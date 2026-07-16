# STATUS — Shape Jumper

## Frontier
- **Current frontier:** the **whole guide (M1–M7) is drafted**; awaiting a person to follow it in a browser and
  tick each Done-when gate. No milestone is ✅ until a person runs it — the code was written and cross-checked
  for internal consistency, **but was not executed in a browser by the author** (no browser in this
  environment). Start following at [M1](../MILESTONE_1_canvas-and-loop/00_overview.md).

## Source inputs
<!-- The guide was planned from the one-line idea + the audience interview alone; no external spec/design/code
     files were provided. The only "sources" are the Phase 0.5 web checks, recorded in stack.md. -->
_None — planned from the idea + audience interview. Stack facts were verified online (see
[stack.md](stack.md), checked 2026-07-10)._

## Milestone status
| Milestone | Status | Verified on | Notes |
|-----------|--------|-------------|-------|
| M1 — Canvas & the game loop | 📝 ⚠ re-verify | — | Drafted (6 files). Touched by the 2026-07-13 audit-fix pass (M1/05 gloss) — browser re-run pending. |
| M2 — Player & keyboard control | 📝 | — | Drafted (6 files). |
| M3 — Gravity & jumping (sign-aware) | 📝 | — | Drafted (6 files). |
| M4 — Platforms & AABB collision (⭐ reality-check gate) | 📝 | — | Drafted (5 files). |
| M5 — Coins, goal, HUD & win state | 📝 ⚠ re-verify | — | Drafted (5 files). Touched by the 2026-07-13 audit-fix pass (M5/01 gloss) — browser re-run pending. |
| M6 — The random twist: gravity flips | 📝 | — | Drafted (5 files). |
| M7 — Sound, timer, best time & restart | 📝 ⚠ re-verify | — | Drafted (5 files). Touched by the 2026-07-13 audit-fix pass (M7/02 glosses, M7/03 failure-note) — browser re-run pending. |

<!-- Status key: ✅ verified (Done-when passed by hand in a browser) · 📝 drafted (written, not yet run by a person) · ⚠ re-verify (content changed since last look — needs a fresh browser pass) · ⏳ in progress · ❌ not started -->

## Drift log
<!-- Every time reality differed from the guide, record it here. old assumption → real value → date. -->
| Date | Where | Guide said | Reality is | Action taken |
|------|-------|-----------|-----------|--------------|
| 2026-07-13 | Audit-fix pass (M1/05, M5/01, M7/02, M7/03) | Assorted minor/low audit findings | — | R1 glosses added: `Number.toFixed()` (M1/05), `Math.PI` (M5/01), `Math.round()` + `ctx.fillStyle`/`ctx.font`/`ctx.textAlign` (M7/02); added an M7/03 failure-note for the harmless title-start Space/Up jump (player not grounded at frame 1). **M1/M5/M7 need a browser re-run (never mark verified without a Done-when pass run by a person).** _(+ 2026-07-13 re-audit follow-up: first-step nav `prev → —` applied across every milestone's `01_*.md` — cosmetic nav-line only, no Done-when impact.)_ |

## Session log
<!-- Append-only. One line per working session. -->
- 2026-07-10 — Plan approved; guide scaffolded (README + 5 foundation docs + 7 milestone overview placeholders + feedback log + token ledger). No step content drafted yet.
- 2026-07-10 — Drafted the WHOLE guide in one pass: M1–M7, 42 step/verify files (49 `.md` total). Nav-line + dead-link checks pass (all 301 real relative links resolve). Code designed as one final codebase and back-filled per milestone for name/version consistency; **not executed in a browser** by the author — verification by a person pending.
- 2026-07-10 — `/audit-guide`: verdict PASS-WITH-WARNINGS (0 blockers, 0 logic bugs, 1 warning, 8 nits) via 3 parallel subagents + whole-guide sweeps. All 10 findings **fixed** (added glosses for `.map`/`Math.sign`/`typeof`/`isFinite`/Web-Audio idioms; unified jump height to ~107 px; corrected two step file-count headers; deferred the `storage.js` `<script>` tag to M7/02 to avoid a 404; added the missing nav `→`). Re-ran link check: 303 links, 0 dead. Still not browser-run.
- 2026-07-11 — `/audit-guide` re-run (4 parallel milestone auditors + orchestrator sweeps): verdict PASS-WITH-WARNINGS (0 blockers, 2 warnings, ~10 nits); confirmed the S1/P1–P5 pass cleared. All findings then **fixed**: **W1** corrected M4/00's unsatisfiable Done-when gate ("four raised platforms" → "floor + three ledges", ceiling noted as M6-only); **W2** glossed `addEventListener`/`window` (M2/02); **N1–N2** glossed `preventDefault` + `Array.includes` (M3/04); **N3** glossed `rgba()` (M5/03); **N4** glossed the ternary (M6/02); **N5–N6** marked the telegraph pulse numbers cosmetic + glossed `Math.sin`/`Math.abs` (M6/03); **N7** glossed the gain-envelope methods (M7/01); **N8** fixed the "6 files"→"7 files" bundle count (M7/02); **N9** glossed `file://` (M1/01); **N10** described the transient demo-square symptom (M2/01). Whole-guide config values + link check re-run clean. No milestone marked ✅ — still awaiting browser verification by a person.
- 2026-07-11 — audit-fix pass (S1 + P1–P5). **S1** (contract change → logged as **D7**): amended PLAN §5 + added a "Code presentation" convention so edit-steps may show a precisely-placed fragment provided each `NN_verify.md` renders the full files (resolves the partial-snippet vs full-file contradiction; no step files rewritten). **P1**: glossed `switch`/`case`/`break` in M2/02. **P2**: glossed the `for…of` loop in M4/01. **P3**: backfilled 11 glossary terms (clamp, clock, draw(), edge-triggered, element id, held-key state, integrator, schedule, separate-axis resolution, title state, win state) — every "See glossary" pointer now resolves. **P4**: converted M7/04's whole-game gate arrow-chain to a numbered checklist. **P5**: repointed M7/00's broken `[D2 risk 4]` link to the Web-Audio autoplay rule in stack.md. No milestone marked ✅ — still awaiting browser verification by a person.
