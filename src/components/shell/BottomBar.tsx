"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutGrid, Radio, TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Phone navigation, in the thumb zone. The masthead used to carry a second nav
 * row duplicating the desktop one, which cost ~32px at the top of the screen and
 * put every destination as far from the thumb as it could be. Four destinations
 * only — Layouts stays in the workspace strip and in ⌘K.
 */
const items = [
  { href: "/", label: "Desk", Icon: LayoutGrid },
  { href: "/read", label: "Read", Icon: BookOpen },
  { href: "/wire", label: "Wire", Icon: Radio },
  { href: "/markets", label: "Markets", Icon: TrendingUp },
];

export function BottomBar() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <nav
      className="safe-b fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur-md md:hidden"
      aria-label="Primary (phone)"
    >
      <ul className="flex items-stretch">
        {items.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-12 flex-col items-center justify-center gap-0.5",
                  active ? "text-accent" : "text-ink-3",
                )}
              >
                {/* One accent, used as a line — the same cue the masthead tabs use. */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-5 top-0 h-[2px] rounded-b-[1px]",
                    active ? "bg-accent shadow-[0_0_8px_var(--glow)]" : "bg-transparent",
                  )}
                />
                <Icon size={17} aria-hidden />
                <span className="font-ui text-xs uppercase tracking-[0.1em]">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
