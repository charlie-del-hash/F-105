"use client";
/**
 * One poller for the whole desk. Panels subscribe to symbols; the store fetches
 * the union once a minute (and any newly requested symbol straight away), so every
 * panel shows the same tick and the server sees one request instead of nine.
 */
import { create } from "zustand";
import { isStaticDemo } from "./static-demo";
import type { Quote } from "./types";

interface QuoteState {
  quotes: Record<string, Quote>;
  ts: string | null;
  error: string | null;
}

export const useQuoteStore = create<QuoteState>(() => ({ quotes: {}, ts: null, error: null }));

const INTERVAL_MS = 60_000;
const refs = new Map<string, number>();
let timer: ReturnType<typeof setInterval> | null = null;
let pending: ReturnType<typeof setTimeout> | null = null;

async function load(symbols: string[]) {
  if (!symbols.length) return;
  if (isStaticDemo) {
    // No server to ask: the same deterministic generator runs in the browser,
    // so the demo still ticks once a minute.
    const { mockQuote } = await import("./mock");
    const now = new Date();
    const quotes = symbols.map((s) => mockQuote(s, now)).filter((q): q is Quote => !!q);
    useQuoteStore.setState((s) => ({
      quotes: { ...s.quotes, ...Object.fromEntries(quotes.map((q) => [q.symbol, q])) },
      ts: now.toISOString(),
      error: null,
    }));
    return;
  }
  try {
    const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(symbols.join(","))}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { ts: string; quotes: Quote[] };
    useQuoteStore.setState((s) => ({
      quotes: { ...s.quotes, ...Object.fromEntries(json.quotes.map((q) => [q.symbol, q])) },
      ts: json.ts,
      error: null,
    }));
  } catch (e) {
    useQuoteStore.setState({ error: (e as Error).message });
  }
}

function subscribed() {
  return [...refs.keys()];
}

/** Fetch symbols nobody has loaded yet, batched across panels mounting in the same tick. */
function scheduleMissing() {
  if (pending) clearTimeout(pending);
  pending = setTimeout(() => {
    pending = null;
    const have = useQuoteStore.getState().quotes;
    load(subscribed().filter((s) => !have[s]));
  }, 40);
}

export function subscribeQuotes(symbols: string[]) {
  for (const s of symbols) refs.set(s, (refs.get(s) ?? 0) + 1);
  scheduleMissing();
  if (!timer) timer = setInterval(() => load(subscribed()), INTERVAL_MS);
  return () => {
    for (const s of symbols) {
      const n = (refs.get(s) ?? 1) - 1;
      if (n <= 0) refs.delete(s);
      else refs.set(s, n);
    }
    if (refs.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** Force a refresh of everything on screen (e.g. after the tab regains focus). */
export function refreshQuotes() {
  return load(subscribed());
}
