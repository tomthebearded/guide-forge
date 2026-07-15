# Audience model — spotify-trip

> The guide's north star. **Match explanation depth to the reader's level on that specific topic** —
> over-explaining an Expert topic wastes the reader's time as much as under-explaining a New one. Every step
> is drafted against this matrix.

## Granularity: **Standard**
Atomic steps: spell out every sub-action within a step, but bundle files created together into one step/commit.
Not max granularity — whole-app scope at max granularity would be unusable.

## Depth policy (how each level is treated)
- **Expert** → name it; no definition, no deep dive, no doc link (except a specific gotcha).
- **Intermediate** → a one-line reminder + a doc link; skip the fundamentals.
- **Beginner** → define on first use + doc link + a brief *why*.
- **New** → define + doc link + a short concept deep-dive callout + extra failure-mode notes.

## Per-topic expertise matrix

| Topic | Level | What that means when drafting |
|-------|-------|-------------------------------|
| Classic Angular (components, services, DI, RxJS, routing, guards) | **Intermediate (rusty)** | One-line reminders; refresh the shape, don't teach it from zero. |
| Modern Angular (signals, zoneless CD, standalone, `@if`/`@for`, `inject()`, `input()`/`output()`, Material 3 theming) | **New** | Define + doc link + deep-dive callout + failure notes on first use. |
| three.js / three-globe (scene/camera/renderer, render loop, disposal, globe polygons, custom layers) | **New — deepest tier** | The fullest teaching: every concept defined, deep-dive callouts, disposal/leak failure notes. |
| OAuth Authorization Code + PKCE / Spotify Web API | **New** | Teach the flow end to end from scratch. |
| Wikidata SPARQL + MusicBrainz (batch queries, P-properties, throttling) | **New** | Teach SPARQL shape, the P-property chain, and throttling from scratch. |
| GeoJSON / geo data (Natural Earth, ISO_A2 matching, centroids) | **New** | Define GeoJSON, ISO alpha-2, centroid; explain why 110m; failure notes. |
| localStorage persistence (snapshot cache, incremental rescan, export) | **New** | Teach the read/write/validate pattern, quota, and versioning from scratch. |

## Consequence for the guide
Most steps carry real teaching — only classic-Angular mechanics get the terse treatment. The three.js
milestone (M4) and the signal/zoneless material (M0, M2–M5) get the deepest callouts; the SPARQL/PKCE
material (M1, M5) is taught assuming zero prior exposure.
