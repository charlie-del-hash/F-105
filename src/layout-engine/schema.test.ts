import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseLayout } from "./schema";

const panel = (id: string, x: number, extra: Record<string, unknown> = {}) => ({
  id,
  type: "notes",
  x,
  y: 0,
  w: 3,
  h: 3,
  ...extra,
});

const layout = (panels: unknown[]) => ({ id: "l", name: "L", panels });

describe("parseLayout", () => {
  it("rejects a panel that overflows the grid", () => {
    assert.throws(() => parseLayout(layout([panel("a", 10, { w: 6 })])), /overflows the grid/);
  });

  it("defaults primary to false when the field is absent", () => {
    const l = parseLayout(layout([panel("a", 0), panel("b", 3)]));
    assert.deepEqual(
      l.panels.map((p) => p.primary),
      [false, false],
    );
  });

  it("accepts one primary", () => {
    const l = parseLayout(layout([panel("a", 0, { primary: true }), panel("b", 3)]));
    assert.deepEqual(
      l.panels.filter((p) => p.primary).map((p) => p.id),
      ["a"],
    );
  });

  it("rejects two primaries — two is no hierarchy at all", () => {
    assert.throws(
      () => parseLayout(layout([panel("a", 0, { primary: true }), panel("b", 3, { primary: true })])),
      /marks 2 panels primary \(a, b\); at most one/,
    );
  });

  it("holds a synced remote layout to the same rule", () => {
    // applyRemote runs every remote row through parseLayout, so a device that
    // pushed a bad layout cannot poison the one pulling it.
    assert.throws(
      () => parseLayout({ ...layout([panel("a", 0, { primary: true }), panel("b", 3, { primary: true })]), preset: false }),
      /at most one/,
    );
  });
});
