"use client";
import { useState } from "react";
import { Share2 } from "lucide-react";
import { share, shareTargets } from "@/lib/share";
import { IconButton } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export function ShareSheet({ title, text, path, size = "sm", className }: { title: string; text?: string; path: string; size?: "xs" | "sm" | "md"; className?: string }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const run = async (id: (typeof shareTargets)[number]["id"]) => {
    try {
      const r = await share(id, { title, text, path });
      setNote(r === "copied" ? "Copied" : null);
      setTimeout(() => setNote(null), 1400);
    } catch {
      /* user dismissed the native sheet */
    }
    setOpen(false);
  };
  return (
    <div className={cn("relative", className)}>
      <IconButton size={size} label="Share" onClick={() => setOpen((o) => !o)} active={open}>
        <Share2 size={size === "xs" ? 13 : 15} />
      </IconButton>
      {note && <span className="caps absolute right-0 top-full mt-1 rounded-panel bg-accent px-1.5 py-0.5 text-accent-ink">{note}</span>}
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div className="bezel absolute right-0 top-full z-40 mt-1 w-56 p-1" role="menu">
            {shareTargets.map((t) => (
              <button key={t.id} type="button" role="menuitem" onClick={() => run(t.id)} className="block w-full rounded-panel px-2 py-1.5 text-left hover:bg-bg-3">
                <span className="block font-ui text-xs font-medium text-ink">{t.label}</span>
                <span className="block font-ui text-xs text-ink-3">{t.hint}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
