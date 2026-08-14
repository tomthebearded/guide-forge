# M5 · Step 04 of 05 — Test every failure
> Nav: [← Reject a reused key with a changed payload](03_the-conflict-case.md) · [Overview](00_overview.md) · [Verify →](05_verify.md)

## Why / design

Five tests: one per failure the service can now produce, and **two** for the conflict, which is the case that
proves the service refuses to guess.

Two, because one is not enough to pin the comparison. The obvious conflict test changes the whole body —
`("charge","42")` then `("refund","99")` — and a guard written `existing.Type != request.Type &&
existing.Payload != request.Payload` passes it just as happily as the correct `||` does, since both fields
differ. The bug that `&&` actually is — a client that reuses a key and changes **one** field gets a silent
replay of the other request — needs a test that changes exactly one. That is the second conflict test, and it
is the only thing in the suite standing on the `||`.

Each assertion is on `status` and `title` — the fields you set in steps 01–03 — and on the content type. The
`type` URI and the framework's other additions are deliberately left unasserted: they belong to ASP.NET Core,
not to your contract, and pinning them would make a framework upgrade look like a regression.

## Before you start

Step 03 complete: the conflict branch exists; nine tests green.

## Do this

1. Create `tests/Api.Tests/ErrorResponseTests.cs`.

   ```csharp
   using System.Net;
   using System.Net.Http.Json;
   using Api;
   using Microsoft.AspNetCore.Hosting;
   using Microsoft.AspNetCore.Mvc;
   using Microsoft.AspNetCore.Mvc.Testing;

   namespace Api.Tests;

   public class ErrorResponseTests
   {
       private static WebApplicationFactory<Program> CreateFactory(string dataDirectory) =>
           new WebApplicationFactory<Program>()
               .WithWebHostBuilder(builder => builder.UseSetting("DataDirectory", dataDirectory));

       private static string NewTempDataDirectory() =>
           Path.Combine(Path.GetTempPath(), $"idempotent-api-tests-{Guid.NewGuid()}");

       private static Task<HttpResponseMessage> PostCommandAsync(
           HttpClient client, string idempotencyKey, CreateCommandRequest request)
       {
           var message = new HttpRequestMessage(HttpMethod.Post, "/commands")
           {
               Content = JsonContent.Create(request),
           };
           message.Headers.Add("Idempotency-Key", idempotencyKey);
           return client.SendAsync(message);
       }

       [Fact]
       public async Task GetCommand_UnknownId_ReturnsProblemDetails()
       {
           var dataDirectory = NewTempDataDirectory();
           await using var factory = CreateFactory(dataDirectory);
           var client = factory.CreateClient();

           var response = await client.GetAsync($"/commands/{Guid.NewGuid()}");

           Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
           Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

           var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
           Assert.Equal("Command not found", problem!.Title);
           Assert.Equal(404, problem.Status);

           Directory.Delete(dataDirectory, recursive: true);
       }

       [Fact]
       public async Task PostCommand_WithoutKey_ReturnsProblemDetails()
       {
           var dataDirectory = NewTempDataDirectory();
           await using var factory = CreateFactory(dataDirectory);
           var client = factory.CreateClient();

           var response = await client.PostAsJsonAsync(
               "/commands", new CreateCommandRequest("charge", "42"));

           Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

           var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
           Assert.Equal("Missing Idempotency-Key", problem!.Title);

           Directory.Delete(dataDirectory, recursive: true);
       }

       [Fact]
       public async Task PostCommand_EmptyType_ReturnsBadRequest()
       {
           var dataDirectory = NewTempDataDirectory();
           await using var factory = CreateFactory(dataDirectory);
           var client = factory.CreateClient();

           var response = await PostCommandAsync(
               client, Guid.NewGuid().ToString(), new CreateCommandRequest("   ", "42"));

           Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

           var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
           Assert.Equal("Invalid command", problem!.Title);

           Directory.Delete(dataDirectory, recursive: true);
       }

       [Fact]
       public async Task PostCommand_SameKeyDifferentPayload_ReturnsConflict()
       {
           var dataDirectory = NewTempDataDirectory();
           await using var factory = CreateFactory(dataDirectory);
           var client = factory.CreateClient();
           var idempotencyKey = Guid.NewGuid().ToString();

           var first = await PostCommandAsync(
               client, idempotencyKey, new CreateCommandRequest("charge", "42"));
           var second = await PostCommandAsync(
               client, idempotencyKey, new CreateCommandRequest("refund", "99"));

           Assert.Equal(HttpStatusCode.Created, first.StatusCode);
           Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);

           var problem = await second.Content.ReadFromJsonAsync<ProblemDetails>();
           Assert.Equal("Idempotency key reuse", problem!.Title);

           Directory.Delete(dataDirectory, recursive: true);
       }

       [Fact]
       public async Task PostCommand_SameKeyOnlyPayloadChanged_ReturnsConflict()
       {
           var dataDirectory = NewTempDataDirectory();
           await using var factory = CreateFactory(dataDirectory);
           var client = factory.CreateClient();
           var idempotencyKey = Guid.NewGuid().ToString();

           // Same type, different payload: exactly one field moved. This is the test the
           // `||` in the guard exists for — an `&&` would replay the first command here.
           var first = await PostCommandAsync(
               client, idempotencyKey, new CreateCommandRequest("charge", "42"));
           var second = await PostCommandAsync(
               client, idempotencyKey, new CreateCommandRequest("charge", "99"));

           Assert.Equal(HttpStatusCode.Created, first.StatusCode);
           Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);

           Directory.Delete(dataDirectory, recursive: true);
       }
   }
   ```

2. Two details in there are worth keeping.

   `ProblemDetails` is a real type in `Microsoft.AspNetCore.Mvc` — the same one the server serializes — so the
   test deserializes into it rather than picking JSON apart by hand. That is why the file carries
   `using Microsoft.AspNetCore.Mvc;`.

   `new CreateCommandRequest("   ", "42")` uses whitespace, not `""`. An empty string would pass a naive
   `Length == 0` check while whitespace would not; testing the harder case means the check can't quietly
   regress to the easier one.

3. Run the suite.

   ```
   dotnet test
   ```

## Done when (this step)

- [ ] `dotnet test` → **0 failed, 14 total**, exits 0 — the nine from before plus these five.
- [ ] `dotnet build` → `Build succeeded`.
- [ ] Watch the conflict gate fail once: in `src/Api/Program.cs`, change the `||` in the comparison to `&&`
      and re-run. **Exactly one test fails** — `PostCommand_SameKeyOnlyPayloadChanged_ReturnsConflict`,
      receiving `201` instead of `409`. `PostCommand_SameKeyDifferentPayload_ReturnsConflict` stays **green**,
      because both of its fields differ and `&&` is still satisfied; that is the whole reason the second
      conflict test exists. Change it back and confirm all 14 green.

## If it breaks

- **`ReadFromJsonAsync<ProblemDetails>()` returns null** → the response body isn't `ProblemDetails`, usually
  because that endpoint still returns `Results.BadRequest()` rather than `Results.Problem(...)`. Check step 01,
  action 2.
- **The content-type assertion fails with `application/json`** → same cause: a plain result rather than a
  problem result.
- **`PostCommand_EmptyType_…` gets `201`** → the validation block from step 02 landed after the store lookup,
  so the replay path returned before it ran.
- **`PostCommand_SameKeyDifferentPayload_…` gets `201`** → the conflict guard is missing or inverted. Step 03,
  action 1.

---
> Nav: [← Reject a reused key with a changed payload](03_the-conflict-case.md) · [Overview](00_overview.md) · [Verify →](05_verify.md)
