import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluate } from "./evaluate";
import { AlertRules } from "./schema";
import { memoryDedupe } from "./dedupe";
import { dispatch, getNotifiers } from "../lib/notify";
import { formatSlack, formatText } from "../lib/notify/format";
import type { Quote } from "../data/types";

const q = (symbol: string, last: number, prev: number, asOf = "2026-09-17"): Quote => ({
  symbol, last, prevClose: prev, change: last - prev, changePct: ((last - prev) / prev) * 100, high: last, low: prev, ts: "", asOf, spark: [], provider: "mock", synthetic: true,
});

const rules = AlertRules.parse([
  { id: "flash", kind: "wire", priorities: ["flash"], channels: ["slack", "email"] },
  { id: "nrg-urgent", kind: "wire", priorities: ["urgent"], desks: ["energy"], channels: ["slack"] },
  { id: "war", kind: "threshold", symbol: "WAR.RS", op: ">=", value: 1, channels: ["slack"] },
  { id: "ttf", kind: "move", symbol: "TTF", pct: 5, channels: ["whatsapp"] },
]);

describe("evaluate", () => {
  it("matches wire items by priority and desk", () => {
    const events = evaluate(rules, {
      wire: [
        { id: "a", ts: "2026-09-18T05:50:00Z", desk: "geo", text: "FLASH x", priority: "flash" },
        { id: "b", ts: "2026-09-18T05:50:00Z", desk: "energy", text: "urgent y", priority: "urgent" },
        { id: "c", ts: "2026-09-18T05:50:00Z", desk: "shipping", text: "urgent z", priority: "urgent" },
      ],
      quotes: [],
    });
    assert.deepEqual(events.map((e) => e.key), ["wire:flash:a", "wire:nrg-urgent:b"]);
    assert.deepEqual(events[0].channels, ["slack", "email"]);
  });
  it("fires thresholds and moves once per observation date", () => {
    const events = evaluate(rules, { wire: [], quotes: [q("WAR.RS", 1.2, 0.9), q("TTF", 36, 34)] });
    assert.deepEqual(events.map((e) => e.key), ["thr:war:2026-09-17", "move:ttf:2026-09-17"]);
    assert.ok(events[0].body.includes("synthetic"));
    const quiet = evaluate(rules, { wire: [], quotes: [q("WAR.RS", 0.7, 0.9), q("TTF", 34.5, 34)] });
    assert.equal(quiet.length, 0);
  });
});

describe("dispatch", () => {
  it("skips unconfigured channels, de-duplicates, and posts Slack blocks", async () => {
    const posted: { url: string; body: string }[] = [];
    const notifiers = getNotifiers({
      env: { SLACK_WEBHOOK_URL: "https://hooks.slack.test/x" },
      fetchImpl: async (url, init) => {
        posted.push({ url, body: String(init?.body) });
        return new Response("ok", { status: 200 });
      },
    });
    const events = evaluate(rules, { wire: [{ id: "a", ts: "", desk: "geo", text: "FLASH x", priority: "flash" }], quotes: [] });
    const dedupe = memoryDedupe();
    const first = await dispatch(events, notifiers, dedupe);
    assert.deepEqual(first.sent, [{ key: "wire:flash:a", channel: "slack" }]);
    assert.deepEqual(first.skipped, [{ key: "wire:flash:a", channel: "email", reason: "unconfigured" }]);
    assert.equal(posted.length, 1);
    assert.ok(JSON.parse(posted[0].body).blocks.length === 2);
    const second = await dispatch(events, notifiers, dedupe);
    assert.equal(second.sent.length, 0);
    assert.equal(second.skipped.find((s) => s.channel === "slack")?.reason, "duplicate");
  });
  it("dry run reports without sending", async () => {
    let calls = 0;
    const notifiers = getNotifiers({ env: { SLACK_WEBHOOK_URL: "https://x" } , fetchImpl: async () => (calls++, new Response("ok")) });
    const events = evaluate(rules, { wire: [{ id: "a", ts: "", desk: "geo", text: "FLASH", priority: "flash" }], quotes: [] });
    const r = await dispatch(events, notifiers, memoryDedupe(), { dryRun: true });
    assert.equal(r.sent.length, 1);
    assert.equal(calls, 0);
  });
  it("formats text and slack with absolute links", () => {
    const [e] = evaluate(rules, { wire: [{ id: "a", ts: "", desk: "geo", text: "FLASH", priority: "flash", href: "/wire" }], quotes: [] });
    assert.ok(formatText(e).includes("/wire"));
    assert.ok(formatSlack(e).text.startsWith("⚡"));
  });
});
