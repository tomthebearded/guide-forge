<!--
TEMPLATE: decision-log.md — non-obvious choices and their rationale.
So the reader learns WHY, not just WHAT — and so a future maintainer knows what's safe to change.
One entry per decision. Append-only; supersede rather than delete.
Every BUILD-VS-BORROW call from the plan (plan-guide Phase 2.5) is an entry here — the capability, which way it
went, and why — because that is the decision a reader most often wants to reverse later. Use the second shape
below for those; /amend-guide reads them when someone asks to swap a hand-rolled part for the library.

LANGUAGE — this is a `foundation/` doc: its section headings, table column keys and marks are the schema the
skills look things up by, so they stay ENGLISH in every guide, whatever the prose language. The prose you
write inside them follows the guide's prose language (conventions.md § Writing language).
-->

# Decision log — <project name>

> Why the guide is the way it is. Each entry: the decision, the reasoning, and what it rules out.

## <ID> — <short decision title>
- **Date:** <date>
- **Source:** <where this came from — a provided spec/file, the audience interview, or the Phase 0.5 web check; omit if decided here>.
- **Decision:** <what was chosen>.
- **Why:** <the reasoning; the alternatives considered>.
- **Rules out / trade-off:** <what this decision costs or forecloses>.
- **Revisit if:** <the condition under which this should be reconsidered>.

## <ID> — Build vs borrow: <capability>
<!-- One of these per row of the plan's build-vs-borrow table, whichever way the row went. -->
- **Date:** <date>
- **Source:** the plan's build-vs-borrow table (<the posture the plan set: borrow-first / balanced /
  build-first>), library verified <date>.
- **Decision:** **build by hand** / **borrow `<library> <version>`** (<official docs URL>).
- **Why:** <build → the mechanism this teaches, and that it's part of what the guide set out to teach; borrow →
  that it's plumbing on the way to the lesson, or a correctness-critical domain where hand-rolling is a trap>.
- **Rules out / trade-off:** <build → the edge cases the library handles and this code won't; borrow → the
  dependency, its API to learn, and the mechanism the reader doesn't see>.
- **Revisit if:** <build → the reader needs more than this covers; borrow → the dependency becomes unmaintained
  or the guide's goal shifts onto this capability>. Swapping it on a guide someone is already following is an
  amendment, not an edit — `/amend-guide`.
