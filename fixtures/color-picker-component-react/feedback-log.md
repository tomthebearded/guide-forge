# Feedback log — A React colour picker that ships as a plain HTML tag

> Append-only field log of friction readers hit while following this guide. Its purpose is to improve the
> guide **and** the GuideForge method over time — so entries are captured even when the guide is not (yet)
> changed. This is a **record, not a to-do**: logging an entry here does not by itself change the guide. To
> actually fix the guide from a report, run `/report-issue` (it fixes the root cause and sweeps for siblings).
>
> Written by `/log-feedback` (capture) and, when a fix ships, by `/report-issue`. Newest entries on top; one
> entry per distinct piece of friction. Use absolute dates (`2026-07-09`), never "today".

## 2026-08-14 — The built bundle throws `process is not defined` on the demo page, and M1 cannot be completed

- **Where:** M1 [05_the-library-build.md](MILESTONE_1_the-tag-on-a-page/05_the-library-build.md) *Do this* 1
  (the `vite.config.ts` it dictates), surfacing at M1
  [06_the-demo-page.md](MILESTONE_1_the-tag-on-a-page/06_the-demo-page.md) and
  [07_verify.md](MILESTONE_1_the-tag-on-a-page/07_verify.md)
- **Reader:** an agent following the whole guide end to end as written, on Windows, Node 24.16.0, with the
  versions the guide pins — Vite **8.2.1**, React **19.2.x**, `create-vite` **9.1.2**
- **What happened:** every step through 05 behaves exactly as written and `npm run build` exits 0. Then the
  demo page loads the bundle and the tag stays empty, with this in the Console:

  ```
  Uncaught ReferenceError: process is not defined
      at color-picker.js:20202:2
  ```

  `customElements.get('color-picker')` is `undefined` and `shadowRoot` is `null`, because the module threw
  before `customElements.define` ran. The cause is in the built file, not in any code the guide had you type:

  ```js
  process.env.NODE_ENV === "production" ? (n(), t.exports = u()) : t.exports = d();
  ```

  **Vite's library mode does not replace `process.env.NODE_ENV`** — it leaves it for the consuming bundler to
  substitute, which is right for a library published to npm and wrong for this guide's entire premise: the
  consumer here is a plain HTML page with no bundler, where `process` does not exist. React reads it at module
  scope, so the bundle dies on load. There are 12 occurrences in the output. The step is explicit that
  "everything else in the config stays at its default" and warns only against `rollupOptions.external`; nothing
  in the guide mentions `define`, and the symptom appears one step *after* the step that caused it, in the
  file the reader just wrote — so the *If it breaks* list they will reach (blank tag, CORS, 404) points at
  none of it.

  The tell is visible earlier, in step 05's own gate: it says the bundle should be "on the order of a few
  hundred kilobytes", and the broken build is **769.54 kB** because both of React's branches survive. With the
  fix it is 260 kB.

  What unblocks it — one line, added to the config in step 05 action 1:

  ```ts
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  ```

  With that line, and nothing else changed, all five milestone gates in this guide pass exactly as written,
  including every exact string in M5.
- **Suspected class:** missing-prereq — a required build-config option the guide never names, in the one step
  that fixes the build's shape (rules 3.3, 5.1)
- **Severity:** blocker
- **Tags:** `M1`, `vite`, `library-mode`, `react`, `build-config`, `3.3`, `5.1`
- **Status:** fixed via /report-issue (2026-08-14)

## 2026-08-14 — The step-01 gate describes a scaffold `create-vite` no longer produces

- **Where:** M1 [01_create-the-workspace.md](MILESTONE_1_the-tag-on-a-page/01_create-the-workspace.md)
  *Done when*
- **Reader:** the same end-to-end run, on `create-vite` **9.1.2** — resolved by the guide's own
  `npm create vite@latest`
- **What happened:** two of the gate's three boxes cannot be ticked. It says the stock page shows "a heading
  reading `Vite + React`, and a button whose label is `count is 0`"; the template renders a heading reading
  **`Get started`** and a button reading **`Count is 0`** (capital C). It also says `ls src` lists
  `App.tsx`, `App.css`, `index.css`, `main.tsx`, **`vite-env.d.ts`** and an `assets` folder — the template no
  longer writes `vite-env.d.ts` at all. Nothing is broken: the toolchain works and step 02 deletes most of
  these files anyway. But this is the reader's *first* gate, before they have any feel for which mismatches
  matter, and it is the worst possible place to teach them that the guide's exact values are approximate.
- **Suspected class:** stale value/command/API — a gate quoting an unpinned scaffold's output
  (`npm create vite@latest` resolves to whatever is newest), rule 3.1
- **Severity:** confusing
- **Tags:** `M1`, `gates`, `create-vite`, `scaffold-drift`, `3.1`
- **Status:** fixed via /report-issue (2026-08-14)

## 2026-08-14 — Three steps claimed a clean build against a config that would have failed them

- **Where:** M2 `01_the-color-model.md`, `02_hex-output.md`, `03_draw-the-hue-rail.md`; M5 `03_rgb-and-hsl-output.md` (now merged)
- **Reader:** the repo's own `/audit-guide` pass, not a human following the guide
- **What happened:** each of those steps introduced a declaration — `setColor`, then `formatRgb`/`formatHsl` —
  one or more steps before anything called it, and every one of their *Done when* lines said `npm run build`
  exits without an error. The `react-ts` template pins `"noUnusedLocals": true` and `npm run build` runs
  `tsc -b` first, so the build stops on *'setColor' is declared but its value is never read*. M2/01 went
  further and told you TypeScript would not complain, giving a reason that had never been checked.
- **Suspected class:** pedagogy-gap — a step that cannot end on a green build (rule 4.4), plus a capability
  claimed with an unverified `because`
- **Severity:** blocker
- **Tags:** `4.4`, `M2`, `M5`, `typescript`, `sourcing`
- **Status:** fixed via /report-issue (2026-08-14)

## 2026-08-14 — The `change` event could carry a different colour from the last `input`

- **Where:** M4 `04_reflect-the-value-out.md`, `05_input-and-change-events.md`, `07_verify.md` gate 3; M5 verify
- **Reader:** the same audit pass
- **What happened:** `applyColor` published the hex it had just been handed, while `commitColor` re-derived one
  from `color` read out of the render closure. Those are two sources, and `pointermove` runs at a priority
  React need not have committed by the time `pointerup` fires — so the `change` event could be one pointer-move
  behind the last `input`, while two gates asserted the two were identical. A gate that fails intermittently on
  correct code is worse than one that always fails.
- **Suspected class:** technical defect surfacing as a gate that cannot be relied on (rule 6.1)
- **Severity:** blocker
- **Tags:** `gates`, `M4`, `M5`, `react`, `events`
- **Status:** fixed via /report-issue (2026-08-14)

## 2026-08-14 — Eight smaller contract defects in the same audit pass

- **Where:** across the guide — see the drift log in [foundation/status.md](foundation/status.md)
- **Reader:** the same audit pass
- **What happened:** the audience matrix had no row for JavaScript/TypeScript itself, so the bar for glossing
  built-ins was undefined and the guide's own bar drifted inside single functions; `#hostValueVersion` was
  incremented by any observed attribute, including `format`; the guide-follower was called "the reader" in one
  sentence; an insertion anchor named three lines over a region of four; the README promised "no service to
  install" while every gate needs a static server running; ~24 gates asked you to look at the absence of an
  error rather than at an exit code; one step's gate observed nothing new; and the element was silent about
  what happens if the tag is relocated in the DOM.
- **Suspected class:** pedagogy-gap
- **Severity:** confusing
- **Tags:** `1.1`, `3.6`, `4.3`, `6.3`, `voice`, `front-door`
- **Status:** fixed via /report-issue (2026-08-14) — except the relocation case, which is now a **named limit**
  in M1/03 and D9 rather than a code change
