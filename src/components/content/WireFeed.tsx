"use client";
import { useState } from "react";
import Link from "next/link";
import { site, type DeskId, desk as deskOf } from "@/config/site";
import { fmtDate, fmtTime } from "@/data/format";
import { cn } from "@/lib/cn";
import { Kicker } from "@/components/data/Kicker";
import { priorityStatus } from "@/panels/wire";
import type { WireData } from "@/layout-engine/data-context";

export function WireFeed({ items }: { items: WireData[] }) {
  const [desk, setDesk] = useState<string>("");
  const shown = desk ? items.filter((i) => i.desk === desk) : items;
  return (
    <div>
      <div className="seg mb-3" role="group" aria-label="Desk">
        <button type="button" aria-pressed={!desk} onClick={() => setDesk("")}>All</button>
        {site.desks.map((d) => (
          <button key={d.id} type="button" aria-pressed={desk === d.id} onClick={() => setDesk(d.id)}>{d.name}</button>
        ))}
      </div>
      <ol className="bezel divide-y divide-line">
        {shown.map((w) => {
          const headline = <div className={cn("font-ui text-sm text-ink", w.priority === "flash" && "font-semibold")}>{w.text}</div>;
          return (
            <li key={w.id} className="row grid gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[120px_minmax(0,1fr)]">
              <div className="font-data text-meta leading-tight">
                <div className="tabular text-ink-2">{fmtDate(w.ts)} {fmtTime(w.ts)}Z</div>
                <Kicker className="mt-0.5" items={[deskOf(w.desk as DeskId)?.short]} status={priorityStatus[w.priority]} />
              </div>
              <div>
                {w.href ? <Link href={w.href} className="block hover:text-accent">{headline}</Link> : headline}
                <div className="mt-0.5 flex flex-wrap gap-x-3 font-data text-xs text-ink-3">
                  {w.source && <span>{w.source}</span>}
                  {w.instruments.map((s) => (
                    <Link key={s} href={`/markets/${s}`} className="hover:text-accent">{s}</Link>
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
