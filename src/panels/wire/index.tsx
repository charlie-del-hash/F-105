"use client";
import Link from "next/link";
import { z } from "zod";
import { fmtTime } from "@/data/format";
import { useWorkspaceData } from "@/layout-engine/data-context";
import { cn } from "@/lib/cn";
import { DeskTag, Empty } from "@/components/ui/Tag";
import { panelMetaMap } from "../catalog";
import type { PanelDefinition } from "../types";

const schema = z.object({
  desk: z.string().optional(),
  limit: z.number().int().min(3).max(200).default(40),
});
type Props = z.infer<typeof schema>;

function WirePanel({ props }: { props: Props }) {
  const { wire } = useWorkspaceData();
  const items = (props.desk ? wire.filter((w) => w.desk === props.desk) : wire).slice(0, props.limit);
  if (!items.length) return <Empty>No wire items yet.</Empty>;
  return (
    <ol className="divide-y divide-line font-ui text-[12.5px] leading-snug">
      {items.map((w) => {
        const body = (
          <>
            <div className="flex items-center gap-2 font-data text-[10.5px] text-ink-3">
              <span className="tabular">{fmtTime(w.ts)}Z</span>
              <DeskTag desk={w.desk} />
              {w.priority !== "routine" && (
                <span className={cn("caps", w.priority === "flash" ? "text-alert" : "text-warn")}>
                  <span className={cn("led mr-1", w.priority === "flash" ? "led-alert" : "led-warn")} aria-hidden />
                  {w.priority}
                </span>
              )}
            </div>
            <div className={cn("mt-0.5 text-ink", w.priority === "flash" && "font-semibold")}>{w.text}</div>
            {w.source && <div className="mt-0.5 text-[10.5px] text-ink-3">{w.source}</div>}
          </>
        );
        return (
          <li key={w.id} className="px-3 py-2 hover:bg-bg-3">
            {w.href ? <Link href={w.href}>{body}</Link> : body}
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
