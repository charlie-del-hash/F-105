/**
 * Where a replay asset lives, in whichever runtime is asking.
 *
 * - Remotion Studio and renders serve `public/` themselves: `staticFile()`.
 * - The Next app (and the Player inside it) serves `public/` under the site's
 *   basePath — `/F-105` on GitHub Pages — which three.js loaders and fetch()
 *   do not add on their own. Without this, every texture 404s on Pages.
 */
import { getRemotionEnvironment, staticFile } from "remotion";

export const REPLAY_ROOT = "replay/operation-bolo";

export function assetUrl(path: string): string {
  const clean = path.replace(/^\/+/, "");
  const env = getRemotionEnvironment();
  if (env.isStudio || env.isRendering) return staticFile(clean);
  const base = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_BASE_PATH ?? "") : "";
  return `${base}/${clean}`;
}
