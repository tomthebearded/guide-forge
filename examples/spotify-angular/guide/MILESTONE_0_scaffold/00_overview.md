# Milestone 0 — Scaffold & tooling
> Setup · milestone 0 of 12 · prev: — · next: [Spotify login (PKCE)](../MILESTONE_1_spotify-auth-pkce/00_overview.md)

## Goal
Stand up a **Material-3-themed, zoneless Angular 21 app shell** that serves on
`http://127.0.0.1:4200`. By the end you can run `npm start`, see a themed header + a routed placeholder
page in the custom dark "Deep Space Teal" palette, click a button whose counter repaints live (proving
zoneless change detection works with **no `zone.js`** in the build), and pass the tooling gate
(`format:check` / `lint` / `build` all clean). You will also register a Spotify app and drop its Client ID
into a gitignored file — so M1 can start the login flow immediately.

## Scope discipline
This milestone builds the **shell only**. It deliberately does **not**:
- do any auth logic, PKCE, token handling, or the real "Log in with Spotify" behavior — that is **M1**
  (the `login` page and its button are inert placeholders here; the `callback` route + `authGuard` arrive in M1).
- add HTTP interceptors (auth or rate-limit) — `provideHttpClient()` is wired with **no** interceptors yet;
  they arrive in **M1** (auth) and **M2** (rate-limit).
- add `three` / `three-globe` or render any globe — that is **M4** (the `globe` page is an inert placeholder).
- add the Spotify/Wikidata/MusicBrainz/REST-Countries config blocks or rate-limit tuning to `environment.ts` —
  those grow in **M1**/**M2**/**M5**.
- add stores, DTOs, mappers, caches, or the boot-sync — the `core/ features/ shared/` folders are created
  **empty** (placeholder `.gitkeep` files) and fill up from M1 onward.

If a step here reaches for any of the above, stop — it belongs to a later milestone.

## Prerequisite
None — this is the first milestone. You need **Node 24 LTS** (or ≥ 22.12) and **npm 11** installed, and a
free Spotify account. Everything else is created here.

## Steps at a glance

**Sitting 1 — Create & configure the project (01–05)**
1. [Verify your toolchain](01_prerequisites.md) — confirm Node/npm versions before scaffolding.
2. [Scaffold the Angular 21 zoneless project](02_scaffold-project.md) — `npx @angular/cli@21 new spotify-angular`.
3. [Tighten the TypeScript strictness](03_strict-ts.md) — add `noUncheckedIndexedAccess` + `noPropertyAccessFromIndexSignature`.
4. [Prettier, ESLint & npm scripts](04_prettier-eslint.md) — formatting + lint gate + `format`/`lint` scripts.
5. [Create the feature-first folder tree](05_folder-tree.md) — `core/ features/ shared/` with `.gitkeep`.

**Sitting 2 — Theme, shell & routing (06–12)**
6. [Add Angular Material](06_add-material.md) — `ng add @angular/material` + the index.html fonts.
7. [Generate the "Deep Space Teal" palette](07_theme-color.md) — Material 3 custom theme + `styles.scss` tokens.
8. [Wire the app providers](08_app-config.md) — zoneless CD, router, HTTP (no interceptors yet), animations.
9. [The environment + client-id pattern](09_environments.md) — `environment*.ts` + gitignored `spotify-client-id.ts`.
10. [Placeholder login & globe pages](10_placeholder-pages.md) — the two routed components (with a signal demo).
11. [The M0 route skeleton](11_routes.md) — `''→globe`, `login`, `globe`, `**→globe`.
12. [The app shell + header](12_shell.md) — `app.ts/.html/.scss` = header + `<router-outlet>`.

**Sitting 3 — Spotify app registration & verify (13–15)**
13. [Register a Spotify app](13_spotify-dashboard.md) — dashboard, `127.0.0.1` redirect, Dev-Mode 25-user cap.
14. [Write the README](14_readme.md) — the registration + run steps, for the next reader (and future you).
15. [Verify the milestone](15_verify.md) — run the full Done-when gate; file checkpoint.

## Design / decisions folded in
- **Zoneless change detection.** The whole app runs with `provideZonelessChangeDetection()` and **no
  `zone.js`** — change detection is driven by [signals](../foundation/glossary.md#signal), not monkey-patched
  async. Taught in steps 02 (scaffold flag), 08 (provider), 10 (the signal repaint demo). See
  [conventions.md](../foundation/conventions.md) and [glossary.md](../foundation/glossary.md#zoneless).
- **Material 3 custom theming.** A generated tonal palette (`ng generate @angular/material:theme-color`) plus
  `mat.theme()` in `styles.scss`, locked to the dark scheme. Taught in steps 06–07.
- **Suffix-less, feature-first house style.** `globe-page.ts → class GlobePage`, `OnPush` always, signal IO,
  separate `.html`/`.scss`, `inject()` for DI — the rules live in
  [conventions.md](../foundation/conventions.md) and every component here obeys them.
- **The `spotify-client-id.ts` pattern.** The Client ID is a *public* PKCE id, but the source project keeps it
  out of git behind a gitignored file copied from a checked-in `.example`. Taught in step 09; the ID is filled
  in step 13.
- **Pinned versions for source fidelity.** Angular/Material **21.2**, TS **~5.9**, Node **24** — pinned in
  [stack.md](../foundation/stack.md); Angular 22 exists but we pin 21 (see
  [decision-log R1](../foundation/decision-log.md#r1--pin-angular-212-not-22)). `three`/`three-globe` are **not**
  installed until M4.

## Done-when gate
- [ ] `node -v` → `v24.x.x` (or ≥ `v22.12`); `npm -v` → `11.x.x`.
- [ ] `npm run format:check` → `All matched files use Prettier code style!` (exit 0).
- [ ] `npm run lint` → `All files pass linting.` (exit 0).
- [ ] `npm run build` → ends with `Application bundle generation complete.` and no errors.
- [ ] Searching the build output for zone.js finds nothing (macOS/Linux/Git Bash: `grep -ri "zone.js" dist/`;
      PowerShell: `Get-ChildItem dist -Recurse -File | Select-String "zone.js"`) — both print nothing, and
      `zone.js` is **not** in `package.json`.
- [ ] `npm start` serves on `http://127.0.0.1:4200`; the page shows the `Spotify Trip` header and the **Globe**
      placeholder on a dark navy background, with a `Clicked 0 times` button rendered in the pastel-mint primary color.
- [ ] Clicking that button repaints the label to `Clicked 1 times`, `Clicked 2 times`, … live — proving
      signal-driven change detection works without `zone.js`.
- [ ] Navigating to `http://127.0.0.1:4200/login` shows the **Log in with Spotify** placeholder; a bad path
      like `/nope` redirects to `/globe`.

## Handoff
### Recap
You scaffolded a zoneless Angular 21 project, tightened its TypeScript + Prettier + ESLint tooling, applied a
custom Material 3 dark palette, wired a minimal provider set and route skeleton, built a header + two
placeholder pages, and registered a Spotify app whose Client ID now lives in a gitignored file. The shell
serves, themes, and reacts to signals — nothing else does anything yet, by design.

### Done so far (cumulative)
- A running Angular 21 **zoneless** SPA shell on `http://127.0.0.1:4200`.
- Custom Material 3 dark **"Deep Space Teal"** theme applied app-wide.
- Tooling gate green: `format:check`, `lint`, `build`.
- Route skeleton: `/globe` (default), `/login`, wildcard → `/globe`.
- The `spotify-client-id.ts` pattern in place with a real Client ID; a registered Spotify app allowlisting your account.

### Artifacts now in the project
- Config: `package.json`, `angular.json`, `tsconfig.json`, `tsconfig.app.json`, `eslint.config.js`,
  `.prettierrc`, `.editorconfig`, `.gitignore`, `README.md`.
- Entry: `src/main.ts`, `src/index.html`, `src/styles.scss`, `src/styles/_theme-colors.scss`.
- Shell: `src/app/app.ts`, `app.html`, `app.scss`, `app.config.ts`, `app.routes.ts`.
- Shared: `src/app/shared/components/header/header.ts` (+ `.html`/`.scss`).
- Features: `src/app/features/auth/login-page/login-page.ts` (+ `.html`/`.scss`),
  `src/app/features/globe/globe-page/globe-page.ts` (+ `.html`/`.scss`).
- Environments: `src/environments/environment.ts`, `environment.development.ts`,
  `spotify-client-id.example.ts`, `spotify-client-id.ts` (gitignored).
- Empty placeholder folders under `core/`, `features/`, `shared/` (with `.gitkeep`).

### Decisions / open issues
- The `login`/`globe` pages are inert; the `callback` route, `authGuard`, and real login land in **M1**.
- `provideHttpClient()` has **no** interceptors yet — added in M1 (auth) / M2 (rate-limit).
- `environment.ts` holds only `production` + `spotify.clientId`/`redirectUri`; the scopes, auth URLs, and
  rate-limit blocks grow in M1/M2/M5.
- Spotify apps start in **Development Mode** — capped at **25 manually-allowlisted users**. Add your own
  account (step 13) or login will fail in M1. (See [decision-log R3](../foundation/decision-log.md#r3--teach-the-rate-limit-mechanism-document-dev-mode-limits-up-front).)

### Next milestone
**[M1 — Spotify login (PKCE)](../MILESTONE_1_spotify-auth-pkce/00_overview.md):** click "Log in with Spotify",
authorize, and land back logged-in on a protected `/globe`. Done-when: a full PKCE round-trip stores a token
in `localStorage`, `/globe` is reachable only when authed, and logout clears it and redirects to `/login`.

---
> Setup · milestone 0 of 12 · prev: — · next: [Spotify login (PKCE)](../MILESTONE_1_spotify-auth-pkce/00_overview.md)
