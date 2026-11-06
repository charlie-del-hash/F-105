/**
 * The film uses the app's fonts, self-hosted from npm like the app does.
 * Outside Next there is no next/font, so the theme's `--font-geist-sans`
 * hook is pointed at the fontsource family. Frames wait for the faces to load:
 * a frame rendered in a fallback font is a different picture.
 */
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource-variable/source-serif-4";
import "../../design/themes.css";
import { useLayoutEffect, useState } from "react";
import { useDelayRender } from "remotion";

const FACES = ["400 32px 'Geist Variable'", "400 32px 'IBM Plex Mono'", "500 32px 'IBM Plex Mono'", "400 32px 'Source Serif 4 Variable'"];

export function useFilmFonts() {
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => delayRender("Loading film fonts"));
  useLayoutEffect(() => {
    document.documentElement.style.setProperty("--font-geist-sans", "'Geist Variable'");
    document.documentElement.style.setProperty("--font-geist-mono", "'Geist Mono Variable'");
    Promise.all(FACES.map((f) => document.fonts.load(f)))
      .then(() => continueRender(handle))
      .catch((err) => cancelRender(err));
  }, [handle, continueRender, cancelRender]);
}
