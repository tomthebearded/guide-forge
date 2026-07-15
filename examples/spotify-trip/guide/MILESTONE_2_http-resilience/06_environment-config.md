# M2 · Step 06 of 12 — Environment: the per-host rate-limit config
> Nav: [← Persist the schedule](05_rate-limit-state-cache.md) · [Overview](00_overview.md) · [Rate limiters →](07_rate-limiters.md)

> **This step edits two files, committed together:** `src/environments/environment.development.ts` (the
> dev-served values) and `src/environments/environment.ts` (the base/prod file, whose *shape* TypeScript
> compiles against). They must stay structurally identical.

## Why / design
The gate is written entirely against a `RateLimitConfig` (step 04) — no literals in the algorithm. This step is
where those literals live: one `rateLimit` block per host, in `environment`. Doing it here keeps the
*mechanism* (the gate) separate from the *tuning* (these numbers), exactly as
[decision-log R3](../foundation/decision-log.md#r3--teach-the-rate-limit-mechanism-document-dev-mode-limits-up-front)
asks — you can retune a host without touching the gate.

Two things to understand before you paste:

- **Both files must carry the same shape.** In Angular, the imports say `from '../../../environments/environment'`
  (i.e. `environment.ts`), and the dev build *file-replaces* it with `environment.development.ts` at build time
  (the M0 scaffold set this up in `angular.json`). TypeScript, though, type-checks against the literal import
  target — `environment.ts` — so if only the dev file had `rateLimit`, `environment.spotify.rateLimit` would be
  a **compile error** even in `ng serve`. Add the blocks to **both**; they differ only in `production` and
  `redirectUri`.
- **The AIMD comment is part of the teaching** — keep it. It explains that `maxPerWindow` is the *ceiling* the
  cap starts at and halves down from, not a fixed rate.

You're adding three hosts' `rateLimit`, plus the `wikidata.sparqlUrl` and `musicbrainz.apiBaseUrl` the next
step's `RateLimiters` needs. **`restCountries` is intentionally *not* added yet** — it arrives in M6 with the
REST Countries client (scope discipline).

## Do this
1. Open `src/environments/environment.development.ts`. Keep the existing M1 `spotify` OAuth fields
   (`clientId`, `redirectUri`, `scopes`, `authorizeUrl`, `tokenUrl`, `apiBaseUrl`) exactly as they are.
2. **Add** a `rateLimit` object inside `spotify`, and **add** the two new top-level blocks `musicbrainz` and
   `wikidata`, each with its own `rateLimit`. Use the exact values below — they're the source project's tuning
   (illustrative starting points, not sacred; the *shape* is mandatory).
3. Repeat the identical additions in `src/environments/environment.ts`. The only differences between the two
   files are `production: true` and the placeholder `redirectUri` — leave those as they were.
4. The **field names** (`minSpacingMs`, `windowMs`, `maxPerWindow`, `minPerWindow`, `baseCooldownMs`,
   `maxCooldownMs`) are load-bearing — they must match `RateLimitConfig` exactly. The **host keys**
   (`spotify`, `wikidata`, `musicbrainz`) and `wikidata.sparqlUrl` / `musicbrainz.apiBaseUrl` are load-bearing —
   `RateLimiters` reads them by name in the next step.

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
    // Spotify's Dev-Mode quota is undocumented, so the gate's cap is *adaptive* (AIMD): it starts at
    // `maxPerWindow` (the ceiling) and halves toward `minPerWindow` on each 429, then creeps back —
    // converging just under the real limit instead of relying on a fixed guess. `maxPerWindow` is
    // deliberately low (≈0.7 req/s sustained); the window shape mirrors Spotify's own rolling limit.
    rateLimit: {
      minSpacingMs: 600,
      windowMs: 30_000,
      maxPerWindow: 20,
      minPerWindow: 3,
      baseCooldownMs: 10_000,
      maxCooldownMs: 300_000,
    },
  },
  musicbrainz: {
    apiBaseUrl: 'https://musicbrainz.org/ws/2',
    // MusicBrainz wants a descriptive User-Agent, but browsers forbid setting it — the 1 req/s
    // throttle is our compliance. Kept here as documentation; swap in your own contact address.
    userAgent: 'EarthViewMusic/0.1 (contact: contact@example.com)',
    // MusicBrainz asks anonymous clients for ≤1 req/s; the window cap is set so spacing dominates.
    rateLimit: {
      minSpacingMs: 1_000,
      windowMs: 30_000,
      maxPerWindow: 30,
      minPerWindow: 3,
      baseCooldownMs: 5_000,
      maxCooldownMs: 120_000,
    },
  },
  wikidata: {
    sparqlUrl: 'https://query.wikidata.org/sparql',
    // WDQS has no published per-query ceiling but 429s under concurrent load; light spacing keeps the
    // batched scan + on-the-fly flight lookups from bursting. Window cap set so spacing dominates.
    rateLimit: {
      minSpacingMs: 250,
      windowMs: 30_000,
      maxPerWindow: 120,
      minPerWindow: 5,
      baseCooldownMs: 5_000,
      maxCooldownMs: 120_000,
    },
  },
};
```

### `src/environments/environment.ts`
```ts
import { SPOTIFY_CLIENT_ID } from './spotify-client-id';

export const environment = {
  production: true,
  spotify: {
    clientId: SPOTIFY_CLIENT_ID, // public PKCE id, kept out of git in spotify-client-id.ts
    redirectUri: 'https://REPLACE_WITH_DEPLOYED_HOST/callback',
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
    // Spotify's Dev-Mode quota is undocumented, so the gate's cap is *adaptive* (AIMD): it starts at
    // `maxPerWindow` (the ceiling) and halves toward `minPerWindow` on each 429, then creeps back —
    // converging just under the real limit instead of relying on a fixed guess. `maxPerWindow` is
    // deliberately low (≈0.7 req/s sustained); the window shape mirrors Spotify's own rolling limit.
    rateLimit: {
      minSpacingMs: 600,
      windowMs: 30_000,
      maxPerWindow: 20,
      minPerWindow: 3,
      baseCooldownMs: 10_000,
      maxCooldownMs: 300_000,
    },
  },
  musicbrainz: {
    apiBaseUrl: 'https://musicbrainz.org/ws/2',
    // MusicBrainz wants a descriptive User-Agent, but browsers forbid setting it — the 1 req/s
    // throttle is our compliance. Kept here as documentation; swap in your own contact address.
    userAgent: 'EarthViewMusic/0.1 (contact: contact@example.com)',
    // MusicBrainz asks anonymous clients for ≤1 req/s; the window cap is set so spacing dominates.
    rateLimit: {
      minSpacingMs: 1_000,
      windowMs: 30_000,
      maxPerWindow: 30,
      minPerWindow: 3,
      baseCooldownMs: 5_000,
      maxCooldownMs: 120_000,
    },
  },
  wikidata: {
    sparqlUrl: 'https://query.wikidata.org/sparql',
    // WDQS has no published per-query ceiling but 429s under concurrent load; light spacing keeps the
    // batched scan + on-the-fly flight lookups from bursting. Window cap set so spacing dominates.
    rateLimit: {
      minSpacingMs: 250,
      windowMs: 30_000,
      maxPerWindow: 120,
      minPerWindow: 5,
      baseCooldownMs: 5_000,
      maxCooldownMs: 120_000,
    },
  },
};
```

## Done when (this step)
- [ ] Both files compile and `environment.spotify.rateLimit.maxPerWindow` type-checks as `number` (hover it in
  the editor → `20`). `npm run build` is clean.

## If it breaks
- **`Property 'rateLimit' does not exist on type ...`** in step 07 → you added the block to only one environment
  file. Add it to **both** — TypeScript type-checks against `environment.ts`.
- **Two files drifted** → if you retune a value, change it in *both* files or dev and prod behave differently;
  the only intended differences are `production` and `redirectUri`.
