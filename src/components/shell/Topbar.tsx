"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { site } from "@/config/site";
import { cn } from "@/lib/cn";
import { useSyncStatus } from "@/layout-engine/sync";
import { useScrollDirection } from "@/lib/useScrollDirection";
import { QuoteStrip } from "./QuoteStrip";
import { Roundel } from "./Roundel";
import { ThemePicker } from "./ThemePicker";

/** The site's own navigation. Workspace controls live in the strip below, on `/`.
 *  `/kit` is a contract page for building, not a destination — it is reachable from
 *  the status bar and from ⌘K. */
const nav = [
  { href: "/", label: "Desk" },
  { href: "/read", label: "Read" },
  { href: "/wire", label: "Wire" },
  { href: "/markets", label: "Markets" },
  { href: "/layouts", label: "Layouts" },
];

export function Topbar({ onCommand }: { onCommand: () => void }) {
  const pathname = usePathname();
  const sync = useSyncStatus((s) => s.state);
  const scroll = useScrollDirection();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  // The dashboard has a quote board in it; a ticker above it says the same twice.
  const showStrip = pathname !== "/";
  return (
    <header
      className={cn(
        "safe-t sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-md transition-transform duration-200 md:!translate-y-0",
        scroll === "down" && "-translate-y-full",
      )}
    >
      <div className="mx-auto flex h-11 max-w-[1800px] items-stretch gap-1 px-3">
        <Link href="/" className="mr-2 flex shrink-0 items-center gap-2 whitespace-nowrap text-accent">
          <Roundel />
          <span className="glow font-data text-lg font-semibold tracking-tight">{site.name}</span>
          <span className="caps mt-px hidden text-ink-3 sm:inline">{site.product}</span>
        </Link>
        <nav className="hidden items-stretch md:flex" aria-label="Primary">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="tab" aria-current={isActive(n.href) ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        {showStrip && (
          <div className="mx-3 hidden min-w-0 flex-1 items-center lg:flex">
            <QuoteStrip />
          </div>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onCommand}
            className="tap flex h-7 items-center gap-2 whitespace-nowrap rounded-[var(--radius)] border border-line bg-bg-3 px-2 font-ui text-xs text-ink-3 hover:border-line-strong hover:text-ink"
            aria-label="Open the command bar"
          >
            <Search size={13} />
            <span className="hidden sm:inline">Command</span>
            <span className="kbd hidden sm:inline">⌘K</span>
          </button>
          <Link
            href="/account"
            className="tap flex h-7 items-center gap-1.5 rounded-[var(--radius)] border border-line bg-bg-3 px-2 font-ui text-xs text-ink-3 hover:border-line-strong hover:text-ink"
            title="Account and sync"
            aria-label="Account and sync"
          >
            <span
              className={cn("led", sync === "synced" && "led-ok", sync === "error" && "led-alert", sync === "syncing" && "led-warn")}
              aria-hidden
            />
            <span className="hidden md:inline">{sync === "synced" ? "Synced" : "Account"}</span>
          </Link>
          <ThemePicker />
        </div>
      </div>
    </header>
  );
}
