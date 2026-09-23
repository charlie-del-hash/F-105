"use client";
/**
 * The layout switcher, as tabs. Presets first, then the user's own; a "+" tab
 * for new/duplicate/import; the edit controls in a single cluster on the right.
 */
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Copy, Download, MoreHorizontal, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, IconButton } from "@/components/ui/Button";
import { dialogs } from "@/components/ui/dialogs";
import { panelCatalog } from "@/panels/catalog";
import { presetLayouts } from "./presets";
import { selectActiveLayout, useWorkspace } from "./store";

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && close();
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open, close]);
  return ref;
}

function Menu({ open, onClose, children, align = "right", className }: { open: boolean; onClose: () => void; children: React.ReactNode; align?: "left" | "right"; className?: string }) {
  const ref = useDismiss(open, onClose);
  if (!open) return null;
  return (
    <div ref={ref} className={cn("bezel menu absolute top-full z-40 mt-1", align === "right" ? "right-0" : "left-0", className)} role="menu">
      {children}
    </div>
  );
}

function AddPanelMenu() {
  const [open, setOpen] = useState(false);
  const addPanel = useWorkspace((s) => s.addPanel);
  const setEditMode = useWorkspace((s) => s.setEditMode);
  return (
    <div className="relative">
      <Button size="sm" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} title="Add a panel">
        <Plus size={13} /> <span className="hidden sm:inline">Panel</span>
      </Button>
      <Menu open={open} onClose={() => setOpen(false)} className="w-72">
        {(["markets", "content", "geo", "tools"] as const).map((cat, i) => (
          <div key={cat}>
            {i > 0 && <div className="menu-sep" />}
            <div className="caps px-2 pb-1 pt-1.5 text-ink-3">{cat}</div>
            {panelCatalog
              .filter((p) => p.category === cat)
              .map((p) => (
                <button
                  key={p.type}
                  type="button"
                  role="menuitem"
                  className="menu-item items-start"
                  onClick={() => {
                    addPanel(p.type);
                    setEditMode(true);
                    setOpen(false);
                  }}
                >
                  <span className="kbd mt-0.5 w-11 shrink-0 text-center">{p.mnemonic}</span>
                  <span className="min-w-0">
                    <span className="block font-medium text-ink">{p.name}</span>
                    <span className="block text-meta leading-snug text-ink-3">{p.description}</span>
                  </span>
                </button>
              ))}
          </div>
        ))}
      </Menu>
    </div>
  );
}

function download(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function LayoutTabs() {
  const layout = useWorkspace(selectActiveLayout);
  const mine = useWorkspace((s) => s.layouts);
  const edit = useWorkspace((s) => s.editMode);
  const setEditMode = useWorkspace((s) => s.setEditMode);
  const setActive = useWorkspace((s) => s.setActive);
  const forkPreset = useWorkspace((s) => s.forkPreset);
  const deleteLayout = useWorkspace((s) => s.deleteLayout);
  const renameLayout = useWorkspace((s) => s.renameLayout);
  const importLayout = useWorkspace((s) => s.importLayout);
  const createLayout = useWorkspace((s) => s.createLayout);
  const [plus, setPlus] = useState(false);
  const [more, setMore] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onImport = async (file?: File) => {
    if (!file) return;
    try {
      importLayout(JSON.parse(await file.text()));
    } catch (e) {
      dialogs.confirm({ title: "Could not import", body: (e as Error).message, confirm: "OK" });
    }
  };

  const all = [...presetLayouts, ...mine];

  // Shared by the desktop "+" popover and the phone layout sheet.
  const plusItems = (
    <>
      <button
        type="button"
        role="menuitem"
        className="menu-item"
        onClick={async () => {
          setPlus(false);
          const name = await dialogs.prompt({ title: "New layout", label: "Name", defaultValue: "My desk", confirm: "Create" });
          if (name) createLayout(name);
        }}
      >
        <Plus size={13} /> New blank layout
      </button>
      <button
        type="button"
        role="menuitem"
        className="menu-item"
        onClick={() => {
          if (layout.preset) forkPreset(layout.id);
          else importLayout({ ...layout, name: `${layout.name} copy` });
          setPlus(false);
        }}
      >
        <Copy size={13} /> Duplicate “{layout.name}”
      </button>
      <button
        type="button"
        role="menuitem"
        className="menu-item"
        onClick={() => {
          fileRef.current?.click();
          setPlus(false);
        }}
      >
        <Upload size={13} /> Import JSON…
      </button>
    </>
  );

  const Choice = ({ id, name, description }: { id: string; name: string; description: string }) => (
    <button
      type="button"
      role="tab"
      aria-selected={layout.id === id}
      title={description}
      onClick={() => setActive(id)}
    >
      {name}
    </button>
  );

  return (
    /* The workspace strip. The masthead above it is the site's navigation; this row
       is controls for the layout in front of you, so it is built from .seg and a
       label rather than from .tab — two rows of underlined tabs read as one
       confusing double nav. */
    <div className="mb-2 flex items-center gap-2 border-b border-line pb-1.5">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="caps hidden shrink-0 text-ink-3 lg:inline">Layout</span>

        <div className="seg hidden min-w-0 md:flex" role="tablist" aria-label="Layouts">
          {presetLayouts.map((l) => (
            <Choice key={l.id} id={l.id} name={l.name} description={l.description} />
          ))}
          {mine.length > 0 && <span className="mx-0.5 h-3.5 w-px shrink-0 bg-line-strong" aria-hidden />}
          {mine.map((l) => (
            <Choice key={l.id} id={l.id} name={l.name} description={l.description} />
          ))}
        </div>
        <div className="relative hidden md:block">
          <IconButton size="sm" label="New, duplicate or import a layout" onClick={() => setPlus((o) => !o)} aria-haspopup="menu" aria-expanded={plus}>
            <Plus size={14} />
          </IconButton>
          <Menu open={plus} onClose={() => setPlus(false)} align="left" className="w-60">
            {plusItems}
          </Menu>
        </div>

        {/* On a phone the six presets overflowed the row with no scroll cue and
            pushed the "+" off-screen. One named control, one sheet. */}
        <div className="relative min-w-0 md:hidden">
          <button
            type="button"
            onClick={() => setPlus((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={plus}
            className="tap flex min-w-0 items-center gap-1.5 rounded-panel border border-line bg-bg-3 px-2.5 font-ui text-xs text-ink"
          >
            <span className="caps shrink-0 text-ink-3">Layout</span>
            <span className="truncate font-medium">{layout.name}</span>
            <ChevronDown size={13} className="shrink-0 text-ink-3" />
          </button>
          <Menu open={plus} onClose={() => setPlus(false)} align="left" className="w-64">
            {all.map((l) => (
              <button
                key={l.id}
                type="button"
                role="menuitem"
                className="menu-item"
                data-active={l.id === layout.id}
                onClick={() => {
                  setActive(l.id);
                  setPlus(false);
                }}
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-ink">{l.name}</span>
                  <span className="block truncate text-meta text-ink-3">{l.description}</span>
                </span>
                <Check size={14} className={cn("shrink-0 text-accent", l.id !== layout.id && "invisible")} />
              </button>
            ))}
            <div className="menu-sep" />
            {plusItems}
          </Menu>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => onImport(e.target.files?.[0])} />

      <div className="flex shrink-0 items-center gap-1">
        <AddPanelMenu />
        <Button size="sm" variant={edit ? "solid" : "outline"} onClick={() => setEditMode(!edit)} aria-pressed={edit} title={edit ? "Finish editing" : "Edit layout"}>
          {edit ? <Check size={13} /> : <Pencil size={13} />} <span className="hidden sm:inline">{edit ? "Done" : "Edit"}</span>
        </Button>
        <div className="relative">
          <IconButton size="sm" label="Layout menu" onClick={() => setMore((o) => !o)} aria-haspopup="menu" aria-expanded={more}>
            <MoreHorizontal size={15} />
          </IconButton>
          <Menu open={more} onClose={() => setMore(false)} className="w-64">
            <div className="px-2 pb-1.5 pt-1">
              <div className="font-ui text-xs font-medium text-ink">{layout.name}</div>
              {layout.description && <div className="mt-0.5 font-ui text-meta leading-snug text-ink-3">{layout.description}</div>}
              {layout.preset && <div className="mt-1 font-data text-xs uppercase tracking-wider text-ink-3">Preset · edits fork a copy</div>}
            </div>
            <div className="menu-sep" />
            {!layout.preset && (
              <button type="button" role="menuitem" className="menu-item" onClick={async () => { setMore(false); const n = await dialogs.prompt({ title: "Rename layout", label: "Name", defaultValue: layout.name, confirm: "Rename" }); if (n) renameLayout(layout.id, n); }}>
                <Pencil size={13} /> Rename
              </button>
            )}
            <button type="button" role="menuitem" className="menu-item" onClick={() => { download(`${layout.id}.layout.json`, { ...layout, preset: false }); setMore(false); }}>
              <Download size={13} /> Export JSON
            </button>
            {!layout.preset && (
              <button type="button" role="menuitem" className="menu-item hover:text-alert" onClick={async () => { setMore(false); if (await dialogs.confirm({ title: `Delete “${layout.name}”?`, body: "This removes the layout from this device and, if you are signed in, from your account. Export it first if you want a copy.", confirm: "Delete", danger: true })) deleteLayout(layout.id); }}>
                <Trash2 size={13} /> Delete
              </button>
            )}
          </Menu>
        </div>
      </div>
    </div>
  );
}
