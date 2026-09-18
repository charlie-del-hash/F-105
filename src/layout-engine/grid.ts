/**
 * Pure grid arithmetic. No React, no DOM — unit-testable.
 * Behaviour matches what people expect from a dashboard grid: panels never
 * overlap, moving one pushes the others down, and everything floats up to
 * fill gaps (vertical compaction).
 */
import { GRID_COLS } from "./constants";
import type { PanelInstance } from "./schema";

type Rect = Pick<PanelInstance, "x" | "y" | "w" | "h">;

export function collides(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function sortByPosition<T extends Rect>(items: T[]) {
  return [...items].sort((a, b) => a.y - b.y || a.x - b.x);
}

/** Float every panel up as far as it will go, in reading order. */
export function compact(panels: PanelInstance[]): PanelInstance[] {
  const placed: PanelInstance[] = [];
  for (const p of sortByPosition(panels)) {
    let y = p.y;
    while (y > 0) {
      const candidate = { ...p, y: y - 1 };
      if (placed.some((q) => collides(candidate, q))) break;
      y -= 1;
    }
    placed.push({ ...p, y });
  }
  // preserve original array order for stable React keys
  return panels.map((p) => placed.find((q) => q.id === p.id)!);
}

/** Place `mover`, then push every panel it (transitively) overlaps downward, in reading order. */
function resolve(panels: PanelInstance[], mover: PanelInstance): PanelInstance[] {
  const others = sortByPosition(panels.filter((p) => p.id !== mover.id));
  const fixed: PanelInstance[] = [mover];
  for (const p of others) {
    let cur = p;
    let hit = fixed.find((q) => collides(cur, q));
    let guard = 0;
    while (hit && guard++ < 200) {
      cur = { ...cur, y: hit.y + hit.h };
      hit = fixed.find((q) => collides(cur, q));
    }
    fixed.push(cur);
  }
  return panels.map((p) => fixed.find((q) => q.id === p.id)!);
}

export function clampRect<T extends Rect>(r: T): T {
  const w = Math.max(1, Math.min(GRID_COLS, r.w));
  const x = Math.max(0, Math.min(GRID_COLS - w, r.x));
  return { ...r, x, w, y: Math.max(0, r.y), h: Math.max(1, r.h) };
}

export function movePanel(panels: PanelInstance[], id: string, x: number, y: number): PanelInstance[] {
  const p = panels.find((q) => q.id === id);
  if (!p) return panels;
  const mover = clampRect({ ...p, x, y });
  if (mover.x === p.x && mover.y === p.y) return panels;
  return compact(resolve(panels, mover));
}

export function resizePanel(panels: PanelInstance[], id: string, w: number, h: number, min = { w: 2, h: 2 }): PanelInstance[] {
  const p = panels.find((q) => q.id === id);
  if (!p) return panels;
  const mover = clampRect({ ...p, w: Math.max(min.w, w), h: Math.max(min.h, h) });
  if (mover.w === p.w && mover.h === p.h) return panels;
  return compact(resolve(panels, mover));
}

/** First free slot (reading order) for a panel of the given size. */
export function findFreeSpot(panels: PanelInstance[], w: number, h: number): { x: number; y: number } {
  const width = Math.min(w, GRID_COLS);
  const maxY = panels.reduce((m, p) => Math.max(m, p.y + p.h), 0);
  for (let y = 0; y <= maxY; y++) {
    for (let x = 0; x + width <= GRID_COLS; x++) {
      const r = { x, y, w: width, h };
      if (!panels.some((p) => collides(r, p))) return { x, y };
    }
  }
  return { x: 0, y: maxY };
}

export function gridHeight(panels: PanelInstance[]) {
  return panels.reduce((m, p) => Math.max(m, p.y + p.h), 0);
}

/** Reading order for the single-column (mobile) rendering. */
export function readingOrder(panels: PanelInstance[]) {
  return sortByPosition(panels);
}
