# Milestone 6 · Step 03 of 5 — Edit + delete via a sliding item
> Nav: [← Add + toggle](02_add-and-toggle.md) · [Overview](00_overview.md) · [Filter →](04_filter.md)

> **This step rewrites 2 files, committed together:** `home.page.ts` and `home.page.html`.

## Glossary for this step
- **`ion-item-sliding`** — a list row that reveals action buttons when swiped sideways. [Docs](https://ionicframework.com/docs/api/item-sliding). Its buttons go in an `ion-item-options` / `ion-item-option`.
- **`AlertController`** — an Ionic service that builds and presents modal alerts/prompts programmatically. [Docs](https://ionicframework.com/docs/api/alert).
- **`addIcons`** — registers named icons from `ionicons/icons` so `<ion-icon name="...">` can use them (required in standalone mode). See [glossary](../foundation/glossary.md).

## Why / design
Each row becomes an `ion-item-sliding` exposing **Edit** and **Delete** on swipe. Delete calls
`api.remove(todo)`. Edit opens an `AlertController` prompt seeded with the current title; its Save handler
calls `api.update(todo, newTitle)`. Because we use standalone icons, we register `createOutline` and
`trashOutline` with `addIcons` in the constructor.

## Do this
1. **Replace `home.page.ts`** with the version below — adds `IonIcon` + the three sliding components,
   `AlertController`, `addIcons`, and the `edit()` / `remove()` methods.
2. **Replace `home.page.html`** with the version below — wraps each row in `ion-item-sliding` with options.

## Code
```typescript
// frontend/src/app/home/home.page.ts
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonCheckbox, IonInput, IonButton, IonIcon,
  IonItemSliding, IonItemOptions, IonItemOption,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, trashOutline } from 'ionicons/icons';
import { Todo } from '../todo';
import { TodoApiService } from '../todo-api.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonCheckbox, IonInput, IonButton, IonIcon,
    IonItemSliding, IonItemOptions, IonItemOption,
  ],
})
export class HomePage implements OnInit {
  private api = inject(TodoApiService);
  private alertCtrl = inject(AlertController);
  readonly todos = this.api.todos;

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

The icon `name` strings (`"createOutline"`, `"trashOutline"`) **must match** the keys passed to `addIcons`.

## Done when (this step)
- [ ] Swiping a row left (or dragging on desktop) reveals a pencil (Edit) and a red trash (Delete) button.
- [ ] Delete removes the row; reload confirms it's gone.
- [ ] Edit opens a prompt with the current title; changing it and pressing Save updates the row; reload confirms.

## If it breaks
- **Icons show as empty boxes** — the `name` doesn't match an `addIcons` key, or you imported the wrong icon
  name from `ionicons/icons` (they're camelCase, e.g. `trashOutline`).
- **`No provider for AlertController`** — it comes from `@ionic/angular/standalone` and is available because
  `provideIonicAngular()` is in `main.ts`; confirm that provider is present (M4 step 02).
- **Swipe does nothing** — the `ion-item` must be a direct child of `ion-item-sliding`, with
  `ion-item-options` as its sibling.

---
> Nav: [← Add + toggle](02_add-and-toggle.md) · [Overview](00_overview.md) · [Filter →](04_filter.md)
