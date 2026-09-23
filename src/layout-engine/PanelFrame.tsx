"use client";
/**
 * The bezel around every panel. The header comes from the shared CardHead, so
 * a panel and a panel-shaped block on a static page are the same chrome: grip
 * (edit), command mnemonic, title, actions that appear on hover. In edit mode
 * the header takes focus and arrow keys move the panel (shift + arrows resize),
 * so the grid is usable without a mouse.
 */
import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpRight, GripVertical, Settings2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useOverflow } from "@/lib/useOverflow";
import { IconButton } from "@/components/ui/Button";
import { CardHead } from "@/components/ui/Card";
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
  /** Body flows at its natural height instead of filling a fixed frame. */
  autoHeight?: boolean;
  style?: React.CSSProperties;
  onDragStart?: (e: React.PointerEvent, panel: PanelInstance) => void;
  onResizeStart?: (e: React.PointerEvent, panel: PanelInstance) => void;
  dragging?: boolean;
}

const keys: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

export function PanelFrame({ panel, edit, mobile, autoHeight, style, onDragStart, onResizeStart, dragging }: Props) {
  const [settings, setSettings] = useState(false);
  const [bodyRef, moreBelow] = useOverflow<HTMLDivElement>();
  const removePanel = useWorkspace((s) => s.removePanel);
  const nudgePanel = useWorkspace((s) => s.nudgePanel);
  const movePanel = useWorkspace((s) => s.movePanel);
  const resizePanel = useWorkspace((s) => s.resizePanel);
  const meta = panelMetaMap.get(panel.type);
  const title = panelTitle(panel);
  const href = panelHref(panel);
  // "WIRE | WIRE" reads as a stutter, so the slug is dropped when the title
  // already opens with it.
  const showMnemonic = !!meta && !title.toUpperCase().startsWith(meta.mnemonic.toUpperCase());

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
      {/* The slug is the panel's command mnemonic, not a lamp. A lamp on every
          panel says nothing; the mnemonic is the same token the command bar
          parses (⌘K → "GP BRENT"), so the chrome teaches the keyboard. Liveness
          is carried where it is actually known: the LiveDot beside each symbol
          and the provenance line in the panel footer. */}
      <CardHead
        className={cn("pl-2 pr-1", edit && !mobile && "cursor-grab active:cursor-grabbing")}
        slug={showMnemonic ? meta!.mnemonic : undefined}
        title={title}
        titleAttr={title}
        leading={edit && !mobile ? <GripVertical size={13} className="-ml-1 text-ink-3" aria-hidden /> : undefined}
        onPointerDown={edit && !mobile && onDragStart ? (e) => onDragStart(e, panel) : undefined}
        onKeyDown={onKey}
        tabIndex={edit && !mobile ? 0 : undefined}
        style={edit && !mobile ? { touchAction: "none" } : undefined}
        hint={edit && !mobile ? "Drag to move · arrows move · shift+arrows resize · delete removes" : undefined}
        actions={
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
        }
      />
      {/* Filling a fixed frame needs the absolute inner box; flowing at the
          panel's own height needs the body in normal flow, or it collapses. */}
      <div ref={autoHeight ? bodyRef : undefined} className={cn("relative min-h-0 flex-1", autoHeight && "overflow-auto")}>
        {autoHeight ? (
          <PanelRenderer panel={panel} edit={edit} />
        ) : (
          <div className="absolute inset-0 overflow-auto">
            <PanelRenderer panel={panel} edit={edit} />
          </div>
        )}
        {/* A capped panel that clips its last row needs to say so. */}
        {autoHeight && moreBelow && (
          <div
            aria-hidden
            className="pointer-events-none sticky bottom-0 -mt-8 h-8"
            style={{ background: "linear-gradient(to top, var(--bg-2), transparent)" }}
          />
        )}
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
