"use client";
import { useSyncExternalStore } from "react";

/** A ticking clock without setState-in-effect. Returns null on the server and during hydration. */
export function useNow(ms = 1000): Date | null {
  const tick = useSyncExternalStore(
    (cb) => {
      const id = setInterval(cb, ms);
      return () => clearInterval(id);
    },
    () => Math.floor(Date.now() / ms),
    () => 0,
  );
  return tick === 0 ? null : new Date(tick * ms);
}
