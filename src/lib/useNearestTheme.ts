"use client";
import { useEffect, useState, type RefObject } from "react";
import { defaultTheme, isThemeId, type ThemeId } from "@/design/tokens";

/**
 * The theme actually in force for this element: the nearest `data-theme`
 * ancestor, rather than the choice held in the store.
 *
 * Those two are the same everywhere except the one place it matters. The theme
 * contact sheet on /kit scopes all six themes onto six nested wrappers so they
 * can be compared side by side; a component that asked the store would draw
 * every tile in the document's theme and the comparison would show nothing. The
 * store also holds a *choice* (which may be "auto") and not the resolved theme,
 * which only Shell knows.
 *
 * Only the id comes from the DOM — what it means is still typed data, looked up
 * through `tokens.ts`, never parsed back out of CSS.
 */
export function useNearestTheme(ref: RefObject<HTMLElement | null>): ThemeId {
  const [theme, setTheme] = useState<ThemeId>(defaultTheme);
  useEffect(() => {
    const read = () => {
      const id = (ref.current?.closest("[data-theme]") as HTMLElement | null)?.dataset.theme;
      setTheme((prev) => (isThemeId(id) && id !== prev ? id : prev));
    };
    read();
    // Shell swaps the root attribute when the theme changes; subtree catches a
    // scoped wrapper being added or re-themed under it.
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"], subtree: true });
    return () => mo.disconnect();
  }, [ref]);
  return theme;
}
