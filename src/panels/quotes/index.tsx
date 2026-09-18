"use client";
import Link from "next/link";
import { z } from "zod";
import { fmtNum } from "@/data/format";
import { getInstrument } from "@/data/instruments";
import { useQuotes } from "@/lib/useQuotes";
import { useSize } from "@/lib/useSize";
import { Sparkline } from "@/components/charts/Sparkline";
import { Change, toneOf } from "@/components/data/Change";
import { LiveDot } from "@/components/data/LiveDot";
import { Empty } from "@/components/ui/Tag";
import { panelMetaMap } from "../catalog";
import type { PanelDefinition } from "../types";

const schema = z.object({
  symbols: z.array(z.string()).min(1).default(["BRENT", "TTF", "TD3C"]),
  compact: z.boolean().default(false),
});
type Props = z.infer<typeof schema>;

export function QuoteTable({ symbols, compact: compactProp = false }: { symbols: string[]; compact?: boolean }) {
  const { quotes, error } = useQuotes(symbols);
  const [ref, size] = useSize<HTMLDivElement>();
  // Narrow containers (a phone, a 3-column panel) drop to the compact columns automatically.
  const compact = compactProp || (size.width > 0 && size.width < 400);
  if (error && Object.keys(quotes).length === 0) return <Empty>Quotes unavailable: {error}</Empty>;
  const loaded = symbols.map((s) => quotes[s]).filter(Boolean);
  const live = loaded.filter((q) => !q.synthetic);
  const sources = Array.from(new Set(live.map((q) => q.provider.toUpperCase())));
  return (
    <div ref={ref} className="flex h-full flex-col">
      <table className="w-full table-fixed border-collapse font-data text-xs">
        <colgroup>
          <col />
          <col style={{ width: compact ? 88 : 76 }} />
          <col style={{ width: compact ? 84 : 78 }} />
          {!compact && <col style={{ width: 70 }} />}
          {!compact && <col style={{ width: 94 }} />}
        </colgroup>
        <thead className="sticky top-0 z-[1] bg-bg-2">
          <tr className="caps text-ink-3">
            <th className="px-3 py-1.5 text-left font-medium">Sym</th>
            <th className="px-2 py-1.5 text-right font-medium">Last</th>
            <th className="px-2 py-1.5 text-right font-medium">Chg</th>
            {!compact && <th className="px-2 py-1.5 text-right font-medium">%</th>}
            {!compact && <th className="px-3 py-1.5 text-right font-medium">30d</th>}
          </tr>
        </thead>
        <tbody className="tabular">
          {symbols.map((s) => {
            const q = quotes[s];
            const inst = getInstrument(s);
            const tone = toneOf(q?.change);
            return (
              <tr key={s} className="row border-t border-line">
                <td className="px-3 py-1.5">
                  <Link href={`/markets/${s}`} className="flex items-center gap-2">
                    <LiveDot synthetic={q?.synthetic} provider={q?.provider} />
                    <span className="min-w-0">
                      <span className="block font-medium text-ink">{s}</span>
                      {!compact && <span className="block truncate font-ui text-[10.5px] text-ink-3">{inst?.name ?? "—"}</span>}
                    </span>
                  </Link>
                </td>
                <td className="px-2 py-1.5 text-right text-ink">{q ? fmtNum(q.last, inst?.decimals ?? 2) : <span className="text-ink-3">…</span>}</td>
                <td className="px-2 py-1.5 text-right">{q && <Change value={q.change} pct={q.changePct} decimals={inst?.decimals ?? 2} mode={compact ? "pct" : "abs"} />}</td>
                {!compact && <td className="px-2 py-1.5 text-right">{q && <Change value={q.change} pct={q.changePct} mode="pct" />}</td>}
                {!compact && <td className="px-3 py-1 text-right">{q && <Sparkline values={q.spark} tone={tone === "flat" ? "neutral" : tone} />}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
      {loaded.length > 0 && (
        <div className="mt-auto flex items-center gap-3 border-t border-line px-3 py-1.5 font-data text-[10px] text-ink-3">
          <span className="flex items-center gap-1.5"><span className="dot dot-live" /> observed{sources.length ? ` · ${sources.join(", ")}` : ""}</span>
          <span className="flex items-center gap-1.5"><span className="dot" /> synthetic</span>
          <span className="ml-auto tabular">{live.length}/{loaded.length} live</span>
        </div>
      )}
    </div>
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
