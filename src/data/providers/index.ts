/**
 * Provider selection. One environment variable decides where numbers come from.
 *
 *   MARKET_DATA_PROVIDER=mock   (default) deterministic synthetic data
 *
 * To add a real source: implement MarketDataProvider in a new file here,
 * register it in `providers`, and set the env var on Vercel. Candidates:
 * ICE/EEX (energy), Baltic Exchange via Clarksons SIN / SSY (freight),
 * viaNexus (equities & macro), Bigdata.com (news & filings).
 */
import type { MarketDataProvider } from "../types";
import { mockProvider } from "./mock";

const providers: Record<string, MarketDataProvider> = {
  mock: mockProvider,
};

export function getProvider(): MarketDataProvider {
  const id = process.env.MARKET_DATA_PROVIDER ?? "mock";
  return providers[id] ?? mockProvider;
}
