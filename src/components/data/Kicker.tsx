import { cn } from "@/lib/cn";

/**
 * The metadata line above a headline: `AIR · ARTICLE · 16 SEPT`, with an optional
 * coloured status word. Replaces rows of bordered tags — quieter, and it reads as one line.
 */
export function Kicker({
  items,
  status,
  right,
  wrap = false,
  className,
}: {
  items: (React.ReactNode | undefined | null | false)[];
  status?: { label: string; tone: "warn" | "alert" | "accent" | "up" | "down" };
  right?: React.ReactNode;
  /** Wrap onto more lines instead of truncating. For headers, where nothing may be lost. */
  wrap?: boolean;
  className?: string;
}) {
  const parts = items.filter((x): x is React.ReactNode => x !== undefined && x !== null && x !== false && x !== "");
  const tones = { warn: "text-warn", alert: "text-alert", accent: "text-accent", up: "text-up", down: "text-down" };
  return (
    <div className={cn("flex min-w-0 max-w-full items-baseline gap-2 font-data text-xs uppercase tracking-[0.12em] text-ink-3", className)}>
      <span className={cn("min-w-0", wrap ? "[text-wrap:pretty]" : "truncate")}>
        {parts.map((p, i) => (
          <span key={i}>
            {i > 0 && <span className="mx-1.5 text-ink-3/60">·</span>}
            {p}
          </span>
        ))}
        {status && (
          <span className={cn("font-semibold", tones[status.tone])}>
            <span className="mx-1.5 text-ink-3/60">·</span>
            {status.label}
          </span>
        )}
      </span>
      {right && <span className="ml-auto shrink-0 tabular normal-case tracking-normal">{right}</span>}
    </div>
  );
}
