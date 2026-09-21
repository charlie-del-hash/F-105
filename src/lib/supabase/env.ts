/** Supabase is optional. Without these two public variables the app stays on-device only. */
export function supabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}
export const isSupabaseConfigured = () => supabaseEnv() !== null;

/** The persisted workspace row. Mirrors the store's `partialize` output. */
export interface WorkspaceRow {
  user_id: string;
  state: Record<string, unknown>;
  updated_at: string;
}
