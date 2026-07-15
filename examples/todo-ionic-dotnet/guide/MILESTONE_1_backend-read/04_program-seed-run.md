# Milestone 1 · Step 04 of 5 — Wire up `Program.cs`: register, seed, run
> Nav: [← GET endpoint](03_endpoints-get.md) · [Overview](00_overview.md) · [Verify →](05_verify.md)

## Why / design
`Program.cs` does four things: registers `TodoDb` with the InMemory provider, builds the app, seeds two todos
on startup (so `GET` returns something on a fresh run), and maps the endpoints. The trailing
`public partial class Program { }` makes the top-level `Program` type visible to the M3 test project — it's a
required line for `WebApplicationFactory<Program>`, not decoration.

The seed runs inside a DI scope because `DbContext` is scoped, not singleton. It only inserts when the store
is empty, so restarts re-seed cleanly (the InMemory store is wiped each run anyway).

## Do this
1. **Open `backend/Api/Program.cs`** and replace its entire contents (the scaffolded "Hello World") with the
   file below.
2. **Run it:** `dotnet run` from `backend/Api`.

## Code
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

The database name `"todos"` is free to rename, but if you do, change it nowhere-else-matters (it's internal
to EF). The seed titles `"Buy groceries"` / `"Walk the dog"` are **illustrative** — change them freely, but
the verify step expects these exact strings, so keep them to match the checkpoint.

## Done when (this step)
- [ ] `dotnet run` logs:
  ```text
  Now listening on: http://localhost:5080
  Application started. Press Ctrl+C to shut down.
  ```

## If it breaks
- **`InvalidOperationException: Unable to resolve service for type 'TodoDb'`** — `AddDbContext<TodoDb>` is
  missing or misspelled. It must run on `builder.Services` before `builder.Build()`.
- **Seed throws on startup** — you called `CreateScope()` after `app.Run()`; the seed block must sit between
  `builder.Build()` and `app.Run()`.
