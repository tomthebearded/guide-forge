# Milestone 6 · Step 01 of 5 — Add the mutation methods to `TodoApiService`
> Nav: — · [Overview](00_overview.md) · [Add + toggle →](02_add-and-toggle.md)

## Why / design
Four new methods mirror the backend verbs: `add` (POST), `toggle` (PATCH), `update` (PUT), `remove` (DELETE).
Each **calls `load()` on success** to refresh the signal from the server — the simplest approach that always
matches server state (no manual signal patching to get subtly wrong). The URLs match the
[API contract](../foundation/conventions.md#api-contract-load-bearing) exactly.

## Do this
1. **Replace `frontend/src/app/todo-api.service.ts`** with the version below — the M5 `load()` is unchanged;
   four methods are added.

## Code
```typescript
// frontend/src/app/todo-api.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Todo } from './todo';

@Injectable({ providedIn: 'root' })
export class TodoApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl; // '/api', proxied to http://localhost:5080

  readonly todos = signal<Todo[]>([]);

  load(): void {
    this.http.get<Todo[]>(`${this.base}/todos`).subscribe((todos) => this.todos.set(todos));
  }

  add(title: string): void {
    this.http.post<Todo>(`${this.base}/todos`, { title }).subscribe(() => this.load());
  }

  toggle(todo: Todo): void {
    this.http.patch<Todo>(`${this.base}/todos/${todo.id}/toggle`, {}).subscribe(() => this.load());
  }

  update(todo: Todo, title: string): void {
    this.http
      .put<Todo>(`${this.base}/todos/${todo.id}`, { title, isDone: todo.isDone })
      .subscribe(() => this.load());
  }

  remove(todo: Todo): void {
    this.http.delete(`${this.base}/todos/${todo.id}`).subscribe(() => this.load());
  }
}
```

The POST body `{ title }` and PUT body `{ title, isDone }` are **load-bearing** — they must match the backend
DTOs (`CreateTodoDto`, `UpdateTodoDto`) from [M2 step 01](../MILESTONE_2_backend-crud-cors/01_dtos.md).

## Done when (this step)
- [ ] The service compiles with all five methods. (No UI calls them yet — that's the next steps. The app still
      behaves like M5.)

## If it breaks
- **`patch(...)` needs a body** — pass `{}` as the second argument (an empty object) for the toggle; the
  backend ignores it.
