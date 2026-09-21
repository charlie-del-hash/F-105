import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseMnemonic, type MnemonicContext } from "./mnemonics";

const ctx: MnemonicContext = {
  themes: [{ id: "paper", name: "Paper" }, { id: "phosphor", name: "Phosphor" }],
  layouts: [{ id: "bridge", name: "Bridge" }, { id: "desk", name: "Desk" }],
  docs: [{ slug: "strait-of-hormuz", title: "Strait of Hormuz", kind: "dossier", designation: "Hormuz" }, { slug: "thud-ridge", title: "Thud Ridge", kind: "article" }],
  desks: [{ id: "shipping", short: "SHP" }, { id: "energy", short: "NRG" }],
  panels: [
    { type: "chart", name: "Chart", mnemonic: "GP" },
    { type: "wire", name: "Wire", mnemonic: "WIRE" },
    { type: "quotes", name: "Quote board", mnemonic: "QB" },
    { type: "reader", name: "Reader", mnemonic: "READ" },
  ],
  hasInstrument: (s) => ["TTF", "BRENT"].includes(s),
};

describe("mnemonics", () => {
  it("ignores single words", () => assert.equal(parseMnemonic("brent", ctx), null));
  it("switches theme by prefix", () => assert.deepEqual(parseMnemonic("theme pa", ctx), { kind: "theme", id: "paper", label: "Switch theme → Paper" }));
  it("opens a layout", () => assert.equal(parseMnemonic("LAYOUT bri", ctx)?.kind, "layout"));
  it("charts a known instrument only", () => {
    assert.deepEqual(parseMnemonic("gp ttf", ctx), { kind: "chart", symbol: "TTF", label: "GP TTF → chart" });
    assert.equal(parseMnemonic("gp xyz", ctx), null);
  });
  it("finds a dossier by designation", () => assert.equal((parseMnemonic("des hormuz", ctx) as { slug: string }).slug, "strait-of-hormuz"));
  it("adds a desk-scoped wire panel", () => assert.deepEqual((parseMnemonic("wire shp", ctx) as { props: object }).props, { desk: "shipping" }));
  it("builds a quote board from symbols and drops unknowns", () => assert.deepEqual((parseMnemonic("qb brent ttf xxx", ctx) as { props: object }).props, { symbols: ["BRENT", "TTF"] }));
  it("adds a reader by slug or title", () => assert.deepEqual((parseMnemonic("read thud", ctx) as { props: object }).props, { slug: "thud-ridge" }));
});
