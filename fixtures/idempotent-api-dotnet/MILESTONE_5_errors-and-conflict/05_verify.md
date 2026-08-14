# M5 · Step 05 of 05 — Verify
> Nav: [← Test every failure](04_the-error-tests.md) · [Overview](00_overview.md) · —

## Done when (this milestone)

From the solution folder:

```
dotnet test
```

- [ ] Exits **0**; the summary line reports **0 failed, 14 total**.
- [ ] Run it **again**: still **0 failed, 14 total**. Every test owns its data directory, so a second run is
      identical to the first.
- [ ] Both conflict tests pass — `PostCommand_SameKeyDifferentPayload_ReturnsConflict` and
      `PostCommand_SameKeyOnlyPayloadChanged_ReturnsConflict`. The service refuses to guess whether the client
      changed everything or one field.
- [ ] `GetCommand_UnknownId_ReturnsProblemDetails` passes, including the
      `application/problem+json` content type.
- [ ] `dotnet build` reports `Build succeeded` and exits **0**.
- [ ] You have watched the conflict gate fail once (step 04, action 3) — one test red, the one that changes a
      single field — and pass again.

**This is also the guide's final gate.** All fourteen tests green means the whole thing works: an idempotent
`POST` that survives a restart and refuses contradictory reuse, proven by one command with an exit code.

## Files after this milestone

### `src/Api/Program.cs`

```csharp
using Api;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<ICommandStore>(_ => new FileCommandStore(
    builder.Configuration["DataDirectory"] ?? Path.Combine(AppContext.BaseDirectory, "data")));
builder.Services.AddProblemDetails();

var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new HealthResponse("ok")));

app.MapPost("/commands", (
    CreateCommandRequest request,
    [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey,
    ICommandStore store) =>
{
    if (string.IsNullOrWhiteSpace(idempotencyKey))
    {
        return Results.Problem(
            title: "Missing Idempotency-Key",
            detail: "POST /commands requires an Idempotency-Key header.",
            statusCode: StatusCodes.Status400BadRequest);
    }

    if (string.IsNullOrWhiteSpace(request.Type))
    {
        return Results.Problem(
            title: "Invalid command",
            detail: "'type' must be a non-empty string.",
            statusCode: StatusCodes.Status400BadRequest);
    }

    if (store.FindByKey(idempotencyKey) is { } existing)
    {
        if (existing.Type != request.Type || existing.Payload != request.Payload)
        {
            return Results.Problem(
                title: "Idempotency key reuse",
                detail: "This Idempotency-Key was already used with a different request body.",
                statusCode: StatusCodes.Status409Conflict);
        }

        return Results.Created($"/commands/{existing.Id}", existing);
    }

    var command = new Command(Guid.NewGuid(), request.Type, request.Payload, DateTimeOffset.UtcNow);
    store.Add(idempotencyKey, command);
    return Results.Created($"/commands/{command.Id}", command);
});

app.MapGet("/commands/{id:guid}", (Guid id, ICommandStore store) =>
    store.FindById(id) is { } command
        ? Results.Ok(command)
        : Results.Problem(
            title: "Command not found",
            detail: $"No command exists with id {id}.",
            statusCode: StatusCodes.Status404NotFound));

app.Run();
```

### `tests/Api.Tests/ErrorResponseTests.cs`

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

### Unchanged this milestone

`src/Api/Contracts.cs`, `src/Api/ICommandStore.cs`, `src/Api/FileCommandStore.cs` and the four earlier test
files are exactly as [milestone 4's checkpoint](../MILESTONE_4_durability/05_verify.md) rendered them.

## Troubleshooting

| Symptom | Usual cause | First thing to check |
|---|---|---|
| `ProblemDetails` deserializes to null | Endpoint still returns `Results.BadRequest()` | Step 01, action 2 |
| Content type is `application/json` | Same cause as above | `Results.Problem`, not `Results.BadRequest` |
| Empty `type` accepted with `201` | Validation placed after the store lookup | Step 02, action 1 — it goes before |
| Changed payload replays instead of `409` | Guard missing or comparison inverted | Step 03, action 1 — `!=` … `\|\|` … `!=` |
| Identical payload now returns `409` | Comparison inverted the other way | Same line; identical bodies must fall through |
| `total: 12` | One `[Fact]` missing from the new file | Four in `ErrorResponseTests` |

## Handoff

**You now have:** a complete, idempotent command API. `POST /commands` requires an `Idempotency-Key`, validates
the command, replays an identical retry with the original `201` and `Location`, and answers `409` when a key is
reused with a different body. Commands and their keys are appended to `commands.jsonl` and replayed on startup,
so all of it survives a restart. Every failure carries a `ProblemDetails` body. Thirteen integration tests
drive the real HTTP pipeline and prove each claim, and the whole suite is one command.

**Open, and deliberately so:**

- **Concurrency.** Two identical requests genuinely in flight at the same instant can both miss the key lookup
  and both create a command. The fix is a lock or an atomic insert around the check-and-add; it is out of
  scope here and named as an accepted risk in D5.
- **Key lifetime.** Keys are kept forever, so the file grows without bound. A real service expires them.
- **The store is a file.** Single-writer, whole-file replay at startup. The `ICommandStore` seam from M4 is
  where a database goes when you need one — that was the point of introducing it.
- **Payload comparison is string equality.** Semantically identical JSON that differs in whitespace or key
  order would be seen as a conflict. A production service compares a canonical hash.

**Next:** nothing — this is the last milestone. Go back to
[the guide's README](../README.md) for the whole picture, and record what you actually verified in
[../foundation/status.md](../foundation/status.md): it is the only file that gets to say this guide works,
and it should say so only once you have watched `dotnet test` go green yourself.

---
> Nav: [← Test every failure](04_the-error-tests.md) · [Overview](00_overview.md) · —
