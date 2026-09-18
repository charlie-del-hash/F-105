"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { site } from "@/config/site";
import { themes } from "@/design/tokens";
import { arrow, fmtNum, fmtPct } from "@/data/format";
import { getInstrument } from "@/data/instruments";
import { useQuotes } from "@/lib/useQuotes";
import { cn } from "@/lib/cn";
import { useWorkspace } from "@/layout-engine/store";

const nav = [
  { href: "/", label: "Desk" },
  { href: "/wire", label: "Wire" },
  { href: "/markets", label: "Markets" },
  { href: "/layouts", label: "Layouts" },
  { href: "/kit", label: "Kit" },
];

const strip = ["BRENT", "TTF", "JKM", "TD3C", "BDI", "EURUSD"];

function QuoteStrip() {
  const { quotes } = useQuotes(strip);
  return (
    <div className="hidden items-center gap-4 overflow-hidden font-data text-[11px] lg:flex">
      {strip.map((s) => {
        const q = quotes[s];
        const inst = getInstrument(s);
        const tone = q ? (q.change > 0 ? "text-up" : q.change < 0 ? "text-down" : "text-ink-2") : "text-ink-3";
        return (
          <Link key={s} href={`/markets/${s}`} className="tabular whitespace-nowrap hover:text-accent">
            <span className="text-ink-3">{s}</span> <span className="text-ink">{q ? fmtNum(q.last, inst?.decimals ?? 2) : "…"}</span>{" "}
            <span className={tone}>{q ? `${arrow(q.change)} ${fmtPct(q.changePct)}` : ""}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function Topbar({ onCommand }: { onCommand: () => void }) {
  const pathname = usePathname();
  const theme = useWorkspace((s) => s.theme);
  const setTheme = useWorkspace((s) => s.setTheme);
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex h-11 max-w-[1800px] items-center gap-3 px-3">
        <Link href="/" className="flex shrink-0 items-baseline gap-1.5 whitespace-nowrap">
          <span className="glow font-data text-base font-semibold tracking-tight text-accent">{site.name}</span>
          <span className="caps text-ink-3">{site.product}</span>
        </Link>
        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary">
          {nav.map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={cn("caps rounded-[var(--radius)] px-2 py-1 text-ink-3 hover:text-ink", active && "bg-bg-3 text-accent")}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mx-auto min-w-0 overflow-hidden">
          <QuoteStrip />
        </div>
        <button
          type="button"
          onClick={onCommand}
          className="flex h-7 shrink-0 items-center gap-2 whitespace-nowrap rounded-[var(--radius)] border border-line bg-bg-3 px-2 font-ui text-xs text-ink-3 hover:border-line-strong hover:text-ink"
        >
          <Search size={13} />
          <span className="hidden sm:inline">Search or command</span>
          <span className="kbd hidden sm:inline">⌘K</span>
        </button>
        <select
          aria-label="Theme"
          value={theme}
          onChange={(e) => setTheme(e.target.value as typeof theme)}
          className="h-7 shrink-0 rounded-[var(--radius)] border border-line bg-bg-3 px-1.5 font-ui text-xs text-ink-2 outline-none focus:border-accent"
        >
          {themes.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>
      <nav className="flex gap-3 overflow-x-auto border-t border-line px-3 py-1 md:hidden" aria-label="Primary (mobile)">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className={cn("caps whitespace-nowrap text-ink-3", (n.href === "/" ? pathname === "/" : pathname.startsWith(n.href)) && "text-accent")}>
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
