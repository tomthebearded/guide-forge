# Milestone 1 · Step 03 of 5 — Add the GET endpoint
> Nav: [← Todo & DbContext](02_todo-and-dbcontext.md) · [Overview](00_overview.md) · [Program & seed →](04_program-seed-run.md)

## Why / design
Per [conventions](../foundation/conventions.md#backend-c-rules), endpoints live in a `TodoEndpoints`
extension method grouped under `/api/todos`, keeping `Program.cs` thin. We start with the list endpoint; M2
adds the rest to this same file. `MapGet("/")` on the group resolves to `GET /api/todos`.

## Do this
1. **Create `backend/Api/TodoEndpoints.cs`** with the extension below. It defines `MapTodoEndpoints`, creates
   the `/api/todos` route group, and maps the list handler. `TodoDb` is injected straight into the handler by
   the DI container. `TypedResults.Ok(...)` returns 200 with the JSON-serialized list.

## Code
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

## Done when (this step)
- [ ] `backend/Api/TodoEndpoints.cs` exists.
- [ ] `dotnet build` still prints `Build succeeded in ~N.Ns` (same form as M1/02 — no errors, no warnings).
      (The endpoint isn't wired into `Program.cs` yet — that's the next step — so hitting the URL now would
      still 404. Building is the check here.)

## If it breaks
- **`'WebApplication' does not contain a definition for 'MapGroup'`** — you're on an older ASP.NET Core; confirm
  `Api.csproj` targets `net10.0` (step 01).
