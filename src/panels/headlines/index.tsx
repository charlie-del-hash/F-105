"use client";
import Link from "next/link";
import { z } from "zod";
import { desk as deskOf, type DeskId } from "@/config/site";
import { fmtDate } from "@/data/format";
import { useWorkspaceData } from "@/layout-engine/data-context";
import { Kicker } from "@/components/data/Kicker";
import { Empty } from "@/components/ui/Tag";
import { panelMetaMap } from "../catalog";
import type { PanelDefinition } from "../types";

const schema = z.object({
  desk: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(8),
});
type Props = z.infer<typeof schema>;

function HeadlinesPanel({ props }: { props: Props }) {
  const { docs } = useWorkspaceData();
  const items = (props.desk ? docs.filter((d) => d.desk === props.desk) : docs).slice(0, props.limit);
  if (!items.length) return <Empty>Nothing filed yet.</Empty>;
  return (
    <ol className="divide-y divide-line">
      {items.map((d, i) => (
        <li key={d.slug} className="row">
          <Link href={d.href} className="block px-3 py-2.5">
            <Kicker items={[deskOf(d.desk as DeskId)?.short, d.kind, d.designation]} right={fmtDate(d.date)} />
            <div className={i === 0 ? "mt-1 font-ui text-base font-semibold leading-snug text-ink" : "mt-1 font-ui text-item font-medium leading-snug text-ink"}>{d.title}</div>
            <div className="mt-0.5 line-clamp-2 font-ui text-meta leading-snug text-ink-2">{d.dek}</div>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export const headlinesDefinition: PanelDefinition<Props> = {
  meta: panelMetaMap.get("headlines")!,
  schema,
  fields: [
    { key: "desk", label: "Desk", kind: "desk" },
    { key: "limit", label: "Items", kind: "number" },
  ],
  component: HeadlinesPanel,
  defaultTitle: (p) => (p.desk ? `Headlines · ${p.desk.toUpperCase()}` : "Headlines"),
  href: (p) => (p.desk ? `/desk/${p.desk}` : "/wire"),
};
