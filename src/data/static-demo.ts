/**
 * Static demo mode. Set NEXT_PUBLIC_STATIC_DEMO=1 to build a version with no
 * server: the client computes quotes and series from the deterministic mock
 * generator instead of calling /api. Used for the GitHub Pages demo.
 *
 * The full app (Vercel) leaves this unset and keeps the real provider chain,
 * so live sources, alerts and Supabase auth all work.
 */
export const isStaticDemo = process.env.NEXT_PUBLIC_STATIC_DEMO === "1";
