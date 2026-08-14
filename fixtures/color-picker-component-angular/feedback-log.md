# Feedback log — An Angular colour picker that ships as a plain HTML tag

> Append-only field log of friction readers hit while following this guide. Its purpose is to improve the
> guide **and** the GuideForge method over time — so entries are captured even when the guide is not (yet)
> changed. This is a **record, not a to-do**: logging an entry here does not by itself change the guide. To
> actually fix the guide from a report, run `/report-issue` (it fixes the root cause and sweeps for siblings).
>
> Written by `/log-feedback` (capture) and, when a fix ships, by `/report-issue`. Newest entries on top; one
> entry per distinct piece of friction. Use absolute dates (`2026-07-09`), never "today".

## 2026-08-14 — An edit instruction named a line `ng new` never writes, with no fallback

- **Where:** M1 [04_the-build-output.md](MILESTONE_1_the-tag-on-a-page/04_the-build-output.md) *Do this* 1
- **Reader:** an agent following the whole guide end to end as written, on Windows / PowerShell, Node 24.16.0,
  Angular 22.1.2 — the guide's own target environment
- **What happened:** the action says *"find the line `"outputPath": "dist/color-picker",` — it occurs once,
  under `projects` → `color-picker` → `architect` → `build` → `options`. Replace that single line with…"*. In
  the workspace produced one command earlier by
  `npx --yes @angular/cli@22 new color-picker --style=css --ssr=false --skip-tests`, **`outputPath` is absent
  from `angular.json` altogether** — the builder falls back to `dist/<project-name>`, so the CLI writes no such
  line. The `options` block is exactly `browser`, `tsConfig`, `assets`, `styles`. The reader is told to replace
  something that isn't there, and the step's *If it breaks* covers a malformed object and a wrong project, not
  an absent line. Action 3 of the same step handles precisely this case for its own key ("If your `production`
  block has no `outputHashing` line at all, add the one above to it") — action 1 does not. Recovering means
  inferring that the object must be *added* to `options`; M1 `06_verify.md` shows it as a "changed region",
  which reads as confirmation only once you have already guessed right. This was the only point in 23 steps
  where following the text literally was impossible.
- **Suspected class:** stale value/command/API — an instruction written against a workspace shape the pinned
  CLI does not produce (rules 2.1, 7.1)
- **Severity:** blocker
- **Tags:** `M1`, `angular.json`, `build-config`, `2.1`, `7.1`, `ng-new-drift`
- **Status:** fixed via /report-issue (2026-08-14)

## 2026-08-14 — A Done-when predicted a bigger bundle; deleting the scaffolding made it smaller

- **Where:** M1 [03_register-the-element.md](MILESTONE_1_the-tag-on-a-page/03_register-the-element.md)
  *Done when*, third box
- **Reader:** the same end-to-end run
- **What happened:** the box reads *"The build's output is larger than it was in step 02: it now carries
  Angular's runtime plus your component."* Measured, it is **smaller**: `main` goes from **216.19 kB** after
  step 02 to **106.54 kB** after step 03. Both numbers are correct and the build exits 0 — the drop is real,
  because the same step deletes `src/app/`, and what leaves with it (the CLI's ~20 kB generated welcome
  template plus the router pulled in by `app.routes.ts`/`app.config.ts`) outweighs what arrives. The step is
  right that the component finally reaches the bundle; the observable it picked to prove that moves the other
  way. A reader who trusts the checkbox concludes the registration did not take and starts debugging a build
  that is fine.
- **Suspected class:** pedagogy-gap — a Done-when asserting a direction the step's own actions reverse (rule
  6.1)
- **Severity:** confusing
- **Tags:** `M1`, `gates`, `bundle-size`, `6.1`
- **Status:** fixed via /report-issue (2026-08-14)

## 2026-08-14 — Two stated pixel widths disagree with what the browser renders

- **Where:** M1 [05_the-demo-page.md](MILESTONE_1_the-tag-on-a-page/05_the-demo-page.md) *Done when* and
  [06_verify.md](MILESTONE_1_the-tag-on-a-page/06_verify.md) gate item 3; M2
  [05_verify.md](MILESTONE_2_the-hue-rail/05_verify.md), the *Why the midpoint is not gated on `#00ffff`* note
- **Reader:** the same end-to-end run, reading `getBoundingClientRect()` in DevTools
- **What happened:** two gates describe *"a white panel, **240px** wide"*, and the panel measures **266 px**
  on screen — `.panel` sets `width: 240px` under the default `content-box`, so 12 px of padding on each side
  and a 1 px border sit outside it. The M2 note then reasons from *"the rail is about **216 px** wide, so one
  pixel is roughly 1.7° of hue"*; the rail measures **240 px** (it is the panel's content box), which makes it
  1.5°/px. Neither number changes what a reader does — the gates that matter read colours, not sizes, and the
  note's conclusion (you cannot land on 180.0° by hand) holds either way — but both are stated as measurements
  in a guide whose gates are otherwise exact to the digit, and a reader who checks one of them in DevTools
  finds it wrong.
- **Suspected class:** stale value/command/API — measurements quoted from the CSS declaration rather than from
  the rendered box (rule 3.1)
- **Severity:** cosmetic
- **Tags:** `M1`, `M2`, `gates`, `measurements`, `3.1`
- **Status:** fixed via /report-issue (2026-08-14)

## 2026-08-14 — A milestone gate could fail on a correct build, because it counted files

- **Where:** M1 `04_the-build-output.md` *Done when*, M1 `06_verify.md` gate item 8, M5 `07_verify.md` gate item 12
- **Reader:** the repo's own `/audit-guide` pass, not a human following the guide
- **What happened:** the gates asserted that `ls dist/color-picker` lists `main.js` and `index.html` and
  **"nothing else"**, as the proof that a zoneless build needs no companion file. A production build can
  legitimately write more than that — `3rdpartylicenses.txt` among them — so a reader whose build was
  perfectly correct would read the gate as failed, and would go looking for a defect that does not exist.
- **Suspected class:** pedagogy-gap — a gate asserting more than the property it claims (rule 6.1)
- **Severity:** blocker
- **Tags:** `gates`, `M1`, `M5`, `build-output`, `6.1`
- **Status:** fixed via /report-issue (2026-08-14)

## 2026-08-14 — Ten smaller contract defects found in the same audit pass

- **Where:** across the guide — see the drift log in [foundation/status.md](foundation/status.md)
- **Reader:** the same audit pass
- **What happened:** two Done-when gates contradicted themselves inside one line ("exports exactly three
  names", then four of them; "nine names: three interfaces and five functions"); the front door still claimed
  four colour conversions after the ladder moved to five; nine step files addressed the guide-follower as "the
  reader"; the static server was declared once and depended on fifteen times; `stack.md` had no *Target OS /
  shell(s)* row though every command carries two shell variants; HSL was taught with no glossary entry and no
  doc link while HSV, hue, saturation and value each had both; an early definition carried no `[M3]` marker;
  and M3's map repeated the reality-check framing its verify file owns.
- **Suspected class:** pedagogy-gap
- **Severity:** confusing
- **Tags:** `voice`, `3.5`, `7.1`, `1.1`, `gates`
- **Status:** fixed via /report-issue (2026-08-14)
