"use client";
import { useEffect } from "react";
import { useReading } from "@/lib/reading";
import { useThemeOverride } from "@/lib/useThemeOverride";

/**
 * Wraps long-form content, carries the reader's type size as a data attribute,
 * and — while it is mounted — turns the "read on Paper" preference into a theme
 * override. Because the override lives only as long as this component, leaving a
 * reading page hands the theme straight back to the layout or to the reader's own
 * pick; Paper no longer follows you around the app.
 */
export function ReadingSurface({ children, className }: { children: React.ReactNode; className?: string }) {
  const size = useReading((s) => s.size);
  const paper = useReading((s) => s.paper);
  const setOverrideTheme = useThemeOverride((s) => s.setOverrideTheme);
  useEffect(() => {
    useReading.persist.rehydrate();
  }, []);
  useEffect(() => {
    setOverrideTheme(paper ? "paper" : null);
    return () => setOverrideTheme(null);
  }, [paper, setOverrideTheme]);
  return (
    <div data-readsize={size} className={className}>
      {children}
    </div>
  );
}
