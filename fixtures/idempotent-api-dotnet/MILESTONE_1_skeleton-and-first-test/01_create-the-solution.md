# M1 · Step 01 of 05 — Create the solution and the API project
> Nav: — · [Overview](00_overview.md) · [Replace the template endpoint with /health →](02_the-health-endpoint.md)

## Glossary for this step

> New here: **[SUT (system under test)](../foundation/glossary.md#sut-system-under-test)** (defined under *Do this* 2) ·
> **[Minimal API](../foundation/glossary.md#minimal-api)** (defined under *Do this* 2).

## Why / design

A solution file is not decoration here: it is what lets you run one command at the repository root and have
both projects build, and later have every test in the repository run. You will add a second project in step 03,
and from that point on `dotnet build` and `dotnet test` at the root are the only two commands this guide asks
you to remember.

The API project goes under `src/` and the tests under `tests/` — the layout recorded in
[../foundation/conventions.md](../foundation/conventions.md). Keeping them apart is what makes it possible to
ship one without the other.

## Before you start

You need the .NET 10 SDK on your PATH and an empty folder to work in. Confirm the SDK first:

```
dotnet --version
```

You should see `10.0.302`, or another `10.0.*` build. If you see a `9.` or `8.` version, install .NET 10 from
the [official download page](https://dotnet.microsoft.com/download) before continuing — every command and API
in this guide is pinned to .NET 10 in [../foundation/stack.md](../foundation/stack.md).

## Do this

1. In the empty folder that will hold the project, create the solution file. `--name` sets the `.sln`
   filename; the name is **cosmetic** — nothing in this guide references it.

   ```
   dotnet new sln --name IdempotentApi
   ```

2. Create the web project into `src/Api`. `dotnet new web` is the *empty* ASP.NET Core template — a single
   `Program.cs` with one endpoint and no controllers, views, or sample pages. This project is the **SUT**
   (system under test): the thing the tests you write later will exercise.

   > New concept — **Minimal API**: ASP.NET Core's style of declaring HTTP endpoints as lambdas hung directly
   > off the app object (`app.MapGet("/path", () => …)`), with no controller class in between. It's the shape
   > this whole guide uses. ([Minimal APIs overview](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/overview?view=aspnetcore-10.0))

   The `--name Api` is **load-bearing**: it sets both the assembly name and the root namespace, and later steps
   reference `Api.csproj` by that exact name.

   ```
   dotnet new web --output src/Api --name Api
   ```

3. Add the project to the solution, so a build at the root builds it.

   ```
   dotnet sln add src/Api/Api.csproj
   ```

   On PowerShell the same command works unchanged — .NET accepts forward slashes in paths on every platform.

## Done when (this step)

Run `dotnet build` from the folder holding the `.sln`. This is what your **terminal** prints:

```
Restore complete (0.4s)
  Api net10.0 succeeded (0.3s) → src/Api/bin/Debug/net10.0/Api.dll

Build succeeded in 1.5s
```

**There is no `0 Error(s)` line, and that is correct.** Since .NET 9 the CLI renders build output with the
*terminal logger* whenever it is writing to a terminal, and that renderer reports success as one line with a
duration. The older `Build succeeded.` / `0 Warning(s)` / `0 Error(s)` block you may have seen still appears
when the output is **redirected** — `dotnet build > build.log`, a pipe, a CI job — because the terminal logger
switches itself off there. Every gate in this guide names what your terminal shows.
([dotnet build](https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-build) — see its `-tl` option)

- [ ] `dotnet build` → `Build succeeded`, exits 0.
- [ ] The folder now contains `IdempotentApi.sln` and `src/Api/Program.cs`.

## If it breaks

- **You can't find `0 Error(s)` anywhere in the output** → you're not meant to. That line belongs to the older
  console renderer; in a terminal, `Build succeeded in <time>` *is* the success signal. Add `-tl:off` if you
  want the old block back — the exit code is 0 either way, and that is what the gate really rests on.
- **`No .NET SDKs were found`** → the SDK isn't on your PATH. Reopen the terminal after installing; installers
  update PATH only for new shells.
- **`Specified command or file was not found: dotnet new web`** → you have a runtime-only install, not the
  SDK. The runtime runs apps; only the SDK creates them.
- **`The project file could not be loaded`** on `dotnet sln add` → you're not in the folder holding the `.sln`.
  The path `src/Api/Api.csproj` is relative to the solution folder.

---
> Nav: — · [Overview](00_overview.md) · [Replace the template endpoint with /health →](02_the-health-endpoint.md)
