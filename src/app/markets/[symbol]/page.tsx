import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getInstrument, groupNames, instruments } from "@/data/instruments";
import { getDocs, getWire } from "@/content/loader";
import { fmtDate, fmtTime } from "@/data/format";
import { ChartBlock } from "@/panels/chart";
import { ShareSheet } from "@/components/shell/ShareSheet";
import { DeskTag, Tag } from "@/components/ui/Tag";

type Params = { params: Promise<{ symbol: string }> };

export function generateStaticParams() {
  return instruments.map((i) => ({ symbol: i.symbol }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { symbol } = await params;
  const inst = getInstrument(symbol);
  return inst ? { title: `${inst.symbol} · ${inst.name}` } : {};
}

export default async function InstrumentPage({ params }: Params) {
  const { symbol } = await params;
  const inst = getInstrument(symbol);
  if (!inst) notFound();
  const docs = (await getDocs()).filter((d) => d.data.instruments.includes(inst.symbol));
  const wire = (await getWire({ limit: 200 })).filter((w) => w.instruments.includes(inst.symbol)).slice(0, 8);
  return (
    <div className="mx-auto max-w-[1400px] px-3 py-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h1 className="font-data text-xl text-ink">{inst.symbol}</h1>
        <span className="font-ui text-sm text-ink-2">{inst.name}</span>
        <Tag>{groupNames[inst.group]}</Tag>
        {inst.desks.map((d) => (
          <Link key={d} href={`/desk/${d}`}><DeskTag desk={d} /></Link>
        ))}
        <span className="ml-auto"><ShareSheet title={`${inst.symbol} · ${inst.name}`} path={`/markets/${inst.symbol}`} /></span>
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="bezel h-[440px] overflow-hidden">
          <ChartBlock symbol={inst.symbol} initialRange="6m" tall />
        </section>
        <div className="space-y-3">
          <section className="bezel p-3">
            <div className="caps mb-2 text-ink-3">About this series</div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-ui text-xs">
              <dt className="text-ink-3">Describes</dt><dd className="text-ink">{inst.desc}</dd>
              <dt className="text-ink-3">Unit</dt><dd className="font-data text-ink">{inst.unit || "ratio"}</dd>
              <dt className="text-ink-3">Source</dt><dd className="text-ink">{inst.source}</dd>
              <dt className="text-ink-3">Cadence</dt><dd className="text-ink">Daily close; demo tick each minute</dd>
            </dl>
          </section>
          {docs.length > 0 && (
            <section className="bezel p-3">
              <div className="caps mb-2 text-ink-3">Coverage</div>
              <ul className="space-y-2">
                {docs.map((d) => (
                  <li key={d.slug}>
                    <Link href={d.href} className="block hover:text-accent">
                      <div className="font-data text-[10.5px] text-ink-3">{d.kind} · {fmtDate(d.data.date)}</div>
                      <div className="font-ui text-sm text-ink">{d.data.title}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {wire.length > 0 && (
            <section className="bezel p-3">
              <div className="caps mb-2 text-ink-3">On the wire</div>
              <ul className="space-y-2 font-ui text-xs">
                {wire.map((w) => (
                  <li key={w.id}>
                    <span className="tabular font-data text-[10.5px] text-ink-3">{fmtDate(w.ts)} {fmtTime(w.ts)}Z</span>
                    <div className="text-ink">{w.text}</div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
