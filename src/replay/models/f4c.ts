/**
 * F-4C Phantom II — PLACEHOLDER built in code for the M0 look-dev spike.
 *
 * Proportions from published dimensions (length 17.76 m, span 11.70 m, height
 * 4.96 m; outer wing panels at 12° dihedral, stabilators at 23° anhedral).
 * Shapes are approximate. M2 replaces this with a CC-licensed model, credited
 * in credits.json; the camo shader and the honesty tag carry over.
 *
 * Model space: +z forward, +y up, +x LEFT. Origin near the centre of gravity.
 * Stores are illustrative: the Bolo loadout is on the "to verify" list.
 */
import * as THREE from "three";
import { loftBody, loftSurface, merge, mirrorX, store, type BodySection, type SpanStation } from "./loft";

export interface AircraftParts {
  /** Painted skin: camo above, grey below (decided by the livery shader). */
  skin: THREE.BufferGeometry;
  /** Black radome. */
  radome: THREE.BufferGeometry;
  /** Canopy glazing. */
  glass: THREE.BufferGeometry;
  /** Engine nozzles: bare, heat-stained metal. */
  metal: THREE.BufferGeometry;
  /** Stores (tanks, pod) and missiles. */
  stores: THREE.BufferGeometry;
  missiles: THREE.BufferGeometry;
}

const FUSELAGE: BodySection[] = [
  { z: 9.0, w: 0.03, h: 0.03, y: 0.02 },
  { z: 8.6, w: 0.26, h: 0.27, y: 0.03 },
  { z: 8.0, w: 0.4, h: 0.42, y: 0.04 },
  { z: 7.3, w: 0.5, h: 0.52, y: 0.06, n: 2.1 },
  { z: 6.4, w: 0.58, h: 0.62, y: 0.1, n: 2.2 },
  { z: 5.4, w: 0.62, h: 0.7, y: 0.13, n: 2.4 },
  { z: 3.8, w: 0.66, h: 0.74, y: 0.13, n: 2.6 },
  { z: 2.2, w: 0.7, h: 0.76, y: 0.1, n: 2.8 },
  { z: 0.4, w: 0.76, h: 0.78, y: 0.06, n: 3 },
  { z: -1.6, w: 0.82, h: 0.74, y: 0.02, n: 3 },
  { z: -3.6, w: 0.86, h: 0.68, y: -0.02, n: 3 },
  { z: -5.4, w: 0.86, h: 0.6, y: -0.06, n: 3 },
  { z: -6.6, w: 0.78, h: 0.5, y: 0.0, n: 2.8 },
  { z: -7.6, w: 0.42, h: 0.38, y: 0.18, n: 2.4 },
  { z: -8.76, w: 0.08, h: 0.1, y: 0.26 },
];

/** The radome is the first stretch of the fuselage, repeated slightly proud of it. */
const RADOME: BodySection[] = FUSELAGE.slice(0, 4).map((s) => ({ ...s, w: s.w * 1.004, h: s.h * 1.004 }));

const CANOPY: BodySection[] = [
  { z: 6.35, w: 0.04, h: 0.02, y: 0.62 },
  { z: 5.9, w: 0.36, h: 0.32, y: 0.62, n: 2.2 },
  { z: 4.8, w: 0.43, h: 0.44, y: 0.64, n: 2.4 },
  { z: 3.2, w: 0.44, h: 0.44, y: 0.66, n: 2.4 },
  { z: 1.9, w: 0.32, h: 0.26, y: 0.68, n: 2.4 },
  { z: 1.0, w: 0.04, h: 0.02, y: 0.72 },
];

/** The dorsal spine from the canopy back to the fin, faired into the fuselage top. */
const SPINE: BodySection[] = [
  { z: 1.6, w: 0.3, h: 0.12, y: 0.74, n: 2.4 },
  { z: -2.0, w: 0.34, h: 0.14, y: 0.66, n: 2.6 },
  { z: -5.2, w: 0.3, h: 0.12, y: 0.52, n: 2.6 },
  { z: -6.6, w: 0.08, h: 0.04, y: 0.48 },
];

const INTAKE: BodySection[] = [
  { z: 3.5, w: 0.26, h: 0.5, x: 0.98, y: 0.02, n: 4 },
  { z: 2.4, w: 0.3, h: 0.55, x: 1.0, y: 0.0, n: 4 },
  { z: 0.2, w: 0.3, h: 0.56, x: 1.0, y: -0.02, n: 4 },
  { z: -1.8, w: 0.2, h: 0.46, x: 0.94, y: -0.06, n: 3.2 },
  { z: -3.0, w: 0.06, h: 0.3, x: 0.86, y: -0.08, n: 2.6 },
];

/** Inner wing (flat), then the outer panel at 12° dihedral with the dog-tooth. */
const DIHEDRAL = (12 * Math.PI) / 180;
const outerRise = (x: number) => (x - 3.6) * Math.tan(DIHEDRAL);
const WING_INNER: SpanStation[] = [
  { x: 0.7, y: -0.32, zLE: 1.6, zTE: -4.3, t: 0.064 },
  { x: 2.2, y: -0.34, zLE: -0.2, zTE: -4.45, t: 0.055 },
  { x: 3.6, y: -0.36, zLE: -1.9, zTE: -4.6, t: 0.05 },
];
const WING_OUTER: SpanStation[] = [
  { x: 3.6, y: -0.36, zLE: -1.62, zTE: -4.6, t: 0.045 },
  { x: 4.8, y: -0.36 + outerRise(4.8), zLE: -3.0, zTE: -5.1, t: 0.04 },
  { x: 5.85, y: -0.36 + outerRise(5.85), zLE: -4.25, zTE: -5.5, t: 0.03 },
];

/** Stabilator: 23° anhedral, mounted on the tail cone. */
const ANHEDRAL = (23 * Math.PI) / 180;
const stabDrop = (x: number) => (x - 0.35) * Math.tan(ANHEDRAL);
const STABILATOR: SpanStation[] = [
  { x: 0.35, y: 0.1, zLE: -6.9, zTE: -8.9, t: 0.05 },
  { x: 1.5, y: 0.1 - stabDrop(1.5), zLE: -7.65, zTE: -9.0, t: 0.045 },
  { x: 2.75, y: 0.1 - stabDrop(2.75), zLE: -8.35, zTE: -9.15, t: 0.04 },
];

const FIN: SpanStation[] = [
  { x: 0, y: 0.5, zLE: -4.9, zTE: -8.5, t: 0.05 },
  { x: 0, y: 1.6, zLE: -6.35, zTE: -8.55, t: 0.045 },
  { x: 0, y: 2.55, zLE: -7.45, zTE: -8.6, t: 0.04 },
];

function at(g: THREE.BufferGeometry, x: number, y: number, z: number) {
  return g.translate(x, y, z);
}

export function buildF4C(): AircraftParts {
  const skin = merge([
    loftBody(FUSELAGE.slice(3), 32),
    loftBody(SPINE, 20),
    loftBody(INTAKE, 16),
    mirrorX(loftBody(INTAKE, 16)),
    loftSurface(WING_INNER),
    mirrorX(loftSurface(WING_INNER)),
    loftSurface(WING_OUTER),
    mirrorX(loftSurface(WING_OUTER)),
    loftSurface(STABILATOR),
    mirrorX(loftSurface(STABILATOR)),
    loftSurface(FIN, true),
    // Splitter plates ahead of the intakes.
    at(new THREE.BoxGeometry(0.03, 1.05, 1.1), 0.7, 0.02, 3.25),
    at(new THREE.BoxGeometry(0.03, 1.05, 1.1), -0.7, 0.02, 3.25),
    // Pylons: inboard (AIM-9 launchers) and outboard (tank / pod).
    at(new THREE.BoxGeometry(0.1, 0.32, 1.9), 2.1, -0.52, -2.2),
    at(new THREE.BoxGeometry(0.1, 0.32, 1.9), -2.1, -0.52, -2.2),
    at(new THREE.BoxGeometry(0.1, 0.36, 1.7), 3.05, -0.54, -2.7),
    at(new THREE.BoxGeometry(0.1, 0.36, 1.7), -3.05, -0.54, -2.7),
  ]);

  const radome = merge([loftBody(RADOME, 32)]);
  const glass = merge([loftBody(CANOPY, 28)]);

  const nozzle = (x: number) =>
    at(
      loftBody(
        [
          { z: 0.55, w: 0.42, h: 0.42 },
          { z: -0.45, w: 0.4, h: 0.4 },
          { z: -0.5, w: 0.3, h: 0.3 },
          { z: -0.2, w: 0.25, h: 0.25 },
        ],
        24,
      ),
      x,
      -0.26,
      -6.75,
    );
  const metal = merge([nozzle(0.42), nozzle(-0.42)]);

  // Illustrative stores: 370-gal tank right outboard, ECM pod left outboard.
  const stores = merge([
    at(store(5.0, 0.34, 0.3, 0.25), -3.05, -1.02, -2.4),
    at(store(2.9, 0.16, 0.15, 0.08), 3.05, -0.86, -2.6),
  ]);

  // Four AIM-7 semi-recessed under the fuselage; two AIM-9 on each inboard pylon.
  const sparrow = (x: number, z: number) => at(store(3.66, 0.1, 0.12, 0.05, 12), x, -0.82, z);
  const sidewinder = (x: number) => at(store(2.85, 0.064, 0.1, 0.04, 10), x, -0.86, -1.9);
  const missiles = merge([sparrow(0.5, 1.2), sparrow(-0.5, 1.2), sparrow(0.55, -3.3), sparrow(-0.55, -3.3), sidewinder(1.82), sidewinder(2.38), sidewinder(-1.82), sidewinder(-2.38)]);

  return { skin, radome, glass, metal, stores, missiles };
}
