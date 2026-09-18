/**
 * Site identity. Rebrand here; nothing else needs to change.
 * (The repo codename is F-105. The product name is a placeholder until you pick one.)
 */
export const site = {
  name: "F-105",
  product: "Terminal",
  tagline: "Air power · Energy · Shipping · Geopolitics",
  description:
    "An intelligence terminal for people who read across domains: aircraft history beside gas curves, chokepoints beside freight rates. Composable panels, your own layouts, six instrument themes.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  version: "0.1.0",
  motto: "Unclassified // open sources only",
  /** Content desks. Every article, brief, dossier and wire item belongs to one. */
  desks: [
    { id: "air", name: "Air Power", short: "AIR", blurb: "Aircraft, air campaigns, the people who flew them." },
    { id: "energy", name: "Energy", short: "NRG", blurb: "Gas, oil, power, carbon — the curves and the politics behind them." },
    { id: "shipping", name: "Shipping", short: "SHP", blurb: "Freight, fleets, chokepoints, and the dual-use edge of the merchant marine." },
    { id: "geo", name: "Geopolitics", short: "GEO", blurb: "Where the map, the market and the military meet." },
    { id: "industry", name: "Defence Industry", short: "IND", blurb: "Procurement, production, and the arsenal behind the front line." },
  ],
  /** Messaging goes out through the channels people already have open. */
  channels: {
    whatsapp: true,
    email: true,
    slack: true,
  },
} as const;

export type DeskId = (typeof site.desks)[number]["id"];
export const deskIds = site.desks.map((d) => d.id) as [DeskId, ...DeskId[]];
export function desk(id: DeskId) {
  return site.desks.find((d) => d.id === id)!;
}
