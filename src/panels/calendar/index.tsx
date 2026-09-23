"use client";
import { z } from "zod";
import { desk as deskOf, type DeskId } from "@/config/site";
import { fmtDate } from "@/data/format";
import { useWorkspaceData } from "@/layout-engine/data-context";
import { cn } from "@/lib/cn";
import { Kicker } from "@/components/data/Kicker";
import { Empty } from "@/components/ui/Tag";
import { panelMetaMap } from "../catalog";
import type { PanelDefinition } from "../types";

const schema = z.object({
  desk: z.string().optional(),
  limit: z.number().int().min(1).max(60).default(8),
});
type Props = z.infer<typeof schema>;

function CalendarPanel({ props }: { props: Props }) {
  const { events } = useWorkspaceData();
  const items = (props.desk ? events.filter((e) => e.desk === props.desk) : events).slice(0, props.limit);
  if (!items.length) return <Empty>Nothing scheduled.</Empty>;
  return (
    <ol className="divide-y divide-line">
      {items.map((e) => (
        <li key={e.id} className="row flex gap-3 px-3 py-2">
          <div className="w-[4.6rem] shrink-0 whitespace-nowrap font-data text-meta leading-tight">
            <div className="tabular text-ink">{fmtDate(e.date)}</div>
            <div className="text-ink-3">{e.time ? `${e.time} ${e.tz}` : "all day"}</div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className={cn("led", e.importance === "high" ? "led-alert" : e.importance === "medium" ? "led-warn" : "")} aria-hidden />
              <span className="truncate font-ui text-item font-medium text-ink">{e.title}</span>
            </div>
            <Kicker className="mt-0.5" items={[deskOf(e.desk as DeskId)?.short, e.note && <span className="normal-case tracking-normal">{e.note}</span>]} />
          </div>
        </li>
      ))}
    </ol>
  );
}

export const calendarDefinition: PanelDefinition<Props> = {
  meta: panelMetaMap.get("calendar")!,
  schema,
  fields: [
    { key: "desk", label: "Desk", kind: "desk" },
    { key: "limit", label: "Items", kind: "number" },
  ],
  component: CalendarPanel,
  defaultTitle: (p) => (p.desk ? `Calendar · ${p.desk.toUpperCase()}` : "Calendar"),
};
