# STATUS — An Angular colour picker that ships as a plain HTML tag

> _Generated with **GuideForge v1.15.0**._
> _Last updated with **GuideForge v1.15.0** on 2026-08-14._

> **This file is the single source of truth for what is actually done.** The guide describes intent; only this
> page states reality. A milestone is ✅ **only** after its Done-when gate has been run and observed — for this
> guide that means someone opened the demo page in a browser, over HTTP, after a hard reload, and read the
> exact values the gate names.

## Frontier

- **Current frontier:** the guide is **drafted, audited and not verified.** All five milestones, 23 steps and
  5 verify gates exist; one audit pass found 11 defects and a later report found 3 more, all fixed (drift log
  below). **No gate has been signed off, and every row in [`progress.md`](progress.md) is unticked** — nobody
  has followed this guide as a reader, in order, which is the only thing that verifies a milestone here.
  The three M1 rows at the foot of the drift log are the one place where a claim was settled by running the
  CLI rather than by reading the step; everything else is as verified as the online stack check made it, and
  no further. Start following at [M1](../MILESTONE_1_the-tag-on-a-page/00_overview.md).
- **Executed through:** nothing yet — every row in [`progress.md`](progress.md) is unticked.

## Source inputs

| Input | Used for | Provided on | Re-checked on |
|-------|----------|-------------|---------------|
| One-line idea + a full Phase 0 interview in conversation | scope, ladder, audience matrix, gate design | 2026-08-14 | — |
| Online stack check (Phase 0.5) | versions, docs links, the five facts in `stack.md` | 2026-08-14 | — |
| [`PLAN.md`](../PLAN.md) | the approved ladder, the build-vs-borrow table, the writing contract | 2026-08-14 | — |

## Milestone status

| Milestone | Status | Verified on | Notes |
|-----------|--------|-------------|-------|
| M1 — The tag on a page | ⏳ gates rewritten 2026-08-14, needs re-verification | — | 5 steps + verify. Proves the distribution path before any colour logic exists. Steps 03, 04, 05 and the verify gate all changed |
| M2 — The hue rail | ⏳ gate and prose edited 2026-08-14 | — | 4 steps + verify |
| M3 — The saturation/value area (reality-check gate) | ⏳ prose edited 2026-08-14 | — | 3 steps + verify |
| M4 — The host-page contract | ⏳ prose edited 2026-08-14 | — | 5 steps + verify |
| M5 — Alpha, formats and theming | ⏳ gates rewritten 2026-08-14, needs re-verification | — | 6 steps + verify |

<!-- Status key: ✅ verified (Done-when passed by hand) · 📝 drafted · ⏳ in progress · ❌ not started -->

> **Verification honesty note.** No gate in this guide is machine-checkable: every one of them is a person
> looking at a browser (D5). That makes this table the only thing standing between "drafted" and "works", and
> it means a milestone here can only ever be ticked by someone who actually watched its values appear.

## Drift log

| Date | Where | Guide said | Reality is | Action taken |
|------|-------|-----------|-----------|--------------|
| 2026-08-14 | M1 step 04 *Done when*, M1 `06_verify.md` gate item 8, M5 `07_verify.md` gate item 12 | `ls dist/color-picker` lists `main.js` and `index.html`, **"nothing else"** — presented as proof that a zoneless build needs no companion file | An **exhaustive listing is not a property of a correct build.** The application builder's `production` configuration also writes `3rdpartylicenses.txt` when `extractLicenses` is on, which is its default. The claim the guide actually wanted to make is narrower and stable: `main.js` exists, and **no** `polyfills*` file does. Since confirmed against the CLI: a production build on Angular 22.1.2 writes `main.js`, `index.html`, `favicon.ico`, `prerendered-routes.json` and `3rdpartylicenses.txt`, and no `polyfills*` | All three gates rewritten to read one presence and one absence, and to name `index.html` / `3rdpartylicenses.txt` as expected. Swept every other gate for the same shape: M1 step 03's `ls src` was the only sibling and now reads as presence-plus-one-absence. A troubleshooting row added at M1 verify for the reader who counts files anyway |
| 2026-08-14 | `README.md` key decisions, `PLAN.md` §2.5 prose | "the **four** sRGB conversions the picker needs" | Five. Drafting M4 found that accepting `value="#3366ff"` needs RGB→HSV, which the plan had not counted; D2 and the ladder were corrected then, the two prose sentences were not | Both corrected. The count now reads five in every place it appears |
| 2026-08-14 | M2 step 02 and M5 step 03 *Done when* | "exports exactly **three** names" followed by four of them; "exports **nine** names: three interfaces and five functions" | Four, and eight. Both gates contradicted themselves inside one line, so neither could be checked | Rewritten to name what is exported instead of counting badly |
| 2026-08-14 | 9 step files, 14 sentences | The guide-follower called "the reader" in *Why / design* prose | The voice principle is second person throughout; three of the fourteen genuinely meant *whoever uses the finished picker*, which is a different actor | Eleven rewritten to "you"; the three about the picker's user rewritten as "a person" / "a click", not as "you" |
| 2026-08-14 | `PLAN.md` §4, M1 row | The ladder's M1 Done-when gated on the demo page's `* { border: 3px dashed magenta }` not appearing inside the component | The guide gates on `.panel { background: #000000 }` instead, and is right to: `*` also matches the `<color-picker>` host element, which sits in the light DOM, so the border would appear around the picker and prove nothing about the boundary. The deviation was made during drafting and never reported | The plan's M1 row corrected to the gate the guide actually carries, with the reason inline. Found by the second audit pass, not the first |
| 2026-08-14 | M2–M5 `00_overview.md` | The static server was established once, in M1 step 05, and re-declared once, in M2 step 03 | Fifteen later Done-whens are read on a page that server has to be serving. A reader returning after a break had no line telling them to restart it | The prerequisite, with the restart command, added to all four later milestone maps |
| 2026-08-14 | M1 step 04 *Do this* 1 | *"find the line `"outputPath": "dist/color-picker",` — it occurs once … Replace that single line"* | **There is no such line.** `ng new` on Angular 22 writes no `outputPath` at all: the option is optional and the builder falls back to `dist/<project-name>`, which is why step 01's build already lands in `dist/color-picker`. The instruction cannot be carried out as written, and — unlike action 3, which handles exactly this case for `outputHashing` — it offered no fallback | Action 1 now says **add** the object to `options`, names the absent line as the normal case, and keeps "replace" only for a workspace that happens to carry the string form. An *If it breaks* entry and a verify troubleshooting row added for the reader who goes looking for the line; M1 verify's *Pre-existing files modified* now says `outputPath` is **added**. Swept the guide for the same shape: the two other `find …` instructions point at text the CLI does write or the reader wrote themselves |
| 2026-08-14 | M1 step 03 *Done when*, third box | "The build's output is **larger** than it was in step 02: it now carries Angular's runtime plus your component" | **Smaller.** The same step deletes `src/app`, and the CLI's generated welcome template plus the router it pulls in outweigh the component that arrives — the bundle drops by roughly half. The claim was reasoning about what was added without counting what left, so a correct build reads as a failed gate | Rewritten to state the direction that actually holds, with the reason, and to gate on the direction rather than on a number that moves with the patch version |
| 2026-08-14 | M1 steps 05 and 06 *Done when* · M2 `05_verify.md` note | "a white panel, **240px** wide" (twice) · "the rail is about **216 px** wide, so one pixel is roughly 1.7° of hue" | `.panel` sets `width: 240px` under the default `content-box`, so the element measures **~266px** once 12px of padding each side and a 1px border are counted; the rail, which fills the content box, is **240px**, making one pixel **1.5°**. Both numbers were read off the stylesheet rather than off the rendered box | The two gates now read colours and corner radii and say plainly why the measured width differs from the CSS one; the M2 note recalculated. The note's conclusion is unchanged — 180.0° is still not reachable by hand |

## Session log

| Date | What happened |
|------|---------------|
| 2026-08-14 | Guide planned from a full Phase 0 interview; stack verified online against Angular 22 / Node 24 |
| 2026-08-14 | Scaffolded from `PLAN.md` — skeleton, six foundation docs, five placeholder milestone maps |
| 2026-08-14 | Drafted in one pass — five milestones, 23 steps, 5 verify gates. Two plan corrections found while drafting: a fifth conversion (RGB→HSV) is needed for the `value` attribute, and M2's original gate asked for `#00ffff` at a midpoint half a pixel wide. Both recorded in `PLAN.md` and D2 |
| 2026-08-14 | `/audit-guide` over the whole guide: **FAIL** — 1 BLOCKER, 10 WARNINGs. The BLOCKER was a gate that asserted an exhaustive `dist/` listing; the rest were two wrong export counts, a stale conversion count, third-person voice in 9 steps, an undeclared server prerequisite, a missing *Target OS / shell(s)* row, HSL taught without a glossary entry or doc link, an unmarked early definition, and an overview edging into teaching |
| 2026-08-14 | `/report-issue` on that report: all 11 findings fixed, five drift rows recorded, all five milestones set ⏳. The BLOCKER's fix is a **more robust gate**, not an observation — nothing here has been executed, so it stays unconfirmed until someone runs `npm run build` |
| 2026-08-14 | Three further defects reported and fixed, all in M1 and all of the same family: statements about the *toolchain's* output — the line `ng new` writes, the direction the bundle's size moves, the width the browser lays out — rather than about the picker. Three drift rows above. **Nothing was marked verified**: the findings came from checking the instructions against the CLI, not from a reader following the guide, and no gate has been signed off — see the frontier note |
