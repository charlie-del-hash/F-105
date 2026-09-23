/**
 * Layout = a named arrangement of panels on a 12-column grid.
 * Layouts are plain JSON so users (and agents) can author, export and share them.
 * See docs/LAYOUTS.md for the format and layouts/*.json for the presets.
 */
import { z } from "zod";
import { deskIds } from "@/config/site";
import { themeIds } from "@/design/tokens";

import { GRID_COLS } from "./constants";
export { GRID_COLS, ROW_HEIGHT, GRID_GAP } from "./constants";

export const PanelInstanceSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  /** Optional title override; the panel supplies its own default. */
  title: z.string().optional(),
  x: z.number().int().min(0).max(GRID_COLS - 1),
  y: z.number().int().min(0),
  w: z.number().int().min(1).max(GRID_COLS),
  h: z.number().int().min(1),
  props: z.record(z.string(), z.unknown()).default({}),
  /** The one panel this layout exists for. At most one per layout; it takes an
   *  accent hairline and a full-strength title so the eye has somewhere to land. */
  primary: z.boolean().default(false),
});

export const LayoutSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  /** Which desk this layout serves; used for grouping in the gallery. */
  desk: z.enum(deskIds).optional(),
  /** The instrument this layout is built for. Applied whenever the reader has not
   *  pinned a theme of their own — see Shell. */
  theme: z.enum(themeIds as [string, ...string[]]).optional(),
  /** Presets are read-only; editing one forks it into the user's collection. */
  preset: z.boolean().default(false),
  panels: z.array(PanelInstanceSchema),
  updatedAt: z.string().optional(),
});

export type PanelInstance = z.infer<typeof PanelInstanceSchema>;
export type Layout = z.infer<typeof LayoutSchema>;

export function parseLayout(input: unknown): Layout {
  const layout = LayoutSchema.parse(input);
  for (const p of layout.panels) {
    if (p.x + p.w > GRID_COLS) throw new Error(`Panel ${p.id} in layout ${layout.id} overflows the grid`);
  }
  // Two primaries is no hierarchy at all. Checked here rather than in the
  // layouts script so a pasted layout and a synced remote row are held to it too.
  const primaries = layout.panels.filter((p) => p.primary);
  if (primaries.length > 1) {
    throw new Error(`Layout ${layout.id} marks ${primaries.length} panels primary (${primaries.map((p) => p.id).join(", ")}); at most one`);
  }
  return layout;
}

export function newId(prefix = "p") {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}
