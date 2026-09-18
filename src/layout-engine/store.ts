/**
 * Workspace store — everything the user has customised, persisted on-device.
 * Presets live in code; the moment a preset is edited it is forked into
 * `layouts` and the fork becomes active. Swap the storage adapter for
 * Supabase later without touching any component (see docs/ARCHITECTURE.md).
 */
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { THEME_STORAGE_KEY, defaultTheme, isThemeId, type ThemeId } from "@/design/tokens";
import { panelMetaMap } from "@/panels/catalog";
import { findFreeSpot, movePanel as gridMove, resizePanel as gridResize, compact, readingOrder } from "./grid";
import { defaultLayoutId, getPreset, presetLayouts } from "./presets";
import { newId, parseLayout, type Layout, type PanelInstance } from "./schema";

export interface WorkspaceState {
  hydrated: boolean;
  theme: ThemeId;
  layouts: Layout[];
  activeId: string;
  editMode: boolean;
  notes: Record<string, string>;
  watchlist: string[];

  setHydrated(): void;
  setTheme(theme: ThemeId): void;
  setActive(id: string): void;
  setEditMode(on: boolean): void;
  forkPreset(id: string, name?: string): Layout | undefined;
  createLayout(name: string): Layout;
  deleteLayout(id: string): void;
  renameLayout(id: string, name: string, description?: string): void;
  importLayout(raw: unknown): Layout;
  addPanel(type: string, props?: Record<string, unknown>, title?: string): void;
  removePanel(panelId: string): void;
  movePanel(panelId: string, x: number, y: number): void;
  resizePanel(panelId: string, w: number, h: number): void;
  setPanelProps(panelId: string, props: Record<string, unknown>): void;
  setPanelTitle(panelId: string, title: string | undefined): void;
  nudgePanel(panelId: string, dir: -1 | 1): void;
  setNote(panelId: string, text: string): void;
  toggleWatch(symbol: string): void;
}

function stamp(layout: Layout): Layout {
  return { ...layout, updatedAt: new Date().toISOString() };
}

export const useWorkspace = create<WorkspaceState>()(
  persist(
    (set, get) => {
      /** Resolve the active layout, forking a preset if the user is about to edit it. */
      const editable = (): Layout | undefined => {
        const s = get();
        const user = s.layouts.find((l) => l.id === s.activeId);
        if (user) return user;
        return s.forkPreset(s.activeId);
      };
      const update = (fn: (l: Layout) => Layout) => {
        const target = editable();
        if (!target) return;
        set((s) => ({ layouts: s.layouts.map((l) => (l.id === target.id ? stamp(fn(l)) : l)) }));
      };

      return {
        hydrated: false,
        theme: defaultTheme,
        layouts: [],
        activeId: defaultLayoutId,
        editMode: false,
        notes: {},
        watchlist: ["BRENT", "TTF", "TD3C"],

        setHydrated: () => set({ hydrated: true }),
        setTheme: (theme) => {
          if (!isThemeId(theme)) return;
          set({ theme });
          try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
            document.documentElement.setAttribute("data-theme", theme);
          } catch {}
        },
        setActive: (id) => set({ activeId: id, editMode: false }),
        setEditMode: (on) => set({ editMode: on }),

        forkPreset: (id, name) => {
          const preset = getPreset(id);
          if (!preset) return undefined;
          const copy: Layout = stamp({
            ...structuredClone(preset),
            id: newId("l"),
            name: name ?? `${preset.name} (mine)`,
            preset: false,
          });
          set((s) => ({ layouts: [...s.layouts, copy], activeId: copy.id }));
          return copy;
        },
        createLayout: (name) => {
          const layout: Layout = stamp({ id: newId("l"), name, description: "", preset: false, panels: [] });
          set((s) => ({ layouts: [...s.layouts, layout], activeId: layout.id, editMode: true }));
          return layout;
        },
        deleteLayout: (id) =>
          set((s) => {
            const layouts = s.layouts.filter((l) => l.id !== id);
            const activeId = s.activeId === id ? defaultLayoutId : s.activeId;
            return { layouts, activeId };
          }),
        renameLayout: (id, name, description) =>
          set((s) => ({
            layouts: s.layouts.map((l) => (l.id === id ? stamp({ ...l, name, description: description ?? l.description }) : l)),
          })),
        importLayout: (raw) => {
          const parsed = parseLayout(raw);
          const layout = stamp({ ...parsed, id: newId("l"), preset: false });
          set((s) => ({ layouts: [...s.layouts, layout], activeId: layout.id }));
          return layout;
        },

        addPanel: (type, props = {}, title) =>
          update((l) => {
            const meta = panelMetaMap.get(type);
            if (!meta) return l;
            const { x, y } = findFreeSpot(l.panels, meta.defaultSize.w, meta.defaultSize.h);
            const panel: PanelInstance = { id: newId(type), type, title, x, y, ...meta.defaultSize, props };
            return { ...l, panels: compact([...l.panels, panel]) };
          }),
        removePanel: (panelId) => update((l) => ({ ...l, panels: compact(l.panels.filter((p) => p.id !== panelId)) })),
        movePanel: (panelId, x, y) => update((l) => ({ ...l, panels: gridMove(l.panels, panelId, x, y) })),
        resizePanel: (panelId, w, h) =>
          update((l) => {
            const p = l.panels.find((q) => q.id === panelId);
            const min = p ? panelMetaMap.get(p.type)?.minSize : undefined;
            return { ...l, panels: gridResize(l.panels, panelId, w, h, min) };
          }),
        setPanelProps: (panelId, props) =>
          update((l) => ({ ...l, panels: l.panels.map((p) => (p.id === panelId ? { ...p, props: { ...p.props, ...props } } : p)) })),
        setPanelTitle: (panelId, title) =>
          update((l) => ({ ...l, panels: l.panels.map((p) => (p.id === panelId ? { ...p, title } : p)) })),
        nudgePanel: (panelId, dir) =>
          update((l) => {
            // Mobile reorder: swap with the neighbour in reading order, then re-lay out as a single column.
            const order = readingOrder(l.panels);
            const i = order.findIndex((p) => p.id === panelId);
            const j = i + dir;
            if (i < 0 || j < 0 || j >= order.length) return l;
            [order[i], order[j]] = [order[j], order[i]];
            let y = 0;
            const relaid = order.map((p) => {
              const np = { ...p, x: 0, y };
              y += p.h;
              return np;
            });
            return { ...l, panels: l.panels.map((p) => relaid.find((q) => q.id === p.id)!) };
          }),

        setNote: (panelId, text) => set((s) => ({ notes: { ...s.notes, [panelId]: text } })),
        toggleWatch: (symbol) =>
          set((s) => ({
            watchlist: s.watchlist.includes(symbol) ? s.watchlist.filter((x) => x !== symbol) : [...s.watchlist, symbol],
          })),
      };
    },
    {
      name: "f105.workspace",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ theme: s.theme, layouts: s.layouts, activeId: s.activeId, notes: s.notes, watchlist: s.watchlist }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

/** The active layout: a user layout, else a preset, else the default preset. */
export function selectActiveLayout(s: WorkspaceState): Layout {
  return s.layouts.find((l) => l.id === s.activeId) ?? getPreset(s.activeId) ?? presetLayouts[0];
}
export function useActiveLayout() {
  return useWorkspace(selectActiveLayout);
}
export function allLayouts(s: WorkspaceState): Layout[] {
  return [...presetLayouts, ...s.layouts];
}
