# Glossary — spotify-trip

> Terms the guide introduces, defined in plain language. Ordered alphabetically. Each step links here.
> Seeded from the plan; entries gain their "(Introduced in …)" link as milestones are drafted.

### AIMD (Additive-Increase / Multiplicative-Decrease)
A self-tuning rate-limit strategy: grow the allowed rate slowly (+1 per clean window), cut it sharply (halve) when you hit a limit. Converges just under an unknown ceiling.

### async generator
A function (`async function*`) that `yield`s values over time; the caller pulls pages one at a time with `for await`, and can stop early. Used to stream Liked Songs page-by-page.

### centroid
The representative point of a country's largest landmass; where the globe places a marker or aims the flying plane.

### change detection (CD)
Angular's process of checking what changed and updating the DOM. **Zoneless** CD runs only when a signal it reads changes.

### code challenge / code verifier
The PKCE pair: a random high-entropy string (verifier) and its SHA-256 hash (challenge). The challenge goes out with the authorize request; the verifier proves you started the flow when exchanging the code.

### CSRF (Cross-Site Request Forgery)
An attack where a malicious page makes your browser complete an action (here, an OAuth callback) you didn't intend. The round-tripped `state` value defeats it: the callback is only accepted if its `state` matches the one stashed when *this* app started the login.

### DTO
**Data Transfer Object** — the raw shape an API returns, suffixed `Dto`. A mapper converts it to a clean domain model so API shapes never leak into the UI.

### effect()
An Angular API that runs a side-effect whenever the signals it reads change; here it's the bridge from signals into the imperative three.js renderer.

### GeoJSON
A JSON format for geographic shapes (country polygons). This app uses Natural Earth's 110m (low-detail, fast) country set.

### heat
The coloring of a country by how much of your library comes from it — either liked-track count or rounded liked-music hours.

### ISO 3166-1 alpha-2
The two-letter country code (e.g. `US`, `GB`) used to match resolved artists to GeoJSON country polygons (its `ISO_A2` field).

### ISRC
**International Standard Recording Code** — a globally unique id for a specific recording; used to tie the same track across album editions and to detect true duplicates.

### manual override
A country the user assigns to an artist by hand (`setCountry`). It is *sticky* (persisted, re-seeded on restore) and *wins over auto-resolution* (a rescan never overwrites it).

### MBID
A MusicBrainz identifier for an artist/recording; the bridge from a name-based MusicBrainz match back to Wikidata (via property P434).

### optimistic update
Apply a UI change immediately (before the server confirms), then reconcile or revert; makes player controls feel instant.

### P-property
A Wikidata property id (e.g. P495 country of origin, P17 country, P27 citizenship, P297 ISO alpha-2, P1902 Spotify artist id, P434 MusicBrainz id).

### PKCE (Proof Key for Code Exchange)
The OAuth extension that lets a browser app do Authorization Code flow with no client secret.

### recordingKey
This app's key for "the same recording": ISRC if present, else normalized title + a coarse duration bucket.

### rolling window
A rate limit measured over a sliding time span (e.g. ≤N requests in the last 30 s), not a fixed clock interval.

### signal
Angular's reactive state primitive: a getter you call (`count()`) that tracks reads and notifies dependents on write.

### snapshot ID
Spotify's version token for a playlist; comparing it tells the playlist index which playlists actually changed, so only those are re-paged.

### SPARQL
The query language for Wikidata's graph database; one batched query resolves 50 artists' countries at once.

### standalone component
An Angular component that declares its own imports (no NgModule); the default in modern Angular.

### two-tier resolution
Resolve artist countries fast via batched Wikidata, then fall back per-artist to MusicBrainz for the misses.

### zoneless
Running Angular without `zone.js`; change detection is driven by signals instead of monkey-patched async callbacks.
