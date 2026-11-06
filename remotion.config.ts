/**
 * Remotion config for the replay renders (CLI and Studio only; the Next app
 * does not read this file).
 *
 * - `@/` resolves to src/, as in the app.
 * - public/ is shared with Next, so staticFile("replay/…") and the site serve
 *   the same baked assets.
 * - GL: `swangle` (SwiftShader) by default, which works anywhere, including the
 *   cloud sandbox and CI. On a machine with a GPU pass `--gl=angle`.
 * - Browser: Remotion downloads its own Chrome Headless Shell, unless
 *   REMOTION_BROWSER points at one. The cloud sandbox blocks that download, so
 *   docs/REPLAY.md sets REMOTION_BROWSER to Playwright's headless shell there.
 */
import path from "node:path";
import { Config } from "@remotion/cli/config";

Config.setEntryPoint("remotion/index.ts");
Config.setPublicDir("public");
Config.setChromiumOpenGlRenderer("swangle");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setConcurrency(1);
if (process.env.REMOTION_BROWSER) Config.setBrowserExecutable(process.env.REMOTION_BROWSER);

Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: {
      ...(config.resolve?.alias as Record<string, string> | undefined),
      "@": path.join(process.cwd(), "src"),
    },
  },
}));
