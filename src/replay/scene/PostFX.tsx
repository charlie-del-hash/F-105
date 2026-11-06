"use client";
/**
 * The film look, deterministically: bloom on highlights, ACES tone mapping,
 * then a display-referred grade (warm highlights, cool shadows, a touch of
 * desaturation), a vignette and grain seeded by the frame number. postprocessing's
 * own NoiseEffect is driven by elapsed time, which would make the grain differ
 * between a draft and a final render of the same frame; this one cannot.
 *
 * The composer is built synchronously (useMemo), not in an effect: Remotion's
 * ThreeCanvas renders each frame once, on mount, and a composer that only
 * exists a tick later — as @react-three/postprocessing's does — draws nothing.
 */
import { useLayoutEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BlendFunction, BloomEffect, Effect, EffectComposer, EffectPass, RenderPass, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { HalfFloatType, Uniform, Vector3 } from "three";

const fragmentShader = /* glsl */ `
uniform float uSeed;
uniform float uGrain;
uniform float uVignette;
uniform float uExposure;
uniform vec3 uLift;
uniform vec3 uGain;
uniform float uSaturation;

uint fl_pcg(uint v) {
  uint state = v * 747796405u + 2891336453u;
  uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  return (word >> 22u) ^ word;
}
float fl_rand(vec2 px, float seed) {
  uvec2 p = uvec2(px);
  return float(fl_pcg(p.x + fl_pcg(p.y + fl_pcg(uint(seed))))) / 4294967295.0;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 c = inputColor.rgb * uExposure;
  float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(luma), c, uSaturation);
  // Lift shadows towards cool, push highlights towards warm.
  c = c * uGain + uLift * (1.0 - smoothstep(0.0, 0.6, luma));
  // Vignette: a soft optical falloff, not a frame.
  vec2 d = uv - 0.5;
  c *= 1.0 - uVignette * smoothstep(0.25, 0.85, dot(d, d) * 2.2);
  // Grain: luminance-weighted, strongest in the midtones, new every frame.
  float n = fl_rand(gl_FragCoord.xy, uSeed) - 0.5;
  float w = 4.0 * luma * (1.0 - luma);
  c += n * uGrain * (0.35 + 0.65 * w);
  outputColor = vec4(max(c, 0.0), inputColor.a);
}
`;

export class FilmLookEffect extends Effect {
  constructor() {
    super("FilmLookEffect", fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ["uSeed", new Uniform(0)],
        ["uGrain", new Uniform(0.045)],
        ["uVignette", new Uniform(0.28)],
        ["uExposure", new Uniform(1)],
        ["uLift", new Uniform(new Vector3(0.0, 0.006, 0.014))],
        ["uGain", new Uniform(new Vector3(1.035, 1.0, 0.965))],
        ["uSaturation", new Uniform(1.06)],
      ]),
    });
  }
}

export function PostFX({
  frame,
  grain = 0.045,
  vignette = 0.28,
  exposure = 1,
  bloom = 0.35,
  multisampling = 4,
}: {
  frame: number;
  grain?: number;
  vignette?: number;
  /** Scene-referred exposure, applied before tone mapping. */
  exposure?: number;
  bloom?: number;
  multisampling?: number;
}) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  const fx = useMemo(() => {
    const composer = new EffectComposer(gl, { frameBufferType: HalfFloatType, multisampling });
    const bloomFx = new BloomEffect({ mipmapBlur: true, intensity: 0.35, luminanceThreshold: 1.1, luminanceSmoothing: 0.2 });
    const tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
    const film = new FilmLookEffect();
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new EffectPass(camera, bloomFx));
    composer.addPass(new EffectPass(camera, tone, film));
    return { composer, bloomFx, tone, film };
  }, [gl, scene, camera, multisampling]);

  useLayoutEffect(() => {
    fx.composer.setSize(size.width, size.height);
  }, [fx, size.width, size.height]);

  useLayoutEffect(() => {
    fx.bloomFx.intensity = bloom;
    const u = fx.film.uniforms;
    u.get("uSeed")!.value = frame % 100_003;
    u.get("uGrain")!.value = grain;
    u.get("uVignette")!.value = vignette;
    // ACES in postprocessing reads the renderer's exposure; keep ours explicit.
    gl.toneMappingExposure = exposure;
  }, [fx, gl, frame, grain, vignette, exposure, bloom]);

  useLayoutEffect(() => () => fx.composer.dispose(), [fx]);

  // Priority 1 replaces R3F's own render with the composer's.
  useFrame(() => fx.composer.render(), 1);
  return null;
}
