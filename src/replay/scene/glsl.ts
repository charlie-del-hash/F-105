/**
 * Shared GLSL for the replay's shaders.
 *
 * Determinism: hashing is integer PCG, not `fract(sin(x))`. sin() precision
 * differs between GPU vendors and SwiftShader, so a sin-hash would draw a
 * different cloud deck on the draft renderer than on the final one. Integer
 * arithmetic is exact everywhere, so every machine draws the same sky.
 *
 * Everything is in world metres: x = east, y = up, z = south.
 */

export const NOISE_GLSL = /* glsl */ `
uint rp_pcg(uint v) {
  uint state = v * 747796405u + 2891336453u;
  uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  return (word >> 22u) ^ word;
}
float rp_hash(ivec2 p) {
  uint h = rp_pcg(uint(p.x) + rp_pcg(uint(p.y)));
  return float(h) * (1.0 / 4294967295.0);
}
// Value noise with analytic derivatives (quintic fade). Returns (n, dn/dx, dn/dy), n in [0,1].
vec3 rp_noised(vec2 x) {
  vec2 fl = floor(x);
  ivec2 i = ivec2(fl);
  vec2 f = x - fl;
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  float a = rp_hash(i);
  float b = rp_hash(i + ivec2(1, 0));
  float c = rp_hash(i + ivec2(0, 1));
  float d = rp_hash(i + ivec2(1, 1));
  float k1 = b - a;
  float k2 = c - a;
  float k4 = a - b - c + d;
  return vec3(a + k1 * u.x + k2 * u.y + k4 * u.x * u.y, du * (vec2(k1, k2) + k4 * u.yx));
}
// Fractal sum with derivatives, normalised to [0,1]. Derivatives are with respect to p.
vec3 rp_fbmd(vec2 p, int octaves) {
  float v = 0.0;
  vec2 d = vec2(0.0);
  float amp = 0.5;
  float freq = 1.0;
  float norm = 0.0;
  for (int k = 0; k < 7; k++) {
    if (k >= octaves) break;
    vec3 n = rp_noised(p * freq + vec2(float(k) * 17.13, float(k) * -9.71));
    v += amp * n.x;
    d += amp * freq * n.yz;
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return vec3(v, d) / norm;
}
`;

/**
 * The undercast. One definition of where the cloud is, used by the deck itself,
 * by the terrain (cloud shadows) and later by anything that flies through it.
 *
 *   uDeckTop      mean height of the tops, m (≈ 7,000 ft on 2 Jan 1967)
 *   uDeckDrift    wind drift, m — wind × mission time, so it is frame-exact
 *   uCovA, uCovB  coverage runs from broken at A to overcast at B (world xz)
 *   uCovRange     (coverage at A, coverage at B)
 */
export const DECK_GLSL = /* glsl */ `
uniform float uDeckTop;
uniform vec2 uDeckDrift;
uniform vec2 uCovA;
uniform vec2 uCovB;
uniform vec2 uCovRange;

float rp_coverage(vec2 xz) {
  vec2 ab = uCovB - uCovA;
  float s = clamp(dot(xz - uCovA, ab) / dot(ab, ab), 0.0, 1.0);
  float base = mix(uCovRange.x, uCovRange.y, smoothstep(0.1, 0.9, s));
  vec2 q = xz + uDeckDrift;
  float big = rp_fbmd(q / 9000.0, 3).x;
  float mid = rp_fbmd(q / 2300.0, 3).x;
  return base + 0.6 * (big - 0.5) + 0.25 * (mid - 0.5);
}
float rp_deckAlpha(vec2 xz) {
  return smoothstep(0.43, 0.57, rp_coverage(xz));
}
// Height of the cloud tops and its gradient: (h, dh/dx, dh/dz).
vec3 rp_deckHeight(vec2 xz, float alpha, int detail) {
  vec2 q = xz + uDeckDrift;
  vec3 swell = rp_fbmd(q / 6500.0, 3);
  vec3 cells = rp_fbmd(q / 1100.0, 4);
  vec3 billow = rp_fbmd(q / 420.0 + 7.3, 3);
  vec3 fine = rp_fbmd(q / 140.0, detail);
  // Puffy domes: lift the cell and billow fields towards their peaks.
  float c = pow(cells.x, 1.35);
  vec2 dc = 1.35 * pow(max(cells.x, 1e-4), 0.35) * cells.yz;
  float b = pow(billow.x, 1.6);
  vec2 db = 1.6 * pow(max(billow.x, 1e-4), 0.6) * billow.yz;
  float h = uDeckTop - 170.0 + 170.0 * swell.x + 210.0 * c + 95.0 * b + 22.0 * fine.x;
  vec2 dh = 170.0 * swell.yz / 6500.0 + 210.0 * dc / 1100.0 + 95.0 * db / 420.0 + 22.0 * fine.yz / 140.0;
  // Where the deck breaks up, its edges sink into the holes.
  h -= (1.0 - alpha) * 420.0;
  return vec3(h, dh);
}
`;

/**
 * Aerial perspective: exponential height fog, integrated analytically along the
 * view ray, with a forward-scattering lift towards the sun. Cheap and exact for
 * the density model, which is what makes valleys read as far and low.
 */
export const HAZE_GLSL = /* glsl */ `
uniform vec3 uHazeColor;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunIntensity;
uniform float uHazeDensity;
uniform float uHazeHeight;

vec3 rp_haze(vec3 col, vec3 world, vec3 cam) {
  vec3 d = world - cam;
  float dist = length(d);
  float H = uHazeHeight;
  float h0 = cam.y;
  float h1 = world.y;
  float dh = h1 - h0;
  float od = abs(dh) < 1.0
    ? uHazeDensity * exp(-h0 / H) * dist
    : uHazeDensity * dist * H * (exp(-h0 / H) - exp(-h1 / H)) / dh;
  float T = exp(-max(od, 0.0));
  // The same horizon colour and sun lobe as rp_sky, so far objects fade into the sky exactly.
  float mu = dot(d / max(dist, 1e-3), normalize(uSunDir));
  vec3 inscatter = uHazeColor + uSunColor * uSunIntensity * 0.022 * pow(max(mu, 0.0), 6.0);
  return mix(inscatter, col, T);
}
`;

/** Earth curvature relative to the camera, applied to a world-space position. */
export const CURVATURE_GLSL = /* glsl */ `
vec3 rp_curve(vec3 world) {
  vec2 dc = world.xz - cameraPosition.xz;
  world.y -= dot(dc, dc) / (2.0 * 6371008.8);
  return world;
}
`;
