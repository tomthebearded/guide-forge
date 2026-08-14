# Verified stack

> Pinned versions, official docs, and the date each was checked. **Every step in this guide builds against
> these exact versions.** Install these, not "latest" — the guide was written and verified against this
> snapshot, and a mismatch usually shows up as a flag that no longer exists rather than as a version error.

**Checked online: 2026-08-14.**

| Tool / library | Pinned version | Latest stable (as of 2026-08-14) | Official docs | Notes |
|---|---|---|---|---|
| .NET SDK | **10.0.302** | .NET 10 — **LTS**, GA 2025-11-11, end of support **2028-11-14** | [Releases and support](https://learn.microsoft.com/en-us/dotnet/core/releases-and-support) | The LTS track: three years of patches |
| ASP.NET Core | **10.0** | 10.0 | [What's new in ASP.NET Core in .NET 10](https://learn.microsoft.com/en-us/aspnet/core/release-notes/aspnetcore-10.0?view=aspnetcore-10.0) | Minimal APIs |
| `Microsoft.AspNetCore.Mvc.Testing` | **10.0.\*** | patch level **unverified** — resolved by `dotnet add package` | [Integration tests in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0) | Supplies `WebApplicationFactory<TEntryPoint>` and `TestServer`; copies the tested project's `.deps` file and sets the content root |
| xUnit | the `dotnet new xunit` template default | **unverified** | [Test Minimal API apps](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/test-min-api?view=aspnetcore-10.0) | The framework Microsoft's own Minimal-API testing article uses |
| `dotnet test` runner | **VSTest** — the SDK default | Microsoft.Testing.Platform available, opt-in | [dotnet test](https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-test) | .NET 10 adds `--test-runner`; the default is still VSTest, and this guide stays on the default |

## Target OS / shell(s)

**Windows + PowerShell** and **Linux/macOS + bash**. Every command in this guide runs on both; where the two
differ (path separators, mainly), the step gives each variant.

## Two verified facts this guide depends on

1. **`public partial class Program { }` is NOT required on .NET 10 — and the docs still say it is.** With
   top-level statements the compiler generates the `Program` class for you, and on this SDK it generates it
   **public**: `typeof(Program).IsPublic` returns `true`, and a test project names
   `WebApplicationFactory<Program>` with nothing added to `Program.cs`. Verified by building and running the
   solution on SDK 10.0.302 on 2026-08-14, not by reading it.
   Microsoft's [integration-tests article](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0)
   still instructs you to append that declaration; it has not caught up with the SDK. **Where the docs and the
   toolchain disagree about what compiles, the toolchain decides** — so this guide leaves the line out. On
   .NET 9 and earlier it is genuinely required.
2. **ASP.NET Core 10 ships no idempotency feature.** There is no built-in store, filter, or attribute to
   register — checked 2026-08-14 against the .NET 10 release notes. The idempotency logic in this guide is
   written by hand, on purpose.

## Unverified

The exact patch versions of `Microsoft.AspNetCore.Mvc.Testing` and xUnit are **not** pinned here: they are
resolved when you run `dotnet add package` / `dotnet new xunit`. Record whatever the CLI resolves in your own
`.csproj`, and treat that as your pin.
