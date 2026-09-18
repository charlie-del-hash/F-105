/**
 * Deterministic synthetic market data.
 * Same symbol → same history on every machine and every build, so screenshots,
 * tests and demos are reproducible. The "live" tick changes once a minute.
 *
 * Anchored to a fixed date so server and client agree. When you wire a real
 * provider, delete this file and nothing else changes.
 */
import { instruments, getInstrument } from "./instruments";
import { rangeDays, type Quote, type Range, type Series, type SeriesPoint } from "./types";

export const ANCHOR = "2026-09-18"; // last trading day in the demo history
const HISTORY_DAYS = 300;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Box–Muller normal from a uniform PRNG. */
function normal(rnd: () => number) {
  const u = Math.max(rnd(), 1e-9);
  const v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function tradingDaysBack(n: number): string[] {
  const out: string[] = [];
  const d = new Date(ANCHOR + "T00:00:00Z");
  while (out.length < n) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return out.reverse();
}

const historyCache = new Map<string, SeriesPoint[]>();

/** Full daily history for a symbol, oldest first. */
export function history(symbol: string): SeriesPoint[] {
  const key = symbol.toUpperCase();
  const cached = historyCache.get(key);
  if (cached) return cached;
  const inst = getInstrument(key);
  if (!inst) return [];
  const rnd = mulberry32(hash(key));
  const days = tradingDaysBack(HISTORY_DAYS);
  // Start a little away from base so the series has a story; mean-revert gently.
  let p = inst.base * (0.85 + 0.3 * rnd());
  const pts: SeriesPoint[] = [];
  // A single regime shift somewhere in the middle third — every market has one.
  const shockAt = Math.floor(days.length * (0.35 + 0.3 * rnd()));
  const shock = (rnd() - 0.5) * 0.35;
  for (let i = 0; i < days.length; i++) {
    const z = normal(rnd);
    const revert = 0.015 * ((inst.base - p) / inst.base);
    p = p * Math.exp(inst.vol * z + revert);
    if (i === shockAt) p *= 1 + shock;
    if (p < inst.base * 0.2) p = inst.base * 0.2;
    pts.push({ d: days[i], v: round(p, inst.decimals) });
  }
  historyCache.set(key, pts);
  return pts;
}

function round(v: number, decimals: number) {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}

/** Intraday "tick": a small, deterministic-per-minute deviation from the last close. */
export function tick(symbol: string, now = new Date()): number {
  const inst = getInstrument(symbol);
  const h = history(symbol);
  if (!inst || h.length === 0) return NaN;
  const minute = Math.floor(now.getTime() / 60000);
  const rnd = mulberry32(hash(symbol + ":" + minute));
  const z = normal(rnd);
  return round(h[h.length - 1].v * (1 + inst.vol * 0.35 * z), inst.decimals);
}

export function mockQuote(symbol: string, now = new Date()): Quote | undefined {
  const inst = getInstrument(symbol);
  if (!inst) return undefined;
  const h = history(inst.symbol);
  const prevClose = h[h.length - 1].v;
  const last = tick(inst.symbol, now);
  const change = round(last - prevClose, inst.decimals);
  const spark = h.slice(-30).map((p) => p.v);
  const dayRange = h.slice(-1).map((p) => p.v)[0] * inst.vol * 0.6;
  return {
    symbol: inst.symbol,
    last,
    prevClose,
    change,
    changePct: prevClose ? round((change / prevClose) * 100, 2) : 0,
    high: round(Math.max(last, prevClose) + dayRange * 0.4, inst.decimals),
    low: round(Math.min(last, prevClose) - dayRange * 0.4, inst.decimals),
    ts: now.toISOString(),
    spark,
  };
}

export function mockSeries(symbol: string, range: Range): Series | undefined {
  const inst = getInstrument(symbol);
  if (!inst) return undefined;
  const pts = history(inst.symbol).slice(-rangeDays[range]);
  const vs = pts.map((p) => p.v);
  return {
    symbol: inst.symbol,
    range,
    points: pts,
    min: Math.min(...vs),
    max: Math.max(...vs),
    first: vs[0],
    last: vs[vs.length - 1],
  };
}

export function allSymbols() {
  return instruments.map((i) => i.symbol);
}
