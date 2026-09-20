import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  observationCanonicalUrlFor,
  observationEmbedFor,
  observationProviderFor,
} from "../../src/lib/videos/observation-provider";

describe("observation video providers", () => {
  it("discloses the MLB embed host and its exclusion from playback statistics", () => {
    const privacy = readFileSync("src/pages/privacy.astro", "utf8");
    expect(privacy).toContain("Streamable");
    expect(privacy).toContain("MLB 影片不計入本站播放統計");
  });
  it("keeps missing providers on the existing YouTube path", () => {
    expect(observationProviderFor(undefined)).toBe("youtube");
    expect(observationProviderFor("youtube")).toBe("youtube");
  });

  it("allows only the approved MLB clip and exact secure embed", () => {
    expect(observationEmbedFor("mlb", "zack-kelly-leaves-with-injury")).toEqual(
      {
        provider: "mlb",
        src: "https://streamable.com/m/zack-kelly-leaves-with-injury?partnerId=web_video-playback-page_video-share",
      },
    );
    expect(observationEmbedFor("mlb", "another-clip")).toBeNull();
    expect(observationEmbedFor("youtube", "O5keKcfVyZM")).toBeNull();
    expect(
      observationCanonicalUrlFor("mlb", "zack-kelly-leaves-with-injury"),
    ).toBe("https://www.mlb.com/redsox/video/zack-kelly-leaves-with-injury");
    expect(observationCanonicalUrlFor("mlb", "another-clip")).toBeNull();
    for (const inheritedKey of ["__proto__", "constructor", "toString"]) {
      expect(observationEmbedFor("mlb", inheritedKey)).toBeNull();
      expect(observationCanonicalUrlFor("mlb", inheritedKey)).toBeNull();
    }
  });
});
