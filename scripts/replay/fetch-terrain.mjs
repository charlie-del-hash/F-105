#!/usr/bin/env node
/**
 * Download the raw rasters the terrain bake needs into .cache/replay (gitignored).
 * Idempotent: a file that is already there is kept.
 *
 *   node scripts/replay/fetch-terrain.mjs
 *
 * Sources (both public, both on AWS open data, both reachable from the cloud sandbox):
 *   Copernicus DEM GLO-30   s3://copernicus-dem-30m      free use with attribution
 *   ESA WorldCover 2021     s3://esa-worldcover          CC BY 4.0
 *
 * Uses curl rather than fetch: Node's fetch ignores HTTPS_PROXY, curl honours it.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cache = join(root, ".cache/replay");

const glo30 = (lat, lon) => {
  const name = `Copernicus_DSM_COG_10_N${String(lat).padStart(2, "0")}_00_E${String(lon).padStart(3, "0")}_00_DEM`;
  return { url: `https://copernicus-dem-30m.s3.amazonaws.com/${name}/${name}.tif`, to: `dem/${name}.tif` };
};
const worldcover = (lat, lon) => {
  const name = `ESA_WorldCover_10m_2021_v200_N${String(lat).padStart(2, "0")}E${String(lon).padStart(3, "0")}_Map`;
  return { url: `https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/${name}.tif`, to: `landcover/${name}.tif` };
};

const files = [glo30(21, 105), worldcover(21, 105)];

for (const f of files) {
  const dest = join(cache, f.to);
  if (existsSync(dest) && statSync(dest).size > 0) {
    console.log(`✓ ${f.to} (cached)`);
    continue;
  }
  mkdirSync(dirname(dest), { recursive: true });
  console.log(`↓ ${f.url}`);
  execFileSync("curl", ["-sS", "-L", "--fail", "--retry", "3", "-o", dest, f.url], { stdio: "inherit" });
  console.log(`✓ ${f.to} ${(statSync(dest).size / 1e6).toFixed(1)} MB`);
}
