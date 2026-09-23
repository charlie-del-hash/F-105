"use client";
/**
 * What a blank layout shows instead of nothing: copy a preset, add one panel,
 * or import. The same actions the tabs offer, laid out so the first minute is obvious.
 */
import { useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { dialogs } from "@/components/ui/dialogs";
import { Kicker } from "@/components/data/Kicker";
import { LayoutThumb } from "@/components/content/LayoutThumb";
import { panelCatalog } from "@/panels/catalog";
import { presetLayouts } from "./presets";
import { useWorkspace } from "./store";
import type { Layout } from "./schema";

export function EmptyLayout({ layout }: { layout: Layout }) {
  const adoptPreset = useWorkspace((s) => s.adoptPreset);
  const addPanel = useWorkspace((s) => s.addPanel);
  const setEditMode = useWorkspace((s) => s.setEditMode);
  const importLayout = useWorkspace((s) => s.importLayout);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bezel px-4 py-6 md:px-8 md:py-8">
      <Kicker items={["Blank layout", layout.name]} />
      <h2 className="mt-2 font-ui text-2xl font-semibold tracking-tight text-ink">Start with a preset, or with one panel.</h2>
      <p className="mt-1 max-w-xl font-ui text-sm text-ink-2">Everything here is yours to rearrange afterwards. Press <span className="kbd">E</span> to edit, drag by the header, resize from the corner.</p>

      <section className="mt-6">
        <h3 className="caps mb-2 text-ink-3">Copy a preset</h3>
        <ul className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {presetLayouts.map((l) => (
            <li key={l.id} className="flex">
              <button type="button" onClick={() => adoptPreset(l.id)} className="row bezel flex h-full w-full flex-col items-stretch gap-2 p-2 text-left hover:border-line-strong">
                <span className="inset flex h-24 items-center justify-center overflow-hidden p-1.5"><LayoutThumb layout={l} width={140} /></span>
                <span className="font-ui text-xs font-medium text-ink">{l.name}</span>
                <span className="line-clamp-2 font-ui text-meta leading-snug text-ink-3">{l.description}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h3 className="caps mb-2 text-ink-3">Or add a first panel</h3>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {panelCatalog.map((p) => (
            <li key={p.type}>
              <button
                type="button"
                onClick={() => {
                  addPanel(p.type);
                  setEditMode(true);
                }}
                className="row bezel flex w-full items-start gap-3 p-3 text-left hover:border-line-strong"
              >
                <span className="kbd mt-0.5 w-12 shrink-0 text-center">{p.mnemonic}</span>
                <span className="min-w-0">
                  <span className="block font-ui text-xs font-medium text-ink">{p.name}</span>
                  <span className="block font-ui text-meta leading-snug text-ink-3">{p.description}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <Button onClick={() => fileRef.current?.click()}><Upload size={13} /> Import layout JSON</Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              importLayout(JSON.parse(await f.text()));
            } catch (err) {
              dialogs.confirm({ title: "Could not import", body: (err as Error).message, confirm: "OK" });
            }
          }}
        />
        <span className="font-ui text-xs text-ink-3">
          Or press <span className="kbd">⌘K</span> and type <span className="font-data text-ink">WIRE shp</span>, <span className="font-data text-ink">GP ttf</span>, <span className="font-data text-ink">PLOT hormuz</span>.
        </span>
      </div>
    </div>
  );
}
