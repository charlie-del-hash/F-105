"use client";
/**
 * Single-series daily line chart. House dataviz rules: 2px line, a light area
 * wash, ≥8px end marker with a surface ring, hairline solid gridlines, text in
 * text tokens, crosshair + tooltip over the whole plot, one axis. The terminal
 * detail: a dashed last-price line with its value tag in the right margin.
 */
import { useId, useMemo, useState } from "react";
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
  lastTag = true,
  lastValue,
}: {
  points: SeriesPoint[];
  decimals?: number;
  unit?: string;
  color?: string;
  minHeight?: number;
  lastTag?: boolean;
  /** Live last price for the dashed line and tag; defaults to the final point. */
  lastValue?: number;
}) {
  const [ref, size] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const gradId = useId();

  const W = Math.max(size.width, 10);
  // The slot decides the height. Forcing a floor here made the SVG taller than
  // its flex slot in a short panel and painted over whatever sat beneath it;
  // minHeight is only the fallback for the frame before the first measurement.
  const H = size.height > 0 ? size.height : minHeight;
  const last = points[points.length - 1];
  const mark = lastValue ?? last?.v;
  const tagW = lastTag && mark !== undefined ? Math.max(fmtNum(mark, decimals).length, 4) * 6.4 + 10 : 0;
  // A short plot drops the date axis rather than overlapping whatever sits under
  // it. The panel below still carries the "as of" date, so nothing is lost.
  const showDates = H >= 150;
  const m = { top: 10, right: 10 + tagW, bottom: showDates ? 22 : 6, left: 8 };

  const model = useMemo(() => {
    // Below a usable plot height there is nothing honest to draw.
    if (points.length < 2 || size.width < 40 || H < 48) return null;
    const vs = points.map((p) => p.v);
    const lo = Math.min(...vs, mark ?? Infinity);
    const hi = Math.max(...vs, mark ?? -Infinity);
    const padV = (hi - lo || Math.abs(hi) || 1) * 0.08;
    const yMin = lo - padV;
    const yMax = hi + padV;
    const ticks = niceTicks(yMin, yMax, 4);
    const labelW = Math.max(...ticks.map((t) => fmtNum(t, decimals).length), 3) * 6.4 + 6;
    const left = m.left + labelW;
    const iw = Math.max(1, W - left - m.right);
    const ih = H - m.top - m.bottom;
    const x = (i: number) => left + (i / (points.length - 1)) * iw;
    const y = (v: number) => m.top + (1 - (v - yMin) / (yMax - yMin)) * ih;
    const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
    const area = `${path} L${x(points.length - 1).toFixed(1)},${(m.top + ih).toFixed(1)} L${left.toFixed(1)},${(m.top + ih).toFixed(1)} Z`;
    return { ticks, left, iw, ih, x, y, path, area, xTicks: indexTicks(points.length, W < 360 ? 3 : 5) };
  }, [points, W, H, size.width, decimals, mark, m.left, m.right, m.top, m.bottom]);

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    if (!model) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - rect.left) / rect.width) * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, i)));
  };

  const hp = hover != null ? points[hover] : null;
  const lastY = model && last ? model.y(last.v) : 0;
  const markY = model && mark !== undefined ? model.y(mark) : 0;

  return (
    <div ref={ref} className="relative h-full w-full select-none">
      {model && (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block" role="img" aria-label={`Line chart, ${points.length} daily points`}>
          <defs>
            <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity={0.16} />
              <stop offset="1" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {model.ticks.map((t) => (
            <g key={t}>
              <line
                x1={model.left}
                x2={model.left + model.iw}
                y1={model.y(t)}
                y2={model.y(t)}
                stroke="var(--line)"
                strokeWidth={1}
                shapeRendering="crispEdges"
                /* How present the grid is, is a theme dial: a plotted Cockpit or
                   Bridge grid, almost none on Paper. */
                style={{ strokeOpacity: "var(--fx-gridline)" }}
              />
              <text x={model.left - 6} y={model.y(t) + 3.5} textAnchor="end" fontSize={10} fontFamily="var(--font-data)" fill="var(--ink-3)" className="tabular">
                {fmtNum(t, decimals)}
              </text>
            </g>
          ))}
          {showDates && model.xTicks.map((i) => (
            <text key={i} x={model.x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"} fontSize={10} fontFamily="var(--font-data)" fill="var(--ink-3)">
              {fmtDate(points[i].d)}
            </text>
          ))}
          <path d={model.area} fill={`url(#${gradId})`} />
          <path d={model.path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {lastTag && mark !== undefined && (
            <g pointerEvents="none">
              <line x1={model.left} x2={W - tagW - 6} y1={markY} y2={markY} stroke="var(--ink-3)" strokeWidth={1} strokeDasharray="3 3" opacity={0.8} />
              <rect x={W - tagW - 4} y={markY - 8} width={tagW} height={16} rx={2} fill="var(--bg-3)" stroke="var(--line-strong)" />
              <text x={W - 4 - tagW / 2} y={markY + 3.5} textAnchor="middle" fontSize={10} fontFamily="var(--font-data)" fill="var(--ink)" className="tabular">
                {fmtNum(mark, decimals)}
              </text>
            </g>
          )}
          <circle cx={model.x(points.length - 1)} cy={lastY} r={4} fill={color} stroke="var(--bg-2)" strokeWidth={2} />
          {hp && hover != null && (
            <g pointerEvents="none">
              <line x1={model.x(hover)} x2={model.x(hover)} y1={m.top} y2={m.top + model.ih} stroke="var(--ink-3)" strokeWidth={1} strokeDasharray="2 3" />
              <circle cx={model.x(hover)} cy={model.y(hp.v)} r={4.5} fill={color} stroke="var(--bg-2)" strokeWidth={2} />
            </g>
          )}
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
