# Milestone 5 · Step 02 of 4 — Create the `TodoApiService`
> Nav: [← Todo model](01_todo-model.md) · [Overview](00_overview.md) · [Render the list →](03_home-list.md)

## Glossary for this step
- **signal** — Angular's reactive state holder; reading `todos()` in a template re-renders when it changes.
  [Angular signals docs](https://angular.dev/guide/signals). See [glossary](../foundation/glossary.md).

## Why / design
One `providedIn: 'root'` service owns all API access and holds the todo list in a **signal**, so any component
reading `todos()` updates automatically. `load()` GETs `/api/todos` (the base comes from `environment.apiUrl`,
which the proxy forwards to `:5080`) and pushes the result into the signal. We use `inject()` for dependencies,
the modern Angular idiom. Mutations (add/toggle/edit/delete) come in M6.

## Do this
1. **Create `frontend/src/app/todo-api.service.ts`** with the service below. The class name `TodoApiService`
   and the public `todos` signal are **load-bearing** — the home page imports and reads them.

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

  /** The current list of todos. Read as `todos()` in templates. */
  readonly todos = signal<Todo[]>([]);

  /** Fetch all todos and replace the signal's value. */
  load(): void {
    this.http.get<Todo[]>(`${this.base}/todos`).subscribe((todos) => this.todos.set(todos));
  }
}
```

## Done when (this step)
- [ ] `frontend/src/app/todo-api.service.ts` exists and compiles (the app still shows the Blank page — nothing
      calls `load()` yet).

## If it breaks
- **`Cannot find module '../environments/environment'`** — the environment files weren't generated; see
  [M4 step 02](../MILESTONE_4_frontend-scaffold/02_http-and-environment.md).
- **`No provider for HttpClient`** at runtime — `provideHttpClient()` is missing from `main.ts` (M4 step 02).

---
> Nav: [← Todo model](01_todo-model.md) · [Overview](00_overview.md) · [Render the list →](03_home-list.md)
