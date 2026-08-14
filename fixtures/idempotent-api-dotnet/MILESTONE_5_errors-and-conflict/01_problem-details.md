# M5 · Step 01 of 05 — Give every failure a body
> Nav: — · [Overview](00_overview.md) · [Validate the request →](02_validate-the-request.md)

## Glossary for this step

> New here: **[ProblemDetails](../foundation/glossary.md#problemdetails)** (defined under *Why / design*).

## Why / design

Both of the service's failures currently answer with a bare status code and an empty body. A client learns
*that* something went wrong and nothing about *what* — so every caller invents its own mapping from status
code to message, and they all disagree.

**`ProblemDetails`** is the standard fix: a JSON body with `type`, `title`, `status` and `detail`, defined by
RFC 9457 and understood by tooling across languages. One shape for every error the service can produce means a
client writes the handling once.

Nothing about the status codes changes in this step — a missing key is still `400`, an unknown id still `404`
— so the nine existing tests keep passing untouched. What changes is what accompanies them.

## Before you start

Milestone 4 complete: nine tests green, twice in a row.

## Do this

1. In `src/Api/Program.cs`, register the problem-details service. Put the line **directly below** the
   `builder.Services.AddSingleton<ICommandStore>(…)` registration, above `var app = builder.Build();`.

   ```csharp
   builder.Services.AddProblemDetails();
   ```

   > New concept — **`AddProblemDetails`**: registers the framework's generator for `ProblemDetails` bodies,
   > so responses the framework itself produces (an unhandled exception, a status code with no body) come back
   > in the same shape as the ones you write by hand. Without it, `Results.Problem` still works, but the
   > framework's own error responses stay bodyless — two shapes for one concept.
   > ([Handle errors in ASP.NET Core APIs](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/handle-errors?view=aspnetcore-10.0))

2. In `src/Api/Program.cs`, replace the missing-key rejection inside the `MapPost` handler. Find the block
   that currently reads `return Results.BadRequest();` and replace that single statement with:

   ```csharp
       return Results.Problem(
           title: "Missing Idempotency-Key",
           detail: "POST /commands requires an Idempotency-Key header.",
           statusCode: StatusCodes.Status400BadRequest);
   ```

3. In `src/Api/Program.cs`, replace the whole `app.MapGet("/commands/{id:guid}", …)` block so the miss carries
   a body too.

   ```csharp
   app.MapGet("/commands/{id:guid}", (Guid id, ICommandStore store) =>
       store.FindById(id) is { } command
           ? Results.Ok(command)
           : Results.Problem(
               title: "Command not found",
               detail: $"No command exists with id {id}.",
               statusCode: StatusCodes.Status404NotFound));
   ```

   `StatusCodes.Status404NotFound` is the framework's named constant for `404`. Writing the number works
   identically; the constant is what the docs use, and it makes a typo a compile error rather than a
   behaviour.

4. Note what the response now looks like, because step 04 asserts on it. The content type becomes
   `application/problem+json`, and the body carries the fields you set plus the ones the framework fills in:

   ```json
   {"type":"https://tools.ietf.org/html/rfc9110#section-15.5.5","title":"Command not found","status":404,"detail":"No command exists with id 8f14e45f-…"}
   ```

   The `type` URI is supplied by the framework from the status code. **Do not assert on the whole body** in
   your tests — assert on the fields you control, `title` and `status`, because the rest is the framework's to
   change between versions.

## Done when (this step)

- [ ] `dotnet build` → `Build succeeded`, exits 0.
- [ ] `dotnet test` → **0 failed, 9 total**, exits 0. The status codes didn't move, so the
      existing tests are unaffected — which is the evidence this step changed only the bodies.

## If it breaks

- **`CS0103: The name 'StatusCodes' does not exist`** → `StatusCodes` lives in `Microsoft.AspNetCore.Http`,
  which is part of the Web SDK's implicit usings. Check `Api.csproj` still has
  `<ImplicitUsings>enable</ImplicitUsings>`.
- **`PostCommand_WithoutKey_ReturnsBadRequest` fails with `500`** → `Results.Problem` was given a
  `statusCode` outside the 400–599 range, or none at all.
- **The lambda in action 3 won't compile** with "no implicit conversion" → both branches of the conditional
  must be `IResult`. `Results.Ok(...)` and `Results.Problem(...)` both are; a raw object is not.

---
> Nav: — · [Overview](00_overview.md) · [Validate the request →](02_validate-the-request.md)
