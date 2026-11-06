/**
 * Camera and formation maths, as pure functions of time. Nothing here keeps
 * state between frames: Remotion renders frames out of order and in parallel,
 * so frame N must be computable from N alone.
 */

export type V3 = [number, number, number];

/** Unit forward and right vectors for a true heading, in three.js world (x east, y up, z south). */
export function basis(headingDeg: number) {
  const h = (headingDeg * Math.PI) / 180;
  const forward: V3 = [Math.sin(h), 0, -Math.cos(h)];
  const right: V3 = [Math.cos(h), 0, Math.sin(h)];
  return { forward, right };
}

/** A point given in an aircraft's frame (metres forward, right, up) → world. */
export function offset(origin: readonly [number, number, number], headingDeg: number, o: { f: number; r: number; u: number }): V3 {
  const { forward, right } = basis(headingDeg);
  return [
    origin[0] + forward[0] * o.f + right[0] * o.r,
    origin[1] + o.u,
    origin[2] + forward[2] * o.f + right[2] * o.r,
  ];
}

export function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

/** C2-continuous ease (Perlin's smootherstep) — starts and stops without a jolt. */
export function smootherstep(x: number) {
  const t = clamp01(x);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function lerpOffset(a: { f: number; r: number; u: number }, b: { f: number; r: number; u: number }, t: number) {
  return { f: lerp(a.f, b.f, t), r: lerp(a.r, b.r, t), u: lerp(a.u, b.u, t) };
}

/** Vertical field of view for a full-frame focal length (24 mm sensor height). */
export function fovForFocalLength(mm: number) {
  return (2 * Math.atan(12 / mm) * 180) / Math.PI;
}

/** hh:mm:ss for a UTC instant shown in a fixed offset (minutes east of UTC). */
export function clock(utcMs: number, offsetMinutes: number) {
  const d = new Date(utcMs + offsetMinutes * 60_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}
