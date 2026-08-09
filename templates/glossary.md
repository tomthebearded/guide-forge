<!--
TEMPLATE: glossary.md — the running term list steps link into (supports rule 1.1).
Grows as the ladder introduces concepts. Keep definitions as short as the term allows, in plain language.
A step defines a term inline on first use, then links here for the reader who wants a little more.
Only include terms on topics the reader isn't Expert in (per the audience matrix) — don't define what they already know.

WORDS ONLY — NO FUNCTIONS. The glossary holds terms/concepts (words), never functions. A function that needs
explaining gets an INLINE CODE COMMENT where it's used, not a glossary entry — this holds for built-in library
methods (`toFixed()`, `ctx.fillRect()`) AND functions the guide itself writes (`spawnEnemy()`). See rule 1.1 in
../reference/pedagogy-rules.md.

ANCHOR FORMAT IS LOAD-BEARING: each term is a `### <term>` HEADING, not a bullet. GitHub auto-generates an
anchor from every heading (lowercased, spaces → hyphens, punctuation dropped), so a step can deep-link a term
with `[<term>](../glossary.md#<slug>)` and it resolves natively. Bullets have NO anchor, so `glossary.md#term`
links to a bulleted term silently fail (they scroll nowhere) — this is why terms must be headings.
(Slug rule: lowercase the term, replace each space with `-`, drop characters other than letters/digits/hyphens.
 e.g. `### Gamma color space` → `#gamma-color-space`; `### delta time` → `#delta-time`.)
-->

# Glossary — <project name>

> Terms the guide introduces, defined in plain language. Alphabetical order is the usual choice — it
> makes a growing list scannable — but any order a reader can predict works. **Words/concepts only — never a
> function** (functions are explained by an inline code comment where they're used). Each `### heading` is a
> stable deep-link target — steps link here with `../glossary.md#<slug>`.

### <term>
<short plain-language definition>. *(Introduced in [<milestone/step>](<link>).)*

### <another term>
<short plain-language definition>.
