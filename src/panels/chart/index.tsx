"use client";
import { useState } from "react";
import { z } from "zod";
import { arrow, fmtNum, fmtPct, fmtSigned } from "@/data/format";
import { getInstrument, instruments } from "@/data/instruments";
import { ranges, type Range } from "@/data/types";
import { useQuotes, useSeries } from "@/lib/useQuotes";
import { cn } from "@/lib/cn";
import { LineChart } from "@/components/charts/LineChart";
import { Empty } from "@/components/ui/Tag";
import { panelMetaMap } from "../catalog";
import type { PanelDefinition } from "../types";

const schema = z.object({
  symbol: z.string().default("BRENT"),
  range: z.enum(["1m", "3m", "6m", "1y"]).default("3m"),
});
type Props = z.infer<typeof schema>;

/** Reusable chart block: header strip + range picker + chart + source line. */
export function ChartBlock({ symbol, initialRange = "3m", tall = false }: { symbol: string; initialRange?: Range; tall?: boolean }) {
  const [range, setRange] = useState<Range>(initialRange);
  const inst = getInstrument(symbol);
  const { series, error } = useSeries(symbol, range);
  const { quotes } = useQuotes([symbol]);
  const q = quotes[symbol];
  if (!inst) return <Empty>Unknown instrument {symbol}</Empty>;
  const tone = q ? (q.change > 0 ? "text-up" : q.change < 0 ? "text-down" : "text-ink-2") : "text-ink-2";
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3 pt-2 font-data">
        <span className={cn("tabular text-ink", tall ? "text-3xl" : "text-lg")}>{q ? fmtNum(q.last, inst.decimals) : "…"}</span>
        <span className={cn("tabular text-xs", tone)}>
          {q && (
            <>
              <span aria-hidden className="mr-0.5 text-[9px]">{arrow(q.change)}</span>
              {fmtSigned(q.change, inst.decimals)} ({fmtPct(q.changePct)})
            </>
          )}
        </span>
        <span className="text-[10.5px] text-ink-3">{inst.unit}</span>
        <div className="ml-auto flex gap-0.5">
          {ranges.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn("caps rounded-[var(--radius)] px-1.5 py-0.5", r === range ? "bg-bg-3 text-accent" : "text-ink-3 hover:text-ink")}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 px-1 pb-1">
        {error ? (
          <Empty>Series unavailable: {error}</Empty>
        ) : series ? (
          <LineChart points={series.points} decimals={inst.decimals} unit={inst.unit} />
        ) : (
          <Empty>Loading…</Empty>
        )}
      </div>
      <div className="flex justify-between px-3 pb-1.5 font-data text-[10px] text-ink-3">
        <span>{inst.name}</span>
        <span>{inst.source}</span>
      </div>
    </div>
  );
}

function ChartPanel({ props }: { props: Props }) {
  return <ChartBlock key={props.symbol} symbol={props.symbol} initialRange={props.range} />;
}

export const chartDefinition: PanelDefinition<Props> = {
  meta: panelMetaMap.get("chart")!,
  schema,
  fields: [
    { key: "symbol", label: "Instrument", kind: "select", options: instruments.map((i) => ({ value: i.symbol, label: `${i.symbol} — ${i.name}` })) },
    { key: "range", label: "Range", kind: "select", options: ranges.map((r) => ({ value: r, label: r })) },
  ],
  component: ChartPanel,
  defaultTitle: (p) => `${p.symbol} · ${getInstrument(p.symbol)?.name ?? ""}`,
  href: (p) => `/markets/${p.symbol}`,
};
