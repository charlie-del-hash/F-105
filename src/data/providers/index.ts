/**
 * Provider selection. One environment variable decides where numbers come from.
 *
 *   MARKET_DATA_PROVIDER=live   (default) FRED (if FRED_API_KEY) + ECB rates, mock for the rest
 *   MARKET_DATA_PROVIDER=mock   everything synthetic — reproducible demos and tests
 *
 * To add a source: implement MarketDataProvider in a new file here and add it to
 * `liveAdapters`. Licensed candidates: ICE/EEX (energy futures), Baltic Exchange via
 * Clarksons SIN or SSY (freight), viaNexus (equities, macro), an AIS vendor for the
 * transit indicators.
 */
import { instruments } from "../instruments";
import type { MarketDataProvider } from "../types";
import { createCompositeProvider } from "./composite";
import { createEcbProvider } from "./ecb";
import { createFredProvider } from "./fred";
import { mockProvider } from "./mock";

type Adapter = MarketDataProvider & { configured: boolean };

let cached: { mode: string; provider: MarketDataProvider; adapters: Adapter[] } | null = null;

function build() {
  const mode = process.env.MARKET_DATA_PROVIDER ?? "live";
  const adapters: Adapter[] = mode === "mock" ? [] : [createFredProvider(), createEcbProvider()];
  const live = adapters.filter((a) => a.configured);
  const provider = mode === "mock" || live.length === 0 ? mockProvider : createCompositeProvider(live, mockProvider);
  return { mode, provider, adapters };
}

export function getProvider(): MarketDataProvider {
  if (!cached || process.env.NODE_ENV === "test") cached = build();
  return cached.provider;
}

export interface DataStatus {
  mode: string;
  adapters: { id: string; name: string; configured: boolean; symbols: string[] }[];
  /** Symbols served live (after /api/status probes, the ones that really came back). */
  live: string[];
  synthetic: string[];
  /** Configured for a live adapter but currently falling back to synthetic. */
  degraded?: string[];
}

/** What the status bar shows: which series are observed and which are generated. */
export function describeData(): DataStatus {
  if (!cached) cached = build();
  const { mode, adapters } = cached;
  const live: string[] = [];
  const synthetic: string[] = [];
  const bySymbol = new Map<string, string>();
  for (const i of instruments) {
    const a = adapters.find((x) => x.configured && x.covers(i.symbol));
    if (a) {
      live.push(i.symbol);
      bySymbol.set(i.symbol, a.id);
    } else synthetic.push(i.symbol);
  }
  return {
    mode,
    adapters: adapters.map((a) => ({ id: a.id, name: a.name, configured: a.configured, symbols: [...bySymbol.entries()].filter(([, id]) => id === a.id).map(([s]) => s) })),
    live,
    synthetic,
  };
}
