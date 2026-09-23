/**
 * Workspace store — everything the user has customised, persisted on-device.
 * Presets live in code; the moment a preset is edited it is forked into
 * `layouts` and the fork becomes active. Swap the storage adapter for
 * Supabase later without touching any component (see docs/ARCHITECTURE.md).
 */
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AUTO, isThemeChoice, type ThemeChoice } from "@/design/tokens";
import { panelMetaMap } from "@/panels/catalog";
import { findFreeSpot, movePanel as gridMove, resizePanel as gridResize, compact, swapInReadingOrder } from "./grid";
import { defaultLayoutId, getPreset, presetLayouts } from "./presets";
import { newId, parseLayout, type Layout, type PanelInstance } from "./schema";

/** Exactly what is persisted (on-device and, when signed in, in Supabase). */
export interface PersistedShape {
  theme: ThemeChoice;
  themePinned: boolean;
  layouts: Layout[];
  activeId: string;
  notes: Record<string, string>;
  watchlist: string[];
}

export interface WorkspaceState {
  hydrated: boolean;
  /** The user's preference, not what is on screen. See `resolveTheme`. */
  theme: ThemeChoice;
  /** True once the user picks a theme: layouts stop overriding it. */
  themePinned: boolean;
  layouts: Layout[];
  activeId: string;
  editMode: boolean;
  notes: Record<string, string>;
  watchlist: string[];

  setHydrated(): void;
  /** The user's own pick. Choosing one pins it, so layouts stop changing it. */
  setTheme(theme: ThemeChoice): void;
  /** Hand the theme back to the active layout. */
  unpinTheme(): void;
  setActive(id: string): void;
  setEditMode(on: boolean): void;
  forkPreset(id: string, name?: string): Layout | undefined;
  createLayout(name: string): Layout;
  deleteLayout(id: string): void;
  renameLayout(id: string, name: string, description?: string): void;
  importLayout(raw: unknown): Layout;
  addPanel(type: string, props?: Record<string, unknown>, title?: string): void;
  /** Copy a preset's panels into the active layout (the empty-layout starter). */
  adoptPreset(presetId: string): void;
  removePanel(panelId: string): void;
  movePanel(panelId: string, x: number, y: number): void;
  resizePanel(panelId: string, w: number, h: number): void;
  setPanelProps(panelId: string, props: Record<string, unknown>): void;
  setPanelTitle(panelId: string, title: string | undefined): void;
  nudgePanel(panelId: string, dir: -1 | 1): void;
  setNote(panelId: string, text: string): void;
  toggleWatch(symbol: string): void;
  /** Replace persisted fields with a remote copy (sync pull). Validates layouts; ignores junk. */
  applyRemote(shape: Partial<PersistedShape>): void;
}

/** The localStorage key the persist middleware writes. Exported so a caller can
 *  tell a first run from a returning device without guessing the string. */
export const WORKSPACE_STORAGE_KEY = "f105.workspace";

export function persistedShape(s: WorkspaceState): PersistedShape {
  return { theme: s.theme, themePinned: s.themePinned, layouts: s.layouts, activeId: s.activeId, notes: s.notes, watchlist: s.watchlist };
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
        // Unpinned by default, so a layout's declared theme is what you get.
        theme: AUTO,
        themePinned: false,
        layouts: [],
        activeId: defaultLayoutId,
        editMode: false,
        notes: {},
        watchlist: ["BRENT", "TTF", "TD3C"],

        setHydrated: () => set({ hydrated: true }),
        // Picking a theme is a statement of preference, so it pins. Applying it to
        // the document is Shell's job — it is the only place that knows the OS
        // colour scheme, the active layout and any in-page override.
        setTheme: (theme) => {
          if (!isThemeChoice(theme)) return;
          set({ theme, themePinned: true });
        },
        unpinTheme: () => set({ themePinned: false }),
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
            // A panel you add is never the layout's primary; that is a deliberate
            // mark on the one panel the layout exists for.
            const panel: PanelInstance = { id: newId(type), type, title, x, y, ...meta.defaultSize, props, primary: false };
            return { ...l, panels: compact([...l.panels, panel]) };
          }),
        adoptPreset: (presetId) => {
          const preset = getPreset(presetId);
          if (!preset) return;
          update((l) => ({ ...l, theme: l.theme ?? preset.theme, panels: structuredClone(preset.panels) }));
        },
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
          // Phone reorder. This used to re-lay every panel to x:0 full width, so one
          // tap of "move down" permanently flattened a 12-column desk — and because
          // the edit forks a preset first, the flattened version was what got saved.
          update((l) => ({ ...l, panels: swapInReadingOrder(l.panels, panelId, dir) })),

        setNote: (panelId, text) => set((s) => ({ notes: { ...s.notes, [panelId]: text } })),
        toggleWatch: (symbol) =>
          set((s) => ({
            watchlist: s.watchlist.includes(symbol) ? s.watchlist.filter((x) => x !== symbol) : [...s.watchlist, symbol],
          })),
        applyRemote: (shape) => {
          const layouts: Layout[] = [];
          for (const raw of shape.layouts ?? []) {
            try {
              layouts.push(parseLayout({ ...raw, preset: false }));
            } catch {
              /* skip a corrupt layout rather than lose the rest */
            }
          }
          set((s) => ({
            theme: isThemeChoice(shape.theme) ? shape.theme : s.theme,
            themePinned: typeof shape.themePinned === "boolean" ? shape.themePinned : s.themePinned,
            layouts: shape.layouts ? layouts : s.layouts,
            activeId: typeof shape.activeId === "string" ? shape.activeId : s.activeId,
            notes: shape.notes && typeof shape.notes === "object" ? shape.notes : s.notes,
            watchlist: Array.isArray(shape.watchlist) ? shape.watchlist.filter((x) => typeof x === "string") : s.watchlist,
          }));
          // Applying it to the document is Shell's job; it reacts to this state.
        },
      };
    },
    {
      name: WORKSPACE_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: persistedShape,
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
