# Milestone 7 · Step 01 of 3 — Test `TodoApiService` with `HttpTestingController`
> Nav: — · [Overview](00_overview.md) · [Home page spec →](02_home-spec.md)

## Glossary for this step
- **`HttpTestingController`** — Angular's tool to intercept and answer HTTP requests in tests, so no real
  server is called. [Docs](https://angular.dev/guide/http/testing). See [glossary](../foundation/glossary.md).

## Why / design
We test the service in isolation: `provideHttpClient()` + `provideHttpClientTesting()` swap the real HTTP
backend for a controllable fake. Each test calls a method, asserts the expected request (URL, verb, body) via
`expectOne`, `flush`es a canned response, then checks the signal or the follow-up reload. `verify()` in
`afterEach` fails the test if any unexpected request was made.

## Do this
1. **Create `frontend/src/app/todo-api.service.spec.ts`** with the two tests below.

## Code
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

    // add() calls load() on success — expect the follow-up GET.
    const get = httpTesting.expectOne('/api/todos');
    expect(get.request.method).toBe('GET');
    get.flush([{ id: 2, title: 'New todo', isDone: false }]);

    expect(service.todos().length).toBe(1);
  });
});
```

The URL `'/api/todos'` matches `environment.apiUrl` (`'/api'`) + `/todos`.

## Done when (this step)
- [ ] `ng test --watch=false --browsers=ChromeHeadless` runs and the two `TodoApiService` specs pass (the
      scaffold's `home.page.spec.ts` may still fail here — the next step replaces it).

## If it breaks
- **`Expected one matching request ... found none`** — the URL doesn't match; confirm `environment.apiUrl` is
  `'/api'` so the request is `/api/todos`.
- **`verify()` fails with an unexpected request** — `add()` also triggers `load()`; both requests must be
  flushed, as shown.
