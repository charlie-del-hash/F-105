"use client";
/**
 * The bezel around every panel. Header: grip (edit), LED, title, actions that
 * appear on hover. In edit mode the header takes focus and arrow keys move the
 * panel (shift + arrows resize), so the grid is usable without a mouse.
 */
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

const keys: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

export function PanelFrame({ panel, edit, mobile, style, onDragStart, onResizeStart, dragging }: Props) {
  const [settings, setSettings] = useState(false);
  const removePanel = useWorkspace((s) => s.removePanel);
  const nudgePanel = useWorkspace((s) => s.nudgePanel);
  const movePanel = useWorkspace((s) => s.movePanel);
  const resizePanel = useWorkspace((s) => s.resizePanel);
  const meta = panelMetaMap.get(panel.type);
  const title = panelTitle(panel);
  const href = panelHref(panel);
  const live = meta?.category === "markets";

  const onKey = (e: React.KeyboardEvent) => {
    if (!edit || mobile) return;
    const d = keys[e.key];
    if (!d) {
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removePanel(panel.id);
      }
      return;
    }
    e.preventDefault();
    if (e.shiftKey) resizePanel(panel.id, panel.w + d[0], panel.h + d[1]);
    else movePanel(panel.id, panel.x + d[0], panel.y + d[1]);
  };

  return (
    <section
      className={cn("panel bezel flex min-h-0 min-w-0 flex-col overflow-hidden", dragging && "z-20")}
      style={style}
      aria-label={title}
      data-panel-type={panel.type}
      data-editing={edit || undefined}
      data-dragging={dragging || undefined}
    >
      <header
        className={cn("panel-head flex h-[30px] shrink-0 items-center gap-1 border-b border-line pl-2 pr-1 select-none", edit && !mobile && "cursor-grab active:cursor-grabbing")}
        onPointerDown={edit && !mobile && onDragStart ? (e) => onDragStart(e, panel) : undefined}
        onKeyDown={onKey}
        tabIndex={edit && !mobile ? 0 : undefined}
        style={edit && !mobile ? { touchAction: "none" } : undefined}
        title={edit && !mobile ? "Drag to move · arrows move · shift+arrows resize · delete removes" : undefined}
      >
        {edit && !mobile && <GripVertical size={13} className="-ml-1 text-ink-3" aria-hidden />}
        <span className={cn("led", live ? "led-live" : "led-ok")} aria-hidden />
        <h3 className="caps ml-1 min-w-0 flex-1 truncate text-ink-2" title={title}>
          {title}
        </h3>
        <div className="panel-actions flex items-center" onPointerDown={(e) => e.stopPropagation()}>
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
              <IconButton size="xs" label="Remove panel" onClick={() => removePanel(panel.id)} className="hover:text-alert"><X size={13} /></IconButton>
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
