# M0 · Step 04 of 15 — Prettier, ESLint & npm scripts
> Nav: [← Tighten TypeScript](03_strict-ts.md) · [Overview](00_overview.md) · [Create the folder tree →](05_folder-tree.md)

> **This step touches several files, committed together:** `eslint.config.js`, `.prettierrc`, `.editorconfig`,
> and `package.json` (dev-deps + scripts). They are one unit of work — the tooling gate — so they land in one commit.

## Why / design
The guide has **no unit tests by design** ([R5](../foundation/decision-log.md#r5--no-automated-tests-accepted)) —
so the quality gate is **Prettier** (consistent formatting) + **angular-eslint** (lint) + `build`. Setting them
up now means every later step can end with "run `format:check` and `lint`" as a concrete pass/fail. Prettier's
`printWidth 100` + single quotes + `organize-imports` are what make the pasted code in this guide match what
lands on your disk, so a `format:check` stays green.

## Do this
1. Add angular-eslint (generates `eslint.config.js`, adds the `lint` target to `angular.json`, and sets
   `angular-eslint` as the schematic collection):
   ```bash
   ng add angular-eslint
   ```
   Accept the prompt to proceed. This installs `angular-eslint`, `typescript-eslint`, `eslint`, and `@eslint/js`.
2. Add Prettier and the import-organizer as dev dependencies:
   ```bash
   npm i -D prettier prettier-plugin-organize-imports
   ```
3. Replace the generated **`eslint.config.js`** with the block below. It's the angular-eslint default plus the
   two selector rules that pin our component prefix. The selector prefix **`app`** is **load-bearing** — every
   component in this guide uses `app-…` selectors and `appXxx` attribute directives; ESLint will fail the build
   if one drifts.
4. Create **`.prettierrc`** at the project root with the block below. `printWidth: 100`, `singleQuote: true`,
   `trailingComma: 'all'`, and the `organize-imports` plugin are **mandatory** — they define the code style the
   whole guide is written in.
5. Replace **`.editorconfig`** (the scaffold made a basic one) with the block below so editors match Prettier.
6. In **`package.json`**, set the `scripts` block exactly as below. `start` **must** carry
   `--host 127.0.0.1 --port 4200` (Spotify's redirect requires the loopback IP). Add the `format` and
   `format:check` scripts. Also set `"name": "spotify-trip"` and `"packageManager": "npm@11.8.0"`.
7. Format the whole project once so the baseline is clean: `npm run format`.

## Code
### `eslint.config.js`
```js
// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
```
### `.prettierrc`
```json
{
  "printWidth": 100,
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "arrowParens": "always",
  "bracketSpacing": true,
  "plugins": ["prettier-plugin-organize-imports"],
  "overrides": [
    {
      "files": "*.html",
      "options": {
        "parser": "angular"
      }
    }
  ]
}
```
### `.editorconfig`
```ini
# Editor configuration, see https://editorconfig.org
root = true

[*]
charset = utf-8
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.ts]
quote_type = single
ij_typescript_use_double_quotes = false

[*.md]
max_line_length = off
trim_trailing_whitespace = false
```
### `package.json` — the `scripts` block (leave `dependencies`/`devDependencies` as the tools wrote them)
```json
{
  "scripts": {
    "ng": "ng",
    "start": "ng serve --host 127.0.0.1 --port 4200",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "lint": "ng lint",
    "format": "prettier --write \"src/**/*.{ts,html,scss}\"",
    "format:check": "prettier --check \"src/**/*.{ts,html,scss}\""
  }
}
```

## Done when (this step)
- [ ] `npm run lint` → `All files pass linting.` (exit 0).
- [ ] `npm run format:check` → `All matched files use Prettier code style!` (exit 0).
- [ ] `npm start` → the terminal shows the server on `http://127.0.0.1:4200/` (not `localhost`).

## If it breaks
- **`npm run lint` → "could not find lint target"**: `ng add angular-eslint` didn't finish — re-run it; it must
  add a `lint` architect target to `angular.json` and set `"schematicCollections": ["angular-eslint"]`.
- **`format:check` fails on the freshly-scaffolded files**: run `npm run format` once to rewrite them to the
  configured style, then re-check. This is expected the first time.
- **`Cannot find module 'prettier-plugin-organize-imports'`**: the dev-dep install in step 2 didn't run — repeat
  `npm i -D prettier prettier-plugin-organize-imports`.
