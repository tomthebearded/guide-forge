# Milestone 5 · Step 03 of 4 — Render the list on the home page
> Nav: [← TodoApiService](02_todo-api-service.md) · [Overview](00_overview.md) · [Verify →](04_verify.md)

> **This step rewrites 2 files, committed together:** `home.page.ts` and `home.page.html`.

## Glossary for this step
- **Ionic page shell** — `ion-header` / `ion-toolbar` / `ion-title` frame the top bar; `ion-content` is the
  scrollable body every page wraps its content in. [Ionic layout docs](https://ionicframework.com/docs/layout/structure).
- **`ion-list` / `ion-item`** — Ionic's list container and row components. [Ionic list docs](https://ionicframework.com/docs/api/list). See [glossary](../foundation/glossary.md).
- **`ion-checkbox` / `ion-label`** — a checkbox control and a text label, placed inside an `ion-item` via
  `slot`. [Checkbox docs](https://ionicframework.com/docs/api/checkbox) · [Label docs](https://ionicframework.com/docs/api/label). Here the checkbox is display-only (`[disabled]="true"`).
- **`@for`** — Angular's built-in template loop (`@for (x of items(); track x.id)`). [Control flow docs](https://angular.dev/guide/templates/control-flow).

## Why / design
The home page injects `TodoApiService`, calls `load()` in `ngOnInit`, and renders `todos()` with `@for`. Each
todo is an `ion-item` with a **display-only** checkbox (`[disabled]="true"`) and its title — interactivity is
M6. Every `ion-*` component used must be listed in the component's `imports` (standalone rule,
[D3](../foundation/decision-log.md#d3--standalone-ionic-components-over-ionicmodule)).

## Do this
1. **Replace `frontend/src/app/home/home.page.ts`** with the version below (the scaffold's version has demo
   content we don't need).
2. **Replace `frontend/src/app/home/home.page.html`** with the version below.
3. Leave `home.page.scss` as-is.

## Code
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

  /** The reactive list, read directly from the service's signal. */
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

## Done when (this step)
- [ ] `ionic serve` (with the backend running) shows a **Todos** page listing "Buy groceries" and "Walk the
      dog", the latter with a checked checkbox.

## If it breaks
- **`'ion-list' is not a known element`** — the component isn't in the `imports` array; add the matching
  `Ion*` class.
- **Page is blank, console shows a CORS or 404 error** — the proxy/backend isn't running; both servers must be
  up (see [M4 verify](../MILESTONE_4_frontend-scaffold/04_verify.md)).
- **`todos()` is not a function** — you assigned `this.api.todos()` (called it) instead of `this.api.todos`
  (the signal itself). Assign the signal, call it in the template.
