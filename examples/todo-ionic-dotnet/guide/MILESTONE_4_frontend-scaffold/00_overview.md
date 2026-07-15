# Milestone 4 — Frontend scaffold
> Frontend · milestone 5 of 9 · prev: [M3 Backend tests](../MILESTONE_3_backend-tests/00_overview.md) · next: [M5 Frontend read path](../MILESTONE_5_frontend-read/00_overview.md)

## Goal
A standalone Ionic-Angular app that runs at `http://localhost:8100`, has `HttpClient` available, reads its API
base URL from an environment file, and proxies `/api` to the backend at `:5080`. The shell is ready to build
the todo UI into.

## Scope discipline
Scaffold and wiring only — **no todo UI, model, or service yet** (that's [M5](../MILESTONE_5_frontend-read/00_overview.md)).
No tests yet ([M7](../MILESTONE_7_frontend-tests/00_overview.md)). We do not upgrade Angular past what the
Ionic starter produces ([decision D5](../foundation/decision-log.md#d5--follow-the-ionic-scaffolds-angular-203--karma-not-a-forced-upgrade)).

## Prerequisite
[M0](../MILESTONE_0_workspace/00_overview.md) (Ionic CLI installed) and a running backend from
[M2](../MILESTONE_2_backend-crud-cors/00_overview.md) to test the proxy against.

## Steps at a glance
**Sitting 1 — create + wire (01–03)**
1. [Create the Ionic app](01_ionic-start.md)
2. [Add `HttpClient` + generate environments](02_http-and-environment.md)
3. [Add the dev proxy to the backend](03_proxy.md)

**Sitting 2 — checkpoint (04)**
4. [Verify the milestone](04_verify.md)

## Design / decisions folded in
- **Standalone components** from `@ionic/angular/standalone` — [decision D3](../foundation/decision-log.md#d3--standalone-ionic-components-over-ionicmodule).
- **Angular 20.3 as scaffolded** — [decision D5](../foundation/decision-log.md#d5--follow-the-ionic-scaffolds-angular-203--karma-not-a-forced-upgrade).
- **Dev proxy `/api` → `:5080`** so the browser sees one origin — [decision D4](../foundation/decision-log.md#d4--dev-proxy-on-the-frontend-instead-of-relying-on-cors).

## Done-when gate
- [ ] `ionic serve` (from `frontend/`) opens `http://localhost:8100` showing the default Ionic "Blank" page with no console errors.
- [ ] With the backend also running, `curl http://localhost:8100/api/todos` returns the seeded todos — proving the proxy forwards to `:5080`.

## Handoff
### Recap
Created the Ionic app, made `HttpClient` injectable, added an environment file for the API base, and proxied
`/api` to the backend.
### Done so far (cumulative)
- Backend complete (M0–M3). **Now** a running Ionic shell wired for HTTP + proxy.
### Artifacts now in the project
- `frontend/` (the whole Ionic app, from `ionic start`)
- `frontend/src/main.ts` (edited: `provideHttpClient` added)
- `frontend/src/environments/environment.ts` + `environment.development.ts` (new, via `ng generate environments`)
- `frontend/src/proxy.conf.json` (new)
- `frontend/angular.json` (edited: `proxyConfig` on the serve target (step 03), **and** a `fileReplacements` block on the build target's `development` config, added by `ng generate environments` in step 02)
### Decisions / open issues
- The stale `home.page.spec.ts` shipped by the scaffold still tests the "Blank" page; we'll replace it in M7.
### Next milestone
[M5 — Frontend read path](../MILESTONE_5_frontend-read/00_overview.md): fetch and render real todos. Done-when:
the home page lists the live todos from the backend.
