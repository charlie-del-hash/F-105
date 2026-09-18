"use client";
import { useEffect, useState } from "react";
import { site } from "@/config/site";
import { useNow } from "@/lib/useNow";
import { useWorkspace } from "@/layout-engine/store";
import { useSyncStatus } from "@/layout-engine/sync";
import type { DataStatus } from "@/data/providers";

export function StatusBar() {
  const theme = useWorkspace((s) => s.theme);
  const sync = useSyncStatus();
  const now = useNow();
  const utc = now ? now.toISOString().slice(11, 19) : "--:--:--";
  const [data, setData] = useState<DataStatus | null>(null);
  useEffect(() => {
    fetch("/api/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setData(j.data as DataStatus))
      .catch(() => {});
  }, []);
  const liveNames = data
    ? Array.from(new Set(data.adapters.filter((a) => a.configured && a.symbols.some((s) => data.live.includes(s))).map((a) => a.name.split(" ")[0])))
    : [];
  const degraded = data?.degraded?.length ?? 0;
  return (
    <footer className="mt-auto border-t border-line bg-bg-2">
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-4 gap-y-1 px-3 py-1 font-data text-[10.5px] text-ink-3">
        {data && data.live.length > 0 ? (
          <span className="flex items-center gap-1.5" title={`Live: ${data.live.join(", ")}`}>
            <span className="led led-ok" aria-hidden /> LIVE {data.live.length} · {liveNames.join(", ")} · SYNTHETIC {data.synthetic.length} · placeholder content
          </span>
        ) : (
          <span className="flex items-center gap-1.5" title={degraded ? `Configured but unreachable: ${data?.degraded?.join(", ")}` : undefined}>
            <span className={`led ${degraded ? "led-alert" : "led-warn"}`} aria-hidden /> DEMO DATA · synthetic series{degraded ? ` (${degraded} live sources unreachable)` : ""} · placeholder content
          </span>
        )}
        <span className="flex items-center gap-1.5" title={sync.detail}>
          <span className={`led ${sync.state === "synced" ? "led-ok" : sync.state === "error" ? "led-alert" : sync.state === "syncing" ? "led-warn" : ""}`} aria-hidden />
          {sync.state === "off" ? "LOCAL" : sync.state === "signed-out" ? "LOCAL · sign in to sync" : sync.state === "synced" ? `SYNCED ${sync.email ?? ""}` : sync.state.toUpperCase()}
        </span>
        <span className="tabular">UTC {utc}</span>
        <span>THEME {theme.toUpperCase()}</span>
        <span className="hidden sm:inline">{site.name} {site.product} v{site.version}</span>
        <span className="ml-auto hidden md:inline">{site.motto}</span>
      </div>
    </footer>
  );
}
