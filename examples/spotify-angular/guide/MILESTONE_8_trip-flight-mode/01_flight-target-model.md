# M8 · Step 01 of 12 — Trip types: `TripStop` + `FlightTarget`
> Nav: — · [Overview](00_overview.md) · [Persist the trip log →](02_trip-log-cache.md)

This step touches **2 files, committed together**: the persisted `TripStop` domain model and the `FlightTarget`
directive the renderer flies to. They're tiny and interdependent, so they land in one commit.

## Glossary for this step
> **FlightTarget** — the directive the globe needs to fly the plane for the *currently-playing* track:
> destination country, artist label + photo, and the track's runtime + current position (so the flight can be
> timed to arrive as the song ends).
> **TripStop** — a *finished* leg: a song that ended, logged with where and when the plane arrived. It rides in
> `localStorage`, so it's a persisted domain model.

## Why / design
Trip mode has two kinds of value flowing through it. The **live** one — "where is the plane going *right
now*" — is a `FlightTarget`: it changes on every track change and carries the timing the animation needs. The
**historical** one — "songs already played this trip" — is a list of `TripStop`s, which is what we persist and
show in the trip log + passport.

Keeping them as separate types matters: a `FlightTarget` holds volatile timing (`durationMs`/`progressMs`) that
means nothing once the song is over, so when a leg finishes we distil it down to a `TripStop` (dropping the
timing, stamping `arrivedAt`). Splitting the model here is what lets the `FlightStore` (step 04) treat "the
current flight" and "the trip log" as two clean signals.

`TripStop` lives in `core/models/` (it's persisted domain data, like every other cached model). `FlightTarget`
lives beside the flight code in `features/globe/`, and **re-exports** `TripStop` so flight callers can import
both flight types from one place.

## Do this
1. Create `src/app/core/models/trip-stop.ts` — the persisted finished-leg model. `countryCode` is nullable
   because an unknown-origin artist still logs a stop (it drifts over the Pacific); `artistId` is nullable so a
   stop can still link to the artist page when known.
2. Create `src/app/features/globe/flight-target.ts` — the live `FlightTarget` interface, plus a
   `export type { TripStop }` re-export so `flight-store`, `trip-log`, etc. import both from here.

## Code
### `src/app/core/models/trip-stop.ts`
```ts
/** A completed leg of the trip — a song that finished, logged with where and when it landed. */
export interface TripStop {
  /** The finished track's id (list key). */
  trackId: string;
  /** Primary artist's Spotify id — lets the trip log link to the artist page (e.g. to fix origin). */
  artistId: string | null;
  /** Destination country (ISO alpha-2), or null when the artist's origin was unknown. */
  countryCode: string | null;
  /** Primary artist name(s). */
  label: string;
  /** Artist photo URL, or null if unavailable. */
  imageUrl: string | null;
  /** Epoch ms when the song finished — i.e. when the plane arrived at this stop. */
  arrivedAt: number;
}
```

### `src/app/features/globe/flight-target.ts`
```ts
// TripStop is a persisted domain model (it rides in localStorage), so it lives in core/models;
// re-exported here so flight callers can keep importing both flight types from one place.
export type { TripStop } from '../../core/models/trip-stop';

/** What the globe needs to fly the plane for the currently-playing track. */
export interface FlightTarget {
  /** Identity — a change is what triggers a new leg (circle or flight). */
  trackId: string;
  /** Primary artist's Spotify id — lets the trip log link to the artist page (e.g. to fix origin). */
  artistId: string | null;
  /** Destination country (ISO alpha-2), or null when the artist's origin is unknown. */
  countryCode: string | null;
  /** Primary artist name(s), shown as the plane's label. */
  label: string;
  /** Artist photo URL for the plane badge, or null if unavailable. */
  imageUrl: string | null;
  /** Track runtime in ms. */
  durationMs: number;
  /** Playback position into the track in ms when this target was built. */
  progressMs: number;
}
```

## Done when (this step)
- [ ] `npx tsc --noEmit` (or the next `npm run build`) type-checks with both files present → no errors about
      missing `TripStop`/`FlightTarget` exports.
- [ ] In an editor, `import { FlightTarget, TripStop } from './flight-target'` (from a sibling file) resolves
      both names → no red squiggle.

## If it breaks
- **`Cannot find module '../../core/models/trip-stop'`** → the re-export path in `flight-target.ts` is wrong;
  `flight-target.ts` sits in `features/globe/`, so `core/models` is two levels up.
- **`'TripStop' is declared but its value is never read`-style import error elsewhere** → import it with
  `import type { TripStop }` where you only use it as a type; `flight-target.ts` re-exports it as a type
  (`export type { TripStop }`), which is correct.

---
> Nav: — · [Overview](00_overview.md) · [Persist the trip log →](02_trip-log-cache.md)
