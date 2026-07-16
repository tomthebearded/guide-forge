# Milestone 7 · Step 03 of 3 — Verify the milestone
> Nav: [← Home page spec](02_home-spec.md) · [Overview](00_overview.md) · [M8 Polish & ship-check →](../MILESTONE_8_polish-shipcheck/00_overview.md)

## Done-when gate (the whole milestone)
No servers needed — tests mock HTTP.

1. **Run the suite once** from `frontend/`:
   ```bash
   ng test --watch=false --browsers=ChromeHeadless
   ```
2. Expect a Karma summary with everything green:
   ```text
   Chrome Headless: Executed N of N SUCCESS (0.4 secs / 0.2 secs)
   TOTAL: N SUCCESS
   ```
   - [ ] All specs pass — `TodoApiService` × 2 and `HomePage` × 1 that you wrote, **plus** the scaffold's
     `app.component.spec.ts` if it's still present (it tests the unchanged `AppComponent` and passes). So `N`
     is **3 or 4** depending on that file; the gate is "all green", not a fixed count.
   - [ ] The process exits with code 0 (so it's CI-friendly).

## Files after this milestone
```typescript
// frontend/src/app/todo-api.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TodoApiService } from './todo-api.service';
import { Todo } from './todo';

describe('TodoApiService', () => {
  let service: TodoApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TodoApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('load() GETs /api/todos and fills the signal', () => {
    const fake: Todo[] = [{ id: 1, title: 'Buy groceries', isDone: false }];

    service.load();

    const req = httpTesting.expectOne('/api/todos');
    expect(req.request.method).toBe('GET');
    req.flush(fake);

    expect(service.todos()).toEqual(fake);
  });

  it('add() POSTs the title, then reloads the list', () => {
    service.add('New todo');

    const post = httpTesting.expectOne('/api/todos');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ title: 'New todo' });
    post.flush({ id: 2, title: 'New todo', isDone: false });

    const get = httpTesting.expectOne('/api/todos');
    expect(get.request.method).toBe('GET');
    get.flush([{ id: 2, title: 'New todo', isDone: false }]);

    expect(service.todos().length).toBe(1);
  });
});
```

```typescript
// frontend/src/app/home/home.page.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AlertController, provideIonicAngular } from '@ionic/angular/standalone';
import { HomePage } from './home.page';

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideIonicAngular(),
        { provide: AlertController, useValue: jasmine.createSpyObj('AlertController', ['create']) },
      ],
    });
    fixture = TestBed.createComponent(HomePage);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('renders todos loaded from the API', () => {
    fixture.detectChanges();

    const req = httpTesting.expectOne('/api/todos');
    req.flush([{ id: 1, title: 'Buy groceries', isDone: false }]);

    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Buy groceries');
  });
});
```

## Troubleshooting
- **`Cannot find Chrome binary` / Karma can't launch** — Chrome isn't installed or not on `PATH`. Install
  Chrome, or set the `CHROME_BIN` env var to your Chromium binary.
- **Hangs waiting for a browser** — you omitted `--browsers=ChromeHeadless`; the default may try to open a
  headed Chrome. Use the headless flag (and `--watch=false` so it exits).
- **The old `home.page.spec.ts` still fails** — you didn't replace it in [step 02](02_home-spec.md).

## Next
→ [M8 — Polish & full-stack ship-check](../MILESTONE_8_polish-shipcheck/00_overview.md)

---
> Nav: [← Home page spec](02_home-spec.md) · [Overview](00_overview.md) · [M8 Polish & ship-check →](../MILESTONE_8_polish-shipcheck/00_overview.md)
