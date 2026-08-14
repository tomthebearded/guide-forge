# M5 · Step 03 of 05 — Reject a reused key with a changed payload
> Nav: [← Validate the request](02_validate-the-request.md) · [Overview](00_overview.md) · [Test every failure →](04_the-error-tests.md)

## Why / design

Here is the case the whole guide has been building toward, and the one most implementations get wrong.

A client sends `Idempotency-Key: abc` with `{"type":"charge","payload":"42"}`. Later it sends
`Idempotency-Key: abc` with `{"type":"refund","payload":"99"}`. What should happen?

Replaying the first command — which is what the service does today — is the tempting answer and the wrong one.
The client asked to refund and received a charge, with a `201` telling it everything went fine. The bug is now
silent and lives in the client's data.

An idempotency key means **"this is the same operation as before"**. When the body says otherwise, the client
has contradicted itself — almost always by reusing a key it should have regenerated. The service cannot know
which of the two requests was intended, and guessing is the one thing it must not do. So it refuses, loudly,
with `409 Conflict`.

That is the difference between an idempotency key and a cache: a cache answers with whatever it has; an
idempotency key checks that you asked the same question.

This is recorded as D4 in [../foundation/decision-log.md](../foundation/decision-log.md).

## Before you start

Step 02 complete: an empty `type` is rejected; nine tests green.

## Do this

1. In `src/Api/Program.cs`, replace the replay block inside the `MapPost` handler. It currently reads:

   ```csharp
       if (store.FindByKey(idempotencyKey) is { } existing)
       {
           return Results.Created($"/commands/{existing.Id}", existing);
       }
   ```

   Replace those four lines with:

   ```csharp
       if (store.FindByKey(idempotencyKey) is { } existing)
       {
           if (existing.Type != request.Type || existing.Payload != request.Payload)
           {
               return Results.Problem(
                   title: "Idempotency key reuse",
                   detail: "This Idempotency-Key was already used with a different request body.",
                   statusCode: StatusCodes.Status409Conflict);
           }

           return Results.Created($"/commands/{existing.Id}", existing);
       }
   ```

2. Note what the comparison uses: the **stored command's own fields**, not a separate hash or a copy of the
   original request. `Command` already carries `Type` and `Payload`, so the service compares what it actually
   recorded against what is being asked for now. Storing a second copy of the request just to compare against
   it would give two things that can disagree.

3. Note also that the comparison is ordinary `string` equality, and that this is a **simplification worth
   knowing about**. Two JSON bodies can be semantically identical and differ as strings — different property
   order, different whitespace. A production service would compare a canonical hash of the request. Here the
   payload is a single string, so equality is exact and the point stays visible.

## Done when (this step)

- [ ] `dotnet build` → `Build succeeded`, exits 0.
- [ ] `dotnet test` → **0 failed, 9 total**, exits 0. Every existing test that reuses a key sends
      an identical body, so all of them still take the replay branch — which is the evidence this step didn't
      break idempotency while adding the conflict case.

## If it breaks

- **`PostCommand_SameKeyTwice_ReplaysResponseAndStoresOneCommand` now fails with `409`** → the comparison is
  inverted (`==` where `!=` belongs), so identical bodies are being treated as conflicts.
- **`IdempotencyKey_StillReplays_AfterAReload` fails with `409`** → the reloaded command lost a field on the
  way through the file, so the comparison sees a difference that isn't one. Check that `LoadFromDisk`
  deserializes the whole `Command`, and that `Payload` survives the round trip.
- **The conflict never triggers** → the guard sits after the `return Results.Created(...)` line instead of
  before it. Only the first `return` reached wins.

---
> Nav: [← Validate the request](02_validate-the-request.md) · [Overview](00_overview.md) · [Test every failure →](04_the-error-tests.md)
