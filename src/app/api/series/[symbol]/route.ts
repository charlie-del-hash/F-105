/**
 * GET /api/series/BRENT?range=3m
 */
import { NextResponse } from "next/server";
import { getProvider } from "@/data/providers";
import { ranges, type Range } from "@/data/types";

export async function GET(request: Request, ctx: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await ctx.params;
  const url = new URL(request.url);
  const r = (url.searchParams.get("range") ?? "3m") as Range;
  const range: Range = ranges.includes(r) ? r : "3m";
  const series = await getProvider().series(symbol.toUpperCase(), range);
  if (!series) return NextResponse.json({ error: `Unknown symbol ${symbol}` }, { status: 404 });
  return NextResponse.json(series, {
    headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
