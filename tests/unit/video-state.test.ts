/**
 * Failing-first state tests for the video presentation resolver: registry
 * provider/host/embed cross-rules, all three embed states, every caption
 * outcome in public and review mode, registered NBA external-link-only
 * behavior, caption labeling, and the review-only component-lab path set.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { caseSchema } from "../../src/lib/contracts/case";
import {
  governedVideoRegionRestrictions,
  videoRegionRestrictionFor,
} from "../../src/lib/video/availability";
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
const ROOT = join(import.meta.dirname, "../..");

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
  it("keeps click-to-load for unrestricted verified YouTube video in review mode", () => {
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

  it("records the Taiwan restriction and honors its current external-link state", () => {
    const restricted = base({
      canonicalUrl: "https://www.youtube.com/watch?v=V9mtX4mE8wQ",
      embedStatus: "external-link-only",
    });
    expect(resolvePlayerPresentation(restricted)).toBe("external-link-only");
    expect(
      resolvePlayerPresentation({ ...restricted, displayMode: "public" }),
    ).toBe("external-link-only");
    expect(
      videoRegionRestrictionFor("youtube", restricted.canonicalUrl),
    ).toEqual(
      expect.objectContaining({
        audienceCountryCode: "TW",
        availableCountryCount: 60,
        checkedAt: "2026-08-11T17:29:36Z",
        playabilityStatus: "UNPLAYABLE",
        playableInEmbed: null,
        videoId: "V9mtX4mE8wQ",
      }),
    );
    expect(
      videoRegionRestrictionFor("youtube", FICTIONAL_WATCH_URL),
    ).toBeNull();
    expect(governedVideoRegionRestrictions()).toHaveLength(1);
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

describe("real governed YouTube presentation", () => {
  const expected = [
    {
      slug: "anfernee-simons-ankle-sprain-2023",
      videoId: "8TIJGIRP634",
      captionStatus: "available",
      publicPresentation: "click-to-load",
    },
    {
      slug: "anthony-edwards-ankle-sprain-2023",
      videoId: "V9mtX4mE8wQ",
      captionStatus: "unavailable",
      publicPresentation: "external-link-only",
    },
    {
      slug: "jayson-tatum-achilles-rupture-2025",
      videoId: "xSUKd03LJwE",
      captionStatus: "unavailable",
      publicPresentation: "external-link-only",
    },
    {
      slug: "kevin-durant-achilles-rupture-2019",
      videoId: "YcSOLHMsJYw",
      captionStatus: "available",
      publicPresentation: "click-to-load",
    },
    {
      slug: "kyrie-irving-ankle-sprain-2021",
      videoId: "FQAPZASQyX0",
      captionStatus: "available",
      publicPresentation: "click-to-load",
    },
    {
      slug: "lamelo-ball-ankle-sprain-2023",
      videoId: "RDDGpqOvSdg",
      captionStatus: "available",
      publicPresentation: "click-to-load",
    },
    {
      slug: "lamelo-ball-ankle-sprain-2025",
      videoId: "zZdndTqOexc",
      captionStatus: "available",
      publicPresentation: "click-to-load",
    },
    {
      slug: "tyrese-haliburton-achilles-rupture-2025",
      videoId: "azQpbyDBktk",
      captionStatus: "unavailable",
      publicPresentation: "external-link-only",
    },
  ] as const;

  const records = readdirSync(join(ROOT, "src/content/cases"))
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) =>
      caseSchema.parse(
        JSON.parse(readFileSync(join(ROOT, "src/content/cases", name), "utf8")),
      ),
    );
  const reviewEmbeds = records.filter(
    (record) =>
      resolvePlayerPresentation({
        providerCode: record.video.provider,
        canonicalUrl: record.video.canonicalUrl,
        embedStatus: record.video.embedStatus,
        captionStatus: record.video.captionStatus,
        displayMode: "review",
      }) === "click-to-load",
  );

  it("renders exactly seven of 26 cases as review click-to-load players", () => {
    expect(records).toHaveLength(26);
    expect(reviewEmbeds).toHaveLength(7);
    expect(reviewEmbeds.map((record) => record.slug).sort()).toEqual(
      expected
        .filter((entry) => entry.videoId !== "V9mtX4mE8wQ")
        .map((entry) => entry.slug)
        .sort(),
    );
  });

  it("keeps Anthony external in both modes and preserves caption fallbacks", () => {
    for (const entry of expected) {
      const record = records.find((candidate) => candidate.slug === entry.slug);
      expect(record, `missing governed case ${entry.slug}`).toBeDefined();
      expect(record!.video.canonicalUrl).toBe(
        `https://www.youtube.com/watch?v=${entry.videoId}`,
      );
      expect(record!.video.captionStatus).toBe(entry.captionStatus);
      expect(record!.video.publicRightsReview.status).toBe("not-requested");
      expect(
        resolvePlayerPresentation({
          providerCode: record!.video.provider,
          canonicalUrl: record!.video.canonicalUrl,
          embedStatus: record!.video.embedStatus,
          captionStatus: record!.video.captionStatus,
          displayMode: "public",
        }),
      ).toBe(entry.publicPresentation);
      expect(
        resolvePlayerPresentation({
          providerCode: record!.video.provider,
          canonicalUrl: record!.video.canonicalUrl,
          embedStatus: record!.video.embedStatus,
          captionStatus: record!.video.captionStatus,
          displayMode: "review",
        }),
      ).toBe(
        entry.videoId === "V9mtX4mE8wQ"
          ? "external-link-only"
          : "click-to-load",
      );
    }

    expect(
      expected
        .filter((entry) => entry.publicPresentation === "external-link-only")
        .map((entry) => entry.slug),
    ).toEqual([
      "anthony-edwards-ankle-sprain-2023",
      "jayson-tatum-achilles-rupture-2025",
      "tyrese-haliburton-achilles-rupture-2025",
    ]);
    expect(
      expected
        .filter(
          (entry) =>
            [
              "8TIJGIRP634",
              "xSUKd03LJwE",
              "zZdndTqOexc",
              "azQpbyDBktk",
            ].includes(entry.videoId) &&
            entry.publicPresentation === "external-link-only",
        )
        .map((entry) => entry.slug),
    ).toEqual([
      "jayson-tatum-achilles-rupture-2025",
      "tyrese-haliburton-achilles-rupture-2025",
    ]);
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
