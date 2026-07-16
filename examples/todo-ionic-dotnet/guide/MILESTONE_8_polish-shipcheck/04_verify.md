# Milestone 8 · Step 04 of 4 — Verify the whole app
> Nav: [← Troubleshooting](03_troubleshooting.md) · [Overview](00_overview.md) · 🎉 done

## Done-when gate (the whole app)
Start both servers per the [project README](02_run-both.md).

1. **Loading** — hard-reload `http://localhost:8100`. A spinner shows briefly, then the todo list.
   - [ ] Spinner → list.
2. **Empty** — delete every todo. The list is replaced by "Nothing here yet. Add your first todo above!".
   - [ ] Empty-state message renders.
3. **Error** — stop the backend (Ctrl+C), reload. A red message: "Could not reach the API. Is the backend
   running on http://localhost:5080?".
   - [ ] Error message renders (not a blank page). Restart the backend and reload to recover.
4. **Full flow** — add three todos, complete one, edit one, delete one, and switch filters. Everything
   persists across reloads (until the backend restarts).
   - [ ] Every CRUD + filter action works end to end.
5. **Both test suites** (optional final gate):
   ```bash
   cd backend/Api.Tests && dotnet test          # Passed! Failed: 0, Passed: 6
   cd ../../frontend && ng test --watch=false --browsers=ChromeHeadless   # TOTAL: all SUCCESS, exit 0
   ```
   - [ ] Backend suite: `Passed! Failed: 0`. Frontend suite: all specs green, process exits 0 (the exact
     count is 3–4 depending on whether the scaffold left an `app.component.spec.ts`).

## Files after this milestone
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
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /**
   * Fetch all todos. `withSpinner` shows the full-screen loading state — true for
   * the initial cold load, false for the quiet re-fetch after a mutation (so the
   * list doesn't flash away and back, collapsing any open sliding row).
   */
  load(withSpinner = true): void {
    if (withSpinner) this.loading.set(true);
    this.error.set(null);
    this.http.get<Todo[]>(`${this.base}/todos`).subscribe({
      next: (todos) => {
        this.todos.set(todos);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not reach the API. Is the backend running on http://localhost:5080?');
        this.loading.set(false);
      },
    });
  }

  add(title: string): void {
    this.http.post<Todo>(`${this.base}/todos`, { title }).subscribe(() => this.load(false));
  }

  toggle(todo: Todo): void {
    this.http.patch<Todo>(`${this.base}/todos/${todo.id}/toggle`, {}).subscribe(() => this.load(false));
  }

  update(todo: Todo, title: string): void {
    this.http
      .put<Todo>(`${this.base}/todos/${todo.id}`, { title, isDone: todo.isDone })
      .subscribe(() => this.load(false));
  }

  remove(todo: Todo): void {
    this.http.delete(`${this.base}/todos/${todo.id}`).subscribe(() => this.load(false));
  }
}
```

```typescript
// frontend/src/app/home/home.page.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonCheckbox, IonInput, IonButton, IonIcon,
  IonItemSliding, IonItemOptions, IonItemOption,
  IonSegment, IonSegmentButton, IonSpinner, IonText,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, trashOutline } from 'ionicons/icons';
import { Todo } from '../todo';
import { TodoApiService } from '../todo-api.service';

type Filter = 'all' | 'active' | 'done';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonCheckbox, IonInput, IonButton, IonIcon,
    IonItemSliding, IonItemOptions, IonItemOption,
    IonSegment, IonSegmentButton, IonSpinner, IonText,
  ],
})
export class HomePage implements OnInit {
  private api = inject(TodoApiService);
  private alertCtrl = inject(AlertController);

  readonly todos = this.api.todos;
  readonly loading = this.api.loading;
  readonly error = this.api.error;
  readonly filter = signal<Filter>('all');
  readonly visibleTodos = computed(() => {
    const f = this.filter();
    return this.todos().filter((t) =>
      f === 'all' ? true : f === 'active' ? !t.isDone : t.isDone);
  });

  newTitle = '';

  constructor() {
    addIcons({ createOutline, trashOutline });
  }

  ngOnInit(): void {
    this.api.load();
  }

  addTodo(): void {
    const title = this.newTitle.trim();
    if (!title) return;
    this.api.add(title);
    this.newTitle = '';
  }

  toggle(todo: Todo): void {
    this.api.toggle(todo);
  }

  remove(todo: Todo): void {
    this.api.remove(todo);
  }

  setFilter(value: string | undefined): void {
    this.filter.set((value as Filter) ?? 'all');
  }

  async edit(todo: Todo): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Edit todo',
      inputs: [{ name: 'title', type: 'text', value: todo.title }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: (data) => {
            const title = (data.title ?? '').trim();
            if (title) this.api.update(todo, title);
          },
        },
      ],
    });
    await alert.present();
  }
}
```

```html
<!-- frontend/src/app/home/home.page.html -->
<ion-header>
  <ion-toolbar>
    <ion-title>Todos</ion-title>
  </ion-toolbar>
  <ion-toolbar>
    <ion-segment [value]="filter()" (ionChange)="setFilter($any($event.detail.value))">
      <ion-segment-button value="all"><ion-label>All</ion-label></ion-segment-button>
      <ion-segment-button value="active"><ion-label>Active</ion-label></ion-segment-button>
      <ion-segment-button value="done"><ion-label>Done</ion-label></ion-segment-button>
    </ion-segment>
  </ion-toolbar>
</ion-header>

<ion-content class="ion-padding">
  <ion-item>
    <ion-input
      label="New todo"
      labelPlacement="stacked"
      placeholder="What needs doing?"
      [(ngModel)]="newTitle"
      (keyup.enter)="addTodo()"></ion-input>
    <ion-button slot="end" (click)="addTodo()">Add</ion-button>
  </ion-item>

  @if (loading()) {
    <div class="ion-text-center ion-padding">
      <ion-spinner></ion-spinner>
    </div>
  } @else if (error()) {
    <ion-text color="danger">
      <p class="ion-padding ion-text-center">{{ error() }}</p>
    </ion-text>
  } @else if (visibleTodos().length === 0) {
    <p class="ion-padding ion-text-center">Nothing here yet. Add your first todo above!</p>
  } @else {
    <ion-list>
      @for (todo of visibleTodos(); track todo.id) {
        <ion-item-sliding>
          <ion-item>
            <ion-checkbox slot="start" [checked]="todo.isDone" (ionChange)="toggle(todo)"></ion-checkbox>
            <ion-label>{{ todo.title }}</ion-label>
          </ion-item>
          <ion-item-options side="end">
            <ion-item-option (click)="edit(todo)">
              <ion-icon slot="icon-only" name="createOutline"></ion-icon>
            </ion-item-option>
            <ion-item-option color="danger" (click)="remove(todo)">
              <ion-icon slot="icon-only" name="trashOutline"></ion-icon>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      }
    </ion-list>
  }
</ion-content>
```

`todo-ionic-dotnet/README.md` is as written in [step 02](02_run-both.md#code).

## Troubleshooting
See the full [troubleshooting sheet](03_troubleshooting.md).

## 🎉 Done
You've built a complete Ionic + .NET to-do app: a minimal API over an EF Core in-memory store, a standalone
Ionic-Angular UI with full CRUD + filtering, graceful UX states, and green test suites on both sides. The
"later" list (persistence, auth, deployment, native) lives in the [M8 overview handoff](00_overview.md#handoff).

---
> Nav: [← Troubleshooting](03_troubleshooting.md) · [Overview](00_overview.md) · 🎉 done
