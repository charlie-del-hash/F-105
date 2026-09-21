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
