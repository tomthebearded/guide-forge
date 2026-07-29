# Milestone 1 · Step 02 of 5 — Define the `Todo` entity and `TodoDb` context
> Nav: [← Create project](01_create-api-project.md) · [Overview](00_overview.md) · [GET endpoint →](03_endpoints-get.md)

> **This step creates 2 files, committed together:** `Todo.cs` and `TodoDb.cs`.

## Why / design
`Todo` is the EF-tracked entity and the shape that crosses the wire. Its property names are **load-bearing**:
`Id`, `Title`, `IsDone` serialize to camelCase (`id`, `title`, `isDone`) via ASP.NET Core's default
`System.Text.Json` policy, which is exactly what the TypeScript side expects — so no serializer config is
needed. See the [Todo contract](../foundation/conventions.md#the-todo-contract-load-bearing--identical-on-both-sides).

`TodoDb` is the `DbContext` exposing a single `DbSet<Todo>`. It uses the primary-constructor form (C# 14).

## Do this
1. **Create `backend/Api/Todo.cs`** (new file) with the entity below. `Title` defaults to `""` so the
   non-nullable string is always initialized.
   ```csharp
   // backend/Api/Todo.cs (new file)
   public class Todo
   {
       public int Id { get; set; }
       public string Title { get; set; } = "";
       public bool IsDone { get; set; }
   }
   ```
2. **Create `backend/Api/TodoDb.cs`** (new file) with the context below.
   ```csharp
   // backend/Api/TodoDb.cs (new file)
   using Microsoft.EntityFrameworkCore;

   public class TodoDb(DbContextOptions<TodoDb> options) : DbContext(options)
   {
       public DbSet<Todo> Todos => Set<Todo>();
   }
   ```

## Done when (this step)
- [ ] Both files exist under `backend/Api/`.
- [ ] `dotnet build` (from `backend/Api`) succeeds:
  ```text
  Build succeeded in 1.2s
  ```

## If it breaks
- **`The type or namespace 'DbContext' could not be found`** — the `using Microsoft.EntityFrameworkCore;` line
  is missing from `TodoDb.cs`, or the InMemory package from step 01 didn't restore. Re-run `dotnet restore`.

---
> Nav: [← Create project](01_create-api-project.md) · [Overview](00_overview.md) · [GET endpoint →](03_endpoints-get.md)
