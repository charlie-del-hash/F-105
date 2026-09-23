"use client";
import Link from "next/link";
import { z } from "zod";
import { desk as deskOf, type DeskId } from "@/config/site";
import { fmtTime } from "@/data/format";
import { useWorkspaceData } from "@/layout-engine/data-context";
import { cn } from "@/lib/cn";
import { Kicker } from "@/components/data/Kicker";
import { Empty } from "@/components/ui/Tag";
import { panelMetaMap } from "../catalog";
import type { PanelDefinition } from "../types";

const schema = z.object({
  desk: z.string().optional(),
  limit: z.number().int().min(3).max(200).default(40),
});
type Props = z.infer<typeof schema>;

export const priorityStatus = {
  flash: { label: "Flash", tone: "alert" as const },
  urgent: { label: "Urgent", tone: "warn" as const },
  routine: undefined,
};

function WirePanel({ props }: { props: Props }) {
  const { wire } = useWorkspaceData();
  const items = (props.desk ? wire.filter((w) => w.desk === props.desk) : wire).slice(0, props.limit);
  if (!items.length) return <Empty>No wire items yet.</Empty>;
  return (
    <ol className="divide-y divide-line font-ui text-item leading-snug">
      {items.map((w) => {
        const body = (
          <>
            <Kicker items={[`${fmtTime(w.ts)}Z`, deskOf(w.desk as DeskId)?.short]} status={priorityStatus[w.priority]} right={w.source && <span className="normal-case text-ink-3/80">{w.source}</span>} />
            <div className={cn("mt-1 text-ink", w.priority === "flash" && "font-semibold")}>
              {w.priority === "flash" && <span className="led led-alert mr-1.5 -mt-px" aria-hidden />}
              {w.text}
            </div>
          </>
        );
        return (
          <li key={w.id} className="row px-3 py-2">
            {w.href ? <Link href={w.href} className="block">{body}</Link> : body}
          </li>
        );
      })}
    </ol>
  );
}

export const wireDefinition: PanelDefinition<Props> = {
  meta: panelMetaMap.get("wire")!,
  schema,
  fields: [
    { key: "desk", label: "Desk", kind: "desk", hint: "Leave empty for every desk" },
    { key: "limit", label: "Items", kind: "number" },
  ],
  component: WirePanel,
  defaultTitle: (p) => (p.desk ? `Wire · ${p.desk.toUpperCase()}` : "Wire"),
  href: () => "/wire",
};
