import Link from "next/link";
import { site } from "@/config/site";
import { fmtDate } from "@/data/format";
import { ShareSheet } from "@/components/shell/ShareSheet";
import { Tag } from "@/components/ui/Tag";
import type { Doc } from "@/content/schema";

export function DocHeader({ doc, extra }: { doc: Doc; extra?: React.ReactNode }) {
  const desk = site.desks.find((d) => d.id === doc.data.desk);
  return (
    <header className="mb-8">
      <div className="flex flex-wrap items-center gap-1.5 font-data text-[11px] text-ink-3">
        {desk && (
          <Link href={`/desk/${desk.id}`}>
            <Tag tone="accent">{desk.name}</Tag>
          </Link>
        )}
        <Tag>{doc.kind}</Tag>
        {doc.data.placeholder && <Tag tone="warn">demo content · verify before use</Tag>}
        {extra}
        <span className="ml-auto flex items-center gap-2">
          <span className="tabular">{fmtDate(doc.data.date, "long")}</span>
          <span>· {doc.readingTime} min</span>
          <ShareSheet title={doc.data.title} text={doc.data.dek} path={doc.href} size="xs" />
        </span>
      </div>
      <h1 className="mt-4 font-ui text-3xl font-semibold leading-[1.1] tracking-tight text-ink md:text-4xl">{doc.data.title}</h1>
      <p className="mt-3 max-w-2xl font-read text-lg leading-snug text-ink-2">{doc.data.dek}</p>
      <div className="mt-3 font-ui text-xs text-ink-3">{doc.data.byline}</div>
    </header>
  );
}

export function DocFooter({ doc, related }: { doc: Doc; related: Doc[] }) {
  return (
    <footer className="mt-12 border-t border-line pt-6">
      {doc.data.sources.length > 0 && (
        <section className="mb-6">
          <h2 className="caps mb-2 text-ink-3">Sources & further reading</h2>
          <ul className="list-disc space-y-1 pl-5 font-ui text-sm text-ink-2">
            {doc.data.sources.map((s, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: s }} />
            ))}
          </ul>
        </section>
      )}
      {doc.data.tags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1">
          {doc.data.tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      )}
      {related.length > 0 && (
        <section>
          <h2 className="caps mb-2 text-ink-3">Related</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {related.map((r) => (
              <li key={r.slug} className="bezel p-3">
                <Link href={r.href}>
                  <div className="font-data text-[10.5px] text-ink-3">{r.kind} · {r.data.desk}</div>
                  <div className="mt-1 font-ui text-sm font-medium text-ink">{r.data.title}</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </footer>
  );
}
