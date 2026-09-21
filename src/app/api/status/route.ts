/**
 * GET /api/status — data provenance for the status bar.
 * Reports what is configured AND what actually came back live on this request,
 * so a blocked or failing vendor shows as degraded instead of pretending.
 */
import { NextResponse } from "next/server";
import { describeData, getProvider } from "@/data/providers";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = describeData();
  let liveNow: string[] = [];
  if (data.live.length) {
    try {
      const quotes = await getProvider().quotes(data.live);
      liveNow = quotes.filter((q) => !q.synthetic).map((q) => q.symbol);
    } catch {
      liveNow = [];
    }
  }
  const degraded = data.live.filter((s) => !liveNow.includes(s));
  return NextResponse.json({
    ts: new Date().toISOString(),
    data: { ...data, live: liveNow, degraded, synthetic: [...data.synthetic, ...degraded] },
  });
}
