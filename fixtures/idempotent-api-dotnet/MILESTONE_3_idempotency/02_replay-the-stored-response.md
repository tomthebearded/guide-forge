# M3 · Step 02 of 04 — Replay the stored response
> Nav: [← Require an Idempotency-Key](01_require-the-key.md) · [Overview](00_overview.md) · [Prove it: the idempotency tests →](03_the-idempotency-test.md)

## Why / design

Now the key earns its keep. The store gains a second index — key → command — so the handler can ask "have I
seen this key?" before creating anything. If it has, it returns the command it created the first time, and the
client receives a response identical to the one it may never have seen.

Note *identical*, including the `201` status and the `Location` header. A retry is not a new outcome to
report; it is the same outcome, re-delivered. Answering `200` on the replay would force every client to handle
two shapes for one operation.

Adding the key to the store changes `Add`'s signature, which breaks its one call site in `Program.cs`. Both
change here, in this step.

## Before you start

Step 01 complete: the handler takes `idempotencyKey` and rejects a blank one; `dotnet test` green at 4.

## Do this

1. In `src/Api/InMemoryCommandStore.cs`, replace the entire class body with the version below. The one-argument
   `Add` is gone: storing a command without its key would create a record the retry path can never find, so
   the type no longer offers that.

   ```csharp
   using System.Collections.Concurrent;

   namespace Api;

   public sealed class InMemoryCommandStore
   {
       private readonly ConcurrentDictionary<Guid, Command> _commandsById = new();
       private readonly ConcurrentDictionary<string, Guid> _commandIdsByKey = new();

       public void Add(string idempotencyKey, Command command)
       {
           _commandsById[command.Id] = command;
           _commandIdsByKey[idempotencyKey] = command.Id;
       }

       public Command? FindById(Guid id) =>
           _commandsById.TryGetValue(id, out var command) ? command : null;

       public Command? FindByKey(string idempotencyKey) =>
           _commandIdsByKey.TryGetValue(idempotencyKey, out var id) ? FindById(id) : null;

       public IReadOnlyList<Command> All() => _commandsById.Values.ToList();
   }
   ```

   `All()` exists for one reason: the gate in step 03 has to assert **how many** commands were stored, and
   "one record, not two" is the half of idempotency that a response comparison cannot show.

2. In `src/Api/Program.cs`, replace the body of the `app.MapPost("/commands", …)` handler — everything between
   the `if (string.IsNullOrWhiteSpace(idempotencyKey))` block and the closing `});` — with this. The
   signature change from action 1 is fixed here, in the same step.

   ```csharp
       if (store.FindByKey(idempotencyKey) is { } existing)
       {
           return Results.Created($"/commands/{existing.Id}", existing);
       }

       var command = new Command(Guid.NewGuid(), request.Type, request.Payload, DateTimeOffset.UtcNow);
       store.Add(idempotencyKey, command);
       return Results.Created($"/commands/{command.Id}", command);
   ```

   The replay branch builds its response the same way the create branch does, from the stored command — not
   from a cached copy of the earlier response. One source of truth means the two responses cannot drift.

3. Read the handler once, top to bottom. It now has three exits: reject a missing key, replay a known key,
   create for a new key. That is the whole feature.

## Done when (this step)

- [ ] `dotnet build` → `Build succeeded`, exits 0.
- [ ] `dotnet test` → **0 failed, 4 total**, exits 0. The milestone-2 tests still pass because each
      generates a fresh key per call, so each still takes the create branch.
- [ ] `src/Api/InMemoryCommandStore.cs` no longer contains a one-argument `Add`.

## If it breaks

- **`CS1501: No overload for method 'Add' takes 1 arguments`** → action 2 wasn't applied; `Program.cs` still
  calls `store.Add(command)`. This is the call site the signature change broke.
- **`CS0246` on `IReadOnlyList<>` or `ToList()`** → the file is missing implicit usings. `System.Linq` and
  `System.Collections.Generic` come from `<ImplicitUsings>enable</ImplicitUsings>` in `Api.csproj`; check it
  wasn't disabled.
- **A test now fails with `409` or an unexpected status** → you added conflict handling early. That belongs to
  [milestone 5](../MILESTONE_5_errors-and-conflict/00_overview.md); this step replays unconditionally.
- **Both posts in a later test return different ids** → `FindByKey` is looking in `_commandsById` rather than
  `_commandIdsByKey`. The key index is the one keyed by `string`.

---
> Nav: [← Require an Idempotency-Key](01_require-the-key.md) · [Overview](00_overview.md) · [Prove it: the idempotency tests →](03_the-idempotency-test.md)
