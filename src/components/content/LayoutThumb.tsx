import { GRID_COLS } from "@/layout-engine/constants";
import { gridHeight } from "@/layout-engine/grid";
import type { Layout } from "@/layout-engine/schema";

/** A miniature of a layout: one rect per panel, colour by category. */
export function LayoutThumb({ layout, width = 160 }: { layout: Layout; width?: number }) {
  const rows = Math.max(gridHeight(layout.panels), 6);
  const cell = width / GRID_COLS;
  const height = Math.min(rows, 20) * cell * 0.55;
  const tone: Record<string, string> = {
    quotes: "var(--series-1)", chart: "var(--series-1)", indicators: "var(--series-1)",
    wire: "var(--series-2)", headlines: "var(--series-2)", reader: "var(--series-2)", dossier: "var(--series-2)", calendar: "var(--series-2)",
    plot: "var(--series-3)",
    clocks: "var(--ink-3)", notes: "var(--ink-3)",
  };
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="block">
      {layout.panels.map((p) => (
        <rect
          key={p.id}
          x={p.x * cell + 1}
          y={p.y * cell * 0.55 + 1}
          width={p.w * cell - 2}
          height={p.h * cell * 0.55 - 2}
          rx={1.5}
          fill={tone[p.type] ?? "var(--ink-3)"}
          opacity={0.55}
        />
      ))}
    </svg>
  );
}
