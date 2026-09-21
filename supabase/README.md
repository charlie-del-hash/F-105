# Supabase

Optional. The app is fully functional on-device; adding Supabase gives sign-in,
cross-device workspace sync and durable alert de-duplication.

1. Create a project at supabase.com (free tier is enough).
2. Run `migrations/20260918000000_workspaces.sql` in the SQL editor, or `supabase db push`.
3. Auth → Providers: enable **Email** with magic links / OTP. Add your site URL and
   `https://<site>/auth/callback` to the redirect allow-list.
4. Set on Vercel (and in `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the anon/publishable key)
   - `SUPABASE_SERVICE_ROLE_KEY` (server only; used by the alert cron for `alert_log`)

See `docs/PERSISTENCE.md` for how sync resolves conflicts.
