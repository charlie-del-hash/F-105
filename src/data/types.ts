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
  /** Last 30 closes for a sparkline. */
  spark: number[];
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
}

export interface MarketDataProvider {
  readonly id: string;
  quotes(symbols: string[]): Promise<Quote[]>;
  series(symbol: string, range: Range): Promise<Series | undefined>;
}
