# M11 · Step 06 of 10 — The settings panel (gear): lighting, marker, colours, data
> Nav: [← The data-transfer service](05_data-transfer.md) · [Overview](00_overview.md) · [Host the panel + wire the globe page →](07_globe-page-settings.md)

> **This step touches 3 files, committed together:** `features/settings/settings-panel/settings-panel.ts` +
> `.html` + `.scss` — a dumb-ish pinned widget whose whole purpose is to edit the root `SettingsStore` and drive
> `DataTransfer`.

## Why / design
This is the gear the user actually clicks. It edits the root `SettingsStore` **directly** — that's this widget's
entire job, so it's exempt from the usual "dumb child takes inputs" rule ([conventions](../foundation/conventions.md)):
the store is app-wide state, and the store's own `effect()` (step 02) mirrors each change to CSS + the renderer +
`localStorage`. The panel just presents controls:

- **Lighting** — a slide toggle bound to `store.dayMode`.
- **Flight marker** — a `mat-button-toggle-group` over the seven `MarkerKind`s, each an icon; sets
  `store.markerIcon`.
- **Colours** — eight native `<input type="color">` swatches, each two-way with a store signal via a small
  `Swatch` descriptor `{ label, value, set }` so the template stays one `@for`.
- **Data** — Export / Import / Delete, driving `DataTransfer` (step 05). Import + Delete both go through the
  shared `Confirm` dialog (M10) and, on success, `location.reload()` so every store re-hydrates from the new
  `localStorage`. Import errors surface via `Toast` (M1).
- **Reset appearance** — `store.reset()` back to the stylesheet defaults.

**Keyboard accessibility (S4), built in here:** every control is a native/Material control that's focusable and
operable by keyboard out of the box — the toggle, the button-toggle group (arrow-key navigable), the colour
inputs (Enter opens the OS picker), and the buttons. Each carries an explicit `aria-label` (or visible text) so
a screen reader announces it: the trigger fab announces "Customize globe appearance" / "Close appearance
settings", the marker group is labelled "Flight marker icon", every swatch by its colour name. We verify the
full keyboard path in step 10 — the labels are the load-bearing part, so don't drop them.

> **Scope note:** the source panel closes by re-clicking the fab (no Escape handler). We keep it that way — no
> invented keyboard-close (see the overview's Scope discipline).

## Do this
1. Create `src/app/features/settings/settings-panel/settings-panel.ts` — inject `SettingsStore`, `DataTransfer`,
   `Toast`, `Confirm`; declare the `markers` + `swatches` descriptor arrays; the export/import/delete handlers.
2. Create `.../settings-panel.html` — the pinned panel (shown when `open()`), then the trigger fab.
3. Create `.../settings-panel.scss`.

## Code
### `src/app/features/settings/settings-panel/settings-panel.ts`
```ts
import { ChangeDetectionStrategy, Component, inject, Signal, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { MarkerKind } from '../../../core/cache/appearance-cache';
import { DataTransfer } from '../../../core/cache/data-transfer';
import { Confirm } from '../../../shared/confirm';
import { Toast } from '../../../shared/toast';
import { SettingsStore } from '../settings-store';

interface Swatch {
  label: string;
  value: Signal<string>;
  set: (value: string) => void;
}

interface MarkerOption {
  kind: MarkerKind;
  icon: string;
  label: string;
}

/**
 * Pinned gear panel for live appearance settings: day/studio lighting, the flight marker icon, and
 * the globe/accent/background colours. Edits the root {@link SettingsStore} directly — it is this
 * widget's whole purpose — which mirrors changes to CSS, the renderer, and localStorage.
 */
@Component({
  selector: 'app-settings-panel',
  imports: [MatButtonModule, MatButtonToggleModule, MatIconModule, MatSlideToggleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-panel.html',
  styleUrl: './settings-panel.scss',
})
export class SettingsPanel {
  protected readonly store = inject(SettingsStore);
  private readonly dataTransfer = inject(DataTransfer);
  private readonly toast = inject(Toast);
  private readonly confirm = inject(Confirm);
  protected readonly open = signal(false);

  protected readonly markers: readonly MarkerOption[] = [
    { kind: 'plane', icon: 'flight', label: 'Plane' },
    { kind: 'boat', icon: 'directions_boat', label: 'Sailboat' },
    { kind: 'car', icon: 'directions_car', label: 'Car' },
    { kind: 'train', icon: 'train', label: 'Train' },
    { kind: 'bike', icon: 'directions_bike', label: 'Bicycle' },
    { kind: 'note', icon: 'music_note', label: 'Music note' },
    { kind: 'record', icon: 'album', label: 'Vinyl record' },
  ];

  protected readonly swatches: readonly Swatch[] = [
    { label: 'Background', value: this.store.background, set: (v) => this.store.background.set(v) },
    { label: 'Primary accent', value: this.store.accent, set: (v) => this.store.accent.set(v) },
    {
      label: 'Secondary accent',
      value: this.store.accentSecondary,
      set: (v) => this.store.accentSecondary.set(v),
    },
    {
      label: 'Tertiary accent',
      value: this.store.accentTertiary,
      set: (v) => this.store.accentTertiary.set(v),
    },
    {
      label: 'Flight marker',
      value: this.store.markerColor,
      set: (v) => this.store.markerColor.set(v),
    },
    { label: 'Globe ocean', value: this.store.ocean, set: (v) => this.store.ocean.set(v) },
    { label: 'Heat — cold', value: this.store.heatCold, set: (v) => this.store.heatCold.set(v) },
    { label: 'Heat — hot', value: this.store.heatHot, set: (v) => this.store.heatHot.set(v) },
  ];

  protected pickColor(swatch: Swatch, event: Event): void {
    swatch.set((event.target as HTMLInputElement).value);
  }

  protected setMarker(kind: MarkerKind): void {
    this.store.markerIcon.set(kind);
  }

  /** Download the globe dataset + preferences as a JSON file to carry to another browser. */
  protected exportData(): void {
    const json = this.dataTransfer.serialize(new Date());
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `earthviewmusic-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /** Read a previously-exported file and restore it, then reload so every store re-hydrates. */
  protected importData(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // let the same file be picked again later
    if (!file) {
      return;
    }
    void file.text().then(async (text) => {
      const ok = await this.confirm.ask({
        title: 'Import data?',
        message: 'This replaces your current globe data and settings, then reloads. Continue?',
        confirmLabel: 'Import & reload',
      });
      if (!ok) {
        return;
      }
      try {
        this.dataTransfer.apply(text);
        location.reload();
      } catch (error) {
        this.toast.error(
          `Couldn't import data: ${error instanceof Error ? error.message : 'invalid file'}`,
        );
      }
    });
  }

  /** Wipe the locally-stored globe dataset + preferences (keeps you logged in), then reload. */
  protected async deleteData(): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Delete local data?',
      message:
        'Delete your locally-stored globe data and settings? You stay logged in, but the globe ' +
        'will rebuild from your Liked Songs on next load. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) {
      return;
    }
    this.dataTransfer.clear();
    location.reload();
  }
}
```

### `src/app/features/settings/settings-panel/settings-panel.html`
```html
@if (open()) {
  <div class="panel">
    <section class="group">
      <span class="heading">Lighting</span>
      <mat-slide-toggle [checked]="store.dayMode()" (change)="store.dayMode.set($event.checked)">
        Day mode (sunlit)
      </mat-slide-toggle>
    </section>

    <section class="group">
      <span class="heading">Flight marker</span>
      <mat-button-toggle-group
        class="markers"
        [value]="store.markerIcon()"
        (change)="setMarker($event.value)"
        aria-label="Flight marker icon"
      >
        @for (marker of markers; track marker.kind) {
          <mat-button-toggle [value]="marker.kind" [attr.aria-label]="marker.label">
            <mat-icon>{{ marker.icon }}</mat-icon>
          </mat-button-toggle>
        }
      </mat-button-toggle-group>
    </section>

    <section class="group">
      <span class="heading">Colours</span>
      @for (swatch of swatches; track swatch.label) {
        <label class="swatch">
          <span>{{ swatch.label }}</span>
          <input
            type="color"
            [value]="swatch.value()"
            (input)="pickColor(swatch, $event)"
            [attr.aria-label]="swatch.label"
          />
        </label>
      }
    </section>

    <section class="group">
      <span class="heading">Data</span>
      <div class="data-actions">
        <button mat-stroked-button (click)="exportData()">
          <mat-icon>download</mat-icon>
          Export
        </button>
        <button mat-stroked-button (click)="fileInput.click()">
          <mat-icon>upload</mat-icon>
          Import
        </button>
        <button mat-stroked-button class="danger" (click)="deleteData()">
          <mat-icon>delete</mat-icon>
          Delete
        </button>
      </div>
      <input
        #fileInput
        type="file"
        accept="application/json,.json"
        hidden
        (change)="importData($event)"
      />
    </section>

    <button mat-stroked-button class="reset" (click)="store.reset()">
      <mat-icon>restart_alt</mat-icon>
      Reset appearance
    </button>
  </div>
}

<button
  mat-mini-fab
  class="trigger"
  (click)="open.set(!open())"
  [attr.aria-label]="open() ? 'Close appearance settings' : 'Customize globe appearance'"
>
  <mat-icon>{{ open() ? 'close' : 'tune' }}</mat-icon>
</button>
```

### `src/app/features/settings/settings-panel/settings-panel.scss`
```scss
:host {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 15rem;
  max-height: min(70vh, 32rem);
  overflow-y: auto;
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--space-surface) 90%, transparent);
  border: 1px solid color-mix(in srgb, var(--neon-teal) 25%, transparent);
  backdrop-filter: blur(8px);
  box-shadow: var(--glow-shadow);
}

.group {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.heading {
  font: var(--mat-sys-title-small);
  color: var(--neon-teal);
}

.markers {
  align-self: flex-start;
  // Seven icons won't fit one row in the panel — let them wrap to a grid.
  flex-wrap: wrap;
}

.swatch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font: var(--mat-sys-body-medium);
  cursor: pointer;

  span {
    color: var(--mat-sys-on-surface-variant);
  }

  // Native colour picker, restyled to a tidy rounded chip.
  input[type='color'] {
    inline-size: 2.25rem;
    block-size: 1.5rem;
    padding: 0;
    border: 1px solid color-mix(in srgb, var(--neon-teal) 35%, transparent);
    border-radius: 0.4rem;
    background: none;
    cursor: pointer;

    &::-webkit-color-swatch-wrapper {
      padding: 2px;
    }

    &::-webkit-color-swatch {
      border: none;
      border-radius: 0.25rem;
    }
  }
}

.data-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  // Export + Import share the first row; Delete wraps to its own full-width row below.
  button {
    flex: 1 1 6rem;
  }

  .danger {
    flex-basis: 100%;
    --mat-stroked-button-label-text-color: var(--mat-sys-error);
    color: var(--mat-sys-error);
    border-color: color-mix(in srgb, var(--mat-sys-error) 45%, transparent);
  }
}

.reset {
  align-self: flex-start;
}

.trigger {
  box-shadow: var(--glow-shadow);
}
```

## Done when (this step)
- [ ] `npm run build` → clean; the component resolves `SettingsStore`, `DataTransfer`, `Confirm`, `Toast`.
- [ ] It's not mounted yet (step 07 hosts it), so nothing shows on screen — verified next step. The four Material
      modules import without error.

## If it breaks
- **`No provider for Confirm`/`Toast`** → both are `providedIn: 'root'` (M10 / M1); check the import paths
  (`../../../shared/confirm`, `../../../shared/toast`).
- **`$event.value` is `any` / marker toggle types wrong** → `mat-button-toggle-group`'s `change` payload is
  `MatButtonToggleChange`; `setMarker(kind: MarkerKind)` narrows it — keep the handler signature.
- **Colour picker resets to black when opened** → the `[value]` bound a non-`#rrggbb` string; the store's
  `normalizeHex` (step 02) guarantees `#rrggbb`, so this means a raw value bypassed the store.
