"use client";
/**
 * Aircraft in the scene. Geometry and materials are built once and shared by
 * every airframe of a type; each airframe is a group posed from its track.
 *
 * Pose convention: heading in degrees true, pitch nose-up positive, bank
 * right-wing-down positive. The model's +z is its nose.
 */
import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { buildF4C } from "../models/f4c";
import { useAtmosphere } from "./atmosphere";
import { FINISHES, finishMaterial, seaCamoMaterial } from "./livery";

export interface Pose {
  /** three.js position, metres. */
  position: readonly [number, number, number];
  heading: number;
  pitch: number;
  bank: number;
}

const RAD = Math.PI / 180;

/** Heading/pitch/bank → quaternion in the replay's frame (x east, y up, z south). */
export function poseQuaternion(p: Pick<Pose, "heading" | "pitch" | "bank">) {
  return new THREE.Quaternion().setFromEuler(new THREE.Euler(-p.pitch * RAD, Math.PI - p.heading * RAD, p.bank * RAD, "YXZ"));
}

function useF4CKit() {
  const atm = useAtmosphere();
  const kit = useMemo(() => {
    const parts = buildF4C();
    return {
      parts,
      skin: seaCamoMaterial(atm),
      radome: finishMaterial(atm, FINISHES.radome, 0.45, 0, "rp-radome"),
      glass: finishMaterial(atm, FINISHES.glass, 0.06, 0.9, "rp-glass"),
      metal: finishMaterial(atm, FINISHES.nozzle, 0.42, 0.85, "rp-nozzle"),
      stores: finishMaterial(atm, FINISHES.store, 0.6, 0, "rp-store"),
      missiles: finishMaterial(atm, FINISHES.missile, 0.38, 0, "rp-missile"),
    };
  }, [atm]);
  useLayoutEffect(
    () => () => {
      for (const g of Object.values(kit.parts)) g.dispose();
      for (const m of [kit.skin, kit.radome, kit.glass, kit.metal, kit.stores, kit.missiles]) m.dispose();
    },
    [kit],
  );
  return kit;
}

export function F4CFlight({ poses }: { poses: Pose[] }) {
  const kit = useF4CKit();
  return (
    <>
      {poses.map((p, i) => (
        <group key={i} position={p.position as [number, number, number]} quaternion={poseQuaternion(p)}>
          <mesh geometry={kit.parts.skin} material={kit.skin} />
          <mesh geometry={kit.parts.radome} material={kit.radome} />
          <mesh geometry={kit.parts.glass} material={kit.glass} />
          <mesh geometry={kit.parts.metal} material={kit.metal} />
          <mesh geometry={kit.parts.stores} material={kit.stores} />
          <mesh geometry={kit.parts.missiles} material={kit.missiles} />
        </group>
      ))}
    </>
  );
}
