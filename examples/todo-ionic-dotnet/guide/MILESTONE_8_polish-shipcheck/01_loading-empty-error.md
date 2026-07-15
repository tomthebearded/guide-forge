# Milestone 8 · Step 01 of 4 — Add loading / empty / error states
> Nav: — · [Overview](00_overview.md) · [Run-both README →](02_run-both.md)

> **This step rewrites 3 files, committed together:** `todo-api.service.ts`, `home.page.ts`, `home.page.html`.

## Glossary for this step
- **`ion-spinner`** — Ionic's animated loading indicator. [Docs](https://ionicframework.com/docs/api/spinner). We show it while the first fetch is in flight.
- **`ion-text`** — a wrapper that applies Ionic text colors (e.g. `color="danger"`) to inline content. [Docs](https://ionicframework.com/docs/api/text). We use it for the red error message. See [glossary](../foundation/glossary.md).

## Why / design
Right now, while the first load is in flight the page is blank, and if the backend is down the failure only
shows in the console. We add two signals to the service — `loading` and `error` — and the page renders exactly
one of four states with `@if / @else if`: spinner, error message, empty message, or the list.

One subtlety: the mutations (`add`/`toggle`/`edit`/`remove`) each re-fetch the list on success. If that
re-fetch flipped `loading` on, the whole list would flash to the spinner and remount on *every* action —
collapsing any open sliding row. So `load()` takes a `withSpinner` flag: the cold load in `ngOnInit` shows
the spinner; the post-mutation re-fetch (`load(false)`) refreshes quietly.

## Do this
1. **Replace `todo-api.service.ts`** with the version below — adds `loading` + `error` signals, a
   `withSpinner` flag on `load()`, and switches the mutations to `load(false)`.
2. **Replace `home.page.ts`** — reads `loading`/`error` from the service and imports `IonSpinner` + `IonText`.
3. **Replace `home.page.html`** — wraps the list in the four-state block.

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

## Done when (this step)
- [ ] Cold-loading the page briefly shows a spinner, then the list.
- [ ] Adding or toggling a todo updates the row **without the whole list flashing to a spinner** (confirms `load(false)`).
- [ ] With the backend stopped, reloading shows the red error message (not a blank page or only a console error).
- [ ] Deleting every todo shows the "Nothing here yet" message.

## If it breaks
- **Spinner never disappears** — `loading` isn't set back to `false` in both the `next` and `error` callbacks.
- **`'ion-spinner' is not a known element`** — `IonSpinner`/`IonText` aren't in the component `imports`.
- **The empty message shows briefly on every load** — that's the gap before data arrives; it's covered because
  `loading()` is checked first in the `@if` chain. Confirm the order: loading → error → empty → list.
