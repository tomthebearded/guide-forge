# Milestone 2 · Step 01 of 4 — Add the request DTOs
> Nav: — · [Overview](00_overview.md) · [CRUD endpoints →](02_crud-endpoints.md)

## Why / design
Create and update take only the fields the client is allowed to set — not `Id` (server-assigned) and, for
create, not `IsDone` (always starts `false`). Two `record` DTOs express that. Responses still return the full
`Todo` entity, so the client always gets the server-assigned `id` back.

## Do this
1. **Create `backend/Api/Dtos.cs`** with the two records below.
   - `CreateTodoDto` carries just `Title` — POST bodies are `{"title":"..."}`.
   - `UpdateTodoDto` carries `Title` and `IsDone` — PUT replaces both. The property names are **load-bearing**
     (they must match the JSON keys the frontend sends).

## Code
```csharp
// backend/Api/Dtos.cs
public record CreateTodoDto(string Title);
public record UpdateTodoDto(string Title, bool IsDone);
```

## Done when (this step)
- [ ] `backend/Api/Dtos.cs` exists and `dotnet build` prints `Build succeeded in ~N.Ns` (same form as M1/02 —
      no errors).

## If it breaks
- **Build error about duplicate types** — you named a record `Todo`; the entity already owns that name. Keep
  the DTO names exactly `CreateTodoDto` / `UpdateTodoDto`.

---
> Nav: — · [Overview](00_overview.md) · [CRUD endpoints →](02_crud-endpoints.md)
