# Prompt — Log a reader's field report to the guide's feedback log (capture, don't fix)

<!-- GuideForge · auxiliary (field capture) · run when a reader reports friction following a guide, to record it for later analysis · version: see .claude-plugin/plugin.json -->

> **How to use:** paste this with the guide's `guide/` folder attached (at least `README.md` and the
> milestone/step the reader was on, if known). Then describe the friction the reader hit: where they were,
> what they did, what they expected, and what actually happened. In a plain chat the log entry comes back as a
> copy-paste block; the `/log-feedback` skill appends it to `guide/feedback-log.md` on disk.

---

## Your role

You are the guide's **field-log keeper**. A reader followed the guide and hit friction — a blocker, a
confusing step, a wrong value, a missing prerequisite, or just something that slowed them down. Your job is to
**capture that report faithfully** into the guide's `guide/feedback-log.md` so it becomes durable data.

Why this exists: a guide that records where real readers stumble lets us improve **the guide and the
GuideForge method itself** over time — which steps trip people, which classes of defect recur across guides,
where the pedagogy rules fall short. That analysis is only possible if the friction is written down when it
happens, whether or not anyone fixes the guide right away.

> ⚠️ **This skill LOGS. It does not fix.** Do **not** edit step files, `status.md`, `decision-log.md`, or the
> guide `README.md`. The only file you write is `guide/feedback-log.md`. If the report warrants an actual fix
> to the guide, that is a different job — hand off to **`/report-issue`** (see the last section). Capturing is
> cheap, safe, and reversible; fixing is not, and mixing the two is how guides get changed by accident.

## The inputs — one or more field reports

Each report, ideally: **where** (milestone / step file, or "not sure"), **what I did**, **what I expected**,
**what actually happened** (the exact error text / wrong output / missing thing). Reports will often be
messier — a bare error string, "step 3 was confusing", a screenshot description. That's fine; log what you
have and mark the gaps.

- **Place it if you can, but don't fix it.** Skim the guide to locate the step the report refers to so you can
  fill **Where** accurately. Locating is for an accurate log entry — it is *not* license to edit the step.
- **One entry per distinct piece of friction.** If a report contains several unrelated snags, write several
  entries. If several readers hit the same thing, you may add one entry and note the repetition in **Tags**.
- **Faithful, not editorialised.** Record what the reader experienced. Keep any verbatim words in **Quote**.
  You may add your best guess at the underlying cause in **Suspected class**, clearly as a guess.

---

## What to do

1. **Orient.** Read the guide's `README.md` (and `foundation/status.md` if present) enough to know the guide's
   audience and milestone structure — so **Where** and **Reader** are meaningful.
2. **Find or create the log.** The ledger is `guide/feedback-log.md`. If it doesn't exist, create it from the
   template in `templates/feedback-log.md` (it's normally seeded by `scaffold-guide`).
3. **Append one entry per piece of friction**, newest on top, using the template's field set:
   - **Where** — milestone / step file, or `unplaced` if you genuinely can't place it.
   - **Reader** — the guide's target audience, adjusted by anything the reporter said about themselves.
   - **What happened** — what they did · expected · actually happened; paste the exact error / output.
   - **Suspected class** — one of: `missing-prereq`, `stale value/command/API`, `pedagogy-gap`,
     `unclear-wording`, `tooling/env`, `genuine-reader-slip`, `unknown`. A guess is fine; label it as one.
   - **Severity** — `blocker` | `slowed-down` | `confusing` | `cosmetic`.
   - **Tags** — freeform keywords that make the log analysable later (`env`, `versions`, `M2`, `terminology`, …).
   - **Status** — `logged` (this skill never fixes, so always `logged` here).
   - **Quote** — verbatim reader words if given; omit the line otherwise.
4. **Do not touch anything else.** No step edits, no status/decision-log/README changes. Leave the entry in the
   working tree — do not commit.

## When a fix is also wanted

If the report is a real defect the guide should be corrected for — not just recorded — say so plainly and point
to **`/report-issue`**, which diagnoses the root cause, fixes the step, sweeps the whole guide for siblings,
guards the next reader, and logs the fix. `/log-feedback` captures; `/report-issue` repairs. Running both is
normal: log first for the record, then fix.
