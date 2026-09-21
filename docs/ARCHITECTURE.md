# Architecture

## The idea in one paragraph

A terminal is a grid of panels. Panels are small, typed components that read from a
content snapshot or a data API. Layouts arrange panels and are plain JSON, so a user can
make their own and an agent can write one. Themes are token sets, so the same panel looks
like an amber terminal, a P1 phosphor scope or a broadsheet without any component
knowing. Messaging leaves the app through WhatsApp, Slack and email rather than living
inside it. Everything else — routing, content, data — exists to feed panels.

## Layers

```
┌──────────────────────────────────────────────────────────────────┐
│ Shell            Topbar · quote strip · command bar (⌘K) · status │
├──────────────────────────────────────────────────────────────────┤
│ Routes           /  /read  /dossier  /wire  /markets  /desk  /kit  │
├────────────────────────────┬─────────────────────────────────────┤
│ Layout engine              │ Panels                              │
│ schema · grid maths ·      │ catalog (server) · registry (client) │
│ store (persist) · frame    │ schema + component + settings fields │
├────────────────────────────┴─────────────────────────────────────┤
│ Content layer (server)       │ Data layer                        │
│ Zod schemas · MDX loader ·   │ instruments · composite provider   │
│ in-article kit · alert rules │ (FRED, ECB, synthetic) · /api/*    │
├──────────────────────────────────────────────────────────────────┤
│ Design system   tokens.json → themes.css · Tailwind @theme · kit  │
└──────────────────────────────────────────────────────────────────┘
```

### Design system (`src/design`, `src/app/globals.css`)
`tokens.json` is the single source of truth. `scripts/tokens-to-css.mjs` emits
`themes.css` with one `[data-theme=…]` block per theme. Tailwind v4's `@theme inline`
maps the variables to utilities. The theme is applied on `<html data-theme>` before
first paint by an inline script (`src/app/layout.tsx`) and kept in sync by the store.
Because every effect (bezel depth, scanlines, vignette, glow, radius, density) is a
token, "functional skeuomorphism" is a dial, not a fork of the components.

### Content layer (`src/content`, `content/`)
MDX with Zod-validated front matter. Three kinds today — article, brief, dossier — plus
wire items and calendar events as JSON. The loader is `server-only` and caches per
process. Pages hand client components a serialisable `WorkspaceData` snapshot; rendered
MDX bodies travel as React nodes in the RSC payload, so the Reader panel shows a full
piece without a content API. Content is static per build, which is the right trade for
an editorial product: publishing is a git push and a Vercel build.

### Data layer (`src/data`)
An instrument registry (the securities master), a `MarketDataProvider` interface, and a
composite provider that routes each symbol to the first live adapter covering it — FRED
(with a free key) and ECB reference rates today — and to the deterministic synthetic
provider for everything else. Every quote and series carries `provider`, `synthetic` and
`asOf`, and the UI always shows it. Route handlers under `/api` expose quotes, series and
`/api/status`. Adding a vendor is one file plus a fixture test; see `docs/DATA.md`. The
`indicator` group (transit counts, war-risk premiums, storage fill) is the kind of series
a Bloomberg does not carry and this product should.

### Layout engine (`src/layout-engine`)
- `schema.ts` — `Layout` and `PanelInstance` (x, y, w, h on a 12-column grid, props).
- `grid.ts` — pure functions: collision, vertical compaction, move/resize with push-down,
  first-free-slot. Unit-tested.
- `store.ts` — Zustand + persist. Presets are code; the first edit to a preset forks it
  into the user's collection. Storage adapter is localStorage today; the store's
  `partialize` output is exactly what a Supabase row would hold.
- `WorkspaceGrid.tsx` — CSS grid; pointer-event drag and resize with cell snapping;
  single-column stacking under 768 px with reorder buttons.
- `PanelFrame.tsx` — the bezel, header, LED, actions, settings overlay, resize handle.
- `PanelSettings.tsx` — generic form from a panel's `fields`.

### Panels (`src/panels`)
`catalog.ts` is metadata only (importable by the server, e.g. for the command index).
`registry.tsx` binds components. Each panel folder exports a `PanelDefinition`. Props are
validated at render, so a hand-written layout with bad props fails softly inside the frame.

### Shell (`src/components/shell`)
Topbar with a live quote strip and theme switch; status bar (demo-data LED, UTC, theme);
the command bar built on `cmdk` with Bloomberg-style mnemonics parsed from the query
(`GP TTF`, `THEME PAPER`, `DES F-105`, `WIRE SHP`); a share sheet.

## Messaging

There is deliberately no in-app chat. The share sheet targets WhatsApp (`wa.me`), email
(`mailto:`), Slack (formatted copy — Slack has no public share URL; a Slack app can add
one later), and the system share sheet on iOS/Android/macOS. Server-side alerts (a flash
wire item, an indicator crossing a threshold) are a small adapter each:

| Channel | Mechanism | Env |
|---|---|---|
| Slack | Incoming webhook or Bot token `chat.postMessage` | `SLACK_WEBHOOK_URL` |
| WhatsApp | WhatsApp Business Cloud API, template messages | `WHATSAPP_BUSINESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` |
| Email | Resend (or SES) transactional API | `RESEND_API_KEY` |

They live in `src/lib/notify/<channel>.ts` behind `dispatch(events)`, driven by rules in
`content/alerts/rules.json` and the `/api/alerts/run` route on a Vercel cron. De-duplication
uses Supabase's `alert_log` when configured. See `docs/ALERTS.md`.

## Two builds

`next.config.ts` branches on `STATIC_EXPORT`. The default build is the full app: API routes,
the Supabase session proxy, the alert cron. Vercel runs this one.

The static build (`pnpm build:static`, and the Pages workflow) exports to `out/`. Route
handlers and a proxy cannot exist in an export, so `scripts/static-export.mjs` parks
`src/app/api`, `src/app/auth` and `src/proxy.ts` outside the source tree for the duration of
the build and restores them afterwards, pass or fail. The client compensates: when
`NEXT_PUBLIC_STATIC_DEMO=1`, the quote store and `useSeries` call the deterministic mock
generator directly instead of fetching, so the demo ticks without a server. Everything that
genuinely needs a server — live adapters, alerts, sign-in — is simply absent and labelled so.

## Platforms

- **Web, desktop and mobile** — this app. Responsive layouts, PWA manifest, installable.
- **iOS** — two credible paths, both preserving one design system:
  1. *Capacitor* wraps this exact web app in a native shell with push notifications and
     App Store distribution. Fastest, and the layout engine ships as-is.
  2. *Expo/React Native* consumes `tokens.json` (a `tokens-to-swift` or
     `tokens-to-ts` script is trivial) and reuses `content/`, `layouts/` and the data API.
     Native feel, more work.
  Start with 1; move to 2 for the screens that need it.
- **Desktop** — the browser is enough; Tauri is the option if a native window matters.

## Decisions (ADR-style)

1. **Single Next.js app, not a monorepo.** Reusability comes from module boundaries and
   JSON contracts (tokens, layouts, content), not from package boundaries. Extract to
   packages when a second app exists.
2. **JSON for layouts and tokens.** Users and agents author both. A schema validates both.
3. **Content in git, not a CMS.** Editorial review is a pull request. A CMS can be added
   as a second loader without touching panels.
4. **Mock data is deterministic.** Reproducible screenshots and tests; no flaky demos.
5. **On-device persistence first, Supabase when configured.** The store's persisted shape
   is exactly the `workspaces` row; sync is last-write-wins and optional. See
   `docs/PERSISTENCE.md`.
6. **No custom chart library.** SVG line charts and sparklines are a few hundred lines
   and follow the house dataviz rules exactly; a library would fight the themes.
7. **`cmdk` for the command bar, `zustand` for state, `zod` for every boundary.** Small,
   boring, well-known — good for agents.

### Persistence and alerts
`src/lib/supabase` (clients, env), `src/proxy.ts` (session refresh), `src/layout-engine/sync.ts`
(workspace sync), `src/alerts` (rules, evaluation, de-duplication), `src/lib/notify`
(channels), `src/app/api/alerts/run` (cron). All optional: without their environment
variables the app is the on-device demo.

## Extension points, in order of how often you will touch them
content → layouts → alert rules → panels → instruments → themes → providers → routes.
