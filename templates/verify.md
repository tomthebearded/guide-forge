<!--
TEMPLATE: NN_verify.md — the LAST file in every milestone folder. Two jobs:
  1. The milestone's full Done-when gate (the real acceptance test, by hand).
  2. The FILE CHECKPOINT — the complete current contents of every file this milestone created or modified,
     EXCEPT pre-existing files the guide only adds to (rule 4.3) — those are shown as the added region + its
     unique placement, not reproduced whole.
Steps may teach an edit as a fragment ("add below X"); this file is where files the GUIDE AUTHORED are shown
WHOLE, so a reader who lost the thread has one authoritative copy to diff against. Never let a guide-authored
file's final state exist only as scattered fragments across steps — it must appear complete here.
Every step must obey the 7 pedagogy principles — see ../reference/pedagogy-rules.md.
-->

# <Milestone ID> · Verify — <milestone title>
> Nav: [← <last step>](NN-1_<slug>.md) · [Overview](00_overview.md) · [<next milestone> →](../MILESTONE_<n+1>_<slug>/00_overview.md)

## Done-when gate (the real test — check every box by hand)
<!-- The full milestone acceptance test, aggregated from the per-step Done-whens. Observable conditions only,
     and each one shows its EXPECTED OUTPUT — the exact thing the reader sees if it worked (response body,
     console line, exit code, or the precise on-screen state). "It works" / "the endpoint responds" is not a
     gate: a reader can't diff reality against it. If the outcome is visual, describe the exact visible state. -->
- [ ] <action — e.g. `curl -s localhost:8080/todos`> → <exact expected output — e.g. `[{"id":1,"title":"…"}]`, status 200>.
- [ ] <action> → <exact expected output>.

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

## What you have now (cumulative)
<!-- One short paragraph or list: the running state of the whole project after this milestone — what runs,
     what endpoints/screens/artifacts exist so far. Mirrors the overview Handoff's "Done so far". -->

## Troubleshooting
<!-- The handful of traps for THIS milestone's gate, each with the first thing to check (rule 5.1). -->
| Symptom | Likely cause → fix |
|---------|--------------------|
| <symptom> | <cause → fix> |

## Next
Continue to **[<next milestone> — <title>](../MILESTONE_<n+1>_<slug>/00_overview.md)**.
<!-- If this is the last milestone, say so instead and point back to the README. -->

<!-- BOTTOM NAV — the SAME line as line 2, after a --- rule, as the last thing in the file. -->
---
> Nav: [← <last step>](NN-1_<slug>.md) · [Overview](00_overview.md) · [<next milestone> →](../MILESTONE_<n+1>_<slug>/00_overview.md)
