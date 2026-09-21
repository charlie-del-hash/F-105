#!/usr/bin/env node
/**
 * Builds the GitHub Pages demo.
 *
 * `output: "export"` cannot carry route handlers or a proxy, so this moves the
 * server-only files out of the source tree, runs the export, and puts them
 * back — the working tree is identical afterwards, pass or fail. The client
 * already falls back to the deterministic mock generator when
 * NEXT_PUBLIC_STATIC_DEMO=1, so the demo still ticks; it just has no live
 * sources, alerts or sign-in.
 *
 *   PAGES_BASE_PATH=/F-105 pnpm build:static   →  out/
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const stashDir = join(root, ".static-stash");

/** Source paths that cannot exist in a static export, and where they park. */
const serverOnly = [
  ["src/app/api", "app-api"],
  ["src/app/auth", "app-auth"],
  ["src/proxy.ts", "proxy.ts"],
];
const moved = [];

function stash() {
  mkdirSync(stashDir, { recursive: true });
  for (const [rel, parked] of serverOnly) {
    const from = join(root, rel);
    if (!existsSync(from)) continue;
    // Park outside src/ entirely: anything left under src/app is still a route.
    const to = join(stashDir, parked);
    rmSync(to, { recursive: true, force: true });
    renameSync(from, to);
    moved.push([to, from]);
  }
}

function restore() {
  for (const [to, from] of moved.reverse()) if (existsSync(to)) renameSync(to, from);
  moved.length = 0;
  rmSync(stashDir, { recursive: true, force: true });
}

process.on("exit", restore);
process.on("SIGINT", () => process.exit(130));
process.on("SIGTERM", () => process.exit(143));

try {
  stash();
  // tsconfig includes the default build's generated route types. Those still
  // reference the handlers just stashed, so drop them; next build regenerates.
  rmSync(join(root, ".next/dev/types"), { recursive: true, force: true });
  rmSync(join(root, ".next/types"), { recursive: true, force: true });
  execSync("node scripts/tokens-to-css.mjs", { cwd: root, stdio: "inherit" });
  execSync("next build", {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, STATIC_EXPORT: "1", NEXT_PUBLIC_STATIC_DEMO: "1" },
  });
  // GitHub Pages runs Jekyll by default, which drops directories starting with _.
  mkdirSync(join(root, "out"), { recursive: true });
  writeFileSync(join(root, "out", ".nojekyll"), "");
  console.log("\nStatic demo written to out/");
} finally {
  restore();
}
