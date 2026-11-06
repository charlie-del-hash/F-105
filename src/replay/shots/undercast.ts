/**
 * M0 look-dev shot — "Above the undercast".
 *
 * Olds flight down Thud Ridge towards Phuc Yen, about two and a half minutes
 * out. What is sourced and what is not:
 *   ● Olds flight over Phuc Yen at ~15:00 local; a solid undercast, tops
 *     ~7,000 ft; ingress from the north-west down Thud Ridge; ~480 kt.
 *   ◌ Altitude (15,000 ft), formation geometry, the cloud breaks over the
 *     ridge and the exact track are reconstruction for the picture.
 * The scenario file (M1) carries the same data with sources per field.
 */
import { FT, KT, LocalFrame } from "../geo";
import { places } from "../places";
import { localToUtc, sunDirection, sunPosition } from "../sun";
import type { AtmosphereState } from "../scene/atmosphere";
import { clock, fovForFocalLength, lerpOffset, offset, smootherstep, type V3 } from "../rig";

export const UNDERCAST_FPS = 30;
export const UNDERCAST_SECONDS = 10;

/** T0: Olds flight over Phuc Yen, 15:00 local (UTC+7). */
const T0 = localToUtc("1967-01-02", "15:00:00", "+07:00");
const SHOT_START = localToUtc("1967-01-02", "14:57:30", "+07:00");

export const frame = new LocalFrame(places.phucYen);

/** Thud Ridge points at Phuc Yen on a true heading of ~138°. */
const ridgeNW = frame.three({ ...places.thudRidgeNW, alt: 0 });
export const HEADING = (Math.atan2(-ridgeNW[0], ridgeNW[2]) * 180) / Math.PI;

const SPEED = 480 * KT;
const ALTITUDE = 15_000 * FT;

/** Fluid four, illustrative: lead, wingman back-left, element out right and back. */
const FORMATION = [
  { f: 0, r: 0, u: 0, phase: 0 },
  { f: -95, r: -165, u: 18, phase: 1.7 },
  { f: -260, r: 610, u: 55, phase: 3.1 },
  { f: -345, r: 770, u: 80, phase: 4.6 },
];

/**
 * The move: open on the lead's front-right quarter, side-lit by the low sun,
 * then fall back and up behind it while the aim leaves the aircraft for the
 * deck ahead — where the cloud closes over Phuc Yen. The aim holds on the lead
 * for the first half so the pan never loses it.
 */
const CAMERA_FROM = { f: 27, r: 21, u: 3 };
const CAMERA_TO = { f: -62, r: 26, u: 13 };
const LOOK_FROM = { f: 1, r: 0, u: 0.5 };
const LOOK_TO = { f: 600, r: 30, u: -95 };

export interface UndercastState {
  missionUtc: number;
  hhmmss: string;
  poses: { position: V3; heading: number; pitch: number; bank: number }[];
  camera: { position: V3; target: V3; fov: number };
  atmosphere: AtmosphereState;
  deckCenter: [number, number];
  /** Lower-third opacity: in after a beat, out before the cut. */
  titleOpacity: number;
}

export function undercastAt(t: number): UndercastState {
  const missionUtc = SHOT_START + t * 1000;
  const toGo = (T0 - missionUtc) / 1000;
  const along = -SPEED * toGo;
  const rad = (HEADING * Math.PI) / 180;
  const lead: V3 = [Math.sin(rad) * along, ALTITUDE, -Math.cos(rad) * along];

  const poses = FORMATION.map((m) => {
    const p = offset(lead, HEADING, m);
    return {
      position: [p[0], p[1] + 1.4 * Math.sin(0.6 * t + m.phase), p[2]] as V3,
      heading: HEADING + 0.25 * Math.sin(0.33 * t + m.phase),
      pitch: 0.6 + 0.35 * Math.sin(0.5 * t + m.phase),
      bank: 1.2 * Math.sin(0.7 * t + m.phase),
    };
  });

  const k = smootherstep(t / UNDERCAST_SECONDS);
  const camera = {
    position: offset(lead, HEADING, lerpOffset(CAMERA_FROM, CAMERA_TO, k)),
    // Aim stays on the lead until halfway, then eases out to the deck ahead.
    target: offset(lead, HEADING, lerpOffset(LOOK_FROM, LOOK_TO, smootherstep((t / UNDERCAST_SECONDS - 0.5) / 0.5))),
    fov: fovForFocalLength(48 - 13 * k),
  };

  const sun = sunPosition(missionUtc, places.phucYen.lat, places.phucYen.lon);
  // NE monsoon flow at deck level, ~15 kt from 045°: the field drifts south-west.
  const wind = 15 * KT;
  const sinceT0 = (missionUtc - T0) / 1000;
  const drift: [number, number] = [wind * Math.SQRT1_2 * sinceT0, -wind * Math.SQRT1_2 * sinceT0];

  const atmosphere: AtmosphereState = {
    sunDir: sunDirection(sun),
    sunColor: [1.0, 0.86, 0.7],
    sunIntensity: 3.3,
    // Radiance (linear): the zenith, and the horizon the haze fades to.
    skyColor: [0.028, 0.072, 0.2],
    hazeColor: [0.26, 0.3, 0.36],
    hazeDensity: 6e-5,
    hazeHeight: 2100,
    deckTop: 7_000 * FT,
    drift,
    covA: [ridgeNW[0], ridgeNW[2]],
    covB: [0, 0],
    covRange: [0.3, 1.05],
  };

  const titleOpacity = smootherstep((t - 1.2) / 0.8) * (1 - smootherstep((t - 8.6) / 0.8));

  return {
    missionUtc,
    hhmmss: clock(missionUtc, 7 * 60),
    poses,
    camera,
    atmosphere,
    deckCenter: [lead[0], lead[2]],
    titleOpacity,
  };
}
