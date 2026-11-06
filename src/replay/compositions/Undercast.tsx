"use client";
/**
 * M0 look-dev: "Above the undercast" — 10 s, the formation running down Thud
 * Ridge towards Phuc Yen with the cloud breaking up over the ridge and closing
 * ahead. Proves the pipeline end to end: real terrain, the computed sun, the
 * deterministic deck, an airframe with a SEA livery, the film look, overlays.
 */
import { useLayoutEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { AtmosphereProvider, SunLight } from "../scene/atmosphere";
import { SkyDome, SkyEnvironment } from "../scene/SkyDome";
import { GroundPlane, Terrain } from "../scene/Terrain";
import { CloudDeck } from "../scene/CloudDeck";
import { F4CFlight } from "../scene/Aircraft";
import { PostFX } from "../scene/PostFX";
import { HonestyLine, Kicker, LowerThird, TimeCode } from "../overlay/Overlays";
import { frame as localFrame, undercastAt, type UndercastState } from "../shots/undercast";
import { useFilmFonts } from "./fonts";

function CameraRig({ cam }: { cam: UndercastState["camera"] }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...cam.position);
    camera.up.set(0, 1, 0);
    camera.lookAt(...cam.target);
    if (Math.abs(camera.fov - cam.fov) > 1e-6) {
      camera.fov = cam.fov;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();
  }, [camera, cam]);
  return null;
}

/** Toggles for look-dev and debugging: render one layer at a time from the CLI with --props. */
export interface UndercastProps {
  layers?: Partial<Record<"sky" | "terrain" | "deck" | "aircraft" | "post" | "overlay" | "debugBox", boolean>>;
  /** Look-dev dials, so calibration does not need a code change. */
  look?: { exposure?: number };
}

const ALL_LAYERS = { sky: true, terrain: true, deck: true, aircraft: true, post: true, overlay: true, debugBox: false };

export function Undercast({ layers, look }: UndercastProps) {
  const on = { ...ALL_LAYERS, ...layers };
  const lk = { exposure: 1, ...look };
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  useFilmFonts();
  const s = undercastAt(frame / fps);

  return (
    <AbsoluteFill data-theme="cockpit" style={{ backgroundColor: "var(--bg)" }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ fov: 40, near: 2, far: 2_000_000, position: [0, 5000, 0] }}
        gl={{ logarithmicDepthBuffer: true, antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" }}
        flat
      >
        <AtmosphereProvider state={s.atmosphere}>
          <CameraRig cam={s.camera} />
          <SunLight />
          {on.sky && <SkyDome />}
          {on.sky && <SkyEnvironment intensity={1} />}
          {on.terrain && <GroundPlane />}
          {on.terrain && <Terrain id="thud-ridge" frame={localFrame} stride={2} />}
          {on.deck && <CloudDeck center={s.deckCenter} />}
          {on.aircraft && <F4CFlight poses={s.poses} />}
          {on.debugBox && (
            <mesh position={s.camera.target}>
              <boxGeometry args={[20, 20, 20]} />
              <meshBasicMaterial color="red" />
            </mesh>
          )}
          {on.post && <PostFX frame={frame} exposure={lk.exposure} />}
        </AtmosphereProvider>
      </ThreeCanvas>

      {on.overlay && (
      <AbsoluteFill
        style={{
          padding: "64px 84px",
          justifyContent: "space-between",
          pointerEvents: "none",
          // A scrim, not a box: enough tone under the type to read on bright cloud.
          background:
            "linear-gradient(to bottom, color-mix(in srgb, var(--bg) 22%, transparent) 0%, transparent 20%, transparent 76%, color-mix(in srgb, var(--bg) 32%, transparent) 100%)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <Kicker items={["2 Jan 1967", "Operation Bolo", "Olds flight"]} />
            <div style={{ marginTop: 14 }}>
              <TimeCode hhmmss={s.hhmmss} />
            </div>
          </div>
          <Kicker items={["Look-dev M0", "placeholder airframe"]} style={{ color: "var(--ink-3)", fontSize: 18 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <LowerThird
            title="OLDS 01 · F-4C 63-7680"
            line="Col. Robin Olds · 1st Lt. Charles Clifton — 555th TFS, 8th TFW"
            basis="documented"
            opacity={s.titleOpacity}
          />
          <HonestyLine>Reconstruction · altitude, formation and cloud breaks approximate</HonestyLine>
        </div>
      </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}
