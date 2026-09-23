"use client";
import Link from "next/link";
import { z } from "zod";
import { fmtDate } from "@/data/format";
import { useWorkspaceData } from "@/layout-engine/data-context";
import { Empty } from "@/components/ui/Tag";
import { Kicker } from "@/components/data/Kicker";
import { desk as deskOf, type DeskId } from "@/config/site";
import { panelMetaMap } from "../catalog";
import type { PanelDefinition } from "../types";

const schema = z.object({
  /** A slug, or "featured" to follow whatever is marked featured. */
  slug: z.string().default("featured"),
});
type Props = z.infer<typeof schema>;

function ReaderPanel({ props }: { props: Props }) {
  const { docs, bodies, bottomLines } = useWorkspaceData();
  const readable = docs.filter((d) => d.kind !== "dossier");
  const doc = props.slug === "featured" ? readable.find((d) => d.featured) ?? readable[0] : docs.find((d) => d.slug === props.slug);
  if (!doc) return <Empty>No piece with slug “{props.slug}”.</Empty>;
  const body = bodies[doc.slug];
  return (
    <article className="px-4 py-3">
      <Kicker items={[deskOf(doc.desk as DeskId)?.short, doc.kind, `${doc.readingTime} min`]} right={fmtDate(doc.date, "long")} />
      <h2 className="mt-2 font-ui text-lg font-semibold leading-tight text-ink">
        <Link href={doc.href}>{doc.title}</Link>
      </h2>
      <p className="mt-1 font-read text-lg leading-snug text-ink-2">{doc.dek}</p>
      {bottomLines[doc.slug] && (
        <div className="mt-3 border-l-2 border-accent bg-bg-3 px-3 py-2 font-ui text-sm">
          <div className="caps text-ink-3">Bottom line</div>
          <div className="text-ink">{bottomLines[doc.slug]}</div>
        </div>
      )}
      <div className="prose-read mt-4 text-lg leading-[1.6]">{body ?? <Link href={doc.href} className="text-accent">Open the full piece →</Link>}</div>
    </article>
  );
}

export const readerDefinition: PanelDefinition<Props> = {
  meta: panelMetaMap.get("reader")!,
  schema,
  fields: [{ key: "slug", label: "Piece", kind: "slug", hint: "“featured” follows the featured story" }],
  component: ReaderPanel,
  defaultTitle: (p) => (p.slug === "featured" ? "Reader · featured" : `Reader · ${p.slug}`),
  href: (p) => (p.slug === "featured" ? undefined : `/read/${p.slug}`),
};
