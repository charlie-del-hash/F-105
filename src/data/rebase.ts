/**
 * Putting several instruments on one plot.
 *
 * The instruments this terminal carries are quoted in $/bbl, €/MWh, Worldscale,
 * $/day, points and per-cent. Drawn raw on one axis they say nothing: Brent at
 * 74 and VLCC TCE at 41,500 cannot share a scale, and giving them one axis each
 * is the dual-axis chart the house rules forbid outright. Indexing every series
 * to a common base is the sanctioned answer — one axis, one unit, and the
 * comparison is about the thing a comparison is actually for, which is relative
 * movement over the window.
 */
import type { Series, SeriesPoint } from "./types";

export type Basis = "rebase" | "pct";

export interface RebasedSeries {
  symbol: string;
  /** `v` is an index (start = 100) or a per-cent change from the start. */
  points: SeriesPoint[];
  /** Where the series ends, in the same unit as `points`. */
  last: number;
  /** Per-cent change across the window, whichever basis is in use. */
  changePct: number;
  synthetic: boolean;
  provider: string;
}

export const basisLabel: Record<Basis, string> = {
  rebase: "index · start = 100",
  pct: "% change from start",
};

/**
 * Index each series against its own first point. A series with fewer than two
 * points, or one that starts at zero, is dropped rather than drawn: there is no
 * honest way to index against nothing, and a silent divide-by-zero would plot a
 * straight line at infinity.
 */
export function rebaseAll(series: Series[], basis: Basis): RebasedSeries[] {
  const out: RebasedSeries[] = [];
  for (const s of series) {
    if (s.points.length < 2) continue;
    const first = s.points[0].v;
    if (!Number.isFinite(first) || first === 0) continue;
    const points = s.points.map((p) => ({ d: p.d, v: basis === "pct" ? (p.v / first - 1) * 100 : (p.v / first) * 100 }));
    const last = points[points.length - 1].v;
    out.push({
      symbol: s.symbol,
      points,
      last,
      changePct: (s.points[s.points.length - 1].v / first - 1) * 100,
      synthetic: s.synthetic,
      provider: s.provider,
    });
  }
  return out;
}

/** The value range across every series, with the basis's own zero line included. */
export function extent(series: RebasedSeries[], basis: Basis) {
  const vs = series.flatMap((s) => s.points.map((p) => p.v));
  // The baseline is part of the story: "did it end above where it started" is
  // the question the chart exists to answer, so it is always in frame.
  const base = basis === "pct" ? 0 : 100;
  if (!vs.length) return { min: base, max: base };
  return { min: Math.min(...vs, base), max: Math.max(...vs, base) };
}

/** Earliest and latest timestamp across every series, for a shared date axis. */
export function dateSpan(series: RebasedSeries[]) {
  let lo = Infinity;
  let hi = -Infinity;
  for (const s of series) {
    for (const p of s.points) {
      const t = Date.parse(p.d);
      if (!Number.isFinite(t)) continue;
      if (t < lo) lo = t;
      if (t > hi) hi = t;
    }
  }
  // Series of different lengths still line up, because x comes from the date
  // rather than from a point's index in its own array.
  return Number.isFinite(lo) && hi > lo ? { lo, hi } : null;
}
