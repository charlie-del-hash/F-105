/**
 * GET /api/quotes?symbols=BRENT,TTF
 * Returns quotes for the requested symbols (all instruments when omitted).
 */
import { NextResponse } from "next/server";
import { getProvider } from "@/data/providers";
import { allSymbols } from "@/data/mock";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get("symbols");
  const symbols = raw ? raw.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean) : allSymbols();
  const quotes = await getProvider().quotes(symbols);
  return NextResponse.json(
    { provider: getProvider().id, ts: new Date().toISOString(), quotes },
    { headers: { "cache-control": "public, s-maxage=30, stale-while-revalidate=60" } },
  );
}
