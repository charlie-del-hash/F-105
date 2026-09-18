"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpRight, GripVertical, Settings2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "@/components/ui/Button";
import { ShareSheet } from "@/components/shell/ShareSheet";
import { panelMetaMap } from "@/panels/catalog";
import { PanelRenderer, panelHref, panelTitle } from "./PanelRenderer";
import { PanelSettings } from "./PanelSettings";
import { useWorkspace } from "./store";
import type { PanelInstance } from "./schema";

interface Props {
  panel: PanelInstance;
  edit: boolean;
  mobile?: boolean;
  style?: React.CSSProperties;
  onDragStart?: (e: React.PointerEvent, panel: PanelInstance) => void;
  onResizeStart?: (e: React.PointerEvent, panel: PanelInstance) => void;
  dragging?: boolean;
}

export function PanelFrame({ panel, edit, mobile, style, onDragStart, onResizeStart, dragging }: Props) {
  const [settings, setSettings] = useState(false);
  const removePanel = useWorkspace((s) => s.removePanel);
  const nudgePanel = useWorkspace((s) => s.nudgePanel);
  const meta = panelMetaMap.get(panel.type);
  const title = panelTitle(panel);
  const href = panelHref(panel);
  const live = meta?.category === "markets";

  return (
    <section
      className={cn("bezel flex min-h-0 min-w-0 flex-col overflow-hidden", dragging && "z-20 opacity-90 ring-1 ring-accent")}
      style={style}
      aria-label={title}
      data-panel-type={panel.type}
    >
      <header
        className={cn("flex h-8 shrink-0 items-center gap-1 border-b border-line px-1.5 select-none", edit && !mobile && "cursor-grab active:cursor-grabbing")}
        onPointerDown={edit && !mobile && onDragStart ? (e) => onDragStart(e, panel) : undefined}
        style={edit && !mobile ? { touchAction: "none" } : undefined}
      >
        {edit && !mobile && <GripVertical size={14} className="text-ink-3" aria-hidden />}
        <span className={cn("led ml-1", live ? "led-live" : "led-ok")} aria-hidden />
        <h3 className="caps ml-1.5 min-w-0 flex-1 truncate text-ink-2" title={title}>
          {title}
        </h3>
        <div className="flex items-center" onPointerDown={(e) => e.stopPropagation()}>
          {edit && mobile && (
            <>
              <IconButton size="xs" label="Move up" onClick={() => nudgePanel(panel.id, -1)}><ArrowUp size={13} /></IconButton>
              <IconButton size="xs" label="Move down" onClick={() => nudgePanel(panel.id, 1)}><ArrowDown size={13} /></IconButton>
            </>
          )}
          {href && !edit && (
            <Link href={href} className="inline-flex h-6 w-6 items-center justify-center rounded-[var(--radius)] text-ink-3 hover:bg-bg-3 hover:text-ink" aria-label="Open" title="Open">
              <ArrowUpRight size={13} />
            </Link>
          )}
          {!edit && <ShareSheet size="xs" title={title} path={href ?? "/"} />}
          {edit && (
            <>
              <IconButton size="xs" label="Settings" active={settings} onClick={() => setSettings((s) => !s)}><Settings2 size={13} /></IconButton>
              <IconButton size="xs" label="Remove panel" onClick={() => removePanel(panel.id)}><X size={13} /></IconButton>
            </>
          )}
        </div>
      </header>
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0 overflow-auto">
          <PanelRenderer panel={panel} edit={edit} />
        </div>
        {settings && (
          <div className="absolute inset-0 z-10 bg-bg-2">
            <PanelSettings panel={panel} onClose={() => setSettings(false)} />
          </div>
        )}
        {edit && !mobile && onResizeStart && (
          <button
            type="button"
            aria-label="Resize"
            onPointerDown={(e) => onResizeStart(e, panel)}
            className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize text-ink-3 hover:text-accent"
            style={{ touchAction: "none" }}
          >
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
              <path d="M15 1L1 15M15 8L8 15M15 13l-2 2" stroke="currentColor" strokeWidth="1.2" fill="none" />
            </svg>
          </button>
        )}
      </div>
    </section>
  );
}
