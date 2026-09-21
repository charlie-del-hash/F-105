"use client";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Copy, Download, Plus, Trash2, Upload } from "lucide-react";
import { presetLayouts } from "@/layout-engine/presets";
import { useWorkspace } from "@/layout-engine/store";
import type { Layout } from "@/layout-engine/schema";
import { Button } from "@/components/ui/Button";
import { dialogs } from "@/components/ui/dialogs";
import { Tag } from "@/components/ui/Tag";
import { Kicker } from "@/components/data/Kicker";
import { LayoutThumb } from "@/components/content/LayoutThumb";

function Card({ layout }: { layout: Layout }) {
  const router = useRouter();
  const activeId = useWorkspace((s) => s.activeId);
  const setActive = useWorkspace((s) => s.setActive);
  const forkPreset = useWorkspace((s) => s.forkPreset);
  const deleteLayout = useWorkspace((s) => s.deleteLayout);
  const open = () => {
    setActive(layout.id);
    router.push("/");
  };
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ ...layout, preset: false }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${layout.id}.layout.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <li className="bezel flex flex-col p-3">
      <button type="button" onClick={open} className="inset mb-3 flex items-center justify-center p-2 text-left hover:border-line-strong" aria-label={`Open ${layout.name}`}>
        <LayoutThumb layout={layout} width={200} />
      </button>
      <div className="flex items-center gap-2">
        <h3 className="font-ui text-sm font-semibold text-ink">{layout.name}</h3>
        {activeId === layout.id && <Tag tone="up">active</Tag>}
      </div>
      <Kicker className="mt-0.5" items={[layout.preset ? "preset" : "mine", layout.theme && `${layout.theme} theme`, `${layout.panels.length} panels`]} />
      <p className="mt-1 flex-1 font-ui text-xs leading-snug text-ink-2">{layout.description || "No description yet."}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        <Button size="xs" variant="solid" onClick={open}>Open</Button>
        {layout.preset ? (
          <Button size="xs" variant="ghost" onClick={() => { forkPreset(layout.id); router.push("/"); }}><Copy size={12} /> Duplicate</Button>
        ) : (
          <Button size="xs" variant="ghost" className="hover:text-alert" onClick={async () => { if (await dialogs.confirm({ title: `Delete “${layout.name}”?`, body: "Export it first if you want a copy.", confirm: "Delete", danger: true })) deleteLayout(layout.id); }}><Trash2 size={12} /> Delete</Button>
        )}
        <Button size="xs" variant="ghost" onClick={exportJson}><Download size={12} /> JSON</Button>
      </div>
    </li>
  );
}

export function LayoutGallery() {
  const router = useRouter();
  const mine = useWorkspace((s) => s.layouts);
  const importLayout = useWorkspace((s) => s.importLayout);
  const createLayout = useWorkspace((s) => s.createLayout);
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="solid" onClick={async () => { const name = await dialogs.prompt({ title: "New layout", label: "Name", defaultValue: "My desk", confirm: "Create" }); if (name) { createLayout(name); router.push("/"); } }}><Plus size={13} /> New blank layout</Button>
        <Button onClick={() => fileRef.current?.click()}><Upload size={13} /> Import JSON</Button>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { importLayout(JSON.parse(await f.text())); router.push("/"); } catch (err) { dialogs.confirm({ title: "Could not import", body: (err as Error).message, confirm: "OK" }); } }} />
        <span className="font-ui text-xs text-ink-3">Layouts are JSON. Edit one by hand, or ask Claude to write one — see docs/LAYOUTS.md.</span>
      </div>
      <h2 className="caps mb-2 text-ink-3">Presets</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {presetLayouts.map((l) => <Card key={l.id} layout={l} />)}
      </ul>
      <h2 className="caps mb-2 mt-8 text-ink-3">Mine</h2>
      {mine.length === 0 ? (
        <p className="font-ui text-sm text-ink-3">Nothing yet. Duplicate a preset, or edit one on the desk and it forks automatically.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mine.map((l) => <Card key={l.id} layout={l} />)}
        </ul>
      )}
    </div>
  );
}
