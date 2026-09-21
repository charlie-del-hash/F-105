"use client";
import { BookOpen } from "lucide-react";
import { useReading, type ReadSize } from "@/lib/reading";
import { useWorkspace } from "@/layout-engine/store";
import { cn } from "@/lib/cn";

/** Type size and a one-tap switch to the Paper theme (and back). */
export function ReadingControls({ className }: { className?: string }) {
  const size = useReading((s) => s.size);
  const setSize = useReading((s) => s.setSize);
  const prevTheme = useReading((s) => s.prevTheme);
  const setPrevTheme = useReading((s) => s.setPrevTheme);
  const theme = useWorkspace((s) => s.theme);
  const setTheme = useWorkspace((s) => s.setTheme);
  const onPaper = theme === "paper";
  const togglePaper = () => {
    if (onPaper) {
      setTheme(prevTheme && prevTheme !== "paper" ? prevTheme : "terminal");
      setPrevTheme(null);
    } else {
      setPrevTheme(theme);
      setTheme("paper");
    }
  };
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="seg" role="group" aria-label="Type size">
        {(["S", "M", "L"] as ReadSize[]).map((s) => (
          <button key={s} type="button" aria-pressed={s === size} onClick={() => setSize(s)} className="!min-w-7">
            {s}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={togglePaper}
        aria-pressed={onPaper}
        className={cn("flex h-7 items-center gap-1.5 rounded-[var(--radius)] border px-2 font-ui text-xs", onPaper ? "border-accent text-accent" : "border-line text-ink-2 hover:border-line-strong hover:text-ink")}
        title={onPaper ? "Back to the previous theme" : "Switch to the Paper theme for reading"}
      >
        <BookOpen size={13} /> {onPaper ? "Leave Paper" : "Read on Paper"}
      </button>
    </div>
  );
}
