# Verified stack — spotify-trip

> Pinned versions and official docs for this guide, verified online on **2026-07-10**.
> Every milestone uses these exact versions. If you're following this later, re-check the "Latest stable"
> column — if it moved, reconcile before following (the review-before-follow gate).
>
> **Target OS / shells:** OS-agnostic (macOS · Linux · Windows). Shell commands are given for **macOS/Linux/Git
> Bash** and **Windows PowerShell**; where a gate check is shell-specific (e.g. the zone.js `dist/` search) both
> variants are shown. Dev serves on **`127.0.0.1`** (not `localhost`) on every OS — Spotify PKCE requires the
> loopback IP.

| Tool / library | Pinned version | Latest stable (as of 2026-07-10) | Official docs | Notes (renames · deprecations · install) |
|----------------|----------------|----------------------------------|---------------|------------------------------------------|
| Angular | **21.2.18** | 21.2.18 patch; **22.0.5** newest major | [angular.dev](https://angular.dev) · [versions](https://angular.dev/reference/versions) | 21 is LTS to ~May 2027. **Pinned to 21.2 for source fidelity** (see decision-log R1). Requires TS ≥5.9, Node `^20.19 \|\| ^22.12 \|\| ^24`. |
| Angular Material + CDK | **21.2.x** | tracks Angular major (22.x exists) | [material.angular.dev](https://material.angular.dev) · [theming](https://material.angular.dev/guide/theming) | Material 3; custom palette via `ng generate @angular/material:theme-color`. Version-matched to Angular — bump together. |
| TypeScript | **~5.9** | 5.9.x | [typescriptlang.org](https://www.typescriptlang.org/docs/) | Angular 21 requires ≥5.9. 5.9 tightened inference — watch generic/conditional-type errors. |
| RxJS | **~7.8** | 7.8.x | [rxjs.dev](https://rxjs.dev) | Used only at HTTP edges, then `toSignal`. |
| three | **~0.184** | 0.185.1 (r185) | [threejs.org/docs](https://threejs.org/docs/) | Pinned to 0.184 to match three-globe 2.45.2 (decision-log R2). WebGPU is production-ready but **not** used here (WebGL path). |
| three-globe | **2.45.2** | 2.45.2 | [github.com/vasturiano/three-globe](https://github.com/vasturiano/three-globe) | Peer dependency: `three`. Ship the lockfile pair. |
| Node.js | **24 LTS** (or 22.12+) | 26.5.0 Current; 24 LTS to Apr 2028 | [nodejs.org](https://nodejs.org) | Angular 21 needs `^20.19 \|\| ^22.12 \|\| ^24`. Recommend 24 LTS; 22 is entering maintenance. |
| npm | **11.x** | 11.x | [docs.npmjs.com](https://docs.npmjs.com) | `packageManager: npm@11.8.0` in the source lockfile. |
| Angular CLI | **21.x** | 21.x / 22.x | [angular.dev/cli](https://angular.dev/cli) | Run via `npx @angular/cli@21`. |
| angular-eslint / typescript-eslint | 21.x / 8.x | — | [angular-eslint](https://github.com/angular-eslint/angular-eslint) | Lint gate (no unit tests by design). |
| Prettier + organize-imports | 3.x / 4.x | — | [prettier.io](https://prettier.io) | `printWidth 100`, single quotes, trailing `all`, 2-space. |

## External services / data (no version pin — API contracts, verified reachable & current 2026-07-10)

| Service | Used for | Docs |
|---------|----------|------|
| Spotify Web API — Authorization Code + PKCE | Login, Liked Songs, playback, playlists, follow/save | [PKCE flow](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow) · [Web API ref](https://developer.spotify.com/documentation/web-api) |
| Wikidata Query Service (SPARQL) | Artist → ISO country (P1902 / P495 / P740 / P27 / P297) | [WDQS](https://query.wikidata.org) · [SPARQL service](https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service) |
| MusicBrainz API (ws/2) | Name-based artist fallback (`area`, MBID→Wikidata P434) | [MusicBrainz API](https://musicbrainz.org/doc/MusicBrainz_API) |
| REST Countries v3.1 | ~~Country facts for the hover/select panel~~ — **unused/descoped** (env config present but never wired in the source; see decision-log D7) | [restcountries.com](https://restcountries.com) |
| Natural Earth 110m (GeoJSON) | Country polygons + centroids on the globe | [natural-earth-vector](https://github.com/nvkelso/natural-earth-vector) |

## Install (the exact commands, at the pinned versions)

```bash
# Node 24 LTS + npm 11 assumed. Scaffold in M0:
npx @angular/cli@21 new spotify-trip --style=scss --ssr=false
cd spotify-trip
ng add @angular/material          # Material 3 custom theme
npm i three@~0.184 three-globe@2.45.2
npm i -D @types/three@~0.184 prettier prettier-plugin-organize-imports
# Serve on the loopback IP Spotify's PKCE redirect requires:
ng serve --host 127.0.0.1 --port 4200
```

## Version notes

- **Angular 22 exists but we pin 21.2.** A fresh `ng new` today installs 22 — pin the CLI (`@angular/cli@21`) so you don't drift. → decision-log R1. [angular.dev/reference/versions](https://angular.dev/reference/versions)
- **three moved to 0.185 (r185).** three-globe 2.45.2 shipped against ~0.184; pin `three@~0.184` to avoid peer breakage. → decision-log R2. [three-globe releases](https://github.com/vasturiano/three-globe)
- **Spotify removed the bulk `?ids=` endpoints (Feb 2026)** and Dev-Mode apps are capped at 25 manually-allowlisted users. This shapes the whole rate-limit + per-id fan-out design. → decision-log R3. [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- **MusicBrainz `User-Agent` can't be set from the browser** (forbidden header) — the 1 req/s pacing *is* the compliance. [MusicBrainz API](https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting)

> **Verified.** The online check ran on 2026-07-10; re-confirm the "Latest stable" column if you're following
> this guide much later.
