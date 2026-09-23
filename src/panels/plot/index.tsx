"use client";
/**
 * The plot: an NTDS-flavoured schematic of a chokepoint. Circles are merchant
 * tracks, a circle with a dot is naval, a square is unevaluated, the crossed
 * ring is the datum. A leader line shows course. Illustrative positions.
 */
import { z } from "zod";
import { arrow, fmtNum } from "@/data/format";
import { getInstrument } from "@/data/instruments";
import { useQuotes } from "@/lib/useQuotes";
import { cn } from "@/lib/cn";
import { Empty } from "@/components/ui/Tag";
import { panelMetaMap } from "../catalog";
import type { PanelDefinition } from "../types";
import { areaIds, areas, type Track } from "./areas";

const schema = z.object({ area: z.string().default("hormuz") });
type Props = z.infer<typeof schema>;

function poly(pts: number[][]) {
  return pts.map((p) => p.join(",")).join(" ");
}

function TrackGlyph({ t }: { t: Track }) {
  const len = 6;
  const rad = ((t.crs - 90) * Math.PI) / 180;
  const lx = t.x + Math.cos(rad) * len;
  const ly = t.y + Math.sin(rad) * len;
  const stroke = t.kind === "unknown" ? "var(--warn)" : t.kind === "naval" ? "var(--ink)" : "var(--accent)";
  return (
    <g className={cn(t.kind === "unknown" && "animate-[led-blink_1.4s_steps(1)_infinite]")}>
      <line x1={t.x} y1={t.y} x2={lx} y2={ly} stroke={stroke} strokeWidth={0.6} />
      {t.kind === "unknown" ? (
        <rect x={t.x - 1.8} y={t.y - 1.8} width={3.6} height={3.6} fill="none" stroke={stroke} strokeWidth={0.7} />
      ) : (
        <circle cx={t.x} cy={t.y} r={1.8} fill="none" stroke={stroke} strokeWidth={0.7} />
      )}
      {t.kind === "naval" && <circle cx={t.x} cy={t.y} r={0.6} fill={stroke} />}
      <text x={t.x + 2.6} y={t.y - 2} fontSize={2.6} fontFamily="var(--font-data)" fill="var(--ink-3)">
        {t.label}
      </text>
    </g>
  );
}

export function PlotView({ areaId, showStatus = true }: { areaId: string; showStatus?: boolean }) {
  const area = areas[areaId];
  const { quotes } = useQuotes(area?.instruments ?? []);
  if (!area) return <Empty>Unknown area “{areaId}”.</Empty>;
  return (
    <div className="flex h-full flex-col">
      <div className="inset relative m-2 min-h-0 flex-1 overflow-hidden">
        <svg viewBox="0 0 100 70" preserveAspectRatio="xMidYMid meet" className="block h-full w-full" role="img" aria-label={`${area.name} schematic plot`}>
          <defs>
            <pattern id="plot-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M10 0H0V10" fill="none" stroke="var(--line)" strokeWidth={0.25} />
            </pattern>
          </defs>
          <rect width="100" height="70" fill="url(#plot-grid)" />
          {area.land.map((pts, i) => (
            <polygon key={i} points={poly(pts)} fill="var(--bg-2)" stroke="var(--line-strong)" strokeWidth={0.5} strokeLinejoin="round" />
          ))}
          {area.lanes.map((l) => (
            <g key={l.id}>
              <polyline points={poly(l.pts)} fill="none" stroke="var(--ink-3)" strokeWidth={0.5} strokeDasharray="2 1.5" />
              <text x={l.pts[l.pts.length - 1][0]} y={l.pts[l.pts.length - 1][1] + 3.2} fontSize={2.4} fontFamily="var(--font-data)" fill="var(--ink-3)" textAnchor="end">
                {l.label}
              </text>
            </g>
          ))}
          {area.marks.map((m) => (
            <g key={m.label}>
              {m.kind === "datum" ? (
                <>
                  <circle cx={m.x} cy={m.y} r={5} fill="none" stroke="var(--alert)" strokeWidth={0.5} strokeDasharray="1.5 1.2" opacity={0.8} />
                  <path d={`M${m.x - 1.5},${m.y - 1.5} L${m.x + 1.5},${m.y + 1.5} M${m.x - 1.5},${m.y + 1.5} L${m.x + 1.5},${m.y - 1.5}`} stroke="var(--alert)" strokeWidth={0.7} />
                </>
              ) : (
                <rect x={m.x - 0.9} y={m.y - 0.9} width={1.8} height={1.8} fill="var(--ink-3)" transform={`rotate(45 ${m.x} ${m.y})`} />
              )}
              <text x={m.x + 2} y={m.y + (m.kind === "datum" ? -6 : 0.9)} fontSize={2.4} fontFamily="var(--font-data)" fill={m.kind === "datum" ? "var(--alert)" : "var(--ink-2)"}>
                {m.label}
              </text>
            </g>
          ))}
          {area.tracks.map((t) => (
            <TrackGlyph key={t.id} t={t} />
          ))}
          <g transform="translate(95 6)" aria-hidden>
            <path d="M0 -3.5 L1.6 1.5 L0 0.6 L-1.6 1.5 Z" fill="var(--ink-2)" />
            <text y={5.6} textAnchor="middle" fontSize={2.4} fontFamily="var(--font-data)" fill="var(--ink-3)">N</text>
          </g>
          <text x={2} y={68} fontSize={2.3} fontFamily="var(--font-data)" fill="var(--ink-3)">
            {area.subtitle} · positions illustrative
          </text>
        </svg>
      </div>
      {showStatus && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-3 pb-2 font-data text-meta">
          {area.instruments.map((s) => {
            const q = quotes[s];
            const inst = getInstrument(s);
            const tone = q ? (q.change > 0 ? "text-up" : q.change < 0 ? "text-down" : "text-ink-2") : "text-ink-2";
            return (
              <span key={s} className="tabular">
                <span className="text-ink-3">{s}</span>{" "}
                <span className="text-ink">{q ? fmtNum(q.last, inst?.decimals ?? 0) : "…"}</span>{" "}
                <span className={tone}>{q ? arrow(q.change) : ""}</span>
              </span>
            );
          })}
          <span className="ml-auto text-ink-3">○ merchant · ⊙ naval · □ unevaluated · ⊗ datum</span>
        </div>
      )}
    </div>
  );
}

function PlotPanel({ props, size }: { props: Props; size: { w: number; h: number } }) {
  return <PlotView areaId={props.area} showStatus={size.h >= 5} />;
}

export const plotDefinition: PanelDefinition<Props> = {
  meta: panelMetaMap.get("plot")!,
  schema,
  fields: [{ key: "area", label: "Area", kind: "select", options: areaIds.map((id) => ({ value: id, label: areas[id].name })) }],
  component: PlotPanel,
  defaultTitle: (p) => `Plot · ${areas[p.area]?.name ?? p.area}`,
};
