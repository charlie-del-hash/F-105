/**
 * Routes each symbol to the first live adapter that covers it; anything a live
 * adapter fails to deliver falls back to `fallback` (the mock), clearly marked
 * synthetic. No single vendor covers energy, freight and indicators, so this is
 * the shape production will have too — with more adapters in the list.
 */
import type { MarketDataProvider, Quote, Range, Series } from "../types";

export interface CompositeProvider extends MarketDataProvider {
  readonly providers: MarketDataProvider[];
  /** Which adapter would serve a symbol. */
  route(symbol: string): MarketDataProvider;
}

export function createCompositeProvider(live: MarketDataProvider[], fallback: MarketDataProvider, log: (msg: string) => void = console.warn): CompositeProvider {
  const lastWarn = new Map<string, number>();
  const warn = (key: string, msg: string) => {
    const now = Date.now();
    if ((lastWarn.get(key) ?? 0) + 10 * 60 * 1000 < now) {
      lastWarn.set(key, now);
      log(msg);
    }
  };
  const route = (symbol: string) => live.find((p) => p.covers(symbol)) ?? fallback;

  return {
    id: "live",
    name: "Live (composite)",
    synthetic: false,
    providers: [...live, fallback],
    route,
    covers: () => true,
    async quotes(symbols): Promise<Quote[]> {
      const groups = new Map<MarketDataProvider, string[]>();
      for (const s of symbols) {
        const p = route(s);
        groups.set(p, [...(groups.get(p) ?? []), s]);
      }
      const results = await Promise.all(
        [...groups.entries()].map(async ([p, syms]) => {
          try {
            const got = await p.quotes(syms);
            const missing = syms.filter((s) => !got.some((q) => q.symbol === s));
            if (missing.length && p !== fallback) {
              warn(`${p.id}:missing`, `[data] ${p.id} returned nothing for ${missing.join(", ")}; using ${fallback.id}`);
              return [...got, ...(await fallback.quotes(missing))];
            }
            return got;
          } catch (e) {
            warn(`${p.id}:error`, `[data] ${p.id} failed (${(e as Error).message}); using ${fallback.id} for ${syms.join(", ")}`);
            return p === fallback ? [] : fallback.quotes(syms);
          }
        }),
      );
      const bySymbol = new Map(results.flat().map((q) => [q.symbol, q]));
      return symbols.map((s) => bySymbol.get(s)).filter((q): q is Quote => !!q);
    },
    async series(symbol, range: Range): Promise<Series | undefined> {
      const p = route(symbol);
      if (p === fallback) return fallback.series(symbol, range);
      try {
        const s = await p.series(symbol, range);
        if (s) return s;
        warn(`${p.id}:series:${symbol}`, `[data] ${p.id} has no series for ${symbol}; using ${fallback.id}`);
      } catch (e) {
        warn(`${p.id}:series:error`, `[data] ${p.id} series failed (${(e as Error).message}); using ${fallback.id}`);
      }
      return fallback.series(symbol, range);
    },
  };
}
