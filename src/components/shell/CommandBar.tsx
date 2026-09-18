"use client";
/**
 * The command line. ⌘K anywhere. Type a name, or a Bloomberg-style mnemonic:
 *   GP TTF        → chart TTF          QB           → add a quote board
 *   DES F-105     → find the dossier   THEME PAPER  → switch theme
 *   LAYOUT BRIDGE → open a layout      WIRE SHP     → shipping wire
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { site } from "@/config/site";
import { panelCatalog } from "@/panels/catalog";
import { getInstrument } from "@/data/instruments";
import { isThemeId } from "@/design/tokens";
import { useWorkspace } from "@/layout-engine/store";
import type { CommandIndex } from "@/content/loader";

interface Cmd {
  id: string;
  label: string;
  hint?: string;
  group: string;
  keywords?: string[];
  run: () => void;
}

export function CommandBar({ open, onClose, index }: { open: boolean; onClose: () => void; index: CommandIndex }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const setTheme = useWorkspace((s) => s.setTheme);
  const setActive = useWorkspace((s) => s.setActive);
  const addPanel = useWorkspace((s) => s.addPanel);
  const setEditMode = useWorkspace((s) => s.setEditMode);
  const editMode = useWorkspace((s) => s.editMode);

  const close = () => {
    setQ("");
    onClose();
  };
  const go = (href: string) => {
    close();
    router.push(href);
  };

  const commands = useMemo<Cmd[]>(() => {
    const out: Cmd[] = [];
    for (const p of [{ href: "/", label: "Desk" }, { href: "/wire", label: "Wire" }, { href: "/markets", label: "Markets" }, { href: "/layouts", label: "Layouts" }, { href: "/kit", label: "Kit" }]) {
      out.push({ id: `page:${p.href}`, label: p.label, group: "Pages", run: () => go(p.href) });
    }
    for (const d of site.desks) out.push({ id: `desk:${d.id}`, label: `${d.name} desk`, hint: d.blurb, group: "Pages", keywords: [d.short], run: () => go(`/desk/${d.id}`) });
    out.push({ id: "act:edit", label: editMode ? "Finish editing layout" : "Edit layout", group: "Actions", keywords: ["edit", "move", "resize"], run: () => { setEditMode(!editMode); go("/"); } });
    for (const p of panelCatalog) out.push({ id: `add:${p.type}`, label: `Add ${p.name.toLowerCase()} panel`, hint: p.description, group: "Actions", keywords: [p.mnemonic, "add", "panel"], run: () => { addPanel(p.type); setEditMode(true); go("/"); } });
    for (const l of index.layouts) out.push({ id: `layout:${l.id}`, label: `Layout · ${l.name}`, hint: l.description, group: "Layouts", keywords: ["layout"], run: () => { setActive(l.id); go("/"); } });
    for (const t of index.themes) out.push({ id: `theme:${t.id}`, label: `Theme · ${t.name}`, hint: t.tagline, group: "Themes", keywords: ["theme"], run: () => { if (isThemeId(t.id)) setTheme(t.id); close(); } });
    for (const i of index.instruments) out.push({ id: `inst:${i.symbol}`, label: `${i.symbol} · ${i.name}`, hint: `${i.group} · ${i.unit}`, group: "Instruments", keywords: [i.symbol, i.group], run: () => go(`/markets/${i.symbol}`) });
    for (const d of index.docs) out.push({ id: `doc:${d.slug}`, label: d.title, hint: `${d.kind} · ${d.desk}`, group: "Content", keywords: [d.kind, d.desk, ...d.tags, d.designation ?? ""], run: () => go(d.href) });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, editMode]);

  /** Mnemonic parsing: "GP TTF", "THEME PAPER", "LAYOUT BRIDGE", "DES F-105", "WIRE NRG". */
  const mnemonic = useMemo<Cmd | null>(() => {
    const m = q.trim().match(/^(\S+)\s+(.+)$/);
    if (!m) return null;
    const verb = m[1].toUpperCase();
    const arg = m[2].trim();
    if (verb === "THEME") {
      const t = index.themes.find((x) => x.id.startsWith(arg.toLowerCase()));
      return t ? { id: "mn", label: `Switch theme → ${t.name}`, group: "Command", run: () => { if (isThemeId(t.id)) setTheme(t.id); close(); } } : null;
    }
    if (verb === "LAYOUT") {
      const l = index.layouts.find((x) => x.id.startsWith(arg.toLowerCase()) || x.name.toLowerCase().startsWith(arg.toLowerCase()));
      return l ? { id: "mn", label: `Open layout → ${l.name}`, group: "Command", run: () => { setActive(l.id); go("/"); } } : null;
    }
    if (verb === "GP") {
      const inst = getInstrument(arg);
      return inst ? { id: "mn", label: `GP ${inst.symbol} → chart ${inst.name}`, group: "Command", run: () => go(`/markets/${inst.symbol}`) } : null;
    }
    if (verb === "DES") {
      const d = index.docs.find((x) => x.kind === "dossier" && (x.designation?.toLowerCase().includes(arg.toLowerCase()) || x.title.toLowerCase().includes(arg.toLowerCase())));
      return d ? { id: "mn", label: `DES ${arg} → ${d.title}`, group: "Command", run: () => go(d.href) } : null;
    }
    const panel = panelCatalog.find((p) => p.mnemonic === verb);
    if (panel) {
      const props: Record<string, unknown> = {};
      if (panel.type === "wire" || panel.type === "headlines" || panel.type === "calendar") {
        const desk = site.desks.find((d) => d.short === arg.toUpperCase() || d.id === arg.toLowerCase());
        if (desk) props.desk = desk.id;
      }
      if (panel.type === "chart") props.symbol = arg.toUpperCase();
      if (panel.type === "quotes" || panel.type === "indicators") props.symbols = arg.split(/[ ,]+/).map((s) => s.toUpperCase());
      if (panel.type === "reader" || panel.type === "dossier") props.slug = arg;
      if (panel.type === "plot") props.area = arg.toLowerCase();
      return { id: "mn", label: `${verb} ${arg} → add ${panel.name.toLowerCase()} panel`, group: "Command", run: () => { addPanel(panel.type, props); setEditMode(true); go("/"); } };
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, index]);

  if (!open) return null;
  const groups = ["Command", "Pages", "Actions", "Layouts", "Themes", "Instruments", "Content"];
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-3 pt-[12vh]" onClick={close} role="presentation">
      <Command
        label="Command bar"
        className="bezel w-full max-w-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && close()}
        loop
      >
        <div className="flex items-center gap-2 border-b border-line px-3">
          <span className="font-data text-accent" aria-hidden>›</span>
          <Command.Input autoFocus value={q} onValueChange={setQ} placeholder="Search, or type a mnemonic — GP TTF, THEME PAPER, DES F-105…" className="h-11 w-full bg-transparent font-data text-sm text-ink outline-none placeholder:text-ink-3" />
          <span className="kbd">esc</span>
        </div>
        <Command.List className="max-h-[50vh] overflow-auto p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-0.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:font-ui [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-ink-3">
          <Command.Empty className="p-4 text-center font-ui text-xs text-ink-3">Nothing matches. Try a symbol, a title, or a mnemonic.</Command.Empty>
          {mnemonic && (
            <Command.Group heading="Command" forceMount>
              <Command.Item value={q} onSelect={mnemonic.run} forceMount className="flex cursor-pointer items-center gap-2 rounded-[var(--radius)] px-2 py-1.5 font-ui text-sm text-ink data-[selected=true]:bg-bg-3 data-[selected=true]:text-accent">
                <span className="kbd">GO</span> {mnemonic.label}
              </Command.Item>
            </Command.Group>
          )}
          {groups
            .filter((g) => g !== "Command")
            .map((g) => (
              <Command.Group key={g} heading={g}>
                {commands
                  .filter((c) => c.group === g)
                  .map((c) => (
                    <Command.Item key={c.id} value={`${c.label} ${c.hint ?? ""} ${(c.keywords ?? []).join(" ")}`} onSelect={c.run} className="flex cursor-pointer items-baseline gap-2 rounded-[var(--radius)] px-2 py-1.5 font-ui text-sm text-ink data-[selected=true]:bg-bg-3 data-[selected=true]:text-accent">
                      <span className="truncate">{c.label}</span>
                      {c.hint && <span className="ml-auto max-w-[45%] truncate text-[11px] text-ink-3">{c.hint}</span>}
                    </Command.Item>
                  ))}
              </Command.Group>
            ))}
        </Command.List>
      </Command>
    </div>
  );
}
