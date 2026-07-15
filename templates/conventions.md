<!--
TEMPLATE: conventions.md — the style/architecture rules the whole guide follows.
One place, referenced by every step, so no step re-argues a decision. The drafter (prompt 02) reads this
and makes every step conform. Fill with YOUR stack's rules.
-->

# Conventions — <project name>

> The rules every step in this guide follows. If a step seems to contradict one of these, the convention
> wins — fix the step.

## Naming
<!-- e.g. file naming, symbol casing, which names are load-bearing by convention. -->

## Structure / architecture
<!-- e.g. folder layout, module boundaries, the core patterns (data-driven? layered? event-based?). -->

## Data vs code
<!-- e.g. "new content = new data file, never a new code branch" — the extensibility rule, if any. -->

## Language / framework specifics
<!-- Version-pinned API choices, idioms to prefer, idioms to avoid. -->

## Commands / shells (cross-platform)
<!-- Which shells the guide targets (must match stack.md's "Target OS / shell(s)"). RULE: every command in a
     step or a Done-when gate must run on EVERY targeted shell — give a variant per shell when they differ
     (e.g. a bash `grep -q zone.js package.json` AND its PowerShell `Select-String -Quiet zone.js package.json`).
     Never ship a Unix-only command as the sole gate check when the guide also targets Windows/PowerShell.
     (Observed: spotify-trip M0's zone.js check was bash `grep` only, which fails on the reader's PowerShell.) -->

## Testing / verification
<!-- How "done" is proven in this project (the shape of Done-when gates). -->
