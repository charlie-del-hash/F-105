/**
 * Instrument registry — the "securities master" of the terminal.
 * Every symbol the UI can quote, chart or watch is defined here once.
 *
 * All levels are DEMO values used to seed the synthetic series generator.
 * Replace `provider: "mock"` with a real adapter (see docs/ARCHITECTURE.md § Data).
 */
export type InstrumentGroup = "energy" | "freight" | "fx" | "carbon" | "indicator" | "index";

export interface Instrument {
  symbol: string;
  name: string;
  /** Short line for tables and the command bar. */
  desc: string;
  group: InstrumentGroup;
  unit: string;
  decimals: number;
  /** Demo seed level. */
  base: number;
  /** Daily volatility (fraction) for the synthetic walk. */
  vol: number;
  /** Which desks care. */
  desks: string[];
  /** Where the real number would come from. Shown in the panel footer so nobody forgets. */
  source: string;
  /** Some series are quoted in a currency; some are points/indices. */
  currency?: string;
}

export const instruments: Instrument[] = [
  // --- energy -------------------------------------------------------------
  { symbol: "BRENT", name: "Brent crude, front month", desc: "ICE Brent futures, M1", group: "energy", unit: "$/bbl", decimals: 2, base: 74.2, vol: 0.017, desks: ["energy", "geo"], source: "ICE (demo synthetic)", currency: "USD" },
  { symbol: "WTI", name: "WTI crude, front month", desc: "NYMEX WTI futures, M1", group: "energy", unit: "$/bbl", decimals: 2, base: 70.6, vol: 0.018, desks: ["energy"], source: "CME (demo synthetic)", currency: "USD" },
  { symbol: "TTF", name: "Dutch TTF gas, front month", desc: "ICE Endex TTF, M1", group: "energy", unit: "€/MWh", decimals: 2, base: 34.8, vol: 0.03, desks: ["energy", "geo"], source: "ICE Endex (demo synthetic)", currency: "EUR" },
  { symbol: "NBP", name: "UK NBP gas, front month", desc: "ICE NBP, M1", group: "energy", unit: "p/therm", decimals: 1, base: 86.4, vol: 0.03, desks: ["energy"], source: "ICE (demo synthetic)", currency: "GBp" },
  { symbol: "HH", name: "Henry Hub gas, front month", desc: "NYMEX natural gas, M1", group: "energy", unit: "$/MMBtu", decimals: 3, base: 2.86, vol: 0.032, desks: ["energy"], source: "CME (demo synthetic)", currency: "USD" },
  { symbol: "JKM", name: "JKM LNG, front month", desc: "Japan-Korea Marker spot LNG", group: "energy", unit: "$/MMBtu", decimals: 3, base: 11.9, vol: 0.026, desks: ["energy", "shipping"], source: "Platts (demo synthetic)", currency: "USD" },
  { symbol: "EUA", name: "EU carbon allowance, Dec", desc: "EEX EUA futures, Dec", group: "carbon", unit: "€/t", decimals: 2, base: 68.3, vol: 0.02, desks: ["energy"], source: "EEX (demo synthetic)", currency: "EUR" },
  // --- freight -------------------------------------------------------------
  { symbol: "BDI", name: "Baltic Dry Index", desc: "Composite dry bulk index", group: "freight", unit: "pts", decimals: 0, base: 1840, vol: 0.025, desks: ["shipping"], source: "Baltic Exchange (demo synthetic)" },
  { symbol: "TD3C", name: "VLCC MEG → China", desc: "Baltic TD3C, Worldscale", group: "freight", unit: "WS", decimals: 2, base: 58.4, vol: 0.04, desks: ["shipping", "energy", "geo"], source: "Baltic Exchange (demo synthetic)" },
  { symbol: "VLCC.TCE", name: "VLCC TCE, TD3C-equivalent", desc: "Time-charter equivalent earnings", group: "freight", unit: "$/day", decimals: 0, base: 41500, vol: 0.06, desks: ["shipping"], source: "Baltic Exchange (demo synthetic)", currency: "USD" },
  { symbol: "CAPE.5TC", name: "Capesize 5TC", desc: "Baltic Capesize time-charter average", group: "freight", unit: "$/day", decimals: 0, base: 22800, vol: 0.05, desks: ["shipping"], source: "Baltic Exchange (demo synthetic)", currency: "USD" },
  { symbol: "LNGF.174", name: "LNG carrier spot, 174k cbm", desc: "Two-stroke, Atlantic round-trip", group: "freight", unit: "$/day", decimals: 0, base: 38000, vol: 0.05, desks: ["shipping", "energy"], source: "Broker assessments (demo synthetic)", currency: "USD" },
  { symbol: "SCFI", name: "Shanghai Containerized Freight Index", desc: "Composite spot box rates", group: "freight", unit: "pts", decimals: 1, base: 1960, vol: 0.03, desks: ["shipping", "geo"], source: "SSE (demo synthetic)" },
  // --- fx -------------------------------------------------------------------
  { symbol: "EURUSD", name: "Euro / US dollar", desc: "Spot", group: "fx", unit: "", decimals: 4, base: 1.086, vol: 0.005, desks: ["energy", "geo"], source: "Composite (demo synthetic)" },
  { symbol: "USDCNY", name: "US dollar / Chinese yuan", desc: "Onshore spot", group: "fx", unit: "", decimals: 4, base: 7.21, vol: 0.003, desks: ["shipping", "geo"], source: "Composite (demo synthetic)" },
  { symbol: "USDJPY", name: "US dollar / Japanese yen", desc: "Spot", group: "fx", unit: "", decimals: 2, base: 149.6, vol: 0.006, desks: ["geo"], source: "Composite (demo synthetic)" },
  // --- indicators (the things a Bloomberg does not have) -------------------
  { symbol: "HORMUZ.TX", name: "Hormuz tanker transits", desc: "7-day average, laden + ballast", group: "indicator", unit: "/day", decimals: 0, base: 78, vol: 0.04, desks: ["geo", "shipping", "energy"], source: "AIS-derived (demo synthetic)" },
  { symbol: "BAB.TX", name: "Bab el-Mandeb transits", desc: "7-day average, all types", group: "indicator", unit: "/day", decimals: 0, base: 41, vol: 0.06, desks: ["geo", "shipping"], source: "AIS-derived (demo synthetic)" },
  { symbol: "WAR.RS", name: "Red Sea war-risk premium", desc: "Additional premium, % of hull value", group: "indicator", unit: "%", decimals: 2, base: 0.7, vol: 0.08, desks: ["shipping", "geo"], source: "Broker indications (demo synthetic)" },
  { symbol: "EU.GASSTOR", name: "EU gas storage fill", desc: "Aggregate, % of capacity", group: "indicator", unit: "%", decimals: 1, base: 84.5, vol: 0.006, desks: ["energy"], source: "AGSI+ (demo synthetic)" },
  // --- synthetic indices ------------------------------------------------------
  { symbol: "ADX30", name: "Aerospace & Defence 30", desc: "Demo equal-weight index", group: "index", unit: "pts", decimals: 1, base: 4120, vol: 0.011, desks: ["industry", "air"], source: "Demo synthetic" },
  { symbol: "SHIPX", name: "Listed Shipowners 20", desc: "Demo equal-weight index", group: "index", unit: "pts", decimals: 1, base: 1275, vol: 0.016, desks: ["shipping"], source: "Demo synthetic" },
];

export const instrumentMap = new Map(instruments.map((i) => [i.symbol, i]));
export function getInstrument(symbol: string) {
  return instrumentMap.get(symbol.toUpperCase());
}
export const groupNames: Record<InstrumentGroup, string> = {
  energy: "Energy",
  freight: "Freight",
  fx: "FX",
  carbon: "Carbon",
  indicator: "Indicators",
  index: "Indices",
};
