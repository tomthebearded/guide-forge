# Verified stack — Todo (Ionic + .NET)

> Pinned versions and official docs for this guide, verified online on **2026-07-10**.
> Every milestone uses these exact versions. If you're following this later, re-check the "Latest stable"
> column — if it moved, reconcile before following (the review-before-follow gate).

| Tool / library | Pinned version | Latest stable (as of 2026-07-10) | Official docs | Notes (renames · deprecations · install) |
|----------------|----------------|-----------------------------------|---------------|------------------------------------------|
| Node.js | 24 (Active LTS) | v24 "Krypton" | https://nodejs.org/en/about/previous-releases | Angular 20.3 accepts Node 20/22/24; we use 24 LTS. |
| Angular | **20.3.x** | 22.0.6 (v22: 2026-06-03) | https://angular.dev/reference/releases | **This is what `ionic start` scaffolds today** — see [decision D5](decision-log.md#d5--follow-the-ionic-scaffolds-angular-203--karma-not-a-forced-upgrade). Standalone is the default (since v19); signals available. We do **not** force-upgrade to 22. |
| TypeScript | 5.9.x | 6.0.x | https://angular.dev/reference/versions | Pinned by the Ionic scaffold (Angular 20.3 → TS 5.9). Don't install by hand. |
| @ionic/angular | 8.8.x | 8.8.13 | https://ionicframework.com/docs/angular/overview | Standalone components via `@ionic/angular/standalone` (since v7.5). |
| ionicons | 7.x | 8.x | https://ionic.io/ionicons | The scaffold pins ionicons **7** (not 8). Import icons from `ionicons/icons`, register with `addIcons`. |
| @ionic/cli | 7.2.x | 7.2.1 | https://ionicframework.com/docs/cli/commands/start | `ionic start app blank --type angular-standalone`. |
| Karma + Jasmine | Angular-scaffold-managed | (Karma legacy; Vitest is the new default in Angular 21+) | https://angular.dev/guide/testing | **What `ionic start` ships for `ng test`** — `@angular-devkit/build-angular:karma`, Jasmine assertions, runs in Chrome. Works out of the box; non-experimental. We use it as-is rather than migrating to Vitest. |
| .NET SDK / runtime | 10.0.x (LTS) | 10.0 (GA 2025-11-11) | https://learn.microsoft.com/dotnet/core/whats-new/dotnet-10/overview | LTS to 2028-11-10. Ships **C# 14**. |
| C# | 14 | 14 | https://learn.microsoft.com/dotnet/csharp/whats-new/csharp-14 | Default lang version on .NET 10. |
| Minimal APIs | ASP.NET Core 10 | — | https://learn.microsoft.com/aspnet/core/fundamentals/minimal-apis | Docs (May 2026): "For new projects, we recommend using Minimal APIs." |
| Microsoft.EntityFrameworkCore.InMemory | 10.0.x | 10.0.9 | https://learn.microsoft.com/ef/core/providers/in-memory/ | EF Core 10. Microsoft **discourages for testing** — see decision D1. |
| xUnit v3 | 3.2.x | 3.2.2 (2026-01-14) | https://xunit.net/docs/getting-started/v3/getting-started | `dotnet new xunit` = **v2**. For v3: `dotnet new install xunit.v3.templates` → `dotnet new xunit3`. |

## Install (the exact commands, at the pinned versions)
```bash
# Verify the toolchain (installs are covered step-by-step in Milestone 0):
node -v            # v24.x
dotnet --version   # 10.0.x
npm i -g @ionic/cli@7   # Ionic CLI 7.2.x
ionic -v           # 7.2.x

# xUnit v3 templates (once per machine, for the backend tests):
dotnet new install xunit.v3.templates

# The Ionic app is created by `ionic start` in M4 (brings Angular 20.3 + Karma with it):
ionic start frontend blank --type angular-standalone
```

## Version notes
- **`ionic start` scaffolds Angular 20.3, not the latest 22** — the Ionic starter tooling lags Angular's own
  `ng new`. We build on 20.3 as-is (reality wins) rather than force-upgrading. [decision D5](decision-log.md#d5--follow-the-ionic-scaffolds-angular-203--karma-not-a-forced-upgrade). — verified against `github.com/ionic-team/starters` (`angular-standalone/`).
- **Angular is standalone-by-default from v19+** (so 20.3 is standalone) — no `NgModule`, bootstrap with `bootstrapApplication`. — https://angular.dev/guide/components
- **Ionic standalone components** import from `@ionic/angular/standalone`; register icons with `addIcons` from `ionicons`. — https://ionicframework.com/docs/angular/build-options
- **`ionic start` ships Karma + Jasmine for `ng test`** (`@angular-devkit/build-angular:karma`), which runs in Chrome and works immediately. Vitest is Angular's *new* default (v21+) but is not what the 20.3 scaffold gives, so we use Karma/Jasmine. — https://angular.dev/guide/testing
- **EF Core InMemory is discouraged for testing** by Microsoft (no relational semantics/constraints/transactions); SQLite in-memory is their recommended fake. We keep InMemory as the *app store* only. — https://learn.microsoft.com/ef/core/testing/
- **`dotnet new xunit` still scaffolds xUnit v2**; v3 needs the `xunit.v3.templates` install then `dotnet new xunit3`. On the .NET 10 SDK, `dotnet test` needs a `global.json` `test.runner` = `Microsoft.Testing.Platform`. — https://xunit.net/docs/getting-started/v3/getting-started

> All versions confirmed against the official sources linked above (and the live Ionic starter source) on the
> check date. The frontend versions reflect what the tooling actually produces today, not the newest releases.
