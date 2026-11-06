"use client";
/**
 * One atmosphere per scene: the sun, the haze and the undercast, as shared
 * uniform objects. Every replay shader (terrain, cloud deck, aircraft) holds
 * the *same* objects, so setting the sun once lights and fogs everything
 * consistently. Values are written in a layout effect keyed on the state,
 * which runs before Remotion's ManualFrameRenderer advances the frame.
 */
import { createContext, useContext, useLayoutEffect, useMemo, type ReactNode } from "react";
import * as THREE from "three";

export interface AtmosphereState {
  /** Unit vector towards the sun, three.js frame (x east, y up, z south). */
  sunDir: readonly [number, number, number];
  /** Linear RGB of direct sunlight, and its strength. */
  sunColor: readonly [number, number, number];
  sunIntensity: number;
  /** Linear RGB of skylight for ambient terms. */
  skyColor: readonly [number, number, number];
  /** Linear RGB the haze tends to with distance. */
  hazeColor: readonly [number, number, number];
  /** Extinction at sea level, 1/m, and its scale height, m. */
  hazeDensity: number;
  hazeHeight: number;
  /** Mean height of the cloud tops, m. */
  deckTop: number;
  /** Wind drift of the deck, m (wind × mission time). */
  drift: readonly [number, number];
  /** Coverage ramps from `covRange[0]` at A to `covRange[1]` at B (world x, z). */
  covA: readonly [number, number];
  covB: readonly [number, number];
  covRange: readonly [number, number];
}

export function createAtmosphereUniforms() {
  return {
    uSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uSunColor: { value: new THREE.Color(1, 1, 1) },
    uSunIntensity: { value: 3 },
    uSkyColor: { value: new THREE.Color(0.5, 0.6, 0.8) },
    uHazeColor: { value: new THREE.Color(0.6, 0.65, 0.72) },
    uHazeDensity: { value: 7e-5 },
    uHazeHeight: { value: 1800 },
    uDeckTop: { value: 2134 },
    uDeckDrift: { value: new THREE.Vector2() },
    uCovA: { value: new THREE.Vector2() },
    uCovB: { value: new THREE.Vector2(1, 0) },
    uCovRange: { value: new THREE.Vector2(0.6, 1) },
  };
}
export type AtmosphereUniforms = ReturnType<typeof createAtmosphereUniforms>;

export function writeAtmosphere(u: AtmosphereUniforms, s: AtmosphereState) {
  u.uSunDir.value.set(...s.sunDir).normalize();
  u.uSunColor.value.setRGB(...s.sunColor);
  u.uSunIntensity.value = s.sunIntensity;
  u.uSkyColor.value.setRGB(...s.skyColor);
  u.uHazeColor.value.setRGB(...s.hazeColor);
  u.uHazeDensity.value = s.hazeDensity;
  u.uHazeHeight.value = s.hazeHeight;
  u.uDeckTop.value = s.deckTop;
  u.uDeckDrift.value.set(...s.drift);
  u.uCovA.value.set(...s.covA);
  u.uCovB.value.set(...s.covB);
  u.uCovRange.value.set(...s.covRange);
}

const AtmosphereContext = createContext<{ uniforms: AtmosphereUniforms; state: AtmosphereState } | null>(null);

export function AtmosphereProvider({ state, children }: { state: AtmosphereState; children: ReactNode }) {
  const uniforms = useMemo(() => createAtmosphereUniforms(), []);
  useLayoutEffect(() => writeAtmosphere(uniforms, state), [uniforms, state]);
  const value = useMemo(() => ({ uniforms, state }), [uniforms, state]);
  return <AtmosphereContext.Provider value={value}>{children}</AtmosphereContext.Provider>;
}

/** The shared uniform objects, for shaders. Written before every frame renders. */
export function useAtmosphere() {
  const v = useContext(AtmosphereContext);
  if (!v) throw new Error("useAtmosphere outside <AtmosphereProvider>");
  return v.uniforms;
}

/** The plain state, for anything derived during render (it is current there; uniforms are not yet). */
export function useAtmosphereState() {
  const v = useContext(AtmosphereContext);
  if (!v) throw new Error("useAtmosphereState outside <AtmosphereProvider>");
  return v.state;
}

/** Direct sunlight in the scene, from the shared state. */
export function SunLight() {
  const s = useAtmosphereState();
  const light = useMemo(() => new THREE.DirectionalLight(), []);
  useLayoutEffect(() => {
    light.color.setRGB(...s.sunColor);
    light.intensity = s.sunIntensity;
    light.position.set(...s.sunDir).normalize().multiplyScalar(1000);
    light.target.position.set(0, 0, 0);
  }, [light, s]);
  return (
    <>
      <primitive object={light} />
      <primitive object={light.target} />
    </>
  );
}
