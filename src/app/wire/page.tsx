import type { Metadata } from "next";
import { getWire } from "@/content/loader";
import { WireFeed } from "@/components/content/WireFeed";

export const metadata: Metadata = { title: "Wire" };

export default async function WirePage() {
  const wire = (await getWire({ limit: 200 })).map((w) => ({ ...w, ts: w.ts.toISOString() }));
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
      <h1 className="caps mb-1 text-ink-3">The Wire</h1>
      <p className="mb-4 font-ui text-sm text-ink-2">One line per item, newest first. Flash items also fire to WhatsApp, Slack and email once alerts are wired up.</p>
      <WireFeed items={wire} />
    </div>
  );
}
