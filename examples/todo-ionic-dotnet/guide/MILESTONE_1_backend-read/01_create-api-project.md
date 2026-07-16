# Milestone 1 · Step 01 of 5 — Create the API project + add EF Core InMemory
> Nav: — · [Overview](00_overview.md) · [Todo & DbContext →](02_todo-and-dbcontext.md)

## Do this
1. **From the `backend/` folder**, scaffold an empty ASP.NET Core project named `Api`:
   ```bash
   cd backend
   dotnet new web -o Api
   ```
   This creates `backend/Api/` with a minimal `Program.cs` (a single "Hello World" endpoint), `Api.csproj`,
   and `Properties/launchSettings.json`. The project name `Api` is **load-bearing** — the test project in M3
   references `Api.csproj` by that name.
2. **Enter the project and add the EF Core InMemory provider** at the version pinned in
   [stack.md](../foundation/stack.md):
   ```bash
   cd Api
   dotnet add package Microsoft.EntityFrameworkCore.InMemory --version 10.0.9
   ```
3. **Pin the dev port to 5080.** Open `backend/Api/Properties/launchSettings.json` and replace its entire
   contents with the file below. This gives a single `http` profile on port **5080** (load-bearing — the
   frontend proxy and CORS both target it) and disables HTTPS redirection and auto-launching a browser, which
   only get in the way for an API.

## Code
```json
// backend/Api/Properties/launchSettings.json
{
  "$schema": "https://json.schemastore.org/launchsettings.json",
  "profiles": {
    "http": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": false,
      "applicationUrl": "http://localhost:5080",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

## Done when (this step)
- [ ] `backend/Api/Api.csproj` exists and lists the `Microsoft.EntityFrameworkCore.InMemory` package.
- [ ] `dotnet run` (from `backend/Api`) logs `Now listening on: http://localhost:5080`. (It still serves only
      "Hello World" at `/` — that's expected; stop it with Ctrl+C.)

## If it breaks
- **`dotnet add package` restore fails on version 10.0.9** — that exact patch may have been superseded; run
  `dotnet add package Microsoft.EntityFrameworkCore.InMemory --version "10.*"` to take the latest 10.x, and
  note the drift in [status.md](../foundation/status.md).
- **It listens on `5000`/`7xxx`, not `5080`** — `launchSettings.json` wasn't saved, or you ran with a
  different profile. Confirm the file matches above and run plain `dotnet run`.

---
> Nav: — · [Overview](00_overview.md) · [Todo & DbContext →](02_todo-and-dbcontext.md)
