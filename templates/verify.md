<!--
TEMPLATE: NN_verify.md — the LAST file in every milestone folder. Three jobs:
  1. The milestone's ONE Done-when gate (the real acceptance test, by hand). It lives here and nowhere else —
     the overview does not repeat it; a gate quoted in two files is a gate that drifts in one of them.
  2. The FILE CHECKPOINT — the complete current contents of every file this milestone created or modified,
     EXCEPT pre-existing files the guide only adds to (rule 4.3) — those are shown as the added region + its
     unique placement, not reproduced whole.
Steps may teach an edit as a fragment ("add below X"); this file is where files the GUIDE AUTHORED are shown
WHOLE, so a reader who lost the thread has one authoritative copy to diff against. Never let a guide-authored
file's final state exist only as scattered fragments across steps — it must appear complete here.
Every step must obey the pedagogy principles — see ../reference/pedagogy-rules.md.
-->

# <Milestone ID> · Verify — <milestone title>
> Nav: [← <last step>](NN-1_<slug>.md) · [Overview](00_overview.md) · [<next milestone> →](../MILESTONE_<n+1>_<slug>/00_overview.md)

## Done-when gate (the real test — check every box by hand)
<!-- The milestone's ONE acceptance test, aggregated from the per-step Done-whens. Observable conditions only,
     and each one shows its EXPECTED OUTPUT — the exact thing the reader sees if it worked (response body,
     console line, exit code, or the precise on-screen state). "It works" / "the endpoint responds" is not a
     gate: a reader can't diff reality against it. If the outcome is visual, describe the exact visible state.
     RULE 6.2 — each check must be observable in the environment this milestone tells the reader to run in. If
     that environment (debug session, dev server, emulator, preview build) overrides or duplicates the signal
     being read, a CORRECT build fails the gate: observe an unmasked channel, set the environment-specific
     variant too, or say in the check itself what that environment shows.
     RULE 6.3 — a command's expected output must be what the READER's terminal prints. If you observed it
     through a pipe, a redirect or a CI log, you probably saw a different renderer: gate on values (a count, a
     status, an exit code), never on a summary line to match character by character.
     RULE 6.4 — read the effect of the READER's code, never a scaffold's own output: not a template's wording,
     not an exhaustive file listing, not a size or a width you inferred instead of measuring.
     RULE 6.5 — if a check proves the gate by BREAKING something, run that mutation yourself first and write
     down what came back: which test goes red, on which assertion — or on which exception, if it dies before
     asserting. A mutation the suite survives is missing coverage, not a wording problem. -->
- [ ] <action — e.g. `curl -s localhost:8080/todos`> → <exact expected output — e.g. `[{"id":1,"title":"…"}]`, status 200>.
- [ ] <action> → <exact expected output>.
- [ ] <optional break recipe — e.g. comment out <line> → exactly <test> fails, on <assertion or exception>; restore and confirm green>.

## Files after this milestone (the checkpoint)
<!-- SCOPE THE COMPLETENESS CLAIM — don't over-promise. This section renders the COMPLETE current contents of
     every file THIS MILESTONE CREATED OR MODIFIED **that the guide authored**, one full fenced block per file,
     labelled with its path. Whole file, not a diff or a fragment.
     - The "complete" claim covers ONLY the guide-authored files rendered here. Never write a blanket claim like
       "the authoritative copy of every file in the project" unless you actually render every file — a claim you
       don't keep is worse than no claim. (Observed: guides claimed
       authoritative-copy-of-every-file but rendered fragments / omitted files.)
     - PRE-EXISTING files the milestone only ADDS to (rule 4.3) are the ONE exception: do NOT reproduce them
       whole (that would invite the reader to overwrite their real code). List them under "Pre-existing files
       modified" showing the added region + its unique placement anchor, not the whole file.
     - Files this milestone did NOT touch are OUT of the claim: list them by name under "Unchanged this
       milestone" and say they are unchanged since <earlier milestone> — do NOT render them and do NOT imply
       this checkpoint reproduces them.
     - Every guide-authored file you DO name as created/modified here must appear as a COMPLETE block. A
       guide-authored file listed as touched but shown only as a fragment is a broken checkpoint. -->
_This checkpoint renders the complete contents of every guide-authored file created or modified in this
milestone (listed below). Pre-existing files the milestone only added to are shown as their added region under
"Pre-existing files modified", not reproduced whole. Files not listed were not touched this milestone._
### `<path/to/file>`
```<lang>
// the complete, current file — every line
```
### `<path/to/another/file>`
```<lang>
// complete, current
```

### Pre-existing files modified
<!-- Rule 4.3: files that already existed and this milestone only ADDED to. Show the added region + its unique
     placement anchor, NOT the whole file. Say "none" if this milestone authored everything it touched. -->
- `<path/to/existing/file>` — added <what> after <unique anchor, e.g. the `init()` block ending `canvas.focus();`>.

### Unchanged this milestone
<!-- Name the project files this milestone did NOT touch (or say "none"). They keep their contents from the
     milestone that last changed them and are NOT reproduced here. -->
- `<path/to/untouched/file>` — unchanged since <milestone>.

## Troubleshooting
<!-- The handful of traps for THIS milestone's gate, each with the first thing to check (rule 5.1). -->
| Symptom | Likely cause → fix |
|---------|--------------------|
| <symptom> | <cause → fix> |

## Handoff
<!-- THREE LINES, not a report. The reader has just done the work and watched the gate pass — don't recap what
     they saw. This is the cumulative running state (carried forward from the previous milestone's handoff and
     appended), anything left open, and the door to the next milestone. It is the connective tissue of the
     ladder and the input the next milestone is drafted from, which is why it's cumulative and not just
     "what M4 did". -->
- **You now have:** <the running state of the whole project after this milestone — what runs, what
  endpoints/screens/artifacts exist so far, across every milestone to date>.
- **Open / deferred:** <anything uncertain or postponed, and the milestone that will take it — or "nothing">.
- **Next:** **[<next milestone> — <title>](../MILESTONE_<n+1>_<slug>/00_overview.md)** — <what it proves, one line>.
<!-- If this is the last milestone, say so on the "Next" line instead and point back to the README. -->

<!-- BOTTOM NAV — the SAME line as line 2, after a --- rule, as the last thing in the file. -->
---
> Nav: [← <last step>](NN-1_<slug>.md) · [Overview](00_overview.md) · [<next milestone> →](../MILESTONE_<n+1>_<slug>/00_overview.md)
