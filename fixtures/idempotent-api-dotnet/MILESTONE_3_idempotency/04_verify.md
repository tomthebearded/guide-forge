# M3 · Step 04 of 04 — Verify
> Nav: [← Prove it: the idempotency tests](03_the-idempotency-test.md) · [Overview](00_overview.md) · [Durability →](../MILESTONE_4_durability/00_overview.md)

## Done when (this milestone)

From the solution folder:

```
dotnet test
```

- [ ] Exits **0**; the summary line reports **0 failed, 7 total**.
- [ ] `PostCommand_SameKeyTwice_ReplaysResponseAndStoresOneCommand` passes — this is the milestone. Both
      halves of the claim are in it: the two response bodies are byte-identical **and** the store holds
      exactly one command.
- [ ] `PostCommand_DifferentKeys_StoreTwoCommands` passes — the feature doesn't over-apply.
- [ ] `PostCommand_WithoutKey_ReturnsBadRequest` passes — the key is genuinely required.
- [ ] `dotnet build` reports `Build succeeded` and exits **0**.
- [ ] You have watched the gate **fail** once (step 03, action 3) and pass again.

> **This is the reality-check gate.** Stop here and read what you built before continuing. The service is now
> genuinely useful: a client can retry safely. Milestones 4 and 5 make it durable and well-mannered, but if
> the design is wrong, this is the cheapest moment to find out.

## Files after this milestone

### `src/Api/Program.cs`

```csharp
using Api;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<InMemoryCommandStore>();

var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new HealthResponse("ok")));

app.MapPost("/commands", (
    CreateCommandRequest request,
    [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey,
    InMemoryCommandStore store) =>
{
    if (string.IsNullOrWhiteSpace(idempotencyKey))
    {
        return Results.BadRequest();
    }

    if (store.FindByKey(idempotencyKey) is { } existing)
    {
        return Results.Created($"/commands/{existing.Id}", existing);
    }

    var command = new Command(Guid.NewGuid(), request.Type, request.Payload, DateTimeOffset.UtcNow);
    store.Add(idempotencyKey, command);
    return Results.Created($"/commands/{command.Id}", command);
});

app.MapGet("/commands/{id:guid}", (Guid id, InMemoryCommandStore store) =>
    store.FindById(id) is { } command ? Results.Ok(command) : Results.NotFound());

app.Run();
```

### `src/Api/InMemoryCommandStore.cs`

```csharp
using System.Collections.Concurrent;

namespace Api;

public sealed class InMemoryCommandStore
{
    private readonly ConcurrentDictionary<Guid, Command> _commandsById = new();
    private readonly ConcurrentDictionary<string, Guid> _commandIdsByKey = new();

    public void Add(string idempotencyKey, Command command)
    {
        _commandsById[command.Id] = command;
        _commandIdsByKey[idempotencyKey] = command.Id;
    }

    public Command? FindById(Guid id) =>
        _commandsById.TryGetValue(id, out var command) ? command : null;

    public Command? FindByKey(string idempotencyKey) =>
        _commandIdsByKey.TryGetValue(idempotencyKey, out var id) ? FindById(id) : null;

    public IReadOnlyList<Command> All() => _commandsById.Values.ToList();
}
```

### `tests/Api.Tests/CommandEndpointsTests.cs`

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
    public async Task PostCommand_ReturnsCreated_WithLocationPointingAtTheCommand()
    {
        var client = _factory.CreateClient();

        var response = await PostCommandAsync(
            client, Guid.NewGuid().ToString(), new CreateCommandRequest("charge", "42"));

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
        var postResponse = await PostCommandAsync(
            client, Guid.NewGuid().ToString(), new CreateCommandRequest("charge", "42"));
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

### `tests/Api.Tests/IdempotencyTests.cs`

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

### Unchanged this milestone

`src/Api/Contracts.cs` and `tests/Api.Tests/HealthEndpointTests.cs` are exactly as milestones 1 and 2 left
them. No `.csproj` or `.sln` changed.

## Troubleshooting

| Symptom | Usual cause | First thing to check |
|---|---|---|
| `Assert.Single` finds 2 | Replay branch not reached | `FindByKey` uses the same key string that `Add` stored |
| Response bodies differ | Replay builds a new `Command` | Step 02, action 2 — return the stored one |
| `CS1501: No overload for 'Add' takes 1 arguments` | `Program.cs` still calls the old signature | Step 02, action 2 |
| `total: 4`, not 7 | `IdempotencyTests.cs` not saved or wrong namespace | File is in `tests/Api.Tests/`, namespace `Api.Tests` |
| `PostCommand_WithoutKey_…` returns `201` | The blank-key check was removed | Step 01, action 2 |
| Count assertions interfere between runs | Tests share one factory | These tests must each construct their own; step 03, action 2 |

## Handoff

**You now have:** everything from milestones 1–2, plus a required `Idempotency-Key` header on `POST /commands`,
a store indexed by both id and key, a replay path that returns the original `201` and `Location` for a repeated
key, and seven passing tests — three of which pin the idempotency claim from both sides.

**Open:** the store still lives in memory, so every command vanishes when the process exits. Reusing a key with
a **different** body currently replays the first command instead of complaining.

**Next:** [Milestone 4 — Durability](../MILESTONE_4_durability/00_overview.md), which moves the store to disk
and proves it with a gate that reloads the application from scratch.

---
> Nav: [← Prove it: the idempotency tests](03_the-idempotency-test.md) · [Overview](00_overview.md) · [Durability →](../MILESTONE_4_durability/00_overview.md)
