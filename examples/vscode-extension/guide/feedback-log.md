# Feedback log — Live Recolor (VS Code extension)

> Append-only field log of friction readers hit while following this guide. Its purpose is to improve the
> guide **and** the GuideForge method over time — so entries are captured even when the guide is not (yet)
> changed. This is a **record, not a to-do**: logging an entry here does not by itself change the guide. To
> actually fix the guide from a report, run `/report-issue` (it fixes the root cause and sweeps for siblings).
>
> Written by `/log-feedback` (capture) and, when a fix ships, by `/report-issue`. Newest entries on top; one
> entry per distinct piece of friction. Use absolute dates (`2026-07-09`), never "today".

### 2026-07-13 · M4/03 (+ M5/07) `media/webview/main.js` · double-apply on every pick
- **Where:** M4 step 03 (and its M5 final rewrite, step 07) — the webview's `render()` / chip click handlers.
- **Reader:** guide audit.
- **What happened:** Selecting any chip stepped the history **twice** — `render()` ended with `apply()` and each click handler also called `apply()`, so two identical `apply` messages went to the provider per pick. The first **Revert** looked inert (it popped the duplicate snapshot), contradicting the M4/06 gate "one snapshot per apply".
- **Suspected class:** duplicated side-effect / apply called from two layers.
- **Severity:** medium (functional bug; Revert visibly wrong on the first click).
- **Tags:** `double-apply` `history` `webview`
- **Quote:** "each chip click handler does `render(); apply();` but render() already ends with apply()."
- **Status:** fixed via /report-issue (2026-07-13) — `render()` made pure; apply once per click + once from `init`; verify copies + gate/Revert wording reconciled; rule 5.1 guard added.

