export interface Quote {
  symbol: string;
  last: number;
  prevClose: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  /** ISO timestamp of the quote. */
  ts: string;
  /** Date (YYYY-MM-DD) of the last observation behind `last`. */
  asOf: string;
  /** Last 30 closes for a sparkline. */
  spark: number[];
  /** Which adapter produced it: "mock", "fred", "ecb", … */
  provider: string;
  /** True when the numbers are generated, not observed. Always shown to the user. */
  synthetic: boolean;
}

export type Range = "1m" | "3m" | "6m" | "1y";
export const ranges: Range[] = ["1m", "3m", "6m", "1y"];
export const rangeDays: Record<Range, number> = { "1m": 22, "3m": 66, "6m": 130, "1y": 260 };

export interface SeriesPoint {
  /** ISO date (YYYY-MM-DD). */
  d: string;
  v: number;
}

export interface Series {
  symbol: string;
  range: Range;
  points: SeriesPoint[];
  min: number;
  max: number;
  first: number;
  last: number;
  provider: string;
  synthetic: boolean;
}

/**
 * A source of numbers. Implement one per vendor; the composite provider routes
 * each symbol to the first adapter that `covers` it and falls back to the mock.
 */
export interface MarketDataProvider {
  readonly id: string;
  /** Human name for footers and the status bar. */
  readonly name: string;
  readonly synthetic: boolean;
  covers(symbol: string): boolean;
  quotes(symbols: string[]): Promise<Quote[]>;
  series(symbol: string, range: Range): Promise<Series | undefined>;
}

/** Minimal fetch signature so adapters can be unit-tested with a stub. */
export type FetchLike = (url: string, init?: RequestInit & { next?: { revalidate?: number } }) => Promise<Response>;
