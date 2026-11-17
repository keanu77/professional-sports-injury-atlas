import { describe, expect, it } from "vitest";
import {
  ownedPlaybackOrigin,
  selectCurrentPlaybackEvidence,
  type CurrentPlaybackReceipt,
  type PlaybackExpectation,
} from "../../src/lib/video/playback-evidence";

const now = new Date("2026-11-18T12:00:00Z");
const expected: PlaybackExpectation = {
  videoUrl: "https://www.youtube.com/watch?v=8TIJGIRP634",
  path: "/cases/example/",
  origin: "https://preview.sports-injury-atlas.pages.dev",
  startSeconds: 10,
  sourceCommit: "a".repeat(40),
  catalogDigest: "b".repeat(64),
  captionRequired: true,
};
const valid: CurrentPlaybackReceipt = {
  url: expected.videoUrl,
  path: expected.path,
  origin: "https://preview.sports-injury-atlas.pages.dev",
  startSeconds: 10,
  sourceCommit: expected.sourceCommit,
  sourceDirty: false,
  deploymentCommit: expected.sourceCommit,
  catalogDigest: expected.catalogDigest,
  checkedAt: "2026-11-18T00:00:00Z",
  status: "played",
  captionsEnabled: true,
  before: { time: 10, paused: true, readyState: 3 },
  after: { time: 12, paused: false, readyState: 4 },
};

describe("current real-playback evidence selection", () => {
  it("selects the newest exactly bound receipt without modifying history", () => {
    const old = { ...valid, checkedAt: "2026-11-01T00:00:00Z" };
    const receipts = Object.freeze([Object.freeze(old), Object.freeze(valid)]);
    expect(selectCurrentPlaybackEvidence(receipts, expected, now)).toEqual({
      receipt: valid,
      reasons: [],
    });
  });
  it.each([
    { path: "/videos/different/" },
    { url: "https://www.youtube.com/watch?v=YcSOLHMsJYw" },
    { origin: "https://evil.sports-injury-atlas.pages.dev.evil.org" },
    { origin: "http://127.0.0.1:14324" },
    { sourceCommit: "c".repeat(40) },
    { sourceDirty: true },
    { deploymentCommit: null },
    { catalogDigest: "c".repeat(64) },
    { startSeconds: 0 },
    { checkedAt: "2026-10-19T00:00:00Z" },
    { checkedAt: "2026-11-11T12:00:00Z" },
  ])("rejects wrong, dirty, unknown or stale bindings: %j", (change) => {
    expect(
      selectCurrentPlaybackEvidence([{ ...valid, ...change }], expected, now)
        .receipt,
    ).toBeNull();
  });
  it("does not conceal a newer failed attempt behind an older successful receipt", () => {
    const failed = {
      ...valid,
      checkedAt: "2026-11-18T01:00:00Z",
      status: "unverified",
      error: "Playback timeout",
    };
    expect(
      selectCurrentPlaybackEvidence([valid, failed], expected, now),
    ).toEqual({ receipt: null, reasons: ["latest-attempt-not-played"] });
  });
  it("rejects ambiguous timestamps, future dates, missing playback or required captions", () => {
    expect(
      selectCurrentPlaybackEvidence(
        [valid, { ...valid, captionsEnabled: false }],
        expected,
        now,
      ).reasons,
    ).toContain("ambiguous-latest-evidence");
    expect(
      selectCurrentPlaybackEvidence(
        [{ ...valid, checkedAt: "2026-11-19T00:00:00Z" }],
        expected,
        now,
      ).reasons,
    ).toContain("future-dated-evidence");
    expect(
      selectCurrentPlaybackEvidence(
        [{ ...valid, after: undefined, captionsEnabled: false }],
        expected,
        now,
      ).reasons,
    ).toEqual(["missing-playback-progress", "required-captions-unverified"]);
  });
  it("accepts owned HTTPS origins only, including production", () => {
    expect(ownedPlaybackOrigin("https://injury.sportsmedicine.tw")).toBe(true);
    for (const origin of [
      "https://user@injury.sportsmedicine.tw",
      "https://injury.sportsmedicine.tw/path",
      "https://injury.sportsmedicine.tw:8443",
      "https://nested.preview.sports-injury-atlas.pages.dev",
    ])
      expect(ownedPlaybackOrigin(origin)).toBe(false);
  });
});
