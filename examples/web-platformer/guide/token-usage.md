# Token usage & cost — Shape Jumper

> Approximate ledger, appended by GuideForge skills as they run. Entries are ESTIMATES —
> Claude cannot meter its own tokens mid-run. Model: Claude Opus 4.8
> (input $5 / output $25 / cache-write $6.25 / cache-read $0.50 per 1M tokens).

| Date (UTC) | Time | Skill | What it did | Input | Output | Cache read | Est. cost |
|---|---|---|---|--:|--:|--:|--:|
| 2026-07-10 | 14:20 | plan-guide | Phase 0 interview + Phase 0.5 web checks + wrote PLAN.md | 48k | 7k | 30k | $0.44 |
| 2026-07-10 | 14:40 | scaffold-guide | skeleton + README + 5 foundation docs + 7 milestone overviews + feedback log | 40k | 12k | 120k | $0.56 |
| 2026-07-10 | 15:30 | draft-milestone | drafted whole guide M1–M7 (42 step/verify files) + reconciled status/README + link checks | 120k | 60k | 900k | $2.55 |
| 2026-07-10 | 16:05 | audit-guide | whole-guide audit (3 parallel subagents + consistency/link/layout sweeps); read-only | 175k | 22k | 350k | $1.60 |
| 2026-07-10 | 16:20 | (fix pass) | applied all 10 audit findings (glosses, jump-height + file-count consistency, storage.js tag order, nav arrow) + re-check | 30k | 6k | 120k | $0.27 |
| 2026-07-11 | 10:30 | (audit-fix pass) | S1 contract change (D7: fragment-plus-verify) + P1–P5 (switch/`for…of` glosses, 11 glossary backfills, whole-game gate list, decision-log link fix) + status/README/link check | 90k | 9k | 200k | $0.78 |
| 2026-07-11 | 11:10 | audit-guide | whole-guide re-audit (4 parallel milestone auditors + orchestrator link/config-consistency sweeps); read-only. Verdict PASS-WITH-WARNINGS (0 blockers, 2 warnings, ~10 nits). S1+P1–P5 confirmed cleared | 200k | 40k | 250k | $1.85 |
| 2026-07-11 | 11:35 | (audit-fix pass) | fixed all audit findings: W1 gate correction (M4/00) + W2/N1–N10 New-tier first-use glosses & consistency tidy-ups across 8 step files + status/README/link re-check | 45k | 7k | 180k | $0.40 |
| 2026-07-11 | 11:55 | audit-guide | verification re-audit after the W1/W2/N1–N10 fixes: whole-guide structural/nav/Done-when sweep (39 files), glossary alphabetization + pointer resolution, link + config-consistency + regression checks; read-only. Verdict PASS (0 blockers/warnings/nits) | 50k | 6k | 120k | $0.36 |
| 2026-07-13 | 12:05 | audit-guide | full whole-guide audit: read all 49 md files (README + 6 foundation + PLAN + 42 step/verify), automated link+anchor sweep (0 real dead links), config-value + stale-name consistency checks; read-only. Verdict PASS-WITH-WARNINGS (0 structural blockers, 4 minor pedagogy nits) | 135k | 9k | 150k | $0.98 |
| 2026-07-13 | 13:30 | audit-guide | re-audit after the 2026-07-13 audit-fix pass (glosses already present): focused read of the 4 touched steps (M1/05, M5/01, M7/02, M7/03) + 1 Explore subagent whole-guide regression sweep (links, glossary anchors, nav-line, config-value consistency across ~40 files); read-only. Verdict PASS (0 blockers, 0 warnings, 0 nits) | 120k | 7k | 150k | $0.85 |

**TOTAL: ~3.55M tokens · ~$10.63**  *(estimate — Claude cannot meter its own tokens mid-run)*
