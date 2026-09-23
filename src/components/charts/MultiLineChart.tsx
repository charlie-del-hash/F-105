"use client";
/**
 * Comparison chart: several instruments indexed to a common base.
 *
 * House dataviz rules, unchanged from the single-series chart: 2px lines,
 * >=8px end markers with a 2px surface ring, hairline *solid* gridlines
 * modulated by `--fx-gridline`, all text in text tokens and never in a series
 * colour, one value axis, crosshair and tooltip over the whole plot.
 *
 * What is new is how identity is carried, which is a property of the theme:
 *
 *   hue   Terminal, Cockpit, Bridge, Glass — the theme's validated ring in
 *         fixed order, solid lines, round markers.
 *   form  Phosphor, Paper — every line in slot 1, separated by dash pattern and
 *         end-marker shape. A P1 tube and a broadsheet have one colour each;
 *         inventing a second is exactly what would make them read as a generic
 *         dashboard wearing a filter.
 *
 * The legend is not decoration and is never dropped: it is the identity channel
 * the rules require for two or more series, and it is also the relief for the
 * three themes whose middle ring slots sit under 3:1 against their own surface.
 * It carries the form glyph, not just a colour chip, or `form` mode would be
 * unreadable in the two themes it exists for.
 */
import { useId, useMemo, useRef, useState } from "react";
import { useSize } from "@/lib/useSize";
import { useRootFontSize } from "@/lib/useRootFontSize";
import { useNearestTheme } from "@/lib/useNearestTheme";
import { seriesMode } from "@/design/tokens";
import { niceTicks } from "@/lib/ticks";
import { fmtDate, fmtNum, fmtPct } from "@/data/format";
import { toneClass, toneOf } from "@/components/data/Change";
import { basisLabel, dateSpan, extent, type Basis, type RebasedSeries } from "@/data/rebase";

/**
 * Fixed order, like the colour ring — a series keeps its form wherever it
 * appears.
 *
 * Three is the cap, and it is measured rather than chosen. The theme rings were
 * validated pairwise on *adjacent* slots, which is the right test for a palette
 * you spend a couple of slots of at a time. A comparison chart is the first
 * thing here that puts every slot it uses on screen simultaneously, so the
 * binding test becomes `--pairs all` — and under it no four-slot subset of any
 * ring clears the normal-vision floor of ΔE 15 in all four hue themes. Slots 2
 * and 4 are the pair that fails every time: two blues on Terminal at ΔE 5.5,
 * amber against orange on Bridge at 10.2. At three slots every ring passes with
 * room to spare (worst 17.8 on Terminal, worst CVD 9.0 on Glass).
 *
 * Cutting the series count is the dataviz skill's own remedy for an all-pairs
 * failure, and secondary encoding explicitly does not excuse that floor — so the
 * form themes are held to the same three, which also keeps their dash patterns
 * comfortably tellable apart.
 */
const DASH = ["", "7 3", "2 3"];
const SHAPE = ["circle", "square", "triangle"] as const;
export const MAX_SERIES = DASH.length;

/** An end marker: >=8px across, ringed in the surface so it stays legible where lines cross. */
function Marker({ x, y, shape, color, r = 4.5 }: { x: number; y: number; shape: (typeof SHAPE)[number]; color: string; r?: number }) {
  // paint-order puts the ring outside the fill instead of eating half of it.
  const ring = { fill: color, stroke: "var(--bg-2)", strokeWidth: 2, paintOrder: "stroke fill" as const };
  if (shape === "circle") return <circle cx={x} cy={y} r={r} {...ring} />;
  if (shape === "square") return <rect x={x - r} y={y - r} width={r * 2} height={r * 2} {...ring} />;
  const pts =
    shape === "triangle"
      ? `${x},${y - r * 1.15} ${x + r},${y + r * 0.72} ${x - r},${y + r * 0.72}`
      : `${x},${y - r * 1.25} ${x + r * 1.25},${y} ${x},${y + r * 1.25} ${x - r * 1.25},${y}`;
  return <polygon points={pts} {...ring} />;
}

/** The same line + marker the plot draws, at legend size. Identity, not a swatch. */
function LegendGlyph({ i, color, form }: { i: number; color: string; form: boolean }) {
  return (
    <svg width={22} height={10} viewBox="0 0 22 10" aria-hidden className="shrink-0 overflow-visible">
      <line x1={0} x2={15} y1={5} y2={5} stroke={color} strokeWidth={2} strokeLinecap="round" strokeDasharray={form ? DASH[i] || undefined : undefined} />
      <Marker x={17} y={5} r={3.5} shape={form ? SHAPE[i] : "circle"} color={color} />
    </svg>
  );
}

export function MultiLineChart({ series, basis, actions, minHeight = 140 }: { series: RebasedSeries[]; basis: Basis; actions?: React.ReactNode; minHeight?: number }) {
  const outer = useRef<HTMLDivElement>(null);
  const [plotRef, size] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const gradId = useId();
  const theme = useNearestTheme(outer);
  const form = seriesMode(theme) === "form";

  const rootPx = useRootFontSize();
  const labelPx = rootPx * 0.75;
  const charW = labelPx * 0.64;

  const shown = series.slice(0, MAX_SERIES);
  const colorOf = (i: number) => (form ? "var(--series-1)" : `var(--series-${i + 1})`);

  const W = Math.max(size.width, 10);
  const H = size.height > 0 ? size.height : minHeight;
  const showDates = H >= 150;

  const model = useMemo(() => {
    const span = dateSpan(shown);
    if (!span || shown.length === 0 || size.width < 40 || H < 48) return null;
    const { min, max } = extent(shown, basis);
    const pad = (max - min || Math.abs(max) || 1) * 0.08;
    // Four ticks in a short panel stack the labels on top of each other; ask for
    // as many as the height can actually set.
    const room = Math.max(2, Math.min(4, Math.floor((H - 16) / (labelPx * 2.6))));
    const ticks = niceTicks(min - pad, max + pad, room);
    const yMin = Math.min(ticks[0], min - pad);
    const yMax = Math.max(ticks[ticks.length - 1], max + pad);
    const labelW = Math.max(...ticks.map((t) => fmtNum(t, 0).length), 3) * charW + 6;
    const left = 8 + labelW;
    const top = 10;
    const bottom = showDates ? labelPx * 2.2 : 6;
    const iw = Math.max(1, W - left - 10);
    const ih = Math.max(1, H - top - bottom);
    const x = (t: number) => left + ((t - span.lo) / (span.hi - span.lo)) * iw;
    const y = (v: number) => top + (1 - (v - yMin) / (yMax - yMin || 1)) * ih;

    const lines = shown.map((s) => ({
      symbol: s.symbol,
      last: s.last,
      changePct: s.changePct,
      at: new Map(s.points.map((p) => [Date.parse(p.d), p.v])),
      path: s.points.map((p, i) => `${i ? "L" : "M"}${x(Date.parse(p.d)).toFixed(1)},${y(p.v).toFixed(1)}`).join(" "),
      end: { x: x(Date.parse(s.points[s.points.length - 1].d)), y: y(s.last) },
    }));

    // Every distinct date any series carries, so ragged inputs still line up.
    const stops = [...new Set(shown.flatMap((s) => s.points.map((p) => Date.parse(p.d))))].sort((a, b) => a - b);

    // Date ticks along the bottom, from the span rather than from point indexes.
    const n = W < 360 ? 3 : 5;
    const xTicks = Array.from({ length: n }, (_, i) => span.lo + ((span.hi - span.lo) * i) / (n - 1));

    return { span, ticks, left, top, iw, ih, x, y, lines, stops, xTicks, base: basis === "pct" ? 0 : 100 };
  }, [shown, basis, W, H, size.width, charW, labelPx, showDates]);

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    if (!model) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    const t = model.span.lo + frac * (model.span.hi - model.span.lo);
    let best = model.stops[0];
    for (const s of model.stops) if (Math.abs(s - t) < Math.abs(best - t)) best = s;
    setHover(best);
  };

  return (
    <div ref={outer} className="flex h-full w-full flex-col select-none">
      {/* Legend first: identity, and the value table that the low-contrast ring
          slots on Cockpit, Paper and Glass are obliged to carry. */}
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-3 pb-1 font-data text-meta leading-tight">
        {shown.map((s, i) => (
          <li key={s.symbol} className="flex items-center gap-1.5">
            <LegendGlyph i={i} color={colorOf(i)} form={form} />
            <span className="text-ink-2">{s.symbol}</span>
            <span className={`tabular ${toneClass[toneOf(s.changePct)]}`}>{fmtPct(s.changePct)}</span>
          </li>
        ))}
        {actions && <li className="ml-auto">{actions}</li>}
      </ul>

      <div ref={plotRef} className="relative min-h-0 flex-1">
        {model && (
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block" role="img" aria-label={`Comparison of ${shown.map((s) => s.symbol).join(", ")}, ${basisLabel[basis]}`}>
            <defs>
              <clipPath id={gradId}>
                <rect x={model.left} y={model.top} width={model.iw} height={model.ih} />
              </clipPath>
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
                  style={{ strokeOpacity: "var(--fx-gridline)" }}
                />
                <text x={model.left - 6} y={model.y(t) + labelPx * 0.35} textAnchor="end" fontSize={labelPx} fontFamily="var(--font-data)" fill="var(--ink-3)" className="tabular">
                  {fmtNum(t, 0)}
                </text>
              </g>
            ))}
            {/* The base is the question the chart answers — did it end above
                where it started — so it is a rule, not just another gridline. */}
            <line x1={model.left} x2={model.left + model.iw} y1={model.y(model.base)} y2={model.y(model.base)} stroke="var(--line-strong)" strokeWidth={1} shapeRendering="crispEdges" />
            {showDates &&
              model.xTicks.map((t, i) => (
                <text key={t} x={model.x(t)} y={H - labelPx * 0.6} textAnchor={i === 0 ? "start" : i === model.xTicks.length - 1 ? "end" : "middle"} fontSize={labelPx} fontFamily="var(--font-data)" fill="var(--ink-3)">
                  {fmtDate(new Date(t).toISOString().slice(0, 10))}
                </text>
              ))}
            <g clipPath={`url(#${gradId})`}>
              {model.lines.map((l, i) => (
                <path
                  key={l.symbol}
                  d={l.path}
                  fill="none"
                  stroke={colorOf(i)}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray={form ? DASH[i] || undefined : undefined}
                />
              ))}
            </g>
            {model.lines.map((l, i) => (
              <Marker key={l.symbol} x={l.end.x} y={l.end.y} shape={form ? SHAPE[i] : "circle"} color={colorOf(i)} />
            ))}
            {hover != null && (
              <g pointerEvents="none">
                <line x1={model.x(hover)} x2={model.x(hover)} y1={model.top} y2={model.top + model.ih} stroke="var(--ink-3)" strokeWidth={1} strokeDasharray="2 3" />
                {model.lines.map((l, i) => {
                  const v = l.at.get(hover);
                  return v === undefined ? null : <Marker key={l.symbol} x={model.x(hover)} y={model.y(v)} r={4} shape={form ? SHAPE[i] : "circle"} color={colorOf(i)} />;
                })}
              </g>
            )}
            <rect
              x={model.left}
              y={model.top}
              width={model.iw}
              height={model.ih}
              fill="transparent"
              onPointerMove={onMove}
              onPointerLeave={() => setHover(null)}
              onPointerUp={() => setHover(null)}
              onPointerCancel={() => setHover(null)}
              /* pan-y: the crosshair only tracks horizontally, so a vertical
                 swipe that starts inside the plot still scrolls the page. */
              style={{ cursor: "crosshair", touchAction: "pan-y" }}
            />
          </svg>
        )}
        {model && hover != null && (
          <div
            className="pointer-events-none absolute top-1 rounded-panel border border-line bg-bg-3 px-2 py-1 font-data text-meta leading-tight text-ink shadow"
            style={{ left: Math.min(Math.max(model.x(hover) - 55, 0), Math.max(0, W - 120)) }}
          >
            <div className="text-ink-3">{fmtDate(new Date(hover).toISOString().slice(0, 10), "long")}</div>
            {model.lines.map((l) => {
              const v = l.at.get(hover);
              return v === undefined ? null : (
                <div key={l.symbol} className="flex gap-2">
                  <span className="text-ink-3">{l.symbol}</span>
                  <span className="tabular ml-auto">{fmtNum(v, 1)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
