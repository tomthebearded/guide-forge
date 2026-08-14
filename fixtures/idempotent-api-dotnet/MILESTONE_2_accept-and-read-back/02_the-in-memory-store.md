# M2 · Step 02 of 05 — Add the in-memory store
> Nav: [← Give the app's data shapes a home](01_the-command-model.md) · [Overview](00_overview.md) · [Add the POST and GET endpoints →](03_post-and-get-endpoints.md)

## Glossary for this step

> New here: **[ConcurrentDictionary](../foundation/glossary.md#concurrentdictionary)** (defined under *Do this* 1).

## Why / design

The endpoints in step 03 need somewhere to put a command and somewhere to look one up. This step builds that
somewhere and registers it, so step 03 is purely about HTTP.

The store keeps everything in a field, so it is emptied every time the process exits — deliberately, for now.
[Milestone 4](../MILESTONE_4_durability/00_overview.md) replaces it with a file-backed store and proves the
difference with a gate; introducing persistence here would mean building two things at once and being unable
to tell which one broke.

## Before you start

Step 01 complete: `src/Api/Contracts.cs` exists with `Command`, and the solution builds.

## Do this

1. Create `src/Api/InMemoryCommandStore.cs`.

   ```csharp
   using System.Collections.Concurrent;

   namespace Api;

   public sealed class InMemoryCommandStore
   {
       private readonly ConcurrentDictionary<Guid, Command> _commandsById = new();

       public void Add(Command command) => _commandsById[command.Id] = command;

       public Command? FindById(Guid id) =>
           _commandsById.TryGetValue(id, out var command) ? command : null;
   }
   ```

   > New concept — **`ConcurrentDictionary`**: a dictionary safe to read and write from several threads at
   > once. ASP.NET Core handles requests **concurrently**, so two clients can be inside `Add` at the same
   > instant. A plain `Dictionary` mutated from two threads doesn't just lose a write — it can corrupt its
   > internal buckets and throw or hang on a later read.
   > ([ConcurrentDictionary](https://learn.microsoft.com/en-us/dotnet/api/system.collections.concurrent.concurrentdictionary-2))

   This is not a precaution for later scale; it is correct today, because the test in step 04 and every real
   client run through the same shared instance.

2. In `src/Api/Program.cs`, register the store with the dependency-injection container. Put this line
   **between `var builder = …` and `var app = builder.Build();`** — services must be registered before the app
   is built, and `Build()` closes registration.

   ```csharp
   builder.Services.AddSingleton<InMemoryCommandStore>();
   ```

   > New concept — **`AddSingleton`**: registers one instance for the whole application lifetime, created the
   > first time something asks for it. Singleton is the right lifetime here precisely *because* the store holds
   > state: a per-request lifetime would hand every request its own empty dictionary.
   > ([Dependency injection](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection?view=aspnetcore-10.0))

## Done when (this step)

- [ ] `dotnet build` → `Build succeeded`, exits 0.
- [ ] `dotnet test` → **0 failed, 1 total**, exits 0. Nothing observable changed yet — no endpoint uses the
      store until step 03.

## If it breaks

- **`CS0246: The type or namespace name 'ConcurrentDictionary<,>' could not be found`** → the
  `using System.Collections.Concurrent;` line is missing from `InMemoryCommandStore.cs`.
- **`CS0246` on `InMemoryCommandStore` in `Program.cs`** → the `using Api;` from step 01 is missing. The store
  lives in the `Api` namespace like the contracts.
- **`Cannot access a disposed object`** or a registration error at startup → the `AddSingleton` line landed
  after `builder.Build()`. Move it above.

---
> Nav: [← Give the app's data shapes a home](01_the-command-model.md) · [Overview](00_overview.md) · [Add the POST and GET endpoints →](03_post-and-get-endpoints.md)
