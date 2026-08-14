# STATUS — A React colour picker that ships as a plain HTML tag

> _Generated with **GuideForge v1.15.0**._
> _Last updated with **GuideForge v1.15.0** on 2026-08-14._

> **This file is the single source of truth for what is actually done.** The guide describes intent; only this
> page states reality. A milestone is ✅ **only** after its Done-when gate has been run and observed — for this
> guide that means someone opened the demo page in a browser, over HTTP, after a hard reload, and read the
> exact values the gate names.

## Frontier

- **Current frontier:** the guide is **drafted, audited and not verified.** All five milestones, 23 steps and
  5 verify gates exist; one audit pass found 11 defects and a later report found 2 more — including one that
  stopped M1 dead — all resolved (drift log below). **No gate has been signed off, and every row in
  [`progress.md`](progress.md) is unticked** — nobody has followed this guide as a reader, in order, which is
  the only thing that verifies a milestone here. The two M1 rows in the middle of the drift log are the one
  place where a claim was settled by running the toolchain rather than by reading the step; everything else is
  as verified as the online stack check and the hand-checked colour arithmetic made it, and no further. Start
  following at [M1](../MILESTONE_1_the-tag-on-a-page/00_overview.md).
- **Executed through:** nothing yet — every row in [`progress.md`](progress.md) is unticked.

## Source inputs

| Input | Used for | Provided on | Re-checked on |
|-------|----------|-------------|---------------|
| One-line idea + a full Phase 0 interview in conversation | scope, ladder, audience matrix, gate design | 2026-08-14 | — |
| [`color-picker-component-angular/PLAN.md`](../../color-picker-component-angular/PLAN.md) | the product definition — the same picker, end state and gates, on a different stack | 2026-08-14 | — |
| Online stack check (Phase 0.5) | versions, docs links, the five facts in `stack.md` | 2026-08-14 | — |
| [`PLAN.md`](../PLAN.md) | the approved ladder, the build-vs-borrow table, the writing contract | 2026-08-14 | — |

## Milestone status

| Milestone | Status | Verified on | Notes |
|-----------|--------|-------------|-------|
| M1 — The tag on a page | ⏳ rewritten 2026-08-14, needs re-verification | — | 6 steps + verify. Proves the distribution path before any colour logic exists. The widest divergence from the sibling Angular guide: the bridge is written here, not imported |
| M2 — The hue rail | ⏳ rewritten 2026-08-14, needs re-verification | — | 4 steps + verify |
| M3 — The saturation/value area (reality-check gate) | ⏳ rewritten 2026-08-14, needs re-verification | — | 3 steps + verify |
| M4 — The host-page contract | ⏳ rewritten 2026-08-14, needs re-verification | — | 6 steps + verify. Carries one step more than the Angular guide: the `value` property accessors, which Angular Elements would have generated |
| M5 — Alpha, formats and theming | ⏳ rewritten 2026-08-14, needs re-verification | — | 5 steps + verify |

<!-- Status key: ✅ verified (Done-when passed by hand) · 📝 drafted · ⏳ in progress · ❌ not started -->

> **Verification honesty note.** No gate in this guide is machine-checkable: every one of them is a person
> looking at a browser (D6). That makes this table the only thing standing between "drafted" and "works", and
> it means a milestone here can only ever be ticked by someone who actually watched its values appear.

## Drift log

| Date | Where | Guide said | Reality is | Action taken |
|------|-------|-----------|-----------|--------------|
| 2026-08-14 | [`PLAN.md`](../PLAN.md) §3, the `decision-log.md` row | The foundation-doc sketch listed seven decisions, D1–D7 | The approved build-vs-borrow table has **four** rows, and the scaffold contract requires one decision-log entry per row. Writing them out gives nine entries, D1–D9 | `decision-log.md` written with D1–D9; the plan's §3 row corrected to match. No decision changed — only the numbering the sketch had guessed |
| 2026-08-14 | [`PLAN.md`](../PLAN.md) §4, M1 row | M1's gate probed the shadow boundary with the host page's `* { border: 3px dashed magenta }` | `*` also matches the `<color-picker>` host element, which sits in the **light** DOM, so the border appears around the picker and proves nothing about the boundary. The sibling Angular fixture hit the same thing and its audit caught it there | The gate now uses `.panel { background: #00ff00 }` — a class name that exists **only** inside the shadow root — and reads the panel staying `#1e1e1e`. The plan's M1 row corrected with the reason inline |
| 2026-08-14 | [`PLAN.md`](../PLAN.md) §4, M5 row | M5's gate read the three formats "at alpha 0.5", reached by dragging the alpha rail | 0.5 is one position on a 240-pixel track and cannot be hit by hand. The same class of defect as the Angular fixture's `#00ffff`-at-a-midpoint gate | Alpha now arrives from the tag, `value="#3366ff80"`, which is exact by construction; the rail itself is gated at its two clamped ends, where a pointer can be held. Plan row corrected |
| 2026-08-14 | [`PLAN.md`](../PLAN.md) §5, step cuts | M1 as 7 steps with the class and its `customElements.define` split; M5 with the alpha rail before the alpha byte | Neither cut survives rule 4.4. An unregistered custom-element class renders nothing, so its step has no observable gate; and adding a required `alphaRatio` field to `HsvColor` breaks every call site at once, so splitting it leaves step 01 not compiling | M1 is 6 steps (class and registration together), M5's step 01 is the whole model change. §5 rewritten to the cut as drafted, with both reasons inline. Total: 24 steps, not 25 |

| 2026-08-14 | M2 steps 01–03, M5 steps 03–04 *Done when* | Both said `npm run build` exits without an error | **It does not.** The `react-ts` template pins `"noUnusedLocals": true`, and `npm run build` runs `tsc -b` **before** Vite. M2/01 introduced `useState` three steps before anything called `setColor`; M5/03 wrote two formatters one step before anything called them. Both are rule-4.4 breaks — the guide told you a step ended green when the step does not compile. M2/01 also asserted *"TypeScript will not complain, because it is destructured rather than declared"*, a `because` clause that was never checked | **One cause, two sites, both re-cut.** M2/01 now holds the colour in a plain `const` and `useState` arrives in M2/04, where the drag needs it — which is also where it belongs pedagogically. M5/03 and M5/04 are merged into one step, so M5 is 4 steps + verify and the guide is 23 steps. The false TypeScript claim is gone; both steps carry a 5.1 note naming the exact `is declared but its value is never read` message. Swept every other step for a declaration introduced before its first caller: none found |
| 2026-08-14 | M4 steps 04–05, M4 `07_verify.md` gate 3, M5 verify gate | `commitColor()` published `rgbToHex(hsvToRgb(color))` — state read from the render closure — while `applyColor` published the value it had just been handed. The gates assert the `change` event's hex is identical to the last `input`'s | **Two publish paths reading two different sources cannot be guaranteed equal.** `color` in a handler is the last render React *committed*, and `pointermove` is a low-priority event whose update need not have committed when `pointerup` fires. The `change` event could carry a colour one pointer-move behind — a gate failing intermittently on correct code, and a host page listening only to `change` storing a value the picker never showed | `applyColor` now records the hex it publishes in a `useRef` box, and `commitColor` re-emits that. `choosePreset` records its own text the same way. The M4 gate now asks for a **fast** drag as well as a slow one, since that is the case the old code failed. `useRef` gets a 1.1 callout in M4/04 and a glossary entry |
| 2026-08-14 | `PLAN.md` §1 audience matrix | Four topics rated; **JavaScript and TypeScript themselves were not among them** | With no row for the language, the bar for glossing built-ins was undefined — and the guide's own bar drifted: `Math.floor`, `padStart`, `parseInt` and `getBoundingClientRect` were explained, while `trim`, `replace`, `split`, `map`, `join`, `slice` and `test` were left bare in the same functions | A **Beginner** row added for the language itself, with the policy stated as an inline comment on the line (never a glossary entry — the glossary holds words, not functions). The bare built-ins in `parseHex` glossed at both of its versions |
| 2026-08-14 | `color-picker-element.tsx`, from M4/02 | `attributeChangedCallback` ignored its `name` parameter and incremented `#hostValueVersion` for every observed attribute | From M5 onwards `format` is observed too, so a field named for `value` counted writes to something else. Benign today only because `value` is reflected on every change | The callback now reads `name` and moves the counter only for `'value'`. The edit lands in M5/03, the step that adds the second observed attribute, where the parameter stops being ignorable |
| 2026-08-14 | M1 step 03 | Silent about what happens if the tag is moved between parents | `disconnectedCallback` then `connectedCallback` fires, and React refuses a container that has already hosted a root. Supporting a move needs a fresh mount node per reconnect | **Deliberately not fixed — named instead.** M1/03 states the limit and why the machinery is not worth it here; recorded as a named limit in `decision-log.md` D9. No host page in this guide relocates the tag |
| 2026-08-14 | M1 step 05, the `vite.config.ts` it dictates — surfacing at M1 steps 06 and 07 | The config as given is complete, and "everything else in the config stays at its default", with `rollupOptions.external` named as the one thing not to add | **The bundle it produces throws on the demo page**: `Uncaught ReferenceError: process is not defined`, before `customElements.define` runs — so the tag is never registered, `shadowRoot` is `null`, and M1 cannot be completed. **Vite's library mode deliberately does not substitute `process.env.NODE_ENV`**, leaving it for the consuming bundler; React reads it at module scope, and this guide's consumer is a static page with no bundler and no `process`. The tell was in step 05's own gate: the broken build is ~770 kB against ~260 kB, because both of React's branches survive | `define: { 'process.env.NODE_ENV': JSON.stringify('production') }` added to the config, with a callout explaining why a library build differs from an application build and why the symptom lands one step later. The size expectation in step 05's gate now names both numbers; *If it breaks* entries added at steps 05 and 06 and a troubleshooting row at the verify; `stack.md`'s Vite row records the behaviour with its doc link. Both copies of the config in the verify files updated |
| 2026-08-14 | M1 step 01 *Done when* · M1 step 02 *Done when* | The stock page shows "a heading reading `Vite + React`, and a button whose label is `count is 0`"; `ls src` lists five files **including `vite-env.d.ts`** | On `create-vite` **9.1.2** — which is what the guide's own `npm create vite@latest` resolves to — the heading reads **`Get started`**, the button reads **`Count is 0`**, and no `vite-env.d.ts` is written at all. Nothing is broken; but this is the reader's first gate, before they can tell which mismatches matter, and it teaches them that the guide's exact values are approximate | Both gates rewritten to read what is stable — the counter responding to a click, and the template's page being gone after step 02 — and to say explicitly that an unpinned scaffold's copy moves between releases. The `vite-env.d.ts` line now covers both cases |
| 2026-08-14 | M2 step 03, one sentence · `README.md` stack summary · M5/01 action 6 anchor | «because **the reader's** eye compares them» · "no service to install" · "replacing the three lines that compute…" | Third person for the guide-follower; a front-door claim contradicted by a static server every gate needs; an anchor naming three lines over a region of four | All three corrected: "your eye"; the README now says nothing to install permanently beyond Node and names the server that must be *running*; the anchor names its first and last line |

## Session log

| Date | What happened |
|------|---------------|
| 2026-08-14 | Guide planned from a full Phase 0 interview, with the product seeded from the sibling Angular fixture and the stack re-verified online from scratch against React 19 / Vite 8 / Node 24. Advise-back delivered and answered "continue": no suggested feature folded in, every risk accepted — both recorded as assumptions in D9 |
| 2026-08-14 | Scaffolded from `PLAN.md` — skeleton, six foundation docs, five placeholder milestone maps. One plan correction made here and logged in the drift log above |
| 2026-08-14 | `/audit-guide` over the whole guide: **FAIL** — 3 BLOCKERs, 8 WARNINGs. Two BLOCKERs were one cause (a declaration introduced before its first caller, against a template that pins `noUnusedLocals`); the third was two publish paths reading different sources, so the `change` event could disagree with the last `input` |
| 2026-08-14 | `/report-issue` on that report: all 11 findings resolved, six drift rows recorded, all five milestones set ⏳. M5 re-cut from 5 steps to 4 and the guide from 24 to 23. One finding (the tag being relocated in the DOM) was **deliberately not fixed** — it is named as a limit in M1/03 and D9 instead, because no host page in this guide exercises it. Nothing here has been executed, so every fix stays unconfirmed until someone runs `npm run build` |
| 2026-08-14 | Two further defects reported and fixed, both in M1 and both about the *toolchain* rather than the picker: a missing `define` that made the built bundle throw on the demo page, and a first gate quoting a scaffold's copy that has since changed. Two drift rows above. **Nothing was marked verified** — the findings came from running the steps against the CLI, no gate has been signed off, and every milestone stays ⏳ |
| 2026-08-14 | Drafted in one pass — five milestones, 24 steps, 5 verify gates. Three further plan corrections found while drafting: M1's encapsulation probe, M5's unhittable alpha gate, and two step cuts that could not end on a green build as proposed. All three are in the drift log. `HSL` added to the glossary, and `conventions.md`'s server command corrected — Vite's library mode emits no `index.html`, so the static server is pointed at the outer folder rather than at `dist/` |
