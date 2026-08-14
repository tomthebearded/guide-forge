# M2 · Step 01 of 05 — Give the app's data shapes a home
> Nav: — · [Overview](00_overview.md) · [Add the in-memory store →](02_the-in-memory-store.md)

## Why / design

Right now `HealthResponse` sits at the bottom of `Program.cs` because it was the only shape the app had. You're
about to add two more, and `Program.cs` should stay a list of endpoints rather than becoming a type dump. So
this step moves the existing record into a `Contracts.cs` file and adds the command shapes beside it.

Moving a type means every place that names it must move with it, in the same step — `Program.cs` gains a
`using`. A step that left the project not compiling would take away your only way to tell your mistakes from
the guide's.

Two shapes, not one, and the distinction matters for the rest of the guide:

- **`CreateCommandRequest`** is what a client sends. It has no id and no timestamp, because the client doesn't
  get to choose either.
- **`Command`** is what the service stores and returns. The service assigns the id and the creation time.

Collapsing them into one type would let a client dictate its own ids — which in milestone 3 would let it
overwrite someone else's record.

## Before you start

Milestone 1 complete: `dotnet test` green with one passing health test, and `src/Api/Program.cs` ending with
the `HealthResponse` record.

## Do this

1. Create `src/Api/Contracts.cs` with all three shapes.

   ```csharp
   namespace Api;

   public record HealthResponse(string Status);

   public record CreateCommandRequest(string Type, string Payload);

   public record Command(Guid Id, string Type, string Payload, DateTimeOffset CreatedAtUtc);
   ```

   `CreatedAtUtc` carries its meaning in its name: the value is UTC, and nothing downstream has to guess.

2. In `src/Api/Program.cs`, **delete** the line that declares the record — it now lives in `Contracts.cs`:

   ```csharp
   public record HealthResponse(string Status);
   ```

3. In `src/Api/Program.cs`, add the `using` as the **very first line of the file**, above
   `var builder = …`. Without it, `HealthResponse` no longer resolves and the build breaks — this is the call
   site the move broke, fixed in the same step.

   ```csharp
   using Api;
   ```

## Done when (this step)

- [ ] `dotnet build` → `Build succeeded`, exits 0.
- [ ] `dotnet test` → **0 failed, 1 total**, exits 0. The health test still passes: you moved a type, you
      didn't change a behaviour.
- [ ] `src/Api/Program.cs` no longer declares any record; `src/Api/Contracts.cs` declares three.

## If it breaks

- **`CS0246: The type or namespace name 'HealthResponse' could not be found`** → the `using Api;` line is
  missing, or it's below the top-level statements instead of above them. It must be the first line.
- **`CS0101: The namespace already contains a definition for 'HealthResponse'`** → you added the record to
  `Contracts.cs` but didn't delete it from `Program.cs`. It can only live in one place.
- **`Program.cs` won't compile after adding `using`** with an error about statements → a `using` directive is
  allowed above top-level statements, but nothing else is. Check nothing else crept above `var builder`.

---
> Nav: — · [Overview](00_overview.md) · [Add the in-memory store →](02_the-in-memory-store.md)
