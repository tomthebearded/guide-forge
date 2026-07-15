# Milestone 7 · Step 02 of 3 — Test the home page rendering
> Nav: [← Service spec](01_service-spec.md) · [Overview](00_overview.md) · [Verify →](03_verify.md)

## Why / design
The scaffold shipped a `home.page.spec.ts` that tests the old "Blank" page — it fails now that we rewrote the
page, so we **replace it**. The new spec stands up `HomePage` with a mocked HTTP backend, lets `ngOnInit` fire
the load, flushes a canned todo, and asserts the title text renders. We assert on `textContent` (light DOM),
which is present regardless of Ionic's internal shadow rendering. `provideIonicAngular()` configures Ionic;
`AlertController` is stubbed (the page injects it at construction, though this test never opens a prompt).

## Do this
1. **Replace `frontend/src/app/home/home.page.spec.ts`** with the spec below.

## Code
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
    fixture.detectChanges(); // first CD triggers ngOnInit -> load() -> GET

    const req = httpTesting.expectOne('/api/todos');
    req.flush([{ id: 1, title: 'Buy groceries', isDone: false }]);

    fixture.detectChanges(); // re-render with the loaded data

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Buy groceries');
  });
});
```

## Done when (this step)
- [ ] Running `ng test --watch=false --browsers=ChromeHeadless` passes the `HomePage` spec along with the two
      service specs.

## If it breaks
- **`NullInjectorError: No provider for AlertController`** — the stub provider is missing; keep the
  `{ provide: AlertController, useValue: ... }` line.
- **`Expected one matching request` fails** — `ngOnInit` runs on the *first* `detectChanges()`; make sure the
  `expectOne` comes after it.
- **`'ion-item' is not a known element`** — `HomePage` must be in `imports` (it brings its own Ionic
  components); it's a standalone component, so importing it is enough.
