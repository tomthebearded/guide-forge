# Milestone 3 · Step 03 of 4 — Test update, toggle, delete, and 404
> Nav: [← Read + create tests](02_list-and-create-tests.md) · [Overview](00_overview.md) · [Verify →](04_verify.md)

## Why / design
Four more tests complete the coverage. Update/toggle/delete each **create a fresh todo first**, capture its
server-assigned `id` from the response, then act on that id — so they never depend on seed ids or on each
other. The 404 test hits a nonexistent id.

## Do this
1. **Open `backend/Api.Tests/TodosApiTests.cs`** and replace its contents with the full version below — the
   two step-02 tests are unchanged; four new tests are appended.

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

    [Fact]
    public async Task Put_UpdatesTitleAndDone()
    {
        var client = _factory.CreateClient();
        var created = await CreateTodoAsync(client, "before");

        var response = await client.PutAsJsonAsync(
            $"/api/todos/{created.Id}", new { title = "after", isDone = true });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.Content.ReadFromJsonAsync<Todo>();
        Assert.Equal("after", updated!.Title);
        Assert.True(updated.IsDone);
    }

    [Fact]
    public async Task Patch_TogglesDone()
    {
        var client = _factory.CreateClient();
        var created = await CreateTodoAsync(client, "toggle me");
        Assert.False(created.IsDone);

        var response = await client.PatchAsync($"/api/todos/{created.Id}/toggle", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var toggled = await response.Content.ReadFromJsonAsync<Todo>();
        Assert.True(toggled!.IsDone);
    }

    [Fact]
    public async Task Delete_RemovesTodo()
    {
        var client = _factory.CreateClient();
        var created = await CreateTodoAsync(client, "delete me");

        var delete = await client.DeleteAsync($"/api/todos/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);

        var get = await client.GetAsync($"/api/todos/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, get.StatusCode);
    }

    [Fact]
    public async Task Get_UnknownId_Returns404()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/todos/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // Helper: create a todo and return it (with its server-assigned id).
    private static async Task<Todo> CreateTodoAsync(HttpClient client, string title)
    {
        var response = await client.PostAsJsonAsync("/api/todos", new { title });
        return (await response.Content.ReadFromJsonAsync<Todo>())!;
    }
}
```

## Done when (this step)
- [ ] `dotnet test` runs **6 tests, all passing**:
  ```text
  Passed!  - Failed: 0, Passed: 6, Skipped: 0
  ```

## If it breaks
- **`PatchAsync` / `PutAsJsonAsync` not found** — `PatchAsync` is on `HttpClient` (framework); `PutAsJsonAsync`
  needs `using System.Net.Http.Json;` (already at the top of the file).
- **A test fails intermittently** — you added a count-based assertion; because the store is shared per class,
  assert on your own created todo, not on the total number of todos.
