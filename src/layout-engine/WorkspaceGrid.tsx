"use client";
/**
 * Renders a Layout on the 12-column grid. In edit mode, panels drag by their
 * header and resize by their corner; positions snap to cells and the store
 * resolves collisions. Under 768px the same layout stacks into one column.
 */
import { useRef, useState } from "react";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useSize } from "@/lib/useSize";
import { GRID_COLS, GRID_GAP, ROW_HEIGHT } from "./constants";
import { gridHeight, readingOrder } from "./grid";
import { EmptyLayout } from "./EmptyLayout";
import { PanelFrame } from "./PanelFrame";
import { useWorkspace } from "./store";
import type { Layout, PanelInstance } from "./schema";

interface Drag {
  id: string;
  mode: "move" | "resize";
  startX: number;
  startY: number;
  origin: { x: number; y: number; w: number; h: number };
  last: { a: number; b: number };
}

export function WorkspaceGrid({ layout }: { layout: Layout }) {
  const edit = useWorkspace((s) => s.editMode);
  const movePanel = useWorkspace((s) => s.movePanel);
  const resizePanel = useWorkspace((s) => s.resizePanel);
  const mobile = useMediaQuery("(max-width: 767px)");
  const [ref, size] = useSize<HTMLDivElement>();
  const drag = useRef<Drag | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const colW = size.width > 0 ? (size.width - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS : 80;

  const begin = (mode: Drag["mode"]) => (e: React.PointerEvent, panel: PanelInstance) => {
    if (!edit) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { id: panel.id, mode, startX: e.clientX, startY: e.clientY, origin: { x: panel.x, y: panel.y, w: panel.w, h: panel.h }, last: { a: 0, b: 0 } };
    setDraggingId(panel.id);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const a = Math.round((e.clientX - d.startX) / (colW + GRID_GAP));
    const b = Math.round((e.clientY - d.startY) / (ROW_HEIGHT + GRID_GAP));
    if (a === d.last.a && b === d.last.b) return;
    d.last = { a, b };
    if (d.mode === "move") movePanel(d.id, d.origin.x + a, d.origin.y + b);
    else resizePanel(d.id, d.origin.w + a, d.origin.h + b);
  };
  const onUp = () => {
    drag.current = null;
    setDraggingId(null);
  };

  if (layout.panels.length === 0) return <EmptyLayout layout={layout} />;

  if (mobile) {
    return (
      <div className="flex flex-col gap-2">
        {readingOrder(layout.panels).map((p) => (
          <PanelFrame key={p.id} panel={p} edit={edit} mobile style={{ height: Math.max(180, Math.min(p.h * (ROW_HEIGHT + GRID_GAP), 560)) }} />
        ))}
      </div>
    );
  }

  const rows = gridHeight(layout.panels);
  return (
    <div
      ref={ref}
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
        gridAutoRows: `${ROW_HEIGHT}px`,
        gap: GRID_GAP,
        minHeight: rows * (ROW_HEIGHT + GRID_GAP),
        backgroundImage: edit
          ? `linear-gradient(to right, var(--line) 1px, transparent 1px), linear-gradient(to bottom, var(--line) 1px, transparent 1px)`
          : undefined,
        backgroundSize: edit ? `${colW + GRID_GAP}px ${ROW_HEIGHT + GRID_GAP}px` : undefined,
        backgroundPosition: edit ? `-1px -1px` : undefined,
      }}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {layout.panels.map((p) => (
        <PanelFrame
          key={p.id}
          panel={p}
          edit={edit}
          dragging={draggingId === p.id}
          style={{ gridColumn: `${p.x + 1} / span ${p.w}`, gridRow: `${p.y + 1} / span ${p.h}` }}
          onDragStart={begin("move")}
          onResizeStart={begin("resize")}
        />
      ))}
    </div>
  );
}
