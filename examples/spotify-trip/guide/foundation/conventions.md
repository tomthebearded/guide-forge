# Conventions — spotify-trip

> The rules every step in this guide follows. If a step seems to contradict one of these, the convention
> wins — fix the step. These are the source project's enforced house style (from its `CLAUDE.md`).

## Naming (suffix-less)
- Files are **kebab-case**; **no `.component` / `.service` suffix**. The class is the PascalCase of the file:
  `globe-page.ts → class GlobePage`, `spotify-api.ts → class SpotifyApi`, `auth-guard.ts → authGuard`.
- **One primary export per file.**
- Component **selectors keep the `app-` prefix** (`app-globe-page`).
- Raw API payloads are suffixed **`Dto`** (`SpotifyTrackDto`); everything else is a clean domain model.
- **Load-bearing names** (must match exactly, break otherwise): the `callback` route + the Spotify redirect
  URI `http://127.0.0.1:4200/callback`; all `localStorage` keys (`evm.origins`, `evm.likedIndex`,
  `evm.appearance`, `evm.viewPrefs`, `evm.syncState`, `evm.ratelimit.<host>`, …). Cosmetic names (component
  field names, local vars) are free to rename.

## Step-file layout (guide house style)
- **Nav line is line 2**, directly under the H1 with **no blank line** between, exactly three anchors:
  `> Nav: [← <prev>](<prev>.md) · [Overview](00_overview.md) · [<next> →](<next>.md)`. The middle anchor is
  always the literal **`[Overview]`** (not "Milestone overview" or any variant). First step's `← prev` is
  `—` (there is no previous step; the overview is already the middle anchor); `NN_verify.md`'s `next →`
  points at the next milestone's `../MILESTONE_<n+1>_<slug>/00_overview.md`.

## Structure / architecture (feature-first)
```
src/app/
  core/      auth · api · cache · geo · pipeline · models · dto · mappers · logging · util
  features/  auth · globe · player · settings · library · actions   (each owns a root-singleton store)
  shared/    toast · confirm · components/{header, country-picker, confirm-dialog}
```
- **One store service per feature**, `@Injectable({ providedIn: 'root' })`, exposing **readonly signals +
  methods**. Smart pages own the stores; dumb child components take signal inputs and emit outputs.
- **All external HTTP through typed client services in `core/api/`** — never HTTP from a component.
- Wiring lives in `app.config.ts` (providers) and `app.routes.ts` (lazy `loadComponent` routes).

## Data vs code
- **Persistence is `localStorage`**, via one shared `storage-cache.ts` (read/write/validate/quota-safe). Each
  cache file owns one namespaced `evm.*` key and a version field + a `sanitize`/`revive` validator.
- Mappers convert **`Dto → domain`** so API shapes never leak into the UI.

## Language / framework specifics (Angular 21, zoneless)
- `provideZonelessChangeDetection()` — **no `zone.js`** in polyfills.
- **`ChangeDetectionStrategy.OnPush` always.**
- **Signal IO only:** `input()` / `input.required()` / `output()` — **never** `@Input` / `@Output`.
- **New control flow:** `@if` / `@for` / `@switch` / `@let` — **never** `*ngIf` / `*ngFor`.
- **Separate `.html` + `.scss`** — no inline templates/styles.
- **`inject()` for DI** — no constructor injection.
- **Signals by default;** RxJS only at async/HTTP edges, then `toSignal`. **No NgRx.**
- **The three.js render loop must never touch signals / change detection** — it's a plain class with its own
  `requestAnimationFrame`; the only signal↔imperative bridge is the canvas component's `effect()`s.
- Strict TS: `strict` + `noUncheckedIndexedAccess` + `noPropertyAccessFromIndexSignature`, **no `any`**.

## Testing / verification
- **No unit tests, by design** (no `.spec.ts`). Every milestone's Done-when gate is the test — observable
  conditions paired with exact expected output.
- The per-milestone bar before "done": `npm run format:check`, `npm run lint`, `npm run build` all clean.
- **Formatting (Prettier):** `printWidth 100`, single quotes, semicolons, trailing commas `all`, 2-space
  indent, arrow parens always, organize-imports. No barrel files unless they earn their keep.
