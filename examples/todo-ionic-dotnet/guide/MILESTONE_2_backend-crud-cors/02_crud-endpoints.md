# Milestone 2 · Step 02 of 4 — Add the CRUD endpoints
> Nav: [← DTOs](01_dtos.md) · [Overview](00_overview.md) · [CORS →](03_cors.md)

## Why / design
We add five handlers to the existing `/api/todos` group: read-one, create, update, toggle, delete. Each write
handler loads the entity with `FindAsync`, returns `404` when it's missing, mutates, and `SaveChangesAsync`.
`POST` returns `201 Created` with a `Location` pointing at the new resource; `DELETE` returns `204 No Content`.

## Do this
1. **Open `backend/Api/TodoEndpoints.cs`** and replace its contents with the version below — the M1 `MapGet`
   is unchanged; the five new handlers are added before `return group;`.

## Code
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

The route templates (`/{id:int}`, `/{id:int}/toggle`) are **load-bearing** — the frontend service builds
exactly these URLs in M6.

## Done when (this step)
- [ ] `dotnet build` prints `Build succeeded in ~N.Ns` (same form as M1/02 — no errors) with the expanded file.
- [ ] Restart `dotnet run`; `curl -X POST http://localhost:5080/api/todos -H "Content-Type: application/json" -d "{\"title\":\"Test\"}"`
      returns a `201` with a new todo (full curl walkthrough is in the verify step).

## If it breaks
- **`415 Unsupported Media Type` on POST** — you didn't send `Content-Type: application/json`; minimal APIs
  need it to bind the JSON body to the DTO.
- **`400` with a binding error** — the JSON key case doesn't match. Send `"title"` (camelCase), matching
  `CreateTodoDto.Title`.

---
> Nav: [← DTOs](01_dtos.md) · [Overview](00_overview.md) · [CORS →](03_cors.md)
