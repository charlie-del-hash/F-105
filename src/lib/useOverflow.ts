"use client";
import { useLayoutEffect, useRef, useState } from "react";

/**
 * Is this scroll container actually scrollable, and is there more below?
 *
 * A capped panel that clips its last row mid-sentence with no cue reads as
 * broken rather than as a scroll region, so the frame needs to know when to
 * show one. Returns [ref, hasMoreBelow].
 */
export function useOverflow<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [more, setMore] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // 1px of slack: sub-pixel layout can leave scrollHeight a hair over.
    const read = () => setMore(el.scrollHeight - el.clientHeight - el.scrollTop > 1);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    // Content can grow without the box resizing — a panel that finishes loading.
    const mo = new MutationObserver(read);
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    el.addEventListener("scroll", read, { passive: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
      el.removeEventListener("scroll", read);
    };
  }, []);
  return [ref, more] as const;
}
