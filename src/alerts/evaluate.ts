/** Pure rule evaluation. No I/O, so it is trivially testable. */
import { fmtNum, fmtPct, fmtSigned } from "@/data/format";
import { getInstrument } from "@/data/instruments";
import type { Quote } from "@/data/types";
import type { AlertEvent, AlertRule } from "./schema";

export interface WireLike {
  id: string;
  ts: string | Date;
  desk: string;
  text: string;
  priority: "flash" | "urgent" | "routine";
  href?: string;
}

export interface EvalInput {
  wire: WireLike[];
  quotes: Quote[];
  now?: Date;
}

const cmp = { ">": (a: number, b: number) => a > b, ">=": (a: number, b: number) => a >= b, "<": (a: number, b: number) => a < b, "<=": (a: number, b: number) => a <= b };

export function evaluate(rules: AlertRule[], input: EvalInput): AlertEvent[] {
  const now = (input.now ?? new Date()).toISOString();
  const quotes = new Map(input.quotes.map((q) => [q.symbol, q]));
  const out: AlertEvent[] = [];
  for (const rule of rules) {
    if (rule.kind === "wire") {
      for (const w of input.wire) {
        if (!rule.priorities.includes(w.priority)) continue;
        if (rule.desks && !rule.desks.includes(w.desk)) continue;
        out.push({
          key: `wire:${rule.id}:${w.id}`,
          ruleId: rule.id,
          kind: "wire",
          severity: w.priority,
          title: `${w.priority.toUpperCase()} · ${w.desk.toUpperCase()}`,
          body: w.text,
          href: w.href ?? "/wire",
          channels: rule.channels,
          at: now,
        });
      }
      continue;
    }
    const q = quotes.get(rule.symbol);
    const inst = getInstrument(rule.symbol);
    if (!q || !inst) continue;
    const label = `${inst.symbol} · ${inst.name}`;
    const demo = q.synthetic ? " (synthetic demo series)" : "";
    if (rule.kind === "threshold" && cmp[rule.op](q.last, rule.value)) {
      out.push({
        key: `thr:${rule.id}:${q.asOf}`,
        ruleId: rule.id,
        kind: "threshold",
        severity: "urgent",
        title: `${inst.symbol} ${rule.op} ${fmtNum(rule.value, inst.decimals)} ${inst.unit}`.trim(),
        body: `${label} is ${fmtNum(q.last, inst.decimals)} ${inst.unit} as of ${q.asOf}${demo}. ${rule.note ?? ""}`.trim(),
        href: `/markets/${inst.symbol}`,
        symbol: inst.symbol,
        channels: rule.channels,
        at: now,
      });
    }
    if (rule.kind === "move" && Math.abs(q.changePct) >= rule.pct) {
      out.push({
        key: `move:${rule.id}:${q.asOf}`,
        ruleId: rule.id,
        kind: "move",
        severity: "urgent",
        title: `${inst.symbol} ${fmtPct(q.changePct)} on the day`,
        body: `${label} ${fmtSigned(q.change, inst.decimals)} to ${fmtNum(q.last, inst.decimals)} ${inst.unit} as of ${q.asOf}${demo}. ${rule.note ?? ""}`.trim(),
        href: `/markets/${inst.symbol}`,
        symbol: inst.symbol,
        channels: rule.channels,
        at: now,
      });
    }
  }
  return out;
}
