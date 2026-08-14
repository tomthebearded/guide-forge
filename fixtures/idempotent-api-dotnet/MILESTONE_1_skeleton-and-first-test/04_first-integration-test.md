# M1 · Step 04 of 05 — Write the first integration test
> Nav: [← Add the test project](03_the-test-project.md) · [Overview](00_overview.md) · [Verify →](05_verify.md)

## Glossary for this step

> New here: **[WebApplicationFactory](../foundation/glossary.md#webapplicationfactory)** (defined under *Do this* 2) ·
> **[top-level statements](../foundation/glossary.md#top-level-statements)** (defined under *Why / design*).

## Why / design

This is the pattern every remaining gate in the guide is built from, so it's worth understanding rather than
copying. The test boots your entire application **inside the test process**, gets an `HttpClient` wired
straight to it, and asserts on a real HTTP response — status code and body — with no server started, no port
bound, and nothing to clean up afterwards.

That property is what makes the gates in this guide durable: they cannot fail because you forgot to start
something, and they cannot collide with an app you left running in another window.

**One thing you may have been expecting, and won't need.** The test names your application's entry point as a
type: `WebApplicationFactory<Program>`. But `Program.cs` uses **top-level statements** — the C# feature that
lets a file hold executable statements with no `class` or `Main` written out, leaving the compiler to generate
both. For years the generated class was *internal*, so tutorials and Microsoft's own docs tell you to append
`public partial class Program { }` to `Program.cs` before a test project can name it.

**On .NET 10 that line is unnecessary** — the generated class is already public, which you can confirm in one
line of test code: `typeof(Program).IsPublic` is `true`. This guide leaves the line out. If you ever target
.NET 9 or earlier, add it back; the docs describing it as required have not caught up with the SDK, and where
the docs and your toolchain disagree about what compiles, the toolchain is the one that decides.

## Before you start

Step 03 complete: the test project exists, references `Api.csproj`, carries the
`Microsoft.AspNetCore.Mvc.Testing` package, and `dotnet test` runs the template's placeholder.

## Do this

1. Delete the template's placeholder test file, `tests/Api.Tests/UnitTest1.cs`. It asserts nothing and its
   name describes nothing; leaving it would mean the suite's pass count includes a test that proves the runner
   works and not much else.

2. Create `tests/Api.Tests/HealthEndpointTests.cs` with the content below.

   ```csharp
   using System.Net;
   using Microsoft.AspNetCore.Mvc.Testing;

   namespace Api.Tests;

   public class HealthEndpointTests : IClassFixture<WebApplicationFactory<Program>>
   {
       private readonly WebApplicationFactory<Program> _factory;

       public HealthEndpointTests(WebApplicationFactory<Program> factory) => _factory = factory;

       [Fact]
       public async Task GetHealth_ReturnsOk_WithStatusOkBody()
       {
           var client = _factory.CreateClient();

           var response = await client.GetAsync("/health");

           Assert.Equal(HttpStatusCode.OK, response.StatusCode);
           Assert.Equal("{\"status\":\"ok\"}", await response.Content.ReadAsStringAsync());
       }
   }
   ```

3. Three things in that file carry the weight:

   > New concept — **`WebApplicationFactory<TEntryPoint>`**: the class that builds and starts your app in
   > memory for a test. `TEntryPoint` is how it finds your application — here the `Program` class the compiler
   > generated from your top-level statements, which on .NET 10 is already public. `CreateClient()` hands back
   > an `HttpClient` whose requests go straight into the app's pipeline instead of over a network socket.
   > ([WebApplicationFactory&lt;TEntryPoint&gt;](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.mvc.testing.webapplicationfactory-1?view=aspnetcore-10.0))

   - **`IClassFixture<T>`** is xUnit's way of saying "build this once and share it across every test in this
     class". Booting the app is the expensive part; doing it per test would make the suite slow for no gain.
   - **The body assertion is exact**, deliberately. `{"status":"ok"}` — lowercase `s`, no spaces, no trailing
     newline. Asserting "the response contains ok" would pass against a response that was wrong in every other
     respect.
   - **`Assert.Equal(HttpStatusCode.OK, …)`**, not `response.EnsureSuccessStatusCode()`. The first tells you
     what you got when it fails; the second throws an exception that mentions only that something wasn't 2xx.

4. Run the suite.

   ```
   dotnet test
   ```

## Done when (this step)

- [ ] `dotnet test` → **0 failed, 1 total**, exits 0. The `1` is now *your* test — the
      placeholder is gone.
- [ ] `dotnet build` → `Build succeeded`.

## If it breaks

- **`CS0122: 'Program' is inaccessible due to its protection level`** → you are not on .NET 10. On an earlier
  SDK the generated entry-point class is internal, and the test project cannot name it; add
  `public partial class Program { }` as the last line of `src/Api/Program.cs`. Check your SDK against
  [../foundation/stack.md](../foundation/stack.md) first — the whole guide is pinned to .NET 10.
- **`CS0246: The type or namespace name 'WebApplicationFactory<>' could not be found`** → the
  `Microsoft.AspNetCore.Mvc.Testing` package reference didn't land. Re-run step 03's `dotnet add package`
  command and check the `.csproj`.
- **The status assertion passes but the body assertion fails, showing `{"Status":"ok"}`** with a capital `S`
  → something has overridden the default JSON naming policy. The default is camelCase; if you changed it,
  either change it back or update the expected string to match — but keep the two in step.
- **`Assert.Equal() Failure` showing an empty body** → the route is spelled differently in the test than in
  `Program.cs`. `/health` is **load-bearing**: the test and the endpoint must match exactly.

---
> Nav: [← Add the test project](03_the-test-project.md) · [Overview](00_overview.md) · [Verify →](05_verify.md)
