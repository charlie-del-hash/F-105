import type { MarketDataProvider } from "../types";
import { mockQuote, mockSeries } from "../mock";

export const mockProvider: MarketDataProvider = {
  id: "mock",
  name: "Synthetic (demo)",
  synthetic: true,
  covers: () => true,
  async quotes(symbols) {
    const now = new Date();
    return symbols.map((s) => mockQuote(s, now)).filter((q): q is NonNullable<typeof q> => !!q);
  },
  async series(symbol, range) {
    return mockSeries(symbol, range);
  },
};
