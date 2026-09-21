import type { NextConfig } from "next";

/**
 * Two builds from one source.
 *
 *  default        the full app: API routes, the Supabase session proxy, the
 *                 alert cron. This is what Vercel runs.
 *  STATIC_EXPORT  a serverless demo for GitHub Pages. `pnpm build:static`
 *                 removes the server-only routes first (scripts/static-export.mjs)
 *                 and the client falls back to the deterministic mock generator.
 */
const isStatic = process.env.STATIC_EXPORT === "1";
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = isStatic
  ? {
      output: "export",
      basePath: basePath || undefined,
      assetPrefix: basePath || undefined,
      images: { unoptimized: true },
      trailingSlash: true,
    }
  : {};

export default nextConfig;
