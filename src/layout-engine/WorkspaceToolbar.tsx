"use client";
import { useRef, useState } from "react";
import { Copy, Download, Pencil, Plus, Trash2, Upload, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { panelCatalog } from "@/panels/catalog";
import { presetLayouts } from "./presets";
import { useWorkspace, selectActiveLayout } from "./store";

export function WorkspaceToolbar() {
  const layout = useWorkspace(selectActiveLayout);
  const mine = useWorkspace((s) => s.layouts);
  const edit = useWorkspace((s) => s.editMode);
  const setEditMode = useWorkspace((s) => s.setEditMode);
  const setActive = useWorkspace((s) => s.setActive);
  const addPanel = useWorkspace((s) => s.addPanel);
  const forkPreset = useWorkspace((s) => s.forkPreset);
  const deleteLayout = useWorkspace((s) => s.deleteLayout);
  const renameLayout = useWorkspace((s) => s.renameLayout);
  const importLayout = useWorkspace((s) => s.importLayout);
  const createLayout = useWorkspace((s) => s.createLayout);
  const [addOpen, setAddOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ ...layout, preset: false }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${layout.id}.layout.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const onImport = async (file?: File) => {
    if (!file) return;
    try {
      importLayout(JSON.parse(await file.text()));
    } catch (e) {
      alert(`Could not import: ${(e as Error).message}`);
    }
  };
  const rename = () => {
    const name = prompt("Layout name", layout.name);
    if (name) renameLayout(layout.id, name);
  };

  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5">
      <Select value={layout.id} onChange={(e) => setActive(e.target.value)} className="h-7 w-auto min-w-40 text-xs" aria-label="Layout">
        <optgroup label="Presets">
          {presetLayouts.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </optgroup>
        {mine.length > 0 && (
          <optgroup label="Mine">
            {mine.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </optgroup>
        )}
      </Select>
      <span className="hidden max-w-md truncate font-ui text-xs text-ink-3 md:inline" title={layout.description}>{layout.description}</span>

      <div className="ml-auto flex flex-wrap items-center gap-1">
        <div className="relative">
          <Button size="sm" variant="outline" onClick={() => setAddOpen((o) => !o)} aria-expanded={addOpen}>
            <Plus size={13} /> Add panel
          </Button>
          {addOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setAddOpen(false)} aria-hidden />
              <div className="bezel absolute right-0 z-40 mt-1 w-72 p-1">
                {(["markets", "content", "geo", "tools"] as const).map((cat) => (
                  <div key={cat}>
                    <div className="caps px-2 pb-0.5 pt-2 text-ink-3">{cat}</div>
                    {panelCatalog
                      .filter((p) => p.category === cat)
                      .map((p) => (
                        <button
                          key={p.type}
                          type="button"
                          onClick={() => {
                            addPanel(p.type);
                            setEditMode(true);
                            setAddOpen(false);
                          }}
                          className="flex w-full items-start gap-2 rounded-[var(--radius)] px-2 py-1.5 text-left hover:bg-bg-3"
                        >
                          <span className="kbd mt-0.5 w-11 shrink-0 text-center">{p.mnemonic}</span>
                          <span>
                            <span className="block font-ui text-xs font-medium text-ink">{p.name}</span>
                            <span className="block font-ui text-[11px] leading-snug text-ink-2">{p.description}</span>
                          </span>
                        </button>
                      ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <Button size="sm" variant={edit ? "solid" : "outline"} onClick={() => setEditMode(!edit)} aria-pressed={edit}>
          {edit ? <Check size={13} /> : <Pencil size={13} />} {edit ? "Done" : "Edit"}
        </Button>
        {layout.preset ? (
          <Button size="sm" variant="ghost" onClick={() => forkPreset(layout.id)} title="Make an editable copy"><Copy size={13} /> Duplicate</Button>
        ) : (
          <>
            <Button size="sm" variant="ghost" onClick={rename} title="Rename"><Pencil size={13} /></Button>
            <Button size="sm" variant="ghost" onClick={() => confirm(`Delete “${layout.name}”?`) && deleteLayout(layout.id)} title="Delete layout" className="hover:text-alert"><Trash2 size={13} /></Button>
          </>
        )}
        <Button size="sm" variant="ghost" onClick={exportJson} title="Export layout as JSON"><Download size={13} /></Button>
        <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()} title="Import layout JSON"><Upload size={13} /></Button>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => onImport(e.target.files?.[0])} />
        <span className="hidden sm:inline-flex">
          <Button size="sm" variant="ghost" onClick={() => createLayout(prompt("Name the new layout", "My desk") || "My desk")}>New</Button>
        </span>
      </div>
    </div>
  );
}
