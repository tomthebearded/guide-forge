# M2 · Step 03 of 05 — Add the POST and GET endpoints
> Nav: [← Add the in-memory store](02_the-in-memory-store.md) · [Overview](00_overview.md) · [Test the round trip →](04_the-round-trip-test.md)

## Why / design

Two endpoints, and the interesting one is `POST`. Creating a resource over HTTP has a contract that predates
this guide by decades: answer **`201 Created`** — the status that means "I made something new" rather than a
plain `200 OK` — and include a **`Location` header**, the response header naming the URL the new thing now
lives at. Clients — and the test in step 04 — rely on it, so `Location` is **load-bearing**: it must be the
exact path `GET` serves the command from, or a client that follows it gets a 404.

The route also declares what an id looks like. `{id:guid}` is a **route constraint**: a rule attached to a
route parameter that a request must satisfy to match it at all, so a segment that isn't a GUID never reaches
the handler and the handler never has to parse or validate it.
([Routing in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/routing?view=aspnetcore-10.0))

## Before you start

Step 02 complete: `InMemoryCommandStore` exists and is registered as a singleton.

## Do this

1. In `src/Api/Program.cs`, add the create endpoint **immediately below the existing `/health` line** and
   above `app.Run();`.

   ```csharp
   app.MapPost("/commands", (CreateCommandRequest request, InMemoryCommandStore store) =>
   {
       var command = new Command(Guid.NewGuid(), request.Type, request.Payload, DateTimeOffset.UtcNow);
       store.Add(command);
       return Results.Created($"/commands/{command.Id}", command);
   });
   ```

   The handler's two parameters come from different places, and ASP.NET Core works out which is which:
   `CreateCommandRequest` is a complex type with no matching route or query value, so it's bound from the
   **JSON request body**; `InMemoryCommandStore` is a registered service, so it's resolved from **DI**. You
   don't annotate either.

   `Results.Created(uri, value)` does both jobs at once — sets the `201` status *and* the `Location` header to
   the uri you pass, then serializes `value` as the body.
   ([Parameter binding](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/parameter-binding?view=aspnetcore-10.0) ·
   [Results and return types](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/responses?view=aspnetcore-10.0))

2. Add the read endpoint directly below it, still above `app.Run();`.

   ```csharp
   app.MapGet("/commands/{id:guid}", (Guid id, InMemoryCommandStore store) =>
       store.FindById(id) is { } command ? Results.Ok(command) : Results.NotFound());
   ```

   `Results.NotFound()` returns a bare `404` with no body for now. Milestone 5 gives it a proper
   `ProblemDetails` body; here the status code is all the gate needs.

3. Check the shape of what you've built by reading the file top to bottom: the `using`, the builder, the
   service registration, `Build()`, three `Map…` calls, then `app.Run();` as the last line. Every later step
   adds to the middle of that skeleton and nothing rearranges it.

## Done when (this step)

- [ ] `dotnet build` → `Build succeeded`, exits 0.
- [ ] `dotnet test` → **0 failed, 1 total**, exits 0 (still just the health test — step 04 adds the ones that
      exercise this).
- [ ] `src/Api/Program.cs` contains exactly three `app.Map…` calls, in the order `/health`, `POST /commands`,
      `GET /commands/{id:guid}`.

## If it breaks

- **`CS0246` on `CreateCommandRequest` or `Command`** → `using Api;` is missing from the top of `Program.cs`.
- **A startup exception naming `InMemoryCommandStore`** with "Unable to resolve service" → step 02's
  `AddSingleton` line is missing or sits below `builder.Build()`.
- **The route `/commands/{id}` returns 404 for a valid GUID** → you dropped the `:guid` constraint *and* the
  parameter type no longer matches, or you wrote `{commandId:guid}` while the handler parameter is named `id`.
  The route parameter name and the handler parameter name must match exactly.

---
> Nav: [← Add the in-memory store](02_the-in-memory-store.md) · [Overview](00_overview.md) · [Test the round trip →](04_the-round-trip-test.md)
