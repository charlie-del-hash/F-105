/** 30-point sparkline. Direction is also carried by the ▲/▼ glyph beside it, never by colour alone. */
export function Sparkline({
  values,
  width = 72,
  height = 20,
  tone = "neutral",
}: {
  values: number[];
  width?: number;
  height?: number;
  tone?: "up" | "down" | "neutral";
}) {
  if (values.length < 2) return <svg width={width} height={height} aria-hidden />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 2;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const stroke = tone === "up" ? "var(--up)" : tone === "down" ? "var(--down)" : "var(--ink-3)";
  const [ex, ey] = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="shrink-0">
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={ex} cy={ey} r={2.5} fill={stroke} stroke="var(--bg-2)" strokeWidth={1.5} />
    </svg>
  );
}
