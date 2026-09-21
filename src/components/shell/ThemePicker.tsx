"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { themes, type ThemeId } from "@/design/tokens";
import { useWorkspace } from "@/layout-engine/store";
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

/** Theme popover: swatch, name and what the theme is for. Replaces a native select. */
export function ThemePicker() {
  const theme = useWorkspace((s) => s.theme);
  const setTheme = useWorkspace((s) => s.setTheme);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = themes.find((t) => t.id === theme) ?? themes[0];

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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-7 shrink-0 items-center gap-2 rounded-[var(--radius)] border border-line bg-bg-3 pl-2 pr-1.5 font-ui text-xs text-ink-2 hover:border-line-strong hover:text-ink"
        title="Instrument theme"
      >
        <Swatch bg={current.bg} accent={current.accent} ink={current.ink} />
        <span className="hidden sm:inline">{current.name}</span>
        <ChevronDown size={12} className="text-ink-3" />
      </button>
      {open && (
        <div className="bezel menu absolute right-0 top-full z-40 mt-1 w-72" role="listbox" aria-label="Theme">
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              role="option"
              aria-selected={t.id === theme}
              className="menu-item"
              data-active={t.id === theme}
              onClick={() => {
                setTheme(t.id as ThemeId);
                setOpen(false);
              }}
            >
              <Swatch bg={t.bg} accent={t.accent} ink={t.ink} size={18} />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-ink">
                  {t.name} <span className="ml-1 font-data text-[10px] uppercase tracking-wider text-ink-3">{t.scheme}</span>
                </span>
                <span className="block truncate text-[11px] text-ink-3">{t.tagline}</span>
              </span>
              <Check size={14} className={cn("shrink-0 text-accent", t.id !== theme && "invisible")} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
