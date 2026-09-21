"use client";
import { useState } from "react";
import { site } from "@/config/site";
import { groupNames, instruments, type InstrumentGroup } from "@/data/instruments";
import { zoneNames } from "@/lib/zones";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { getPanelDefinition } from "@/panels/registry";
import type { Field as FieldSpec } from "@/panels/types";
import { useWorkspaceData } from "./data-context";
import { useWorkspace } from "./store";
import type { PanelInstance } from "./schema";

function CheckList({ options, value, onChange }: { options: { value: string; label: string; group?: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  const groups = Array.from(new Set(options.map((o) => o.group ?? "")));
  return (
    <div className="max-h-48 overflow-auto rounded-[var(--radius)] border border-line bg-bg-3 p-2">
      {groups.map((g) => (
        <div key={g} className="mb-1.5">
          {g && <div className="caps mb-0.5 text-ink-3">{g}</div>}
          {options
            .filter((o) => (o.group ?? "") === g)
            .map((o) => (
              <label key={o.value} className="flex cursor-pointer items-center gap-2 py-0.5 font-data text-[11.5px] text-ink-2 hover:text-ink">
                <input
                  type="checkbox"
                  checked={value.includes(o.value)}
                  onChange={(e) => onChange(e.target.checked ? [...value, o.value] : value.filter((v) => v !== o.value))}
                  className="accent-[var(--accent)]"
                />
                {o.label}
              </label>
            ))}
        </div>
      ))}
    </div>
  );
}

export function PanelSettings({ panel, onClose }: { panel: PanelInstance; onClose: () => void }) {
  const def = getPanelDefinition(panel.type);
  const { docs } = useWorkspaceData();
  const setPanelProps = useWorkspace((s) => s.setPanelProps);
  const setPanelTitle = useWorkspace((s) => s.setPanelTitle);
  const [title, setTitle] = useState(panel.title ?? "");
  const [draft, setDraft] = useState<Record<string, unknown>>({ ...panel.props });
  const [problem, setProblem] = useState<string | null>(null);
  if (!def) return null;

  const set = (k: string, v: unknown) => setDraft((d) => ({ ...d, [k]: v }));

  const render = (f: FieldSpec) => {
    const v = draft[f.key];
    switch (f.kind) {
      case "text":
        return <Input value={(v as string) ?? ""} onChange={(e) => set(f.key, e.target.value)} />;
      case "number":
        return <Input type="number" value={(v as number) ?? ""} onChange={(e) => set(f.key, e.target.value === "" ? undefined : Number(e.target.value))} />;
      case "boolean":
        return (
          <label className="flex h-8 items-center gap-2 font-data text-xs text-ink-2">
            <input type="checkbox" checked={Boolean(v)} onChange={(e) => set(f.key, e.target.checked)} className="accent-[var(--accent)]" /> {f.label}
          </label>
        );
      case "select":
        return (
          <Select value={(v as string) ?? ""} onChange={(e) => set(f.key, e.target.value)}>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        );
      case "desk":
        return (
          <Select value={(v as string) ?? ""} onChange={(e) => set(f.key, e.target.value || undefined)}>
            <option value="">All desks</option>
            {site.desks.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
        );
      case "slug": {
        const pool = panel.type === "dossier" ? docs.filter((d) => d.kind === "dossier") : docs.filter((d) => d.kind !== "dossier");
        return (
          <Select value={(v as string) ?? ""} onChange={(e) => set(f.key, e.target.value)}>
            {panel.type !== "dossier" && <option value="featured">Featured story</option>}
            {pool.map((d) => (
              <option key={d.slug} value={d.slug}>{d.title}</option>
            ))}
          </Select>
        );
      }
      case "symbols":
        return (
          <CheckList
            options={instruments.map((i) => ({ value: i.symbol, label: `${i.symbol} — ${i.name}`, group: groupNames[i.group as InstrumentGroup] }))}
            value={(v as string[]) ?? []}
            onChange={(list) => set(f.key, list)}
          />
        );
      case "zones":
        return <CheckList options={zoneNames.map((z) => ({ value: z, label: z }))} value={(v as string[]) ?? []} onChange={(list) => set(f.key, list)} />;
    }
  };

  const save = () => {
    // Drop undefined keys so schema defaults apply.
    const clean = Object.fromEntries(Object.entries(draft).filter(([, val]) => val !== undefined && val !== ""));
    const check = def.schema.safeParse(clean);
    if (!check.success) {
      setProblem(check.error.issues.map((i) => `${i.path.join(".") || "settings"}: ${i.message}`).join(" · "));
      return;
    }
    setPanelProps(panel.id, clean);
    setPanelTitle(panel.id, title.trim() || undefined);
    onClose();
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-3">
      <div className="caps text-ink-3">{def.meta.name} settings</div>
      <Field label="Title" hint="Leave empty for the automatic title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={def.defaultTitle(def.schema.parse(panel.props))} />
      </Field>
      {def.fields.map((f) => (
        <Field key={f.key} label={f.kind === "boolean" ? "" : f.label} hint={f.hint}>
          {render(f)}
        </Field>
      ))}
      {problem && <p className="m-0 border-l-2 border-alert bg-bg-3 px-2 py-1.5 font-ui text-xs text-ink-2">{problem}</p>}
      <div className="mt-auto flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="solid" onClick={save}>Save</Button>
      </div>
    </div>
  );
}
