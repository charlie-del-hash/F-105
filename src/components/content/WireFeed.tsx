"use client";
import { useState } from "react";
import Link from "next/link";
import { site } from "@/config/site";
import { fmtDate, fmtTime } from "@/data/format";
import { cn } from "@/lib/cn";
import { DeskTag } from "@/components/ui/Tag";
import type { WireData } from "@/layout-engine/data-context";

export function WireFeed({ items }: { items: WireData[] }) {
  const [desk, setDesk] = useState<string>("");
  const shown = desk ? items.filter((i) => i.desk === desk) : items;
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1">
        <button type="button" onClick={() => setDesk("")} className={cn("caps rounded-[var(--radius)] border px-2 py-1", !desk ? "border-accent text-accent" : "border-line text-ink-3")}>All</button>
        {site.desks.map((d) => (
          <button key={d.id} type="button" onClick={() => setDesk(d.id)} className={cn("caps rounded-[var(--radius)] border px-2 py-1", desk === d.id ? "border-accent text-accent" : "border-line text-ink-3")}>{d.name}</button>
        ))}
      </div>
      <ol className="bezel divide-y divide-line">
        {shown.map((w) => {
          const headline = <div className={cn("font-ui text-sm text-ink", w.priority === "flash" && "font-semibold")}>{w.text}</div>;
          return (
            <li key={w.id} className="grid gap-x-4 gap-y-1 px-4 py-3 hover:bg-bg-3 sm:grid-cols-[110px_minmax(0,1fr)]">
              <div className="font-data text-[11px] text-ink-3">
                <div className="tabular text-ink-2">{fmtDate(w.ts)} {fmtTime(w.ts)}Z</div>
                <div className="mt-0.5 flex items-center gap-1.5"><DeskTag desk={w.desk} />{w.priority !== "routine" && <span className={cn("caps", w.priority === "flash" ? "text-alert" : "text-warn")}>{w.priority}</span>}</div>
              </div>
              <div>
                {w.href ? <Link href={w.href} className="block hover:text-accent">{headline}</Link> : headline}
                <div className="mt-0.5 flex flex-wrap gap-x-3 font-data text-[10.5px] text-ink-3">
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
