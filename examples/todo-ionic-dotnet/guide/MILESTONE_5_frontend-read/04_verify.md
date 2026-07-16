# Milestone 5 · Step 04 of 4 — Verify the milestone
> Nav: [← Render the list](03_home-list.md) · [Overview](00_overview.md) · [M6 Frontend CRUD UI →](../MILESTONE_6_frontend-crud/00_overview.md)

## Done-when gate (the whole milestone)
1. **Both servers running** — backend (`dotnet run` in `backend/Api`) and frontend (`ionic serve` in `frontend`).
2. **Open `http://localhost:8100`.** Expect a page titled **Todos** with two rows:
   - `☐  Buy groceries`
   - `☑  Walk the dog`  (checkbox checked, but clicking does nothing — it's display-only this milestone)
   - [ ] Both seeded todos render, in order, with the done one checked.
3. **Prove it's live data** — stop the backend (Ctrl+C in terminal 1), reload the browser. The list is now
   empty and the devtools console shows a failed `/api/todos` request.
   - [ ] The empty list confirms the data came from the API, not hard-coded markup. (Restart the backend to
     get the todos back.)

## Files after this milestone
```typescript
// frontend/src/app/todo.ts
export interface Todo {
  id: number;
  title: string;
  isDone: boolean;
}
```

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

```typescript
// frontend/src/app/home/home.page.ts
import { Component, inject, OnInit } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonCheckbox,
} from '@ionic/angular/standalone';
import { TodoApiService } from '../todo-api.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonCheckbox,
  ],
})
export class HomePage implements OnInit {
  private api = inject(TodoApiService);
  readonly todos = this.api.todos;

  ngOnInit(): void {
    this.api.load();
  }
}
```

```html
<!-- frontend/src/app/home/home.page.html -->
<ion-header>
  <ion-toolbar>
    <ion-title>Todos</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content class="ion-padding">
  <ion-list>
    @for (todo of todos(); track todo.id) {
      <ion-item>
        <ion-checkbox slot="start" [checked]="todo.isDone" [disabled]="true"></ion-checkbox>
        <ion-label>{{ todo.title }}</ion-label>
      </ion-item>
    }
  </ion-list>
</ion-content>
```

## Troubleshooting
- **Rows appear but no checkbox** — `IonCheckbox` isn't in the component `imports`.
- **`ExpressionChanged` or nothing renders** — confirm `ngOnInit` calls `this.api.load()` and the template
  reads `todos()` with the parentheses.

## Next
→ [M6 — Frontend CRUD UI](../MILESTONE_6_frontend-crud/00_overview.md)

---
> Nav: [← Render the list](03_home-list.md) · [Overview](00_overview.md) · [M6 Frontend CRUD UI →](../MILESTONE_6_frontend-crud/00_overview.md)
