# Milestone 3 · Step 01 of 4 — Install xUnit v3 templates + create `Api.Tests`
> Nav: — · [Overview](00_overview.md) · [Read + create tests →](02_list-and-create-tests.md)

> **This step creates the test project and its config — it touches 3 files, committed together:**
> `backend/global.json`, `backend/Api.Tests/Api.Tests.csproj`, and (deletes) the template's `UnitTest1.cs`.

## Why / design
`dotnet new xunit` still scaffolds xUnit **v2**, so we install the v3 templates first and use `xunit3`. xUnit
v3 runs on the **Microsoft Testing Platform (MTP)**, not the older VSTest. On the .NET 10 SDK you tell
`dotnet test` to use MTP with a `global.json` `test.runner` entry — **without it, `dotnet test` can report
"no tests" and exit green, the classic v3 dead-end.**

`Microsoft.AspNetCore.Mvc.Testing` supplies `WebApplicationFactory<T>`, which boots the API in-process so
tests hit real routes without a running server.

## Do this
1. **Install the xUnit v3 templates** (once per machine):
   ```bash
   dotnet new install xunit.v3.templates
   ```
2. **From `backend/`, create the test project** next to `Api/`:
   ```bash
   cd backend
   dotnet new xunit3 -o Api.Tests
   ```
3. **Delete the placeholder test** the template adds, so only your tests remain:
   ```bash
   rm Api.Tests/UnitTest1.cs      # Windows PowerShell: del Api.Tests\UnitTest1.cs
   ```
4. **Add a reference to the API project and the test-host package:**
   ```bash
   cd Api.Tests
   dotnet add reference ../Api/Api.csproj
   dotnet add package Microsoft.AspNetCore.Mvc.Testing
   ```
5. **Create `backend/global.json`** (in `backend/`, the parent of both projects) with the MTP runner setting:

## Code
```json
// backend/global.json
{
  "test": {
    "runner": "Microsoft.Testing.Platform"
  }
}
```

## Done when (this step)
- [ ] `backend/Api.Tests/` exists with `Api.Tests.csproj` referencing `Api.csproj` and
      `Microsoft.AspNetCore.Mvc.Testing`.
- [ ] `backend/global.json` exists with the `test.runner` entry.
- [ ] `dotnet test` (from `backend/Api.Tests`) builds and runs, reporting **0 tests** (you deleted the
      placeholder and haven't written any yet):
  ```text
  Passed!  - Failed: 0, Passed: 0, Skipped: 0
  ```

## If it breaks
- **`No templates installed matching: xunit3`** — the template install didn't take; re-run
  `dotnet new install xunit.v3.templates` and confirm with `dotnet new list xunit`.
- **`dotnet test` says "No test is available" / exits without a summary** — the `global.json` `test.runner`
  is missing or `dotnet test` was run above the `backend/` folder where it can't see `global.json`. Run it
  from `backend/Api.Tests`.
- **`WebApplicationFactory` won't resolve later** — the `Microsoft.AspNetCore.Mvc.Testing` package didn't add;
  re-run step 4's `dotnet add package`.
