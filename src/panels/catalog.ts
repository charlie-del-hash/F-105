/**
 * Panel catalog — metadata only, safe to import on the server.
 * The client-side registry (src/panels/registry.tsx) adds the components.
 * To add a panel: add a row here, add its component to the registry, document it in docs/LAYOUTS.md.
 */
export type PanelCategory = "markets" | "content" | "geo" | "tools";

export interface PanelMeta {
  type: string;
  name: string;
  description: string;
  category: PanelCategory;
  /** Bloomberg-style mnemonic for the command bar, e.g. "GP" for a chart. */
  mnemonic: string;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  /**
   * Width ÷ height for a panel that is a viewport rather than a list — it has no
   * intrinsic height, so on a phone (where panels size to their content) it has
   * to be given one. Everything else sizes to what it holds.
   */
  phoneAspect?: number;
}

export const panelCatalog: PanelMeta[] = [
  { type: "wire", name: "Wire", description: "Time-stamped one-liners from every desk. Flash items blink.", category: "content", mnemonic: "WIRE", defaultSize: { w: 3, h: 10 }, minSize: { w: 2, h: 4 } },
  { type: "quotes", name: "Quote board", description: "Last, change and a 30-day sparkline for a list of instruments.", category: "markets", mnemonic: "QB", defaultSize: { w: 4, h: 6 }, minSize: { w: 3, h: 3 } },
  { type: "chart", name: "Chart", description: "Daily line chart for one instrument with crosshair and range picker.", category: "markets", mnemonic: "GP", defaultSize: { w: 5, h: 6 }, minSize: { w: 3, h: 4 }, phoneAspect: 1.5 },
  { type: "compare", name: "Comparison", description: "Two to four instruments on one plot, each indexed to its own first point.", category: "markets", mnemonic: "COMP", defaultSize: { w: 5, h: 6 }, minSize: { w: 3, h: 4 }, phoneAspect: 1.4 },
  { type: "headlines", name: "Headlines", description: "Latest articles, briefs and dossiers, filterable by desk.", category: "content", mnemonic: "TOP", defaultSize: { w: 4, h: 6 }, minSize: { w: 3, h: 3 } },
  { type: "reader", name: "Reader", description: "A full piece, rendered in place. Pick a slug or let it follow the featured story.", category: "content", mnemonic: "READ", defaultSize: { w: 6, h: 12 }, minSize: { w: 3, h: 5 } },
  { type: "dossier", name: "Dossier", description: "Spec sheet and dual-use notes for an aircraft, ship class, chokepoint or facility.", category: "content", mnemonic: "DES", defaultSize: { w: 4, h: 8 }, minSize: { w: 3, h: 4 } },
  { type: "plot", name: "Plot", description: "A schematic chokepoint plot: lanes, transits and a datum. The CIC view.", category: "geo", mnemonic: "PLOT", defaultSize: { w: 5, h: 7 }, minSize: { w: 3, h: 4 }, phoneAspect: 100 / 70 },
  { type: "calendar", name: "Calendar", description: "Upcoming dated events: OPEC, ECB, exercises, fixtures, hearings.", category: "content", mnemonic: "ECO", defaultSize: { w: 3, h: 6 }, minSize: { w: 2, h: 3 } },
  { type: "clocks", name: "World clocks", description: "Desk time across the markets that matter.", category: "tools", mnemonic: "WCLK", defaultSize: { w: 4, h: 2 }, minSize: { w: 2, h: 1 } },
  { type: "notes", name: "Notes", description: "A scratchpad that persists on this device.", category: "tools", mnemonic: "NOTE", defaultSize: { w: 3, h: 5 }, minSize: { w: 2, h: 2 } },
  { type: "indicators", name: "Indicators", description: "Big-number tiles for the series that are not prices: transits, premiums, storage.", category: "markets", mnemonic: "IND", defaultSize: { w: 4, h: 3 }, minSize: { w: 2, h: 2 } },
];

export const panelMetaMap = new Map(panelCatalog.map((p) => [p.type, p]));
