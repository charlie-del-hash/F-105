import type { Metadata } from "next";
import { groupNames, instruments, type InstrumentGroup } from "@/data/instruments";
import { QuoteTable } from "@/panels/quotes";
import { StatTiles } from "@/panels/indicators";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Markets" };

export default function MarketsPage() {
  const groups = (Object.keys(groupNames) as InstrumentGroup[]).filter((g) => g !== "indicator");
  const indicators = instruments.filter((i) => i.group === "indicator").map((i) => i.symbol);
  return (
    <div className="mx-auto max-w-[1800px] px-3 py-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h1 className="caps text-ink-3">Markets</h1>
        <span className="font-data text-[11px] text-ink-3">● observed · ◌ synthetic — provenance on every row</span>
      </div>
      <Card slug="IND" title="Indicators" className="mb-3 h-36">
        <StatTiles symbols={indicators} />
      </Card>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => (
          <Card key={g} slug="QB" title={groupNames[g]}>
            <QuoteTable symbols={instruments.filter((i) => i.group === g).map((i) => i.symbol)} />
          </Card>
        ))}
      </div>
    </div>
  );
}
