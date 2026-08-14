# M1 · Step 03 of 05 — Add the test project
> Nav: [← Replace the template endpoint with /health](02_the-health-endpoint.md) · [Overview](00_overview.md) · [Write the first integration test →](04_first-integration-test.md)

## Glossary for this step

> New here: **[integration test](../foundation/glossary.md#integration-test)** (defined under *Why / design*) ·
> **[content root](../foundation/glossary.md#content-root)** (defined under *Do this* 3).

## Why / design

An **integration test** exercises several components together through their real seams — here, a request
travelling the actual ASP.NET Core pipeline (routing, model binding, serialization) rather than a direct call
to a handler method with fake arguments. That distinction is the whole reason this guide can claim its gates
prove something: a unit test of a lambda would pass even if the route were misspelled.

The tests live in their own project so that test infrastructure never ships with the service, and so you can
run one without building the other.

## Before you start

Steps 01–02 complete: the solution builds and `src/Api` answers on `/health`.

## Do this

1. Create the xUnit test project under `tests/Api.Tests`. The `--name` is **load-bearing** — it sets the
   assembly and namespace that step 04's file declares.

   ```
   dotnet new xunit --output tests/Api.Tests --name Api.Tests
   ```

2. Add it to the solution, then reference the API project from it. The **direction matters**: tests reference
   the SUT, never the other way round.

   ```
   dotnet sln add tests/Api.Tests/Api.Tests.csproj
   dotnet add tests/Api.Tests/Api.Tests.csproj reference src/Api/Api.csproj
   ```

3. Add the testing package. This is the piece that makes an in-process integration test possible at all.

   ```
   dotnet add tests/Api.Tests/Api.Tests.csproj package Microsoft.AspNetCore.Mvc.Testing
   ```

   > New concept — **`Microsoft.AspNetCore.Mvc.Testing`**: the official package for integration-testing an
   > ASP.NET Core app. It does three things: supplies the `WebApplicationFactory<T>` class you will use in
   > step 04, copies the SUT's dependency manifest (`.deps.json`) into the test project's output so the app's
   > assemblies resolve, and sets the **content root** — the directory ASP.NET Core resolves configuration and
   > static files from — to the SUT's project folder rather than the test project's.
   > ([Integration tests in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0))

   That third job is why you don't have to copy `appsettings.json` around by hand. Leave every other property
   of the test `.csproj` at its default; the template's defaults are correct for this guide.

4. Confirm the plumbing works before writing any test of your own. The template generated a placeholder test
   (`UnitTest1.cs`) that asserts nothing; you'll replace it in step 04, but right now it proves the runner
   runs.

   ```
   dotnet test
   ```

   The summary it prints is where every gate in this guide is read. In your **terminal** it looks like this:

   ```
     Api.Tests test net10.0 succeeded (0.9s)

   Test summary: total: 1, failed: 0, succeeded: 1, skipped: 0, duration: 0.9s
   Build succeeded in 2.1s
   ```

   **Read the values, not the line.** `total:` and `failed:` are the two every `Done when` in this guide names
   — **0 failed, 1 total** here, **0 failed, 14 total** by the end. The rendering is not stable and you should
   not match against it: **redirect** `dotnet test` to a file or a pipe and the terminal logger switches off,
   handing you the older runner line instead — `Passed!  - Failed:     0, Passed:     1, …`, column-padded,
   with the padding shifting as the totals grow. Same numbers, different shape. The gates state the numbers so
   they hold in both.
   ([dotnet test](https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-test))

## Done when (this step)

- [ ] `dotnet build` → `Build succeeded`, exits 0.
- [ ] `dotnet test` → **0 failed, 1 total** (the template’s placeholder), exits 0.
- [ ] `tests/Api.Tests/Api.Tests.csproj` contains both a `<ProjectReference>` to `Api.csproj` and a
      `<PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" …>`.

## If it breaks

- **The summary looks nothing like the block above** — one padded line starting `Passed!  - Failed:` → you
  redirected or piped the output, which turns the terminal logger off and falls back to the older runner line.
  The counts are the same; read `Failed:` and `Total:` instead of `failed:` and `total:`.
- **`dotnet test` reports `No test source files were specified`** → you ran it from inside `src/Api`. Run it
  from the solution folder, where it discovers every test project in the `.sln`.
- **The reference command fails with `Project already has a reference`** → harmless; you ran it twice.
- **The package restores a `9.x` version** → your SDK resolved against an older framework. Check
  `tests/Api.Tests/Api.Tests.csproj` targets `net10.0`; the package version must match the ASP.NET Core major
  version, per [../foundation/stack.md](../foundation/stack.md).

---
> Nav: [← Replace the template endpoint with /health](02_the-health-endpoint.md) · [Overview](00_overview.md) · [Write the first integration test →](04_first-integration-test.md)
