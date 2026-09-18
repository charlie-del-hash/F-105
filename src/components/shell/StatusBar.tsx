"use client";
import { site } from "@/config/site";
import { useNow } from "@/lib/useNow";
import { useWorkspace } from "@/layout-engine/store";

export function StatusBar() {
  const theme = useWorkspace((s) => s.theme);
  const now = useNow();
  const utc = now ? now.toISOString().slice(11, 19) : "--:--:--";
  return (
    <footer className="mt-auto border-t border-line bg-bg-2">
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-4 gap-y-1 px-3 py-1 font-data text-[10.5px] text-ink-3">
        <span className="flex items-center gap-1.5"><span className="led led-warn" aria-hidden /> DEMO DATA · synthetic series, placeholder content</span>
        <span className="tabular">UTC {utc}</span>
        <span>THEME {theme.toUpperCase()}</span>
        <span className="hidden sm:inline">{site.name} {site.product} v{site.version}</span>
        <span className="ml-auto hidden md:inline">{site.motto}</span>
      </div>
    </footer>
  );
}
