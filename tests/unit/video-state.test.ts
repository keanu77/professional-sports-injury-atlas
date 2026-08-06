/**
 * Failing-first state tests for the video presentation resolver: registry
 * provider/host/embed cross-rules, all three embed states, every caption
 * outcome in public and review mode, registered NBA external-link-only
 * behavior, caption labeling, and the review-only component-lab path set.
 */

import { describe, expect, it } from "vitest";
import {
  captionStatusLabel,
  componentLabStaticParams,
  formatDurationLabel,
  resolvePlayerPresentation,
  validateProviderEmbedState,
  type VideoPresentationInput,
} from "../../src/lib/video/player-state";

const FICTIONAL_WATCH_URL = "https://www.youtube.com/watch?v=fIcTiOnAl01";
const FICTIONAL_NBA_URL = "https://www.nba.com/watch/fictional-demo-clip";

const base = (
  overrides: Partial<VideoPresentationInput> = {},
): VideoPresentationInput => ({
  providerCode: "youtube",
  canonicalUrl: FICTIONAL_WATCH_URL,
  embedStatus: "verified",
  captionStatus: "available",
  displayMode: "review",
  ...overrides,
});

const codesFor = (input: VideoPresentationInput): string[] =>
  validateProviderEmbedState(input).map((entry) => entry.code);

describe("validateProviderEmbedState", () => {
  it("accepts registry-consistent provider/host/embed combinations", () => {
    expect(validateProviderEmbedState(base())).toEqual([]);
    expect(
      validateProviderEmbedState(
        base({ canonicalUrl: "https://youtu.be/fIcTiOnAl01" }),
      ),
    ).toEqual([]);
    expect(
      validateProviderEmbedState(
        base({
          providerCode: "nba",
          canonicalUrl: FICTIONAL_NBA_URL,
          embedStatus: "external-link-only",
        }),
      ),
    ).toEqual([]);
  });

  it("rejects unknown providers", () => {
    expect(codesFor(base({ providerCode: "unregistered" }))).toContain(
      "video-provider-unknown",
    );
  });

  it("rejects hosts outside the provider allowlist", () => {
    expect(codesFor(base({ canonicalUrl: FICTIONAL_NBA_URL }))).toContain(
      "video-provider-host",
    );
    expect(
      codesFor(
        base({
          canonicalUrl: "https://www.youtube-nocookie.com/watch?v=fIcTiOnAl01",
        }),
      ),
    ).toContain("video-provider-host");
    expect(
      codesFor(
        base({
          providerCode: "nba",
          canonicalUrl: FICTIONAL_WATCH_URL,
          embedStatus: "external-link-only",
        }),
      ),
    ).toContain("video-provider-host");
  });

  it("rejects non-HTTPS canonical URLs", () => {
    expect(
      codesFor(
        base({ canonicalUrl: "http://www.youtube.com/watch?v=fIcTiOnAl01" }),
      ),
    ).toContain("video-provider-url");
    expect(codesFor(base({ canonicalUrl: "not a url" }))).toContain(
      "video-provider-url",
    );
  });

  it("rejects embed statuses the provider does not allow", () => {
    expect(
      codesFor(
        base({
          providerCode: "nba",
          canonicalUrl: FICTIONAL_NBA_URL,
          embedStatus: "verified",
        }),
      ),
    ).toContain("video-provider-embed-status");
  });
});

describe("resolvePlayerPresentation", () => {
  it("keeps click-to-load for verified YouTube video in review mode", () => {
    for (const captionStatus of [
      "available",
      "unavailable",
      "not-verified",
    ] as const) {
      expect(resolvePlayerPresentation(base({ captionStatus }))).toBe(
        "click-to-load",
      );
    }
  });

  it("gates the public in-site player on captionStatus available", () => {
    expect(
      resolvePlayerPresentation(
        base({ displayMode: "public", captionStatus: "available" }),
      ),
    ).toBe("click-to-load");
    expect(
      resolvePlayerPresentation(
        base({ displayMode: "public", captionStatus: "unavailable" }),
      ),
    ).toBe("external-link-only");
    expect(
      resolvePlayerPresentation(
        base({ displayMode: "public", captionStatus: "not-verified" }),
      ),
    ).toBe("external-link-only");
  });

  it("renders external-link-only and unavailable embed states without a player", () => {
    expect(
      resolvePlayerPresentation(base({ embedStatus: "external-link-only" })),
    ).toBe("external-link-only");
    expect(
      resolvePlayerPresentation(
        base({ embedStatus: "external-link-only", displayMode: "public" }),
      ),
    ).toBe("external-link-only");
    expect(
      resolvePlayerPresentation(base({ embedStatus: "unavailable" })),
    ).toBe("unavailable-notice");
    expect(
      resolvePlayerPresentation(
        base({ embedStatus: "unavailable", displayMode: "public" }),
      ),
    ).toBe("unavailable-notice");
  });

  it("keeps the registered NBA provider external-link-only in both modes", () => {
    const nba = base({
      providerCode: "nba",
      canonicalUrl: FICTIONAL_NBA_URL,
      embedStatus: "external-link-only",
    });
    expect(resolvePlayerPresentation(nba)).toBe("external-link-only");
    expect(resolvePlayerPresentation({ ...nba, displayMode: "public" })).toBe(
      "external-link-only",
    );
    expect(
      resolvePlayerPresentation({ ...nba, embedStatus: "unavailable" }),
    ).toBe("unavailable-notice");
  });

  it("fails closed on provider/host/embed cross-rule violations", () => {
    expect(() =>
      resolvePlayerPresentation(
        base({
          providerCode: "nba",
          canonicalUrl: FICTIONAL_NBA_URL,
          embedStatus: "verified",
        }),
      ),
    ).toThrow(/video-provider-embed-status/);
    expect(() =>
      resolvePlayerPresentation(base({ providerCode: "unregistered" })),
    ).toThrow(/video-provider-unknown/);
  });
});

describe("caption labeling", () => {
  it("labels all three caption states distinctly and visibly", () => {
    expect(captionStatusLabel("available")).toBe(
      "字幕：原始平台提供（請在原平台播放器開啟字幕）",
    );
    expect(captionStatusLabel("unavailable")).toBe("字幕：原始影片未提供字幕");
    expect(captionStatusLabel("not-verified")).toBe("字幕：尚未驗證");
    expect(
      new Set([
        captionStatusLabel("available"),
        captionStatusLabel("unavailable"),
        captionStatusLabel("not-verified"),
      ]).size,
    ).toBe(3);
  });
});

describe("formatDurationLabel", () => {
  it("formats seconds as minute and hour timecodes", () => {
    expect(formatDurationLabel(0)).toBe("0:00");
    expect(formatDurationLabel(75)).toBe("1:15");
    expect(formatDurationLabel(187)).toBe("3:07");
    expect(formatDurationLabel(3601)).toBe("1:00:01");
  });
});

describe("componentLabStaticParams", () => {
  it("exposes exactly one review-only component-lab path", () => {
    expect(componentLabStaticParams("review")).toEqual([
      { lab: "component-lab" },
    ]);
  });

  it("exposes zero paths in public mode", () => {
    expect(componentLabStaticParams("public")).toEqual([]);
  });
});
