/**
 * Solar position for a place and instant: NOAA's spreadsheet algorithm
 * (Meeus, simplified). Good to roughly 0.1° for the 20th century, which is far
 * finer than a viewer can see in a key light.
 *
 * The replay lights every shot from where the sun actually was. Over Phuc Yen
 * at 15:00 local (UTC+7) on 2 January 1967 that is 27.8° up, from 227° — low,
 * winter, south-west — and it sets at about 17:27.
 *
 * Pure and deterministic: no Date.now, no locale. Tested in sun.test.ts.
 */

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

export interface SunPosition {
  /** Degrees above the horizon (negative below it). Refraction is not applied. */
  elevation: number;
  /** Degrees clockwise from true north. */
  azimuth: number;
  /** Solar declination, degrees. */
  declination: number;
  /** Equation of time, minutes. */
  equationOfTime: number;
}

/** Sun position for a UTC instant (ms since the epoch) at a latitude/longitude in degrees. */
export function sunPosition(utcMs: number, lat: number, lon: number): SunPosition {
  const jd = utcMs / 86_400_000 + 2_440_587.5;
  const T = (jd - 2_451_545) / 36_525;

  const L0 = mod(280.46646 + T * (36_000.76983 + T * 0.0003032), 360);
  const M = 357.52911 + T * (35_999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C =
    Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * M * RAD) * 0.000289;
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega * RAD);
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(omega * RAD);
  const declination = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) * DEG;

  const y = Math.tan((eps * RAD) / 2) ** 2;
  const equationOfTime =
    4 *
    DEG *
    (y * Math.sin(2 * L0 * RAD) -
      2 * e * Math.sin(M * RAD) +
      4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) -
      0.5 * y * y * Math.sin(4 * L0 * RAD) -
      1.25 * e * e * Math.sin(2 * M * RAD));

  const d = new Date(utcMs);
  const minutes = d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60 + d.getUTCMilliseconds() / 60_000;
  const trueSolarTime = mod(minutes + equationOfTime + 4 * lon, 1440);
  const hourAngle = trueSolarTime / 4 - 180;

  const cosZenith =
    Math.sin(lat * RAD) * Math.sin(declination * RAD) +
    Math.cos(lat * RAD) * Math.cos(declination * RAD) * Math.cos(hourAngle * RAD);
  const zenith = Math.acos(clamp(cosZenith, -1, 1)) * DEG;

  const cosAz =
    (Math.sin(lat * RAD) * Math.cos(zenith * RAD) - Math.sin(declination * RAD)) /
    (Math.cos(lat * RAD) * Math.sin(zenith * RAD));
  const az = Math.acos(clamp(cosAz, -1, 1)) * DEG;
  const azimuth = hourAngle > 0 ? mod(az + 180, 360) : mod(540 - az, 360);

  return { elevation: 90 - zenith, azimuth, declination, equationOfTime };
}

/**
 * Local wall-clock time → UTC ms. `offset` is the zone as "+07:00".
 * US units in Thailand, and the sources that quote "1500 local", used UTC+7.
 */
export function localToUtc(date: string, time: string, offset: string): number {
  const iso = `${date}T${time.length === 5 ? `${time}:00` : time}${offset}`;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) throw new Error(`Bad local time: ${iso}`);
  return ms;
}

/**
 * The sun as a unit vector in the replay's three.js frame: x = east, y = up,
 * z = south (north is −z). Directional lights shine *from* this vector.
 */
export function sunDirection(sun: Pick<SunPosition, "elevation" | "azimuth">): [number, number, number] {
  const el = sun.elevation * RAD;
  const az = sun.azimuth * RAD;
  const east = Math.cos(el) * Math.sin(az);
  const north = Math.cos(el) * Math.cos(az);
  return [east, Math.sin(el), -north];
}

function mod(a: number, n: number) {
  return ((a % n) + n) % n;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}
