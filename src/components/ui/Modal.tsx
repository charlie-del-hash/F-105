"use client";
/**
 * The one modal. Overlay, bezel card, Escape and backdrop close, focus moves
 * into the card. Everything that pops over the page (dialogs, keyboard help)
 * uses this, so they all feel like the same object.
 */
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./Button";

export function Modal({
  open,
  onClose,
  title,
  kicker,
  children,
  footer,
  width = "md",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  kicker?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "sm" | "md" | "lg";
  className?: string;
}) {
  const card = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    // Prefer a real field; never open with the close button ringed.
    const field = card.current?.querySelector<HTMLElement>("input, textarea, select");
    (field ?? card.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 backdrop-blur-[2px] sm:items-start sm:pt-[14vh]" onClick={onClose} role="presentation">
      <div
        ref={card}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn("bezel flex max-h-[85vh] w-full flex-col overflow-hidden outline-none", widths[width], className)}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || kicker) && (
          <div className="flex items-start gap-3 border-b border-line px-4 py-3">
            <div className="min-w-0 flex-1">
              {kicker && <div className="caps text-ink-3">{kicker}</div>}
              {title && <h2 className="font-ui text-base font-semibold leading-tight text-ink">{title}</h2>}
            </div>
            <IconButton size="xs" label="Close" onClick={onClose}><X size={14} /></IconButton>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-auto px-4 py-3">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}
