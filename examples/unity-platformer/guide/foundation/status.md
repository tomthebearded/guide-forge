# STATUS — Shape Jumper (Unity edition)

## Frontier
- **Current frontier:** the **whole guide (M0–M7) is drafted** — 8 milestone folders, 56 step/verify files.
  Awaiting a human to follow it in **Unity 6.5** and tick each Done-when gate. Start at
  [M0](../MILESTONE_0_setup-and-editor/00_overview.md).
- **Verification reality (read this):** Unity is a GUI application + physics/render engine and **could not be
  run headlessly by the author** (unlike the JS sibling, which is browser-simulatable). The steps, menu paths,
  API names, and code were authored and cross-checked against the official docs (see [stack.md](stack.md)) **but
  were not executed in the Editor**. Every milestone is marked **📝 drafted (author-unverified)** — *the first
  human follow-through in Unity 6.5 is the real verification pass.* No milestone becomes ✅ until a person runs
  it and ticks its Done-when gate.

## Source inputs
<!-- The guide was planned from the one-line idea + the audience interview alone; no external spec/design/code
     files were provided. The only "sources" are the Phase 0.5 web checks, recorded in stack.md. -->
_None — planned from the idea + audience interview. This guide is the deliberate engine-powered twin of the
sibling [`web-platformer/`](../../../web-platformer/guide/README.md). Stack facts were verified online (see
[stack.md](stack.md), checked 2026-07-11)._

## Milestone status
| Milestone | Status | Verified on | Notes |
|-----------|--------|-------------|-------|
| M0 — Install Unity & meet the Editor | 📝 ⚠ re-verify | — | Drafted (5 step files). Not Editor-verified by a human yet. **2026-07-13: overview C#-framing reworded; audit-fix — `Transform` gloss (03), IL2CPP gloss (01), URP/HDRP gloss (02).** |
| M1 — The Main Menu (no gameplay code) | 📝 ⚠ re-verify | — | Drafted (8 files). (M1 correctly names `MenuController` the first script.) **2026-07-13 audit-fix — Canvas Scaler gloss (02), New-Scene arrow-chain split to match M1/01 (04).** |
| M2 — The world & free physics (no code) | 📝 ⚠ re-verify | — | Drafted (5 files). **2026-07-13: overview "first gameplay script" wording.** |
| M3 — Move & jump (first C#) | 📝 ⚠ re-verify | — | Drafted (6 files). **2026-07-13 audit-fix — jump-height wording standardized (04: peak ~2.5, step ≤~2).** |
| M4 — Platforms & a real level (⭐ reality-check gate) | 📝 ⚠ re-verify | — | Drafted (5 files). **2026-07-13 audit-fix — If-it-breaks jump-height wording aligned to body ≤~2 (02).** |
| M5 — Coins, goal, win & HUD | 📝 | — | Drafted (8 files). |
| M6 — The random twist: gravity flips | 📝 ⚠ re-verify | — | Drafted (4 files). **2026-07-13 audit-fix — proactive Clear-Flags=Solid-Color heads-up + `[Header]` gloss (01).** |
| M7 — Sound, timer, best time & restart | 📝 ⚠ re-verify | — | Drafted (7 files). **2026-07-13: D8 anchor links fixed (overview + best-time step); audit-fix — full `MenuController.cs` inlined into 07_verify so one page holds the entire final codebase.** |

<!-- Status key: ✅ verified (Done-when passed by hand in the Editor) · 📝 drafted (written, not yet run by a human) · 🔶 scaffold placeholder (not drafted) · ⏳ in progress · ❌ not started -->

## Drift log
<!-- Every time reality differed from the guide, record it here. old assumption → real value → date. -->
| Date | Where | Guide said | Reality is | Action taken |
|------|-------|-----------|-----------|--------------|
| 2026-07-13 | Audit-fix pass (M0, M1, M3, M4, M6, M7) | Assorted minor/low audit findings | — | Standardized jump-height wording (peak ~2.5 units / keep steps <=~2) across M3/04 + M4/02 (fixed the <=2 vs <=2.5 self-contradiction); glossed `Transform` at first use (M0/03); split the New-Scene arrow-chain to match M1/01 (M1/04); added `[Header]` + Clear-Flags=Solid-Color notes at first use (M6/01); 3-word glosses for IL2CPP (M0/01), URP/HDRP (M0/02), Canvas Scaler (M1/02); inlined the full `MenuController.cs` into M7/07 verify. **M0/M1/M3/M4/M6/M7 need Editor re-verification (never mark verified without a human Done-when run).** _(+ 2026-07-13 re-audit follow-up: first-step nav `prev → —` applied across every milestone's `01_*.md` — cosmetic nav-line only, no Done-when impact.)_ |
| 2026-07-11 | M1/05 + glossary | "File → Build Settings…" | Unity 6 renamed it to **File → Build Profiles** (scenes under "Scene List"; Ctrl+Shift+B) | Rewrote M1/05 to lead with Build Profiles; updated glossary + adjacent troubleshooting. |
| 2026-07-11 | M4/02, M4/04, jumpSpeed default | "Jump Speed 12 → ~2–2.5-unit jump" | jumpSpeed 12 at default gravity apexes ~7 units (floaty; contradicted the 2-unit staircase) | Lowered `jumpSpeed` default 12→**7f** (apex ≈2.5 units) across all 4 code renders; corrected M4/02 prose + M4/04 floaty-fix (raise Gravity Scale AND Jump Speed together). |
| 2026-07-11 | M1/03/05/07 script-create | "Create → MonoBehaviour Script" | Unity 6.5 nests script types under a **Scripting** submenu | Updated all 4 script-creation steps to "Create → Scripting → MonoBehaviour Script (older: C# Script)". |
| 2026-07-13 | README:19,33 · conventions:21 · decision-log D2 · M0/00 · M2/00 · PLAN:28,196,228 | Front-door claim "you write **no C# until M3**" / "first script is M3" | M1 already writes `MenuController.cs` (a MonoBehaviour); the first *gameplay* script is M3's `PlayerController` | Reworded every global claim to "no **gameplay** C# until M3" and "first *gameplay* script is M3"; the M1 menu script named as the small exception. M2's physics-scoped "no C# to make this happen" left as-is (accurate). |
| 2026-07-13 | stack.md:21 · M7/00:37 · M7/05:16 | The 3 D8 links used slug `d8-…-for-best-time` (dropped the word "the") | The D8 heading's real slug is `d8-…-for-the-best-time` | Added the missing `the-` segment to all 3 anchors; they now resolve. |

## Session log
<!-- Append-only. One line per working session. -->
- 2026-07-11 — Plan approved (Unity 6.5, full web-platformer parity + Main Menu); guide scaffolded (README + 6 foundation docs + 8 milestone overview placeholders + feedback log + token ledger). No step content drafted yet.
- 2026-07-11 — Second `/audit-guide` pass (post-fix verification via a whole-guide reviewer + sweeps): **PASS-WITH-WARNINGS → now clean.** Reviewer reconstructed the final GameManager/PlayerController/Sfx from the fragment steps and confirmed they match the M7/07 renders byte-for-byte and compile. Fixed the last 3 remaining findings — stale "File → Build Settings" path in M7/07 "next steps", conventions.md, and stack.md (all → Build Profiles). Also finished 2 deferred nits: milestone numbering now "N of 8 (M0–M7)" on all overviews, and M7/04's timer fragment order aligned to the verify file. 375 links, 0 dead. Remaining "Build Settings" mentions are concept/glossary/term only (reconciled in glossary); no path instruction dead-ends. Still 📝 — not Editor-run.
- 2026-07-11 — `/audit-guide`: whole-guide audit via 3 parallel subagents (M0–M2 / M3–M4 / M5–M7) + structural sweeps. **Verdict PASS-WITH-WARNINGS** (0 blockers). All real findings **fixed**: (1) Build Settings→**Build Profiles** menu path for Unity 6 (M1/05 + glossary, web-verified); (2) jump-height physics error — `jumpSpeed` default 12→**7f** (12 apexes ~7 units, not 2–2.5) + M4 prose/tuning reconciled; (3) broken D2 decision-log anchor fixed; (4) script-create path → **Scripting** submenu (4 steps); (5) `MonoBehaviour` gloss added at first gameplay-script use + glossary intro corrected to M1; (6) M6 telegraph now cleared in `Win()` (4 full-file renders); (7) minor: "three→four fields", Player-name mislabel, Rect Transform gloss, camera Clear-Flags troubleshooting. Re-ran link check: **374 links, 0 dead**; jumpSpeed/Win consistency confirmed across all renders. Still 📝 — not run in the Editor.
- 2026-07-13 — Audit-fix pass. **W1 (framing contradiction):** the front-door promise "no C# until M3" was false — M1 writes `MenuController.cs`. Reworded every global claim to "no **gameplay** C# until M3" (README ×2, conventions, decision-log D2, M0/M2 overviews, PLAN ×3); left M2's physics-scoped claim as-is. **W2 (dead anchor):** the 3 links to D8 dropped `the-` from the slug — fixed to `#d8--playerprefs-for-the-best-time` (stack.md, M7/00, M7/05). M0/M2/M7 flagged ⚠ re-verify. Still 📝 — not Editor-run.
- 2026-07-13 — Minor/low audit-fix pass (jump-height wording R4, glosses R1, arrow-chain R9, twist heads-up R3, MenuController inline). **Content fixes were confirmed already present in the guide** (applied earlier the same day; see drift-log row). Reconciled the bookkeeping gap: the milestone status table now flags **M1/M3/M4/M6 ⚠ re-verify** (previously only M0/M7 were flagged, for unrelated reasons) and M0/M7 notes now cite the audit-fixes too. No guide content changed in this pass. Still 📝 — not Editor-run.
- 2026-07-13 — Confirmation re-audit of W1/W2: **PASS** — all decision-log anchors (incl. D8) resolve to headings, no false global "no C#" claim remains (M2's physics-scoped one is accurate), D2 heading slug unchanged so the README link still resolves, only the known PLAN.md nav-template placeholders flagged by the link check. Still 📝 — not Editor-run.
- 2026-07-11 — Drafted the WHOLE guide in one pass: M0–M7, 48 step/verify files + 8 overviews (56 `.md`). Code designed as one final 4-script codebase (`MenuController`, `PlayerController`, `GameManager`, `Sfx`) and back-filled per milestone for name/API consistency; each milestone's `NN_verify.md` renders the full current scripts. Nav-line + dead-link checks pass (368 real relative links resolve; the 3 flagged are literal template placeholders in PLAN.md). **NOT executed in the Unity Editor** by the author (no Editor in env) — all milestones 📝 drafted, human verification pending. Load-bearing APIs cross-checked vs Unity 6.5 docs: `Rigidbody2D.linearVelocity`, legacy `Input.GetAxisRaw`/`GetButtonDown`, `Physics2D.gravity`, `SceneManager.LoadScene`, `OnTriggerEnter2D`+`CompareTag`, `AudioClip.Create`, `PlayerPrefs`, `Time.timeScale`.
