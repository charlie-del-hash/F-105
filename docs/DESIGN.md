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
5. **One design system, many instruments.** A theme changes the mood and the chrome's
   character; it never changes the layout, the relative type hierarchy or the semantics.
   `--density` scales the whole instrument uniformly — type, padding, control heights —
   so Terminal is a dense desk at 0.9 and Glass is a roomier phone at 1.05. Uniformly is
   the load-bearing word: every size is on the rem ladder, so the *order* of sizes is the
   same in every theme.

## The rules that keep it from looking generated

1. **Metadata is a kicker line, not a row of pills.** `AIR · BRIEF · HORMUZ` in small
   caps, one line, with the date on the right. A bordered `Tag` is reserved for a state
   that needs to interrupt: FLASH, URGENT, WATCH, "demo content".
2. **Provenance is a dot.** ● observed, ◌ synthetic, beside every symbol, with the legend
   in the panel footer. Never a word like "demo" glued to a symbol.
3. **A lamp only where there is a state.** A panel header carries its command mnemonic
   (`QB`, `GP`, `TOP`, `DES`), not an LED — a lamp on every panel says nothing, and
   provenance is already the dot beside each symbol. LEDs are for a state that changes:
   a flash wire item, an alert, a degraded feed, sync. The mnemonic is the same token
   `⌘K` parses, so the chrome teaches the keyboard.
4. **Direction is a glyph plus colour**, rendered by one component (`Change`), so every
   change on every screen reads the same.
5. **Chrome recedes.** Panel actions appear on hover (always on touch). How far a header
   sits towards `bg-3` is `--fx-headfill`, so Paper and Phosphor have none at all. Rows
   lift with a 6 % accent wash, not a grey block.
6. **One accent, used as a line.** The active masthead tab and the active phone-bar item
   carry a 2 px accent line with a soft glow; the selected segment of a `.seg` takes the
   accent as text; a layout's `primary` panel takes a hairline under its header, with its
   title stepped from `ink-2` to `ink` while every other panel recedes — the "first item is
   bigger" rule applied *between* panels rather than only inside a list. Nothing else is
   filled with it except the primary button and the LED that matters.
7. **Terminal details, not terminal cosplay.** The dashed last-price line with its value
   tag, the segmented range control, the tabular figures — things a trader would miss.
   No fake scanlines outside the two themes built for them.
8. **The first item is bigger.** Headline lists lead with a heavier title, then settle.

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

**Hover never fires on a finger.** Tailwind compiles `hover:` to a bare `:hover`, which on
a touch screen sticks after a tap until you tap elsewhere — every row, tab and icon button
stays lit behind your finger. `globals.css` redefines the variant with `@custom-variant` so
all of them are wrapped in `@media (hover: hover)`, and each hand-written `:hover` rule is
wrapped too. A hand-written rule that is *state* rather than hover — `.menu-item[data-active]`
— stays outside the guard.

Corners come from `rounded-panel`, the Tailwind token bound to `--radius`. Not
`rounded-[var(--radius)]`: the token existed and had zero uses against 21 raw ones.

**Text inside an SVG.** A chart drawn in measured pixels (`LineChart`) cannot use rem, so
it converts by hand from `useRootFontSize()` — a fixed `fontSize={10}` opts out of
`--density` exactly as a `text-[10px]` class did. Everything derived from the label size
scales with it too: the mono advance that reserves the axis gutter and the price tag, the
baseline offsets, the tag box. A *viewBox-scaled* SVG is different: the plot is a schematic,
its labels are anchored to features and should scale with the drawing, so they stay in user
units. What does not belong in a viewBox is a caption — the plot's "positions illustrative"
line shrank to about 8.6px in a phone-width panel, and is HTML underneath the map now.

## Which theme you get

A theme is decided in one place, `Shell`, in precedence order:

1. an **in-page override** — the reading surface's "read on Paper", which lasts only while
   a reading page is mounted;
2. the reader's **pinned** pick, once they have made one;
3. the **active layout's** declared theme — Pocket asks for Glass, Bridge for Bridge,
   Hangar for Cockpit. The field had been in the layout schema all along and nothing read
   it;
4. that pick as a fallback, which unpinned means **Auto** → `tokens.json`'s `auto` pair,
   Terminal when the system is dark and Glass when it is light.

Picking a theme in the picker pins it; "Follow the layout instead" hands it back. Only the
pick and the pin are persisted, so an unpinned device derives its own theme from whatever
layout it is showing and never pushes that to another device — which is why binding did not
need a separate per-device override.

The override is its own non-persisted store (`lib/useThemeOverride.ts`), not part of the
workspace. It lived in the workspace briefly and that was a data-loss bug: the workspace
persists with `skipHydration`, React runs child effects before parent ones, so a reading
page setting the override on mount wrote defaults to localStorage before `Shell` had read
the saved state back. **Never put ephemeral state in the persisted store.**

## Reading

Long-form pages (`/read`, `/dossier`) are a reading surface first. The masthead slides
away on phones as the reader scrolls down and returns on the first scroll up; a 2 px
accent progress line sits at the top. `ReadingControls` under the byline — not above the
headline, where they used to push the piece a control row down a phone — set the type size
(S / M / L, remembered on the device) and switch to Paper with one tap. That switch is
scoped to the reading surface: see "Which theme you get". Paper opens with a single drop
cap; no other theme does.
Paragraphs use `text-wrap: pretty`, hyphenation and `overflow-wrap: anywhere`; headings
balance. Tables scroll sideways rather than break the column.

## Panels and panel-shaped blocks

There is one panel chrome, in `components/ui/Card.tsx`. `PanelFrame` on the dashboard and
every panel-shaped block on a static page — the market boards, a desk's instruments, the
reading-page aside, the kit — share `CardHead`, so the theme dials and the mnemonic slug
reach all of them. Never hand-roll `bezel` + a `caps border-b` header: ten copies of it
meant Paper went boxless on the dashboard and kept its boxes everywhere else.

`Card` is a flex column, so a card given a height passes what is left to its body. Do not
size a body with `calc(100% - 2rem)` against a header whose height moves with `--density`.

The grid picks its tree in JS, and a media query cannot be known on the server, so SSR
always emits the 12-column one. `.workspace-grid-wide` is hidden under 768px so a phone
never paints a squashed desktop grid in the frame before hydration.

### On a phone

A phone panel sizes to what it holds. Heights used to come from the *desktop* row
span — `clamp(180, h × 52, 560)` — so a quote board authored `h:5` for a 12-column
desk became a 260px box holding four rows, and a two-row clock panel was padded up to
180px of mostly nothing.

A panel decides its own layout from the box it is **measured** in, via `useSize` — never
from its `h` on the desktop grid. A row span says nothing about a phone, where every panel
is screen-width and sized to its content, so `clocks` and `plot` used to read the same
geometry whatever they were actually drawn into.

A panel that is a viewport rather than a list has no intrinsic height and still needs
one: it declares `phoneAspect` in the catalog (chart 1.5, plot 100/70) and gets
width ÷ aspect. Everything else flows, capped at `PHONE_PANEL_MAX` so one panel can
never fill the screen — the next panel's header is always in view, which is what makes
a stack of panels read as a stack rather than as one long page. A capped panel that
clips its content shows a bottom fade (`useOverflow`), and its header already carries
the ↗ link to the full page.

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
| `.seg` | `globals.css` | segmented control (range, desk filter, layout switcher) |
| `.tab` | `globals.css` | masthead nav, accent underline — navigation only |
| `BottomBar` | `components/shell/BottomBar.tsx` | phone navigation, thumb zone |
| `.safe-t`, `.safe-b` | `globals.css` | notch and home-indicator insets |
| `.row` | `globals.css` | hover wash on list rows and table rows |
| `Card`, `CardHead` | `components/ui/Card.tsx` | panel chrome — the only place it is written |
| `.panel-head`, `.panel-actions` | `globals.css` | panel chrome and hover-revealed actions |
| `.menu`, `.menu-item` | `globals.css` | popover menus (theme picker, layout menu, add panel) |
| `.dot`, `.led` | `globals.css` | provenance and liveness |
| `Modal`, `dialogs` | `components/ui/Modal.tsx`, `components/ui/dialogs.tsx` | every overlay; every prompt and confirm |
| `ReadingSurface`, `ReadingControls`, `ReadingProgress` | `components/reading/` | long-form pages |

## Type scale

Everything is on the rem ladder, because `--density` multiplies the root font size and a
`px` value silently opts out of it. About 56 sizes had been written as arbitrary
`text-[11px]` values, so the hierarchy *inverted* between themes: a panel title
(`.caps`, rem) grew from 9.18px on Terminal to 10.71px on Glass while the mnemonic slug
beside it (px) stayed at 10px, flipping which one was larger. Every size now moves by the
same 1.167× between those two themes.

Tailwind's scale jumps 10.1 → 11.8 → 13.5px at the default density, which is too coarse
for a UI that lives in that band — that gap is why the arbitrary values existed. Two steps
fill it, in `globals.css` `@theme`: `text-meta` (0.815rem) and `text-item` (0.963rem). The
rem values are anchored to the default theme's 13.5px root, so Terminal renders what it
always did. **Never write `text-[Npx]`.**

### The one exception

`input, select, textarea` take a hard `font-size: 16px` inside the `@media (pointer: coarse)`
block in `globals.css`. iOS zooms the viewport whenever a focused form control is under
16px and never restores the scale on blur, so a single tap in a panel's settings field left
the whole app magnified with no way back. 16px is a platform constant rather than a step on
the ladder, and the rule is scoped to coarse pointers, where the hierarchy around the field
is already set by the text surrounding it.

The rule is deliberately **unlayered** so it outranks the `text-xs` utility that
`inputClass` carries. Moving it into `@layer components` restores the bug silently.

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

### More than one series

`MultiLineChart` and the `COMP` panel. Two things govern it.

**Different units share an axis only by indexing.** The instruments here are quoted in
$/bbl, €/MWh, Worldscale, $/day, points and per-cent. Raw on one plot they say nothing,
and a second y-axis is the one chart the rules forbid outright, so every series is
indexed to its own first point — start = 100, or per-cent change from the start. One
axis, one unit, and the question becomes relative movement, which is what a comparison
is for. The baseline is always in frame: "did it end above where it started" is the
question the chart exists to answer.

**Identity is a per-theme mode, `seriesMode` in `tokens.json`.**

| Mode | Themes | Identity |
|---|---|---|
| `hue` | Terminal, Cockpit, Bridge, Glass | the theme's ring in fixed order, solid lines, round markers |
| `form` | Phosphor, Paper | every line in slot 1, separated by dash pattern and end-marker shape |

A P1 tube and a broadsheet have one colour each; inventing a second is precisely what
would make them read as a dashboard wearing a filter. The mode is discrete, so it is
typed data in `tokens.ts` — never read back out of CSS. The component resolves it from
the *nearest* `data-theme` ancestor rather than from the store, or the six scoped tiles
in /kit's contact sheet would all draw in the document's theme and show nothing.

**The legend is mandatory and carries the glyph, not a colour chip.** For two or more
series it is the identity channel the rules require, it is the relief the validator
obliges for Cockpit, Paper and Glass (whose middle ring slots fall under 3:1 against
their own surface), and in `form` mode a plain swatch would be three identical squares.
It carries each series' change, so it doubles as the table view.

### Three series, and why it is not four

The rings were validated pairwise on **adjacent** slots — the right test for a palette
spent a couple of slots at a time. A comparison chart is the first thing here that puts
every slot it uses on screen *simultaneously*, so the binding test becomes the dataviz
validator's `--pairs all`. Under it, **no four-slot subset of any ring** clears the
normal-vision floor of ΔE 15 in all four hue themes. Slots 2 and 4 fail every time:

| Theme | worst all-pairs at 4 slots | |
|---|---|---|
| Terminal | `#008ae7` ↔ `#5096e9` | ΔE 5.5 — two blues |
| Bridge | `#d85b15` ↔ `#c48600` | ΔE 10.2 |
| Cockpit | `#d9506d` ↔ `#da7344` | ΔE 10.4 |
| Glass | `#eb6836` ↔ `#eea102` | ΔE 13.8 |

At three slots every ring passes with room: worst normal-vision 17.8 (Terminal), worst
CVD 9.0 (Glass). Cutting the series count is the skill's own remedy for an all-pairs
failure, and secondary encoding explicitly does **not** excuse that floor — so the form
themes take the same three, which also keeps their dash patterns comfortably apart.

Adding a fourth means re-stepping the rings and re-running `--pairs all` on every theme,
not raising the cap.
