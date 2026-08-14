# M1 · Step 05 of 05 — Verify
> Nav: [← Write the first integration test](04_first-integration-test.md) · [Overview](00_overview.md) · [Accept a command →](../MILESTONE_2_accept-and-read-back/00_overview.md)

## Done when (this milestone)

Run this from the solution folder — the one holding `IdempotentApi.sln`:

```
dotnet test
```

- [ ] The command exits **0** and reports **0 failed, 1 total**.
- [ ] The one passing test is `GetHealth_ReturnsOk_WithStatusOkBody`. Confirm the name, not just the count:
      a suite of one test that isn't yours proves nothing.
- [ ] `dotnet build` reports `Build succeeded` and exits **0**.

That is the whole gate. From here on, this same command is the gate for every milestone — what changes is how
many tests it runs and what they assert.

## Files after this milestone

Complete current contents of every file **you wrote by hand** this milestone. The files the templates and the
`dotnet` commands generated are named below instead, with the one thing worth checking in each. Diff against
these if you suspect you've drifted.

### `src/Api/Program.cs`

```csharp
var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new HealthResponse("ok")));

app.Run();

public record HealthResponse(string Status);
```

### `tests/Api.Tests/HealthEndpointTests.cs`

```csharp
using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Api.Tests;

public class HealthEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public HealthEndpointTests(WebApplicationFactory<Program> factory) => _factory = factory;

    [Fact]
    public async Task GetHealth_ReturnsOk_WithStatusOkBody()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("{\"status\":\"ok\"}", await response.Content.ReadAsStringAsync());
    }
}
```

### Generated files, unchanged

`IdempotentApi.sln`, `src/Api/Api.csproj` and `tests/Api.Tests/Api.Tests.csproj` are as the templates and the
`dotnet add` commands produced them. The only thing to check in the test project's `.csproj` is that it carries
both the `<ProjectReference>` to `Api.csproj` and the `<PackageReference>` to
`Microsoft.AspNetCore.Mvc.Testing`. `tests/Api.Tests/UnitTest1.cs` was **deleted** in step 04.

## Troubleshooting

| Symptom | Usual cause | First thing to check |
|---|---|---|
| `total: 2` instead of `1` | `UnitTest1.cs` still exists | Delete it (step 04, action 1) |
| `CS0122: 'Program' is inaccessible` | You are not on .NET 10 — earlier SDKs generate an internal `Program` | `dotnet --version` against [../foundation/stack.md](../foundation/stack.md) |
| `No test source files were specified` | Ran `dotnet test` from inside a project folder | Run it from the solution folder |
| Body assertion fails, response empty | Route mismatch between test and endpoint | Both must read `/health` exactly |
| Package restored a `9.x` version | Test project isn't targeting `net10.0` | `<TargetFramework>` in `Api.Tests.csproj` |

## Handoff

**You now have:** a two-project solution (`src/Api`, `tests/Api.Tests`) that builds clean; an API answering
`GET /health` with `{"status":"ok"}`; and a working in-process integration test harness —
`WebApplicationFactory<Program>` booting the app inside the test process, naming the entry point the .NET 10
compiler already generates as public.

**Open:** nothing. The app stores nothing, accepts nothing, and knows nothing about commands or idempotency.

**Next:** [Milestone 2 — Accept a command, read it back](../MILESTONE_2_accept-and-read-back/00_overview.md),
which adds `POST /commands` and `GET /commands/{id}` and proves the write/read contract holds over real HTTP.

---
> Nav: [← Write the first integration test](04_first-integration-test.md) · [Overview](00_overview.md) · [Accept a command →](../MILESTONE_2_accept-and-read-back/00_overview.md)
