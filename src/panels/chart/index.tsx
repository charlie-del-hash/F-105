"use client";
import { useState } from "react";
import { z } from "zod";
import { fmtDate } from "@/data/format";
import { getInstrument, instruments } from "@/data/instruments";
import { ranges, type Range } from "@/data/types";
import { useQuotes, useSeries } from "@/lib/useQuotes";
import { LineChart } from "@/components/charts/LineChart";
import { Change, Price } from "@/components/data/Change";
import { LiveDot } from "@/components/data/LiveDot";
import { Empty } from "@/components/ui/Tag";
import { panelMetaMap } from "../catalog";
import type { PanelDefinition } from "../types";

const schema = z.object({
  symbol: z.string().default("BRENT"),
  range: z.enum(["1m", "3m", "6m", "1y"]).default("3m"),
});
type Props = z.infer<typeof schema>;

export function RangePicker({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <div className="seg" role="group" aria-label="Range">
      {ranges.map((r) => (
        <button key={r} type="button" aria-pressed={r === value} onClick={() => onChange(r)}>
          {r}
        </button>
      ))}
    </div>
  );
}

/** Reusable chart block: price strip, range picker, chart, provenance line. */
export function ChartBlock({ symbol, initialRange = "3m", tall = false }: { symbol: string; initialRange?: Range; tall?: boolean }) {
  const [range, setRange] = useState<Range>(initialRange);
  const inst = getInstrument(symbol);
  const { series, error } = useSeries(symbol, range);
  const { quotes } = useQuotes([symbol]);
  const q = quotes[symbol];
  if (!inst) return <Empty>Unknown instrument {symbol}</Empty>;
  const lastPoint = series?.points[series.points.length - 1];
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3 pt-2">
        <Price value={q?.last} decimals={inst.decimals} unit={inst.unit} size={tall ? "xl" : "lg"} />
        {q && <Change value={q.change} pct={q.changePct} decimals={inst.decimals} mode="both" className="text-xs" />}
        <span className="ml-auto">
          <RangePicker value={range} onChange={setRange} />
        </span>
      </div>
      <div className="min-h-0 flex-1 px-1 pb-1">
        {error ? <Empty>Series unavailable: {error}</Empty> : series ? <LineChart points={series.points} decimals={inst.decimals} unit={inst.unit} lastValue={q?.last} /> : <Empty>Loading…</Empty>}
      </div>
      <div className="flex items-center gap-2 px-3 pb-1.5 font-data text-xs text-ink-3">
        <LiveDot synthetic={series?.synthetic} provider={series?.provider} />
        <span className="truncate">{series ? (series.synthetic ? "synthetic demo series" : `${series.provider.toUpperCase()} · observed`) : inst.source}</span>
        {lastPoint && <span className="ml-auto tabular shrink-0">as of {fmtDate(lastPoint.d, "long")}</span>}
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
