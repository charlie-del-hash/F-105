"use client";
/**
 * Real terrain from a baked tile (scripts/replay/bake-terrain.mjs): a grid mesh
 * displaced by the Copernicus heightmap, coloured by the land-cover albedo and
 * shaded by an object-space normal map at twice the mesh's resolution.
 *
 * The mesh is built in lat/lon space and every vertex goes through the scene's
 * LocalFrame, so the tile sits exactly where airfields and tracks say it does.
 * The shader adds three things a stock material cannot: Earth curvature
 * relative to the camera, shadows of the undercast (the same cloud field the
 * deck draws), and aerial perspective.
 */
import { useLayoutEffect, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { assetUrl, REPLAY_ROOT } from "../assets";
import type { LocalFrame } from "../geo";
import { useAtmosphere } from "./atmosphere";
import { DECK_GLSL, HAZE_GLSL, NOISE_GLSL } from "./glsl";

export interface TerrainManifest {
  id: string;
  name: string;
  bbox: { west: number; east: number; south: number; north: number };
  heightmap: { width: number; height: number; encoding: "terrarium" };
  texture: { width: number; height: number };
  elevation: { min: number; max: number };
  attribution: string[];
  notes: string[];
}

export interface TerrainData {
  manifest: TerrainManifest;
  heights: Float32Array;
  albedo: THREE.Texture;
  normal: THREE.Texture;
}

/** Loads terrain.json, decodes the terrarium heightmap exactly, and loads both textures. */
export class TerrainLoader extends THREE.Loader<TerrainData> {
  load(url: string, onLoad: (data: TerrainData) => void, _onProgress?: (e: ProgressEvent) => void, onError?: (err: unknown) => void): void {
    loadTerrain(url).then(onLoad, (err) => (onError ? onError(err) : console.error(err)));
  }
}

async function loadTerrain(manifestUrl: string): Promise<TerrainData> {
  const res = await fetch(manifestUrl);
  if (!res.ok) throw new Error(`terrain manifest ${manifestUrl}: ${res.status}`);
  const manifest = (await res.json()) as TerrainManifest;
  const dir = manifestUrl.slice(0, manifestUrl.lastIndexOf("/") + 1);
  const [heights, albedo, normal] = await Promise.all([
    decodeTerrarium(`${dir}height.png`, manifest.heightmap.width, manifest.heightmap.height),
    new THREE.TextureLoader().loadAsync(`${dir}albedo.webp`),
    new THREE.TextureLoader().loadAsync(`${dir}normal.webp`),
  ]);
  albedo.colorSpace = THREE.SRGBColorSpace;
  normal.colorSpace = THREE.NoColorSpace;
  for (const t of [albedo, normal]) {
    t.anisotropy = 8;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
  }
  return { manifest, heights, albedo, normal };
}

/** h = R·256 + G + B/256 − 32768. Read without colour management so the bytes are the data. */
async function decodeTerrarium(url: string, width: number, height: number): Promise<Float32Array> {
  const blob = await (await fetch(url)).blob();
  const bitmap = await createImageBitmap(blob, { colorSpaceConversion: "none", premultiplyAlpha: "none" });
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2d canvas unavailable");
  ctx.drawImage(bitmap, 0, 0);
  const px = ctx.getImageData(0, 0, width, height).data;
  const out = new Float32Array(width * height);
  for (let i = 0; i < out.length; i++) out[i] = px[i * 4] * 256 + px[i * 4 + 1] + px[i * 4 + 2] / 256 - 32768;
  return out;
}

export function terrainUrl(id: string) {
  return assetUrl(`${REPLAY_ROOT}/terrain/${id}/terrain.json`);
}

export function Terrain({ id, frame, stride = 2 }: { id: string; frame: LocalFrame; stride?: number }) {
  const data = useLoader(TerrainLoader, terrainUrl(id));
  const atm = useAtmosphere();

  const geometry = useMemo(() => buildGeometry(data, frame, stride), [data, frame, stride]);
  useLayoutEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: data.albedo,
      normalMap: data.normal,
      normalMapType: THREE.ObjectSpaceNormalMap,
      roughness: 0.96,
      metalness: 0,
    });
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, atm);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vApWorld;")
        .replace(
          "#include <begin_vertex>",
          /* glsl */ `#include <begin_vertex>
          {
            // Terrain is built in world metres (identity model matrix): drop it with the Earth's curve.
            vec2 dc = transformed.xz - cameraPosition.xz;
            transformed.y -= dot(dc, dc) / (2.0 * 6371008.8);
          }`,
        )
        .replace("#include <project_vertex>", "#include <project_vertex>\nvApWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", `#include <common>\nvarying vec3 vApWorld;\n${NOISE_GLSL}\n${DECK_GLSL}\n${HAZE_GLSL}`)
        .replace(
          "#include <lights_fragment_end>",
          /* glsl */ `#include <lights_fragment_end>
          {
            // Shadow of the undercast: follow the sun ray up to the deck and ask the deck.
            float t = (uDeckTop - 120.0 - vApWorld.y) / max(uSunDir.y, 0.05);
            vec2 q = vApWorld.xz + uSunDir.xz * t;
            float shade = 1.0 - 0.82 * rp_deckAlpha(q);
            reflectedLight.directDiffuse *= shade;
            reflectedLight.directSpecular *= shade;
            reflectedLight.indirectDiffuse *= mix(1.0, 0.6, rp_deckAlpha(vApWorld.xz));
          }`,
        )
        .replace("#include <fog_fragment>", "gl_FragColor.rgb = rp_haze(gl_FragColor.rgb, vApWorld, cameraPosition);");
    };
    m.customProgramCacheKey = () => "rp-terrain-v1";
    return m;
  }, [data, atm]);
  useLayoutEffect(() => () => material.dispose(), [material]);

  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}

function buildGeometry({ manifest, heights }: TerrainData, frame: LocalFrame, stride: number) {
  const { width: hw, height: hh } = manifest.heightmap;
  const { west, east, south, north } = manifest.bbox;
  const gw = Math.floor((hw - 1) / stride) + 1;
  const gh = Math.floor((hh - 1) / stride) + 1;
  const pos = new Float32Array(gw * gh * 3);
  const uv = new Float32Array(gw * gh * 2);
  for (let j = 0; j < gh; j++) {
    const v = j / (gh - 1);
    const lat = north - v * (north - south);
    const row = Math.min(hh - 1, j * stride);
    for (let i = 0; i < gw; i++) {
      const u = i / (gw - 1);
      const lon = west + u * (east - west);
      const col = Math.min(hw - 1, i * stride);
      const [x, y, z] = frame.three({ lat, lon, alt: heights[row * hw + col] });
      const k = j * gw + i;
      pos[k * 3] = x;
      pos[k * 3 + 1] = y;
      pos[k * 3 + 2] = z;
      uv[k * 2] = u;
      uv[k * 2 + 1] = 1 - v;
    }
  }
  const index = new Uint32Array((gw - 1) * (gh - 1) * 6);
  let n = 0;
  for (let j = 0; j < gh - 1; j++) {
    for (let i = 0; i < gw - 1; i++) {
      const a = j * gw + i;
      const b = a + 1;
      const c = a + gw;
      const d = c + 1;
      index[n++] = a;
      index[n++] = c;
      index[n++] = b;
      index[n++] = b;
      index[n++] = c;
      index[n++] = d;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setIndex(new THREE.BufferAttribute(index, 1));
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

/**
 * Lowland beyond the baked tile, so a hole in the deck near the tile's edge
 * shows haze-softened country rather than the void. Sits just below sea level
 * so the tile always wins where both exist.
 */
export function GroundPlane({ colour = "#5d6142", size = 420_000 }: { colour?: string; size?: number }) {
  const atm = useAtmosphere();
  const geometry = useMemo(() => new THREE.PlaneGeometry(size, size, 128, 128).rotateX(-Math.PI / 2).translate(0, -30, 0), [size]);
  useLayoutEffect(() => () => geometry.dispose(), [geometry]);
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(colour), roughness: 1, metalness: 0 });
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, atm);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vApWorld;")
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          { vec2 dc = transformed.xz - cameraPosition.xz; transformed.y -= dot(dc, dc) / (2.0 * 6371008.8); }`,
        )
        .replace("#include <project_vertex>", "#include <project_vertex>\nvApWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", `#include <common>\nvarying vec3 vApWorld;\n${NOISE_GLSL}\n${DECK_GLSL}\n${HAZE_GLSL}`)
        .replace(
          "#include <lights_fragment_end>",
          `#include <lights_fragment_end>
          {
            float t = (uDeckTop - 120.0 - vApWorld.y) / max(uSunDir.y, 0.05);
            float shade = 1.0 - 0.82 * rp_deckAlpha(vApWorld.xz + uSunDir.xz * t);
            reflectedLight.directDiffuse *= shade;
            reflectedLight.indirectDiffuse *= mix(1.0, 0.6, rp_deckAlpha(vApWorld.xz));
          }`,
        )
        .replace("#include <fog_fragment>", "gl_FragColor.rgb = rp_haze(gl_FragColor.rgb, vApWorld, cameraPosition);");
    };
    m.customProgramCacheKey = () => "rp-ground-v1";
    return m;
  }, [atm, colour]);
  useLayoutEffect(() => () => material.dispose(), [material]);
  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}
