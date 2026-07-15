# Milestone 8 · Step 02 of 4 — A run-both README for the project
> Nav: [← Loading/empty/error](01_loading-empty-error.md) · [Overview](00_overview.md) · [Troubleshooting →](03_troubleshooting.md)

## Why / design
The app is two programs that must run together. A short `README.md` at the **project root** (not the guide's
README — this one ships with the code) records the exact commands so you — or anyone who clones it — can start
both servers and run the tests without remembering the details.

## Do this
1. **Create `README.md` at the project root** (`todo-ionic-dotnet/README.md`, beside `backend/` and
   `frontend/`) with the content below.

## Code
````markdown
<!-- todo-ionic-dotnet/README.md -->
# Todo (Ionic + .NET)

A small full-stack to-do app: an **Ionic-Angular** frontend and a **.NET 10 minimal API** with an
**EF Core in-memory database**. Data resets whenever the backend restarts.

## Run it (two terminals)

**Terminal 1 — backend** (API on http://localhost:5080):
```bash
cd backend/Api
dotnet run
```

**Terminal 2 — frontend** (app on http://localhost:8100):
```bash
cd frontend
ionic serve
```

Then open **http://localhost:8100**. The dev server proxies `/api` to the backend, so both share one origin.

## Test

```bash
# Backend (xUnit v3)
cd backend/Api.Tests && dotnet test

# Frontend (Karma/Jasmine, headless)
cd frontend && ng test --watch=false --browsers=ChromeHeadless
```

## Stack
Node 24 · Angular 20.3 (standalone) · @ionic/angular 8 · .NET 10 · EF Core InMemory 10.
````

## Done when (this step)
- [ ] `todo-ionic-dotnet/README.md` exists with the run + test commands.
- [ ] Following it from a clean terminal (both `dotnet run` and `ionic serve`) brings the app up at
      `http://localhost:8100`.

## If it breaks
- **The fenced block confuses your editor** — the outer ```` ```` ```` fence above is just so this guide can
  *show* a README that itself contains ``` blocks; your actual `README.md` uses normal single ``` fences.
