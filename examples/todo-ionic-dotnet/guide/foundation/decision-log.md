# Decision log — Todo (Ionic + .NET)

> Why the guide is the way it is. Each entry: the decision, the reasoning, and what it rules out.

## D1 — EF Core InMemory as the store, but tests drive the real pipeline
- **Date:** 2026-07-10
- **Source:** the audience interview (reader asked for an in-memory DB) + the Phase 0.5 web check.
- **Decision:** the app's data store is the **EF Core InMemory provider** (database name `"todos"`), but the
  **backend test suite exercises the app through `WebApplicationFactory<Program>`** (real HTTP + routing +
  serialization) rather than treating InMemory as a database fake.
- **Why:** the reader explicitly wanted an in-memory DB, and InMemory is the simplest thing that gives a real
  `DbContext` and LINQ. But Microsoft **explicitly discourages InMemory for testing** — it has no relational
  constraints, transactions, or case-sensitivity, so tests can pass that would fail on a real DB
  (https://learn.microsoft.com/ef/core/testing/). Driving tests through the real HTTP pipeline sidesteps that
  trap while keeping the requested store.
- **Rules out / trade-off:** we don't get relational fidelity (constraints/transactions) anywhere; data
  resets on every restart. Tests are integration-style (slightly slower) rather than pure unit tests.
- **Revisit if:** the app needs real persistence or the reader wants constraint/transaction behavior — then
  swap to **SQLite in-memory** (Microsoft's recommended fake) or a file-backed SQLite/Postgres provider. The
  store is isolated behind `TodoDb`, so the swap is one line in `Program.cs`.

## D2 — Minimal APIs over controllers
- **Date:** 2026-07-10
- **Source:** the Phase 0.5 web check.
- **Decision:** build the API with **minimal APIs** (`MapGroup`/`MapGet`/`MapPost`), not MVC controllers.
- **Why:** for a small new API this is the shape Microsoft recommends ("For new projects, we recommend using
  Minimal APIs" — https://learn.microsoft.com/aspnet/core/fundamentals/apis). Less ceremony, `Program.cs`
  stays readable, and the Expert backend reader gets idiomatic .NET 10.
- **Rules out / trade-off:** no controller conventions (model binding attributes, filters-by-attribute); for a
  bigger API those conveniences might justify controllers.
- **Revisit if:** the API grows past a handful of endpoints and needs controller-level cross-cutting concerns.

## D3 — Standalone Ionic components over `IonicModule`
- **Date:** 2026-07-10
- **Source:** the Phase 0.5 web check + the audience model (Angular 20.3, per [D5](#d5--follow-the-ionic-scaffolds-angular-203--karma-not-a-forced-upgrade)).
- **Decision:** import each `Ion*` component from **`@ionic/angular/standalone`** and list it in the
  component's `imports`, rather than importing the whole `IonicModule`.
- **Why:** Angular 20.3 is standalone-by-default (since v19; no `NgModule`), and Ionic 8 supports standalone components.
  This matches the app's architecture, tree-shakes unused components, and avoids introducing a module just for
  Ionic (https://ionicframework.com/docs/angular/build-options).
- **Rules out / trade-off:** each page must explicitly import the `ion-*` components it uses (a little more
  boilerplate per file) and register icons with `addIcons`.
- **Revisit if:** migrating a legacy module-based Ionic app, where `IonicModule` is the compatible path.

## D5 — Follow the Ionic scaffold's Angular 20.3 + Karma, not a forced upgrade
- **Date:** 2026-07-10
- **Source:** the Phase 0.5 web check + a mid-draft verification against the live `ionic-team/starters` source.
- **Decision:** the frontend is built on **Angular 20.3 with Karma/Jasmine tests** — exactly what
  `ionic start ... --type angular-standalone` produces today — rather than upgrading to Angular 22 and
  switching to Vitest as originally planned.
- **Why:** the Ionic CLI's starter lags Angular's own `ng new`; running `ionic start` today yields Angular
  20.3, ionicons 7, TS 5.9, and a working Karma/Jasmine `ng test` out of the box. Reaching the plan's
  Angular 22 + Vitest would require a two-major `ng update` (fragile) plus switching the test target to
  Vitest, which Angular still labels **experimental** and which is undocumented for this exact Ionic setup.
  For an Intermediate-frontend reader who must succeed by following along, the robust, non-experimental,
  zero-migration path wins. GuideForge's "reality wins" rule: the guide matches what the tool actually does.
- **Rules out / trade-off:** not "latest Angular"; Karma is the legacy runner (Angular is moving to Vitest).
  Pedagogically this costs almost nothing here — 20.3 is standalone-by-default and has signals, so the app
  code is materially identical to what it'd be on 22.
- **Revisit if:** the Ionic starter updates to Angular 22+/Vitest (re-run `/update-stack`), or the reader
  specifically wants the newest Angular and accepts the upgrade friction.
- **Supersedes:** the plan's "Angular 22 + Vitest" frontend pin (approved before this was verified). Logged in
  [status.md](status.md) drift log.

## D4 — Dev proxy on the frontend instead of relying on CORS
- **Date:** 2026-07-10
- **Source:** the Phase 0.5 web check.
- **Decision:** the Ionic dev server **proxies `/api` to `http://localhost:5080`**; the backend also enables a
  named CORS policy `"frontend"` for the `:8100` origin as a belt-and-suspenders (and for non-proxied use).
- **Why:** proxying means the browser sees a single origin in dev, so there's no CORS preflight friction while
  developing; CORS is still configured so the API is correct on its own and works if called directly.
- **Rules out / trade-off:** two places to keep the port in sync (proxy config + CORS origin). Both are
  load-bearing values recorded in conventions.
- **Revisit if:** deploying — then the real deployed origin replaces the dev origin in the CORS policy.
