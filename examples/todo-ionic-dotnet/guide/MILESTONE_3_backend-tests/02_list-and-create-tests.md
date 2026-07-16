# Milestone 3 · Step 02 of 4 — Test the read + create paths
> Nav: [← Create test project](01_create-test-project.md) · [Overview](00_overview.md) · [Update/toggle/delete tests →](03_update-toggle-delete-tests.md)

## Why / design
`WebApplicationFactory<Program>.CreateClient()` returns an `HttpClient` wired to the in-process app — no port,
no `dotnet run`. `IClassFixture<WebApplicationFactory<Program>>` shares one factory (one in-memory store)
across the class, so each test **creates its own todo and asserts on that**, never on exact list counts. The
`System.Net.Http.Json` helpers (`GetFromJsonAsync`, `PostAsJsonAsync`, `ReadFromJsonAsync`) do the JSON work.

## Do this
1. **Create `backend/Api.Tests/TodosApiTests.cs`** with the class below (list + create tests). The `Todo` type
   comes from the referenced `Api` project.

## Code
```csharp
// backend/Api.Tests/TodosApiTests.cs
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

public class TodosApiTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory = factory;

    [Fact]
    public async Task Get_ReturnsSeededTodos()
    {
        var client = _factory.CreateClient();

        var todos = await client.GetFromJsonAsync<List<Todo>>("/api/todos");

        Assert.NotNull(todos);
        Assert.Contains(todos!, t => t.Title == "Buy groceries");
    }

    [Fact]
    public async Task Post_CreatesTodo()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/todos", new { title = "Write tests" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<Todo>();
        Assert.NotNull(created);
        Assert.True(created!.Id > 0);
        Assert.Equal("Write tests", created.Title);
        Assert.False(created.IsDone);
    }
}
```

The class uses a **primary constructor** (C# 14) to receive the injected factory — equivalent to a
constructor that assigns `_factory`.

## Done when (this step)
- [ ] `dotnet test` (from `backend/Api.Tests`) runs **2 tests, both passing**:
  ```text
  Passed!  - Failed: 0, Passed: 2, Skipped: 0
  ```

## If it breaks
- **`The type or namespace name 'Program' could not be found`** — the `public partial class Program { }` line
  is missing from `backend/Api/Program.cs` (added in [M1 step 04](../MILESTONE_1_backend-read/04_program-seed-run.md)).
- **`The type or namespace name 'Todo' could not be found`** — the project reference to `Api.csproj` is
  missing; re-run `dotnet add reference ../Api/Api.csproj`.
- **Compile error on `GetFromJsonAsync`** — add `using System.Net.Http.Json;` (it's in the shared framework,
  no package needed).

---
> Nav: [← Create test project](01_create-test-project.md) · [Overview](00_overview.md) · [Update/toggle/delete tests →](03_update-toggle-delete-tests.md)
