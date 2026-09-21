/**
 * GET /api/alerts/run — evaluate the rules and send what is new.
 *
 * Auth: `Authorization: Bearer $CRON_SECRET` (Vercel Cron sends this automatically
 * when CRON_SECRET is set) or `?secret=`. Without CRON_SECRET the route only ever
 * dry-runs, so a fresh deployment can never spam a channel.
 *
 *   ?dryRun=1        evaluate and report, send nothing
 *   ?test=slack      send one test event to that channel (also needs the secret)
 */
import { NextResponse } from "next/server";
import { alertRules, ruleSymbols } from "@/alerts/rules";
import { evaluate } from "@/alerts/evaluate";
import { memoryDedupe, supabaseDedupe, type Dedupe } from "@/alerts/dedupe";
import type { AlertEvent, Channel } from "@/alerts/schema";
import { getWire } from "@/content/loader";
import { getProvider } from "@/data/providers";
import { dispatch, getNotifiers } from "@/lib/notify";
import { createServiceSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const memory = memoryDedupe();

function authorised(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  const url = new URL(request.url);
  return header === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ok = authorised(request);
  const dryRun = !ok || url.searchParams.get("dryRun") === "1";
  const test = url.searchParams.get("test") as Channel | null;

  const sb = createServiceSupabase();
  const dedupe: Dedupe = sb ? supabaseDedupe(sb) : memory;
  const notifiers = getNotifiers();

  let events: AlertEvent[];
  if (test) {
    if (!ok) return NextResponse.json({ error: "CRON_SECRET required for test sends" }, { status: 401 });
    events = [{ key: `test:${Date.now()}`, ruleId: "test", kind: "wire", severity: "routine", title: "Test alert", body: "If you can read this, the channel works.", href: "/wire", channels: [test], at: new Date().toISOString() }];
  } else {
    const [wire, quotes] = await Promise.all([getWire({ limit: 100 }), getProvider().quotes(ruleSymbols())]);
    events = evaluate(alertRules, { wire: wire.map((w) => ({ ...w, ts: w.ts.toISOString() })), quotes });
  }

  const result = await dispatch(events, notifiers, dedupe, { dryRun });
  return NextResponse.json({
    ts: new Date().toISOString(),
    dryRun,
    reason: ok ? undefined : "no or wrong CRON_SECRET — dry run only",
    dedupe: dedupe.id,
    channels: Object.fromEntries(Object.values(notifiers).map((n) => [n.id, n.configured ? "configured" : `missing ${n.missing}`])),
    rules: alertRules.length,
    events: events.map((e) => ({ key: e.key, title: e.title, channels: e.channels })),
    ...result,
  });
}
