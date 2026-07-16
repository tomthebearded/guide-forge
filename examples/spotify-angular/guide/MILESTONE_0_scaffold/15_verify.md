# M0 · Verify — Scaffold & tooling
> Nav: [← Write the README](14_readme.md) · [Overview](00_overview.md) · [M1 — Spotify login (PKCE) →](../MILESTONE_1_spotify-auth-pkce/00_overview.md)

## Done-when gate (the real test — check every box by hand)
- [ ] `node -v` → `v24.x.x` (or ≥ `v22.12`); `npm -v` → `11.x.x`.
- [ ] `npm run format:check` → prints `All matched files use Prettier code style!` and exits 0.
- [ ] `npm run lint` → prints `All files pass linting.` and exits 0.
- [ ] `npm run build` → ends with `Application bundle generation complete.`, no errors.
- [ ] **No `zone.js` in the build:** searching the output prints nothing — macOS/Linux/Git Bash
      `grep -ri "zone.js" dist/`, or PowerShell `Get-ChildItem dist -Recurse -File | Select-String "zone.js"` —
      and `zone.js` does not appear in `package.json`. (`src/app/app.config.ts` has
      `provideZonelessChangeDetection()`; `src/main.ts` has no `import 'zone.js'`.)
- [ ] `npm start` → terminal shows `Local: http://127.0.0.1:4200/`. Opening it redirects `/` → `/globe` and
      shows the dark **Spotify Trip** toolbar over a deep-navy (`#0d1b2a`) page with the **Globe** placeholder
      and a `Clicked 0 times` button rendered in the pastel-mint primary color.
- [ ] **Signal repaint:** clicking that button updates the label to `Clicked 1 times`, `Clicked 2 times`, … live
      (proof zoneless CD works without `zone.js`).
- [ ] **Routing:** the header **Log in** link navigates to `/login` (URL changes, no reload) and shows the
      disabled **Log in with Spotify** placeholder; visiting `/nope` redirects to `/globe`.
- [ ] `src/environments/spotify-client-id.ts` holds your real Client ID and `git status` does **not** list it.

## Files after this milestone (complete — the checkpoint)

> **Scope note:** `package.json` below is the **M0 slice** — it deliberately omits `three`, `three-globe`, and
> `@types/three`; those are added in **M4**. Patch versions may differ slightly by scaffold date; the
> major.minor must be as shown (Angular/Material **21.2.x**, TS **~5.9**).

### `package.json`
```json
{
  "name": "spotify-angular",
  "version": "0.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve --host 127.0.0.1 --port 4200",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "lint": "ng lint",
    "format": "prettier --write \"src/**/*.{ts,html,scss}\"",
    "format:check": "prettier --check \"src/**/*.{ts,html,scss}\""
  },
  "private": true,
  "packageManager": "npm@11.8.0",
  "dependencies": {
    "@angular/animations": "^21.2.16",
    "@angular/cdk": "^21.2.14",
    "@angular/common": "^21.2.0",
    "@angular/compiler": "^21.2.0",
    "@angular/core": "^21.2.0",
    "@angular/forms": "^21.2.0",
    "@angular/material": "^21.2.14",
    "@angular/platform-browser": "^21.2.0",
    "@angular/router": "^21.2.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0"
  },
  "devDependencies": {
    "@angular/build": "^21.2.14",
    "@angular/cli": "^21.2.14",
    "@angular/compiler-cli": "^21.2.0",
    "@eslint/js": "^10.0.1",
    "angular-eslint": "21.4.0",
    "eslint": "^10.3.0",
    "prettier": "^3.8.1",
    "prettier-plugin-organize-imports": "^4.3.0",
    "typescript": "~5.9.2",
    "typescript-eslint": "8.59.2"
  }
}
```
### `angular.json`
```json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "cli": {
    "packageManager": "npm",
    "schematicCollections": ["angular-eslint"]
  },
  "newProjectRoot": "projects",
  "projects": {
    "spotify-angular": {
      "projectType": "application",
      "schematics": {
        "@schematics/angular:component": {
          "style": "scss"
        }
      },
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular/build:application",
          "options": {
            "browser": "src/main.ts",
            "tsConfig": "tsconfig.app.json",
            "inlineStyleLanguage": "scss",
            "assets": [
              {
                "glob": "**/*",
                "input": "public"
              }
            ],
            "styles": ["src/styles.scss"]
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "500kB",
                  "maximumError": "1MB"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "4kB",
                  "maximumError": "8kB"
                }
              ],
              "outputHashing": "all"
            },
            "development": {
              "optimization": false,
              "extractLicenses": false,
              "sourceMap": true,
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.development.ts"
                }
              ]
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular/build:dev-server",
          "configurations": {
            "production": {
              "buildTarget": "spotify-angular:build:production"
            },
            "development": {
              "buildTarget": "spotify-angular:build:development"
            }
          },
          "defaultConfiguration": "development"
        },
        "lint": {
          "builder": "@angular-eslint/builder:lint",
          "options": {
            "lintFilePatterns": ["src/**/*.ts", "src/**/*.html"]
          }
        }
      }
    }
  }
}
```
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
### `.gitignore`
```gitignore
# See https://docs.github.com/get-started/getting-started-with-git/ignoring-files for more about ignoring files.

# Compiled output
/dist
/tmp
/out-tsc
/bazel-out

# Node
/node_modules
npm-debug.log
yarn-error.log

# IDEs and editors
.idea/
.project
.classpath
.c9/
*.launch
.settings/
*.sublime-workspace

# Visual Studio Code
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
!.vscode/mcp.json
.history/*

# Miscellaneous
/.angular/cache
.sass-cache/
/connect.lock
/coverage
/libpeerconnection.log
testem.log
/typings
__screenshots__/

# System files
.DS_Store
Thumbs.db

# Local Spotify Client ID — public PKCE id, kept out of git (copy from the .example)
/src/environments/spotify-client-id.ts
```
### `src/main.ts`
```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
```
### `src/index.html`
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Spotify Trip</title>
    <base href="/" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/x-icon" href="favicon.ico" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap"
      rel="stylesheet"
    />
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
  </head>
  <body>
    <app-root></app-root>
  </body>
</html>
```
### `src/styles.scss`
```scss
// Angular Material 3 theming — "Deep Space Teal" dark scheme.
// Custom tonal palettes live in `styles/_theme-colors.scss` (generated from seed colors:
// primary #9fe0cf, secondary #a9d4f0, tertiary #c4b5e8, blue-tinted neutrals).
// Regenerate with `ng generate @angular/material:theme-color`.
@use '@angular/material' as mat;
@use './styles/theme-colors' as theme;

html {
  height: 100%;
  @include mat.theme(
    (
      color: (
        primary: theme.$primary-palette,
        tertiary: theme.$tertiary-palette,
      ),
      typography: Roboto,
      density: 0,
    )
  );

  // Lock the app to the dark scheme — this is a globe-in-space experience.
  color-scheme: dark;

  // App-level design tokens for non-Material surfaces (globe canvas, heat ramp).
  --space-void: #0d1b2a; // deepest background, behind the globe
  --space-surface: #1b2a3a; // raised panels / sidenav
  --neon-teal: #9fe0cf; // pastel mint — primary accent
  --neon-cyan: #a9d4f0; // pastel sky — secondary accent
  --neon-violet: #c4b5e8; // pastel lavender — tertiary accent
  --flight-marker: #4cc9f0; // now-playing marker icon fill
  // Heat ramp, cold (few/no artists) → hot (most artists). Three soft stops.
  --globe-land-cold: #7fa8c9; // few/no artists — pastel blue (cold)
  --globe-land-mid: #f3e0a0; // mid range — pastel yellow
  --globe-land-hot: #ef9a8a; // most artists — pastel coral (hot)
  --globe-land-empty-stripe: #c2ddf1; // light azure band
  --globe-land-empty-base: #a3aeba; // slate grey gap
  --globe-ocean: #000000; // sphere base
  --glow-shadow: 0 1px 8px rgb(0 0 0 / 25%); // soft neutral elevation
}

body {
  background-color: var(--space-void);
  color: var(--mat-sys-on-surface);
  font: var(--mat-sys-body-medium);
  margin: 0;
  height: 100%;
}

// Slim, theme-aware scrollbars for every scrollable surface.
* {
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, currentColor 28%, transparent) transparent;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, currentColor 28%, transparent);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, currentColor 45%, transparent);
}

// Error toast (MatSnackBar renders in the CDK overlay, so this must be global). Used from M2 onward.
.toast-error {
  --mdc-snackbar-container-color: var(--mat-sys-error-container);
  --mdc-snackbar-supporting-text-color: var(--mat-sys-on-error-container);
  --mat-snack-bar-button-color: var(--mat-sys-on-error-container);

  .mat-mdc-snack-bar-action {
    background: rgba(0, 0, 0, 0.32);
    border-radius: 6px;
  }
}
```
### `src/styles/_theme-colors.scss`
```scss
// This file was generated by running 'ng generate @angular/material:theme-color'.
// Proceed with caution if making changes to this file.

@use 'sass:map';
@use '@angular/material' as mat;

// Note: Color palettes are generated from primary: #9fe0cf, secondary: #a9d4f0, tertiary: #c4b5e8, neutral: #1A2230, neutral variant: #243042
$_palettes: (
  primary: (
    0: #000000,
    10: #00201a,
    20: #00382e,
    25: #004439,
    30: #025044,
    35: #185c50,
    40: #27695b,
    50: #438274,
    60: #5d9c8d,
    70: #77b7a7,
    80: #92d3c2,
    90: #aef0de,
    95: #bcfeec,
    98: #e5fff6,
    99: #f3fffa,
    100: #ffffff,
  ),
  secondary: (
    0: #000000,
    10: #001e2d,
    20: #00344a,
    25: #0e4057,
    30: #1e4b63,
    35: #2b576f,
    40: #38637b,
    50: #527c95,
    60: #6c96b0,
    70: #86b1cc,
    80: #a1cce8,
    90: #c4e7ff,
    95: #e3f3ff,
    98: #f5faff,
    99: #fbfcff,
    100: #ffffff,
  ),
  tertiary: (
    0: #000000,
    10: #1f143d,
    20: #352953,
    25: #40345f,
    30: #4c406b,
    35: #584b78,
    40: #645784,
    50: #7d709f,
    60: #9789ba,
    70: #b2a4d6,
    80: #cebff2,
    90: #e9ddff,
    95: #f6eeff,
    98: #fdf7ff,
    99: #fffbff,
    100: #ffffff,
  ),
  neutral: (
    0: #000000,
    10: #141c29,
    20: #29313f,
    25: #343c4b,
    30: #3f4756,
    35: #4b5362,
    40: #575f6f,
    50: #6f7788,
    60: #8991a2,
    70: #a3abbe,
    80: #bfc7d9,
    90: #dbe2f6,
    95: #ecf0ff,
    98: #f9f9ff,
    99: #fdfbff,
    100: #ffffff,
    4: #060e1c,
    6: #0b1421,
    12: #18202e,
    17: #222a39,
    22: #2d3544,
    24: #313948,
    87: #d2daed,
    92: #e0e8fc,
    94: #e7eeff,
    96: #f0f3ff,
  ),
  neutral-variant: (
    0: #000000,
    10: #101c2d,
    20: #253143,
    25: #303c4f,
    30: #3b475a,
    35: #475367,
    40: #535f73,
    50: #6c788c,
    60: #8591a7,
    70: #9facc2,
    80: #bbc7de,
    90: #d7e3fb,
    95: #ebf1ff,
    98: #f9f9ff,
    99: #fdfcff,
    100: #ffffff,
  ),
  error: (
    0: #000000,
    10: #410002,
    20: #690005,
    25: #7e0007,
    30: #93000a,
    35: #a80710,
    40: #ba1a1a,
    50: #de3730,
    60: #ff5449,
    70: #ff897d,
    80: #ffb4ab,
    90: #ffdad6,
    95: #ffedea,
    98: #fff8f7,
    99: #fffbff,
    100: #ffffff,
  ),
);

$_rest: (
  secondary: map.get($_palettes, secondary),
  neutral: map.get($_palettes, neutral),
  neutral-variant: map.get($_palettes, neutral-variant),
  error: map.get($_palettes, error),
);

$primary-palette: map.merge(map.get($_palettes, primary), $_rest);
$tertiary-palette: map.merge(map.get($_palettes, tertiary), $_rest);
```
### `src/app/app.config.ts`
```ts
import { provideHttpClient } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // No interceptors yet: authInterceptor is added in M1, rateLimitInterceptor in M2.
    provideHttpClient(),
    provideAnimationsAsync(),
  ],
};
```
### `src/app/app.routes.ts`
```ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'globe' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'globe',
    loadComponent: () => import('./features/globe/globe-page/globe-page').then((m) => m.GlobePage),
  },
  // M1 adds: the `callback` route (redirect URI http://127.0.0.1:4200/callback) + an authGuard on `globe`.
  // M9/M10 add: `actions` and `library/*` routes.
  { path: '**', redirectTo: 'globe' },
];
```
### `src/app/app.ts`
```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Header } from './shared/components/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
```
### `src/app/app.html`
```html
<app-header />
<main class="content">
  <router-outlet />
</main>
```
### `src/app/app.scss`
```scss
.content {
  display: block;
  min-height: calc(100dvh - 64px);
}
```
### `src/app/shared/components/header/header.ts`
```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [MatToolbarModule, MatButtonModule, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {}
```
### `src/app/shared/components/header/header.html`
```html
<mat-toolbar class="app-header">
  <a class="brand" routerLink="/globe">Spotify Trip</a>
  <span class="spacer"></span>
  <nav>
    <a mat-button routerLink="/globe" routerLinkActive="active">Globe</a>
    <a mat-button routerLink="/login" routerLinkActive="active">Log in</a>
  </nav>
</mat-toolbar>
```
### `src/app/shared/components/header/header.scss`
```scss
.app-header {
  display: flex;
  align-items: center;
  background: var(--space-surface);
  box-shadow: var(--glow-shadow);
}

.brand {
  font-weight: 500;
  text-decoration: none;
  color: var(--mat-sys-primary);
}

.spacer {
  flex: 1 1 auto;
}

nav .active {
  color: var(--mat-sys-primary);
}
```
### `src/app/features/auth/login-page/login-page.ts`
```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login-page',
  imports: [MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {}
```
### `src/app/features/auth/login-page/login-page.html`
```html
<section class="login">
  <h1>Spotify Trip</h1>
  <p>Log in to color a 3D globe by where your favourite artists come from.</p>
  <!-- Inert in M0 — the real PKCE login flow is wired in M1. -->
  <button mat-flat-button disabled>Log in with Spotify</button>
</section>
```
### `src/app/features/auth/login-page/login-page.scss`
```scss
.login {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: calc(100dvh - 64px);
  text-align: center;
  padding: 2rem;
}
```
### `src/app/features/globe/globe-page/globe-page.ts`
```ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-globe-page',
  imports: [MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './globe-page.html',
  styleUrl: './globe-page.scss',
})
export class GlobePage {
  /** Placeholder state — proves zoneless CD repaints on a signal write. Removed when M4 adds the real globe. */
  protected readonly clicks = signal(0);

  protected increment(): void {
    this.clicks.update((n) => n + 1);
  }
}
```
### `src/app/features/globe/globe-page/globe-page.html`
```html
<section class="placeholder">
  <h1>Globe</h1>
  <p>The 3D globe arrives in M4. For now, this button proves zoneless change detection works.</p>
  <button mat-flat-button (click)="increment()">Clicked {{ clicks() }} times</button>
</section>
```
### `src/app/features/globe/globe-page/globe-page.scss`
```scss
.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: calc(100dvh - 64px);
  text-align: center;
  padding: 2rem;
}
```
### `src/environments/environment.ts`
```ts
import { SPOTIFY_CLIENT_ID } from './spotify-client-id';

export const environment = {
  production: true,
  spotify: {
    clientId: SPOTIFY_CLIENT_ID, // public PKCE id, kept out of git in spotify-client-id.ts
    redirectUri: 'https://REPLACE_WITH_DEPLOYED_HOST/callback',
    // scopes + authorizeUrl/tokenUrl/apiBaseUrl added in M1; rateLimit + other services added in M2/M5.
  },
};
```
### `src/environments/environment.development.ts`
```ts
import { SPOTIFY_CLIENT_ID } from './spotify-client-id';

export const environment = {
  production: false,
  spotify: {
    clientId: SPOTIFY_CLIENT_ID, // public PKCE id, kept out of git in spotify-client-id.ts
    redirectUri: 'http://127.0.0.1:4200/callback', // Spotify forbids `localhost`; loopback IP is allowed
    // scopes + authorizeUrl/tokenUrl/apiBaseUrl added in M1; rateLimit + other services added in M2/M5.
  },
};
```
### `src/environments/spotify-client-id.example.ts`
```ts
// Template for your Spotify PKCE Client ID.
//
// Setup: copy this file to `spotify-client-id.ts` (same folder) and paste your Client ID.
// `spotify-client-id.ts` is gitignored so your ID never lands in source control. The ID is a
// *public* PKCE client id (not a secret) — this just keeps it out of the repo per project choice.
//
// Get one at https://developer.spotify.com/dashboard (set the redirect URI to
// http://127.0.0.1:4200/callback for dev).
export const SPOTIFY_CLIENT_ID = '';
```
### `src/environments/spotify-client-id.ts` (gitignored — holds your real Client ID)
```ts
export const SPOTIFY_CLIENT_ID = 'your-client-id-here';
```

### `README.md`
````markdown
# Spotify Trip

A 3D globe colored by where your favourite Spotify artists come from. Built with Angular 21 (zoneless) +
Angular Material 3, three-globe, and Wikidata/MusicBrainz.

## Prerequisites

- **Node 24 LTS** (or ≥ 22.12) and **npm 11**.
- A free Spotify account.

## Register a Spotify app

1. Open the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) → **Create app**.
2. Add the redirect URI **exactly** (must match character-for-character):
   - Dev: `http://127.0.0.1:4200/callback` — Spotify **forbids `localhost`**; the loopback IP is allowed.
   - Prod (optional): your deployed `https://<host>/callback`.
3. Under **Which API/SDKs…**, check **Web API**. Save.
4. **Development Mode:** a new app only works for accounts you allowlist under **Settings → User Management**
   — up to **25 users**. Add your own Spotify account, or login will fail.
5. Copy the **Client ID** (a *public* PKCE id — no secret needed) and set it up:
   ```bash
   cp src/environments/spotify-client-id.example.ts src/environments/spotify-client-id.ts
   # then paste your Client ID into spotify-client-id.ts
   ```
   `spotify-client-id.ts` is gitignored.

## Run

```bash
npm install
npm start        # serves http://127.0.0.1:4200
```

`npm start` binds to `127.0.0.1` on purpose, so the Spotify redirect URI matches its loopback requirement.

## Scripts

```bash
npm run build          # production build
npm run lint           # angular-eslint
npm run format         # prettier --write
npm run format:check   # prettier --check
```
````

> Plus the empty **placeholder folders** with `.gitkeep`: `src/app/core/{auth,api,cache,geo,pipeline,models,dto,mappers,logging,util}`,
> `src/app/features/{player,settings,library,actions}`, `src/app/shared/{toast,confirm}`. (`features/auth`,
> `features/globe`, and `shared/components` now hold real files.)

## What you have now (cumulative)
A running Angular 21 **zoneless** SPA shell on `http://127.0.0.1:4200`, themed with the custom Material 3 dark
"Deep Space Teal" palette. The header routes between a `/globe` placeholder (with a working signal-driven
counter proving zoneless CD) and an inert `/login` placeholder; unknown paths redirect to `/globe`. The tooling
gate (`format:check` / `lint` / `build`) is green, there's no `zone.js` in the build, the feature-first folder
tree is stamped, and a registered Spotify app's Client ID sits in the gitignored `spotify-client-id.ts` ready
for M1's login flow. No auth, HTTP, or globe logic exists yet — that's next.

## Troubleshooting
| Symptom | Likely cause → fix |
|---------|--------------------|
| `ng new` never prompts about Zoneless | You didn't pin the CLI — re-run `npx @angular/cli@21 new …` (step 02), or add `provideZonelessChangeDetection()` by hand (step 08). |
| `format:check` fails right after scaffolding | Scaffolded files aren't in Prettier's style yet — run `npm run format` once, then re-check (step 04). |
| `npm run lint` → "could not find lint target" | `ng add angular-eslint` didn't finish — re-run it; it must add the `lint` target + `schematicCollections` to `angular.json` (step 04). |
| `Can't find stylesheet to import ./styles/theme-colors` | `_theme-colors.scss` isn't in `src/styles/` — move it there / re-run the theme-color schematic (step 07). |
| Background still white | `styles.scss` missing the `mat.theme()` include or not listed in `angular.json` `styles` (step 07). |
| `Cannot find module './spotify-client-id'` | You made the `.example` but not the real `spotify-client-id.ts` — copy it (step 09). |
| Dev build uses the prod redirect | `fileReplacements` not in the **development** build config in `angular.json` (step 09). |
| `zone.js` appears in `package.json`/`dist` | Zoneless wasn't enabled — confirm no `import 'zone.js'` in `main.ts` and `provideZonelessChangeDetection()` in `app.config.ts`. |
| Button counter doesn't update on click | The template must read `clicks()` (parentheses) and the click must call `increment()` (step 10). |
| Header link reloads the whole page | Used `href` instead of `routerLink` (step 12). |

## Next
Continue to **[M1 — Spotify login (PKCE)](../MILESTONE_1_spotify-auth-pkce/00_overview.md)** — wire the real
"Log in with Spotify" button, the PKCE round-trip, the `callback` route, and an `authGuard` that protects
`/globe`.

---
> Nav: [← Write the README](14_readme.md) · [Overview](00_overview.md) · [M1 — Spotify login (PKCE) →](../MILESTONE_1_spotify-auth-pkce/00_overview.md)
