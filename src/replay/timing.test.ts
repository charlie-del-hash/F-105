import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { captionProblems, missionTime, shotAt, shotProblems, wrapCaption } from "./timing";

describe("shot timing", () => {
  const shots = [
    { id: "a", from: 0, durationInFrames: 90, missionStart: -150, rate: 1 },
    { id: "b", from: 90, durationInFrames: 60, missionStart: 0, rate: 4 },
  ];
  it("maps film frames to mission seconds at the shot's rate", () => {
    assert.equal(missionTime(shots[0], 30, 30), -149);
    assert.equal(missionTime(shots[1], 120, 30), 4);
  });
  it("finds the shot that owns a frame", () => {
    assert.equal(shotAt(shots, 89)?.id, "a");
    assert.equal(shotAt(shots, 90)?.id, "b");
    assert.equal(shotAt(shots, 150), undefined);
  });
  it("reports gaps, overlaps and a short edit", () => {
    assert.deepEqual(shotProblems(shots, 150), []);
    assert.match(shotProblems([shots[0], { ...shots[1], from: 95 }], 155).join(), /gap before b/);
    assert.match(shotProblems([shots[0], { ...shots[1], from: 80 }], 140).join(), /overlaps/);
    assert.match(shotProblems(shots, 200).join(), /gap at the end/);
  });
});

describe("captions", () => {
  it("wraps on words at 42 characters", () => {
    const lines = wrapCaption("On the second day of 1967, the MiG-21s of the 921st came up through the cloud.");
    assert.ok(lines.every((l) => l.length <= 42));
    assert.equal(lines.length, 2);
  });
  it("passes a caption a viewer can read", () => {
    assert.deepEqual(captionProblems({ id: "c1", start: 0, end: 4, text: "Phuc Yen, 15:00. No MiGs yet." }), []);
  });
  it("fails one that is too fast, too long or too brief", () => {
    const fast = captionProblems({ id: "c2", start: 0, end: 1.6, text: "Seven MiG-21s credited in twelve minutes of combat." });
    assert.match(fast.join(), /chars\/s/);
    const long = captionProblems({ id: "c3", start: 0, end: 20, text: "a ".repeat(80) });
    assert.match(long.join(), /lines/);
    const brief = captionProblems({ id: "c4", start: 0, end: 1, text: "Fox two." });
    assert.match(brief.join(), /needs 1.5/);
  });
});
