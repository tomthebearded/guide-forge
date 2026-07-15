# Milestone 5 · Step 01 of 4 — Define the `Todo` model
> Nav: — · [Overview](00_overview.md) · [TodoApiService →](02_todo-api-service.md)

## Why / design
A single TypeScript interface mirrors the backend's `Todo` so responses type-check end to end. The field names
(`id`, `title`, `isDone`) are **load-bearing** — they must match the camelCase JSON the API returns
([the Todo contract](../foundation/conventions.md#the-todo-contract-load-bearing--identical-on-both-sides)).

## Do this
1. **Create `frontend/src/app/todo.ts`** with the interface below.

## Code
```typescript
// frontend/src/app/todo.ts
export interface Todo {
  id: number;
  title: string;
  isDone: boolean;
}
```

## Done when (this step)
- [ ] `frontend/src/app/todo.ts` exists and exports the `Todo` interface.

## If it breaks
- **Later type errors on `todo.isDone`** — a typo (`isDone` vs `IsDone`/`done`). It must be exactly `isDone`
  to match the API's JSON key.
