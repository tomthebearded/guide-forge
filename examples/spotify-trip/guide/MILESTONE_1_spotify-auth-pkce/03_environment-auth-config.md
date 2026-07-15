# M1 · Step 03 of 10 — Environment: Spotify auth config (scopes + URLs)
> Nav: [← The token store](02_token-store.md) · [Overview](00_overview.md) · [The SpotifyAuth service →](04_spotify-auth-service.md)

## Glossary for this step
> **scope** — a permission string you request at login; the union of scopes here is the total set the whole app
> will ever need, so you consent **once**. See the
> [Spotify scopes reference](https://developer.spotify.com/documentation/web-api/concepts/scopes).
> **redirect URI** — the exact URL Spotify sends the browser back to after login. Must match a URI registered
> in your Spotify dashboard **character-for-character**.

## Why / design
The `SpotifyAuth` service (next step) and the interceptor (step 08) read all their endpoints and settings from
`environment`. M0 created `environment.ts` (production) and `environment.development.ts` (development, used by
`ng serve`) with just the `spotify.clientId` + `redirectUri` seed. This step fills in the rest of the Spotify
auth block: the **scopes**, the **authorize/token URLs**, and the **API base URL**.

Two files, because Angular's build swaps them:
- **`environment.development.ts`** — used by `npm start` (dev). Its `redirectUri` is
  `http://127.0.0.1:4200/callback`.
- **`environment.ts`** — used by `npm run build` (production). Same shape (so the app type-checks in a prod
  build), but `production: true` and a placeholder deploy `redirectUri`. We're not deploying (that's out of
  scope), but the shapes must match or `npm run build` fails.

> 📚 **New concept — request every scope once, up front.** OAuth **scopes** are permissions. Rather than
> re-prompting the user each time a new feature needs a new permission, this app requests the **full union** at
> the single login — read/modify library, playback, playlists, follow. For M1 only `user-read-private` really
> matters (M1 does no data calls), but requesting them all now means no second consent screen later. The scope
> list is therefore **mandatory as shown** even though most scopes go unused until later milestones. Reference:
> [Spotify scopes](https://developer.spotify.com/documentation/web-api/concepts/scopes).

**Load-bearing values (must match exactly):**
- `redirectUri: 'http://127.0.0.1:4200/callback'` — must equal a redirect URI registered in your Spotify app
  **and** the `callback` route string (step 07). Spotify **forbids `localhost`**; the loopback IP `127.0.0.1`
  is allowed. A one-character mismatch → `INVALID_CLIENT` / redirect-URI-mismatch at login.
- `authorizeUrl`, `tokenUrl`, `apiBaseUrl` — Spotify's fixed endpoints.

Everything else in the source `environment` (the `rateLimit` block, and the `musicbrainz` / `wikidata` /
`restCountries` hosts) belongs to **M2 (resilience)** and **M5 (country resolution)** — **do not add it now.**

## Do this
This step **edits two existing files**, committed together.

1. Open **`src/environments/environment.development.ts`** and replace its `spotify` object with the block
   below. `clientId` stays sourced from the gitignored `spotify-client-id.ts` (M0). Keep `production: false`.
2. Open **`src/environments/environment.ts`** and mirror the same `spotify` block, but keep `production: true`
   and leave the deploy placeholder `redirectUri` (we don't deploy in this guide).
3. Do **not** add `rateLimit`, `musicbrainz`, `wikidata`, or `restCountries` — those arrive in M2/M5. The
   `// grows in M2/M5` comment marks where.

## Code
### `src/environments/environment.development.ts`
```ts
import { SPOTIFY_CLIENT_ID } from './spotify-client-id';

export const environment = {
  production: false,
  spotify: {
    clientId: SPOTIFY_CLIENT_ID, // public PKCE id, kept out of git in spotify-client-id.ts
    redirectUri: 'http://127.0.0.1:4200/callback', // Spotify forbids `localhost`; loopback IP is allowed
    scopes: [
      'user-read-private',
      'user-top-read',
      'user-follow-read',
      'user-follow-modify',
      'user-library-read',
      'user-library-modify',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'playlist-read-private',
      'playlist-modify-public',
      'playlist-modify-private',
    ],
    authorizeUrl: 'https://accounts.spotify.com/authorize',
    tokenUrl: 'https://accounts.spotify.com/api/token',
    apiBaseUrl: 'https://api.spotify.com/v1',
    // grows in M2: a `rateLimit` block for the adaptive gate.
  },
  // grows in M2/M5: `musicbrainz`, `wikidata`, `restCountries` host config.
};
```
### `src/environments/environment.ts`
```ts
import { SPOTIFY_CLIENT_ID } from './spotify-client-id';

export const environment = {
  production: true,
  spotify: {
    clientId: SPOTIFY_CLIENT_ID, // public PKCE id, kept out of git in spotify-client-id.ts
    redirectUri: 'https://REPLACE_WITH_DEPLOYED_HOST/callback', // deployment is out of scope for this guide
    scopes: [
      'user-read-private',
      'user-top-read',
      'user-follow-read',
      'user-follow-modify',
      'user-library-read',
      'user-library-modify',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'playlist-read-private',
      'playlist-modify-public',
      'playlist-modify-private',
    ],
    authorizeUrl: 'https://accounts.spotify.com/authorize',
    tokenUrl: 'https://accounts.spotify.com/api/token',
    apiBaseUrl: 'https://api.spotify.com/v1',
    // grows in M2: a `rateLimit` block for the adaptive gate.
  },
  // grows in M2/M5: `musicbrainz`, `wikidata`, `restCountries` host config.
};
```

## Done when (this step)
- [ ] `npm run build` (production, reads `environment.ts`) compiles → **no errors**.
- [ ] In a `npm start` dev session, the login page (step 05) enables its button because
  `environment.spotify.clientId` is non-empty; if you log `environment.spotify.redirectUri` it prints exactly
  `http://127.0.0.1:4200/callback`.

## If it breaks
- **`Cannot find module './spotify-client-id'`** → the gitignored `spotify-client-id.ts` (M0) is missing. Copy
  `spotify-client-id.example.ts` to `spotify-client-id.ts` and paste your dashboard **Client ID**.
- **`npm run build` fails but `npm start` is fine (or vice-versa)** → the two `spotify` blocks drifted. The
  dev and prod files must have the **same keys** (only `production` and `redirectUri` differ).
- **Later, `INVALID_CLIENT` at login** → `redirectUri` here doesn't match the URI registered in the Spotify
  dashboard, or you used `localhost` instead of `127.0.0.1`.
