import { cn } from "@/lib/cn";

/** ● observed · ◌ synthetic. The quiet provenance cue that sits beside every symbol. */
export function LiveDot({ synthetic, provider, className }: { synthetic: boolean | undefined; provider?: string; className?: string }) {
  const title = synthetic === undefined ? "loading" : synthetic ? "synthetic demo series" : `observed · ${provider ?? "live"}`;
  return <span className={cn("dot", synthetic === false && "dot-live", className)} title={title} aria-label={title} role="img" />;
}
