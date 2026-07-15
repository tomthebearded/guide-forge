# M6 · Step 07 of 11 — Grow `GlobeStore`: heat-mode + `setCountry` + `hideUnplaced`
> Nav: [← scan-list](06_scan-list.md) · [Overview](00_overview.md) · [country-picker →](08_country-picker.md)

This step **edits one file**: `src/app/features/globe/globe-store.ts` (the M5 orchestrator). We add four
things; the rest of the file is unchanged. The **complete** grown file is in the
[verify checkpoint](11_verify.md#srcappfeaturesglobeglobe-storets) — this step teaches the edits as fragments.

## Glossary for this step
> **manual override** — a country the user assigns by hand that is *sticky* (persisted, re-seeded on restore) and *wins over auto-resolution* (a rescan never overwrites it). See [glossary](../foundation/glossary.md#manual-override).

## Why / design
This is the milestone's core lesson. Two of the four edits are the **manual-override pattern**; one is the
**heat-mode toggle** guide extension; one is a small helper the (dormant) scan-list needs.

**The override pattern was designed into M5 already — we're completing it.** Recall from M5:
- `manualOverrides` (a `Map<artistId, code>`) exists but nothing writes to it yet.
- `restore()` re-seeds `manualOverrides` from any persisted artist whose `manual` flag is `true`.
- `accumulate()` (the scan) already prefers `manualOverrides.get(id)` over any auto-resolved country.
- The `ArtistOrigin.manual` and `.hidden` fields exist, marked "write path grows in M6".

So all that's missing is the **write path**: `setCountry` (and `hideUnplaced`). Once `setCountry` writes into
`manualOverrides` and flips `manual = true`, the M5 machinery makes the choice sticky (persisted via `save()`,
restored via `restore()`) and auto-immune (a rescan's `accumulate()`/`fastWorker`/`slowWorker` all skip an
artist that's `manual`). **That** is why a manual fixup wins over auto — we didn't add a special case; M5's
paths already honour the flag.

**Heat-mode (guide extension).** M5 hard-codes `heat = this.tracksByCountry`. We replace that with a
`heatMode` signal and a computed that switches between the two per-country aggregates M5 already builds
(`tracksByCountry` for `'tracks'`, `durationByCountry` for `'hours'`). See
[decision-log D8](../foundation/decision-log.md#d8--heat-mode-toggle-tracks--hours-added-as-a-small-guide-extension).

## Do this

### 1. Add the `HeatMode` type
In `globe-store.ts`, just below the existing `GlobePhase` type declaration, add:

```ts
/** Which metric the globe heat encodes. Guide extension (M6) — the source only ever uses 'tracks'. */
export type HeatMode = 'tracks' | 'hours';
```

### 2. Turn `heat` into a mode-switching computed
Find this M5 line:

```ts
  /** Heat per country, keyed by ISO 3166-1 alpha-2 — Σ liked-track count. */
  readonly heat = this.tracksByCountry;
```

Replace it with the mode signal, the switching computed, and its two setters:

```ts
  /**
   * Which metric colours the globe. Guide extension (M6): the source hard-codes `heat =
   * tracksByCountry`. The genre / release-era / timeline filters that reshape these aggregates
   * arrive in M9.
   */
  private readonly _heatMode = signal<HeatMode>('tracks');
  readonly heatMode = this._heatMode.asReadonly();

  /** Heat per country (ISO alpha-2 → weight): liked-track count in 'tracks' mode, Σ ms in 'hours'. */
  readonly heat = computed(() =>
    this._heatMode() === 'hours' ? this.durationByCountry() : this.tracksByCountry(),
  );

  /** Set the heat metric (recolours the globe). */
  setHeatMode(mode: HeatMode): void {
    this._heatMode.set(mode);
  }

  /** Flip tracks ↔ hours. */
  toggleHeatMode(): void {
    this._heatMode.update((mode) => (mode === 'tracks' ? 'hours' : 'tracks'));
  }
```

> **`toggleHeatMode()` is a convenience affordance, not wired to a control in this guide.** The heat-legend UI
> flips the metric by calling `setHeatMode(mode)` with an explicit value (step 10), so `toggleHeatMode()` is
> never invoked anywhere in the guide. It's kept for parity with the source project's public store API (a
> caller can flip tracks↔hours without knowing the current mode); leave it in — it's a one-liner, not dead
> weight, and removing it would diverge from the source.

- **Why this just works:** `maxHeat` (M5) already computes its max over `this.heat()`, and the canvas binds
  `[heat]="store.heat()"`, so switching the mode recomputes both the ramp scale and the globe colours with **no
  other change**. In `'hours'` mode the weights are raw milliseconds — fine for the *relative* colour ramp; the
  page converts the legend's max to whole hours for display (step 10).

### 3. Add the manual-override write path (`setCountry`)
Add this method to the class (a natural home is right after `restore()`). It is the whole point of the
milestone:

```ts
  /**
   * Manually assign a country to an artist; sticky across future runs. Works even for an artist not
   * yet in the globe dataset (e.g. opened from the library, M10): a minimal entry is created so the
   * choice persists and shows up. `name` labels that new entry — ignored when the artist exists.
   */
  setCountry(artistId: string, countryCode: string, name = ''): void {
    this.manualOverrides.set(artistId, countryCode);
    let artist = this.working.get(artistId);
    if (artist === undefined) {
      artist = {
        id: artistId,
        name,
        trackCount: 0,
        durationMs: 0,
        countryCode: null,
        tried: false,
        failed: false,
        manual: false,
      };
      this.working.set(artistId, artist);
    }
    artist.countryCode = countryCode;
    artist.manual = true;
    artist.tried = true;
    artist.failed = false;
    this.publish();
    this.save();
  }
```

- **`manual = true`** is the load-bearing flag: `restore()` reads it back into `manualOverrides`, and the scan
  workers skip `manual` artists — together, sticky + wins-over-auto.
- **`publish()`** snapshots `working` into the `_artists` signal → the aggregates recompute → the globe recolours
  **immediately**. **`save()`** (not `saveDebounced`) writes `evm.origins` right away, so a reload keeps it.

### 4. Add `hideUnplaced` and `showGlobe`
`hideUnplaced` powers the unplaced list's "hide" button (step 09); `showGlobe` is the dormant scan-list's
`done` target (step 06). Add both:

```ts
  /** Dismiss an artist from the "couldn't place" list (e.g. one that has no real country). */
  hideUnplaced(artistId: string): void {
    const artist = this.working.get(artistId);
    if (artist === undefined) {
      return;
    }
    artist.hidden = true;
    this.publish();
    this.saveDebounced();
  }

  /** Return the page to the globe view — the (dormant in M6) scan-list's `done` target. */
  showGlobe(): void {
    this._phase.set('globe');
  }
```

- `hideUnplaced` sets `hidden = true`; M5's `unplaced` computed already filters `!a.hidden`, so the row drops
  out and stays out across reloads. It's a soft dismissal, so `saveDebounced` is fine (no rush).

> **Scope note.** The final source's store also grows `setGenre` / `setAsOfMonth` / `setEraDecades`,
> `setFollowing` / `setGenres`, `recheckUnplaced`, `syncArtistInfo`, and a genre worker. Those belong to the
> filters + Actions milestone (**M9**) and the library-console milestone (**M10** — `setFollowing` / `setGenres`
> write-back) — deferred and left out here. The M6 store stays a compiling intermediate.

## Done when (this step)
- [ ] `npm run build` → compiles clean.
- [ ] In the browser console after a scan: `ng` isn't needed — just call the flow via the UI in step 10. For a
      quick unit check now, temporarily log `store.heat === store.tracksByCountry` — it should be **false** (it's
      a new computed, not the alias), confirming step 2 landed. Remove the log.

## If it breaks
- **`Property 'heat' is used before its initialization`** → you placed the `heat` computed *above*
  `durationByCountry`/`tracksByCountry`; it must stay where the M5 alias was (after both aggregate computeds).
- **A manual fixup gets overwritten by the next scan** → `setCountry` didn't set `manual = true`, or it wrote
  to `working` but not `manualOverrides`; both are required for the M5 scan paths to skip the artist.
- **The fixup vanishes after reload** → you called `saveDebounced()` instead of `save()` in `setCountry`, and
  the reload happened inside the debounce window. Use the immediate `save()`.
