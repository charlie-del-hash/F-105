import rules from "../../content/alerts/rules.json";
import { AlertRules, type AlertRule } from "./schema";

/** Validated at import, so a bad rule fails the build rather than the cron. */
export const alertRules: AlertRule[] = AlertRules.parse(rules).filter((r) => r.enabled);

export function ruleSymbols(list: AlertRule[] = alertRules) {
  return Array.from(new Set(list.flatMap((r) => (r.kind === "wire" ? [] : [r.symbol]))));
}
