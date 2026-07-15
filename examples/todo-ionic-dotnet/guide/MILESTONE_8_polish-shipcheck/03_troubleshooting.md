# Milestone 8 · Step 03 of 4 — Write the troubleshooting sheet
> Nav: [← Run-both README](02_run-both.md) · [Overview](00_overview.md) · [Verify →](04_verify.md)

## Why / design
Most first-run failures fall into a handful of traps. This sheet is the reference to reach for when something
doesn't work — no code to write, just diagnoses. (This is guide content; you don't create a file for it,
though you're welcome to paste it into the project README.)

## The traps and their fixes

| Symptom | Likely cause | Fix |
|---|---|---|
| Browser console: **CORS blocked** on `/api/todos` | You're calling `:5080` directly, bypassing the proxy | Use relative `/api` URLs (the service already does) so the proxy handles it; and confirm the API's CORS origin is `http://localhost:8100` ([M2 step 03](../MILESTONE_2_backend-crud-cors/03_cors.md)) |
| `curl :8100/api/todos` returns **HTML**, not JSON | Proxy not active | Restart `ionic serve` after editing `proxy.conf.json`; confirm `proxyConfig` is in `angular.json` ([M4 step 03](../MILESTONE_4_frontend-scaffold/03_proxy.md)) |
| Frontend shows the **error state** even though the API seems up | Backend not on `:5080`, or started on another port | Check `launchSettings.json` `applicationUrl` is `http://localhost:5080`; run `dotnet run` from `backend/Api` |
| **Port already in use** (`5080` or `8100`) | A previous server is still running | Stop it, or change the port *and* update the matching value (CORS origin / proxy target) |
| Todos **vanish after restarting the backend** | Expected — EF InMemory resets each run | Not a bug; re-seed happens on startup. For persistence, swap the provider ([D1](../foundation/decision-log.md#d1--ef-core-inmemory-as-the-store-but-tests-drive-the-real-pipeline)) |
| `dotnet test` reports **"no tests"** and exits green | Missing MTP runner setting on the .NET 10 SDK | Add `backend/global.json` with `test.runner: Microsoft.Testing.Platform` ([M3 step 01](../MILESTONE_3_backend-tests/01_create-test-project.md)) |
| `dotnet new xunit3` **template not found** | v3 templates not installed | `dotnet new install xunit.v3.templates` |
| `ng test` **hangs** or can't find Chrome | Headed browser / Chrome missing | Run `ng test --watch=false --browsers=ChromeHeadless`; install Chrome or set `CHROME_BIN` |
| `@angular/core` **isn't 20.3** after `ionic start` | The Ionic starter tracks a different Angular now | Fine if it builds; note the drift in [status.md](../foundation/status.md) — later steps assume 20.3 idioms ([D5](../foundation/decision-log.md#d5--follow-the-ionic-scaffolds-angular-203--karma-not-a-forced-upgrade)) |
| Ionic **icons show as empty boxes** | Icon not registered / name mismatch | Pass the icon to `addIcons({...})` and match the `name="..."` string ([M6 step 03](../MILESTONE_6_frontend-crud/03_edit-and-delete.md)) |

## Done when (this step)
- [ ] You've skimmed the table and know where to look when a given symptom appears. (Nothing to build.)

## If it breaks
- **Your symptom isn't listed** — check the per-step "If it breaks" note in the milestone where the relevant
  file was created; it names the failure closest to that code.
