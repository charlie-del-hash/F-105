"use client";
import { BookOpen } from "lucide-react";
import { useReading, type ReadSize } from "@/lib/reading";
import { cn } from "@/lib/cn";

/** Type size and a one-tap switch to the Paper theme, for as long as you are reading. */
export function ReadingControls({ className }: { className?: string }) {
  const size = useReading((s) => s.size);
  const setSize = useReading((s) => s.setSize);
  const paper = useReading((s) => s.paper);
  const setPaper = useReading((s) => s.setPaper);
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
        onClick={() => setPaper(!paper)}
        aria-pressed={paper}
        className={cn(
          "tap flex h-7 items-center gap-1.5 rounded-[var(--radius)] border px-2 font-ui text-xs",
          paper ? "border-accent text-accent" : "border-line text-ink-2 hover:border-line-strong hover:text-ink",
        )}
        title={paper ? "Back to your own theme" : "Read this on the Paper theme"}
      >
        <BookOpen size={13} /> {paper ? "Leave Paper" : "Read on Paper"}
      </button>
    </div>
  );
}
