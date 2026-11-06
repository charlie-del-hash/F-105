#!/usr/bin/env node
/**
 * Bake a terrain tile for the replay from real elevation and land-cover data.
 *
 *   node scripts/replay/fetch-terrain.mjs     # once: raw rasters into .cache/replay
 *   node scripts/replay/bake-terrain.mjs      # → public/replay/operation-bolo/terrain/<id>/
 *
 * Inputs (raw, gitignored, never committed):
 *   Copernicus DEM GLO-30 (30 m DSM)          .cache/replay/dem/
 *   ESA WorldCover 10 m 2021 v200 (classes)    .cache/replay/landcover/
 *
 * Outputs (small, committed, credited in content/replays/operation-bolo/credits.json):
 *   height.png    terrarium-encoded RGB heightmap: h = R·256 + G + B/256 − 32768 (m)
 *   normal.webp   object-space normals, x = east, y = up, z = south (three.js frame)
 *   albedo.webp   muted documentary colour from land cover, darkened in valleys
 *   terrain.json  bbox, sizes, height range, attribution
 *
 * Honesty: WorldCover is 2021. Built-up land is repainted as cropland so 2021
 * Hanoi sprawl does not appear in a 1967 film, and terrain.json says so.
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fromFile } from "geotiff";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cache = join(root, ".cache/replay");

/** Tiles to bake. The hero tile: Thud Ridge (Tam Dao) down to Phuc Yen and the Red River. */
const TILES = [
  {
    id: "thud-ridge",
    name: "Thud Ridge – Phuc Yen",
    bbox: { west: 105.25, east: 106.0, south: 21.0, north: 21.8 },
    dem: "dem/Copernicus_DSM_COG_10_N21_00_E105_00_DEM.tif",
    landcover: "landcover/ESA_WorldCover_10m_2021_v200_N21E105_Map.tif",
    textureWidth: 2048,
    heightWidth: 1024,
    /**
     * Water that did not exist in January 1967, repainted as the land it drowned.
     * Núi Cốc reservoir was built in the 1970s (begun 1972); Đại Lải (1959) stays.
     */
    anachronisms: [{ name: "Núi Cốc reservoir (1970s)", bbox: { west: 105.6, east: 105.78, south: 21.5, north: 21.66 }, from: 80, to: 40 }],
  },
];

/** ESA WorldCover class → muted sRGB. Built-up (50) deliberately reads as cropland. */
const PALETTE = {
  0: [132, 123, 85],
  10: [44, 58, 38], // tree cover
  20: [74, 84, 54], // shrubland
  30: [108, 112, 70], // grassland
  40: [132, 123, 85], // cropland — January paddies, dry and khaki
  50: [132, 123, 85], // built-up → suppressed (2021 data in a 1967 film)
  60: [143, 132, 104], // bare / sparse
  70: [220, 220, 220], // snow (none here)
  80: [47, 74, 82], // permanent water
  90: [90, 102, 80], // herbaceous wetland
  95: [52, 69, 46], // mangroves
  100: [108, 112, 70], // moss / lichen
};

const RAD = Math.PI / 180;
const EARTH = 6_371_008.8;

for (const tile of TILES) await bake(tile);

async function bake(tile) {
  const demPath = join(cache, tile.dem);
  const lcPath = join(cache, tile.landcover);
  for (const p of [demPath, lcPath]) {
    if (!existsSync(p)) {
      console.error(`missing ${p}\nrun: node scripts/replay/fetch-terrain.mjs`);
      process.exit(1);
    }
  }
  const { bbox } = tile;
  const midLat = (bbox.north + bbox.south) / 2;
  const ewMetres = (bbox.east - bbox.west) * RAD * EARTH * Math.cos(midLat * RAD);
  const nsMetres = (bbox.north - bbox.south) * RAD * EARTH;
  const texW = tile.textureWidth;
  const texH = Math.round((texW * nsMetres) / ewMetres);
  const hW = tile.heightWidth;
  const hH = Math.round((hW * nsMetres) / ewMetres);

  console.log(`${tile.id}: ${(ewMetres / 1000).toFixed(1)} × ${(nsMetres / 1000).toFixed(1)} km, texture ${texW}×${texH}, height ${hW}×${hH}`);

  // ---- elevation -----------------------------------------------------------
  const demImage = await (await fromFile(demPath)).getImage();
  const demWin = pixelWindow(demImage, bbox);
  const readDem = async (width, height) => {
    const [band] = await demImage.readRasters({ window: demWin, width, height, resampleMethod: "bilinear" });
    // A few hundred voids and quarry artefacts dip below sea level; nothing here truly does.
    return Float32Array.from(band, (v) => (Number.isFinite(v) && v > 0 ? v : 0));
  };
  const hTex = await readDem(texW, texH);
  const hGrid = await readDem(hW, hH);

  let minH = Infinity;
  let maxH = -Infinity;
  for (const v of hGrid) {
    if (v < minH) minH = v;
    if (v > maxH) maxH = v;
  }

  // ---- normals (object space: x east, y up, z south) ----------------------
  const dx = ewMetres / texW;
  const dz = nsMetres / texH;
  const normal = Buffer.alloc(texW * texH * 3);
  for (let y = 0; y < texH; y++) {
    for (let x = 0; x < texW; x++) {
      const hx = (at(hTex, texW, texH, x + 1, y) - at(hTex, texW, texH, x - 1, y)) / (2 * dx);
      const hz = (at(hTex, texW, texH, x, y + 1) - at(hTex, texW, texH, x, y - 1)) / (2 * dz);
      const nx = -hx;
      const ny = 1;
      const nz = -hz;
      const len = Math.hypot(nx, ny, nz);
      const i = (y * texW + x) * 3;
      normal[i] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      normal[i + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      normal[i + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
    }
  }

  // ---- land cover → colour, at 2× then downsampled by libvips --------------
  const lcImage = await (await fromFile(lcPath)).getImage();
  const lcWin = pixelWindow(lcImage, bbox);
  const lcW = texW * 2;
  const lcH = texH * 2;
  const [classes] = await lcImage.readRasters({ window: lcWin, width: lcW, height: lcH, resampleMethod: "nearest" });
  const lcRgb = Buffer.alloc(lcW * lcH * 3);
  const counts = {};
  const masks = (tile.anachronisms ?? []).map((a) => ({
    ...a,
    x0: Math.floor(((a.bbox.west - bbox.west) / (bbox.east - bbox.west)) * lcW),
    x1: Math.ceil(((a.bbox.east - bbox.west) / (bbox.east - bbox.west)) * lcW),
    y0: Math.floor(((bbox.north - a.bbox.north) / (bbox.north - bbox.south)) * lcH),
    y1: Math.ceil(((bbox.north - a.bbox.south) / (bbox.north - bbox.south)) * lcH),
    repainted: 0,
  }));
  for (let i = 0; i < classes.length; i++) {
    let c = classes[i];
    for (const m of masks) {
      if (c !== m.from) continue;
      const x = i % lcW;
      const y = (i - x) / lcW;
      if (x >= m.x0 && x < m.x1 && y >= m.y0 && y < m.y1) {
        c = m.to;
        m.repainted++;
      }
    }
    counts[c] = (counts[c] ?? 0) + 1;
    const rgb = PALETTE[c] ?? PALETTE[0];
    lcRgb[i * 3] = rgb[0];
    lcRgb[i * 3 + 1] = rgb[1];
    lcRgb[i * 3 + 2] = rgb[2];
  }
  const lc = await sharp(lcRgb, { raw: { width: lcW, height: lcH, channels: 3 } })
    .resize(texW, texH, { fit: "fill", kernel: "lanczos3" })
    .raw()
    .toBuffer();

  // ---- relief shading baked lightly into albedo ----------------------------
  // Valleys a little darker, spurs a little lighter: what an artist would paint
  // into a relief model so it reads under flat light too. Sun shading is not
  // baked — the scene lights it from the computed sun.
  const blurred = boxBlur(boxBlur(hTex, texW, texH, 8), texW, texH, 8);
  const albedo = Buffer.alloc(texW * texH * 3);
  for (let i = 0; i < texW * texH; i++) {
    const relief = hTex[i] - blurred[i];
    const valley = smoothstep(0, 60, -relief);
    const spur = smoothstep(0, 60, relief);
    const high = smoothstep(350, 1400, hTex[i]);
    let k = 1 - 0.28 * valley + 0.08 * spur;
    k *= 1 - 0.12 * high;
    const cool = 0.06 * high; // higher forest reads slightly bluer through haze
    albedo[i * 3] = clamp255(lc[i * 3] * k * (1 - cool));
    albedo[i * 3 + 1] = clamp255(lc[i * 3 + 1] * k);
    albedo[i * 3 + 2] = clamp255(lc[i * 3 + 2] * k * (1 + cool));
  }

  // ---- terrarium heightmap --------------------------------------------------
  const height = Buffer.alloc(hW * hH * 3);
  for (let i = 0; i < hW * hH; i++) {
    const v = hGrid[i] + 32768;
    const r = Math.floor(v / 256);
    const g = Math.floor(v - r * 256);
    const b = Math.floor((v - Math.floor(v)) * 256);
    height[i * 3] = r;
    height[i * 3 + 1] = g;
    height[i * 3 + 2] = b;
  }

  const out = join(root, "public/replay/operation-bolo/terrain", tile.id);
  mkdirSync(out, { recursive: true });
  await sharp(height, { raw: { width: hW, height: hH, channels: 3 } }).png({ compressionLevel: 9 }).toFile(join(out, "height.png"));
  await sharp(normal, { raw: { width: texW, height: texH, channels: 3 } }).webp({ quality: 92, smartSubsample: true }).toFile(join(out, "normal.webp"));
  await sharp(albedo, { raw: { width: texW, height: texH, channels: 3 } }).webp({ quality: 90, smartSubsample: true }).toFile(join(out, "albedo.webp"));

  const total = classes.length;
  const share = (c) => +(((counts[c] ?? 0) / total) * 100).toFixed(1);
  const manifest = {
    id: tile.id,
    name: tile.name,
    bbox,
    metres: { eastWest: Math.round(ewMetres), northSouth: Math.round(nsMetres) },
    texture: { width: texW, height: texH, metresPerPixel: +(ewMetres / texW).toFixed(2) },
    heightmap: { width: hW, height: hH, encoding: "terrarium", metresPerPixel: +(ewMetres / hW).toFixed(2) },
    elevation: { min: Math.round(minH), max: Math.round(maxH) },
    landcover: { trees: share(10), cropland: share(40), builtUpSuppressed: share(50), water: share(80) },
    notes: [
      "Elevation is a 2010s surface model (trees and buildings included), resampled; voids clamped to sea level.",
      "Land cover is 2021; built-up land is repainted as cropland so modern cities do not appear in 1967.",
      ...masks.map((m) => `${m.name}: water repainted as land (${((m.repainted / total) * 100).toFixed(2)} % of the tile).`),
    ],
    attribution: [
      "Copernicus DEM GLO-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018, provided under COPERNICUS by the European Union and ESA; all rights reserved",
      "ESA WorldCover 10 m 2021 v200 © ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium (CC BY 4.0)",
    ],
  };
  writeFileSync(join(out, "terrain.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`  elevation ${manifest.elevation.min}…${manifest.elevation.max} m · built-up suppressed ${share(50)} % · written to ${out}`);
}

/** The pixel window of a north-up GeoTIFF that covers a lon/lat bbox. */
function pixelWindow(image, bbox) {
  const [minX, minY, maxX, maxY] = image.getBoundingBox();
  const w = image.getWidth();
  const h = image.getHeight();
  const px = (lon) => Math.round(((lon - minX) / (maxX - minX)) * w);
  const py = (lat) => Math.round(((maxY - lat) / (maxY - minY)) * h);
  return [px(bbox.west), py(bbox.north), px(bbox.east), py(bbox.south)];
}

function at(a, w, h, x, y) {
  const cx = x < 0 ? 0 : x >= w ? w - 1 : x;
  const cy = y < 0 ? 0 : y >= h ? h - 1 : y;
  return a[cy * w + cx];
}

/** Separable box blur with clamped edges. */
function boxBlur(src, w, h, r) {
  const tmp = new Float32Array(w * h);
  const dst = new Float32Array(w * h);
  const n = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += at(src, w, h, k, y);
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = acc / n;
      acc += at(src, w, h, x + r + 1, y) - at(src, w, h, x - r, y);
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += at(tmp, w, h, x, k);
    for (let y = 0; y < h; y++) {
      dst[y * w + x] = acc / n;
      acc += at(tmp, w, h, x, y + r + 1) - at(tmp, w, h, x, y - r);
    }
  }
  return dst;
}

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function clamp255(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}
