/**
 * Liveries as data, and the materials that paint them.
 *
 * Colours are approximate sRGB renderings of the Federal Standard 595 chips
 * named in T.O. 1-1-4 for the Southeast Asia scheme. Paint faded hard in the
 * Thai sun; the grade does the rest. Verify against chips before final.
 *
 * The SEA pattern is painted by a UV-independent shader: camouflage is
 * projected from above on upper surfaces and from the side on the fuselage
 * flanks, and the underside goes grey wherever the surface faces down. Any
 * model takes the livery without unwrapping — a CC model from M2 included.
 * Markings that the record does not support are not painted at all.
 */
import * as THREE from "three";
import type { AtmosphereUniforms } from "./atmosphere";
import { HAZE_GLSL, NOISE_GLSL } from "./glsl";

export const SEA_CAMO = {
  /** FS 30219 tan */
  tan: "#84694c",
  /** FS 34102 medium green */
  midGreen: "#5d6845",
  /** FS 34079 dark green */
  darkGreen: "#3b4633",
  /** FS 36622 light grey (undersides) */
  grey: "#c9c9be",
} as const;

export const FINISHES = {
  radome: "#1f2120",
  glass: "#1b2127",
  nozzle: "#4d4a46",
  store: "#c2c1b6",
  missile: "#e6e4dc",
} as const;

const CAMO_GLSL = /* glsl */ `
uniform vec3 uTan;
uniform vec3 uMid;
uniform vec3 uDark;
uniform vec3 uGrey;
varying vec3 vObjPos;
varying vec3 vObjNormal;
vec3 rp_camo(vec3 p, vec3 n) {
  float wTop = smoothstep(0.25, 0.65, abs(n.y));
  vec2 top = p.xz;
  vec2 side = vec2(p.z, p.y) + vec2(0.0, 7.0) * sign(p.x);
  vec2 q = mix(side, top, wTop) * 0.34;
  vec2 w = vec2(rp_fbmd(q * 0.6 + 3.1, 2).x, rp_fbmd(q * 0.6 - 5.7, 2).x) - 0.5;
  float v = rp_fbmd(q + w * 1.4, 3).x;
  vec3 c = mix(uDark, uMid, smoothstep(0.43, 0.455, v));
  c = mix(c, uTan, smoothstep(0.555, 0.58, v));
  float under = 1.0 - smoothstep(-0.38, -0.2, n.y);
  return mix(c, uGrey, under);
}
`;

/** Aerial perspective for any standard material: replaces three's fog with the replay haze. */
export function withHaze<M extends THREE.MeshStandardMaterial>(m: M, atm: AtmosphereUniforms, key: string, extra?: (shader: THREE.WebGLProgramParametersWithUniforms) => void): M {
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, atm);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vApWorld;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvApWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vApWorld;\n${HAZE_GLSL}`)
      .replace("#include <fog_fragment>", "gl_FragColor.rgb = rp_haze(gl_FragColor.rgb, vApWorld, cameraPosition);");
    extra?.(shader);
  };
  m.customProgramCacheKey = () => key;
  return m;
}

export function seaCamoMaterial(atm: AtmosphereUniforms) {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.68, metalness: 0 });
  const colours = {
    uTan: { value: new THREE.Color(SEA_CAMO.tan) },
    uMid: { value: new THREE.Color(SEA_CAMO.midGreen) },
    uDark: { value: new THREE.Color(SEA_CAMO.darkGreen) },
    uGrey: { value: new THREE.Color(SEA_CAMO.grey) },
  };
  return withHaze(m, atm, "rp-sea-camo-v1", (shader) => {
    Object.assign(shader.uniforms, colours);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vObjPos;\nvarying vec3 vObjNormal;")
      .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\nvObjNormal = objectNormal;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvObjPos = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace("varying vec3 vApWorld;", `varying vec3 vApWorld;\n${NOISE_GLSL}\n${CAMO_GLSL}`)
      .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb = rp_camo(vObjPos, normalize(vObjNormal));");
  });
}

export function finishMaterial(atm: AtmosphereUniforms, colour: string, roughness: number, metalness: number, key: string) {
  return withHaze(new THREE.MeshStandardMaterial({ color: new THREE.Color(colour), roughness, metalness }), atm, key);
}
