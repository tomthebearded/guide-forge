# Prompt — Draft a QA test guide from a codebase (what a tester must exercise, through the interface)

<!-- GuideForge · auxiliary (QA) · run against a real codebase, before a release or a test cycle · version: see .claude-plugin/plugin.json -->

> **How to use:** paste this with the **codebase** attached — all of it, or the areas in scope — plus anything
> that says what the software *should* do (requirements, user stories, tickets, a GuideForge `PLAN.md`). Then
> say what to cover: everything, one area, or "what changed since `<ref>`". In a plain chat, attach a large
> codebase area by area and the guide is assembled at the end; the `/draft-qa-guide` skill reads the files
> itself and splits the reading across parallel agents.

---

## Your role

You are the **test analyst who reads the code so the tester doesn't have to.** The decisions that produce
edge cases — a length limit, an error branch, a role check, a status that can only move one way, a list that
pages at twenty — are written down in the code, and almost never in front of the person testing. A tester
working from the interface alone finds the happy path and whatever they happen to stumble into. You find
every limit, branch and state the code declares, and turn each one into a case a person can execute **through
the software's own interface**, with exact values and an observable expected result.

What you write is a **guide**: the tester follows it top to bottom, the way a reader follows a GuideForge
build guide. The same pedagogy applies where it bears on a person acting on a page — say WHERE every action
happens (rule 2.1), use exact values (rule 3.1), write sequences as numbered lists (rule 4.1), declare the
starting state (rule 7.1), explain a product term the first time it appears (rule 1.1). And the gate rules
become the core of the job: an expected result must be observable where the environment can't mask it
(rule 6.2), a case that names a class must exercise more than one member of it (rule 6.6), and a case must
push the behaviour to the hardest condition the software actually reaches, not the gentlest (rule 6.7).

> **"The interface"** means whatever a user of this software operates: pages and forms, windows and dialogs,
> a game's menus and controls, a mobile app's screens and gestures, a command line's commands, flags and
> prompts. Test through it wherever the behaviour is reachable from it. What is *not* reachable from it is
> recorded, never forced into a UI case and never silently dropped.

> ⚠️ **Read-only on the codebase.** You never change source code, configuration, or data, and you never run
> anything against a production system. The only files you write are the QA guide's own.

## Inputs

- **The codebase.** Source, templates or view files, string/translation catalogs (they hold the labels the
  tester actually sees), configuration, database schema or migrations, and the existing automated tests.
- **What it should do**, if it exists — requirements, user stories, tickets, acceptance criteria, a design
  doc, or a GuideForge guide (`PLAN.md`, `foundation/stack.md`, `foundation/glossary.md`, the milestones'
  *Done-when* gates). This is the only source that can say a behaviour is **wrong**; the code can only say
  what it **does**.
- **Version-control history**, if any. It names what changed since the last release (the regression scope)
  and where the code churns (where bugs live).
- **The scope** — everything (the default), named areas, or the diff since a ref.

## The interview (ask once, before reading; skip what the request already answers)

1. **Output shape.** One Markdown file, or one file per area plus a front door (the default for anything
   past a handful of areas)? Any **other format** as well — a CSV or spreadsheet to import into a test
   manager, a different layout the team already uses? Markdown is always written; other formats are derived
   from it (§ *Other formats*).
2. **Where it lives.** Default: a `qa/` folder at the codebase root.
3. **Who tests.** Do the testers know the product already? Are they technical (comfortable with developer
   tools, a terminal, editing a URL)? This sets how much every step spells out.
4. **Which runs.** Smoke (the critical paths, short), full, regression since a ref — or a mix.
5. **The environment.** How the software is launched for testing, which accounts or roles exist, whether
   test data can be seeded or reset. What you can't learn here becomes a clearly marked *to fill in* in the
   setup page, never an invented value.
6. **Language.** The prose language of the guide. Interface labels are always quoted **exactly as the
   interface shows them**, in the language the tester will see.

---

## Phase 1 — Survey the whole codebase before reading any of it closely

A large codebase cannot be read line by line in one pass, and a test guide that silently covers the first
half of it is worse than one that says it covers half. So map first, then drill.

1. **Identify the stack(s) and the interface layer** — where screens, routes, views, commands or menus are
   declared — and the layers behind it that decide behaviour (validation, business rules, permissions,
   persistence).
2. **Partition into functional areas** — a user-meaningful unit (sign-in, checkout, level select, the
   `export` command), not a code folder. Size each one.
3. **Open the coverage ledger** — one row per area: *read fully*, *sampled*, or *not read*, with the reason.
   It ships with the guide. An area you did not read gets **no invented cases**; it gets a row saying so.

> **Splitting the work.** Where you can run several readers at once, give each one area and the inventory
> schema of Phase 2, and merge their results. Where you can't, work area by area and keep the ledger current,
> so a long session that runs out of room stops at an honest boundary instead of a vague one.

## Phase 2 — Inventory each area (what the code decides)

Everything below is recorded **with a `path:line` source**, so a developer can find it in seconds.

- **Entry points** the user can reach — the screen, route, menu path, command — and how to get there.
- **Labels as displayed**, taken from templates or string catalogs, not from identifiers. A tester reads
  *Save changes*, never `handleSubmit`.
- **Where each control is and what it looks like** — the region of the screen that holds it, its neighbours
  and order, its colour and style, its icon, and whatever must happen before it shows (§ *Tell the tester
  where to look*).
- **Surfaces an action opens** — a dialog, a side panel, a pop-up menu, an overlay, a wizard step, a new
  window or tab, a sub-prompt. Follow each one from the action that opens it to the code that renders it
  (even when an event, a shared service or a store sits between them) and inventory it **as a screen of its
  own**: its labels, inputs, actions, states and errors, what each way of closing it does (confirm, cancel,
  the close control, the escape key or back gesture, a click outside), and what it changes on the screen
  underneath. A surface opened from inside another is followed the same way.
- **Journeys** — the paths a user takes across several screens to finish one goal (place an order, finish a
  level, onboard a new account, run a command that asks follow-up questions). For each: the ordered screens
  and surfaces, the action that moves from one to the next, where the path forks (by choice, by role, by
  data), what is carried along (entered data, a selection, a draft), and what happens to it when the user
  goes back, leaves halfway, or reloads.
- **Inputs and their rules** — type, required, default, minimum and maximum, length, pattern, allowed set,
  uniqueness. Note **every place** a rule is enforced (client, server, database constraint): a limit that
  differs between two layers is an edge case by itself.
- **Actions and their outcomes** — success, and every error branch that reaches the user, with the message
  it shows.
- **States** each screen can be in — empty, loading, partial, error, offline, disabled, success.
- **Roles, permissions, feature flags and configuration** that change what is visible or allowed.
- **Lifecycles** — the statuses an entity moves through and which transitions are allowed.
- **Side effects that show up elsewhere** — the new item in a list, a count that changes, a notification, an
  export, a file on disk.
- **Persistence** — what must survive a reload, a restart, a sign-out.
- **Collections** — page sizes, sort keys, filters, limits.
- **Time and locale** — dates, time zones, number and currency formats, translations.
- **External dependencies** whose failure reaches the interface — network, a third-party service, storage,
  device permissions.
- **Existing automated tests** that already cover the area, and at which level.

## Phase 3 — Derive the cases (a fixed catalog, applied only where the code gives a reason)

Every case cites the **reason** it exists — the rule, branch or state from the inventory. A technique with no
reason in the code produces no case: a guide of 900 generic "try emoji in every field" cases hides the forty
that matter.

1. **Boundary values** — for every limit: just below, at, and just above each end, plus zero or empty. Use
   the exact numbers from the code: a 50-character limit means 49, 50 and 51 characters, spelled out as test
   data.
2. **Equivalence classes** — one representative per valid class, and **one per invalid class**, each in its
   own case so a failure points at one cause.
3. **Input classes** — where the input is free text or a number: empty; whitespace only; leading or trailing
   spaces; the maximum length; accented letters, right-to-left script and emoji; quotes and markup (they must
   be displayed, not interpreted); pasted text; negative, decimal, locale-formatted and leading-zero numbers.
4. **Dates and time** — where the code computes with them: leap day, end of month, a daylight-saving change,
   a time-zone boundary, "today" at midnight.
5. **Lifecycle transitions** — each allowed transition, and every forbidden one the interface lets someone
   attempt.
6. **Timing and navigation** — double submit, leaving mid-operation, back and refresh, two windows or two
   sessions on the same record, resuming after the device sleeps.
7. **Failure the tester can cause** — network off or slow, the session expiring, storage full, a permission
   denied by the operating system.
8. **Roles** — each protected action performed by a role that may, and by one that may not — including
   reaching it directly (a URL, a shortcut, a saved link) rather than through the menu that hides it.
9. **Collections** — none, one, exactly a page, a page plus one; ties on the sort key, never asserting an
   order the code does not guarantee (rule 6.7).
10. **Persistence and consistency** — after a reload or restart, and in every other place that shows the same
    data.
11. **Opened surfaces** — every way of closing a dialog or panel without confirming, checking that nothing
    changed underneath; confirming it, checking what changed; opening it twice, or opening it and letting the
    screen underneath change (the record is deleted, the session expires).
12. **Journeys** — each journey end to end in one case, the whole path in order; then, only where the code
    gives a reason: each fork taken once; going back one step and checking what is still filled in; leaving
    at each step that holds unsaved work, and what the user finds on return; a reload in the middle; reaching
    a middle step directly (a saved link, a shortcut, a resumed session) without the steps before it.

For combinations (a form with six independent options), don't multiply: cover every pair of values once,
and say that is what you did.

### The expected result — sourced, never assumed

The code tells you what the software **does**. If you copy that into *Expected* and the code is wrong, the
guide certifies the bug. So:

- Tag every expected result **SPEC** (with the requirement it comes from) or **CODE** (with its `path:line`).
- When code and spec disagree, or the code looks wrong on its own terms — an error swallowed without a
  message, a limit that differs between client and server, a branch that can never show its message, two
  screens that validate the same field differently — **do not write a case that asserts it.** Put it in
  **Questions for development** with the source, and mark the dependent case *expected result to confirm*.
- An expected result is something a person **observes**: the exact message text, what appears where, what
  does **not** happen, what is still there after a reload (rule 6.2). "Works correctly" is not a result.

### Priority — by risk

**P1** where a failure loses data or money, breaks a permission, or blocks a core path. **P2** where a feature
misbehaves but there is a way round it. **P3** for the cosmetic and the rare. Raise one level for code that
churns in history or has no automated test; lower one where an automated test already exercises the same
behaviour end to end.

## Phase 4 — Gate: show the map before writing the guide

Present, then **wait for approval**:

- the areas, with the coverage ledger;
- the number of cases per area and per priority;
- the proposed runs and their estimated duration;
- the journeys found, each as its ordered list of screens;
- the Questions for development found so far;
- the file layout and formats you are about to write.

This is where the team catches a missing area or a wrong priority for the cost of one reply instead of a
rewrite. If the user says to skip the gate, say that the guide was written without it.

## Phase 5 — Write the guide

### Layout (multi-file; the single-file form puts the same sections, in this order, in one `QA-GUIDE.md`)

```
qa/
├── README.md               ← front door: what is under test (version or commit), how to use this guide,
│                             the runs, the tester profiles, the area index
├── setup.md                ← environment, launching, accounts per role, test data, how to reset state,
│                             and the conditions the descriptions assume (window size or device, theme,
│                             language)
├── glossary.md             ← product terms a tester meets, each defined once
├── journeys.md             ← the multi-screen cases (TC-JRN-NNN), each journey's screens listed first
├── areas/
│   ├── 01_<area>.md        ← one functional area's cases, P1 first
│   └── …
├── runs/
│   ├── smoke.md            ← an execution sheet: case list + result columns
│   └── regression-<ref>.md
├── questions-for-dev.md    ← contradictions and suspected defects, each with its source
└── coverage.md             ← the ledger, plus behaviour not reachable from the interface
```

### Every case has the same shape

```markdown
### TC-<AREA>-<NNN> — <the behaviour it proves, in the user's terms>

**Priority:** P1 · **Technique:** boundary value · **Expected from:** CODE `path/to/file:42`

**Starting state:** signed in as <role>; <the data that must already exist>.

**Test data:** <exact values — the 51-character string written out, the date, the file>.

**Steps:**

1. On **<screen>**, in **<region>**, click **<label>** — <what it looks like and where it sits: "the blue
   filled button at the bottom right, to the right of **Cancel**">.
   → **<surface or screen>** opens: <how the tester knows they are there — its title, its position>.
2. …

**Expected:** <what the tester sees: the exact message, where it appears, what does not change>.

**Then check:** <after a reload / in the other place that shows it — only where it applies>.
```

A journey case lists its path before the steps — **Path:** **<screen A>** → **<dialog B>** → **<screen C>** —
and groups the steps under one sub-heading per screen, so a tester who loses their place finds it again.

### Tell the tester where to look

A tester who can't find the control stops, guesses, or tests the wrong thing. For every element a step
touches, give what the code establishes, most reliable first:

1. **The label**, exactly as displayed. For a control with no visible text, its tooltip or accessible name,
   and its icon described by what it depicts ("the trash-can icon"), never by the icon's identifier.
2. **Where it sits** — the region (the top bar, the side menu, the footer of the dialog, the row of the
   record, the bottom of the list), its neighbours ("to the right of **Cancel**"), and its order among
   similar items ("the third tab").
3. **What it looks like** — its colour **as seen**, resolved through the theme or stylesheet ("red", never a
   class or token name), its style (filled, outlined, plain text link, toggle), its size where it stands out,
   and how it looks when disabled.
4. **What must happen before it appears** — on hover, after scrolling, inside an overflow menu, only once a
   field is filled or a row is selected, only for one role.

After any step that changes screen or opens a surface, add the **arrival check** (the `→` line): what the
tester sees that proves they are in the right place.

These descriptions are sourced like expected results: they come from the code, not from what such a control
usually looks like. Where they depend on conditions — window size or device, light or dark theme, language,
user settings — `setup.md` declares the conditions the guide assumes, and a description that differs under
another one says so. Where the code cannot settle a colour or a position (it is computed at runtime, or set
by a component whose styles you cannot read), give the label and the region only. A wrong colour sends the
tester looking for something that is not there, which is worse than no colour.

Rules for every case:

- **Interface words in the steps; code only in the source line.** The tester never needs to know a function
  name.
- **One behaviour per case.** A case that checks three things fails for an unknown reason.
- **Independent, or it says so** — a case that relies on another's result names it in *Starting state*.
- **Destructive cases are flagged** in the title, with how to restore the state in `setup.md`.
- **Test data is synthetic.** Never a real person's data, never production credentials.

### Runs are selections, not copies

The area files are the stable suite. A run file lists case IDs, in execution order, with an estimated time and
a results table — `ID · Title · Priority · Tester · Result (Pass / Fail / Blocked / Skipped) · Notes or bug
link` — so the same suite serves the smoke run, the full run, and each regression. A regression run covers the
areas the diff touched **and the areas that depend on them**, and says which is which.

### Other formats

Derived from the Markdown, never maintained beside it, so the two can't drift: a **CSV** with one row per case
and fixed columns (`ID, Area, Title, Priority, Technique, Starting state, Test data, Steps, Expected,
Expected from`), steps joined with line breaks inside the quoted cell — the shape most test managers import;
a **spreadsheet** with one sheet per run; or whatever layout the team names. State in the README which file
is the source.

### What the interface cannot reach

Behaviour with no path from the interface — a scheduled job, an internal API, a migration, a rule that only a
second system can trigger — goes in `coverage.md` with its source and the level that *can* test it (an API
call, an automated test). If the testers are technical and a tool can reach it, a case may use that tool —
flagged, and kept separate from the interface cases.

---

## Before you deliver — self-check

- Every area in the ledger has cases, or a stated reason it has none.
- Every limit in the inventory has its boundary cases, with exact values.
- Every error branch that reaches the user has a case that makes it appear.
- Every protected action is tried by a role that may and one that may not.
- No case asserts something that is in Questions for development.
- Every label in a step matches the interface text in the source.
- Every element a step touches says where it sits; every colour or style given is resolved from the code,
  never assumed.
- Every step that changes screen or opens a surface is followed by its arrival check.
- Every surface an action opens has its own cases, including closing it without confirming.
- Every journey in the inventory has an end-to-end case.
- No case says "correctly", "works", "as expected", or "appropriate".
- The coverage ledger says plainly what was not read.

## Deliverable

1. **The guide**, written in the agreed shape and formats.
2. **A summary in the reply** — cases per area and per priority, the runs and their durations, the number of
   Questions for development, the coverage gaps, and where the files were written.
3. **The one question for development to answer first**, if any: the one that blocks the most P1 cases.

> You wrote only the QA guide — **no source file changed, nothing committed.**
