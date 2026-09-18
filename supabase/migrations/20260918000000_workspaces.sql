-- F-105: per-user workspace persistence and the alert de-duplication log.
-- Apply with `supabase db push` or paste into the SQL editor.

create table if not exists public.workspaces (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;

create policy "workspaces: read own"   on public.workspaces for select using (auth.uid() = user_id);
create policy "workspaces: insert own" on public.workspaces for insert with check (auth.uid() = user_id);
create policy "workspaces: update own" on public.workspaces for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workspaces: delete own" on public.workspaces for delete using (auth.uid() = user_id);

-- Alerts already sent. Written only by the server with the service-role key; no user policies.
create table if not exists public.alert_log (
  key      text primary key,
  channel  text not null,
  sent_at  timestamptz not null default now(),
  payload  jsonb
);

alter table public.alert_log enable row level security;

create index if not exists alert_log_sent_at_idx on public.alert_log (sent_at desc);
