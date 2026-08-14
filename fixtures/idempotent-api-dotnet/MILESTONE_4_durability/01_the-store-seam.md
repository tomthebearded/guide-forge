# M4 · Step 01 of 05 — Put a seam in front of the store
> Nav: — · [Overview](00_overview.md) · [Write the file-backed store →](02_the-file-store.md)

## Why / design

You are about to replace the store's implementation. Doing that without a seam would mean editing every
handler and every test that names the concrete type — and doing it in the same breath as writing new
persistence code, so a failure afterwards could be either.

So this step does the boring half first and alone: introduce an interface, point everything at it, and change
no behaviour whatsoever. The tests must still pass, unchanged in what they assert, which is precisely the
evidence that this step was safe.

This is also the seam D1 in [../foundation/decision-log.md](../foundation/decision-log.md) promises: when the
file store eventually needs to become a real database, that is a one-class change because of what you do here.

## Before you start

Milestone 3 complete: seven tests green.

## Do this

1. Create `src/Api/ICommandStore.cs`. The four members are exactly the ones the handlers and tests already
   use — an interface extracted from real callers, not designed in advance.

   ```csharp
   namespace Api;

   public interface ICommandStore
   {
       void Add(string idempotencyKey, Command command);

       Command? FindById(Guid id);

       Command? FindByKey(string idempotencyKey);

       IReadOnlyList<Command> All();
   }
   ```

2. In `src/Api/InMemoryCommandStore.cs`, declare that the class implements it. Change only the class
   declaration line — the members already match, so nothing inside the body moves.

   ```csharp
   public sealed class InMemoryCommandStore : ICommandStore
   ```

3. In `src/Api/Program.cs`, change the registration so the **interface** is what the container hands out.

   ```csharp
   builder.Services.AddSingleton<ICommandStore, InMemoryCommandStore>();
   ```

4. In `src/Api/Program.cs`, change the handler parameter type in **both** endpoints from
   `InMemoryCommandStore store` to `ICommandStore store`. There are two occurrences: the `MapPost("/commands", …)`
   parameter list and the `MapGet("/commands/{id:guid}", …)` one. Both must change, or the container will fail
   to resolve the concrete type it no longer registers.

5. In `tests/Api.Tests/IdempotencyTests.cs`, change the two service lookups. Each currently reads
   `GetRequiredService<InMemoryCommandStore>()`; both become:

   ```csharp
   var store = factory.Services.GetRequiredService<ICommandStore>();
   ```

   They appear once in `PostCommand_SameKeyTwice_ReplaysResponseAndStoresOneCommand` and once in
   `PostCommand_DifferentKeys_StoreTwoCommands`.

## Done when (this step)

- [ ] `dotnet build` → `Build succeeded`, exits 0.
- [ ] `dotnet test` → **0 failed, 7 total**, exits 0 — the **same** seven tests asserting the
      **same** things. A changed number here means this step changed behaviour, which it must not.
- [ ] No file outside `Program.cs` and `InMemoryCommandStore.cs` mentions the concrete store type.

## If it breaks

- **`InvalidOperationException: Unable to resolve service for type 'Api.InMemoryCommandStore'`** → a handler
  parameter in action 4 was missed. The container now offers `ICommandStore` only.
- **`CS0535: 'InMemoryCommandStore' does not implement interface member`** → a signature drifted. The interface
  members must match the class's exactly, including nullability (`Command?`, not `Command`).
- **`CS0246: ICommandStore could not be found` in the test project** → the tests already carry `using Api;`
  from milestone 2; check it wasn't removed.

---
> Nav: — · [Overview](00_overview.md) · [Write the file-backed store →](02_the-file-store.md)
