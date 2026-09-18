"use client";
import Link from "next/link";
import { z } from "zod";
import { fmtDate } from "@/data/format";
import { useWorkspaceData } from "@/layout-engine/data-context";
import { DeskTag, Empty, Tag } from "@/components/ui/Tag";
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
      {items.map((d) => (
        <li key={d.slug} className="hover:bg-bg-3">
          <Link href={d.href} className="block px-3 py-2">
            <div className="flex items-center gap-1.5 font-data text-[10.5px] text-ink-3">
              <DeskTag desk={d.desk} />
              <Tag tone={d.kind === "dossier" ? "accent" : "neutral"}>{d.kind}</Tag>
              <span className="ml-auto tabular">{fmtDate(d.date)}</span>
            </div>
            <div className="mt-1 font-ui text-[13px] font-medium leading-snug text-ink">{d.title}</div>
            <div className="mt-0.5 line-clamp-2 font-ui text-[11.5px] leading-snug text-ink-2">{d.dek}</div>
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
