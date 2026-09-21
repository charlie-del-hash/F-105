import { arrow, fmtNum, fmtPct, fmtSigned } from "@/data/format";
import { cn } from "@/lib/cn";

export type Tone = "up" | "down" | "flat";
export function toneOf(n: number | undefined | null): Tone {
  if (!n) return "flat";
  return n > 0 ? "up" : n < 0 ? "down" : "flat";
}
export const toneClass: Record<Tone, string> = { up: "text-up", down: "text-down", flat: "text-ink-2" };

/**
 * A signed change with its direction glyph, so direction never rides on colour alone.
 * `mode`: "abs" (+0.36), "pct" (+0.42%), "both" (+0.36 · +0.42%).
 */
export function Change({ value, pct, decimals = 2, mode = "abs", className }: { value: number; pct?: number; decimals?: number; mode?: "abs" | "pct" | "both"; className?: string }) {
  const tone = toneOf(mode === "pct" ? pct : value);
  const text =
    mode === "abs" ? fmtSigned(value, decimals) : mode === "pct" ? fmtPct(pct ?? 0) : `${fmtSigned(value, decimals)} (${fmtPct(pct ?? 0)})`;
  return (
    <span className={cn("tabular inline-flex items-baseline gap-1 whitespace-nowrap font-data", toneClass[tone], className)}>
      <span aria-hidden className="text-[0.7em]">{arrow(mode === "pct" ? (pct ?? 0) : value)}</span>
      <span>{text}</span>
    </span>
  );
}

/** A last price with its unit in muted ink. */
export function Price({ value, decimals = 2, unit, size = "md", className }: { value: number | undefined; decimals?: number; unit?: string; size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const sizes = { sm: "text-xs", md: "text-sm", lg: "text-xl", xl: "text-3xl" };
  return (
    <span className={cn("tabular font-data text-ink", sizes[size], className)}>
      {value === undefined ? <span className="text-ink-3">…</span> : fmtNum(value, decimals)}
      {unit && <span className="ml-1 text-[0.6em] text-ink-3">{unit}</span>}
    </span>
  );
}
