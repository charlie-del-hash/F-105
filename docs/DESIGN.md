# Design

## Principles

1. **Density with hierarchy.** Bloomberg is dense; the iPhone is clear. Both at once:
   small type, tight rows, but one accent, one ink scale, and whitespace that groups.
2. **Functional skeuomorphism.** A bezel says "this is a panel". An LED says "this feed is
   live". An inset says "this is a screen". Scanlines and glow are mood and are dialled by
   theme. Nothing is textured for its own sake, and Paper turns all of it off.
3. **The data is the only thing allowed to be loud.** Chrome is ink-3 on bg-2. Numbers are
   ink. Change is up/down with a glyph, never colour alone.
4. **Every state has a face.** Loading, empty, error, bad settings, unknown panel — each is
   a designed message inside the frame, not a blank.
5. **One design system, many instruments.** A theme changes the mood; it never changes
   the layout, the type scale or the semantics.

## The rules that keep it from looking generated

1. **Metadata is a kicker line, not a row of pills.** `AIR · BRIEF · HORMUZ` in small
   caps, one line, with the date on the right. A bordered `Tag` is reserved for a state
   that needs to interrupt: FLASH, URGENT, WATCH, "demo content".
2. **Provenance is a dot.** ● observed, ◌ synthetic, beside every symbol, with the legend
   in the panel footer. Never a word like "demo" glued to a symbol.
2b. **A lamp only where there is a state.** A panel header carries its command mnemonic
   (`QB`, `GP`, `TOP`, `DES`), not an LED — a lamp on every panel says nothing, and
   provenance is already the dot beside each symbol. LEDs are for a state that changes:
   a flash wire item, an alert, a degraded feed, sync. The mnemonic is the same token
   `⌘K` parses, so the chrome teaches the keyboard.
3. **Direction is a glyph plus colour**, rendered by one component (`Change`), so every
   change on every screen reads the same.
4. **Chrome recedes.** Panel actions appear on hover (always on touch). Headers sit one
   step towards `bg-3`. Rows lift with a 6 % accent wash, not a grey block.
5. **One accent, used as a line.** The active tab and layout tab carry a 2 px accent
   underline with a soft glow; nothing else is filled with the accent except the primary
   button and the LED that matters.
6. **Terminal details, not terminal cosplay.** The dashed last-price line with its value
   tag, the segmented range control, the tabular figures — things a trader would miss.
   No fake scanlines outside the two themes built for them.
7. **The first item is bigger.** Headline lists lead with a heavier title, then settle.

## Chrome

Two rows, and they must not look alike. The **masthead** is the site's navigation —
identity, the five destinations, command, account, theme — drawn with `.tab` and its
accent underline. The **workspace strip** below it, on `/` only, is controls for the
layout in front of you: a `Layout` label, a `.seg` switcher, and the add/edit/more
cluster. Both rows were `.tab` once and read as one confusing double nav; the rule now
is that navigation is underlined tabs and controls are segmented.

The quote strip rides in the masthead everywhere except `/`, where the quote board
panel is a few pixels below it and would say the same thing twice.

`/kit` is a contract page for building, not a destination. It lives in the status bar
with the other build metadata, and in `⌘K`.

On a phone the masthead carried a second nav row — the same five links again, 32px, as
far from the thumb as the screen allows. That row is gone. Navigation is a fixed
**bottom bar** in the thumb zone (Desk · Read · Wire · Markets), carrying the same
accent line as a tab; the workspace strip collapses to one named control that opens a
sheet, because six preset tabs plus a `+` overflowed 390px with no scroll cue and put
the `+` off-screen.

Touch sizing is a `@media (pointer: coarse)` block in `globals.css`, not a breakpoint:
the desk stays dense on a pointer and grows only where the pointer is a finger. Safe
areas are `.safe-t` / `.safe-b`, because `viewportFit` is `cover`.

## Reading

Long-form pages (`/read`, `/dossier`) are a reading surface first. The masthead slides
away on phones as the reader scrolls down and returns on the first scroll up; a 2 px
accent progress line sits at the top. `ReadingControls` in the header set the type size
(S / M / L, remembered on the device) and switch to the Paper theme with one tap, then
back to whatever the reader had. Paper opens with a single drop cap; no other theme does.
Paragraphs use `text-wrap: pretty`, hyphenation and `overflow-wrap: anywhere`; headings
balance. Tables scroll sideways rather than break the column.

## Dialogs and overlays

One `Modal` primitive. Naming, renaming and deleting go through the promise-based
`dialogs.prompt` / `dialogs.confirm` so they look like the product and never like the
browser. Keyboard help and the command bar share the same overlay treatment.

## Keyboard

`?` opens the help overlay. `⌘K` / `/` command bar, `E` edit, `[` `]` cycle layouts,
`T` next theme, `Esc` leaves edit mode. With a panel header focused in edit mode: arrows
move, shift-arrows resize, backspace removes. Never bind a single letter that would fire
while someone is typing; the shell checks the focused element.

## Primitives

| Primitive | Where | Use |
|---|---|---|
| `Kicker` | `components/data/Kicker.tsx` | the metadata line above any headline |
| `Change`, `Price` | `components/data/Change.tsx` | every price and change |
| `LiveDot` | `components/data/LiveDot.tsx` | provenance beside a symbol |
| `.seg` | `globals.css` | segmented control (range, desk filter) |
| `.tab` | `globals.css` | masthead nav and layout tabs, accent underline |
| `.row` | `globals.css` | hover wash on list rows and table rows |
| `.panel-head`, `.panel-actions` | `globals.css` | panel chrome and hover-revealed actions |
| `.menu`, `.menu-item` | `globals.css` | popover menus (theme picker, layout menu, add panel) |
| `.dot`, `.led` | `globals.css` | provenance and liveness |
| `Modal`, `dialogs` | `components/ui/Modal.tsx`, `components/ui/dialogs.tsx` | every overlay; every prompt and confirm |
| `ReadingSurface`, `ReadingControls`, `ReadingProgress` | `components/reading/` | long-form pages |

## Tokens

| Token | Role |
|---|---|
| `bg`, `bg-2`, `bg-3` | page · raised panel · inset screen |
| `line`, `line-strong` | hairlines · handles and focus |
| `ink`, `ink-2`, `ink-3` | primary · secondary · muted |
| `accent`, `accent-ink` | the one brand colour and text on it |
| `up`, `down`, `warn`, `alert` | status; always paired with a glyph or label |
| `series-1…8` | categorical data colours in fixed, validated order — **per theme** |
| `glow` | text-shadow colour for brand/phosphor text |
| `font-ui`, `font-data`, `font-read` | interface · numbers · long-form |
| `radius`, `density` | corner radius · type scale multiplier |
| `fx-scanlines`, `fx-vignette`, `fx-bezel` | 0–1 dials: CRT furniture · panel depth |
| `fx-headfill` | 0–1: panel header as a filled bar (1) or a bare rule (0) |
| `fx-gridline` | 0–1: how present chart gridlines are |
| `fx-ticks` | 0–1: instrument tick marks along the top edge of an inset |

### Series colours are per theme

Each theme declares its own `series` ring in `tokens.json`, and slot 1 is that theme's
signature data colour — the line a single-series chart draws. Terminal draws amber,
Phosphor draws P1 green, Cockpit cyan, Bridge blue-white, Paper the one red, Glass iOS
blue. A theme that declares none falls back to the scheme-level list.

Each ring is the validated reference palette **rotated** so slot 1 lands on the theme's
hue. OKLab ΔE is rotation-invariant in the (a,b) plane, so a rotation inherits the
reference's normal-vision separations exactly; CVD simulation is not, so every ring was
re-validated against its own theme's `bg-2` with the dataviz validator, and repaired
where needed. Adding or editing a ring means re-running that validator — `pnpm tokens`
enforces the structural invariants (key parity, 8 valid hexes, ink contrast and ink-scale
separation against `bg-2`) but cannot check a categorical palette.

## Themes

A theme changes the mood *and the chrome's character* — never the layout, the type scale
or the semantics. "Chrome" below is what the `fx` dials do to a panel.

| Theme | Scheme | For | Chrome | Notes |
|---|---|---|---|---|
| Terminal | dark | the default desk | bezelled box, filled header | amber on black, Plex Mono for data |
| Phosphor | dark | the scope | no bezel, no header fill — one continuous surface | green P1, scanlines, mono everywhere |
| Cockpit | dark | Hangar | bezel, filled header, inset ticks, plotted grid | grey panel, cyan cues, Geist Mono |
| Bridge | dark | shipping and the plot | bezel, half-tint header, strong grid | blue-white phosphor, brass accent, vignette |
| Paper | light | reading | no bezel, no header fill, almost no grid | broadsheet stock, one red |
| Glass | light | phone | soft shallow bezel | white cards, iOS blue, 12 px radius |

## Type

Geist Sans (UI), IBM Plex Mono and Geist Mono (data), Source Serif 4 (reading). All
self-hosted from npm — no runtime font fetch. Numbers in columns use tabular figures;
hero numbers use proportional figures.

## Motion

Only LEDs animate (pulse for live, blink for alert). `prefers-reduced-motion` stops them.
Grid changes are instant; a dragging panel gets a ring and slight transparency.

## Charts

House rules from the dataviz skill, encoded in `LineChart` and `Sparkline`: 2 px line,
10 % area wash, ≥ 8 px end marker with a 2 px surface ring, hairline solid gridlines in
`line`, labels in `ink-3`, crosshair and tooltip on hover with the whole plot as the hit
target, one axis. A single series has no legend — the panel title names it.
