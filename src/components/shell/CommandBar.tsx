"use client";
/**
 * The command line. ⌘K anywhere. Type a name, or a Bloomberg-style mnemonic —
 * see src/commands/mnemonics.ts for the grammar.
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { site } from "@/config/site";
import { panelCatalog } from "@/panels/catalog";
import { getInstrument } from "@/data/instruments";
import { isThemeChoice } from "@/design/tokens";
import { useWorkspace } from "@/layout-engine/store";
import { parseMnemonic, type Command as Mnemonic } from "@/commands/mnemonics";
import type { CommandIndex } from "@/content/loader";

interface Cmd {
  id: string;
  label: string;
  hint?: string;
  group: string;
  keywords?: string[];
  run: () => void;
}

const groups = ["Pages", "Actions", "Layouts", "Themes", "Instruments", "Content"];
const itemClass = "flex cursor-pointer items-baseline gap-2 rounded-[var(--radius)] px-2 py-1.5 font-ui text-sm text-ink data-[selected=true]:bg-bg-3 data-[selected=true]:text-accent";

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
  const runMnemonic = (m: Mnemonic) => {
    switch (m.kind) {
      case "theme":
        if (isThemeChoice(m.id)) setTheme(m.id);
        close();
        break;
      case "layout":
        setActive(m.id);
        go("/");
        break;
      case "chart":
        go(`/markets/${m.symbol}`);
        break;
      case "dossier":
        go(`/dossier/${m.slug}`);
        break;
      case "panel":
        addPanel(m.type, m.props);
        setEditMode(true);
        go("/");
        break;
    }
  };

  const commands = useMemo<Cmd[]>(() => {
    const out: Cmd[] = [];
    for (const p of [{ href: "/", label: "Desk" }, { href: "/read", label: "Read" }, { href: "/wire", label: "Wire" }, { href: "/markets", label: "Markets" }, { href: "/layouts", label: "Layouts" }, { href: "/kit", label: "Kit" }, { href: "/account", label: "Account" }]) {
      out.push({ id: `page:${p.href}`, label: p.label, group: "Pages", run: () => go(p.href) });
    }
    for (const d of site.desks) out.push({ id: `desk:${d.id}`, label: `${d.name} desk`, hint: d.blurb, group: "Pages", keywords: [d.short], run: () => go(`/desk/${d.id}`) });
    out.push({ id: "act:edit", label: editMode ? "Finish editing layout" : "Edit layout", group: "Actions", keywords: ["edit", "move", "resize"], run: () => { setEditMode(!editMode); go("/"); } });
    for (const p of panelCatalog) out.push({ id: `add:${p.type}`, label: `Add ${p.name.toLowerCase()} panel`, hint: p.description, group: "Actions", keywords: [p.mnemonic, "add", "panel"], run: () => { addPanel(p.type); setEditMode(true); go("/"); } });
    for (const l of index.layouts) out.push({ id: `layout:${l.id}`, label: `Layout · ${l.name}`, hint: l.description, group: "Layouts", keywords: ["layout"], run: () => { setActive(l.id); go("/"); } });
    for (const t of index.themes) out.push({ id: `theme:${t.id}`, label: `Theme · ${t.name}`, hint: t.tagline, group: "Themes", keywords: ["theme"], run: () => { if (isThemeChoice(t.id)) setTheme(t.id); close(); } });
    for (const i of index.instruments) out.push({ id: `inst:${i.symbol}`, label: `${i.symbol} · ${i.name}`, hint: `${i.group} · ${i.unit}`, group: "Instruments", keywords: [i.symbol, i.group], run: () => go(`/markets/${i.symbol}`) });
    for (const d of index.docs) out.push({ id: `doc:${d.slug}`, label: d.title, hint: `${d.kind} · ${d.desk}`, group: "Content", keywords: [d.kind, d.desk, ...d.tags, d.designation ?? ""], run: () => go(d.href) });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, editMode]);

  const mnemonic = useMemo(
    () =>
      parseMnemonic(q, {
        themes: index.themes,
        layouts: index.layouts,
        docs: index.docs,
        desks: site.desks.map((d) => ({ id: d.id, short: d.short })),
        panels: panelCatalog,
        hasInstrument: (s) => Boolean(getInstrument(s)),
      }),
    [q, index],
  );

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 p-3 pt-[12vh] backdrop-blur-[2px]" onClick={close} role="presentation">
      <Command label="Command bar" className="bezel w-full max-w-xl overflow-hidden" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.key === "Escape" && close()} loop>
        <div className="flex items-center gap-2 border-b border-line px-3">
          <span className="font-data text-accent" aria-hidden>›</span>
          <Command.Input autoFocus value={q} onValueChange={setQ} placeholder="Search, or type a mnemonic…" className="h-11 w-full bg-transparent font-data text-sm text-ink outline-none placeholder:text-ink-3" />
          <span className="kbd">esc</span>
        </div>
        <Command.List className="max-h-[50vh] overflow-auto p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-0.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:font-data [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-ink-3">
          <Command.Empty className="p-4 text-center font-ui text-xs text-ink-3">Nothing matches. Try a symbol, a title, or a mnemonic.</Command.Empty>
          {mnemonic && (
            <Command.Group heading="Command" forceMount>
              <Command.Item value={q} onSelect={() => runMnemonic(mnemonic)} forceMount className={itemClass}>
                <span className="kbd">GO</span> {mnemonic.label}
              </Command.Item>
            </Command.Group>
          )}
          {groups.map((g) => (
            <Command.Group key={g} heading={g}>
              {commands
                .filter((c) => c.group === g)
                .map((c) => (
                  <Command.Item key={c.id} value={`${c.label} ${c.hint ?? ""} ${(c.keywords ?? []).join(" ")}`} onSelect={c.run} className={itemClass}>
                    <span className="truncate">{c.label}</span>
                    {c.hint && <span className="ml-auto max-w-[45%] truncate text-meta text-ink-3">{c.hint}</span>}
                  </Command.Item>
                ))}
            </Command.Group>
          ))}
        </Command.List>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-3 py-2 font-data text-xs text-ink-3">
          <span><span className="text-ink-2">GP TTF</span> chart</span>
          <span><span className="text-ink-2">DES hormuz</span> dossier</span>
          <span><span className="text-ink-2">WIRE shp</span> add panel</span>
          <span><span className="text-ink-2">THEME paper</span></span>
          <span><span className="text-ink-2">LAYOUT bridge</span></span>
          <span className="ml-auto"><span className="kbd">↑↓</span> <span className="kbd">↵</span></span>
        </div>
      </Command>
    </div>
  );
}
