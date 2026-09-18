"use client";
import Link from "next/link";
import { z } from "zod";
import { arrow, fmtNum, fmtPct, fmtSigned } from "@/data/format";
import { getInstrument } from "@/data/instruments";
import { useQuotes } from "@/lib/useQuotes";
import { cn } from "@/lib/cn";
import { Sparkline } from "@/components/charts/Sparkline";
import { Empty } from "@/components/ui/Tag";
import { panelMetaMap } from "../catalog";
import type { PanelDefinition } from "../types";

const schema = z.object({
  symbols: z.array(z.string()).min(1).default(["BRENT", "TTF", "TD3C"]),
  compact: z.boolean().default(false),
});
type Props = z.infer<typeof schema>;

export function QuoteTable({ symbols, compact = false }: { symbols: string[]; compact?: boolean }) {
  const { quotes, error } = useQuotes(symbols);
  if (error) return <Empty>Quotes unavailable: {error}</Empty>;
  return (
    <table className="w-full border-collapse font-data text-xs">
      <thead className="sticky top-0 bg-bg-2">
        <tr className="caps text-ink-3">
          <th className="px-3 py-1.5 text-left font-medium">Sym</th>
          <th className="px-2 py-1.5 text-right font-medium">Last</th>
          <th className="px-2 py-1.5 text-right font-medium">Chg</th>
          {!compact && <th className="px-2 py-1.5 text-right font-medium">%</th>}
          {!compact && <th className="px-2 py-1.5 text-right font-medium">30d</th>}
        </tr>
      </thead>
      <tbody className="tabular">
        {symbols.map((s) => {
          const q = quotes[s];
          const inst = getInstrument(s);
          const dir = q ? (q.change > 0 ? "up" : q.change < 0 ? "down" : "neutral") : "neutral";
          const tone = dir === "up" ? "text-up" : dir === "down" ? "text-down" : "text-ink-2";
          return (
            <tr key={s} className="border-t border-line hover:bg-bg-3">
              <td className="px-3 py-1.5">
                <Link href={`/markets/${s}`} className="block">
                  <div className="font-medium text-ink">{s}</div>
                  {!compact && <div className="truncate font-ui text-[10.5px] text-ink-3">{inst?.name ?? "—"}</div>}
                </Link>
              </td>
              <td className="px-2 py-1.5 text-right text-ink">{q ? fmtNum(q.last, inst?.decimals ?? 2) : "…"}</td>
              <td className={cn("px-2 py-1.5 text-right whitespace-nowrap", tone)}>
                {q ? (
                  <>
                    <span aria-hidden className="mr-0.5 text-[9px]">{arrow(q.change)}</span>
                    {compact ? fmtPct(q.changePct) : fmtSigned(q.change, inst?.decimals ?? 2)}
                  </>
                ) : ""}
              </td>
              {!compact && <td className={cn("px-2 py-1.5 text-right", tone)}>{q ? fmtPct(q.changePct) : ""}</td>}
              {!compact && (
                <td className="px-2 py-1 text-right">{q && <Sparkline values={q.spark} tone={dir} />}</td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function QuotesPanel({ props }: { props: Props }) {
  return <QuoteTable symbols={props.symbols} compact={props.compact} />;
}

export const quotesDefinition: PanelDefinition<Props> = {
  meta: panelMetaMap.get("quotes")!,
  schema,
  fields: [
    { key: "symbols", label: "Instruments", kind: "symbols" },
    { key: "compact", label: "Compact", kind: "boolean", hint: "Hide names, % and sparkline" },
  ],
  component: QuotesPanel,
  defaultTitle: () => "Quote board",
  href: () => "/markets",
};
