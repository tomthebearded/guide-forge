# Glossary

> Terms this guide introduces, defined in plain language. Each is taught in the step that first uses it — this
> page is where you look it up again later. Terms are `###` headings so the deep links from each step's
> *Glossary for this step* block resolve.

### idempotency key

A value the *client* generates and sends with a write request so the server can recognise a retry. If the same
key arrives twice, the server must produce the same outcome as the first time — one record, one response — not
a second record. It answers "is this the same operation?", which is why reusing a key with a different body is
an error rather than a cache hit.

### idempotent

An operation that produces the same result whether it is performed once or many times. `GET` and `DELETE` are
naturally idempotent; `POST` is not, which is why it needs a key to become so.

### top-level statements

The C# feature that lets `Program.cs` contain executable statements directly, with no explicit `class` or
`Main` method. The compiler generates both. On **.NET 10** the generated `Program` class is **public**, so a
test project can name it as `WebApplicationFactory<Program>` with nothing extra. On .NET 9 and earlier it was
internal, which is why so much existing material tells you to append `public partial class Program { }` to
`Program.cs` — a line this guide does not need.

### Minimal API

ASP.NET Core's style of declaring HTTP endpoints as lambdas hung directly off the application object —
`app.MapGet("/path", () => …)` — with no controller class in between. It is the shape this whole guide uses.

### camelCase JSON

ASP.NET Core's default naming policy for JSON responses: a C# property called `Status` is serialized as
`status`. It applies on the way out and on the way in, which is why the tests can work in C# types on both
sides and never see the difference — but it *does* show up the moment a test asserts on a raw response body.

### SUT (system under test)

The project the tests exercise — here, `src/Api`. The term appears throughout Microsoft's testing docs, so
it's worth knowing when you follow the links.

### integration test

A test that exercises several components together through their real seams. In this guide that means a request
travelling the actual ASP.NET Core pipeline — routing, model binding, serialization — rather than a direct
call to a handler method with fake arguments.

### WebApplicationFactory

The class from `Microsoft.AspNetCore.Mvc.Testing` that boots your whole application **in the test process** and
hands you an `HttpClient` wired straight to it. No socket is opened and no port is bound, so tests run fast and
cannot collide with a server you left running.

### content root

The directory ASP.NET Core treats as the application's base for resolving configuration and static files. It
matters in tests because the test process runs from *its* output directory, not the service's — which is one
of the things `Microsoft.AspNetCore.Mvc.Testing` fixes for you.

### ConcurrentDictionary

A dictionary safe to read and write from several threads at once. It matters here because ASP.NET Core serves
requests concurrently: a plain `Dictionary` mutated from two requests can corrupt its internal state and throw
or hang on a later read, not merely lose a write.

### ProblemDetails

The standard machine-readable error body for HTTP APIs (RFC 9457): a JSON object with `type`, `title`,
`status` and `detail`. ASP.NET Core can produce it for you, so an error response carries the same shape
everywhere instead of a different ad-hoc string per endpoint.

### JSON Lines

A file format where each line is one complete JSON object. Appending a record is one write with no need to
re-serialize or re-parse the whole file, which is what makes it a reasonable append-only store.
