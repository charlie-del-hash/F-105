/** Shared maths for adapters that only have daily closes (most real sources). */
import { rangeDays, type Quote, type Range, type Series, type SeriesPoint } from "./types";

export function round(v: number, decimals: number) {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}

export function seriesFromPoints(symbol: string, range: Range, points: SeriesPoint[], provider: string, synthetic: boolean): Series | undefined {
  const pts = points.slice(-rangeDays[range]);
  if (pts.length < 2) return undefined;
  const vs = pts.map((p) => p.v);
  return { symbol, range, points: pts, min: Math.min(...vs), max: Math.max(...vs), first: vs[0], last: vs[vs.length - 1], provider, synthetic };
}

export function quoteFromPoints(symbol: string, points: SeriesPoint[], decimals: number, provider: string, synthetic: boolean, now = new Date()): Quote | undefined {
  if (points.length < 2) return undefined;
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const change = round(last.v - prev.v, decimals);
  return {
    symbol,
    last: last.v,
    prevClose: prev.v,
    change,
    changePct: prev.v ? round((change / prev.v) * 100, 2) : 0,
    high: Math.max(last.v, prev.v),
    low: Math.min(last.v, prev.v),
    ts: now.toISOString(),
    asOf: last.d,
    spark: points.slice(-30).map((p) => p.v),
    provider,
    synthetic,
  };
}

/** Calendar start date that comfortably covers `range` trading days plus a sparkline tail. */
export function startDateFor(range: Range, now = new Date()) {
  const days = Math.ceil(Math.max(rangeDays[range], 30) * 1.5) + 10;
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** Tiny TTL cache so a busy desk does not re-fetch the same daily series every poll. */
export function ttlCache<T>(ttlMs: number) {
  const store = new Map<string, { at: number; value: Promise<T> }>();
  return (key: string, load: () => Promise<T>): Promise<T> => {
    const hit = store.get(key);
    if (hit && Date.now() - hit.at < ttlMs) return hit.value;
    const value = load().catch((e) => {
      store.delete(key);
      throw e;
    });
    store.set(key, { at: Date.now(), value });
    return value;
  };
}
