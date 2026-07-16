# Milestone 2 · Step 04 of 4 — Verify the milestone
> Nav: [← CORS](03_cors.md) · [Overview](00_overview.md) · [M3 Backend tests →](../MILESTONE_3_backend-tests/00_overview.md)

## Done-when gate (the whole milestone)
Start the API (`dotnet run` from `backend/Api`), then run these in order. **On Windows PowerShell, use
`curl.exe`** (plain `curl` is an alias for `Invoke-WebRequest` with different syntax).

1. **Create** — the two seed todos are ids 1 and 2, so the new one is id 3:
   ```bash
   curl -i -X POST http://localhost:5080/api/todos \
     -H "Content-Type: application/json" -d '{"title":"Test"}'
   ```
   Expect `201 Created`, a `Location: /api/todos/3` header, and body:
   ```json
   {"id":3,"title":"Test","isDone":false}
   ```
2. **Update** (edit title + mark done):
   ```bash
   curl -X PUT http://localhost:5080/api/todos/3 \
     -H "Content-Type: application/json" -d '{"title":"Test edited","isDone":true}'
   ```
   Expect `200` and `{"id":3,"title":"Test edited","isDone":true}`.
3. **Toggle**:
   ```bash
   curl -X PATCH http://localhost:5080/api/todos/3/toggle
   ```
   Expect `200` and `isDone` back to `false`: `{"id":3,"title":"Test edited","isDone":false}`.
4. **Delete**, then confirm it's gone:
   ```bash
   curl -i -X DELETE http://localhost:5080/api/todos/3
   curl -i http://localhost:5080/api/todos/3
   ```
   Expect `204 No Content` on the delete, then `404 Not Found` on the read.
5. **CORS header**:
   ```bash
   curl -i -X OPTIONS http://localhost:5080/api/todos \
     -H "Origin: http://localhost:8100" -H "Access-Control-Request-Method: POST"
   ```
   Response headers include `Access-Control-Allow-Origin: http://localhost:8100`.

- [ ] All five checks match. The backend is now feature-complete.

## Files after this milestone
```csharp
// backend/Api/Dtos.cs
public record CreateTodoDto(string Title);
public record UpdateTodoDto(string Title, bool IsDone);
```

```csharp
// backend/Api/TodoEndpoints.cs
using Microsoft.EntityFrameworkCore;

public static class TodoEndpoints
{
    public static RouteGroupBuilder MapTodoEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/todos");

        // List all
        group.MapGet("/", async (TodoDb db) =>
            TypedResults.Ok(await db.Todos.ToListAsync()));

        // Read one
        group.MapGet("/{id:int}", async (int id, TodoDb db) =>
            await db.Todos.FindAsync(id) is Todo todo
                ? Results.Ok(todo)
                : Results.NotFound());

        // Create
        group.MapPost("/", async (CreateTodoDto dto, TodoDb db) =>
        {
            var todo = new Todo { Title = dto.Title, IsDone = false };
            db.Todos.Add(todo);
            await db.SaveChangesAsync();
            return TypedResults.Created($"/api/todos/{todo.Id}", todo);
        });

        // Update (full replace of the editable fields)
        group.MapPut("/{id:int}", async (int id, UpdateTodoDto dto, TodoDb db) =>
        {
            var todo = await db.Todos.FindAsync(id);
            if (todo is null) return Results.NotFound();
            todo.Title = dto.Title;
            todo.IsDone = dto.IsDone;
            await db.SaveChangesAsync();
            return Results.Ok(todo);
        });

        // Toggle done
        group.MapPatch("/{id:int}/toggle", async (int id, TodoDb db) =>
        {
            var todo = await db.Todos.FindAsync(id);
            if (todo is null) return Results.NotFound();
            todo.IsDone = !todo.IsDone;
            await db.SaveChangesAsync();
            return Results.Ok(todo);
        });

        // Delete
        group.MapDelete("/{id:int}", async (int id, TodoDb db) =>
        {
            var todo = await db.Todos.FindAsync(id);
            if (todo is null) return Results.NotFound();
            db.Todos.Remove(todo);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

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

builder.Services.AddCors(options =>
    options.AddPolicy("frontend", policy =>
        policy.WithOrigins("http://localhost:8100")
              .AllowAnyHeader()
              .AllowAnyMethod()));

var app = builder.Build();

app.UseCors("frontend");

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

(`Todo.cs`, `TodoDb.cs`, `Api.csproj`, and `launchSettings.json` are unchanged from
[M1's checkpoint](../MILESTONE_1_backend-read/05_verify.md#files-after-this-milestone).)

## Troubleshooting
- **`405 Method Not Allowed`** — the verb/route doesn't match; check the toggle route is `/{id}/toggle` and
  you used `PATCH`.
- **New todo isn't id 3** — you added or deleted extras while testing. Restart `dotnet run` to reset the
  in-memory store to the two seeds, then the next create is id 3.
- **`Location` header missing** — you used `Results.Ok` on create instead of `TypedResults.Created`.

## Next
→ [M3 — Backend tests (xUnit v3)](../MILESTONE_3_backend-tests/00_overview.md)

---
> Nav: [← CORS](03_cors.md) · [Overview](00_overview.md) · [M3 Backend tests →](../MILESTONE_3_backend-tests/00_overview.md)
