import { cn } from "@/lib/cn";

export function Tag({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: "neutral" | "accent" | "up" | "down" | "warn" | "alert"; className?: string }) {
  const tones = {
    neutral: "border-line text-ink-2",
    accent: "border-accent/50 text-accent",
    up: "border-up/50 text-up",
    down: "border-down/50 text-down",
    warn: "border-warn/50 text-warn",
    alert: "border-alert/60 text-alert",
  };
  return (
    <span className={cn("caps inline-flex items-center gap-1 rounded-panel border px-1.5 py-[1px]", tones[tone], className)}>{children}</span>
  );
}


export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full min-h-16 items-center justify-center p-4 text-center text-xs text-ink-3">{children}</div>;
}
