# Milestone 2 · Step 03 of 4 — Enable CORS for the frontend origin
> Nav: [← CRUD endpoints](02_crud-endpoints.md) · [Overview](00_overview.md) · [Verify →](04_verify.md)

## Why / design
The Ionic app runs at `http://localhost:8100`; the API at `:5080`. Different ports = different origins, so a
browser blocks the calls unless the API opts the origin in with CORS. We register a named policy `"frontend"`
and apply it with `app.UseCors("frontend")` **before** the endpoints. (In dev the frontend also proxies `/api`
so the browser sees one origin — see [decision D4](../foundation/decision-log.md#d4--dev-proxy-on-the-frontend-instead-of-relying-on-cors) — but configuring CORS keeps the API correct on its own.)

The policy name `"frontend"` is **load-bearing** in the sense that `AddPolicy` and `UseCors` must use the
same string; the string value itself is free to rename as long as both match.

## Do this
1. **Open `backend/Api/Program.cs`.** Add the `AddCors` registration after the `AddDbContext` line, and add
   `app.UseCors("frontend")` right after `builder.Build()`. Replace the file with the version below.

## Code
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

The origin `http://localhost:8100` is **load-bearing** — it must match the port `ionic serve` uses in M4. If
you later serve the frontend on a different port, update this string.

## Done when (this step)
- [ ] `dotnet run` starts cleanly.
- [ ] A pre-flight-style request echoes the allow header:
  ```bash
  curl -i -X OPTIONS http://localhost:5080/api/todos \
    -H "Origin: http://localhost:8100" \
    -H "Access-Control-Request-Method: POST"
  ```
  The response headers include:
  ```text
  Access-Control-Allow-Origin: http://localhost:8100
  ```

## If it breaks
- **No `Access-Control-Allow-Origin` header** — `app.UseCors("frontend")` is missing, is after the endpoints,
  or the policy name doesn't match `AddPolicy`.
- **Header shows `*` instead of the origin** — you used `AllowAnyOrigin()`; we deliberately name the origin so
  it's explicit.

---
> Nav: [← CRUD endpoints](02_crud-endpoints.md) · [Overview](00_overview.md) · [Verify →](04_verify.md)
