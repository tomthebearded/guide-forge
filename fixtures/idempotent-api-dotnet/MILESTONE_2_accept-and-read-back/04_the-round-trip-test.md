# M2 · Step 04 of 05 — Test the round trip
> Nav: [← Add the POST and GET endpoints](03_post-and-get-endpoints.md) · [Overview](00_overview.md) · [Verify →](05_verify.md)

## Why / design

Three tests, each proving one thing: the create contract (`201` + `Location`), the round trip (what you get
back is what you posted), and the miss (an unknown id is a `404`, not a `500` or an empty `200`).

The third one earns its place. Endpoints that behave correctly on the happy path and incorrectly on the miss
are the normal kind of broken, and nothing else in this milestone would catch it.

## Before you start

Step 03 complete: both endpoints exist and the solution builds.

## Do this

1. Create `tests/Api.Tests/CommandEndpointsTests.cs`.

   ```csharp
   using System.Net;
   using System.Net.Http.Json;
   using Api;
   using Microsoft.AspNetCore.Mvc.Testing;

   namespace Api.Tests;

   public class CommandEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
   {
       private readonly WebApplicationFactory<Program> _factory;

       public CommandEndpointsTests(WebApplicationFactory<Program> factory) => _factory = factory;

       [Fact]
       public async Task PostCommand_ReturnsCreated_WithLocationPointingAtTheCommand()
       {
           var client = _factory.CreateClient();

           var response = await client.PostAsJsonAsync(
               "/commands", new CreateCommandRequest("charge", "42"));

           Assert.Equal(HttpStatusCode.Created, response.StatusCode);

           var created = await response.Content.ReadFromJsonAsync<Command>();
           Assert.NotNull(created);
           Assert.Equal("charge", created.Type);
           Assert.Equal("42", created.Payload);
           Assert.NotEqual(Guid.Empty, created.Id);
           Assert.Equal($"/commands/{created.Id}", response.Headers.Location?.ToString());
       }

       [Fact]
       public async Task GetCommand_AfterPost_ReturnsTheSameCommand()
       {
           var client = _factory.CreateClient();
           var postResponse = await client.PostAsJsonAsync(
               "/commands", new CreateCommandRequest("charge", "42"));
           var created = await postResponse.Content.ReadFromJsonAsync<Command>();

           var getResponse = await client.GetAsync($"/commands/{created!.Id}");

           Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
           var fetched = await getResponse.Content.ReadFromJsonAsync<Command>();
           Assert.Equal(created, fetched);
       }

       [Fact]
       public async Task GetCommand_UnknownId_ReturnsNotFound()
       {
           var client = _factory.CreateClient();

           var response = await client.GetAsync($"/commands/{Guid.NewGuid()}");

           Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
       }
   }
   ```

2. Two details worth pausing on.

   `PostAsJsonAsync` and `ReadFromJsonAsync` come from `System.Net.Http.Json` — they serialize and deserialize
   with the same defaults the server uses, which is why the camelCase field names from milestone 1 never come
   up here. You work in C# types on both sides.

   `Assert.Equal(created, fetched)` compares two `Command` **records**, so it compares every field, not the
   reference. If the service quietly dropped `Payload` on the way to storage, this line fails.

3. A word about `IClassFixture`, because it becomes a trap later: it shares **one** application — and therefore
   one store — across all three tests in this class. That's fine here, because each test uses only ids it
   created itself. It stops being fine the moment a test asserts on *how many* commands exist, which is
   exactly what [milestone 3](../MILESTONE_3_idempotency/00_overview.md) does; that milestone constructs its
   own factory per test and explains why.

4. Run the suite.

   ```
   dotnet test
   ```

## Done when (this step)

- [ ] `dotnet test` → **0 failed, 4 total**, exits 0 — the health test plus these three.
- [ ] `dotnet build` → `Build succeeded`.

## If it breaks

- **`PostCommand_…` fails with `Location` null** → the handler returns `Results.Ok(command)` instead of
  `Results.Created(…)`. Only `Created` sets the header.
- **The `Location` assertion fails showing an absolute URL** (`http://localhost/commands/…`) → you passed an
  absolute uri to `Results.Created`. Pass the relative path exactly as step 03 shows.
- **`GetCommand_AfterPost_…` fails comparing `CreatedAtUtc`** → the handler creates a *second* `Command` on
  read instead of returning the stored one. The store must hand back the instance it was given.
- **`GetCommand_UnknownId_…` returns `200` with an empty body** → the handler returns `Results.Ok(null)`
  rather than `Results.NotFound()`. Check the pattern match in step 03.

---
> Nav: [← Add the POST and GET endpoints](03_post-and-get-endpoints.md) · [Overview](00_overview.md) · [Verify →](05_verify.md)
