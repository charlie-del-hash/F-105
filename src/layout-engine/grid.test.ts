import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { collides, compact, findFreeSpot, movePanel, readingOrder, resizePanel, swapInReadingOrder } from "./grid";
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

  describe("swapInReadingOrder", () => {
    // Roughly layouts/desk.json: a tall left rail beside two panels on the top row.
    const desk = () => [p("wire", 0, 0, 3, 11), p("quotes", 3, 0, 4, 7), p("chart", 7, 0, 5, 7), p("top", 3, 7, 4, 7)];

    it("swaps two panels' places in reading order", () => {
      const out = swapInReadingOrder(desk(), "quotes", 1);
      assert.deepEqual(
        readingOrder(out).map((q) => q.id),
        ["wire", "chart", "quotes", "top"],
      );
    });

    it("moves back to where it started", () => {
      const out = swapInReadingOrder(swapInReadingOrder(desk(), "quotes", 1), "quotes", -1);
      assert.deepEqual(out, desk());
    });

    it("keeps the desktop arrangement — the occupied slots are unchanged", () => {
      const slots = (ps: PanelInstance[]) =>
        ps.map((q) => `${q.x},${q.y},${q.w},${q.h}`).sort();
      const out = swapInReadingOrder(desk(), "wire", 1);
      assert.deepEqual(slots(out), slots(desk()));
      // ...and specifically not flattened into one column, which is what it used to do.
      assert.ok(new Set(out.map((q) => q.x)).size > 1);
    });

    it("never creates an overlap", () => {
      const out = swapInReadingOrder(desk(), "wire", 1);
      for (const a of out) for (const b of out) if (a.id !== b.id) assert.equal(collides(a, b), false);
    });

    it("is a no-op at either end", () => {
      assert.deepEqual(swapInReadingOrder(desk(), "wire", -1), desk());
      assert.deepEqual(swapInReadingOrder(desk(), "top", 1), desk());
      assert.deepEqual(swapInReadingOrder(desk(), "nope", 1), desk());
    });
  });
});
