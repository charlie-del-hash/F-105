# Data

## Where numbers come from

`src/data/providers/index.ts` builds one `MarketDataProvider` from the environment:

| `MARKET_DATA_PROVIDER` | What you get |
|---|---|
| `live` (default) | A composite: each symbol goes to the first adapter that covers it, everything else is synthetic. |
| `mock` | Everything synthetic. Deterministic; use for tests and screenshots. |

Adapters in the composite today:

| Adapter | Covers | Needs | Cadence |
|---|---|---|---|
| `fred` — FRED, St. Louis Fed | BRENT, WTI, HH, EURUSD, USDCNY, USDJPY | `FRED_API_KEY` (free) | daily closes, cached 30 min |
| `ecb` — ECB reference rates via Frankfurter | EURUSD, USDCNY, USDJPY | nothing | daily, cached 60 min |
| `mock` | everything | nothing | synthetic history, per-minute tick |

Order matters: FRED is asked before ECB, so with a key the dollar crosses come from
FRED; without one they come from the ECB.

## Provenance is always visible

Every `Quote` and `Series` carries `provider`, `synthetic` and `asOf`. The UI shows it:
the status bar counts live and synthetic series and names the live sources, the quote
board marks synthetic rows "demo" and summarises in its footer, the chart footer names
the adapter and the observation date. `/api/status` returns the same facts as JSON.
Do not remove any of this when adding a source; extend it.

## Adding a source

1. `src/data/providers/<id>.ts` — export `create<Id>Provider(opts)` returning
   `MarketDataProvider & { configured: boolean }`. Take `fetchImpl` as an option so the
   adapter is testable with a stub; use `ttlCache` and `quoteFromPoints` /
   `seriesFromPoints` from `src/data/derive.ts` when all you have is daily closes.
2. Add it to `liveAdapters` in `providers/index.ts`, in priority order.
3. `src/data/providers/providers.test.ts` — a fixture test: happy path, missing values,
   an HTTP error (the composite relies on adapters throwing).
4. Document the env vars in `.env.example` and the row above.

Licensed sources to add when contracts exist: ICE / EEX for TTF, NBP, JKM and EUA
futures; Baltic Exchange (via Clarksons SIN or SSY) for BDI, TD3C, 5TC and LNG freight;
an AIS provider for the transit indicators; viaNexus for equities and macro. The
`indicator` group is the point of the product — plan the AIS feed first.

## Failure behaviour

An adapter that throws or returns nothing for a symbol is replaced by the synthetic
series for that symbol, marked synthetic, with one warning in the server log per ten
minutes. The desk never goes blank and never shows a generated number as observed.
