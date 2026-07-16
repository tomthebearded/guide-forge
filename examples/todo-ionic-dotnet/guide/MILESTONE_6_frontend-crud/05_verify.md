# Milestone 6 · Step 05 of 5 — Verify the milestone (⭐ reality-check)
> Nav: [← Filter](04_filter.md) · [Overview](00_overview.md) · [M7 Frontend tests →](../MILESTONE_7_frontend-tests/00_overview.md)

## Done-when gate (the whole milestone)
Both servers running. Open `http://localhost:8100`.

- [ ] **Add** — type "Test the app", press Enter → a new unchecked row appears; the input clears. Reload → still there.
- [ ] **Toggle** — click its checkbox → it checks. Reload → still checked.
- [ ] **Edit** — swipe the row left, tap the pencil → prompt opens with the current title; change it, Save → row updates. Reload → still updated.
- [ ] **Delete** — swipe left, tap the red trash → row disappears. Reload → still gone.
- [ ] **Filter** — mark one todo done; **Active** hides it, **Done** shows only it, **All** shows both.
- [ ] **⭐ Reality check** — spend a minute actually using it as a to-do list. It should feel like a real,
      working app. If anything about the app itself is off, fix it now before tests/polish.

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

```typescript
// frontend/src/app/home/home.page.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonCheckbox, IonInput, IonButton, IonIcon,
  IonItemSliding, IonItemOptions, IonItemOption,
  IonSegment, IonSegmentButton,
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
    IonSegment, IonSegmentButton,
  ],
})
export class HomePage implements OnInit {
  private api = inject(TodoApiService);
  private alertCtrl = inject(AlertController);

  readonly todos = this.api.todos;
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
</ion-content>
```

(These `home.page.*` files gain loading/empty/error states in [M8](../MILESTONE_8_polish-shipcheck/00_overview.md);
the versions above are the M6 end state.)

## Troubleshooting
- **Actions do nothing and the console shows failed requests** — the backend is down. Both servers must run.
  (M8 will make this visible in the UI instead of only the console.)
- **A new todo's id collides after restarts** — the in-memory store reset; that's expected. Ids restart from
  the seed each time the API restarts.

## Next
→ [M7 — Frontend tests (Karma/Jasmine)](../MILESTONE_7_frontend-tests/00_overview.md)

---
> Nav: [← Filter](04_filter.md) · [Overview](00_overview.md) · [M7 Frontend tests →](../MILESTONE_7_frontend-tests/00_overview.md)
