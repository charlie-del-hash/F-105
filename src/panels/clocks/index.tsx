"use client";
import { z } from "zod";
import { useNow } from "@/lib/useNow";
import { useSize } from "@/lib/useSize";
import { zones } from "@/lib/zones";
import { cn } from "@/lib/cn";
import { panelMetaMap } from "../catalog";
import type { PanelDefinition } from "../types";

const schema = z.object({ zones: z.array(z.string()).min(1).default(["London", "New York", "Dubai", "Singapore"]) });
type Props = z.infer<typeof schema>;

export function Clocks({ names, big }: { names: string[]; big?: boolean }) {
  const now = useNow();
  const [ref, size] = useSize<HTMLDivElement>();
  /**
   * How much room there actually is, not how many rows the panel spans on the
   * desktop grid. The row count said nothing about the box on a phone, where
   * every panel is the width of the screen and sized to its content — a two-row
   * clocks panel and an eight-row one rendered identically and both got the
   * cramped layout. `big` stays available as an override for a fixed-size caller.
   */
  const large = big ?? size.height >= 140;
  return (
    <div ref={ref} className={cn("grid h-full gap-2 px-3 py-2", large ? "grid-cols-2 md:grid-cols-4" : "grid-flow-col auto-cols-fr")}>
      {names.map((name) => {
        const tz = zones[name] ?? "UTC";
        const time = now
          ? new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: tz }).format(now)
          : "--:--:--";
        const day = now ? new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: tz }).format(now) : "";
        const hour = now ? Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: tz }).format(now)) : 12;
        const office = hour >= 7 && hour < 19;
        return (
          <div key={name} className="min-w-0">
            <div className="flex items-center gap-1.5 truncate font-ui text-meta text-ink-3">
              <span className={cn("led", office ? "led-ok" : "")} aria-hidden title={office ? "office hours" : "after hours"} />
              {name} <span className="text-ink-3/70">{day}</span>
            </div>
            <div className={cn("tabular font-data text-ink", large ? "text-3xl" : "text-lg")}>{time}</div>
          </div>
        );
      })}
    </div>
  );
}

function ClocksPanel({ props }: { props: Props }) {
  return <Clocks names={props.zones} />;
}

export const clocksDefinition: PanelDefinition<Props> = {
  meta: panelMetaMap.get("clocks")!,
  schema,
  fields: [{ key: "zones", label: "Cities", kind: "zones" }],
  component: ClocksPanel,
  defaultTitle: () => "World clocks",
};
