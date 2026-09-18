/**
 * Bloomberg-style mnemonics for the command bar, as a pure function so it can be tested.
 *
 *   GP TTF          chart an instrument         DES hormuz     open a dossier
 *   THEME paper     switch theme                LAYOUT bridge  open a layout
 *   WIRE shp        add a wire panel for a desk QB brent ttf   add a quote board
 *   READ thud-ridge add a reader panel          PLOT hormuz    add the plot
 */
export interface MnemonicContext {
  themes: { id: string; name: string }[];
  layouts: { id: string; name: string }[];
  docs: { slug: string; title: string; kind: string; designation?: string }[];
  desks: { id: string; short: string }[];
  panels: { type: string; name: string; mnemonic: string }[];
  hasInstrument: (symbol: string) => boolean;
}

export type Command =
  | { kind: "theme"; id: string; label: string }
  | { kind: "layout"; id: string; label: string }
  | { kind: "chart"; symbol: string; label: string }
  | { kind: "dossier"; slug: string; label: string }
  | { kind: "panel"; type: string; props: Record<string, unknown>; label: string };

const startsWith = (hay: string, needle: string) => hay.toLowerCase().startsWith(needle.toLowerCase());

export function parseMnemonic(input: string, ctx: MnemonicContext): Command | null {
  const m = input.trim().match(/^(\S+)\s+(.+)$/);
  if (!m) return null;
  const verb = m[1].toUpperCase();
  const arg = m[2].trim();

  if (verb === "THEME") {
    const t = ctx.themes.find((x) => startsWith(x.id, arg) || startsWith(x.name, arg));
    return t ? { kind: "theme", id: t.id, label: `Switch theme → ${t.name}` } : null;
  }
  if (verb === "LAYOUT") {
    const l = ctx.layouts.find((x) => startsWith(x.id, arg) || startsWith(x.name, arg));
    return l ? { kind: "layout", id: l.id, label: `Open layout → ${l.name}` } : null;
  }
  if (verb === "GP") {
    const symbol = arg.toUpperCase();
    return ctx.hasInstrument(symbol) ? { kind: "chart", symbol, label: `GP ${symbol} → chart` } : null;
  }
  if (verb === "DES") {
    const d = ctx.docs.find((x) => x.kind === "dossier" && (x.designation?.toLowerCase().includes(arg.toLowerCase()) || x.title.toLowerCase().includes(arg.toLowerCase()) || x.slug.includes(arg.toLowerCase())));
    return d ? { kind: "dossier", slug: d.slug, label: `DES ${arg} → ${d.title}` } : null;
  }
  const panel = ctx.panels.find((p) => p.mnemonic === verb);
  if (!panel) return null;
  const props: Record<string, unknown> = {};
  const desk = ctx.desks.find((d) => d.short === arg.toUpperCase() || d.id === arg.toLowerCase());
  switch (panel.type) {
    case "wire":
    case "headlines":
    case "calendar":
      if (desk) props.desk = desk.id;
      break;
    case "chart": {
      const symbol = arg.toUpperCase();
      if (!ctx.hasInstrument(symbol)) return null;
      props.symbol = symbol;
      break;
    }
    case "quotes":
    case "indicators": {
      const symbols = arg.split(/[ ,]+/).map((s) => s.toUpperCase()).filter(ctx.hasInstrument);
      if (!symbols.length) return null;
      props.symbols = symbols;
      break;
    }
    case "reader":
    case "dossier": {
      const d = ctx.docs.find((x) => x.slug === arg.toLowerCase() || x.title.toLowerCase().includes(arg.toLowerCase()));
      if (!d) return null;
      props.slug = d.slug;
      break;
    }
    case "plot":
      props.area = arg.toLowerCase();
      break;
  }
  return { kind: "panel", type: panel.type, props, label: `${verb} ${arg} → add ${panel.name.toLowerCase()}` };
}
