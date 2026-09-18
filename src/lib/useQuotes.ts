"use client";
import { useEffect, useState } from "react";
import type { Quote, Range, Series } from "@/data/types";

/** Poll /api/quotes for a set of symbols. Re-fetches once a minute (the mock ticks per minute). */
export function useQuotes(symbols: string[], intervalMs = 60_000) {
  const key = symbols.join(",");
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [ts, setTs] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!key) return;
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(key)}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { ts: string; quotes: Quote[] };
        if (!alive) return;
        setQuotes(Object.fromEntries(json.quotes.map((q) => [q.symbol, q])));
        setTs(json.ts);
        setError(null);
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    };
    load();
    const id = setInterval(load, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [key, intervalMs]);
  return { quotes, ts, error };
}

export function useSeries(symbol: string, range: Range) {
  const key = `${symbol}:${range}`;
  // Keyed result so a change of symbol/range shows "loading" without a setState in the effect body.
  const [result, setResult] = useState<{ key: string; series: Series | null; error: string | null }>({ key, series: null, error: null });
  useEffect(() => {
    let alive = true;
    fetch(`/api/series/${encodeURIComponent(symbol)}?range=${range}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as Series;
      })
      .then((s) => alive && setResult({ key, series: s, error: null }))
      .catch((e: Error) => alive && setResult({ key, series: null, error: e.message }));
    return () => {
      alive = false;
    };
  }, [symbol, range, key]);
  return result.key === key ? { series: result.series, error: result.error } : { series: null, error: null };
}
