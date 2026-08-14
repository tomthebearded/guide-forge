# M3 · Step 03 of 04 — Prove it: the idempotency tests
> Nav: [← Replay the stored response](02_replay-the-stored-response.md) · [Overview](00_overview.md) · [Verify →](04_verify.md)

## Why / design

Idempotency is a claim with two halves, and a test that checks only one certifies nothing:

- the client gets **the same response**, and
- the service stores **one record, not two**.

A test that posts twice and compares the two responses would pass against a service that stored two commands
and happened to return the first one's body. So the second assertion counts what's in the store.

Counting is why these tests build their **own** application instead of sharing the class fixture. The fixture
from milestone 2 hands every test in the class the same running app — and therefore the same store — so a
count assertion would be measuring every test that ran before it. A test that asserts on a total has to own
the total.

## Before you start

Step 02 complete: the handler replays a known key; `dotnet test` green at 4.

## Do this

1. Create `tests/Api.Tests/IdempotencyTests.cs`.

   ```csharp
   using System.Net;
   using System.Net.Http.Json;
   using Api;
   using Microsoft.AspNetCore.Mvc.Testing;
   using Microsoft.Extensions.DependencyInjection;

   namespace Api.Tests;

   public class IdempotencyTests
   {
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
       public async Task PostCommand_SameKeyTwice_ReplaysResponseAndStoresOneCommand()
       {
           await using var factory = new WebApplicationFactory<Program>();
           var client = factory.CreateClient();
           var idempotencyKey = Guid.NewGuid().ToString();
           var request = new CreateCommandRequest("charge", "42");

           var first = await PostCommandAsync(client, idempotencyKey, request);
           var second = await PostCommandAsync(client, idempotencyKey, request);

           Assert.Equal(HttpStatusCode.Created, first.StatusCode);
           Assert.Equal(HttpStatusCode.Created, second.StatusCode);
           Assert.Equal(
               await first.Content.ReadAsStringAsync(),
               await second.Content.ReadAsStringAsync());
           Assert.Equal(first.Headers.Location, second.Headers.Location);

           var store = factory.Services.GetRequiredService<InMemoryCommandStore>();
           Assert.Single(store.All());
       }

       [Fact]
       public async Task PostCommand_DifferentKeys_StoreTwoCommands()
       {
           await using var factory = new WebApplicationFactory<Program>();
           var client = factory.CreateClient();
           var request = new CreateCommandRequest("charge", "42");

           await PostCommandAsync(client, Guid.NewGuid().ToString(), request);
           await PostCommandAsync(client, Guid.NewGuid().ToString(), request);

           var store = factory.Services.GetRequiredService<InMemoryCommandStore>();
           Assert.Equal(2, store.All().Count);
       }

       [Fact]
       public async Task PostCommand_WithoutKey_ReturnsBadRequest()
       {
           await using var factory = new WebApplicationFactory<Program>();
           var client = factory.CreateClient();

           var response = await client.PostAsJsonAsync(
               "/commands", new CreateCommandRequest("charge", "42"));

           Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
       }
   }
   ```

2. Three things in there are deliberate, and worth not undoing later.

   `await using var factory = new WebApplicationFactory<Program>();` gives each test its own application and
   disposes it at the end of the test. That is what makes `Assert.Single` mean "this test stored one", rather
   than "one exists somewhere in the suite".

   `factory.Services.GetRequiredService<InMemoryCommandStore>()` reaches into the running app's DI container
   and pulls out the very instance the handlers used. It is the same singleton, not a copy.

   The second test proves the feature doesn't *over*-apply: two different keys must still produce two
   commands. Without it, a service that ignored the payload and stored nothing at all would pass the first
   test.

3. Run the suite.

   ```
   dotnet test
   ```

## Done when (this step)

- [ ] `dotnet test` → **0 failed, 7 total**, exits 0 — the four from before plus these three.
- [ ] `dotnet build` → `Build succeeded`.
- [ ] Deliberately break it once, to confirm the gate can fail: in `Program.cs`, comment out the
      `if (store.FindByKey(idempotencyKey) is { } existing)` branch and re-run. You must see
      `PostCommand_SameKeyTwice_ReplaysResponseAndStoresOneCommand` **fail**, and it fails on the **body
      comparison** — `Assert.Equal() Failure: Strings differ` — because without the replay branch the second
      POST creates a second command with a new id, and that assertion comes before the store count. The
      `Assert.Single(store.All())` three lines below never runs: xUnit stops a test at its **first** failing
      assertion, so a later one that would also have failed is never reported. Put the branch back and confirm
      green again. A gate you have never seen fail is a gate you have not tested.

## If it breaks

- **`Assert.Single() Failure: The collection contained 2 items`** → the replay branch isn't being hit.
  Check that `store.Add` is called with the same `idempotencyKey` the lookup uses.
- **The two response bodies differ** → the replay branch builds a new `Command` instead of returning the
  stored one. Compare with step 02, action 2.
- **`CS0246: GetRequiredService`** → the `using Microsoft.Extensions.DependencyInjection;` line is missing.
- **`PostCommand_DifferentKeys_StoreTwoCommands` finds 1 item** → both calls generated the *same* key. Each
  `Guid.NewGuid().ToString()` must be evaluated separately, as written.
- **`PostCommand_WithoutKey_…` fails with `415 Unsupported Media Type`** → you replaced `PostAsJsonAsync` with
  a hand-built message and omitted the JSON content type. Leave that one test using `PostAsJsonAsync`.

---
> Nav: [← Replay the stored response](02_replay-the-stored-response.md) · [Overview](00_overview.md) · [Verify →](04_verify.md)
