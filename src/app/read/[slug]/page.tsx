import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContent, getDocs, getReadable } from "@/content/loader";
import { renderMdx } from "@/content/mdx";
import { Timeline } from "@/components/ui/Timeline";
import { Tag } from "@/components/ui/Tag";
import { DocFooter, DocHeader } from "@/components/content/DocHeader";
import { ReadingProgress } from "@/components/reading/ReadingProgress";
import { ReadingSurface } from "@/components/reading/ReadingSurface";
import { QuoteTable } from "@/panels/quotes";
import { Card } from "@/components/ui/Card";
import type { Article, Brief } from "@/content/schema";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const c = await getContent();
  return [...c.articles, ...c.briefs].map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getReadable(slug);
  return doc ? { title: doc.data.title, description: doc.data.dek } : {};
}

export default async function ReadPage({ params }: Params) {
  const { slug } = await params;
  const doc = await getReadable(slug);
  if (!doc) notFound();
  const all = await getDocs();
  const related = all.filter((d) => d.slug !== doc.slug && (doc.data.related.includes(d.slug) || d.data.desk === doc.data.desk)).slice(0, 4);
  const brief = doc.kind === "brief" ? (doc.data as Brief) : null;
  const stanceTone = { bullish: "up", bearish: "down", neutral: "neutral", watch: "warn" } as const;
  const timeline = doc.kind === "article" ? (doc.data as Article).timeline : undefined;

  return (
    <ReadingSurface className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-10 px-4 py-6 md:grid-cols-[minmax(0,1fr)_260px] md:px-6 md:py-8">
      <ReadingProgress />
      <article className="min-w-0">
        <DocHeader doc={doc} extra={brief && <Tag tone={stanceTone[brief.stance]}>{brief.stance} · {brief.horizon}</Tag>} />
        {brief && (
          <div className="mb-8 border-l-2 border-accent bg-bg-3 px-4 py-3">
            <div className="caps text-ink-3">Bottom line</div>
            <p className="m-0 mt-1 font-ui text-base text-ink">{brief.bottomLine}</p>
          </div>
        )}
        <div className="prose-read">{renderMdx(doc.body)}</div>
        {timeline && <Timeline title={timeline.title} items={timeline.items} />}
        <DocFooter doc={doc} related={related} />
      </article>
      <aside className="min-w-0 space-y-4 md:sticky md:top-14 md:self-start">
        {doc.data.instruments.length > 0 && (
          <Card slug="QB" title="Instruments in this piece">
            <QuoteTable symbols={doc.data.instruments} compact />
          </Card>
        )}
        <section className="bezel p-3 font-ui text-xs text-ink-2">
          <div className="caps mb-1 text-ink-3">On the desk</div>
          <span className="kbd">⌘K</span> → <span className="font-data text-ink">READ {doc.slug}</span> adds this piece as a panel.
        </section>
      </aside>
    </ReadingSurface>
  );
}
