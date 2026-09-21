/**
 * "Have we sent this already?" Memory for a single instance; Supabase's alert_log
 * when a service-role key is configured, which is what a cron on Vercel needs.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export interface Dedupe {
  readonly id: string;
  has(key: string, channel: string): Promise<boolean>;
  mark(key: string, channel: string, payload?: unknown): Promise<void>;
}

export function memoryDedupe(seed: Iterable<string> = []): Dedupe {
  const seen = new Set(seed);
  return {
    id: "memory",
    async has(key, channel) {
      return seen.has(`${channel}:${key}`);
    },
    async mark(key, channel) {
      seen.add(`${channel}:${key}`);
    },
  };
}

export function supabaseDedupe(sb: SupabaseClient): Dedupe {
  return {
    id: "supabase",
    async has(key, channel) {
      const { data, error } = await sb.from("alert_log").select("key").eq("key", `${channel}:${key}`).maybeSingle();
      if (error) throw error;
      return !!data;
    },
    async mark(key, channel, payload) {
      const { error } = await sb.from("alert_log").upsert({ key: `${channel}:${key}`, channel, payload: payload ?? null }, { onConflict: "key" });
      if (error) throw error;
    },
  };
}
