import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { defaultTheme, themes } from "@/design/tokens";

// The manifest is fixed content; marking it static lets the GitHub Pages
// export emit it as a file (and costs the server build nothing).
export const dynamic = "force-static";

/**
 * Next prefixes the `<link rel="manifest">` href with basePath by itself, but
 * nothing inside the manifest body — so on GitHub Pages, served under
 * /<repo>/, a `start_url` of "/" pointed at the domain root and the icons
 * 404ed. Same variable next.config.ts reads.
 */
const base = process.env.PAGES_BASE_PATH ?? "";
const at = (path: string) => `${base}${path}`;

/**
 * The splash and the OS chrome before the app boots. A static manifest cannot
 * know which theme the reader has, so this is the default theme's background;
 * once the app is running, Shell keeps <meta name="theme-color"> in step with
 * the theme actually on screen.
 */
const chrome = themes.find((t) => t.id === defaultTheme)?.bg ?? "#0b0b0d";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: at("/"),
    name: `${site.name} ${site.product}`,
    short_name: site.name,
    description: site.description,
    lang: "en",
    start_url: at("/"),
    scope: at("/"),
    display: "standalone",
    orientation: "any",
    background_color: chrome,
    theme_color: chrome,
    icons: [
      // SVG first for anything that will take it, then the raster sizes an
      // install prompt insists on, then the maskable one so a launcher masks
      // the artwork to its own shape instead of padding a square inside it.
      { src: at("/icon.svg"), sizes: "any", type: "image/svg+xml" },
      { src: at("/icon-192.png"), sizes: "192x192", type: "image/png", purpose: "any" },
      { src: at("/icon-512.png"), sizes: "512x512", type: "image/png", purpose: "any" },
      { src: at("/icon-maskable-512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
