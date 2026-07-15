<!--
TEMPLATE: glossary.md — the running term list steps link into (supports rule 1).
Grows as the ladder introduces concepts. Keep definitions ONE sentence, plain language.
A step defines a term inline on first use, then links here for the reader who wants a little more.
Only include terms on topics the reader isn't Expert in (per the audience matrix) — don't define what they already know.

ANCHOR FORMAT IS LOAD-BEARING: each term is a `### <term>` HEADING, not a bullet. GitHub auto-generates an
anchor from every heading (lowercased, spaces → hyphens, punctuation dropped), so a step can deep-link a term
with `[<term>](../glossary.md#<slug>)` and it resolves natively. Bullets have NO anchor, so `glossary.md#term`
links to a bulleted term silently fail (they scroll nowhere) — this is why terms must be headings.
(Slug rule: lowercase the term, replace each space with `-`, drop characters other than letters/digits/hyphens.
 e.g. `### Gamma color space` → `#gamma-color-space`; `### ctx.fillRect()` → `#ctxfillrect`.)
-->

# Glossary — <project name>

> Terms the guide introduces, defined in plain language. Ordered alphabetically. Each `### heading` is a stable
> deep-link target — steps link here with `../glossary.md#<slug>`.

### <term>
<one-sentence definition>. *(Introduced in [<milestone/step>](<link>).)*

### <another term>
<one-sentence definition>.
