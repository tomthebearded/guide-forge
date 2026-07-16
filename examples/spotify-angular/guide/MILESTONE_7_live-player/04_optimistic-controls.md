# M7 · Step 04 of 8 — Optimistic controls + device auto-activation
> Nav: [← PlayerStore polling core](03_player-store-polling.md) · [Overview](00_overview.md) · [Toggle ❤ + add-to-playlist →](05_favourite-and-playlists.md)

## Glossary for this step
> **optimistic update** — apply the UI change immediately (before the server confirms), then reconcile against
> the real state or revert on failure. It's what makes the play/pause button feel instant even though Spotify's
> read lags the write by a fraction of a second. See [glossary](../foundation/glossary.md#optimistic-update).

## Why / design
This step extends `PlayerStore` with its **control half**: the transport buttons, the optimistic-update
machinery, and the `control()` wrapper that handles the "no active device" and Premium cases.

**The optimistic loop — apply → reconcile → revert.** Every toggle does three things in order:

1. **Apply:** `patch({ isPlaying: !wasPlaying })` merges the change into the state signal *now*, so the icon
   flips the instant you click.
2. **Fire + reconcile:** issue the real API call; `refreshSoon()` re-reads Spotify ~0.4 s later to replace the
   optimistic guess with the truth.
3. **Revert:** if the call failed, `patch()` the previous value back.

**`patch()` opens the suppress-poll grace window.** It sets `suppressPollUntil = now + CONTROL_GRACE_MS`
(1.5 s). A background poll that was already in flight when you clicked will return Spotify's *old* state; the
window (checked in `refresh()`, step 03) drops that stale read so it can't undo your optimistic patch. The
window is short enough that the next real poll reconciles quickly.

**`control()` — the device + Premium wrapper.** Playback control needs Premium **and** an active device
([R4](../foundation/decision-log.md#r4--split-the-m7-gate-read-only-vs-premium-controls)). `control()` centralises the failure handling:

- If the rate-limit gate has an open cooldown, don't even fire — toast and bail (a doomed control would only
  poke Spotify and surface a misleading "no device").
- On a **404** ("no active device" — Spotify goes idle after a while), call `activateDevice()`: pick an
  available Connect device, `transferPlayback` to it, wait `DEVICE_SETTLE_MS`, and **retry the action once**.
- Any other failure → `reportError()` maps the status to a specific toast: **403** → needs Premium + latest
  permissions; **401** → log out and back in; **429** → rate-limited; else a generic "is a device active?".

> 📚 Why 403 is ambiguous — Spotify returns `403` both for a *non-Premium* account and for a token issued
> *before* the playback scopes were granted. Re-login fixes the latter; Premium is required for the former —
> so the toast names both. This is the R4 "controls need Premium" gate made visible.

**Press-play with nothing loaded** starts the user's Liked Songs (shuffled) via `startFavourites()` instead of
a no-op resume — so the button always does something.

## Do this
All edits are in `src/app/features/player/player-store.ts`.

1. **Extend the imports** at the top: add `delay` and `Toast`.
2. **Add the `toast` injection** to the injected fields (below `rateLimit`).
3. **Add four constants** below `IDLE_POLL_EVERY`.
4. **Add the control methods** inside the `PlayerStore` class (place them after the constructor, before
   `refresh()` — order within the class is cosmetic, but this keeps public controls near the top).

## Code
### 1 — Extend the imports (top of the file)
Add these two lines to the existing import block:
```ts
import { delay } from '../../core/util/delay';
import { Toast } from '../../shared/toast';
```
The `@angular/core` and core-API imports from step 03 stay as they are.

### 2 — Add the `toast` injection
In the injected-fields block, below `private readonly rateLimit = inject(RateLimiters).spotify;`:
```ts
  private readonly toast = inject(Toast);
```

### 3 — Add the constants (below `IDLE_POLL_EVERY`)
```ts
/** Spotify's playback state lags a control action — re-read shortly after issuing one. */
const SETTLE_DELAY_MS = 400;
/** Give Spotify a moment to register a freshly-activated device before retrying a control. */
const DEVICE_SETTLE_MS = 450;
/** After an optimistic control, ignore lagging background polls this long so they don't revert it. */
const CONTROL_GRACE_MS = 1_500;
/** How many Liked Songs to queue when auto-starting favourites from an idle player. */
const FAVOURITES_BATCH = 50;
```

### 4 — Add the control methods (inside the `PlayerStore` class)
```ts
  async togglePlay(): Promise<void> {
    // Nothing loaded on any device → kick off the user's favourites instead of a no-op resume.
    if (!this.hasTrack()) {
      await this.startFavourites();
      return;
    }
    const wasPlaying = this.isPlaying();
    this.patch({ isPlaying: !wasPlaying });
    const ok = await this.control(() => (wasPlaying ? this.api.pause() : this.api.play()));
    if (!ok) {
      this.patch({ isPlaying: wasPlaying });
    }
    this.refreshSoon();
  }

  /**
   * Press-play with nothing active: start the user's Liked Songs (shuffled) on an available device.
   * Device waking + the no-device toast are handled by {@link control}; we just supply the tracks.
   */
  private async startFavourites(): Promise<void> {
    let uris: string[];
    try {
      uris = await this.api.getLikedTrackUris(FAVOURITES_BATCH);
    } catch (error) {
      this.reportError(error);
      return;
    }
    if (uris.length === 0) {
      this.toast.error('No Liked Songs to play — like some tracks on Spotify first.');
      return;
    }
    await this.control(async () => {
      await this.api.play({ uris });
      await this.api.setShuffle(true);
    });
    this.refreshSoon();
  }

  /**
   * Start a specific track on the active device (the library "play this" affordance, used from M10).
   * Optimistically marks the bar as playing so it responds instantly.
   */
  async playTrack(uri: string): Promise<void> {
    this.patch({ isPlaying: true });
    await this.control(() => this.api.play({ uris: [uri] }));
    this.refreshSoon();
  }

  async next(): Promise<void> {
    await this.control(() => this.api.next());
    this.refreshSoon();
  }

  async previous(): Promise<void> {
    await this.control(() => this.api.previous());
    this.refreshSoon();
  }

  async toggleShuffle(): Promise<void> {
    const next = !this.shuffle();
    this.patch({ shuffle: next });
    const ok = await this.control(() => this.api.setShuffle(next));
    if (!ok) {
      this.patch({ shuffle: !next });
    }
    this.refreshSoon();
  }

  /**
   * Run a playback control. The usual "nothing happens" cause is Spotify having no *active* device
   * (it goes idle after a while) — on a 404 we activate an available device once and retry.
   */
  private async control(action: () => Promise<void>): Promise<boolean> {
    // Don't fire a doomed control into an active rate-limit cooldown — it would only poke Spotify and
    // surface a misleading "no device" error. Tell the user what's actually happening.
    if (this.rateLimit.limited) {
      this.toast.error('Spotify is rate-limiting the app — please wait a bit and try again.');
      return false;
    }
    try {
      await action();
      return true;
    } catch (error) {
      const noDevice = error instanceof HttpErrorResponse && error.status === 404;
      if (noDevice && (await this.activateDevice())) {
        try {
          await action();
          return true;
        } catch (retryError) {
          this.reportError(retryError);
          return false;
        }
      }
      this.reportError(error);
      return false;
    }
  }

  /** Make an available Spotify Connect device active so controls can target it. */
  private async activateDevice(): Promise<boolean> {
    try {
      const devices = await this.api.getDevices();
      const target = devices.find((device) => device.isActive) ?? devices[0];
      if (target === undefined) {
        return false;
      }
      await this.api.transferPlayback(target.id, this.isPlaying());
      await delay(DEVICE_SETTLE_MS);
      return true;
    } catch {
      return false;
    }
  }

  private refreshSoon(): void {
    setTimeout(() => void this.refresh(), SETTLE_DELAY_MS);
  }

  /** Optimistically merge a partial change into the current state (no-op if nothing is loaded). */
  private patch(change: Partial<PlaybackState>): void {
    this.suppressPollUntil = Date.now() + CONTROL_GRACE_MS;
    this._state.update((state) => (state === null ? state : { ...state, ...change }));
  }

  private reportError(error: unknown): void {
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    if (status === 404) {
      this.toast.error('No active Spotify device — start playing on a device, then try again.');
    } else if (status === 401) {
      this.toast.error('Log out and back in to grant Spotify playback permissions.');
    } else if (status === 403) {
      // 403 covers both a non-Premium account and a token issued before the playback scopes —
      // re-login fixes the latter; Premium is required for the former.
      this.toast.error(
        'Playback control needs Spotify Premium and the latest permissions — log out and back in.',
      );
    } else if (status === 429) {
      this.toast.error('Spotify is rate-limiting the app — please wait a bit and try again.');
    } else {
      this.toast.error('Could not control Spotify playback — is a Spotify device active?');
    }
  }
```

## Done when (this step)
- [ ] `npm run build` and `npm run lint` → both clean. `PlayerStore` now exposes `togglePlay`, `playTrack`,
  `next`, `previous`, `toggleShuffle` and holds the private `control` / `activateDevice` / `patch` /
  `refreshSoon` / `reportError` machinery. (`toast` and `patch` are now referenced, so no unused-member
  warnings.)
- [ ] The store still has no UI — controls are verified end-to-end in step 08 once the bar is wired.

## If it breaks
- **`'delay' is not exported`** → it's `src/app/core/util/delay.ts` from M2 (`export function delay`); the
  import path is `../../core/util/delay`.
- **`Property 'patch' does not exist`** → the methods were pasted *outside* the class braces. They must be
  members of `PlayerStore`, alongside `refresh()` from step 03.
- **`_state.update` type error** → `patch` takes `Partial<PlaybackState>`; make sure `PlaybackState` is still
  imported (from step 03's import block).
- **Two toasts on one failed control** → you called `reportError` *and* let the caller toast too. Only
  `control()`/`reportError()` should surface control errors; the toggles just `patch` back.

---
> Nav: [← PlayerStore polling core](03_player-store-polling.md) · [Overview](00_overview.md) · [Toggle ❤ + add-to-playlist →](05_favourite-and-playlists.md)
