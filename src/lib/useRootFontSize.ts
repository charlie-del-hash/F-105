"use client";
import { useEffect, useState } from "react";

/**
 * The document's root font size in px — 13.5 on Terminal, 15.75 on Glass.
 *
 * An SVG drawn in measured pixels cannot use rem for its labels, so anything
 * inside one has to convert by hand or it silently opts out of `--density` the
 * same way a `text-[10px]` class used to. Re-reads when `data-theme` changes,
 * which is exactly when the density does, and on resize to catch browser zoom.
 */
export function useRootFontSize(fallback = 15) {
  const [px, setPx] = useState(fallback);
  useEffect(() => {
    const read = () => {
      const v = parseFloat(getComputedStyle(document.documentElement).fontSize);
      if (Number.isFinite(v) && v > 0) setPx((prev) => (Math.abs(prev - v) < 0.01 ? prev : v));
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("resize", read);
    return () => {
      mo.disconnect();
      window.removeEventListener("resize", read);
    };
  }, []);
  return px;
}
