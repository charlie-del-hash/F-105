import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { localToUtc, sunDirection, sunPosition } from "./sun";
import { places } from "./places";

const { lat, lon } = places.phucYen;
const at = (time: string) => sunPosition(localToUtc("1967-01-02", time, "+07:00"), lat, lon);

describe("sun over Phuc Yen, 2 January 1967", () => {
  it("15:00 local: low, south-west — the light the fight was flown in", () => {
    const s = at("15:00");
    assert.ok(Math.abs(s.elevation - 27.8) < 0.2, `elevation ${s.elevation}`);
    assert.ok(Math.abs(s.azimuth - 227.3) < 0.3, `azimuth ${s.azimuth}`);
  });
  it("14:00 local is higher and further south", () => {
    const s = at("14:00");
    assert.ok(Math.abs(s.elevation - 37.1) < 0.2);
    assert.ok(Math.abs(s.azimuth - 215.1) < 0.3);
  });
  it("sets at about 17:27", () => {
    assert.ok(at("17:20").elevation > 0);
    assert.ok(at("17:35").elevation < 0);
  });
  it("declination is mid-winter", () => {
    assert.ok(Math.abs(at("12:00").declination - -22.97) < 0.05);
  });
  it("direction vector is unit length and points south-west and up", () => {
    const [x, y, z] = sunDirection(at("15:00"));
    assert.ok(Math.abs(Math.hypot(x, y, z) - 1) < 1e-9);
    assert.ok(x < 0, "west");
    assert.ok(z > 0, "south is +z");
    assert.ok(y > 0, "above the horizon");
  });
  it("rejects a malformed local time", () => {
    assert.throws(() => localToUtc("1967-01-02", "nope", "+07:00"));
  });
});
