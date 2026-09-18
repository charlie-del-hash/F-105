"use client";
/**
 * Single-series daily line chart. Follows the house dataviz rules:
 * 2px line, 10% area wash, ≥8px end marker with a surface ring, hairline
 * solid gridlines, text in text tokens, a crosshair + tooltip on hover,
 * and a hit target that is the whole plot. One axis, always.
 */
import { useMemo, useState } from "react";
import { useSize } from "@/lib/useSize";
import { indexTicks, niceTicks } from "@/lib/ticks";
import { fmtDate, fmtNum } from "@/data/format";
import type { SeriesPoint } from "@/data/types";

export function LineChart({
  points,
  decimals = 2,
  unit = "",
  color = "var(--series-1)",
  minHeight = 120,
}: {
  points: SeriesPoint[];
  decimals?: number;
  unit?: string;
  color?: string;
  minHeight?: number;
}) {
  const [ref, size] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const W = Math.max(size.width, 10);
  const H = Math.max(size.height, minHeight);
  const m = { top: 10, right: 12, bottom: 22, left: 8 };

  const model = useMemo(() => {
    if (points.length < 2 || size.width < 40) return null;
    const vs = points.map((p) => p.v);
    const lo = Math.min(...vs);
    const hi = Math.max(...vs);
    const padV = (hi - lo || Math.abs(hi) || 1) * 0.08;
    const yMin = lo - padV;
    const yMax = hi + padV;
    const ticks = niceTicks(yMin, yMax, 4);
    const labelW = Math.max(...ticks.map((t) => fmtNum(t, decimals).length), 3) * 6.6 + 6;
    const left = m.left + labelW;
    const iw = Math.max(1, W - left - m.right);
    const ih = H - m.top - m.bottom;
    const x = (i: number) => left + (i / (points.length - 1)) * iw;
    const y = (v: number) => m.top + (1 - (v - yMin) / (yMax - yMin)) * ih;
    const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
    const area = `${path} L${x(points.length - 1).toFixed(1)},${(m.top + ih).toFixed(1)} L${left.toFixed(1)},${(m.top + ih).toFixed(1)} Z`;
    return { ticks, left, iw, ih, x, y, path, area, xTicks: indexTicks(points.length, W < 360 ? 3 : 5) };
  }, [points, W, H, size.width, decimals, m.left, m.right, m.top, m.bottom]);

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    if (!model) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = Math.round((px / rect.width) * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, i)));
  };

  const last = points[points.length - 1];
  const hp = hover != null ? points[hover] : null;

  return (
    <div ref={ref} className="relative h-full w-full min-h-[120px] select-none">
      {model && (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block" role="img" aria-label={`Line chart, ${points.length} daily points`}>
          {/* gridlines + y labels */}
          {model.ticks.map((t) => (
            <g key={t}>
              <line x1={model.left} x2={model.left + model.iw} y1={model.y(t)} y2={model.y(t)} stroke="var(--line)" strokeWidth={1} shapeRendering="crispEdges" />
              <text x={model.left - 6} y={model.y(t) + 3.5} textAnchor="end" fontSize={10} fontFamily="var(--font-data)" fill="var(--ink-3)" className="tabular">
                {fmtNum(t, decimals)}
              </text>
            </g>
          ))}
          {/* x labels */}
          {model.xTicks.map((i) => (
            <text key={i} x={model.x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"} fontSize={10} fontFamily="var(--font-data)" fill="var(--ink-3)">
              {fmtDate(points[i].d)}
            </text>
          ))}
          {/* series */}
          <path d={model.area} fill={color} opacity={0.1} />
          <path d={model.path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={model.x(points.length - 1)} cy={model.y(last.v)} r={4} fill={color} stroke="var(--bg-2)" strokeWidth={2} />
          {/* crosshair */}
          {hp && hover != null && (
            <g pointerEvents="none">
              <line x1={model.x(hover)} x2={model.x(hover)} y1={m.top} y2={m.top + model.ih} stroke="var(--ink-3)" strokeWidth={1} strokeDasharray="2 3" />
              <circle cx={model.x(hover)} cy={model.y(hp.v)} r={4.5} fill={color} stroke="var(--bg-2)" strokeWidth={2} />
            </g>
          )}
          {/* hit target = the whole plot */}
          <rect x={model.left} y={m.top} width={model.iw} height={model.ih} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHover(null)} style={{ cursor: "crosshair", touchAction: "none" }} />
        </svg>
      )}
      {model && hp && hover != null && (
        <div
          className="pointer-events-none absolute top-1 rounded-[var(--radius)] border border-line bg-bg-3 px-2 py-1 font-data text-[11px] leading-tight text-ink shadow"
          style={{ left: Math.min(Math.max(model.x(hover) - 60, 0), W - 130) }}
        >
          <div className="text-ink-3">{fmtDate(hp.d, "long")}</div>
          <div className="tabular">
            {fmtNum(hp.v, decimals)} <span className="text-ink-3">{unit}</span>
          </div>
        </div>
      )}
    </div>
  );
}
