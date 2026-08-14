# M2 · Step 05 of 05 — Verify
> Nav: [← Test the round trip](04_the-round-trip-test.md) · [Overview](00_overview.md) · [Idempotency →](../MILESTONE_3_idempotency/00_overview.md)

## Done when (this milestone)

From the solution folder:

```
dotnet test
```

- [ ] Exits **0**; the summary line reports **0 failed, 4 total**.
- [ ] The four are `GetHealth_ReturnsOk_WithStatusOkBody`,
      `PostCommand_ReturnsCreated_WithLocationPointingAtTheCommand`,
      `GetCommand_AfterPost_ReturnsTheSameCommand`, and `GetCommand_UnknownId_ReturnsNotFound`.
- [ ] `dotnet build` reports `Build succeeded` and exits **0**.

## Files after this milestone

### `src/Api/Program.cs`

```csharp
using Api;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<InMemoryCommandStore>();

var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new HealthResponse("ok")));

app.MapPost("/commands", (CreateCommandRequest request, InMemoryCommandStore store) =>
{
    var command = new Command(Guid.NewGuid(), request.Type, request.Payload, DateTimeOffset.UtcNow);
    store.Add(command);
    return Results.Created($"/commands/{command.Id}", command);
});

app.MapGet("/commands/{id:guid}", (Guid id, InMemoryCommandStore store) =>
    store.FindById(id) is { } command ? Results.Ok(command) : Results.NotFound());

app.Run();
```

### `src/Api/Contracts.cs`

```csharp
namespace Api;

public record HealthResponse(string Status);

public record CreateCommandRequest(string Type, string Payload);

public record Command(Guid Id, string Type, string Payload, DateTimeOffset CreatedAtUtc);
```

### `src/Api/InMemoryCommandStore.cs`

```csharp
using System.Collections.Concurrent;

namespace Api;

public sealed class InMemoryCommandStore
{
    private readonly ConcurrentDictionary<Guid, Command> _commandsById = new();

    public void Add(Command command) => _commandsById[command.Id] = command;

    public Command? FindById(Guid id) =>
        _commandsById.TryGetValue(id, out var command) ? command : null;
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

### Unchanged this milestone

`tests/Api.Tests/HealthEndpointTests.cs` is exactly as milestone 1 left it. The `.csproj` files and the
`.sln` were not touched.

## Troubleshooting

| Symptom | Usual cause | First thing to check |
|---|---|---|
| `total: 3` | One test file wasn't saved, or a `[Fact]` is missing | Count the `[Fact]` attributes: three in `CommandEndpointsTests` |
| `Location` header null | Handler uses `Results.Ok`, not `Results.Created` | Step 03, action 1 |
| Round-trip test fails on one field | The stored command isn't the returned one | `store.Add(command)` must store the same instance returned |
| Unknown id gives `200` | `Results.Ok(null)` instead of `Results.NotFound()` | Step 03, action 2 |
| `Unable to resolve service for type 'Api.InMemoryCommandStore'` | Registration missing or after `Build()` | Step 02, action 2 |

## Handoff

**You now have:** the milestone-1 skeleton, plus three data shapes in `Contracts.cs`, an in-memory store
registered as a singleton, `POST /commands` answering `201` with a `Location` header, `GET /commands/{id:guid}`
answering `200` or `404`, and four passing tests that assert all of it over real HTTP.

**Open:** posting the same logical command twice creates two records — nothing stops a retry from duplicating
work. The store also empties on exit.

**Next:** [Milestone 3 — Idempotency](../MILESTONE_3_idempotency/00_overview.md), which makes the same
`Idempotency-Key` twice produce one record and one identical response. It is the guide's reality-check gate:
the point where the thing becomes genuinely useful and worth continuing.

---
> Nav: [← Test the round trip](04_the-round-trip-test.md) · [Overview](00_overview.md) · [Idempotency →](../MILESTONE_3_idempotency/00_overview.md)
