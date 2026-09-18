"use client";
/**
 * Cross-device sync of the workspace store through Supabase.
 * Policy: last write wins by `updated_at`. On sign-in the newer of local and
 * remote is kept; afterwards every local change is pushed after a short debounce.
 * Everything here is a no-op when Supabase is not configured.
 */
import { useEffect } from "react";
import { create } from "zustand";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { WorkspaceRow } from "@/lib/supabase/env";
import { persistedShape, useWorkspace, type PersistedShape } from "./store";

export type SyncState = "off" | "signed-out" | "syncing" | "synced" | "error";

interface SyncStatus {
  state: SyncState;
  email?: string;
  detail?: string;
  lastSync?: string;
  set(patch: Partial<SyncStatus>): void;
}

export const useSyncStatus = create<SyncStatus>((set) => ({ state: "off", set: (patch) => set(patch) }));

const TABLE = "workspaces";

async function pull(sb: SupabaseClient, user: User) {
  const { data, error } = await sb.from(TABLE).select("state, updated_at").eq("user_id", user.id).maybeSingle<Pick<WorkspaceRow, "state" | "updated_at">>();
  if (error) throw error;
  return data;
}

async function push(sb: SupabaseClient, user: User, shape: PersistedShape) {
  const updated_at = new Date().toISOString();
  const { error } = await sb.from(TABLE).upsert({ user_id: user.id, state: shape, updated_at }, { onConflict: "user_id" });
  if (error) throw error;
  return updated_at;
}

/** Newest local change, from the layouts' own timestamps. */
function localUpdatedAt(shape: PersistedShape) {
  return shape.layouts.reduce((m, l) => (l.updatedAt && l.updatedAt > m ? l.updatedAt : m), "");
}

export function WorkspaceSync() {
  const hydrated = useWorkspace((s) => s.hydrated);
  useEffect(() => {
    if (!hydrated) return;
    const sb = getBrowserSupabase();
    const status = useSyncStatus.getState().set;
    if (!sb) {
      status({ state: "off", detail: "Supabase not configured; workspace stays on this device." });
      return;
    }
    let user: User | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let unsubscribeStore: (() => void) | null = null;

    const schedulePush = () => {
      if (!user) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        if (!user) return;
        status({ state: "syncing" });
        try {
          const at = await push(sb, user, persistedShape(useWorkspace.getState()));
          status({ state: "synced", lastSync: at, detail: `Synced ${at}` });
        } catch (e) {
          status({ state: "error", detail: (e as Error).message });
        }
      }, 1500);
    };

    const start = async (u: User) => {
      user = u;
      status({ state: "syncing", email: u.email ?? undefined });
      try {
        const remote = await pull(sb, u);
        const local = persistedShape(useWorkspace.getState());
        if (remote && remote.updated_at > localUpdatedAt(local)) {
          useWorkspace.getState().applyRemote(remote.state as Partial<PersistedShape>);
          status({ state: "synced", lastSync: remote.updated_at, detail: `Pulled ${remote.updated_at}` });
        } else {
          const at = await push(sb, u, local);
          status({ state: "synced", lastSync: at, detail: `Pushed ${at}` });
        }
      } catch (e) {
        status({ state: "error", detail: (e as Error).message });
      }
      unsubscribeStore?.();
      unsubscribeStore = useWorkspace.subscribe((s, prev) => {
        if (s.layouts !== prev.layouts || s.theme !== prev.theme || s.activeId !== prev.activeId || s.notes !== prev.notes || s.watchlist !== prev.watchlist) schedulePush();
      });
    };
    const stop = () => {
      user = null;
      unsubscribeStore?.();
      unsubscribeStore = null;
      status({ state: "signed-out", email: undefined, detail: "Sign in on /account to sync across devices." });
    };

    sb.auth.getUser().then(({ data }) => (data.user ? start(data.user) : stop()));
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user && session.user.id !== user?.id) start(session.user);
      if (event === "SIGNED_OUT") stop();
    });
    return () => {
      sub.subscription.unsubscribe();
      unsubscribeStore?.();
      if (timer) clearTimeout(timer);
    };
  }, [hydrated]);
  return null;
}
