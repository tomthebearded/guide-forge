# M4 · Step 04 of 05 — Prove it survives a restart
> Nav: [← Swap in the file store](03_swap-in-the-file-store.md) · [Overview](00_overview.md) · [Verify →](05_verify.md)

## Why / design

This is the gate the milestone exists for, and it needs care, because **the obvious version of it can pass
while the feature is broken**.

The obvious version writes a command, disposes the application, builds a new one, and reads the command back.
But `WebApplicationFactory` re-hosts the application **inside the same test process**. Anything that outlived
the old host — a `static` field, a cached singleton, a stray reference — would serve the second read from
memory, and the test would go green over a store that never touched the disk. A gate that passes on a broken
implementation is worse than no gate: it certifies the wrong thing.

So the test asserts **two independent facts**:

1. the bytes are in the data file, read with plain `File.ReadAllLinesAsync` and nothing of the app involved;
2. a **freshly built** application serves the command over HTTP.

The first cannot be satisfied by memory. The second cannot be satisfied by a file nobody reads. Together they
pin the claim from both ends.

## Before you start

Step 03 complete: the file store is registered, tests use per-test directories, and `dotnet test` is green
twice in a row.

## Do this

1. Create `tests/Api.Tests/DurabilityTests.cs`.

   ```csharp
   using System.Net;
   using System.Net.Http.Json;
   using Api;
   using Microsoft.AspNetCore.Hosting;
   using Microsoft.AspNetCore.Mvc.Testing;

   namespace Api.Tests;

   public class DurabilityTests
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
       public async Task Command_IsOnDisk_AndReadableFromAFreshlyBuiltApplication()
       {
           var dataDirectory = NewTempDataDirectory();
           Guid createdId;

           await using (var factory = CreateFactory(dataDirectory))
           {
               var client = factory.CreateClient();
               var response = await PostCommandAsync(
                   client, Guid.NewGuid().ToString(), new CreateCommandRequest("charge", "42"));
               var created = await response.Content.ReadFromJsonAsync<Command>();
               createdId = created!.Id;
           }

           // 1. The bytes are on disk — no part of the application is involved in this assertion.
           var lines = await File.ReadAllLinesAsync(Path.Combine(dataDirectory, "commands.jsonl"));
           Assert.Single(lines);
           Assert.Contains(createdId.ToString(), lines[0]);

           // 2. A brand-new application, built from scratch, serves it over HTTP.
           await using var freshFactory = CreateFactory(dataDirectory);
           var freshClient = freshFactory.CreateClient();
           var reread = await freshClient.GetAsync($"/commands/{createdId}");

           Assert.Equal(HttpStatusCode.OK, reread.StatusCode);
           var reloaded = await reread.Content.ReadFromJsonAsync<Command>();
           Assert.Equal(createdId, reloaded!.Id);
           Assert.Equal("charge", reloaded.Type);

           Directory.Delete(dataDirectory, recursive: true);
       }

       [Fact]
       public async Task IdempotencyKey_StillReplays_AfterAReload()
       {
           var dataDirectory = NewTempDataDirectory();
           var idempotencyKey = Guid.NewGuid().ToString();
           var request = new CreateCommandRequest("charge", "42");
           Guid firstId;

           await using (var factory = CreateFactory(dataDirectory))
           {
               var client = factory.CreateClient();
               var response = await PostCommandAsync(client, idempotencyKey, request);
               var created = await response.Content.ReadFromJsonAsync<Command>();
               firstId = created!.Id;
           }

           await using var freshFactory = CreateFactory(dataDirectory);
           var freshClient = freshFactory.CreateClient();
           var retry = await PostCommandAsync(freshClient, idempotencyKey, request);

           Assert.Equal(HttpStatusCode.Created, retry.StatusCode);
           var replayed = await retry.Content.ReadFromJsonAsync<Command>();
           Assert.Equal(firstId, replayed!.Id);

           var lines = await File.ReadAllLinesAsync(Path.Combine(dataDirectory, "commands.jsonl"));
           Assert.Single(lines);

           Directory.Delete(dataDirectory, recursive: true);
       }
   }
   ```

2. The second test is the one that would be easy to leave out, and it is the one that catches a real mistake:
   storing the command on disk but **not** the key it was created under. Everything would look durable —
   commands survive, `GET` works — right up until a client retries after a restart and gets a duplicate. The
   `Assert.Single(lines)` at the end is what makes it a gate rather than a smoke test.

3. Run the suite.

   ```
   dotnet test
   ```

## Done when (this step)

- [ ] `dotnet test` → **0 failed, 9 total**, exits 0 — the seven from before plus these two.
- [ ] `dotnet build` → `Build succeeded`.
- [ ] Watch this gate fail once, deliberately: in `src/Api/FileCommandStore.cs`, comment out the
      `File.AppendAllText(...)` line and re-run. **Two** tests fail, and neither reaches an assertion:
      `Command_IsOnDisk_AndReadableFromAFreshlyBuiltApplication` throws
      `System.IO.FileNotFoundException : Could not find file '…\commands.jsonl'` out of `File.ReadAllLinesAsync`
      — the file was never created, so the test dies one line *before* `Assert.Single(lines)` — and
      `IdempotencyKey_StillReplays_AfterAReload` fails on the id comparison, because a fresh application has
      nothing to reload. That is the proof either way: the gate reads the disk, not a leftover in memory.
      Restore the line and confirm green.

      An exception is a perfectly good failure, and worth recognising as one now: a test can fail by throwing
      before it ever asserts, and the runner reports it in the same red block. Reading "which assertion
      failed" is a habit that will mislead you here.

## If it breaks

- **`FileNotFoundException` on `commands.jsonl`** → nothing was ever appended, or the app wrote to a different
  directory than the test reads. Confirm the configuration key is spelled `DataDirectory` in both places.
- **`Assert.Single(lines)` finds 2 lines in the second test** → the key isn't being reloaded, so the retry
  created a new command. Check that `LoadFromDisk` populates `_commandIdsByKey`, not only `_commandsById`.
- **The reread returns `404`** → `LoadFromDisk` didn't run, or ran against an empty path. It is called from the
  constructor, so a store built with a different directory silently starts empty.
- **`IOException: The process cannot access the file`** on cleanup → the first factory wasn't disposed before
  the file was read. The `await using (…) { }` **block** around the first factory is what releases it; a
  plain `await using var` would hold it to the end of the test.

---
> Nav: [← Swap in the file store](03_swap-in-the-file-store.md) · [Overview](00_overview.md) · [Verify →](05_verify.md)
