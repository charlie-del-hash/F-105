"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Pin } from "lucide-react";
import { AUTO, resolveTheme, themes, type ThemeChoice } from "@/design/tokens";
import { useActiveLayout, useWorkspace } from "@/layout-engine/store";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { cn } from "@/lib/cn";

function Swatch({ bg, accent, ink, size = 14 }: { bg: string; accent: string; ink: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full border border-line-strong"
      style={{ width: size, height: size, background: `conic-gradient(from 200deg, ${accent} 0 30%, ${ink} 30% 38%, ${bg} 38% 100%)` }}
    />
  );
}

/** Themes grouped by what they are for, rather than a flat list of six moods. */
const groups: { label: string; ids: string[] }[] = [
  { label: "Desk", ids: ["terminal", "cockpit"] },
  { label: "Scope", ids: ["phosphor", "bridge"] },
  { label: "Reading", ids: ["paper"] },
  { label: "Phone", ids: ["glass"] },
];

export function ThemePicker() {
  const choice = useWorkspace((s) => s.theme);
  const pinned = useWorkspace((s) => s.themePinned);
  const setTheme = useWorkspace((s) => s.setTheme);
  const unpinTheme = useWorkspace((s) => s.unpinTheme);
  const layout = useActiveLayout();
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // What is actually on screen, and therefore what the trigger should show.
  const applied = pinned ? resolveTheme(choice, prefersDark) : layout.theme ?? resolveTheme(choice, prefersDark);
  const current = themes.find((t) => t.id === applied) ?? themes[0];
  const autoResolved = themes.find((t) => t.id === resolveTheme(AUTO, prefersDark));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const pick = (id: ThemeChoice) => {
    setTheme(id);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="tap flex h-7 shrink-0 items-center gap-2 rounded-panel border border-line bg-bg-3 pl-2 pr-1.5 font-ui text-xs text-ink-2 hover:border-line-strong hover:text-ink"
        title={pinned ? `${current.name} · pinned` : `${current.name} · following the layout`}
      >
        <Swatch bg={current.bg} accent={current.accent} ink={current.ink} />
        <span className="hidden sm:inline">{current.name}</span>
        {pinned && <Pin size={10} className="hidden text-ink-3 sm:inline" aria-hidden />}
        <ChevronDown size={12} className="text-ink-3" />
      </button>
      {open && (
        <div className="bezel menu absolute right-0 top-full z-40 mt-1 w-72" role="listbox" aria-label="Theme">
          <button
            type="button"
            role="option"
            aria-selected={pinned && choice === AUTO}
            className="menu-item"
            data-active={pinned && choice === AUTO}
            onClick={() => pick(AUTO)}
          >
            {autoResolved && <Swatch bg={autoResolved.bg} accent={autoResolved.accent} ink={autoResolved.ink} size={18} />}
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-ink">Auto</span>
              <span className="block truncate text-meta text-ink-3">
                Follows the system · {autoResolved?.name} right now
              </span>
            </span>
            <Check size={14} className={cn("shrink-0 text-accent", !(pinned && choice === AUTO) && "invisible")} />
          </button>

          {groups.map((g) => (
            <div key={g.label}>
              <div className="menu-sep" />
              <div className="caps px-2 pb-1 pt-1.5 text-ink-3">{g.label}</div>
              {g.ids.map((id) => {
                const t = themes.find((x) => x.id === id);
                if (!t) return null;
                const selected = pinned && choice === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className="menu-item"
                    data-active={selected}
                    onClick={() => pick(t.id as ThemeChoice)}
                  >
                    <Swatch bg={t.bg} accent={t.accent} ink={t.ink} size={18} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-ink">{t.name}</span>
                      <span className="block truncate text-meta text-ink-3">{t.tagline}</span>
                    </span>
                    <Check size={14} className={cn("shrink-0 text-accent", !selected && "invisible")} />
                  </button>
                );
              })}
            </div>
          ))}

          <div className="menu-sep" />
          {/* Layouts declare a theme; picking one here takes it back off them. */}
          {pinned ? (
            <button type="button" className="menu-item" onClick={() => { unpinTheme(); setOpen(false); }}>
              <Pin size={13} className="shrink-0 text-ink-3" />
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-ink">Follow the layout instead</span>
                <span className="block truncate text-meta text-ink-3">Each layout picks its own instrument</span>
              </span>
            </button>
          ) : (
            <div className="px-2 py-1.5 text-meta text-ink-3">
              Following “{layout.name}”. Pick a theme to pin it.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
