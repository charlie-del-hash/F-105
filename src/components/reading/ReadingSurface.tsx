"use client";
import { useEffect } from "react";
import { useReading } from "@/lib/reading";

/** Wraps long-form content and carries the reader's type size as a data attribute. */
export function ReadingSurface({ children, className }: { children: React.ReactNode; className?: string }) {
  const size = useReading((s) => s.size);
  useEffect(() => {
    useReading.persist.rehydrate();
  }, []);
  return (
    <div data-readsize={size} className={className}>
      {children}
    </div>
  );
}
