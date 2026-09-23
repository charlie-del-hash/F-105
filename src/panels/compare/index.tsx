"use client";
import { useState } from "react";
import { z } from "zod";
import { getInstrument } from "@/data/instruments";
import { ranges, type Range } from "@/data/types";
import { basisLabel, rebaseAll, type Basis } from "@/data/rebase";
import { useSeriesSet } from "@/lib/useQuotes";
import { MultiLineChart, MAX_SERIES } from "@/components/charts/MultiLineChart";
import { LiveDot } from "@/components/data/LiveDot";
import { Empty } from "@/components/ui/Tag";
import { RangePicker } from "../chart";
import { panelMetaMap } from "../catalog";
import type { PanelDefinition } from "../types";

const schema = z.object({
  /**
   * Three is the cap, and it is measured: no four-slot subset of any theme ring
   * clears the dataviz validator's normal-vision floor under `--pairs all`,
   * which is the binding test once a chart shows every slot at once. See
   * MultiLineChart for the numbers.
   */
  symbols: z.array(z.string()).min(2).max(MAX_SERIES).default(["BRENT", "TTF", "TD3C"]),
  range: z.enum(["1m", "3m", "6m", "1y"]).default("6m"),
  basis: z.enum(["rebase", "pct"]).default("rebase"),
});
type Props = z.infer<typeof schema>;

/**
 * Several instruments on one plot, indexed to a common base.
 *
 * The instruments here are quoted in $/bbl, €/MWh, Worldscale, $/day, points
 * and per-cent, so a raw comparison is meaningless and a second y-axis is the
 * one chart the house rules forbid outright. Indexing is the sanctioned answer:
 * one axis, one unit, and the question becomes relative movement, which is what
 * a comparison is for.
 */
export function CompareBlock({ symbols, initialRange = "6m", basis = "rebase" }: { symbols: string[]; initialRange?: Range; basis?: Basis }) {
  const [range, setRange] = useState<Range>(initialRange);
  const list = symbols.slice(0, MAX_SERIES);
  const { series, errors } = useSeriesSet(list, range);
  const rebased = rebaseAll(series, basis);

  const unknown = list.filter((s) => !getInstrument(s));
  if (unknown.length === list.length) return <Empty>No known instrument in {list.join(", ")}</Empty>;

  // Provenance degrades to the weakest constituent: if any line is synthetic the
  // whole panel says synthetic, because a reader cannot tell which line is which
  // from one dot.
  const synthetic = rebased.some((s) => s.synthetic);
  const providers = [...new Set(rebased.map((s) => s.provider))];
  const failed = Object.keys(errors);

  return (
    <div className="flex h-full flex-col">
      {/* The range picker rides the chart's own legend row: a comparison panel
          is often five grid columns wide, and a third row of chrome above the
          plot left it too short to read. The basis goes in the footer with the
          provenance, where the reader looks to ask what they are seeing. */}
      <div className="min-h-0 flex-1 pt-2">
        {rebased.length === 0 ? (
          <Empty>{series.length ? "Nothing indexable in this window" : "Loading…"}</Empty>
        ) : (
          <MultiLineChart series={rebased} basis={basis} actions={<RangePicker value={range} onChange={setRange} />} />
        )}
      </div>
      <div className="flex items-center gap-2 px-3 pb-1.5 font-data text-xs text-ink-3">
        <LiveDot synthetic={synthetic} provider={providers[0]} />
        <span className="truncate">
          {rebased.length === 0
            ? "no series"
            : synthetic
              ? "synthetic demo series"
              : `${providers.map((p) => p.toUpperCase()).join(" · ")} · observed`}
        </span>
        {failed.length > 0 && <span className="shrink-0 text-warn">{failed.join(", ")} unavailable</span>}
        <span className="ml-auto shrink-0 uppercase tracking-[0.12em]">{basisLabel[basis]}</span>
      </div>
    </div>
  );
}

function ComparePanel({ props }: { props: Props }) {
  return <CompareBlock key={props.symbols.join(",")} symbols={props.symbols} initialRange={props.range} basis={props.basis} />;
}

export const compareDefinition: PanelDefinition<Props> = {
  meta: panelMetaMap.get("compare")!,
  schema,
  fields: [
    { key: "symbols", label: "Instruments", kind: "symbols", hint: `Two to ${MAX_SERIES}; each is indexed to its own first point` },
    { key: "range", label: "Range", kind: "select", options: ranges.map((r) => ({ value: r, label: r })) },
    {
      key: "basis",
      label: "Basis",
      kind: "select",
      options: [
        { value: "rebase", label: "Index (start = 100)" },
        { value: "pct", label: "% change from start" },
      ],
    },
  ],
  component: ComparePanel,
  defaultTitle: (p) => p.symbols.slice(0, MAX_SERIES).join(" · "),
};
