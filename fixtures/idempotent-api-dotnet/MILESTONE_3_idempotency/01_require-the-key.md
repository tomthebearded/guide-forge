# M3 · Step 01 of 04 — Require an `Idempotency-Key`
> Nav: — · [Overview](00_overview.md) · [Replay the stored response →](02_replay-the-stored-response.md)

## Glossary for this step

> New here: **[idempotency key](../foundation/glossary.md#idempotency-key)** (defined under *Why / design*) ·
> **[idempotent](../foundation/glossary.md#idempotent)** (defined under *Why / design*).

## Why / design

A network is allowed to lose a response. A client that sends `POST /commands` and never hears back has no way
to know whether the command was stored — so it retries, and without help the service creates a second record
for what the client considers one operation.

An **idempotency key** is how the client tells the service "this retry is the same operation as before". The
client generates the value, sends it with every attempt of that operation, and the service uses it to
recognise the repeat. That makes `POST` **idempotent** — producing the same result whether performed once or
many times — which it is not by default (unlike `GET` or `DELETE`, which are naturally idempotent).

The key has to come from the client, not the server: the whole point is that it survives across attempts the
server may never have seen.

This step only makes the key **required**. Step 02 makes it do something.

Requiring it changes the contract of an endpoint two existing tests already call, so those two tests change in
this same step. A step that left them failing would leave you unable to tell your own mistakes from the
guide's plan for the next ten minutes.

## Before you start

Milestone 2 complete: four tests passing, `POST /commands` creating a record on every call.

## Do this

1. In `src/Api/Program.cs`, add this `using` directly under the existing `using Api;` line. `[FromHeader]`
   lives in the MVC namespace even in a Minimal API app — the attribute is shared between both models.

   ```csharp
   using Microsoft.AspNetCore.Mvc;
   ```

2. In `src/Api/Program.cs`, replace the whole `app.MapPost("/commands", …)` block with the version below. Two
   things change: the handler gains a header-bound parameter, and it rejects a request without one.

   ```csharp
   app.MapPost("/commands", (
       CreateCommandRequest request,
       [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey,
       InMemoryCommandStore store) =>
   {
       if (string.IsNullOrWhiteSpace(idempotencyKey))
       {
           return Results.BadRequest();
       }

       var command = new Command(Guid.NewGuid(), request.Type, request.Payload, DateTimeOffset.UtcNow);
       store.Add(command);
       return Results.Created($"/commands/{command.Id}", command);
   });
   ```

   > New concept — **`[FromHeader]`**: tells the model binder to take this parameter's value from a request
   > header rather than the route, query string, or body. `Name` is needed because the header is
   > `Idempotency-Key` and the parameter is `idempotencyKey` — they don't match by convention.
   > ([Parameter binding in Minimal APIs](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/parameter-binding?view=aspnetcore-10.0))

   The parameter is **`string?`, nullable, on purpose.** Declared as non-nullable `string`, the framework
   rejects a header-less request before your handler runs and you lose control of the response. Taking it as
   nullable and checking it yourself keeps the rejection yours to shape — which milestone 5 does when it gives
   this `400` a proper body.

3. In `tests/Api.Tests/CommandEndpointsTests.cs`, add this helper **inside the class, immediately after the
   constructor line** (`public CommandEndpointsTests(…) => _factory = factory;`). `PostAsJsonAsync` has no
   overload that sets a header, so building the request message by hand is the way to attach one.

   ```csharp
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
   ```

4. In the same file, in `PostCommand_ReturnsCreated_WithLocationPointingAtTheCommand`, replace the single
   `var response = await client.PostAsJsonAsync(…);` statement with the two lines below — the test now sends a
   key like any real client would.

   ```csharp
   var response = await PostCommandAsync(
       client, Guid.NewGuid().ToString(), new CreateCommandRequest("charge", "42"));
   ```

5. In the same file, in `GetCommand_AfterPost_ReturnsTheSameCommand`, replace the
   `var postResponse = await client.PostAsJsonAsync(…);` statement the same way.

   ```csharp
   var postResponse = await PostCommandAsync(
       client, Guid.NewGuid().ToString(), new CreateCommandRequest("charge", "42"));
   ```

   Each test generates its **own** key. Sharing one across tests would make them interfere the moment step 02
   starts treating a repeated key as a retry.

6. `GetCommand_UnknownId_ReturnsNotFound` needs no change — it never posts.

## Done when (this step)

- [ ] `dotnet build` → `Build succeeded`, exits 0.
- [ ] `dotnet test` → **0 failed, 4 total**, exits 0. Same four tests as milestone 2, still all
      green: you tightened the contract and updated its callers in one move.
- [ ] Sending `POST /commands` **without** the header now yields `400` — proven by the test added in step 03,
      not yet.

## If it breaks

- **`CS0246: The type or namespace name 'FromHeaderAttribute' could not be found`** → the
  `using Microsoft.AspNetCore.Mvc;` line is missing from `Program.cs`.
- **`CS0246` on `JsonContent`** in the test file → `using System.Net.Http.Json;` is already at the top of that
  file from milestone 2; check it wasn't removed.
- **Both post tests fail with `400 BadRequest`** → the helper is defined but the tests still call
  `client.PostAsJsonAsync`. Actions 4 and 5 replace those calls.
- **The build fails on the lambda with "no best type found for conditional"** → one `return` path returns
  something that isn't an `IResult`. Every branch must return a `Results.…` value.

---
> Nav: — · [Overview](00_overview.md) · [Replay the stored response →](02_replay-the-stored-response.md)
