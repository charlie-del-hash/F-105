import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dateSpan, extent, rebaseAll } from "./rebase";
import type { Series } from "./types";

const mk = (symbol: string, vs: number[], extra: Partial<Series> = {}): Series => ({
  symbol,
  range: "3m",
  points: vs.map((v, i) => ({ d: `2026-01-${String(i + 1).padStart(2, "0")}`, v })),
  min: Math.min(...vs),
  max: Math.max(...vs),
  first: vs[0],
  last: vs[vs.length - 1],
  provider: "mock",
  synthetic: true,
  ...extra,
});

describe("rebaseAll", () => {
  it("indexes each series to 100 at its own first point", () => {
    const [a, b] = rebaseAll([mk("A", [50, 75, 100]), mk("B", [200, 200, 100])], "rebase");
    assert.deepEqual(a.points.map((p) => p.v), [100, 150, 200]);
    assert.deepEqual(b.points.map((p) => p.v), [100, 100, 50]);
  });

  it("puts instruments of wildly different magnitude on one comparable scale", () => {
    // $/bbl against $/day: the whole reason the panel indexes at all.
    const [brent, tce] = rebaseAll([mk("BRENT", [74.2, 81.62]), mk("VLCC.TCE", [41500, 45650])], "rebase");
    assert.equal(Math.round(brent.last), 110);
    assert.equal(Math.round(tce.last), 110);
  });

  it("expresses pct as change from the start, not as a ratio", () => {
    const [a] = rebaseAll([mk("A", [50, 75])], "pct");
    assert.deepEqual(a.points.map((p) => p.v), [0, 50]);
  });

  it("reports changePct identically whichever basis is drawn", () => {
    const asIndex = rebaseAll([mk("A", [80, 100])], "rebase")[0];
    const asPct = rebaseAll([mk("A", [80, 100])], "pct")[0];
    assert.equal(asIndex.changePct, 25);
    assert.equal(asPct.changePct, 25);
  });

  it("drops a series that cannot be indexed rather than plotting infinity", () => {
    // A first point of zero would divide by zero; one point has no movement.
    const out = rebaseAll([mk("ZERO", [0, 10]), mk("SHORT", [5]), mk("OK", [10, 12])], "rebase");
    assert.deepEqual(out.map((s) => s.symbol), ["OK"]);
  });

  it("carries provenance through, so the panel can stay honest", () => {
    const out = rebaseAll([mk("A", [1, 2], { synthetic: false, provider: "ice" })], "rebase");
    assert.equal(out[0].synthetic, false);
    assert.equal(out[0].provider, "ice");
  });
});

describe("extent", () => {
  it("always keeps the baseline in frame", () => {
    // Every line rising must still show the 100 it rose from.
    const out = rebaseAll([mk("A", [10, 20])], "rebase");
    assert.deepEqual(extent(out, "rebase"), { min: 100, max: 200 });
  });

  it("keeps zero in frame on the pct basis", () => {
    const out = rebaseAll([mk("A", [10, 20])], "pct");
    assert.deepEqual(extent(out, "pct"), { min: 0, max: 100 });
  });

  it("spans every series, not just the first", () => {
    const out = rebaseAll([mk("A", [10, 12]), mk("B", [10, 5])], "rebase");
    assert.deepEqual(extent(out, "rebase"), { min: 50, max: 120 });
  });
});

describe("dateSpan", () => {
  it("covers the union of ragged series so they still line up", () => {
    const out = rebaseAll([mk("A", [1, 2, 3, 4]), mk("B", [1, 2])], "rebase");
    const span = dateSpan(out);
    assert.ok(span);
    assert.equal(new Date(span.lo).toISOString().slice(0, 10), "2026-01-01");
    assert.equal(new Date(span.hi).toISOString().slice(0, 10), "2026-01-04");
  });

  it("returns null when there is no span to draw against", () => {
    assert.equal(dateSpan([]), null);
  });
});
