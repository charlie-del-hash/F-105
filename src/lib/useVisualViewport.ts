"use client";
import { useSyncExternalStore } from "react";

export interface VisualViewport {
  /** Height of the area the reader can actually see, in CSS px. */
  height: number;
  /** How far the visual viewport has been pushed down the layout viewport. */
  offsetTop: number;
}

/**
 * What the reader can actually see, or null where the API is missing.
 *
 * `vh` measures the layout viewport — and so do `svh`, `lvh` and `dvh`, which
 * only track the browser's own chrome. On iOS the software keyboard does not
 * resize any of them: it overlays. So an overlay sized in `vh` keeps its full
 * height on a 390x844 phone whose visible area has shrunk to about 400px, and
 * anything below the fold sits behind the keyboard with no way to reach it.
 * `visualViewport` is the only thing that reports the shrink.
 */
let cached: VisualViewport | null = null;

function getSnapshot(): VisualViewport | null {
  const vv = typeof window === "undefined" ? null : window.visualViewport;
  if (!vv) return null;
  // useSyncExternalStore compares by identity, so the object may only be
  // rebuilt when a number actually moved or it re-renders forever.
  if (!cached || cached.height !== vv.height || cached.offsetTop !== vv.offsetTop) {
    cached = { height: vv.height, offsetTop: vv.offsetTop };
  }
  return cached;
}

function subscribe(onChange: () => void) {
  const vv = window.visualViewport;
  if (!vv) return () => {};
  // resize fires as the keyboard opens; scroll fires as iOS pans the visual
  // viewport around inside the layout one, which moves offsetTop.
  vv.addEventListener("resize", onChange);
  vv.addEventListener("scroll", onChange);
  return () => {
    vv.removeEventListener("resize", onChange);
    vv.removeEventListener("scroll", onChange);
  };
}

export function useVisualViewport(): VisualViewport | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
