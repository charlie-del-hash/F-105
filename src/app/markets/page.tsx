import type { Metadata } from "next";
import { groupNames, instruments, type InstrumentGroup } from "@/data/instruments";
import { QuoteTable } from "@/panels/quotes";
import { StatTiles } from "@/panels/indicators";

export const metadata: Metadata = { title: "Markets" };

export default function MarketsPage() {
  const groups = (Object.keys(groupNames) as InstrumentGroup[]).filter((g) => g !== "indicator");
  const indicators = instruments.filter((i) => i.group === "indicator").map((i) => i.symbol);
  return (
    <div className="mx-auto max-w-[1800px] px-3 py-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h1 className="caps text-ink-3">Markets</h1>
        <span className="font-data text-[11px] text-ink-3">All series synthetic · provider: mock</span>
      </div>
      <section className="bezel mb-3 h-36 overflow-hidden">
        <div className="caps border-b border-line px-3 py-1.5 text-ink-3">Indicators</div>
        <div className="h-[calc(100%-2rem)]"><StatTiles symbols={indicators} /></div>
      </section>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => (
          <section key={g} className="bezel overflow-hidden">
            <div className="caps border-b border-line px-3 py-1.5 text-ink-3">{groupNames[g]}</div>
            <QuoteTable symbols={instruments.filter((i) => i.group === g).map((i) => i.symbol)} />
          </section>
        ))}
      </div>
    </div>
  );
}
