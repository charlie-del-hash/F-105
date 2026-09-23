"use client";
import { create } from "zustand";
import type { ThemeId } from "@/design/tokens";

/**
 * A theme override that lasts only as long as the component that set it — the
 * reading surface's "read on Paper".
 *
 * Deliberately its own store, with no persistence. It lived in the workspace
 * store first, and that was a data-loss bug: the workspace persists with
 * `skipHydration`, so `Shell` rehydrates it in an effect, and React runs child
 * effects before parent ones. A reading page setting the override on mount
 * therefore wrote to localStorage *before* the saved state had been read back,
 * and zustand persisted the defaults over it — landing directly on /read wiped
 * the reader's layouts, notes and watchlist. Ephemeral state has no business in
 * a persisted store.
 */
interface ThemeOverrideState {
  overrideTheme: ThemeId | null;
  setOverrideTheme(theme: ThemeId | null): void;
}

export const useThemeOverride = create<ThemeOverrideState>()((set) => ({
  overrideTheme: null,
  setOverrideTheme: (overrideTheme) => set({ overrideTheme }),
}));
