# M4 · Step 05 of 05 — Verify
> Nav: [← Prove it survives a restart](04_the-restart-test.md) · [Overview](00_overview.md) · [Errors and conflict →](../MILESTONE_5_errors-and-conflict/00_overview.md)

## Done when (this milestone)

From the solution folder:

```
dotnet test
```

- [ ] Exits **0**; the summary line reports **0 failed, 9 total**.
- [ ] Run it **again**. Still **0 failed, 9 total** — a durable store that leaked between runs would fail the
      second time, and that is the failure this milestone is most likely to introduce.
- [ ] `Command_IsOnDisk_AndReadableFromAFreshlyBuiltApplication` passes — both halves: the bytes are in
      `commands.jsonl`, and a freshly built application serves the command.
- [ ] `IdempotencyKey_StillReplays_AfterAReload` passes — the key survived too, so a retry after a restart is
      still one command.
- [ ] `dotnet build` reports `Build succeeded` and exits **0**.
- [ ] You have watched the durability gate fail once (step 04, action 3) — two tests red, the first of them on
      a `FileNotFoundException` rather than an assertion — and pass again.

## Files after this milestone

### `src/Api/Program.cs`

```csharp
using Api;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<ICommandStore>(_ => new FileCommandStore(
    builder.Configuration["DataDirectory"] ?? Path.Combine(AppContext.BaseDirectory, "data")));

var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new HealthResponse("ok")));

app.MapPost("/commands", (
    CreateCommandRequest request,
    [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey,
    ICommandStore store) =>
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

app.MapGet("/commands/{id:guid}", (Guid id, ICommandStore store) =>
    store.FindById(id) is { } command ? Results.Ok(command) : Results.NotFound());

app.Run();
```

### `src/Api/Contracts.cs`

```csharp
namespace Api;

public record HealthResponse(string Status);

public record CreateCommandRequest(string Type, string Payload);

public record Command(Guid Id, string Type, string Payload, DateTimeOffset CreatedAtUtc);

public record StoredCommand(string IdempotencyKey, Command Command);
```

### `src/Api/ICommandStore.cs`

```csharp
namespace Api;

public interface ICommandStore
{
    void Add(string idempotencyKey, Command command);

    Command? FindById(Guid id);

    Command? FindByKey(string idempotencyKey);

    IReadOnlyList<Command> All();
}
```

### `src/Api/FileCommandStore.cs`

```csharp
using System.Collections.Concurrent;
using System.Text.Json;

namespace Api;

public sealed class FileCommandStore : ICommandStore
{
    private readonly string _filePath;
    private readonly ConcurrentDictionary<Guid, Command> _commandsById = new();
    private readonly ConcurrentDictionary<string, Guid> _commandIdsByKey = new();
    private readonly Lock _appendLock = new();

    public FileCommandStore(string dataDirectory)
    {
        Directory.CreateDirectory(dataDirectory);
        _filePath = Path.Combine(dataDirectory, "commands.jsonl");
        LoadFromDisk();
    }

    public void Add(string idempotencyKey, Command command)
    {
        var line = JsonSerializer.Serialize(new StoredCommand(idempotencyKey, command));

        lock (_appendLock)
        {
            File.AppendAllText(_filePath, line + "\n");
        }

        _commandsById[command.Id] = command;
        _commandIdsByKey[idempotencyKey] = command.Id;
    }

    public Command? FindById(Guid id) =>
        _commandsById.TryGetValue(id, out var command) ? command : null;

    public Command? FindByKey(string idempotencyKey) =>
        _commandIdsByKey.TryGetValue(idempotencyKey, out var id) ? FindById(id) : null;

    public IReadOnlyList<Command> All() => _commandsById.Values.ToList();

    private void LoadFromDisk()
    {
        if (!File.Exists(_filePath))
        {
            return;
        }

        foreach (var line in File.ReadAllLines(_filePath))
        {
            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            var entry = JsonSerializer.Deserialize<StoredCommand>(line);
            if (entry is null)
            {
                continue;
            }

            _commandsById[entry.Command.Id] = entry.Command;
            _commandIdsByKey[entry.IdempotencyKey] = entry.Command.Id;
        }
    }
}
```

### `tests/Api.Tests/IdempotencyTests.cs`

```csharp
using System.Net;
using System.Net.Http.Json;
using Api;
using Microsoft.AspNetCore.Hosting;
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

    private static WebApplicationFactory<Program> CreateFactory(string dataDirectory) =>
        new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder => builder.UseSetting("DataDirectory", dataDirectory));

    private static string NewTempDataDirectory() =>
        Path.Combine(Path.GetTempPath(), $"idempotent-api-tests-{Guid.NewGuid()}");

    [Fact]
    public async Task PostCommand_SameKeyTwice_ReplaysResponseAndStoresOneCommand()
    {
        var dataDirectory = NewTempDataDirectory();
        await using var factory = CreateFactory(dataDirectory);
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

        var store = factory.Services.GetRequiredService<ICommandStore>();
        Assert.Single(store.All());

        Directory.Delete(dataDirectory, recursive: true);
    }

    [Fact]
    public async Task PostCommand_DifferentKeys_StoreTwoCommands()
    {
        var dataDirectory = NewTempDataDirectory();
        await using var factory = CreateFactory(dataDirectory);
        var client = factory.CreateClient();
        var request = new CreateCommandRequest("charge", "42");

        await PostCommandAsync(client, Guid.NewGuid().ToString(), request);
        await PostCommandAsync(client, Guid.NewGuid().ToString(), request);

        var store = factory.Services.GetRequiredService<ICommandStore>();
        Assert.Equal(2, store.All().Count);

        Directory.Delete(dataDirectory, recursive: true);
    }

    [Fact]
    public async Task PostCommand_WithoutKey_ReturnsBadRequest()
    {
        var dataDirectory = NewTempDataDirectory();
        await using var factory = CreateFactory(dataDirectory);
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/commands", new CreateCommandRequest("charge", "42"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        Directory.Delete(dataDirectory, recursive: true);
    }
}
```

### `tests/Api.Tests/DurabilityTests.cs`

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

### Deleted this milestone

`src/Api/InMemoryCommandStore.cs` — removed in step 03 once `FileCommandStore` took its registration.

### Unchanged this milestone

`tests/Api.Tests/HealthEndpointTests.cs` and `tests/Api.Tests/CommandEndpointsTests.cs` are exactly as
milestones 1 and 3 left them. No `.csproj` or `.sln` changed.

## Troubleshooting

| Symptom | Usual cause | First thing to check |
|---|---|---|
| Green once, red on the second run | Tests share a data directory | Every test calls `NewTempDataDirectory()`; step 03, action 5 |
| `FileNotFoundException` on `commands.jsonl` | App and test disagree on the directory | The key is spelled `DataDirectory` in both places |
| Retry after reload creates a second command | `LoadFromDisk` restores ids but not keys | It must populate `_commandIdsByKey` too |
| Reread returns `404` | Store constructed against a different path | The constructor calls `LoadFromDisk` — check the path passed in |
| `IOException: cannot access the file` | First factory not disposed before the file read | The first factory needs the `await using (…) { }` block form |
| `Unable to resolve service for 'InMemoryCommandStore'` | Leftover reference to the deleted class | Search the test project for the old type name |

## Handoff

**You now have:** everything from milestones 1–3, plus an `ICommandStore` seam, a `FileCommandStore` that
appends JSON Lines and replays them on startup, a configurable `DataDirectory`, tests that each own a
throwaway directory, and nine passing tests — two of which prove durability from both ends, the file and a
freshly built application.

**Open:** the service's error responses are still bare status codes with no body, and reusing an idempotency
key with a *different* payload still replays the first command instead of objecting.

**Next:** [Milestone 5 — Errors, validation, conflict](../MILESTONE_5_errors-and-conflict/00_overview.md),
which gives every failure a `ProblemDetails` body and turns key reuse with a changed payload into a `409`.

---
> Nav: [← Prove it survives a restart](04_the-restart-test.md) · [Overview](00_overview.md) · [Errors and conflict →](../MILESTONE_5_errors-and-conflict/00_overview.md)
