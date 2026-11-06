"use client";
/**
 * The undercast: a 2.5-D sea of cloud tops, drawn as a camera-dense grid
 * displaced by the deck height field in DECK_GLSL and lit per fragment from
 * that field's analytic gradient.
 *
 * Why not volumetric ray-marching: it costs minutes per frame on the CPU
 * renderer the drafts use, and a deck seen from above is a surface anyway.
 * What sells it here is cheap and exact: domes and crevices, a short march
 * towards the sun for self-shadowing, a forward-scattering rim when looking
 * into the light, holes whose edges sink and thin, and the same aerial
 * perspective as the ground. Everything is a function of world position and
 * the uniforms, so a frame renders the same in any order, on any machine.
 */
import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useAtmosphere } from "./atmosphere";
import { DECK_GLSL, HAZE_GLSL, NOISE_GLSL } from "./glsl";

/**
 * A square grid whose spacing grows with distance from the centre (sinh warp):
 * tens of metres between vertices near the centre, kilometres at the edge —
 * which sits beyond the horizon seen from altitude, so the deck has no rim.
 */
function warpedGrid(radius: number, segments: number, k = 5) {
  const n = segments + 1;
  const pos = new Float32Array(n * n * 3);
  const s = Math.sinh(k);
  const coord = (i: number) => (radius * Math.sinh(k * (i / segments * 2 - 1))) / s;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const o = (j * n + i) * 3;
      pos[o] = coord(i);
      pos[o + 1] = 0;
      pos[o + 2] = coord(j);
    }
  }
  const index = new Uint32Array(segments * segments * 6);
  let m = 0;
  for (let j = 0; j < segments; j++) {
    for (let i = 0; i < segments; i++) {
      const a = j * n + i;
      const b = a + 1;
      const c = a + n;
      const d = c + 1;
      index[m++] = a;
      index[m++] = c;
      index[m++] = b;
      index[m++] = b;
      index[m++] = c;
      index[m++] = d;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(index, 1));
  return g;
}

const vertexShader = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
uniform vec3 uCenter;
varying vec3 vWorld;
${NOISE_GLSL}
${DECK_GLSL}
void main() {
  vec2 xz = position.xz + uCenter.xz;
  float a = rp_deckAlpha(xz);
  float h = rp_deckHeight(xz, a, 2).x;
  vec3 world = vec3(xz.x, h, xz.y);
  vec2 dc = world.xz - cameraPosition.xz;
  world.y -= dot(dc, dc) / (2.0 * 6371008.8);
  vWorld = world;
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  #include <logdepthbuf_vertex>
}
`;

const fragmentShader = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uSkyColor;
uniform float uAmbient;
varying vec3 vWorld;
${NOISE_GLSL}
${DECK_GLSL}
${HAZE_GLSL}
void main() {
  #include <logdepthbuf_fragment>
  // The vertex dropped the surface for curvature; the field lives in flat world xz.
  vec2 xz = vWorld.xz;
  float a = rp_deckAlpha(xz);
  if (a < 0.004) discard;
  vec3 hd = rp_deckHeight(xz, a, 5);
  vec3 N = normalize(vec3(-hd.y, 1.0, -hd.z));
  vec3 L = normalize(uSunDir);
  vec3 toCam = cameraPosition - vWorld;
  vec3 V = normalize(toCam);

  // Self-shadow: a short march towards the sun across the height field.
  float shadow = 1.0;
  vec2 Lh = normalize(L.xz + vec2(1e-5));
  float rise = L.y / max(length(L.xz), 1e-3);
  for (int k = 1; k <= 5; k++) {
    float d = float(k) * float(k) * 45.0;
    float hq = rp_deckHeight(xz + Lh * d, a, 1).x;
    shadow *= mix(1.0, 0.5, smoothstep(-20.0, 25.0, hq - (hd.x + d * rise)));
  }

  float wrap = clamp((dot(N, L) + 0.18) / 1.18, 0.0, 1.0);
  float crevice = mix(0.6, 1.0, smoothstep(uDeckTop - 260.0, uDeckTop + 90.0, hd.x));
  // Radiometry matches three.js: radiance = irradiance × albedo / π, sky given as radiance.
  vec3 albedo = vec3(0.94, 0.935, 0.925);
  vec3 sky = uSkyColor * uAmbient * (0.55 + 0.45 * N.y);
  vec3 col = albedo * (uSunColor * uSunIntensity * wrap * shadow * RECIPROCAL_PI + sky) * crevice;

  // Forward scattering: rims and thin edges glow when looking into the light.
  float mu = dot(-V, L);
  float g = 0.65;
  float hg = (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * mu, 1.5) / 12.566;
  float thin = (1.0 - N.y) * 0.8 + (1.0 - a) * 1.2;
  col += uSunColor * uSunIntensity * hg * thin * 0.3;

  col = rp_haze(col, vWorld, cameraPosition);
  gl_FragColor = vec4(col, a);
}
`;

export function CloudDeck({
  center,
  radius = 260_000,
  segments = 448,
  ambient = 0.9,
}: {
  /** World x, z the dense part of the grid sits on: put it under the action. */
  center: readonly [number, number];
  radius?: number;
  segments?: number;
  ambient?: number;
}) {
  const atm = useAtmosphere();
  const geometry = useMemo(() => warpedGrid(radius, segments), [radius, segments]);
  useLayoutEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { ...atm, uCenter: { value: new THREE.Vector3() }, uAmbient: { value: 1 } },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: true,
      }),
    [atm],
  );
  useLayoutEffect(() => () => material.dispose(), [material]);

  useLayoutEffect(() => {
    material.uniforms.uCenter.value.set(center[0], 0, center[1]);
    material.uniforms.uAmbient.value = ambient;
  }, [material, center, ambient]);

  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={2} />;
}
