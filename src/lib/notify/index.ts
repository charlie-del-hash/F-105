/**
 * notify(events): fan each event out to its channels, skipping anything already
 * sent (dedupe) and anything whose channel is not configured. Returns a summary
 * the cron route reports, so a misconfigured channel is visible, not silent.
 */
import type { AlertEvent, Channel } from "@/alerts/schema";
import type { Dedupe } from "@/alerts/dedupe";
import type { FetchLike } from "@/data/types";
import { emailNotifier } from "./email";
import { slackNotifier } from "./slack";
import { whatsappNotifier } from "./whatsapp";
import type { Env, Notifier } from "./types";

export function getNotifiers(opts: { fetchImpl?: FetchLike; env?: Env } = {}): Record<Channel, Notifier> {
  return { slack: slackNotifier(opts), whatsapp: whatsappNotifier(opts), email: emailNotifier(opts) };
}

export interface DispatchResult {
  sent: { key: string; channel: Channel }[];
  skipped: { key: string; channel: Channel; reason: "duplicate" | "unconfigured" }[];
  failed: { key: string; channel: Channel; error: string }[];
}

export async function dispatch(events: AlertEvent[], notifiers: Record<Channel, Notifier>, dedupe: Dedupe, opts: { dryRun?: boolean } = {}): Promise<DispatchResult> {
  const result: DispatchResult = { sent: [], skipped: [], failed: [] };
  for (const e of events) {
    for (const channel of e.channels) {
      const n = notifiers[channel];
      if (!n.configured) {
        result.skipped.push({ key: e.key, channel, reason: "unconfigured" });
        continue;
      }
      if (await dedupe.has(e.key, channel)) {
        result.skipped.push({ key: e.key, channel, reason: "duplicate" });
        continue;
      }
      if (opts.dryRun) {
        result.sent.push({ key: e.key, channel });
        continue;
      }
      try {
        await n.send(e);
        await dedupe.mark(e.key, channel, { title: e.title, at: e.at });
        result.sent.push({ key: e.key, channel });
      } catch (err) {
        result.failed.push({ key: e.key, channel, error: (err as Error).message });
      }
    }
  }
  return result;
}
