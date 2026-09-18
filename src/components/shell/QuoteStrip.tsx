"use client";
import Link from "next/link";
import { fmtNum } from "@/data/format";
import { getInstrument } from "@/data/instruments";
import { useQuotes } from "@/lib/useQuotes";
import { Change } from "@/components/data/Change";

const strip = ["BRENT", "TTF", "JKM", "TD3C", "BDI", "EURUSD"];

/** The masthead ticker: six symbols, hairline-separated, no marquee. */
export function QuoteStrip() {
  const { quotes } = useQuotes(strip);
  return (
    <div className="flex min-w-0 items-center divide-x divide-line overflow-hidden font-data text-[11px]">
      {strip.map((s) => {
        const q = quotes[s];
        const inst = getInstrument(s);
        return (
          <Link key={s} href={`/markets/${s}`} className="tabular flex shrink-0 items-baseline gap-1.5 px-3 first:pl-0 hover:text-accent">
            <span className="text-ink-3">{s}</span>
            <span className="text-ink">{q ? fmtNum(q.last, inst?.decimals ?? 2) : "…"}</span>
            {q && <Change value={q.change} pct={q.changePct} mode="pct" className="text-[10.5px]" />}
          </Link>
        );
      })}
    </div>
  );
}
