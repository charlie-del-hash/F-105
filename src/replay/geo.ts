/**
 * Geography for the replay: WGS84 lat/lon/alt → a local east-north-up frame in
 * metres, and that frame → three.js (x = east, y = up, z = −north).
 *
 * Every shot picks its own origin (a "floating origin"): float32 on the GPU
 * holds about seven significant digits, so a scene measured in metres from
 * Ubon would jitter by tens of centimetres by the time it reached Phuc Yen.
 * Scenes stay within a few hundred kilometres of their origin, where a local
 * tangent plane plus an explicit curvature drop (`curvatureDrop`) is accurate
 * to well under a pixel.
 */

export const FT = 0.3048;
export const KT = 1852 / 3600;
/** Mean Earth radius, metres. */
export const EARTH_RADIUS = 6_371_008.8;

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

// WGS84
const A = 6_378_137;
const F = 1 / 298.257223563;
const E2 = F * (2 - F);

export interface LatLonAlt {
  lat: number;
  lon: number;
  /** Metres above the ellipsoid (MSL is close enough at this scale). */
  alt: number;
}

export type Vec3 = [number, number, number];

function ecef({ lat, lon, alt }: LatLonAlt): Vec3 {
  const sLat = Math.sin(lat * RAD);
  const cLat = Math.cos(lat * RAD);
  const sLon = Math.sin(lon * RAD);
  const cLon = Math.cos(lon * RAD);
  const n = A / Math.sqrt(1 - E2 * sLat * sLat);
  return [(n + alt) * cLat * cLon, (n + alt) * cLat * sLon, (n * (1 - E2) + alt) * sLat];
}

/** A local tangent frame anchored at `origin`. */
export class LocalFrame {
  readonly origin: LatLonAlt;
  private readonly o: Vec3;
  private readonly sLat: number;
  private readonly cLat: number;
  private readonly sLon: number;
  private readonly cLon: number;

  constructor(origin: { lat: number; lon: number; alt?: number }) {
    this.origin = { lat: origin.lat, lon: origin.lon, alt: origin.alt ?? 0 };
    this.o = ecef(this.origin);
    this.sLat = Math.sin(this.origin.lat * RAD);
    this.cLat = Math.cos(this.origin.lat * RAD);
    this.sLon = Math.sin(this.origin.lon * RAD);
    this.cLon = Math.cos(this.origin.lon * RAD);
  }

  /** East, north, up in metres from the origin (true ENU: the Earth curves away below it). */
  enu(p: LatLonAlt): Vec3 {
    const [x, y, z] = ecef(p);
    const dx = x - this.o[0];
    const dy = y - this.o[1];
    const dz = z - this.o[2];
    const east = -this.sLon * dx + this.cLon * dy;
    const north = -this.sLat * this.cLon * dx - this.sLat * this.sLon * dy + this.cLat * dz;
    const up = this.cLat * this.cLon * dx + this.cLat * this.sLon * dy + this.sLat * dz;
    return [east, north, up];
  }

  /**
   * "Map" coordinates: east and north along the surface, and height above the
   * surface at that point (not above the tangent plane). Scenes draw terrain,
   * clouds and aircraft in this flat frame and add the Earth's curvature back
   * in the vertex shader relative to the camera, which keeps altitudes exact.
   */
  map(p: LatLonAlt): Vec3 {
    const [east, north] = this.enu({ ...p, alt: this.origin.alt });
    return [east, north, p.alt - this.origin.alt];
  }

  /**
   * Inverse of `map` for the horizontal part: metres east/north → lat/lon.
   * A first guess from the ellipsoid's radii of curvature at the origin, then a
   * few fixed-point corrections against `map` itself, so the round trip is exact
   * to millimetres rather than "spherical, close enough".
   */
  latLon(east: number, north: number): { lat: number; lon: number } {
    const w = Math.sqrt(1 - E2 * this.sLat * this.sLat);
    const meridian = (A * (1 - E2)) / (w * w * w);
    const prime = (A / w) * this.cLat;
    let lat = this.origin.lat + (north / meridian) * DEG;
    let lon = this.origin.lon + (east / prime) * DEG;
    for (let i = 0; i < 4; i++) {
      const [e, n] = this.map({ lat, lon, alt: this.origin.alt });
      lat += ((north - n) / meridian) * DEG;
      lon += ((east - e) / prime) * DEG;
    }
    return { lat, lon };
  }

  /** Map coordinates → three.js position (x = east, y = up, z = −north). */
  three(p: LatLonAlt): Vec3 {
    const [east, north, up] = this.map(p);
    return [east, up, -north];
  }
}

/**
 * How far the surface has dropped below a flat tangent plane at a horizontal
 * distance `d` (metres) from the viewer: d² / 2R. 785 m at 100 km — which is why
 * a flat cloud deck looks wrong on the horizon and a curved one does not.
 */
export function curvatureDrop(d: number) {
  return (d * d) / (2 * EARTH_RADIUS);
}

/** Great-circle distance in metres and initial bearing in degrees. */
export function greatCircle(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const la1 = a.lat * RAD;
  const la2 = b.lat * RAD;
  const dLa = la2 - la1;
  const dLo = (b.lon - a.lon) * RAD;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLo / 2) ** 2;
  const distance = 2 * EARTH_RADIUS * Math.asin(Math.sqrt(h));
  const y = Math.sin(dLo) * Math.cos(la2);
  const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLo);
  const bearing = (Math.atan2(y, x) * DEG + 360) % 360;
  return { distance, bearing };
}
