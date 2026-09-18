import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createFredProvider } from "./fred";
import { createEcbProvider } from "./ecb";
import { createCompositeProvider } from "./composite";
import { mockProvider } from "./mock";
import type { FetchLike } from "../types";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const fredFixture = {
  observations: [
    { date: "2026-09-14", value: "71.10" },
    { date: "2026-09-15", value: "." },
    { date: "2026-09-16", value: "72.35" },
    { date: "2026-09-17", value: "73.00" },
  ],
};
const ecbFixture = { rates: { "2026-09-15": { USD: 1.1 }, "2026-09-16": { USD: 1.12 }, "2026-09-17": { USD: 1.11 } } };

describe("fred adapter", () => {
  it("is unconfigured without a key and covers nothing", () => {
    const p = createFredProvider({ apiKey: undefined, fetchImpl: async () => json({}) });
    assert.equal(p.configured, false);
    assert.equal(p.covers("BRENT"), false);
  });
  it("maps observations, skips missing values, derives a quote", async () => {
    const calls: string[] = [];
    const fetchImpl: FetchLike = async (url) => {
      calls.push(url);
      return json(fredFixture);
    };
    const p = createFredProvider({ apiKey: "k", fetchImpl });
    assert.equal(p.covers("BRENT"), true);
    assert.equal(p.covers("TD3C"), false);
    const s = await p.series("BRENT", "1m");
    assert.equal(s?.points.length, 3);
    assert.equal(s?.provider, "fred");
    assert.equal(s?.synthetic, false);
    const [q] = await p.quotes(["BRENT"]);
    assert.equal(q.last, 73);
    assert.equal(q.prevClose, 72.35);
    assert.equal(q.asOf, "2026-09-17");
    assert.ok(calls[0].includes("series_id=DCOILBRENTEU"));
    assert.ok(calls[0].includes("api_key=k"));
    assert.equal(calls.length, 1, "second call served from the TTL cache");
  });
  it("throws on an API error so the composite can fall back", async () => {
    const p = createFredProvider({ apiKey: "k", fetchImpl: async () => json({ error_message: "Bad Request" }, 400) });
    await assert.rejects(() => p.series("WTI", "1m"), /HTTP 400/);
  });
});

describe("ecb adapter", () => {
  it("builds a sorted series and a quote from rates", async () => {
    const p = createEcbProvider({ fetchImpl: async (url) => (url.includes("base=EUR&symbols=USD") ? json(ecbFixture) : json({}, 404)) });
    const s = await p.series("EURUSD", "1m");
    assert.deepEqual(s?.points.map((x) => x.d), ["2026-09-15", "2026-09-16", "2026-09-17"]);
    const [q] = await p.quotes(["EURUSD"]);
    assert.equal(q.last, 1.11);
    assert.equal(q.change, -0.01);
    assert.equal(q.provider, "ecb");
  });
});

describe("composite provider", () => {
  it("routes to the first covering adapter and falls back to mock for the rest", async () => {
    const ecb = createEcbProvider({ fetchImpl: async () => json(ecbFixture) });
    const warnings: string[] = [];
    const c = createCompositeProvider([ecb], mockProvider, (m) => warnings.push(m));
    const quotes = await c.quotes(["EURUSD", "TD3C"]);
    assert.equal(quotes.length, 2);
    assert.equal(quotes.find((q) => q.symbol === "EURUSD")?.provider, "ecb");
    assert.equal(quotes.find((q) => q.symbol === "TD3C")?.provider, "mock");
    assert.equal(quotes.find((q) => q.symbol === "TD3C")?.synthetic, true);
    assert.equal(warnings.length, 0);
  });
  it("falls back to mock when a live adapter fails, and says so once", async () => {
    const broken = createEcbProvider({ fetchImpl: async () => json({}, 500) });
    const warnings: string[] = [];
    const c = createCompositeProvider([broken], mockProvider, (m) => warnings.push(m));
    const quotes = await c.quotes(["EURUSD"]);
    assert.equal(quotes[0].provider, "mock");
    assert.equal(quotes[0].synthetic, true);
    const s = await c.series("EURUSD", "3m");
    assert.equal(s?.provider, "mock");
    assert.ok(warnings.length >= 1);
    await c.quotes(["EURUSD"]);
    assert.equal(warnings.filter((w) => w.includes("failed")).length <= 2, true, "rate-limited warnings");
  });
});
