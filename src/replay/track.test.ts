import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { LocalFrame } from "./geo";
import { places } from "./places";
import { Scenario, type Track } from "./schema";
import { compileTrack, positionAt, sampleTrack } from "./track";

const frame = new LocalFrame(places.phucYen);
const scenario = Scenario.parse(JSON.parse(readFileSync(path.join(process.cwd(), "content/replays/operation-bolo/scenario.json"), "utf8")));

/** A level right-hand circle: radius r m, at speed v m/s, sampled every 5 s. */
function circle(r: number, v: number): Track {
  const omega = v / r;
  const points = Array.from({ length: 13 }, (_, i) => {
    const t = i * 5;
    // Start heading north at the circle's west point; right turn = clockwise seen from above.
    const a = Math.PI - omega * t;
    const p = frame.latLon(r * Math.cos(a), r * Math.sin(a));
    return { t, lat: p.lat, lon: p.lon, altFt: 15000, basis: "illustrative" as const, sources: [] };
  });
  return { actor: "test", points };
}

describe("track", () => {
  it("passes through every waypoint at its time", () => {
    const c = compileTrack(scenario.tracks[0], frame);
    c.times.forEach((t, i) => {
      const p = positionAt(c, t);
      const d = Math.hypot(p[0] - c.points[i][0], p[1] - c.points[i][1], p[2] - c.points[i][2]);
      assert.ok(d < 1e-3, `waypoint ${i} off by ${d} m`);
    });
  });
  it("Olds 01 inbound runs down Thud Ridge at ~138° and ~480 kt, wings level", () => {
    const c = compileTrack(scenario.tracks[0], frame);
    const pose = sampleTrack(c, -150);
    assert.ok(Math.abs(pose.heading - 138) < 2, `heading ${pose.heading}`);
    assert.ok(Math.abs(pose.speedKt - 480) < 25, `speed ${pose.speedKt}`);
    assert.ok(Math.abs(pose.bank) < 3, `bank ${pose.bank}`);
  });
  it("extrapolates straight beyond the ends without NaN", () => {
    const c = compileTrack(scenario.tracks[0], frame);
    for (const t of [-1000, -279, 0, 60, 600]) {
      const p = sampleTrack(c, t);
      for (const v of [...p.position, p.heading, p.pitch, p.bank]) assert.ok(Number.isFinite(v), `t=${t}`);
    }
  });
  it("banks right into a right turn, as a coordinated turn would", () => {
    const v = 250;
    const r = 6000;
    const c = compileTrack(circle(r, v), frame);
    const pose = sampleTrack(c, 30);
    const expected = (Math.atan((v * v) / r / 9.80665) * 180) / Math.PI;
    assert.ok(pose.bank > 0, `bank ${pose.bank}`);
    assert.ok(Math.abs(pose.bank - expected) < 4, `bank ${pose.bank} vs ${expected}`);
  });
  it("is a pure function of t", () => {
    const c = compileTrack(scenario.tracks[0], frame);
    assert.deepEqual(sampleTrack(c, -77.7), sampleTrack(c, -77.7));
  });
});
