/** Number and date formatting for data surfaces. Tabular where it sits in a column. */
export function fmtNum(v: number, decimals = 2, opts: { compact?: boolean } = {}) {
  if (!Number.isFinite(v)) return "—";
  if (opts.compact && Math.abs(v) >= 10000) {
    return new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 }).format(v);
  }
  return new Intl.NumberFormat("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(v);
}

export function fmtSigned(v: number, decimals = 2) {
  if (!Number.isFinite(v)) return "—";
  const s = fmtNum(Math.abs(v), decimals);
  return v > 0 ? `+${s}` : v < 0 ? `−${s}` : s;
}

export function fmtPct(v: number, decimals = 2) {
  if (!Number.isFinite(v)) return "—";
  return `${fmtSigned(v, decimals)}%`;
}

/** Direction glyph so change never relies on colour alone. */
export function arrow(v: number) {
  return v > 0 ? "▲" : v < 0 ? "▼" : "▶";
}

export function fmtDate(d: Date | string, style: "short" | "long" | "iso" = "short") {
  const date = typeof d === "string" ? new Date(d) : d;
  if (style === "iso") return date.toISOString().slice(0, 10);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: style === "long" ? "numeric" : undefined,
    timeZone: "UTC",
  }).format(date);
}

export function fmtTime(d: Date | string, tz = "UTC") {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz }).format(date);
}

export function fmtDateTime(d: Date | string, tz = "UTC") {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${fmtDate(date)} ${fmtTime(date, tz)}Z`;
}
