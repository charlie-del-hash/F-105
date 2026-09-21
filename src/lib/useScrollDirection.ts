"use client";
import { useSyncExternalStore } from "react";

let dir: "up" | "down" = "up";
let lastY = 0;
const listeners = new Set<() => void>();
let bound = false;

function bind() {
  if (bound || typeof window === "undefined") return;
  bound = true;
  lastY = window.scrollY;
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      const next = y < 80 ? "up" : y > lastY + 6 ? "down" : y < lastY - 6 ? "up" : dir;
      lastY = y;
      if (next !== dir) {
        dir = next;
        listeners.forEach((l) => l());
      }
    },
    { passive: true },
  );
}

/** "down" once the reader has scrolled past the top and is moving down; "up" otherwise. */
export function useScrollDirection() {
  return useSyncExternalStore(
    (cb) => {
      bind();
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => dir,
    () => "up" as const,
  );
}
