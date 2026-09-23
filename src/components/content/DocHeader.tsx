import Link from "next/link";
import { site } from "@/config/site";
import { fmtDate } from "@/data/format";
import { ShareSheet } from "@/components/shell/ShareSheet";
import { Kicker } from "@/components/data/Kicker";
import { ReadingControls } from "@/components/reading/ReadingControls";
import type { Doc } from "@/content/schema";

export function DocHeader({ doc, extra }: { doc: Doc; extra?: React.ReactNode }) {
  const desk = site.desks.find((d) => d.id === doc.data.desk);
  return (
    <header className="mb-8">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <Kicker
          wrap
          items={[desk?.name, doc.kind, doc.readingTime ? `${doc.readingTime} min` : undefined]}
          status={doc.data.placeholder ? { label: "demo content · verify before use", tone: "warn" } : undefined}
        />
        {extra}
        <span className="ml-auto flex items-center gap-2 font-data text-[11px] text-ink-3">
          <span className="tabular">{fmtDate(doc.data.date, "long")}</span>
          <ShareSheet title={doc.data.title} text={doc.data.dek} path={doc.href} size="sm" />
        </span>
      </div>
      <h1 className="mt-4 font-ui text-3xl font-semibold leading-[1.08] tracking-[-0.01em] text-ink md:text-[2.6rem]">{doc.data.title}</h1>
      <p className="mt-4 max-w-2xl font-read text-lg leading-snug text-ink-2">{doc.data.dek}</p>
      {/* The reading controls sit under the byline, not above the headline. On a
          phone they used to push the piece a whole control-row down the screen,
          and nobody sets their type size before they have seen what they are
          reading. */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-3 border-t border-line pt-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2 font-ui text-xs text-ink-3">
          <span>{doc.data.byline}</span>
          {/* The byline usually names the desk already; only add the link when it does not. */}
          {desk && !doc.data.byline.toLowerCase().includes(desk.name.toLowerCase()) && (
            <>
              <span aria-hidden>·</span>
              <Link href={`/desk/${desk.id}`} className="hover:text-accent">{desk.name} desk →</Link>
            </>
          )}
        </div>
        <ReadingControls className="ml-auto" />
      </div>
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
        <p className="mb-6 font-data text-[11px] uppercase tracking-[0.12em] text-ink-3">{doc.data.tags.join(" · ")}</p>
      )}
      {related.length > 0 && (
        <section>
          <h2 className="caps mb-2 text-ink-3">Related</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {related.map((r) => (
              <li key={r.slug} className="bezel row">
                <Link href={r.href} className="block p-3">
                  <Kicker items={[r.kind, r.data.desk]} />
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
