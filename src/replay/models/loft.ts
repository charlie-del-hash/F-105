/**
 * Geometry primitives for building aircraft in code: a superellipse loft along
 * the body axis, and an airfoil loft along a span. Used for the F-105D (no
 * free model exists) and for the M0 placeholder F-4C.
 *
 * Model space: +z forward (nose), +y up, +x to the aircraft's LEFT — so that
 * Object3D.lookAt(target) points the nose at the target.
 *
 * Winding is fixed per triangle against a reference point known to be inside
 * the solid (the local section centre), so every part faces out no matter
 * which way its stations were listed.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

type V3 = [number, number, number];

class Builder {
  pos: number[] = [];
  index: number[] = [];
  vertex(x: number, y: number, z: number) {
    this.pos.push(x, y, z);
    return this.pos.length / 3 - 1;
  }
  private p(i: number): V3 {
    return [this.pos[i * 3], this.pos[i * 3 + 1], this.pos[i * 3 + 2]];
  }
  /** Add a triangle facing away from `inside`. */
  tri(a: number, b: number, c: number, inside: V3) {
    const A = this.p(a);
    const B = this.p(b);
    const C = this.p(c);
    const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
    const v = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const m = [(A[0] + B[0] + C[0]) / 3 - inside[0], (A[1] + B[1] + C[1]) / 3 - inside[1], (A[2] + B[2] + C[2]) / 3 - inside[2]];
    if (n[0] * m[0] + n[1] * m[1] + n[2] * m[2] >= 0) this.index.push(a, b, c);
    else this.index.push(a, c, b);
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setIndex(this.index);
    g.computeVertexNormals();
    return g;
  }
}

const mid = (a: V3, b: V3): V3 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];

export interface BodySection {
  /** Station along the body axis, m (+ forward). */
  z: number;
  /** Half-width and half-height of the section, m. */
  w: number;
  h: number;
  /** Section centre offsets, m. */
  x?: number;
  y?: number;
  /** Superellipse exponent: 2 = ellipse, higher = boxier. */
  n?: number;
}

/** A closed body of superellipse sections, capped at both ends, smooth-shaded. */
export function loftBody(sections: BodySection[], segments = 28): THREE.BufferGeometry {
  const b = new Builder();
  const centre = (s: BodySection): V3 => [s.x ?? 0, s.y ?? 0, s.z];
  const rings = sections.map((s) => {
    const n = s.n ?? 2;
    const ids: number[] = [];
    for (let j = 0; j < segments; j++) {
      const t = (j / segments) * Math.PI * 2;
      const c = Math.cos(t);
      const sn = Math.sin(t);
      ids.push(b.vertex((s.x ?? 0) + s.w * Math.sign(c) * Math.abs(c) ** (2 / n), (s.y ?? 0) + s.h * Math.sign(sn) * Math.abs(sn) ** (2 / n), s.z));
    }
    return ids;
  });
  for (let r = 0; r < sections.length - 1; r++) {
    const inside = mid(centre(sections[r]), centre(sections[r + 1]));
    for (let j = 0; j < segments; j++) {
      const k = (j + 1) % segments;
      b.tri(rings[r][j], rings[r][k], rings[r + 1][j], inside);
      b.tri(rings[r][k], rings[r + 1][k], rings[r + 1][j], inside);
    }
  }
  const last = sections.length - 1;
  const caps: [number, number][] = [
    [0, 1],
    [last, last - 1],
  ];
  for (const [r, inner] of caps) {
    const c = b.vertex(...centre(sections[r]));
    const inside = centre(sections[inner]);
    for (let j = 0; j < segments; j++) b.tri(c, rings[r][j], rings[r][(j + 1) % segments], inside);
  }
  return b.geometry();
}

export interface SpanStation {
  /** Leading-edge position across the span (x, y), and chordwise z of the LE and TE. */
  x: number;
  y: number;
  zLE: number;
  zTE: number;
  /** Thickness as a fraction of chord. */
  t: number;
}

/** Symmetric lens airfoil, chord from 0 (LE) to 1 (TE), half-thickness ±1. */
const AIRFOIL: [number, number][] = [
  [0, 0],
  [0.04, 0.5],
  [0.18, 0.92],
  [0.38, 1],
  [0.65, 0.72],
  [1, 0],
  [0.65, -0.72],
  [0.38, -1],
  [0.18, -0.92],
  [0.04, -0.5],
];

/**
 * A wing, tail or fin: airfoil sections at span stations, skinned and capped.
 * `vertical` turns the thickness sideways, for a fin.
 */
export function loftSurface(stations: SpanStation[], vertical = false): THREE.BufferGeometry {
  const b = new Builder();
  const chordMid = (s: SpanStation): V3 => [s.x, s.y, (s.zLE + s.zTE) / 2];
  const rings = stations.map((s) => {
    const chord = s.zLE - s.zTE;
    return AIRFOIL.map(([u, v]) => {
      const z = s.zLE - u * chord;
      const th = (v * s.t * chord) / 2;
      return vertical ? b.vertex(s.x + th, s.y, z) : b.vertex(s.x, s.y + th, z);
    });
  });
  const ring = AIRFOIL.length;
  for (let r = 0; r < stations.length - 1; r++) {
    const inside = mid(chordMid(stations[r]), chordMid(stations[r + 1]));
    for (let j = 0; j < ring; j++) {
      const k = (j + 1) % ring;
      b.tri(rings[r][j], rings[r][k], rings[r + 1][j], inside);
      b.tri(rings[r][k], rings[r + 1][k], rings[r + 1][j], inside);
    }
  }
  const last = stations.length - 1;
  const caps: [number, number][] = [
    [0, 1],
    [last, last - 1],
  ];
  for (const [r, inner] of caps) {
    const c = b.vertex(...chordMid(stations[r]));
    const inside = chordMid(stations[inner]);
    for (let j = 0; j < ring; j++) b.tri(c, rings[r][j], rings[r][(j + 1) % ring], inside);
  }
  return b.geometry();
}

/** Mirror a geometry across x = 0 (left ↔ right), fixing winding. */
export function mirrorX(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const m = g.clone();
  m.scale(-1, 1, 1);
  const idx = m.getIndex();
  if (idx) {
    const a = idx.array;
    for (let i = 0; i < a.length; i += 3) {
      const t = a[i + 1];
      a[i + 1] = a[i + 2];
      a[i + 2] = t;
    }
    idx.needsUpdate = true;
  }
  m.computeVertexNormals();
  return m;
}

/** A store (tank, pod, missile body) along z, centred on the origin. */
export function store(length: number, radius: number, noseFrac = 0.2, tailFrac = 0.12, segments = 16): THREE.BufferGeometry {
  const z0 = length / 2;
  return loftBody(
    [
      { z: z0, w: radius * 0.04, h: radius * 0.04 },
      { z: z0 - length * noseFrac * 0.35, w: radius * 0.72, h: radius * 0.72 },
      { z: z0 - length * noseFrac, w: radius, h: radius },
      { z: -z0 + length * tailFrac, w: radius, h: radius },
      { z: -z0, w: radius * 0.45, h: radius * 0.45 },
    ],
    segments,
  );
}

/** Merge parts into one geometry with only position + normal (smooth normals kept). */
export function merge(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const clean = parts.map((g) => {
    const c = g.index ? g.toNonIndexed() : g.clone();
    for (const name of Object.keys(c.attributes)) if (name !== "position" && name !== "normal") c.deleteAttribute(name);
    return c;
  });
  const m = mergeGeometries(clean, false);
  if (!m) throw new Error("mergeGeometries failed");
  return m;
}
