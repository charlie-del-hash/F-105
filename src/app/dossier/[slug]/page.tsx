import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContent, getDocs, getDossier } from "@/content/loader";
import { renderMdx } from "@/content/mdx";
import { Timeline } from "@/components/ui/Timeline";
import { Tag } from "@/components/ui/Tag";
import { DocFooter, DocHeader } from "@/components/content/DocHeader";
import { ReadingProgress } from "@/components/reading/ReadingProgress";
import { ReadingSurface } from "@/components/reading/ReadingSurface";
import { DualUse, SpecSheet } from "@/panels/dossier";
import { QuoteTable } from "@/panels/quotes";
import { Card } from "@/components/ui/Card";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const c = await getContent();
  return c.dossiers.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getDossier(slug);
  return doc ? { title: `${doc.data.designation} — dossier`, description: doc.data.dek } : {};
}

export default async function DossierPage({ params }: Params) {
  const { slug } = await params;
  const doc = await getDossier(slug);
  if (!doc) notFound();
  const all = await getDocs();
  const related = all.filter((d) => d.slug !== doc.slug && (doc.data.related.includes(d.slug) || d.data.desk === doc.data.desk)).slice(0, 4);
  const d = doc.data;
  const tone = { active: "up", retired: "neutral", planned: "accent", contested: "alert", watch: "warn" } as const;

  return (
    <ReadingSurface className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-10 px-4 py-6 md:grid-cols-[minmax(0,1fr)_300px] md:px-6 md:py-8">
      <ReadingProgress />
      <article className="min-w-0">
        <DocHeader doc={doc} extra={<><Tag>{d.entity}</Tag><Tag tone={tone[d.status]}>{d.status}</Tag></>} />
        {d.dualUse && (
          <section className="mb-8">
            <h2 className="caps mb-2 text-ink-3">Dual-use reading</h2>
            <DualUse civil={d.dualUse.civil} military={d.dualUse.military} />
          </section>
        )}
        <div className="prose-read">{renderMdx(doc.body)}</div>
        {d.variants && (
          <section className="my-8 overflow-x-auto">
            <h2 className="caps mb-2 text-ink-3">Variants</h2>
            <table className="w-full border-collapse font-data text-xs">
              <thead>
                <tr className="caps text-ink-3">
                  {d.variants.columns.map((c) => (
                    <th key={c} className="border-b border-line-strong px-2 py-1.5 text-left font-medium">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.variants.rows.map((r, i) => (
                  <tr key={i} className="border-b border-line">
                    {r.map((cell, j) => (
                      <td key={j} className="px-2 py-1.5 text-ink">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
        {d.timeline && <Timeline title={d.timeline.title} items={d.timeline.items} />}
        <DocFooter doc={doc} related={related} />
      </article>
      <aside className="min-w-0 space-y-4 md:sticky md:top-14 md:self-start">
        <section className="bezel p-3">
          <div className="caps mb-2 text-ink-3">{d.designation} · spec sheet</div>
          <SpecSheet specs={d.specs} />
        </section>
        {d.instruments.length > 0 && (
          <Card slug="QB" title="Related instruments">
            <QuoteTable symbols={d.instruments} compact />
          </Card>
        )}
      </aside>
    </ReadingSurface>
  );
}
