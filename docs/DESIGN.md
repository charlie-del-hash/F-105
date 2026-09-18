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

## Tokens

| Token | Role |
|---|---|
| `bg`, `bg-2`, `bg-3` | page · raised panel · inset screen |
| `line`, `line-strong` | hairlines · handles and focus |
| `ink`, `ink-2`, `ink-3` | primary · secondary · muted |
| `accent`, `accent-ink` | the one brand colour and text on it |
| `up`, `down`, `warn`, `alert` | status; always paired with a glyph or label |
| `series-1…8` | categorical data colours in fixed, validated order |
| `glow` | text-shadow colour for brand/phosphor text |
| `font-ui`, `font-data`, `font-read` | interface · numbers · long-form |
| `radius`, `density` | corner radius · type scale multiplier |
| `fx-scanlines`, `fx-vignette`, `fx-bezel` | 0–1 dials |

## Themes

| Theme | Scheme | For | Notes |
|---|---|---|---|
| Terminal | dark | the default desk | amber on black, Plex Mono for data |
| Phosphor | dark | the scope | green P1, scanlines, mono everywhere |
| Cockpit | dark | Hangar | grey panel, cyan cues, Geist Mono |
| Bridge | dark | shipping and the plot | blue-white phosphor, brass accent, vignette |
| Paper | light | reading | broadsheet stock, one red, no bezels |
| Glass | light | phone | white cards, iOS blue, 12 px radius |

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
