/**
 * Alert rules are JSON (content/alerts/rules.json) so an editor or an agent can
 * change what fires without touching code. Three kinds:
 *   wire       a wire item with one of `priorities` (optionally from `desks`)
 *   threshold  an instrument's last value compared to `value` with `op`
 *   move       an instrument's day-on-day change of at least `pct` percent
 */
import { z } from "zod";

export const Channel = z.enum(["slack", "whatsapp", "email"]);
export type Channel = z.infer<typeof Channel>;

const Base = z.object({
  id: z.string().min(1),
  channels: z.array(Channel).min(1),
  note: z.string().optional(),
  enabled: z.boolean().default(true),
});

export const WireRule = Base.extend({
  kind: z.literal("wire"),
  priorities: z.array(z.enum(["flash", "urgent", "routine"])).min(1),
  desks: z.array(z.string()).optional(),
});
export const ThresholdRule = Base.extend({
  kind: z.literal("threshold"),
  symbol: z.string().min(1),
  op: z.enum([">", ">=", "<", "<="]),
  value: z.number(),
});
export const MoveRule = Base.extend({
  kind: z.literal("move"),
  symbol: z.string().min(1),
  pct: z.number().positive(),
});

export const AlertRule = z.discriminatedUnion("kind", [WireRule, ThresholdRule, MoveRule]);
export const AlertRules = z.array(AlertRule);
export type AlertRule = z.infer<typeof AlertRule>;

export interface AlertEvent {
  /** Stable key for de-duplication: the same key is never sent twice per channel. */
  key: string;
  ruleId: string;
  kind: AlertRule["kind"];
  severity: "flash" | "urgent" | "routine";
  title: string;
  body: string;
  /** Site-relative link. */
  href?: string;
  symbol?: string;
  channels: Channel[];
  at: string;
}
