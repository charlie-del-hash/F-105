# Persistence and identity

## Today

Everything the user customises — theme, custom layouts, active layout, notes,
watchlist — is the store's `PersistedShape` (`src/layout-engine/store.ts`). It is
saved in `localStorage` under `f105.workspace` on every change.

## With Supabase

Set the three variables in `supabase/README.md` and:

- `src/proxy.ts` refreshes the auth cookie on each navigation (Next.js 16 proxy).
- `/account` signs in by email: magic link or the six-digit code from the same email.
  `/auth/callback` exchanges the link for a session.
- `WorkspaceSync` (`src/layout-engine/sync.ts`, mounted in the shell) pulls the row from
  `workspaces` on sign-in, keeps the newer of local and remote, then pushes every local
  change after a 1.5 s debounce. Last write wins by `updated_at`.
- The status bar and the account button show `LOCAL`, `SYNCING`, `SYNCED <email>` or an
  error with the message on hover.

Row-level security limits every user to their own row. The service-role key is used only
by the alert cron and never reaches the browser.

## Schema

`supabase/migrations/20260918000000_workspaces.sql` — `workspaces (user_id, state jsonb,
updated_at)` and `alert_log (key, channel, sent_at, payload)`.

## Not yet

Sharing a layout by link (a public `shared_layouts` table keyed by slug), and merge
rather than last-write-wins. Both fit the same row shape.
