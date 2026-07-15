# Conventions — Todo (Ionic + .NET)

> The rules every step in this guide follows. If a step seems to contradict one of these, the convention
> wins — fix the step.

## Repo layout
One repo, two sibling folders:
```
todo-ionic-dotnet/            (the reader's project root — NOT the guide folder)
├─ backend/                   .NET 10 solution: Api/ + Api.Tests/
│  ├─ Api/                    minimal-API project (Program.cs, Todo.cs, TodoDb.cs, dtos, endpoints)
│  └─ Api.Tests/              xUnit v3 test project
└─ frontend/                  Ionic-Angular standalone app
```

## The Todo contract (load-bearing — identical on both sides)
The single shape that crosses the wire. **These names must match exactly** in C# and TypeScript:

| Field | Type (C#) | Type (TS) | Notes |
|-------|-----------|-----------|-------|
| `id` | `int` | `number` | Server-assigned. Never sent on create. |
| `title` | `string` | `string` | Non-empty — enforced **client-side only** (frontend `trim()`/guard, added in M6). The API stores whatever title it's sent; there is no server-side validation in this guide. |
| `isDone` | `bool` | `boolean` | Defaults to `false`. |

JSON is camelCase on the wire (`id`, `title`, `isDone`) — ASP.NET Core's default `System.Text.Json` policy,
which lines up with TypeScript naming, so **no custom serializer config is needed**.

## API contract (load-bearing)
Base URL `http://localhost:5080`, all routes under `/api/todos`:

| Verb | Route | Body | Success | Purpose |
|------|-------|------|---------|---------|
| GET | `/api/todos` | — | 200 `Todo[]` | List all |
| POST | `/api/todos` | `{ title }` | 201 `Todo` + `Location` | Create |
| PUT | `/api/todos/{id}` | `{ title, isDone }` | 200 `Todo` | Full update (used by edit) |
| PATCH | `/api/todos/{id}/toggle` | — | 200 `Todo` | Flip `isDone` |
| DELETE | `/api/todos/{id}` | — | 204 | Delete |
| (any) | unknown `id` | — | 404 | Not found |

## Backend (C#) rules
- **Minimal APIs**, not controllers. Endpoints grouped with `MapGroup("/api/todos")` in a `TodoEndpoints`
  extension; `Program.cs` stays thin.
- C# 14 / .NET 10. `Todo` is a mutable class entity (EF-tracked); request bodies are `record` DTOs.
- EF Core **InMemory** provider, database name `"todos"`, seeded on startup. Store resets on restart — by design.
- PascalCase types/methods, `_camelCase` private fields, nullable reference types on. **No namespaces** — types
  live in the global namespace on purpose, so the test project references `Todo`/`Program` without a `using`
  (fine for an app this small; add a namespace + matching `using` if you grow it).
- CORS: one named policy `"frontend"` allowing the Ionic dev origin; `app.UseCors("frontend")`.

## Frontend (Angular/Ionic) rules
- **Angular 20.3 standalone** (what `ionic start` scaffolds — [D5](decision-log.md#d5--follow-the-ionic-scaffolds-angular-203--karma-not-a-forced-upgrade)) — no `NgModule`. Bootstrap via `bootstrapApplication` in `main.ts`.
- **Standalone Ionic components** — import each `Ion*` from `@ionic/angular/standalone` and list it in the
  component's `imports`; register icons with `addIcons`. Do **not** use `IonicModule`.
- File naming `kebab-case`: `todo-api.service.ts`, `home.page.ts`. One component/service per file.
- State via **signals** (`signal`, `computed`); the todo list lives in a signal on the service.
- HTTP through Angular's `HttpClient` (provided by `provideHttpClient`); the API base URL comes from
  `src/environments/environment.ts`, and `ionic serve` proxies `/api` to `:5080` (no CORS pain in dev).
- Dev server port **8100** (Ionic default).

## Testing / verification
- **Backend:** xUnit **v3**, one test class per endpoint group, driving the app through
  `WebApplicationFactory<Program>` (real HTTP pipeline). `dotnet test` must be green.
- **Frontend:** **Karma + Jasmine** (what the Ionic scaffold ships) via `ng test`, covering `TodoApi` (HTTP
  calls, with `HttpTestingController`) and the home page component (rendering + interaction). Must be green.
  Run once with `ng test --watch=false --browsers=ChromeHeadless`.
- Every Done-when states its **exact expected output** (JSON body, status code, console line, on-screen state).
