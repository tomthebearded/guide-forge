# M5 · Step 02 of 05 — Validate the request
> Nav: [← Give every failure a body](01_problem-details.md) · [Overview](00_overview.md) · [Reject a reused key with a changed payload →](03_the-conflict-case.md)

## Why / design

`CreateCommandRequest` has two `string` properties, and nothing stops either from arriving empty. Today a
`POST` with `{"type":"","payload":""}` is stored happily — and worse, it is stored **under an idempotency
key**, so the nonsense becomes permanent: every retry with that key replays it forever.

That is the argument for validating **before** storing rather than cleaning up afterwards. In an idempotent
service, a bad write is not one bad record; it is a bad record you have promised to keep returning.

The check is deliberately small. Nothing here validates business meaning — `type` could be `"asdf"` and the
service accepts it, because this guide is not about a command vocabulary. It rejects only what is
structurally unusable.

## Before you start

Step 01 complete: failures answer with `ProblemDetails`; nine tests green.

## Do this

1. In `src/Api/Program.cs`, add the validation block inside the `MapPost` handler **immediately after** the
   missing-key check (the block ending in `Status400BadRequest);`) and **before** the
   `store.FindByKey(...)` lookup. Order matters: a request with no key and an empty body should be told about
   the key first, because that is the error it hits first on the wire.

   ```csharp
       if (string.IsNullOrWhiteSpace(request.Type))
       {
           return Results.Problem(
               title: "Invalid command",
               detail: "'type' must be a non-empty string.",
               statusCode: StatusCodes.Status400BadRequest);
       }
   ```

2. Read what you did **not** write, and why:

   - No check on `Payload`. An empty payload is a legitimate command — "cancel", "ping" — and rejecting it
     would encode an assumption this service has no business making.
   - No length limits, no character class, no allow-list of types. Each would need a rule this guide can't
     justify from its own requirements, and an unjustified rule is one a reader would carry into a project
     where it is wrong.
   - `string.IsNullOrWhiteSpace`, not `== null` or `Length == 0`. It catches all three of null, empty, and
     `"   "` — and a whitespace-only `type` is the case that would otherwise slip through and be stored.

3. Note that the request body itself could be absent entirely (`POST` with no content). ASP.NET Core rejects
   that before your handler runs, with a `400` of its own — and because of `AddProblemDetails` in step 01, it
   now comes back in the same `ProblemDetails` shape as the errors you write.

## Done when (this step)

- [ ] `dotnet build` → `Build succeeded`, exits 0.
- [ ] `dotnet test` → **0 failed, 9 total**, exits 0. Every existing test sends
      `new CreateCommandRequest("charge", "42")`, so none of them trips the new check — step 04 adds the test
      that does.

## If it breaks

- **An existing test now returns `400`** → the check landed in the wrong place, most likely above the
  missing-key block or outside the handler. It belongs after the key check and before the store lookup.
- **`CS0165: Use of unassigned local variable`** → the block was pasted inside the `if` for the key rather
  than after it. Check the brace nesting.

---
> Nav: [← Give every failure a body](01_problem-details.md) · [Overview](00_overview.md) · [Reject a reused key with a changed payload →](03_the-conflict-case.md)
