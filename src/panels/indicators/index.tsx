"use client";
import Link from "next/link";
import { z } from "zod";
import { fmtNum } from "@/data/format";
import { getInstrument } from "@/data/instruments";
import { useQuotes } from "@/lib/useQuotes";
import { Sparkline } from "@/components/charts/Sparkline";
import { Change } from "@/components/data/Change";
import { LiveDot } from "@/components/data/LiveDot";
import { panelMetaMap } from "../catalog";
import type { PanelDefinition } from "../types";

const schema = z.object({ symbols: z.array(z.string()).min(1).default(["HORMUZ.TX", "BAB.TX", "WAR.RS"]) });
type Props = z.infer<typeof schema>;

/** Stat tiles: label · value · change over five sessions · 30-day trend. */
export function StatTiles({ symbols }: { symbols: string[] }) {
  const { quotes } = useQuotes(symbols);
  return (
    <div className="grid h-full auto-rows-fr gap-2 px-2 py-2" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${symbols.length > 3 ? 120 : 150}px, 1fr))` }}>
      {symbols.map((s) => {
        const q = quotes[s];
        const inst = getInstrument(s);
        const ref = q && q.spark.length > 5 ? q.spark[q.spark.length - 6] : undefined;
        const delta = q && ref ? q.last - ref : 0;
        const pct = ref ? (delta / ref) * 100 : 0;
        return (
          <Link key={s} href={`/markets/${s}`} className="inset flex min-w-0 flex-col justify-between px-3 py-2 hover:border-line-strong">
            <div className="flex items-center gap-1.5 font-ui text-meta text-ink-3">
              <LiveDot synthetic={q?.synthetic} provider={q?.provider} />
              <span className="truncate">{inst?.name ?? s}</span>
            </div>
            <div className="flex items-end justify-between gap-2">
              <div>
                <div className="font-data text-xl leading-none text-ink">
                  {q ? fmtNum(q.last, inst?.decimals ?? 0, { compact: true }) : "…"}
                  <span className="ml-1 text-xs text-ink-3">{inst?.unit}</span>
                </div>
                <div className="mt-1 font-data text-meta">
                  {q && ref !== undefined && (
                    <>
                      <Change value={delta} pct={pct} mode="pct" /> <span className="text-ink-3">5d</span>
                    </>
                  )}
                </div>
              </div>
              {q && <Sparkline values={q.spark} tone="neutral" width={56} height={18} />}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function IndicatorsPanel({ props }: { props: Props }) {
  return <StatTiles symbols={props.symbols} />;
}

export const indicatorsDefinition: PanelDefinition<Props> = {
  meta: panelMetaMap.get("indicators")!,
  schema,
  fields: [{ key: "symbols", label: "Series", kind: "symbols" }],
  component: IndicatorsPanel,
  defaultTitle: () => "Indicators",
};
