# Audience model — Todo (Ionic + .NET)

> The guide's north star for **how deep to explain each thing**. Match explanation depth to the reader's
> level on *that specific topic* — over-explaining an Expert topic is as harmful as under-explaining a New one.

## Granularity: **Standard**
Default atomic step size, moderate prose density. One indivisible action per step (code files created
together in one commit may bundle into a single step).

## Per-topic expertise → explanation-depth policy

| Topic | Level | Depth policy |
|-------|-------|--------------|
| TypeScript | Intermediate | One-line reminder + doc link; skip fundamentals. |
| Angular 20.3 (standalone, signals, DI, HttpClient) | Intermediate | One-line reminder + doc link; assume components/DI known. A short note on signals + standalone bootstrap for readers pre-v19. |
| **Ionic components / CLI / theming** | **Beginner** | **Define on first use + doc link + a brief why.** This is the reader's new territory — `ion-*` components, `ionic serve`, theming variables all get explained. |
| HTTP / REST | Intermediate | One-line reminder + doc link. |
| .NET / C# 14 / minimal APIs | Expert | Name only. No definitions or doc links except a specific gotcha. |
| EF Core (DbContext, InMemory provider) | Expert | Name only — the InMemory-for-testing caveat is flagged once (specific gotcha). |
| xUnit v3 | Expert | Name only — the v3-template gotcha is called out (specific gotcha). |
| Karma/Jasmine / Angular test runner | Intermediate | One-line + doc link. |
| CORS | Expert | Name only — gotcha: `UseCors` ordering + the dev origin. |

## Depth-policy key
- **Expert** → name it, no definition, no deep dive, no doc link (except a specific gotcha).
- **Intermediate** → one-line reminder + a doc link; skip the fundamentals.
- **Beginner** → define on first use + doc link + a brief *why*.
- **New** → define + doc link + a short concept deep-dive callout + extra failure-mode notes.

> The reader is **Intermediate on the frontend** (knows Angular basics, *new to Ionic*) and **Expert on the
> backend**. That asymmetry is deliberate: backend steps move fast and name things; frontend steps explain
> the Ionic-specific parts while assuming Angular fluency.
