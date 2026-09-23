import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { getDocs } from "@/content/loader";
import { fmtDate } from "@/data/format";
import { Kicker } from "@/components/data/Kicker";

export const metadata: Metadata = {
  title: "Read",
  description: "Everything filed across the desks: articles, briefs and dossiers.",
};

const deskShort = (id: string) => site.desks.find((d) => d.id === id)?.short ?? id.toUpperCase();

export default async function ReadIndex() {
  const docs = await getDocs();
  // The first item is bigger: the featured piece leads, the rest settle into a list.
  const lead = docs.find((d) => d.data.featured) ?? docs[0];
  const rest = docs.filter((d) => d.slug !== lead?.slug);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
      <h1 className="caps mb-1 text-ink-3">Read</h1>
      <p className="mb-6 max-w-2xl font-ui text-sm text-ink-2">
        Articles, briefs and dossiers across {site.desks.length} desks. Every piece opens on the
        reading surface — type size and the Paper theme are one tap from the header.
      </p>

      {lead && (
        <Link href={lead.href} className="row -mx-2 mb-8 block border-b border-line px-2 pb-6">
          <Kicker
            items={[deskShort(lead.data.desk), lead.kind, `${lead.readingTime} min`]}
            status={lead.data.placeholder ? { label: "demo content", tone: "warn" } : undefined}
            right={fmtDate(lead.data.date)}
          />
          <h2 className="mt-2 font-ui text-2xl font-semibold leading-[1.12] tracking-[-0.01em] text-ink md:text-3xl">
            {lead.data.title}
          </h2>
          <p className="mt-2 max-w-3xl font-read text-lg leading-snug text-ink-2">{lead.data.dek}</p>
        </Link>
      )}

      <ul className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        {rest.map((d) => (
          <li key={d.slug}>
            <Link href={d.href} className="row -mx-2 block rounded-[var(--radius)] px-2 py-2">
              <Kicker
                items={[deskShort(d.data.desk), d.kind, `${d.readingTime} min`]}
                status={d.data.placeholder ? { label: "demo content", tone: "warn" } : undefined}
                right={fmtDate(d.data.date)}
              />
              <h3 className="mt-1.5 font-ui text-base font-medium leading-snug text-ink">{d.data.title}</h3>
              <p className="mt-1 line-clamp-2 font-ui text-xs leading-relaxed text-ink-2">{d.data.dek}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
