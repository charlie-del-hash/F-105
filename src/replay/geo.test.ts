import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FT, LocalFrame, curvatureDrop, greatCircle } from "./geo";
import { places } from "./places";

describe("geo", () => {
  it("Ubon → Phuc Yen is 671 km on 008°", () => {
    const g = greatCircle(places.ubon, places.phucYen);
    assert.equal(Math.round(g.distance / 1000), 671);
    assert.equal(Math.round(g.bearing), 8);
  });
  it("Da Nang → Kep is 629 km on 341°", () => {
    const g = greatCircle(places.danang, places.kep);
    assert.equal(Math.round(g.distance / 1000), 629);
    assert.equal(Math.round(g.bearing), 341);
  });
  it("the origin maps to zero and altitude is preserved in the map frame", () => {
    const f = new LocalFrame(places.phucYen);
    const [e, n, u] = f.map({ ...places.phucYen, alt: 7000 * FT });
    assert.ok(Math.abs(e) < 1e-6 && Math.abs(n) < 1e-6);
    assert.ok(Math.abs(u - 2133.6) < 1e-6);
  });
  it("Kep is ~47 km east and ~19 km north of Phuc Yen", () => {
    const f = new LocalFrame(places.phucYen);
    const [e, n] = f.map({ ...places.kep, alt: 0 });
    assert.ok(Math.abs(e - 47_300) < 400, `east ${e}`);
    assert.ok(Math.abs(n - 19_200) < 400, `north ${n}`);
    assert.ok(Math.abs(Math.hypot(e, n) - greatCircle(places.phucYen, places.kep).distance) < 300);
  });
  it("map → latLon round-trips to a centimetre at shot scale", () => {
    const f = new LocalFrame(places.phucYen);
    const p = { lat: 21.45, lon: 105.6, alt: 0 };
    const [e, n] = f.map(p);
    const back = f.latLon(e, n);
    const [e2, n2] = f.map({ ...back, alt: 0 });
    assert.ok(Math.hypot(e2 - e, n2 - n) < 0.01, `${Math.hypot(e2 - e, n2 - n)} m`);
  });
  it("three() is east, up, minus north", () => {
    const f = new LocalFrame(places.phucYen);
    const [x, y, z] = f.three({ ...places.kep, alt: 100 });
    const [e, n, u] = f.map({ ...places.kep, alt: 100 });
    assert.deepEqual([x, y, z], [e, u, -n]);
  });
  it("true ENU drops away with distance as the curvature formula says", () => {
    const f = new LocalFrame(places.phucYen);
    const far = f.enu({ lat: places.phucYen.lat + 0.9, lon: places.phucYen.lon, alt: 0 });
    const d = Math.hypot(far[0], far[1]);
    assert.ok(Math.abs(-far[2] - curvatureDrop(d)) < 15, `drop ${-far[2]} vs ${curvatureDrop(d)}`);
    assert.ok(Math.abs(curvatureDrop(100_000) - 785) < 1);
  });
});
