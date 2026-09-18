import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { collides, compact, findFreeSpot, movePanel, resizePanel } from "./grid";
import type { PanelInstance } from "./schema";

const p = (id: string, x: number, y: number, w: number, h: number): PanelInstance => ({ id, type: "notes", x, y, w, h, props: {} });

describe("grid", () => {
  it("detects overlap", () => {
    assert.equal(collides(p("a", 0, 0, 2, 2), p("b", 1, 1, 2, 2)), true);
    assert.equal(collides(p("a", 0, 0, 2, 2), p("b", 2, 0, 2, 2)), false);
  });
  it("compacts upward", () => {
    const out = compact([p("a", 0, 3, 2, 2), p("b", 0, 0, 2, 2)]);
    assert.equal(out.find((q) => q.id === "a")!.y, 2);
  });
  it("moving onto another panel pushes it down and nothing overlaps", () => {
    const out = movePanel([p("a", 0, 0, 4, 4), p("b", 4, 0, 4, 4)], "b", 0, 0);
    const a = out.find((q) => q.id === "a")!;
    const b = out.find((q) => q.id === "b")!;
    assert.equal(b.y, 0);
    assert.equal(a.y, 4);
    assert.equal(collides(a, b), false);
  });
  it("clamps to the grid", () => {
    const out = movePanel([p("a", 0, 0, 4, 2)], "a", 20, -3);
    assert.deepEqual([out[0].x, out[0].y], [8, 0]);
  });
  it("resize respects minimum size", () => {
    const out = resizePanel([p("a", 0, 0, 4, 4)], "a", 1, 1, { w: 2, h: 3 });
    assert.deepEqual([out[0].w, out[0].h], [2, 3]);
  });
  it("finds the first free slot", () => {
    assert.deepEqual(findFreeSpot([p("a", 0, 0, 6, 2)], 6, 2), { x: 6, y: 0 });
    assert.deepEqual(findFreeSpot([p("a", 0, 0, 12, 2)], 6, 2), { x: 0, y: 2 });
  });
});
