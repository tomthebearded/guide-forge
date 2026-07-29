# Glossary — Todo (Ionic + .NET)

> Terms the guide introduces, defined in plain language. Ordered alphabetically. Each step links here.
> Only terms on topics the reader isn't Expert in are defined — backend/.NET terms are assumed known.

<!-- Seeded from the plan; grows as steps introduce concepts. Backend-Expert terms (DbContext, DTO, minimal
     API, CORS, WebApplicationFactory) are listed briefly for cross-reference, not full teaching. -->

### `@for`
Angular's built-in template loop (`@for (x of items(); track x.id)`), rendering one block per item.

### `AlertController`
An Ionic service that builds and presents modal alerts/prompts programmatically.

### CORS (Cross-Origin Resource Sharing)
The browser rule that lets the API at `:5080` accept requests from the app at `:8100`. *(Backend-Expert topic; noted for reference.)*

### DbContext
EF Core's session-with-the-database object; here it wraps the in-memory store. *(Backend-Expert topic.)*

### DTO (Data Transfer Object)
A small record shaping a request/response body, separate from the entity. *(Backend-Expert topic.)*

### EF Core InMemory provider
An Entity Framework Core database that lives in process memory and resets when the API stops.

### HttpTestingController
Angular's test tool that intercepts and answers HTTP requests, so specs never hit the real backend.

### `ion-button`
Ionic's button component.

### `ion-checkbox` / `ion-label`
A checkbox control and a text label, placed inside an `ion-item` via `slot`.

### `ion-input`
Ionic's text field; two-way bind with `[(ngModel)]` (needs `FormsModule`).

### `ion-item-sliding`
A list row that reveals action buttons when swiped sideways (buttons live in an `ion-item-options` / `ion-item-option`).

### `ion-list` / `ion-item`
Ionic's list container and row components.

### `ion-segment`
Ionic's segmented control (a row of mutually-exclusive buttons).

### `ion-spinner`
Ionic's animated loading indicator.

### `ion-text`
A wrapper that applies Ionic text colors (e.g. `color="danger"`) to inline content.

### `ionChange`
The Ionic event a control emits **on user interaction** (not on programmatic changes, so no feedback loop when we reload).

### Ionic CLI
The command-line tool (`ionic`) that scaffolds and serves Ionic apps — like `ng` for Angular, but Ionic-aware.

### Ionic component (`ion-*`)
The umbrella term: a pre-built, mobile-styled UI element you use like a normal Angular component. The specific ones this guide uses are listed individually above.

### Ionic page shell
`ion-header` / `ion-toolbar` / `ion-title` frame the top bar; `ion-content` is the scrollable body every page wraps its content in.

### `ionic serve`
The Ionic CLI command that builds and serves the app in the browser with live reload (default port 8100).

### Ionic standalone starter
The `angular-standalone` template that scaffolds an Angular app using standalone components (no `NgModule`) with Ionic pre-wired.

### minimal API
ASP.NET Core's lightweight endpoint style (`app.MapGet(...)`) without controllers. *(Backend-Expert topic.)*

### proxy (dev)
An Angular dev-server rule that forwards `/api` calls to the backend so the browser sees one origin (no CORS in dev).

### signal
Angular's reactive state primitive; reading it in a template re-renders when it changes.

### standalone component
An Angular component that declares its own `imports` and needs no `NgModule`.

### TestBed
Angular's testing utility that stands up a component (or service) with its real dependencies in a configurable test module.

### WebApplicationFactory
The ASP.NET Core test host that spins up the real app in-process for integration tests. *(Backend-Expert topic.)*
