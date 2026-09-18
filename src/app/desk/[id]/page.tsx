import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site, type DeskId } from "@/config/site";
import { getDocs, getEvents, getWire } from "@/content/loader";
import { instruments } from "@/data/instruments";
import { fmtDate, fmtTime } from "@/data/format";
import { QuoteTable } from "@/panels/quotes";
import { Tag } from "@/components/ui/Tag";

type Params = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return site.desks.map((d) => ({ id: d.id }));
}
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const d = site.desks.find((x) => x.id === id);
  return d ? { title: `${d.name} desk`, description: d.blurb } : {};
}

export default async function DeskLanding({ params }: Params) {
  const { id } = await params;
  const desk = site.desks.find((x) => x.id === id);
  if (!desk) notFound();
  const docs = (await getDocs()).filter((d) => d.data.desk === desk.id);
  const wire = await getWire({ desk: desk.id, limit: 12 });
  const events = await getEvents({ desk: desk.id, limit: 8 });
  const syms = instruments.filter((i) => i.desks.includes(desk.id as DeskId)).map((i) => i.symbol);
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <div className="mb-6">
        <div className="caps text-ink-3">Desk</div>
        <h1 className="mt-1 font-ui text-3xl font-semibold tracking-tight text-ink">{desk.name}</h1>
        <p className="mt-1 max-w-2xl font-read text-lg text-ink-2">{desk.blurb}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <h2 className="caps mb-2 text-ink-3">Filed</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {docs.map((d) => (
              <li key={d.slug} className="bezel p-4">
                <Link href={d.href}>
                  <div className="flex items-center gap-1.5 font-data text-[10.5px] text-ink-3"><Tag tone={d.kind === "dossier" ? "accent" : "neutral"}>{d.kind}</Tag><span className="ml-auto">{fmtDate(d.data.date)}</span></div>
                  <div className="mt-2 font-ui text-base font-medium leading-snug text-ink">{d.data.title}</div>
                  <div className="mt-1 line-clamp-3 font-ui text-xs text-ink-2">{d.data.dek}</div>
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="caps mb-2 mt-8 text-ink-3">Wire</h2>
          <ol className="bezel divide-y divide-line">
            {wire.map((w) => (
              <li key={w.id} className="px-3 py-2 font-ui text-sm text-ink">
                <span className="tabular mr-2 font-data text-[10.5px] text-ink-3">{fmtDate(w.ts)} {fmtTime(w.ts)}Z</span>{w.text}
              </li>
            ))}
          </ol>
        </section>
        <aside className="space-y-4">
          {syms.length > 0 && (
            <section className="bezel overflow-hidden">
              <div className="caps border-b border-line px-3 py-1.5 text-ink-3">Instruments</div>
              <QuoteTable symbols={syms} compact />
            </section>
          )}
          {events.length > 0 && (
            <section className="bezel p-3">
              <div className="caps mb-2 text-ink-3">Coming up</div>
              <ul className="space-y-2 font-ui text-xs">
                {events.map((e) => (
                  <li key={e.id}><span className="tabular font-data text-ink-3">{fmtDate(e.date)}</span> <span className="text-ink">{e.title}</span></li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
