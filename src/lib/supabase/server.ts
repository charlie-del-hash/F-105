import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

/** Cookie-backed client for route handlers and server components (acts as the signed-in user). */
export async function createServerSupabase(): Promise<SupabaseClient | null> {
  const env = supabaseEnv();
  if (!env) return null;
  const store = await cookies();
  return createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component: the proxy refreshes sessions instead.
        }
      },
    },
  });
}

/** Service-role client for server-only tables (alert_log). Never ships to the browser. */
export function createServiceSupabase(): SupabaseClient | null {
  const env = supabaseEnv();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env || !service) return null;
  return createClient(env.url, service, { auth: { persistSession: false, autoRefreshToken: false } });
}
