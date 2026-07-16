# Milestone 4 · Step 01 of 4 — Create the Ionic app
> Nav: — · [Overview](00_overview.md) · [HttpClient + environments →](02_http-and-environment.md)

## Glossary for this step
- **Ionic standalone starter** — the `angular-standalone` template scaffolds an Angular app that uses standalone
  components (no `NgModule`) with Ionic pre-wired. See [glossary](../foundation/glossary.md).
- **`ionic serve`** — Ionic's dev-server command: it runs the Angular dev server (with Ionic's tooling and
  live reload) and serves the app at `http://localhost:8100`. [Docs](https://ionicframework.com/docs/cli/commands/serve).

## Why / design
`ionic start` scaffolds the whole app: Angular (version 20.3 — [D5](../foundation/decision-log.md#d5--follow-the-ionic-scaffolds-angular-203--karma-not-a-forced-upgrade)),
the Ionic CSS, routing, a `HomePage`, and Karma/Jasmine tests. We use the **blank** template (one page) as the
smallest sensible starting point.

## Do this
1. **From the project root** (`todo-ionic-dotnet/`, the parent of `backend/`), run:
   ```bash
   ionic start frontend blank --type angular-standalone
   ```
   - `frontend` is the app (and folder) name — **load-bearing** in this guide's paths (`cd frontend`).
   - `blank` is the template (a single empty page). MANDATORY for this guide — `tabs`/`sidemenu` would add
     pages we don't want.
   - `--type angular-standalone` picks the standalone Angular template and skips the "Standalone or NgModule?"
     prompt.
2. **Answer any prompt** to create a free Ionic account with **No** (`N`). Nothing here needs one.
3. **Wait for `npm install` to finish**, then enter the app and confirm it runs:
   ```bash
   cd frontend
   ionic serve
   ```
   Your browser opens `http://localhost:8100` showing a page titled **Blank** with the text "Ready to create
   an app?". Stop the server with Ctrl+C.

## Done when (this step)
- [ ] `frontend/` exists next to `backend/`, containing `angular.json`, `package.json`, and `src/`.
- [ ] `ionic serve` shows the Blank page at `http://localhost:8100`.
- [ ] `frontend/package.json` shows `@angular/core` — expect **`20.3.x`** (the version this guide was written
      against, [D5](../foundation/decision-log.md#d5--follow-the-ionic-scaffolds-angular-203--karma-not-a-forced-upgrade)).
      If the scaffold pulled a different version, that's fine **as long as it builds and `ionic serve` runs** —
      just note the drift in [status.md](../foundation/status.md), since later steps assume 20.3 idioms.

## If it breaks
- **`ionic serve` opens port `4200`** — that's Angular's default; you ran `ng serve`, not `ionic serve`. Use
  `ionic serve` for port 8100 (the port our CORS + proxy assume).
- **Port 8100 already in use** — another `ionic serve` is running; stop it, or run `ionic serve --port 8101`
  and update the CORS origin in [M2 step 03](../MILESTONE_2_backend-crud-cors/03_cors.md) to match.
- **`ionic: command not found`** — the CLI isn't installed; see [M0 step 01](../MILESTONE_0_workspace/01_prerequisites.md).

---
> Nav: — · [Overview](00_overview.md) · [HttpClient + environments →](02_http-and-environment.md)
