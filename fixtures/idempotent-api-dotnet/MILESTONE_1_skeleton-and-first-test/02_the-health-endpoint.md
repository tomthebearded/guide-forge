# M1 · Step 02 of 05 — Replace the template endpoint with `/health`
> Nav: [← Create the solution and the API project](01_create-the-solution.md) · [Overview](00_overview.md) · [Add the test project →](03_the-test-project.md)

## Glossary for this step

> New here: **[camelCase JSON](../foundation/glossary.md#camelcase-json)** (defined under *Do this* 3).

## Why / design

The template ships a `/` endpoint returning the string `Hello World!`. You're replacing it with `/health`
returning a small JSON object, for one reason: **the first gate needs an exact expected value**. A bare string
gives you `Hello World!` to assert on, which proves the pipeline ran but teaches nothing about how a response
body is produced. A typed object returned as JSON exercises serialization — the part that will carry every
command in this guide — and gives the test a precise body to diff against.

## Before you start

Step 01 must be complete: `src/Api/Program.cs` exists and `dotnet build` succeeds.

## Do this

1. Open `src/Api/Program.cs`. The template generated three or four lines; **replace the entire file** with the
   code below. This is the one file in this guide you overwrite wholesale — it is generated code you didn't
   write, and from here on it's yours.

   ```csharp
   var builder = WebApplication.CreateBuilder(args);

   var app = builder.Build();

   app.MapGet("/health", () => Results.Ok(new HealthResponse("ok")));

   app.Run();

   public record HealthResponse(string Status);
   ```

2. Note where the `record` sits: **after `app.Run();`**, at the bottom of the file. That placement is
   **mandatory**, not style. A file using top-level statements must put every type declaration after the last
   executable statement; move the `record` to the top and the compiler rejects the file.

3. Understand what the response body will be, because the test in step 04 asserts it character for character:

   > New concept — **camelCase JSON**: ASP.NET Core's default JSON options rename properties to camelCase on
   > the way out. The C# property is `Status`; the JSON field is `status`.
   > ([Configure JSON options](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/responses?view=aspnetcore-10.0))

   So `new HealthResponse("ok")` is serialized as exactly:

   ```json
   {"status":"ok"}
   ```

   No spaces, no newline, and a lowercase `s`. That exact string is the gate in step 04.

## Done when (this step)

- [ ] `dotnet build` → `Build succeeded`, exits 0.
- [ ] `dotnet run --project src/Api` starts and prints a `Now listening on: http://localhost:<port>` line.
      Stop it with <kbd>Ctrl</kbd>+<kbd>C</kbd> — this is the last time in this guide you start the app by
      hand; from step 04 the tests do it for you.

## If it breaks

- **`Top-level statements must precede namespace and type declarations`** → the `record` is above
  `app.Run();`. Move it to the bottom of the file.
- **`The name 'Results' does not exist`** → the file is missing the framework's implicit usings, which means
  the project isn't a Web SDK project. Check that `src/Api/Api.csproj` opens with
  `<Project Sdk="Microsoft.NET.Sdk.Web">`; if it says `Microsoft.NET.Sdk`, the project was created with
  `dotnet new console` rather than `dotnet new web`.
- **The browser shows nothing at `/`** → expected. You replaced the `/` endpoint; the app now answers on
  `/health` only, and anything else is a 404.

---
> Nav: [← Create the solution and the API project](01_create-the-solution.md) · [Overview](00_overview.md) · [Add the test project →](03_the-test-project.md)
