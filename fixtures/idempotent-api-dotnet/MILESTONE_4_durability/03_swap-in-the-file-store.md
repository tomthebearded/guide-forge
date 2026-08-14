# M4 · Step 03 of 05 — Swap in the file store
> Nav: [← Write the file-backed store](02_the-file-store.md) · [Overview](00_overview.md) · [Prove it survives a restart →](04_the-restart-test.md)

## Why / design

One line of registration changes the whole service's character — and it changes the tests, because a store
that remembers across processes also remembers **across tests**. The two milestone-3 tests that count records
would suddenly be counting whatever previous runs left on disk.

So this step does three things that belong together: register the file store, give every test its own data
directory, and delete the in-memory store now that nothing constructs it. Leaving it behind would leave a class
the guide never uses again, and you would have to guess whether that was deliberate.

The directory comes from configuration rather than a constant, for one concrete reason: it is the seam a test
uses to point the application somewhere disposable.

## Before you start

Step 02 complete: `FileCommandStore` compiles and implements `ICommandStore`; seven tests green.

## Do this

1. In `src/Api/Program.cs`, replace the registration line from step 01 with the factory registration below.
   The lambda receives the service provider (unused here, hence `_`) and returns the instance to keep.

   ```csharp
   builder.Services.AddSingleton<ICommandStore>(_ => new FileCommandStore(
       builder.Configuration["DataDirectory"] ?? Path.Combine(AppContext.BaseDirectory, "data")));
   ```

   `DataDirectory` is a **load-bearing** configuration key: the tests in step 04 set it by that exact name.
   The fallback puts the file next to the built application, so running the app with no configuration at all
   still works.

2. Delete the file `src/Api/InMemoryCommandStore.cs`. Nothing constructs it any more — the registration above
   names `FileCommandStore`, and the handlers depend on `ICommandStore`. The seam from step 01 is what made
   this a deletion rather than a rewrite.

3. In `tests/Api.Tests/IdempotencyTests.cs`, add this helper **immediately below the existing
   `PostCommandAsync` helper**, inside the class. Every test now builds its application pointed at a directory
   of its own.

   ```csharp
   private static WebApplicationFactory<Program> CreateFactory(string dataDirectory) =>
       new WebApplicationFactory<Program>()
           .WithWebHostBuilder(builder => builder.UseSetting("DataDirectory", dataDirectory));

   private static string NewTempDataDirectory() =>
       Path.Combine(Path.GetTempPath(), $"idempotent-api-tests-{Guid.NewGuid()}");
   ```

   > New concept — **`WithWebHostBuilder`**: `WebApplicationFactory` normally boots your app exactly as it
   > ships. `WithWebHostBuilder` returns a **new factory** whose host is built with your extra configuration
   > applied — it does not mutate the original — and **`UseSetting(key, value)`** is how you write one
   > configuration entry into that host before it starts. So `UseSetting("DataDirectory", …)` here is read by
   > `builder.Configuration["DataDirectory"]` in action 1: this pair is the seam that lets a test point the
   > application at a directory of its own.
   > ([Integration tests in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0))

4. In the same file, add the `using` for `UseSetting` at the top, below the existing usings.

   ```csharp
   using Microsoft.AspNetCore.Hosting;
   ```

5. In the same file, change all three tests to use the helper and clean up after themselves. In each test,
   replace the line `await using var factory = new WebApplicationFactory<Program>();` with the two lines:

   ```csharp
   var dataDirectory = NewTempDataDirectory();
   await using var factory = CreateFactory(dataDirectory);
   ```

   Then add this as the **last statement of each of the three tests**, so a passing run leaves nothing behind:

   ```csharp
   Directory.Delete(dataDirectory, recursive: true);
   ```

   A failing test will skip the cleanup and leave its directory in the temp folder — which is a feature, not a
   leak: that directory is the evidence you want when diagnosing the failure.

## Done when (this step)

- [ ] `dotnet build` → `Build succeeded`, exits 0.
- [ ] `dotnet test` → **0 failed, 7 total**, exits 0.
- [ ] Run `dotnet test` **a second time**. Still **0 failed, 7 total** — this is the check that matters in
      this step. If the count assertions now fail on the second run, the tests are sharing a directory and
      action 5 was not fully applied.
- [ ] `src/Api/InMemoryCommandStore.cs` no longer exists.

## If it breaks

- **`Assert.Single() Failure: The collection contained 2 items`, only on the second run** → exactly the defect
  this step guards against. One of the three tests still constructs a bare `WebApplicationFactory<Program>()`
  and is writing into the default directory next to the build output. Delete that directory, then finish
  action 5.
- **`CS0246: UseSetting`** → the `using Microsoft.AspNetCore.Hosting;` line from action 4 is missing.
- **`InvalidOperationException: Unable to resolve service for type 'Api.InMemoryCommandStore'`** → a
  leftover reference to the deleted class, most likely a service lookup in a test.
- **`UnauthorizedAccessException` creating the directory** → `Path.GetTempPath()` is not writable in your
  environment. Point `NewTempDataDirectory` at a folder inside the repository instead, and add it to
  `.gitignore`.

---
> Nav: [← Write the file-backed store](02_the-file-store.md) · [Overview](00_overview.md) · [Prove it survives a restart →](04_the-restart-test.md)
