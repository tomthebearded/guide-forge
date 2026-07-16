# Milestone 6 · Step 02 of 5 — Add-todo input + working toggle
> Nav: [← API mutations](01_api-mutations.md) · [Overview](00_overview.md) · [Edit + delete →](03_edit-and-delete.md)

> **This step rewrites 2 files, committed together:** `home.page.ts` and `home.page.html`.

## Glossary for this step
- **`ion-input`** — Ionic's text field. [Docs](https://ionicframework.com/docs/api/input). Two-way binding
  uses `[(ngModel)]`, which needs `FormsModule`.
- **`ion-button`** — Ionic's button component; we use it here to submit the new todo. [Docs](https://ionicframework.com/docs/api/button).
- **`ionChange`** — the Ionic event a checkbox emits **on user interaction** (not on programmatic changes, so
  no feedback loop when we reload). [Checkbox docs](https://ionicframework.com/docs/api/checkbox).

## Why / design
We add a text input bound to a `newTitle` field (`[(ngModel)]`) plus an Add button; both the button click and
Enter call `addTodo()`. The list's checkbox becomes interactive: `(ionChange)="toggle(todo)"` calls the service,
which PATCHes and reloads. Because Ionic's `ionChange` fires only on real user interaction, the reload-driven
`[checked]` update doesn't retrigger it.

## Do this
1. **Replace `home.page.ts`** with the version below — adds `FormsModule`, `IonInput`, `IonButton`, the
   `newTitle` field, and `addTodo()` / `toggle()`.
2. **Replace `home.page.html`** with the version below — adds the input row and wires the checkbox.

## Code
```typescript
// frontend/src/app/home/home.page.ts
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonCheckbox, IonInput, IonButton,
} from '@ionic/angular/standalone';
import { Todo } from '../todo';
import { TodoApiService } from '../todo-api.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonCheckbox, IonInput, IonButton,
  ],
})
export class HomePage implements OnInit {
  private api = inject(TodoApiService);
  readonly todos = this.api.todos;

  newTitle = '';

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
    @for (todo of todos(); track todo.id) {
      <ion-item>
        <ion-checkbox slot="start" [checked]="todo.isDone" (ionChange)="toggle(todo)"></ion-checkbox>
        <ion-label>{{ todo.title }}</ion-label>
      </ion-item>
    }
  </ion-list>
</ion-content>
```

## Done when (this step)
- [ ] Typing a title and pressing Enter (or clicking **Add**) makes a new unchecked row appear, and the input
      clears. Reload — the new todo is still there.
- [ ] Clicking a checkbox toggles it; reload — the state persists.

## If it breaks
- **`Can't bind to 'ngModel'`** — `FormsModule` isn't in `imports`.
- **Checkbox toggles then flips back** — you asserted local state instead of reloading; confirm `toggle()`
  calls `this.api.toggle(todo)` (which reloads from the server).
- **Add does nothing** — the title was empty/whitespace (guarded by `trim()`), or the backend is down (check
  the console; M8 will surface this in the UI).

---
> Nav: [← API mutations](01_api-mutations.md) · [Overview](00_overview.md) · [Edit + delete →](03_edit-and-delete.md)
