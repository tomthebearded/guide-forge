# M11 · Step 10 of 10 — Empty/first-run + error states, and a keyboard-a11y pass
> Nav: [← Actions "Clear all data"](09_actions-clear-data.md) · [Overview](00_overview.md) · [Verify the milestone →](11_verify.md)

## Why / design
This is a **verification pass**, not new features — the accepted suggestions **S3** (graceful empty/error states)
and **S4** (keyboard accessibility on the panels). The behaviours already exist across earlier milestones; the
finale's job is to prove they hold together and don't regress. No files change in this step; you're exercising
paths and confirming exact on-screen results.

We deliberately **don't** add anything the source lacks (no offline banner component, no Escape-to-close on the
panels — see the overview's Scope discipline). We confirm what's built:

- **First-run / empty (built M3–M9).** With no dataset, `GlobeStore.phase()` isn't `'globe'`, so the globe page
  renders `<app-scan-list>` (the "Load my music" prompt) instead of a blank globe. After **Clear all data**
  (step 09) you land in exactly this state — that's the intended empty state, not a bug.
- **Offline / network error (built M2).** A failed Spotify/Wikidata/geo request is retried by the resilience
  layer (network status 0 is retryable; 429 is not —
  [D2](../foundation/decision-log.md#d2--single-rate-limit-authority-429-excluded-from-retry)); when it finally
  fails, the HTTP error surfaces as a `Toast.error(...)` rather than a silent hang, and cached data keeps the
  globe usable.
- **403 needs-Premium (built M7,
  [R4](../foundation/decision-log.md#r4--split-the-m7-gate-read-only-vs-premium-controls)).** A free account
  still gets the **read-only** now-playing bar; only the transport controls 403, and `PlayerStore` maps that to
  a "needs Premium / active device" toast — no crash.
- **Panel keyboard access (S4, the M11 panels).** The gear + view-options fabs and every control inside them are
  native/Material widgets with `aria-label`s (step 06/08), so they're reachable and operable by keyboard alone.

## Do this
Run these checks by hand (serve with `ng serve --host 127.0.0.1 --port 4200`, logged in):

1. **Empty state.** Open `/actions` → **Clear all data** → confirm. When the page reloads and lands on `/globe`,
   confirm you see the **scan prompt** (`app-scan-list`, "Load my music"), *not* a blank/broken globe.
2. **Error state (offline).** Open DevTools → Network → set **Offline**. On `/actions`, click **Full re-scan**
   (Liked Songs). Confirm an **error toast** appears (bottom-centre, "Dismiss" action) rather than the UI
   hanging with no feedback. Set the network back to **Online**.
3. **403 / non-Premium (if you have a free account, or a token without playback scopes).** Start playback of any
   track in the Spotify app, confirm the now-playing bar shows it (read-only works), then press a transport
   control in the app → confirm a **needs-Premium/active-device toast**, and the app keeps running.
4. **Keyboard pass — gear panel.** Click nothing; drive it entirely from the keyboard:
   1. Press **Tab** repeatedly until the **gear fab** (bottom-right, `tune` icon) is focused (visible focus ring).
   2. Press **Enter** or **Space** — the panel opens.
   3. **Tab** into the panel; focus lands on the **Day mode** toggle (Space flips it).
   4. **Tab** again to the **marker group** (arrow keys move between markers).
   5. **Tab** through each **colour swatch** (Enter opens the OS colour picker).
   6. **Tab** through **Export / Import / Delete / Reset**.

   Confirm a screen reader (or the accessibility inspector) announces each control's label.
5. **Keyboard pass — view-options panel.** Tab to the **visibility fab** (`visibility` icon), Enter to open, Tab
   through the toggles + **Save image** + **Hide all**.

## Done when (this step)
- [ ] After **Clear all data** → reload lands on the **"Load my music"** scan prompt (not a blank globe).
- [ ] With the network **Offline**, a **Full re-scan** shows an **error toast** ("Dismiss" button), and going
      back **Online** lets a re-scan succeed.
- [ ] A free/limited account shows the **read-only now-playing bar**; a transport press yields a **needs-Premium**
      toast, no crash.
- [ ] The gear panel and the view-options panel are fully operable by **keyboard alone** — Tab to the fab,
      Enter/Space to open, Tab/arrow through every control — and each control announces a label.

## If it breaks
- **Blank globe instead of the scan prompt after a wipe** → `GlobeStore.phase()` didn't fall back to `'scan'`
  when the dataset emptied; confirm the wipe went through `DataTransfer.clear()` (step 09) and the app root
  re-hydrates on reload (M9 step 14).
- **Offline scan hangs silently** → the failing request bypassed the M2 resilience interceptor / `Toast`; check
  that the client call goes through `core/api` (never raw `fetch`/`HttpClient` from a component).
- **Keyboard focus never reaches the gear** → a positioned overlay with a higher `z-index` is trapping focus, or
  the fab lost its `mat-mini-fab` (which is a real `<button>`); the panels here are plain buttons + Material
  controls, all natively focusable.
- **Screen reader reads "button" with no name** → an `aria-label` was dropped from the trigger fab or a swatch
  (step 06) — restore it; the labels are the load-bearing part of the a11y pass.
