# M10 · Step 10 of 18 — The alphabet bar
> Nav: [← Shared ConfirmDialog](09_confirm-dialog.md) · [Overview](00_overview.md) · [The artist master table →](11_artist-table.md)

> **This step touches 3 files, committed together:** `features/library/alphabet-bar/alphabet-bar.ts` + `.html` +
> `.scss` — one small dumb component, so all three in one commit.

## Glossary for this step
> **dumb (presentational) component** — a component that owns no state and hits no service: it takes signal
> `input()`s and emits `output()`s, leaving all logic to its smart parent (the library page, step 12). Trivially
> reusable and testable.

## Why / design
The master list is browsed by initial. `AlphabetBar` is the sticky A–Z (+ `#` for non-alphabetic names) selector.
It's deliberately dumb:

- **`available` input** — the letters that actually have artists (from `LibraryStore.availableLetters`); every
  other letter renders **disabled**, so you never click into an empty view.
- **`selected` input** — the currently-picked letter (highlighted), or null.
- **`selectLetter` output** — emitted on click; the page decides what selecting means (it toggles).

> **Recurring model — signal IO only ([conventions](../foundation/conventions.md)):** `input()` / `output()`,
> never `@Input` / `@Output`; `@for` over the fixed `LETTERS` array, never `*ngFor`. The `role="tab"` /
> `aria-selected` attributes make the bar keyboard- and screen-reader-navigable.

The `LETTERS` constant is `A…Z` + `#`; it's illustrative in ordering but the `#` bucket must match
`LibraryStore.letterOf`'s non-alpha bucket (step 08) — **load-bearing** that both use `#`.

## Do this
1. Create the three `alphabet-bar` files under `src/app/features/library/alphabet-bar/`.
2. `has(letter)` gates the `[disabled]` binding against the `available` input; leave the `@for` over `LETTERS`.
3. The selector `app-alphabet-bar` is used by the library page's template (step 12) — keep the `app-` prefix.

## Code
### `src/app/features/library/alphabet-bar/alphabet-bar.ts`
```ts
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '#'];

/** Sticky A–Z (+ `#`) selector. Dumb: a letter is enabled only when it has artists. */
@Component({
  selector: 'app-alphabet-bar',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alphabet-bar.html',
  styleUrl: './alphabet-bar.scss',
})
export class AlphabetBar {
  readonly available = input<string[]>([]);
  readonly selected = input<string | null>(null);
  readonly selectLetter = output<string>();

  protected readonly letters = LETTERS;

  protected has(letter: string): boolean {
    return this.available().includes(letter);
  }
}
```

### `src/app/features/library/alphabet-bar/alphabet-bar.html`
```html
<div class="alphabet" role="tablist" aria-label="Filter artists by initial">
  @for (letter of letters; track letter) {
    <button
      type="button"
      class="letter"
      role="tab"
      [class.active]="letter === selected()"
      [disabled]="!has(letter)"
      [attr.aria-selected]="letter === selected()"
      (click)="selectLetter.emit(letter)"
    >
      {{ letter }}
    </button>
  }
</div>
```

### `src/app/features/library/alphabet-bar/alphabet-bar.scss`
```scss
:host {
  display: block;
}

.alphabet {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.letter {
  min-width: 2rem;
  padding: 0.3rem 0.4rem;
  border: 1px solid var(--mat-sys-outline-variant, rgba(255, 255, 255, 0.18));
  border-radius: 6px;
  background: transparent;
  color: var(--mat-sys-on-surface, #e6e6e6);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    opacity 0.15s ease;

  &:hover:not(:disabled) {
    background: var(--mat-sys-surface-container-high, rgba(255, 255, 255, 0.08));
  }

  &.active {
    background: var(--mat-sys-primary, #4dd0c7);
    border-color: var(--mat-sys-primary, #4dd0c7);
    color: var(--mat-sys-on-primary, #00201d);
  }

  &:disabled {
    opacity: 0.28;
    cursor: default;
  }
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — the component compiles with signal
      IO and no `any`.
- [ ] Rendered on the page (step 12): letters with artists are clickable, letters without are dimmed
      (`opacity: 0.28`) and unclickable; the selected letter shows the teal `.active` fill.

## If it breaks
- **`input`/`output` is not a function** → import them from `@angular/core`; they're the signal-IO APIs, not the
  legacy `@Input`/`@Output` decorators (which this guide never uses).
- **Every letter is disabled** → the `available` input isn't bound (or `availableLetters()` is empty because the
  globe dataset hasn't been restored) — the page's `initMaster()` (step 08) restores it.

---
> Nav: [← Shared ConfirmDialog](09_confirm-dialog.md) · [Overview](00_overview.md) · [The artist master table →](11_artist-table.md)
