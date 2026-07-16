# Milestone 6 · Step 04 of 5 — Filter with a segment
> Nav: [← Edit + delete](03_edit-and-delete.md) · [Overview](00_overview.md) · [Verify →](05_verify.md)

> **This step rewrites 2 files, committed together:** `home.page.ts` and `home.page.html`.

## Glossary for this step
- **`ion-segment`** — Ionic's segmented control (a row of mutually-exclusive buttons). [Docs](https://ionicframework.com/docs/api/segment).
- **`computed()`** — a signal derived from other signals; recomputes automatically when they change. [Docs](https://angular.dev/guide/signals#computed-signals).

## Why / design
A `filter` signal (`'all' | 'active' | 'done'`) drives a `computed()` `visibleTodos` that derives from the
`todos()` signal — no manual re-filtering, it recomputes whenever either signal changes. An `ion-segment` in
a second toolbar sets the filter via `(ionChange)`. The list now loops over `visibleTodos()`.

## Do this
1. **Replace `home.page.ts`** with the version below — adds `computed`/`signal`, the `Filter` type, the
   `filter` signal, the `visibleTodos` computed, `setFilter()`, and imports `IonSegment` + `IonSegmentButton`.
2. **Replace `home.page.html`** with the version below — adds the segment toolbar and loops over
   `visibleTodos()`.

## Code
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

`$any(...)` tells the template compiler to accept the segment's loosely-typed `value` as our `Filter`;
`setFilter` still guards against `undefined`.

## Done when (this step)
- [ ] The three-button segment appears under the title. **Active** hides done todos; **Done** shows only done
      ones; **All** shows everything. Adding/toggling updates the filtered view live.

## If it breaks
- **Type error on `$event.detail.value`** — keep the `$any(...)` wrapper, or change `setFilter` to accept
  `unknown`.
- **Filter resets on every add** — that's expected only if you re-created the signal; `filter` must be a field
  initialized once, not reassigned.

---
> Nav: [← Edit + delete](03_edit-and-delete.md) · [Overview](00_overview.md) · [Verify →](05_verify.md)
