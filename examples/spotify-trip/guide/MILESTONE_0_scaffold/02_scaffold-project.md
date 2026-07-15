# M0 · Step 02 of 15 — Scaffold the Angular 21 zoneless project
> Nav: [← Verify your toolchain](01_prerequisites.md) · [Overview](00_overview.md) · [Tighten TypeScript →](03_strict-ts.md)

## Glossary for this step
> **zoneless** — running Angular without `zone.js`; change detection is driven by [signals](../foundation/glossary.md#signal) instead of monkey-patched async callbacks. See [glossary](../foundation/glossary.md#zoneless).
> **standalone component** — a component that declares its own `imports` (no `NgModule`); the default in modern Angular. See [glossary](../foundation/glossary.md#standalone-component).

## Why / design
This one command generates the entire base project — `package.json`, `angular.json`, `tsconfig*.json`,
`src/main.ts`, the `App` root component, `app.config.ts`, and `app.routes.ts`. We pin the CLI to **21** with
`@angular/cli@21`; a bare `ng new` today would pull Angular **22** and drift from this guide
([decision R1](../foundation/decision-log.md#r1--pin-angular-212-not-22)). We answer the zoneless prompt
**Yes**, which is what keeps `zone.js` out of the polyfills and puts `provideZonelessChangeDetection()` in the
config for us.

> 📚 New concept — zoneless change detection: classic Angular ships `zone.js`, which patches every async
> browser API so Angular knows "something might have changed" and re-checks the whole component tree. Zoneless
> drops that: Angular only re-renders when a **signal** it read in a template changes. Less magic, far less
> overhead — the reason this data-heavy globe app can afford a 60 fps render loop. Docs:
> [angular.dev/guide/zoneless](https://angular.dev/guide/zoneless).

## Do this
1. From the parent folder you `cd`-ed into, run the scaffold command. The project name **`spotify-trip`** is
   **load-bearing** — it becomes the folder name, the `package.json` `name`, and the project key in
   `angular.json`. (The source project is named `earthviewmusic`; we use `spotify-trip` as the teaching name.)
   ```bash
   npx @angular/cli@21 new spotify-trip --style=scss --ssr=false
   ```
   - `--style=scss` — use SCSS for all styles (**mandatory**: the theme + every component `.scss` assumes it).
   - `--ssr=false` — this is a browser-only SPA; no server-side rendering (**mandatory** for this guide).
2. Answer the interactive prompts:
   - **"Do you want to enable Zoneless…?"** → **Yes**. (This is the whole point — it wires
     `provideZonelessChangeDetection()` and leaves `zone.js` out.)
   - **"Would you like to share pseudonymous usage data…?"** → **No** (free choice; `No` keeps it quiet).
   - Any other prompt → accept the default.
3. Enter the project: `cd spotify-trip`.
4. Confirm it runs before you change anything: `npm start`, then open `http://127.0.0.1:4200`. You should see
   the default Angular welcome page. Stop the server with `Ctrl+C` when satisfied.

> **Why `npm start` and not `ng serve`?** The `start` script the CLI generated already reads
> `ng serve --host 127.0.0.1 --port 4200` (we'll confirm/keep that in step 04). The `127.0.0.1` host is
> **load-bearing** — Spotify's PKCE redirect (M1) requires the loopback **IP**, not `localhost`.

## Done when (this step)
- [ ] A `spotify-trip/` folder exists containing `package.json`, `angular.json`, `src/main.ts`, and
      `src/app/app.ts`.
- [ ] `npm start` → terminal prints `Local: http://127.0.0.1:4200/` and the browser shows the Angular welcome page.
- [ ] `src/app/app.config.ts` contains `provideZonelessChangeDetection()` and `src/main.ts` has **no**
      `import 'zone.js'`.

## If it breaks
- **The prompt never asks about Zoneless**: your CLI resolved an older Angular. Re-run with the pinned CLI
  exactly: `npx @angular/cli@21 new …`. You can still fix it later in step 08 by adding the provider by hand.
- **`EACCES` / permission errors on `npx`**: you're likely inside another project or a protected folder — run
  from a plain user-owned directory.
- **Port 4200 already in use**: another dev server is running; stop it, or the serve will pick a different port
  (which then won't match Spotify's redirect — always serve on `127.0.0.1:4200`).
