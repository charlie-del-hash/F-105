@AGENTS.md

# F-105 — working notes for agents

Read `docs/ARCHITECTURE.md` once. Then use the recipes below; they are the whole
extension model. Run `pnpm check` before you commit. Keep the demo-data labelling
honest: anything synthetic stays labelled synthetic.

## Conventions

- **Tokens, not colours.** Components use Tailwind utilities mapped to theme variables
  (`bg-bg-2 text-ink border-line text-accent font-data`). Never a hex in a component.
  Never a `text-[Npx]` either: `--density` scales the root font size, so a px value opts
  out of it and the type hierarchy changes between themes. `text-meta` and `text-item`
  fill the gap Tailwind's scale leaves in the 10–15px band.
  New colour role → add to every theme in `src/design/tokens.json`, run `pnpm tokens`,
  map it in `src/app/globals.css` `@theme inline`.
- **Server reads content; clients get snapshots.** `src/content/loader.ts` is `server-only`.
  Pages pass serialisable summaries (and rendered MDX as React nodes) to client components.
- **Design rules live in `docs/DESIGN.md`.** Metadata is a `Kicker` line, never a row of
  tags; every price and change goes through `Price` / `Change`; provenance is `LiveDot`.
  Quotes come from `useQuotes` (one shared poller); never `fetch("/api/quotes")` in a panel.
- **Hover is guarded.** `globals.css` redefines Tailwind's `hover:` variant to sit inside
  `@media (hover: hover)`, and every hand-written `:hover` rule is wrapped too — an
  unguarded hover sticks after a tap on a touch screen. Corners use `rounded-panel`, not
  `rounded-[var(--radius)]`. A panel decides its layout from `useSize`, never from its
  `h` on the desktop grid.
- **No browser dialogs.** `window.prompt`, `confirm` and `alert` are banned; use
  `dialogs.prompt` / `dialogs.confirm` from `src/components/ui/dialogs.tsx`, and `Modal` for
  anything else that overlays the page.
- **Every panel is data-driven.** A panel = Zod schema + component + `fields` for its
  settings form + a catalog row. No panel writes its own settings UI.
- **Layouts are JSON.** A user must be able to hand-author one; so must you.
- **Dataviz rules** (from the dataviz skill): 2 px lines, ≥ 8 px end markers with a surface
  ring, hairline solid gridlines, text in text tokens never series colour, one axis, series
  colours in fixed order (`--series-1..8`), status colours (`up/down/warn/alert`) always paired
  with a glyph or label.
- **Two builds.** The default build is the full app for Vercel. `pnpm build:static` is the
  GitHub Pages demo: `output: "export"` with `src/app/api`, `src/app/auth` and `src/proxy.ts`
  moved aside by `scripts/static-export.mjs`. So: keep pages statically exportable (no
  `await searchParams` in a page — read query params client-side), give any new metadata
  route `dynamic = "force-static"`, and when a client needs server data, branch on
  `isStaticDemo` from `src/data/static-demo.ts` rather than assuming `/api` exists.
- **Next.js 16**: `params`/`searchParams` are Promises; Turbopack is the bundler; read
  `node_modules/next/dist/docs/` before using an API you are not sure about.
- Prefer `useSyncExternalStore` over setState-in-effect for clocks, media queries, etc.
  The lint rule `react-hooks/set-state-in-effect` is on.

## Recipes

### Add a panel
1. `src/panels/catalog.ts` — add a row (type, name, description, category, mnemonic, sizes).
2. `src/panels/<type>/index.tsx` — export a `PanelDefinition`: `schema` (Zod, with defaults),
   `fields` (settings form), `component`, `defaultTitle`, optional `href`.
3. `src/panels/registry.tsx` — add it to `defs`. `pnpm panels:check` catches a row
   with no component, a component with no row, and a duplicated mnemonic.
4. Content panels read `useWorkspaceData()`; market panels use `useQuotes`/`useSeries`.
5. Document it in `docs/LAYOUTS.md`. `pnpm layouts:check` will catch a preset that uses it wrongly.

### Add a theme
1. `src/design/tokens.json` → `themes.<id>` with every key the others have.
2. `pnpm tokens` regenerates `src/design/themes.css`. Check it on `/kit`.
3. `docs/DESIGN.md` — add a line on what the theme is for.

### Add a content type or field
1. `src/content/schema.ts` — extend the Zod schema (defaults for optional fields).
2. `src/content/loader.ts` — if it is a new kind, add it to `kindDirs`, `kindHref`, `loadAll`.
3. A route under `src/app/` and, if panels should see it, extend `WorkspaceData` in
   `src/layout-engine/data-context.tsx` and `src/app/page.tsx`.
4. `pnpm content:check`.

### Add an instrument
`src/data/instruments.ts`. Give it a plausible `base`, a `vol`, the desks that care, and the
real source it should eventually come from. The mock provider picks it up automatically.

### Add a real data provider
`docs/DATA.md`. Implement `create<Id>Provider(opts)` in `src/data/providers/<id>.ts` with an
injectable `fetchImpl`, add it to `liveAdapters` in `providers/index.ts` in priority order,
and add a fixture test to `providers.test.ts`. Never strip `provider` / `synthetic` /
`asOf` from a quote: the UI's honesty depends on them.

### Add an alert rule or channel
Rules are JSON in `content/alerts/rules.json` (`docs/ALERTS.md`); the build validates them.
A channel is a `NotifierFactory` in `src/lib/notify/<id>.ts` registered in `getNotifiers`,
with a stub-fetch test in `src/alerts/alerts.test.ts`.

### Persistence
`docs/PERSISTENCE.md`. Anything new that the user customises goes into `PersistedShape` in
the store (and therefore into `localStorage` and the Supabase row automatically). Validate
it in `applyRemote` so a bad remote row cannot poison a device.

### Add a layout preset
Write `layouts/<id>.json` (see `docs/LAYOUTS.md`), import it in
`src/layout-engine/presets.ts`, run `pnpm layouts:check`.

### Write content
`docs/CONTENT.md`. Articles and briefs go to `/read/<slug>`, dossiers to `/dossier/<slug>`.
Set `placeholder: false` only when a human has verified the piece.

## Commands

```
pnpm dev · pnpm build · pnpm build:static · pnpm check
pnpm tokens · pnpm content:check · pnpm layouts:check · pnpm panels:check · pnpm test
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/alerts/run?dryRun=1"
```
