/**
 * FRED — Federal Reserve Bank of St. Louis. Free API key, daily series for
 * Brent, WTI, Henry Hub and the major dollar crosses.
 * https://fred.stlouisfed.org/docs/api/fred/series_observations.html
 *
 * Env: FRED_API_KEY. Without it the adapter reports itself as unconfigured
 * and the composite skips it.
 */
import { getInstrument } from "../instruments";
import { quoteFromPoints, seriesFromPoints, startDateFor, ttlCache } from "../derive";
import type { FetchLike, MarketDataProvider, SeriesPoint } from "../types";

export const FRED_SERIES: Record<string, string> = {
  BRENT: "DCOILBRENTEU",
  WTI: "DCOILWTICO",
  HH: "DHHNGSP",
  EURUSD: "DEXUSEU",
  USDCNY: "DEXCHUS",
  USDJPY: "DEXJPUS",
};

interface FredResponse {
  observations?: { date: string; value: string }[];
  error_message?: string;
}

export function createFredProvider(opts: { apiKey?: string; fetchImpl?: FetchLike; baseUrl?: string } = {}): MarketDataProvider & { configured: boolean } {
  const apiKey = opts.apiKey ?? process.env.FRED_API_KEY;
  const fetchImpl: FetchLike = opts.fetchImpl ?? ((u, i) => fetch(u, i));
  const base = opts.baseUrl ?? "https://api.stlouisfed.org/fred/series/observations";
  const cache = ttlCache<SeriesPoint[]>(30 * 60 * 1000);

  /** A year of daily closes, fetched once per symbol per TTL; every range slices it. */
  async function observations(symbol: string): Promise<SeriesPoint[]> {
    const id = FRED_SERIES[symbol];
    if (!id || !apiKey) return [];
    const start = startDateFor("1y");
    const url = `${base}?series_id=${id}&api_key=${apiKey}&file_type=json&observation_start=${start}`;
    return cache(id, async () => {
      const res = await fetchImpl(url, { next: { revalidate: 1800 } });
      if (!res.ok) throw new Error(`FRED ${id}: HTTP ${res.status}`);
      const json = (await res.json()) as FredResponse;
      if (json.error_message) throw new Error(`FRED ${id}: ${json.error_message}`);
      const decimals = getInstrument(symbol)?.decimals ?? 2;
      return (json.observations ?? [])
        .filter((o) => o.value !== "." && o.value !== "")
        .map((o) => ({ d: o.date, v: Number(Number(o.value).toFixed(decimals)) }))
        .filter((p) => Number.isFinite(p.v));
    });
  }

  return {
    id: "fred",
    name: "FRED (St. Louis Fed)",
    synthetic: false,
    configured: Boolean(apiKey),
    covers: (s) => Boolean(apiKey) && s.toUpperCase() in FRED_SERIES,
    async quotes(symbols) {
      const out = await Promise.all(
        symbols.map(async (s) => {
          const inst = getInstrument(s);
          if (!inst) return undefined;
          return quoteFromPoints(inst.symbol, await observations(inst.symbol), inst.decimals, "fred", false);
        }),
      );
      return out.filter((q): q is NonNullable<typeof q> => !!q);
    },
    async series(symbol, range) {
      const inst = getInstrument(symbol);
      if (!inst) return undefined;
      return seriesFromPoints(inst.symbol, range, await observations(inst.symbol), "fred", false);
    },
  };
}
