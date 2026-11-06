/**
 * Tracks → poses. A track is a list of time-stamped waypoints (lat, lon, ft);
 * a pose is where the airframe is at time t and how it is oriented.
 *
 * Position: centripetal Catmull–Rom through the waypoints (no cusps, no
 * overshoot loops on uneven spacing), extrapolated straight beyond the ends.
 * Orientation: heading and pitch from the velocity; bank from the turn rate
 * at that speed, as a coordinated turn flies it: tan φ = v·ω / g.
 *
 * Pure: sampleTrack(c, t) depends on t alone, so any frame renders alone.
 */
import { FT, LocalFrame } from "./geo";
import type { Track } from "./schema";

export type V3 = [number, number, number];

export interface CompiledTrack {
  actor: string;
  times: number[];
  /** three.js positions (x east, y up, z south), metres. */
  points: V3[];
}

export interface Pose {
  position: V3;
  /** m/s, three.js frame. */
  velocity: V3;
  /** Degrees true. */
  heading: number;
  /** Degrees, nose up positive. */
  pitch: number;
  /** Degrees, right wing down positive. */
  bank: number;
  speedKt: number;
}

const G = 9.80665;
const DEG = 180 / Math.PI;

export function compileTrack(track: Track, frame: LocalFrame): CompiledTrack {
  return {
    actor: track.actor,
    times: track.points.map((p) => p.t),
    points: track.points.map((p) => frame.three({ lat: p.lat, lon: p.lon, alt: p.altFt * FT })),
  };
}

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const mix = (a: V3, b: V3, ta: number, tb: number, u: number): V3 => {
  const d = tb - ta;
  if (Math.abs(d) < 1e-9) return a;
  return add(scale(a, (tb - u) / d), scale(b, (u - ta) / d));
};

/** Barry–Goldman evaluation of a centripetal (α = ½) Catmull–Rom segment P1→P2. */
function catmullRom(P0: V3, P1: V3, P2: V3, P3: V3, s: number): V3 {
  const knot = (a: V3, b: V3) => Math.max(Math.sqrt(len(sub(b, a))), 1e-4);
  const t0 = 0;
  const t1 = t0 + knot(P0, P1);
  const t2 = t1 + knot(P1, P2);
  const t3 = t2 + knot(P2, P3);
  const u = t1 + (t2 - t1) * s;
  const A1 = mix(P0, P1, t0, t1, u);
  const A2 = mix(P1, P2, t1, t2, u);
  const A3 = mix(P2, P3, t2, t3, u);
  const B1 = mix(A1, A2, t0, t2, u);
  const B2 = mix(A2, A3, t1, t3, u);
  return mix(B1, B2, t1, t2, u);
}

/** Position only. */
export function positionAt(c: CompiledTrack, t: number): V3 {
  const { times, points } = c;
  const n = points.length;
  if (t <= times[0]) {
    const v = scale(sub(points[1], points[0]), 1 / (times[1] - times[0]));
    return add(points[0], scale(v, t - times[0]));
  }
  if (t >= times[n - 1]) {
    const v = scale(sub(points[n - 1], points[n - 2]), 1 / (times[n - 1] - times[n - 2]));
    return add(points[n - 1], scale(v, t - times[n - 1]));
  }
  let i = 0;
  while (i < n - 2 && t > times[i + 1]) i++;
  const P1 = points[i];
  const P2 = points[i + 1];
  // Phantom end points by reflection, so the curve leaves the ends straight.
  const P0 = i > 0 ? points[i - 1] : sub(scale(P1, 2), P2);
  const P3 = i + 2 < n ? points[i + 2] : sub(scale(P2, 2), P1);
  const s = (t - times[i]) / (times[i + 1] - times[i]);
  return catmullRom(P0, P1, P2, P3, s);
}

function headingOf(v: V3) {
  return (Math.atan2(v[0], -v[2]) * DEG + 360) % 360;
}

/** Full pose at t. Derivatives are central differences with fixed steps: deterministic. */
export function sampleTrack(c: CompiledTrack, t: number): Pose {
  const h = 0.05;
  const position = positionAt(c, t);
  const velocity = scale(sub(positionAt(c, t + h), positionAt(c, t - h)), 1 / (2 * h));
  const horizontal = Math.hypot(velocity[0], velocity[2]);
  const speed = len(velocity);
  const heading = headingOf(velocity);
  const pitch = Math.atan2(velocity[1], horizontal) * DEG;

  const w = 0.5;
  const a = positionAt(c, t - w - h);
  const b = positionAt(c, t - w + h);
  const p = positionAt(c, t + w - h);
  const q = positionAt(c, t + w + h);
  let dpsi = headingOf(sub(q, p)) - headingOf(sub(b, a));
  if (dpsi > 180) dpsi -= 360;
  if (dpsi < -180) dpsi += 360;
  const omega = dpsi / DEG / (2 * w);
  const bank = Math.max(-80, Math.min(80, Math.atan((horizontal * omega) / G) * DEG));

  return { position, velocity, heading, pitch, bank, speedKt: speed / (1852 / 3600) };
}
