/**
 * ECB reference rates via the Frankfurter API — no key, daily, free.
 * https://frankfurter.dev  (time series: /v1/{start}..{end}?base=USD&symbols=CNY)
 *
 * Env (optional): FRANKFURTER_BASE_URL to point at a self-hosted instance.
 */
import { getInstrument } from "../instruments";
import { quoteFromPoints, seriesFromPoints, startDateFor, ttlCache } from "../derive";
import type { FetchLike, MarketDataProvider, SeriesPoint } from "../types";

/** symbol → [base, quote] */
export const ECB_PAIRS: Record<string, [string, string]> = {
  EURUSD: ["EUR", "USD"],
  USDCNY: ["USD", "CNY"],
  USDJPY: ["USD", "JPY"],
};

interface FrankfurterResponse {
  rates?: Record<string, Record<string, number>>;
}

export function createEcbProvider(opts: { fetchImpl?: FetchLike; baseUrl?: string } = {}): MarketDataProvider & { configured: boolean } {
  const fetchImpl: FetchLike = opts.fetchImpl ?? ((u, i) => fetch(u, i));
  const base = (opts.baseUrl ?? process.env.FRANKFURTER_BASE_URL ?? "https://api.frankfurter.dev/v1").replace(/\/$/, "");
  const cache = ttlCache<SeriesPoint[]>(60 * 60 * 1000);

  /** A year of daily rates, fetched once per pair per TTL; every range slices it. */
  async function points(symbol: string): Promise<SeriesPoint[]> {
    const pair = ECB_PAIRS[symbol];
    if (!pair) return [];
    const [from, to] = pair;
    const start = startDateFor("1y");
    const end = new Date().toISOString().slice(0, 10);
    const url = `${base}/${start}..${end}?base=${from}&symbols=${to}`;
    return cache(symbol, async () => {
      const res = await fetchImpl(url, { next: { revalidate: 3600 } });
      if (!res.ok) throw new Error(`ECB ${symbol}: HTTP ${res.status}`);
      const json = (await res.json()) as FrankfurterResponse;
      const decimals = getInstrument(symbol)?.decimals ?? 4;
      return Object.entries(json.rates ?? {})
        .map(([d, r]) => ({ d, v: Number(Number(r[to]).toFixed(decimals)) }))
        .filter((p) => Number.isFinite(p.v))
        .sort((a, b) => (a.d < b.d ? -1 : 1));
    });
  }

  return {
    id: "ecb",
    name: "ECB reference rates",
    synthetic: false,
    configured: true,
    covers: (s) => s.toUpperCase() in ECB_PAIRS,
    async quotes(symbols) {
      const out = await Promise.all(
        symbols.map(async (s) => {
          const inst = getInstrument(s);
          if (!inst) return undefined;
          return quoteFromPoints(inst.symbol, await points(inst.symbol), inst.decimals, "ecb", false);
        }),
      );
      return out.filter((q): q is NonNullable<typeof q> => !!q);
    },
    async series(symbol, range) {
      const inst = getInstrument(symbol);
      if (!inst) return undefined;
      return seriesFromPoints(inst.symbol, range, await points(inst.symbol), "ecb", false);
    },
  };
}
