# M0 · Step 09 of 15 — The environment + client-id pattern
> Nav: [← Wire the app providers](08_app-config.md) · [Overview](00_overview.md) · [Placeholder pages →](10_placeholder-pages.md)

> **This step touches several files, committed together:** `src/environments/environment.ts`,
> `environment.development.ts`, `spotify-client-id.example.ts`, the gitignored `spotify-client-id.ts`,
> `.gitignore`, and the `angular.json` file-replacement wiring. They're one pattern, so one commit.

## Glossary for this step
> **PKCE (Proof Key for Code Exchange)** — the OAuth extension that lets a browser app log in to Spotify with
> **no client secret**; it's why the Client ID here is *public*, not sensitive. You build it out fully in
> [M1](../MILESTONE_1_spotify-auth-pkce/01_pkce-primitives.md); for now just know "PKCE Client ID" means a
> public app identifier. See [glossary](../foundation/glossary.md#pkce-proof-key-for-code-exchange).

## Why / design
Angular 21 doesn't scaffold an `environments/` folder by default — we create it, because we need two configs:
a **dev** one (`environment.development.ts`) whose Spotify redirect is `http://127.0.0.1:4200/callback`, and a
**prod** one (`environment.ts`) that points at your deployed host. `angular.json` swaps the file at build time
via **file replacement** (the `development` config replaces `environment.ts` with `environment.development.ts`).
That dev-vs-prod redirect difference is the whole reason two files exist — Spotify's PKCE redirect URI must
match *exactly*, and dev must use the loopback IP.

The **Client ID** itself lives in a separate `spotify-client-id.ts` that is **gitignored**. It's a *public*
PKCE id (not a secret), but the source project keeps it out of the repo behind a checked-in
`spotify-client-id.example.ts` template. Both environment files import `SPOTIFY_CLIENT_ID` from it.

> This file **grows in M1/M2/M5**: `spotify.scopes`, `authorizeUrl`, `tokenUrl`, `apiBaseUrl` land in **M1**;
> the `rateLimit` block + `musicbrainz`/`wikidata`/`restCountries` sections land in **M2/M5**. M0 holds only
> `production` + `spotify.clientId`/`redirectUri`.

## Do this
1. Create `src/environments/environment.ts` (production) with the block below — redirect points at a
   placeholder host you'll replace when you deploy (out of scope here).
2. Create `src/environments/environment.development.ts` (dev) with the block below. Its `redirectUri` is
   **`http://127.0.0.1:4200/callback`** — this string is **load-bearing** and must match the Spotify dashboard
   redirect exactly (step 13). Spotify forbids `localhost`; the loopback IP is allowed.
3. Create `src/environments/spotify-client-id.example.ts` (checked into git — the template) with the block below.
4. Copy it to `src/environments/spotify-client-id.ts` (same folder). Leave the value `''` for now — you'll paste
   your real Client ID in step 13. This file is **gitignored**.
5. In `.gitignore`, add the ignore line for `spotify-client-id.ts` (block below shows the full file's tail).
6. In `angular.json`, under `projects.spotify-trip.architect.build.configurations.development`, add the
   `fileReplacements` array so dev builds swap in `environment.development.ts` (block below). The `production`
   config needs no replacement — it uses `environment.ts` as-is.

## Code
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
### `src/environments/spotify-client-id.ts` (gitignored — copy of the example for now)
```ts
export const SPOTIFY_CLIENT_ID = '';
```
### `.gitignore` — add this at the end (keep everything the scaffold generated above it)
```gitignore
# Local Spotify Client ID — public PKCE id, kept out of git (copy from the .example)
/src/environments/spotify-client-id.ts
```
### `angular.json` — the `development` build config gains `fileReplacements`
```jsonc
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
```

## Done when (this step)
- [ ] `npm run build` (production) → compiles; it uses `environment.ts`.
- [ ] `npm start` (development) → compiles; it swaps in `environment.development.ts` (redirect
      `http://127.0.0.1:4200/callback`).
- [ ] `git status` (if the repo is initialized) → does **not** list `src/environments/spotify-client-id.ts`.

## If it breaks
- **`Cannot find module './spotify-client-id'`**: you created the `.example` but not the real
  `spotify-client-id.ts` — copy the example to that exact filename.
- **Dev build still uses the prod redirect**: the `fileReplacements` block isn't in the **development** config
  (or has a typo in the paths) — re-check the `angular.json` edit.
- **Git wants to commit your Client ID**: the `.gitignore` line is missing or misspelled — it must be exactly
  `/src/environments/spotify-client-id.ts`.
