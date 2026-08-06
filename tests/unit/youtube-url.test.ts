/**
 * Failing-first URL tests for the privacy-enhanced YouTube helpers. Only the
 * two canonical public forms are accepted; playlists, channels, HTTP,
 * arbitrary hosts, malformed IDs, injected query data, and iframe HTML are
 * rejected. `buildPrivacyEnhancedEmbedUrl()` is available only to the
 * registered YouTube provider. Every video ID here is visibly fictional.
 */

import { describe, expect, it } from "vitest";
import {
  buildPrivacyEnhancedEmbedUrl,
  buildTimestampUrl,
  parseYouTubeVideoId,
  YOUTUBE_VIDEO_ID_RE,
} from "../../src/lib/video/youtube";

const FICTIONAL_ID = "fIcTiOnAl01";
const PREVIEW_ORIGIN = "http://127.0.0.1:4321";

describe("parseYouTubeVideoId", () => {
  it("accepts the canonical watch form on both youtube.com hosts", () => {
    expect(
      parseYouTubeVideoId(`https://www.youtube.com/watch?v=${FICTIONAL_ID}`),
    ).toBe(FICTIONAL_ID);
    expect(
      parseYouTubeVideoId(`https://youtube.com/watch?v=${FICTIONAL_ID}`),
    ).toBe(FICTIONAL_ID);
  });

  it("accepts the canonical youtu.be short form", () => {
    expect(parseYouTubeVideoId(`https://youtu.be/${FICTIONAL_ID}`)).toBe(
      FICTIONAL_ID,
    );
    expect(parseYouTubeVideoId("https://youtu.be/a-b_c123XYZ")).toBe(
      "a-b_c123XYZ",
    );
  });

  it("rejects playlist-only and channel URLs", () => {
    expect(
      parseYouTubeVideoId(
        "https://www.youtube.com/playlist?list=PLfictionallist",
      ),
    ).toBeNull();
    expect(
      parseYouTubeVideoId("https://www.youtube.com/watch?list=PLfictionallist"),
    ).toBeNull();
    expect(
      parseYouTubeVideoId("https://www.youtube.com/channel/UCfictionalchan"),
    ).toBeNull();
    expect(
      parseYouTubeVideoId("https://www.youtube.com/@fictional-demo"),
    ).toBeNull();
    expect(
      parseYouTubeVideoId("https://www.youtube.com/c/fictional"),
    ).toBeNull();
  });

  it("rejects HTTP and any credentials or explicit port", () => {
    expect(
      parseYouTubeVideoId(`http://www.youtube.com/watch?v=${FICTIONAL_ID}`),
    ).toBeNull();
    expect(parseYouTubeVideoId(`http://youtu.be/${FICTIONAL_ID}`)).toBeNull();
    expect(
      parseYouTubeVideoId(
        `https://user:pw@www.youtube.com/watch?v=${FICTIONAL_ID}`,
      ),
    ).toBeNull();
    expect(
      parseYouTubeVideoId(
        `https://www.youtube.com:8443/watch?v=${FICTIONAL_ID}`,
      ),
    ).toBeNull();
  });

  it("rejects arbitrary and look-alike hosts, including embed hosts", () => {
    expect(
      parseYouTubeVideoId(`https://example.org/watch?v=${FICTIONAL_ID}`),
    ).toBeNull();
    expect(
      parseYouTubeVideoId(
        `https://www.youtube-nocookie.com/watch?v=${FICTIONAL_ID}`,
      ),
    ).toBeNull();
    expect(
      parseYouTubeVideoId(
        `https://www.youtube.com.attacker.example/watch?v=${FICTIONAL_ID}`,
      ),
    ).toBeNull();
    expect(
      parseYouTubeVideoId(`https://www.youtube.com/embed/${FICTIONAL_ID}`),
    ).toBeNull();
  });

  it("rejects malformed video IDs", () => {
    expect(YOUTUBE_VIDEO_ID_RE.test(FICTIONAL_ID)).toBe(true);
    expect(
      parseYouTubeVideoId("https://www.youtube.com/watch?v=fIcTiOnAl0"),
    ).toBeNull();
    expect(
      parseYouTubeVideoId("https://www.youtube.com/watch?v=fIcTiOnAl012"),
    ).toBeNull();
    expect(
      parseYouTubeVideoId("https://www.youtube.com/watch?v=fIcTiOnAl0!"),
    ).toBeNull();
    expect(parseYouTubeVideoId("https://youtu.be/")).toBeNull();
    expect(parseYouTubeVideoId("https://www.youtube.com/watch?v=")).toBeNull();
  });

  it("rejects injected query data, fragments, and repeated parameters", () => {
    expect(
      parseYouTubeVideoId(
        `https://www.youtube.com/watch?v=${FICTIONAL_ID}&autoplay=1`,
      ),
    ).toBeNull();
    expect(
      parseYouTubeVideoId(
        `https://www.youtube.com/watch?v=${FICTIONAL_ID}&list=PLfictionallist`,
      ),
    ).toBeNull();
    expect(
      parseYouTubeVideoId(
        `https://www.youtube.com/watch?v=${FICTIONAL_ID}&v=oThErFake01`,
      ),
    ).toBeNull();
    expect(
      parseYouTubeVideoId(`https://youtu.be/${FICTIONAL_ID}?si=tracker`),
    ).toBeNull();
    expect(
      parseYouTubeVideoId(
        `https://www.youtube.com/watch?v=${FICTIONAL_ID}#injected`,
      ),
    ).toBeNull();
    expect(
      parseYouTubeVideoId(`https://youtu.be/${FICTIONAL_ID}/extra`),
    ).toBeNull();
  });

  it("rejects provided iframe HTML and non-URL input", () => {
    expect(
      parseYouTubeVideoId(
        `<iframe src="https://www.youtube.com/embed/${FICTIONAL_ID}"></iframe>`,
      ),
    ).toBeNull();
    expect(parseYouTubeVideoId("")).toBeNull();
    expect(parseYouTubeVideoId("not a url")).toBeNull();
    expect(parseYouTubeVideoId("javascript:alert(1)")).toBeNull();
  });
});

describe("buildPrivacyEnhancedEmbedUrl", () => {
  it("builds the no-cookie embed URL with enablejsapi and the page origin", () => {
    expect(
      buildPrivacyEnhancedEmbedUrl("youtube", FICTIONAL_ID, PREVIEW_ORIGIN),
    ).toBe(
      "https://www.youtube-nocookie.com/embed/fIcTiOnAl01" +
        "?enablejsapi=1&origin=http%3A%2F%2F127.0.0.1%3A4321",
    );
    expect(
      buildPrivacyEnhancedEmbedUrl(
        "youtube",
        FICTIONAL_ID,
        "https://example.tw",
      ),
    ).toBe(
      "https://www.youtube-nocookie.com/embed/fIcTiOnAl01" +
        "?enablejsapi=1&origin=https%3A%2F%2Fexample.tw",
    );
  });

  it("never emits an autoplay parameter", () => {
    const url = buildPrivacyEnhancedEmbedUrl(
      "youtube",
      FICTIONAL_ID,
      PREVIEW_ORIGIN,
    );
    expect(url).not.toContain("autoplay");
    expect([...new URL(url).searchParams.keys()]).toEqual([
      "enablejsapi",
      "origin",
    ]);
  });

  it("is available only to the registered YouTube provider", () => {
    expect(() =>
      buildPrivacyEnhancedEmbedUrl("nba", FICTIONAL_ID, PREVIEW_ORIGIN),
    ).toThrow(/youtube/i);
    expect(() =>
      buildPrivacyEnhancedEmbedUrl(
        "unregistered-provider",
        FICTIONAL_ID,
        PREVIEW_ORIGIN,
      ),
    ).toThrow(/youtube/i);
  });

  it("rejects malformed video IDs", () => {
    expect(() =>
      buildPrivacyEnhancedEmbedUrl("youtube", "short", PREVIEW_ORIGIN),
    ).toThrow(/video id/i);
    expect(() =>
      buildPrivacyEnhancedEmbedUrl("youtube", "fIcTiOnAl0!", PREVIEW_ORIGIN),
    ).toThrow(/video id/i);
  });

  it("rejects anything that is not a clean http(s) page origin", () => {
    expect(() =>
      buildPrivacyEnhancedEmbedUrl(
        "youtube",
        FICTIONAL_ID,
        "http://127.0.0.1:4321/page",
      ),
    ).toThrow(/origin/i);
    expect(() =>
      buildPrivacyEnhancedEmbedUrl("youtube", FICTIONAL_ID, "javascript:x"),
    ).toThrow(/origin/i);
    expect(() =>
      buildPrivacyEnhancedEmbedUrl("youtube", FICTIONAL_ID, ""),
    ).toThrow(/origin/i);
  });
});

describe("buildTimestampUrl", () => {
  it("builds a real canonical watch URL with a t parameter", () => {
    expect(
      buildTimestampUrl(`https://www.youtube.com/watch?v=${FICTIONAL_ID}`, 75),
    ).toBe(`https://www.youtube.com/watch?v=${FICTIONAL_ID}&t=75s`);
    expect(buildTimestampUrl(`https://youtu.be/${FICTIONAL_ID}`, 0)).toBe(
      `https://www.youtube.com/watch?v=${FICTIONAL_ID}&t=0s`,
    );
  });

  it("rejects invalid canonical URLs and invalid seconds", () => {
    expect(() =>
      buildTimestampUrl("https://www.youtube.com/playlist?list=PLx", 10),
    ).toThrow(/canonical/i);
    expect(() =>
      buildTimestampUrl(`https://www.youtube.com/watch?v=${FICTIONAL_ID}`, -1),
    ).toThrow(/seconds/i);
    expect(() =>
      buildTimestampUrl(`https://www.youtube.com/watch?v=${FICTIONAL_ID}`, 1.5),
    ).toThrow(/seconds/i);
  });
});
