# Layouts

A layout is JSON. Presets live in `layouts/`; user layouts live in the browser
(export/import from the desk toolbar or `/layouts`). `pnpm layouts:check` validates presets.

```json
{
  "id": "energy",
  "name": "Energy desk",
  "description": "What it is for.",
  "desk": "energy",                   // optional grouping
  "theme": "terminal",                // optional suggestion; the user's choice wins
  "panels": [
    { "id": "ttf", "type": "chart", "x": 4, "y": 0, "w": 4, "h": 6, "props": { "symbol": "TTF", "range": "6m" }, "primary": true }
  ]
}
```

Grid: 12 columns, rows of 44 px with an 8 px gap. `x + w ≤ 12`. Panels must not overlap;
the engine compacts upward. Under 768 px panels stack in reading order (y, then x).

## The primary panel

One panel per layout may set `"primary": true`: the panel the layout exists for. It takes
an accent hairline under its header and a full-strength title while the rest sit at
`ink-2`, so the eye has somewhere to land instead of meeting nine boxes of equal weight.

**At most one.** `parseLayout` throws on a second, which means the rule holds for the
presets at import time, for a layout pasted into `/layouts`, and for a row pulled from
another device through `applyRemote` — not just for `pnpm layouts:check`. Omit the field and
it is `false`; a panel you add from the catalog is never primary.

What each preset marks, and why — in every case it is the panel its own description names
first:

| preset | primary | |
|---|---|---|
| `desk` | `wire` | the spine of the default terminal, full height at the origin |
| `energy` | `ttf` | "Gas first: TTF, JKM and Henry Hub" |
| `bridge` | `plot` | "the Hormuz plot, freight board, transits" |
| `hangar` | `des` | "the dossier beside the long read" |
| `reader` | `read` | "One story, full width" |
| `pocket` | `wire` | what the phone stack leads with |

## A blank layout

A layout with no panels shows the starter: copy any preset's panels into it, add a first
panel from the catalog, or import JSON. `adoptPreset(id)` in the store is what "copy a
preset" calls; it keeps the layout's name and forks nothing.

## Panels

| type | mnemonic | props | default size |
|---|---|---|---|
| `wire` | WIRE | `desk?`, `limit` | 3×10 |
| `quotes` | QB | `symbols[]`, `compact` | 4×6 |
| `chart` | GP | `symbol`, `range` (1m/3m/6m/1y) | 5×6 |
| `compare` | COMP | `symbols[]` (2–3), `range`, `basis` (rebase/pct) | 5×6 |
| `headlines` | TOP | `desk?`, `limit` | 4×6 |
| `reader` | READ | `slug` or `"featured"` | 6×12 |
| `dossier` | DES | `slug` | 4×8 |
| `plot` | PLOT | `area` (hormuz, bab-el-mandeb) | 5×7 |
| `calendar` | ECO | `desk?`, `limit` | 3×6 |
| `clocks` | WCLK | `zones[]` (names from `src/lib/zones.ts`) | 4×2 |
| `notes` | NOTE | `placeholder?` | 3×5 |
| `indicators` | IND | `symbols[]` | 4×3 |

Optional per panel: `title` (overrides the automatic title).

## Command-bar mnemonics
`GP TTF` chart · `QB BRENT TTF` quote board · `DES hormuz` find dossier · `READ thud-ridge`
· `PLOT hormuz` · `WIRE SHP` · `TOP NRG` · `THEME PAPER` · `LAYOUT BRIDGE`.
