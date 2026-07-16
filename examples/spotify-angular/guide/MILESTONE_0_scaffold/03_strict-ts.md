# M0 · Step 03 of 15 — Tighten the TypeScript strictness
> Nav: [← Scaffold the project](02_scaffold-project.md) · [Overview](00_overview.md) · [Prettier & ESLint →](04_prettier-eslint.md)

> **This step touches 2 files, committed together:** `tsconfig.json` (the flags) and `tsconfig.app.json` — the
> stricter compiler settings are one unit of work, so they land in one commit.

## Glossary for this step
> **`noUncheckedIndexedAccess`** — a TS flag that makes any indexed read (`arr[i]`, `obj[key]`) return `T | undefined`, forcing you to handle the "not there" case. Prevents whole classes of "cannot read property of undefined" bugs.
> **`noPropertyAccessFromIndexSignature`** — a TS flag that forbids `obj.foo` for a property that only exists via an index signature; you must write `obj['foo']`, which visually marks "this key isn't a declared field".

## Why / design
The scaffold already turns on Angular's `strict` preset. This guide goes further —
[conventions.md](../foundation/conventions.md) requires **`noUncheckedIndexedAccess`** and
**`noPropertyAccessFromIndexSignature`** on top of `strict`, and **no `any`** anywhere. These two flags are the
ones that catch the real bugs in a data-heavy app: array/`Map` lookups that might miss, and dynamic-key access
that pretends to be a real field. Setting them **now**, before any code exists, means every later file is
written against them — retrofitting them across 12 milestones would be brutal.

(The "no `any`" rule is enforced by ESLint in the next step, not by tsconfig — `@typescript-eslint`'s
`no-explicit-any` flags it. tsconfig handles the structural strictness.)

## Do this
1. Open `tsconfig.json` at the project root. Inside `compilerOptions`, confirm/add the two strict flags plus
   the supporting ones so the file matches the block below. The scaffold already includes `strict`,
   `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `skipLibCheck`, `isolatedModules`,
   `target`, and `module` — the lines you're **adding** are `noPropertyAccessFromIndexSignature`,
   `noUncheckedIndexedAccess`, `experimentalDecorators`, and `importHelpers`. Leave every other generated
   field at its default.
2. Open `tsconfig.app.json` and confirm it matches the block below (the scaffold's version is already very
   close — it extends the root config, excludes `*.spec.ts`, and sets an empty `types`). We keep **no
   `.spec.ts`** because this guide ships **no unit tests by design**
   ([decision R5](../foundation/decision-log.md#r5--no-automated-tests-accepted)).

## Code
### `tsconfig.json`
```jsonc
/* To learn more about Typescript configuration file: https://www.typescriptlang.org/docs/handbook/tsconfig-json.html. */
/* To learn more about Angular compiler options: https://angular.dev/reference/configs/angular-compiler-options. */
{
  "compileOnSave": false,
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "experimentalDecorators": true,
    "importHelpers": true,
    "target": "ES2022",
    "module": "preserve"
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  },
  "files": [],
  "references": [
    {
      "path": "./tsconfig.app.json"
    }
  ]
}
```
### `tsconfig.app.json`
```jsonc
/* To learn more about Typescript configuration file: https://www.typescriptlang.org/docs/handbook/tsconfig-json.html. */
/* To learn more about Angular compiler options: https://angular.dev/reference/configs/angular-compiler-options. */
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "types": []
  },
  "include": [
    "src/**/*.ts"
  ],
  "exclude": [
    "src/**/*.spec.ts"
  ]
}
```

## Done when (this step)
- [ ] `npx tsc -p tsconfig.app.json --noEmit` → exits with no errors (the empty scaffold still compiles under
      the tighter flags).
- [ ] `tsconfig.json` contains both `"noUncheckedIndexedAccess": true` and
      `"noPropertyAccessFromIndexSignature": true`.

## If it breaks
- **`tsc` reports errors in generated files**: the scaffold's `app.ts`/`app.config.ts` are clean under these
  flags — if you see errors, you likely have a stray edit or a JSON typo (a trailing comma, a missing quote)
  in `tsconfig.json`.
- **Editor stops recognizing `tsconfig`**: JSONC comments are fine in `tsconfig.json`, but a real syntax error
  (unbalanced brace) makes the whole file ignored — re-check the braces.

---
> Nav: [← Scaffold the project](02_scaffold-project.md) · [Overview](00_overview.md) · [Prettier & ESLint →](04_prettier-eslint.md)
