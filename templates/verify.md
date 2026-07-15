<!--
TEMPLATE: NN_verify.md — the LAST file in every milestone folder. Two jobs:
  1. The milestone's full Done-when gate (the real acceptance test, by hand).
  2. The FILE CHECKPOINT — the complete current contents of every file this milestone created or modified.
Steps may teach an edit as a fragment ("add below X"); this file is where those files are shown WHOLE, so a
reader who lost the thread has one authoritative copy to diff against. Never let a file's final state exist
only as scattered fragments across steps — it must appear complete here.
Every step must obey the 10 pedagogy rules — see ../reference/pedagogy-rules.md.
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
     every file THIS MILESTONE CREATED OR MODIFIED, one full fenced block per file, labelled with its path.
     Whole file, not a diff or a fragment.
     - The "complete" claim covers ONLY the files rendered here. Never write a blanket claim like "the
       authoritative copy of every file in the project" unless you actually render every file — a claim you
       don't keep is worse than no claim. (Observed: spotify-trip M10/M11 and unity M7/07 claimed
       authoritative-copy-of-every-file but rendered fragments / omitted files.)
     - Files this milestone did NOT touch are OUT of the claim: list them by name under "Unchanged this
       milestone" and say they are unchanged since <earlier milestone> — do NOT render them and do NOT imply
       this checkpoint reproduces them.
     - Every file you DO name as created/modified here must appear as a COMPLETE block. A file listed as
       touched but shown only as a fragment is a broken checkpoint. -->
_This checkpoint renders the complete contents of every file created or modified in this milestone (listed
below). Files not listed were not touched this milestone._
### `<path/to/file>`
```<lang>
// the complete, current file — every line
```
### `<path/to/another/file>`
```<lang>
// complete, current
```

### Unchanged this milestone
<!-- Name the project files this milestone did NOT touch (or say "none"). They keep their contents from the
     milestone that last changed them and are NOT reproduced here. -->
- `<path/to/untouched/file>` — unchanged since <milestone>.

## What you have now (cumulative)
<!-- One short paragraph or list: the running state of the whole project after this milestone — what runs,
     what endpoints/screens/artifacts exist so far. Mirrors the overview Handoff's "Done so far". -->

## Troubleshooting
<!-- The handful of traps for THIS milestone's gate, each with the first thing to check (rule 10). -->
| Symptom | Likely cause → fix |
|---------|--------------------|
| <symptom> | <cause → fix> |

## Next
Continue to **[<next milestone> — <title>](../MILESTONE_<n+1>_<slug>/00_overview.md)**.
<!-- If this is the last milestone, say so instead and point back to the README. -->
