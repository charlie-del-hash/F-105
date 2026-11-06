"use client";
/**
 * The sky: an art-directed gradient that shares its horizon colour with the
 * haze. A physical sky model (Preetham) was tried first; its horizon never
 * matched the aerial perspective on the deck, so a hard line ran along the
 * horizon. Here the far deck fades into exactly the colour the sky starts
 * from, the sun's glow uses the same lobe in both, and the sun disc is bright
 * enough for the bloom to catch.
 *
 * Also builds the environment map (reflections on canopy and metal) from a
 * gradient scene: sky above, the bright undercast below. Built once per light
 * with PMREM, so it is deterministic.
 */
import { useLayoutEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useAtmosphere, useAtmosphereState } from "./atmosphere";
import { HAZE_GLSL } from "./glsl";

export const SKY_GLSL = /* glsl */ `
uniform vec3 uSkyColor;
vec3 rp_sky(vec3 dir) {
  // A narrow pale band at the horizon, then quickly into clear blue: the air
  // above an undercast is dry and clean; the haze lives down at the deck.
  float y = max(dir.y, 0.0);
  vec3 base = mix(uHazeColor, uSkyColor, pow(smoothstep(0.0, 0.42, y), 0.55));
  float mu = max(dot(dir, normalize(uSunDir)), 0.0);
  vec3 glow = uSunColor * uSunIntensity * (0.022 * pow(mu, 6.0) + 0.09 * pow(mu, 64.0));
  vec3 disc = uSunColor * uSunIntensity * 60.0 * smoothstep(0.99997, 0.999992, mu);
  return base + glow + disc;
}
`;

export function SkyDome() {
  const atm = useAtmosphere();
  const mesh = useMemo(() => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(1_000_000, 64, 32),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
        uniforms: { ...atm },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          varying vec3 vDir;
          ${HAZE_GLSL}
          ${SKY_GLSL}
          void main() { gl_FragColor = vec4(rp_sky(normalize(vDir)), 1.0); }`,
      }),
    );
    m.frustumCulled = false;
    m.renderOrder = -1;
    return m;
  }, [atm]);
  useLayoutEffect(
    () => () => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    },
    [mesh],
  );
  // Centred on the camera, so it behaves as infinitely far away.
  useFrame(({ camera }) => {
    mesh.position.copy(camera.position);
  });
  return <primitive object={mesh} />;
}

type Rgb = [number, number, number];
type LightSpec = [Rgb, Rgb, number, Rgb, Rgb];

/** Environment lighting for reflections: sky gradient above, bright deck below. */
export function SkyEnvironment({ intensity = 1 }: { intensity?: number }) {
  const atm = useAtmosphereState();
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  // The state object changes every frame (cloud drift); the environment only
  // depends on the light, so rebuild it only when the light changes.
  const lightKey = JSON.stringify([atm.sunDir, atm.sunColor, atm.sunIntensity, atm.skyColor, atm.hazeColor]);
  const light = useMemo(() => JSON.parse(lightKey) as LightSpec, [lightKey]);

  const envMap = useMemo(() => {
    const color = (c: readonly [number, number, number], k: number) => new THREE.Color().setRGB(c[0] * k, c[1] * k, c[2] * k);
    const [sunDir, sunColor, sunIntensity, skyColor, hazeColor] = light;
    const envScene = new THREE.Scene();
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(100, 48, 24),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: {
          uZenith: { value: color(skyColor, 1) },
          uHorizon: { value: color(hazeColor, 1) },
          // A sunlit cloud top seen from above: E·cosθ·albedo/π plus skylight.
          uDeck: {
            value: new THREE.Color().setRGB(
              (sunColor[0] * sunIntensity * 0.55 * 0.95) / Math.PI + skyColor[0],
              (sunColor[1] * sunIntensity * 0.55 * 0.95) / Math.PI + skyColor[1],
              (sunColor[2] * sunIntensity * 0.55 * 0.95) / Math.PI + skyColor[2],
            ),
          },
          uSun: { value: new THREE.Vector3(...sunDir).normalize() },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uDeck; uniform vec3 uSun;
          varying vec3 vDir;
          void main() {
            vec3 d = normalize(vDir);
            vec3 c = d.y > 0.0 ? mix(uHorizon, uZenith, pow(smoothstep(0.0, 0.42, d.y), 0.55)) : mix(uHorizon, uDeck, 1.0 - smoothstep(-0.08, 0.0, d.y));
            c *= 1.0 + 0.6 * pow(max(dot(d, normalize(uSun)), 0.0), 8.0);
            gl_FragColor = vec4(c, 1.0);
          }`,
      }),
    );
    envScene.add(sphere);
    const pmrem = new THREE.PMREMGenerator(gl);
    const rt = pmrem.fromScene(envScene, 0, 0.1, 1000);
    pmrem.dispose();
    sphere.geometry.dispose();
    (sphere.material as THREE.Material).dispose();
    return rt.texture;
  }, [gl, light]);

  useLayoutEffect(() => {
    scene.environment = envMap;
    scene.environmentIntensity = intensity;
    return () => {
      scene.environment = null;
    };
  }, [scene, envMap, intensity]);
  return null;
}
