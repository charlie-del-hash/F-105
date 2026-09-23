#!/usr/bin/env node
/**
 * Render the PWA raster icons from the SVG sources.
 *
 * A manifest that offers only an SVG gets letterboxed or skipped by Android's
 * install prompt, and without a `maskable` entry the launcher pads the icon
 * inside its own shape. Run after changing either SVG:
 *
 *   node scripts/render-icons.mjs
 *
 * Uses whatever Playwright is on the machine — it is not a dependency of this
 * repo and should not become one for three files. Point PLAYWRIGHT_MODULE at it
 * if it is not resolvable by name:
 *
 *   PLAYWRIGHT_MODULE=/usr/lib/node_modules/playwright/index.mjs \
 *     node scripts/render-icons.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const jobs = [
  ["src/app/icon.svg", "public/icon-192.png", 192],
  ["src/app/icon.svg", "public/icon-512.png", 512],
  ["public/icon-maskable.svg", "public/icon-maskable-512.png", 512],
];

let chromium;
try {
  ({ chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright"));
} catch {
  console.error(
    "render-icons needs Playwright. Install it globally, or set PLAYWRIGHT_MODULE\n" +
      "to the package entry point. The committed PNGs are only out of date if you\n" +
      "changed one of the SVG sources.",
  );
  process.exit(1);
}

const browser = await chromium.launch();
for (const [src, out, size] of jobs) {
  const svg = readFileSync(resolve(root, src), "utf8");
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(
    `<!doctype html><style>html,body{margin:0;padding:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
    { waitUntil: "load" },
  );
  await page.screenshot({ path: resolve(root, out), omitBackground: false });
  await page.close();
  console.log(`${out}  ${size}×${size}`);
}
await browser.close();
