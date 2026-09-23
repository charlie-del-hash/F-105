"use client";
import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/shallow";
import { subscribeQuotes, useQuoteStore } from "@/data/quote-store";
import { isStaticDemo } from "@/data/static-demo";
import type { Quote, Range, Series } from "@/data/types";

/** Quotes for a set of symbols, shared with every other panel through the quote store. */
export function useQuotes(symbols: string[]) {
  const key = symbols.join(",");
  useEffect(() => subscribeQuotes(key ? key.split(",") : []), [key]);
  const quotes = useQuoteStore(
    useShallow((s) => {
      const out: Record<string, Quote> = {};
      for (const sym of key ? key.split(",") : []) if (s.quotes[sym]) out[sym] = s.quotes[sym];
      return out;
    }),
  );
  const ts = useQuoteStore((s) => s.ts);
  const error = useQuoteStore((s) => s.error);
  return { quotes, ts, error };
}

const seriesCache = new Map<string, { at: number; value: Promise<Series> }>();
const SERIES_TTL = 60_000;

function loadSeries(symbol: string, range: Range) {
  const key = `${symbol}:${range}`;
  const hit = seriesCache.get(key);
  if (hit && Date.now() - hit.at < SERIES_TTL) return hit.value;
  const value = isStaticDemo
    ? import("@/data/mock").then(({ mockSeries }) => {
        const s = mockSeries(symbol, range);
        if (!s) throw new Error(`Unknown symbol ${symbol}`);
        return s;
      })
    : fetch(`/api/series/${encodeURIComponent(symbol)}?range=${range}`).then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as Series;
      });
  value.catch(() => seriesCache.delete(key));
  seriesCache.set(key, { at: Date.now(), value });
  return value;
}

/** A daily series, cached briefly so flicking between ranges is instant. */
export function useSeries(symbol: string, range: Range) {
  const key = `${symbol}:${range}`;
  const [result, setResult] = useState<{ key: string; series: Series | null; error: string | null }>({ key, series: null, error: null });
  useEffect(() => {
    let alive = true;
    loadSeries(symbol, range)
      .then((s) => alive && setResult({ key, series: s, error: null }))
      .catch((e: Error) => alive && setResult({ key, series: null, error: e.message }));
    return () => {
      alive = false;
    };
  }, [symbol, range, key]);
  return useMemo(() => (result.key === key ? { series: result.series, error: result.error } : { series: null, error: null }), [result, key]);
}

/**
 * Several daily series at once, for a chart that compares instruments.
 *
 * Hooks cannot be called in a loop, so a comparison panel cannot just map
 * `useSeries` over its symbols. This goes through the same cached `loadSeries`,
 * which means a symbol already on screen in a `GP` panel at the same range costs
 * nothing to add here.
 *
 * Partial results are the normal case, not an error: one unknown symbol should
 * not blank a comparison of four. Each entry resolves independently and the
 * failures come back named, for the panel to report.
 */
export function useSeriesSet(symbols: string[], range: Range) {
  const key = `${symbols.join(",")}:${range}`;
  const [result, setResult] = useState<{ key: string; series: Series[]; errors: Record<string, string> }>({ key, series: [], errors: {} });
  useEffect(() => {
    let alive = true;
    const list = key.split(":")[0] ? key.split(":")[0].split(",") : [];
    Promise.all(
      list.map((symbol) =>
        loadSeries(symbol, range).then(
          (s) => ({ symbol, series: s, error: null as string | null }),
          (e: Error) => ({ symbol, series: null, error: e.message }),
        ),
      ),
    ).then((settled) => {
      if (!alive) return;
      const errors: Record<string, string> = {};
      const series: Series[] = [];
      for (const r of settled) {
        if (r.series) series.push(r.series);
        else if (r.error) errors[r.symbol] = r.error;
      }
      setResult({ key, series, errors });
    });
    return () => {
      alive = false;
    };
  }, [key, range]);
  // A stale set belongs to the previous symbols; showing it under the new title
  // would mislabel the lines.
  return useMemo(
    () => (result.key === key ? { series: result.series, errors: result.errors } : { series: [], errors: {} }),
    [result, key],
  );
}
