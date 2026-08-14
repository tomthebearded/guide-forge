# M4 · Step 02 of 05 — Write the file-backed store
> Nav: [← Put a seam in front of the store](01_the-store-seam.md) · [Overview](00_overview.md) · [Swap in the file store →](03_swap-in-the-file-store.md)

## Glossary for this step

> New here: **[JSON Lines](../foundation/glossary.md#json-lines)** (defined under *Why / design*).

## Why / design

The store needs two things the in-memory one doesn't have: a way to write a command down, and a way to read
everything back when the process starts again.

The file format is **JSON Lines** — one complete JSON object per line. Appending a record is a single write
with no need to re-read or re-serialize what's already there, which is what makes an append-only file a
reasonable store rather than a toy. Reading is a loop over lines.

Note what is *kept in memory anyway*: the same two dictionaries as before. The file is the durable record; the
dictionaries are the index that makes lookups fast. On startup the file is replayed into them once.

You are writing this class now but not using it yet — step 03 does the swap. Splitting the two means that if
the gate in step 04 fails, you know it is the wiring or the store, not both.

> **Build vs borrow — you are hand-rolling a database.** Persisting records, reloading them on startup and
> keeping an index by key is what [`Microsoft.Data.Sqlite`](https://learn.microsoft.com/en-us/dotnet/standard/data/sqlite/)
> (10.0.\*) or [EF Core](https://learn.microsoft.com/en-us/ef/core/) (10.0.\*) exists to do, and either would be
> the right answer in a real service. The file is here because this milestone's gate has to be readable
> *without* a schema, a migration or a package to configure — the lesson is "the state is on disk", and a
> database would put three moving parts between you and that one fact. **Swap it in** the moment you have two
> writers, need a query that isn't by id or by key, or want to stop replaying the whole file at startup; the
> `ICommandStore` seam from step 01 is what makes that a one-class change. Recorded as D1 and D7 in
> [../foundation/decision-log.md](../foundation/decision-log.md).

## Before you start

Step 01 complete: `ICommandStore` exists and everything depends on it; seven tests green.

## Do this

1. In `src/Api/Contracts.cs`, add one record at the end of the file. This is the shape of a single line in the
   data file — the command plus the key it was created under, because the key must survive a restart too or
   every retry after a restart would create a duplicate.

   ```csharp
   public record StoredCommand(string IdempotencyKey, Command Command);
   ```

2. Create `src/Api/FileCommandStore.cs`.

   ```csharp
   using System.Collections.Concurrent;
   using System.Text.Json;

   namespace Api;

   public sealed class FileCommandStore : ICommandStore
   {
       private readonly string _filePath;
       private readonly ConcurrentDictionary<Guid, Command> _commandsById = new();
       private readonly ConcurrentDictionary<string, Guid> _commandIdsByKey = new();
       private readonly Lock _appendLock = new();

       public FileCommandStore(string dataDirectory)
       {
           Directory.CreateDirectory(dataDirectory);
           _filePath = Path.Combine(dataDirectory, "commands.jsonl");
           LoadFromDisk();
       }

       public void Add(string idempotencyKey, Command command)
       {
           var line = JsonSerializer.Serialize(new StoredCommand(idempotencyKey, command));

           lock (_appendLock)
           {
               File.AppendAllText(_filePath, line + "\n");
           }

           _commandsById[command.Id] = command;
           _commandIdsByKey[idempotencyKey] = command.Id;
       }

       public Command? FindById(Guid id) =>
           _commandsById.TryGetValue(id, out var command) ? command : null;

       public Command? FindByKey(string idempotencyKey) =>
           _commandIdsByKey.TryGetValue(idempotencyKey, out var id) ? FindById(id) : null;

       public IReadOnlyList<Command> All() => _commandsById.Values.ToList();

       private void LoadFromDisk()
       {
           if (!File.Exists(_filePath))
           {
               return;
           }

           foreach (var line in File.ReadAllLines(_filePath))
           {
               if (string.IsNullOrWhiteSpace(line))
               {
                   continue;
               }

               var entry = JsonSerializer.Deserialize<StoredCommand>(line);
               if (entry is null)
               {
                   continue;
               }

               _commandsById[entry.Command.Id] = entry.Command;
               _commandIdsByKey[entry.IdempotencyKey] = entry.Command.Id;
           }
       }
   }
   ```

3. Four decisions in that file are load-bearing rather than stylistic.

   **`Directory.CreateDirectory` is called unconditionally.** It is a no-op when the directory already exists,
   so there is no "does it exist?" branch to get wrong — and a first run on a clean machine works without the
   reader creating anything by hand.

   **The line terminator is `"\n"`, not `Environment.NewLine`.** A data file written on Windows and read on
   Linux must parse identically; hard-coding `\n` keeps the format platform-independent. `File.ReadAllLines`
   splits on either, so reading stays correct on both.

   **The write happens before the in-memory update, under a lock.** If the append throws — disk full, path
   denied — the dictionaries are left untouched, so the process's view still matches the file. Updating memory
   first would leave the service confidently serving a command that was never stored.

   **`Lock` is .NET 9+'s dedicated lock type** and is what `lock` should be used with on modern .NET; the older
   `object` still works. `ConcurrentDictionary` makes the dictionaries safe on their own, but *file appends*
   are not — two threads appending at once can interleave and produce a corrupt line.

## Done when (this step)

- [ ] `dotnet build` → `Build succeeded`, exits 0.
- [ ] `dotnet test` → **0 failed, 7 total**, exits 0. Nothing changed behaviourally: the class
      exists but nothing constructs it yet.
- [ ] `src/Api/FileCommandStore.cs` implements `ICommandStore` and the compiler is satisfied without any
      `NotImplementedException`.

## If it breaks

- **`CS0246: The type or namespace name 'Lock' could not be found`** → you are on an SDK older than .NET 9.
  Check `dotnet --version` against [../foundation/stack.md](../foundation/stack.md); on .NET 10 it resolves
  from `System.Threading` via implicit usings. As a fallback, `private readonly object _appendLock = new();`
  behaves the same.
- **`CS0535: does not implement interface member`** → a member's signature differs from `ICommandStore`. The
  nullable return types (`Command?`) are part of the signature.
- **`JsonException` at construction** → the data file contains a line that isn't a `StoredCommand`. Delete the
  file; you are still free to, as nothing depends on it yet.

---
> Nav: [← Put a seam in front of the store](01_the-store-seam.md) · [Overview](00_overview.md) · [Swap in the file store →](03_swap-in-the-file-store.md)
