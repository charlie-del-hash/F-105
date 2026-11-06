/**
 * On-screen graphics for the film. These live inside a fixed 1920×1080
 * composition that the Player scales as one picture, so sizes here are in
 * composition pixels — the app's rem ladder (and its no-px rule) applies to the
 * app's chrome, not to type that is part of a frame of film.
 *
 * Colour comes from theme tokens only: the composition root pins a theme
 * (`data-theme="cockpit"`), so these read var(--ink), var(--accent) and so on.
 */
import type { CSSProperties, ReactNode } from "react";

const shadow = "0 1px 2px rgba(0,0,0,0.55), 0 0 18px rgba(0,0,0,0.25)";

/** ● documented · ◌ reconstructed — the house provenance dot, at film size. */
export function Provenance({ basis, size = 14 }: { basis: "documented" | "reconstructed"; size?: number }) {
  const style: CSSProperties = {
    display: "inline-block",
    width: size,
    height: size,
    borderRadius: "50%",
    verticalAlign: "-0.1em",
    border: `2px solid var(--ink)`,
    background: basis === "documented" ? "var(--ink)" : "transparent",
    opacity: 0.9,
  };
  return <span style={style} role="img" aria-label={basis === "documented" ? "documented" : "reconstructed"} />;
}

/** The kicker line: small caps, tracked, one line — AIR · BOLO · 2 JAN 1967. */
export function Kicker({ items, style }: { items: ReactNode[]; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-data)",
        fontSize: 22,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "var(--ink-2)",
        textShadow: shadow,
        ...style,
      }}
    >
      {items.map((it, i) => (
        <span key={i}>
          {i > 0 && <span style={{ margin: "0 0.6em", opacity: 0.6 }}>·</span>}
          {it}
        </span>
      ))}
    </div>
  );
}

/** Mission time, with a badge when the shot runs faster than real time. */
export function TimeCode({ hhmmss, rate = 1 }: { hhmmss: string; rate?: number }) {
  return (
    <div style={{ fontFamily: "var(--font-data)", color: "var(--ink)", textShadow: shadow, display: "flex", alignItems: "baseline", gap: 14 }}>
      <span style={{ fontSize: 46, fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" }}>{hhmmss}</span>
      <span style={{ fontSize: 22, color: "var(--ink-2)", letterSpacing: "0.12em" }}>L</span>
      {rate !== 1 && (
        <span style={{ fontSize: 20, color: "var(--ink)", border: "1px solid var(--ink-3)", padding: "2px 8px", letterSpacing: "0.08em" }}>×{rate}</span>
      )}
    </div>
  );
}

/** Lower third: who and what, the provenance dot first. */
export function LowerThird({ title, line, basis, opacity = 1 }: { title: string; line: string; basis: "documented" | "reconstructed"; opacity?: number }) {
  return (
    <div style={{ opacity, color: "var(--ink)", textShadow: shadow }}>
      <div style={{ fontFamily: "var(--font-data)", fontSize: 30, letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 14 }}>
        <Provenance basis={basis} size={16} />
        {title}
      </div>
      <div style={{ fontFamily: "var(--font-ui)", fontSize: 26, color: "var(--ink-2)", marginTop: 6 }}>{line}</div>
    </div>
  );
}

/** The honesty line. Always on screen; it is part of the picture, not a disclaimer page. */
export function HonestyLine({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-data)",
        fontSize: 18,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--ink-2)",
        textShadow: shadow,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <Provenance basis="reconstructed" size={12} />
      {children}
    </div>
  );
}

/** Narration as captions (no voice yet): serif, two lines at most, lower left. */
export function Narration({ text, opacity = 1 }: { text: string; opacity?: number }) {
  return (
    <div
      style={{
        opacity,
        maxWidth: 1000,
        fontFamily: "var(--font-read)",
        fontSize: 40,
        lineHeight: 1.3,
        color: "var(--ink)",
        textShadow: shadow,
        textWrap: "balance",
      }}
    >
      {text}
    </div>
  );
}
