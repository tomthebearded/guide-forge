# M2 · Step 07 of 12 — One gate per host (`RateLimiters`)
> Nav: [← Environment config](06_environment-config.md) · [Overview](00_overview.md) · [The interceptor →](08_rate-limit-interceptor.md)

## Why / design
`RateLimitGate` is deliberately *not* an Angular provider — it's a plain class you instantiate. `RateLimiters`
is the Angular-facing owner: a root singleton that **constructs one gate per external API** (Spotify, Wikidata,
MusicBrainz), each tuned from its `environment.<host>.rateLimit` block (step 06) and wired to its own persisted
schedule via `gateStatePersistence('<host>')` (step 05). It then answers one question the interceptor asks on
every request: **"which gate, if any, governs this URL?"**

- **URL-prefix matching, first-match-wins.** `match(url)` returns the gate whose configured base URL the request
  starts with. URLs that match *nothing* — Spotify's *auth* endpoints (`accounts.spotify.com`, handled by the
  M1 auth interceptor) and the local GeoJSON asset (M4) — return `null` and are **not paced**. Only the three
  data hosts are.
- **All three gates are created now, but only Spotify is exercised this milestone.** The Wikidata and MusicBrainz
  gates sit idle until M5/M6 make calls to those hosts — creating them here matches the source and keeps the
  pacing layer complete, at zero runtime cost (a gate does nothing until something `acquire()`s it).
- `spotify` is `public readonly` on purpose: M7's player poll reads `spotify.limited` to *skip* a poll during a
  cooldown instead of queuing it. `maxRetryAfterMs()` is first consumed in **M9** — the boot-sync /
  globe-store `pauseIfLimited` helper reads it to wait out a cooldown between steps. `anyLimited()` is a public
  **convenience affordance** (a one-call "is any host throttled right now?") that this guide never wires to UI —
  it comes free with the port; keep it or drop it, nothing depends on it. You don't use either this milestone.

## Do this
1. In `src/app/core/api/`, create `rate-limiters.ts` with the code below. It imports `environment`,
   `RateLimitGate` (step 04), and `gateStatePersistence` (step 05).
2. It's `@Injectable({ providedIn: 'root' })` — a single app-wide instance, per the "one store/owner per
   concern" convention. The three gate fields and the `byHost` prefix list are the whole class.
3. The **host labels** (`'Spotify'`, `'Wikidata'`, `'MusicBrainz'`) are cosmetic — they only appear in the
   rate-limit toast. The **prefixes** (`environment.spotify.apiBaseUrl`, etc.) are load-bearing — a typo means a
   host silently isn't paced.

## Code
### `src/app/core/api/rate-limiters.ts`
```ts
import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import { RateLimitGate } from './rate-limit-gate';
import { gateStatePersistence } from './rate-limit-state-cache';

/** A matched host's gate plus a human label for its rate-limit toast. */
export interface MatchedGate {
  gate: RateLimitGate;
  label: string;
}

/**
 * Owns one {@link RateLimitGate} per external API and matches an outgoing URL to its gate, so
 * {@link rateLimitInterceptor} paces **every** call to **every** API through the same mechanism
 * (spacing + adaptive rolling-window cap + 429 cooldown), each tuned per host in `environment`. URLs
 * that don't match a configured host — Spotify auth (`accounts.spotify.com`) and the local GeoJSON
 * asset — aren't paced.
 */
@Injectable({ providedIn: 'root' })
export class RateLimiters {
  /** Spotify gate, also read by the player poll (`.limited`) to skip polling during a cooldown. */
  readonly spotify = new RateLimitGate(
    environment.spotify.rateLimit,
    'spotify',
    gateStatePersistence('spotify'),
  );
  private readonly wikidata = new RateLimitGate(
    environment.wikidata.rateLimit,
    'wikidata',
    gateStatePersistence('wikidata'),
  );
  private readonly musicbrainz = new RateLimitGate(
    environment.musicbrainz.rateLimit,
    'musicbrainz',
    gateStatePersistence('musicbrainz'),
  );

  /** URL-prefix → gate, checked in order; the first prefix the request URL starts with wins. */
  private readonly byHost: { prefix: string; label: string; gate: RateLimitGate }[] = [
    { prefix: environment.spotify.apiBaseUrl, label: 'Spotify', gate: this.spotify },
    { prefix: environment.wikidata.sparqlUrl, label: 'Wikidata', gate: this.wikidata },
    { prefix: environment.musicbrainz.apiBaseUrl, label: 'MusicBrainz', gate: this.musicbrainz },
  ];

  /** The gate governing this URL's host, or null when the host isn't rate-limited. */
  match(url: string): MatchedGate | null {
    const hit = this.byHost.find((h) => url.startsWith(h.prefix));
    return hit === undefined ? null : { gate: hit.gate, label: hit.label };
  }

  /** Whether **any** host currently has an open 429 cooldown — the mechanism is identical per host. */
  anyLimited(): boolean {
    return this.byHost.some((h) => h.gate.limited);
  }

  /** The longest remaining cooldown across all hosts (0 when none), for a "paused for N min" notice. */
  maxRetryAfterMs(): number {
    return this.byHost.reduce((max, h) => Math.max(max, h.gate.retryAfterMs), 0);
  }
}
```

## Done when (this step)
- [ ] The file compiles. Sanity-check the matching logic once the app is running (step 12): in the console,
  `inject`ing isn't needed — you'll instead confirm via Network that `api.spotify.com/v1/*` requests are paced
  while `accounts.spotify.com/*` (auth) are not. `npm run build` is clean now.

## If it breaks
- **`wikidata`/`musicbrainz` flagged as unused** → they *are* used, inside the `byHost` array. Make sure you
  copied `byHost`; the private fields are referenced there.
- **A host isn't being paced** → its prefix in `byHost` doesn't match the real request URL. `match` uses
  `startsWith`, so `environment.spotify.apiBaseUrl` must be the exact prefix your `SpotifyApi` builds URLs from
  (both are `https://api.spotify.com/v1`).
- **Auth calls get paced (login stalls)** → a prefix accidentally matches `accounts.spotify.com`. Only the
  *API* base (`api.spotify.com/v1`) should be listed; auth stays unpaced.

---
> Nav: [← Environment config](06_environment-config.md) · [Overview](00_overview.md) · [The interceptor →](08_rate-limit-interceptor.md)
