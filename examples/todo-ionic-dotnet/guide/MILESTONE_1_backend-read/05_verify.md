# Milestone 1 · Step 05 of 5 — Verify the milestone
> Nav: [← Program & seed](04_program-seed-run.md) · [Overview](00_overview.md) · [M2 Backend CRUD + CORS →](../MILESTONE_2_backend-crud-cors/00_overview.md)

## Done-when gate (the whole milestone)
1. **Start the API** — from `backend/Api`, run `dotnet run`. Expect:
   ```text
   Now listening on: http://localhost:5080
   ```
2. **Hit the list endpoint** — in another terminal:
   ```bash
   curl http://localhost:5080/api/todos
   ```
   Expect HTTP 200 and this exact body (whitespace may differ):
   ```json
   [{"id":1,"title":"Buy groceries","isDone":false},{"id":2,"title":"Walk the dog","isDone":true}]
   ```
   - [ ] Two todos come back, ids `1` and `2`, field names in **camelCase** (`isDone`, not `IsDone`).
3. **Confirm it's live data** — stop the API (Ctrl+C), re-run `dotnet run`, curl again: the same two todos
   return (re-seeded). Any todos you might have added would be gone — confirming the store is in-memory.

## Files after this milestone
```csharp
// backend/Api/Todo.cs
public class Todo
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public bool IsDone { get; set; }
}
```

```csharp
// backend/Api/TodoDb.cs
using Microsoft.EntityFrameworkCore;

public class TodoDb(DbContextOptions<TodoDb> options) : DbContext(options)
{
    public DbSet<Todo> Todos => Set<Todo>();
}
```

```csharp
// backend/Api/TodoEndpoints.cs
using Microsoft.EntityFrameworkCore;

public static class TodoEndpoints
{
    public static RouteGroupBuilder MapTodoEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/todos");

        group.MapGet("/", async (TodoDb db) =>
            TypedResults.Ok(await db.Todos.ToListAsync()));

        return group;
    }
}
```

```csharp
// backend/Api/Program.cs
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<TodoDb>(options =>
    options.UseInMemoryDatabase("todos"));

var app = builder.Build();

// Seed the in-memory store on startup (it resets every run).
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TodoDb>();
    if (!db.Todos.Any())
    {
        db.Todos.AddRange(
            new Todo { Title = "Buy groceries", IsDone = false },
            new Todo { Title = "Walk the dog", IsDone = true });
        db.SaveChanges();
    }
}

app.MapTodoEndpoints();

app.Run();

// Exposes the entry point to the test project (M3). Required by WebApplicationFactory<Program>.
public partial class Program { }
```

```json
// backend/Api/Properties/launchSettings.json
{
  "$schema": "https://json.schemastore.org/launchsettings.json",
  "profiles": {
    "http": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": false,
      "applicationUrl": "http://localhost:5080",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

```xml
<!-- backend/Api/Api.csproj -->
<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="10.0.9" />
  </ItemGroup>

</Project>
```

## Troubleshooting
- **404 on `/api/todos`** — `app.MapTodoEndpoints()` is missing from `Program.cs`, or the route group prefix
  isn't `/api/todos`.
- **Empty array `[]`** — the seed block didn't run (it's after `app.Run()`, or guarded wrong). It must sit
  between `builder.Build()` and `app.Run()`.
- **`PascalCase` field names in the JSON** — you added a custom JSON naming policy; remove it. The default is
  camelCase, which is what the frontend expects.

## Next
→ [M2 — Backend full CRUD + CORS](../MILESTONE_2_backend-crud-cors/00_overview.md)

---
> Nav: [← Program & seed](04_program-seed-run.md) · [Overview](00_overview.md) · [M2 Backend CRUD + CORS →](../MILESTONE_2_backend-crud-cors/00_overview.md)
