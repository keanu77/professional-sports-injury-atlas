import { describe, expect, it } from "vitest";
import {
  HEALTH_USER_AGENT,
  healthExitCode,
  monitorPublicVideos,
} from "../../src/lib/video/health-monitor";
import { eventUpdates } from "../../src/lib/videos/event-updates";

const metadata = (id = "8TIJGIRP634") => ({
  title: "Video",
  type: "video",
  provider_name: "YouTube",
  html: `<iframe src="https://www.youtube.com/embed/${id}?feature=oembed"></iframe>`,
});

const input = {
  slug: "example",
  videoUrl: "https://www.youtube.com/watch?v=8TIJGIRP634",
  sourceUrls: ["https://example.org/report"],
};

describe("public video health monitoring", () => {
  it("covers every governed public video without requiring network at import", () => {
    expect(eventUpdates.entries).toHaveLength(200);
    expect(new Set(eventUpdates.entries.map((entry) => entry.slug)).size).toBe(
      200,
    );
  });

  it("separates source, metadata and API embeddability evidence", async () => {
    const urls: string[] = [];
    const artifact = await monitorPublicVideos([input], {
      youtubeApiKey: "secret-key",
      now: () => new Date("2026-09-07T00:00:00Z"),
      fetchImpl: async (request) => {
        const url = String(request);
        urls.push(url.replace(/key=[^&]+/, "key=REDACTED"));
        if (url.includes("googleapis.com"))
          return Response.json({
            items: [{ id: "8TIJGIRP634", status: { embeddable: true } }],
          });
        if (url.includes("oembed")) return Response.json(metadata());
        return new Response("source", { status: 200 });
      },
    });
    expect(artifact.checkedAt).toBe("2026-09-07T00:00:00.000Z");
    expect(artifact.videos[0]).toMatchObject({
      sourceAvailability: [{ result: { status: "available" } }],
      youtubeMetadata: { status: "available" },
      embedCapability: { status: "embeddable", basis: "youtube-data-api" },
    });
    expect(JSON.stringify(artifact)).not.toContain("secret-key");
    expect(urls).toHaveLength(3);
  });

  it("bounds concurrency and marks skipped embed evidence honestly", async () => {
    let active = 0;
    let maximum = 0;
    const many = Array.from({ length: 12 }, (_, index) => ({
      ...input,
      slug: `video-${index}`,
      videoUrl: `https://www.youtube.com/watch?v=${String(index).padStart(11, "0")}`,
      sourceUrls: [`https://example.org/${index}`],
    }));
    const artifact = await monitorPublicVideos(many, {
      concurrency: 3,
      fetchImpl: async (request) => {
        active++;
        maximum = Math.max(maximum, active);
        await new Promise((resolve) => setTimeout(resolve, 2));
        active--;
        return String(request).includes("oembed")
          ? Response.json(
              metadata(
                new URL(
                  new URL(String(request)).searchParams.get("url")!,
                ).searchParams.get("v")!,
              ),
            )
          : new Response("source");
      },
    });
    expect(maximum).toBeLessThanOrEqual(3);
    expect(artifact.summary.embedChecksSkipped).toBe(12);
    expect(
      artifact.videos.every((v) => v.embedCapability.status === "not-checked"),
    ).toBe(true);
  });

  it("caps response bodies and never stores them", async () => {
    const privateBody = "private-response-body";
    const artifact = await monitorPublicVideos([input], {
      maxBodyBytes: 32,
      fetchImpl: async (request) =>
        String(request).includes("oembed")
          ? new Response(privateBody.repeat(10))
          : new Response("source"),
    });
    expect(artifact.videos[0]!.youtubeMetadata).toMatchObject({
      status: "indeterminate",
      reason: "response-too-large",
    });
    expect(JSON.stringify(artifact)).not.toContain(privateBody);
  });

  it("distinguishes confirmed dead links from access blocks", async () => {
    const artifact = await monitorPublicVideos(
      [
        {
          ...input,
          sourceUrls: [
            "https://example.org/dead",
            "https://example.org/blocked",
          ],
        },
      ],
      {
        fetchImpl: async (request) => {
          const url = String(request);
          if (url.includes("oembed")) return Response.json(metadata());
          return new Response("", {
            status: url.endsWith("/dead") ? 404 : 403,
          });
        },
      },
    );
    expect(artifact.summary).toMatchObject({
      unavailableSources: 1,
      indeterminateSources: 1,
      unavailableMetadata: 0,
      indeterminateMetadata: 0,
    });
  });

  it("checks the approved MLB canonical page without calling YouTube services", async () => {
    const urls: string[] = [];
    const artifact = await monitorPublicVideos(
      [
        {
          slug: "zack-kelly-ulnar-nerve-2023",
          provider: "mlb",
          videoUrl:
            "https://www.mlb.com/redsox/video/zack-kelly-leaves-with-injury",
          sourceUrls: ["https://example.org/report"],
        },
      ],
      {
        youtubeApiKey: "must-not-be-used",
        fetchImpl: async (request) => {
          urls.push(String(request));
          return new Response("source", { status: 200 });
        },
      },
    );
    expect(urls).toEqual([
      "https://example.org/report",
      "https://www.mlb.com/redsox/video/zack-kelly-leaves-with-injury",
    ]);
    expect(artifact.videos[0]).toMatchObject({
      provider: "mlb",
      videoId: "zack-kelly-leaves-with-injury",
      youtubeMetadata: { status: "available" },
      embedCapability: {
        status: "not-checked",
        basis: "non-youtube-provider",
      },
    });
  });
});

describe("health evidence diagnostics and deadlines", () => {
  it.each([
    [404, "unavailable", "not-found", 1],
    [410, "unavailable", "gone", 1],
    [401, "indeterminate", "access-denied", 1],
    [403, "indeterminate", "access-denied", 1],
    [451, "indeterminate", "access-denied", 1],
    [429, "indeterminate", "rate-limited", 1],
    [503, "indeterminate", "server-error", 2],
    [408, "indeterminate", "timeout", 2],
  ])(
    "classifies HTTP %i without treating a block as a dead source",
    async (code, status, reason, attempts) => {
      const artifact = await monitorPublicVideos([input], {
        retryDelayMs: 0,
        fetchImpl: async (url, init) => {
          expect(new Headers(init?.headers).get("user-agent")).toBe(
            HEALTH_USER_AGENT,
          );
          return String(url).includes("oembed")
            ? Response.json(metadata())
            : new Response("", { status: Number(code) });
        },
      });
      expect(artifact.videos[0]!.sourceAvailability[0]!.result).toMatchObject({
        status,
        reason,
        attempts,
        httpStatus: code,
      });
      expect(artifact.summary.sourceReasons).toEqual({ [reason]: 1 });
      expect(healthExitCode(artifact)).toBe(status === "unavailable" ? 1 : 2);
    },
  );

  it("retries transient failures once, deduplicates sources and strips query values", async () => {
    let calls = 0;
    const artifact = await monitorPublicVideos(
      [input, { ...input, slug: "duplicate" }],
      {
        retryDelayMs: 0,
        fetchImpl: async (url) => {
          if (String(url).includes("oembed")) return Response.json(metadata());
          if (++calls === 1) throw new Error("private network details");
          const response = new Response("article");
          Object.defineProperty(response, "url", {
            value: "https://example.org/moved?token=private#secret",
          });
          return response;
        },
      },
    );
    expect(calls).toBe(2);
    expect(artifact.summary.sourceUrls).toBe(1);
    expect(artifact.videos[0]!.sourceAvailability[0]!.result).toMatchObject({
      status: "available",
      attempts: 2,
      finalUrl: "https://example.org/moved",
    });
    expect(JSON.stringify(artifact)).not.toMatch(/private|token=|#secret/);
  });

  it.each([
    "<title>Just a moment...</title>",
    "<title>This website is unavailable in your location. – Publisher</title>",
  ])("does not accept an HTTP 200 challenge page: %s", async (body) => {
    const artifact = await monitorPublicVideos([input], {
      fetchImpl: async (url) =>
        String(url).includes("oembed")
          ? Response.json(metadata())
          : new Response(body),
    });
    expect(artifact.videos[0]!.sourceAvailability[0]!.result).toMatchObject({
      status: "indeterminate",
      reason: "access-challenge",
      httpStatus: 200,
    });
  });

  it("records an explicit challenge header while preserving its HTTP status", async () => {
    const artifact = await monitorPublicVideos([input], {
      fetchImpl: async (url) =>
        String(url).includes("oembed")
          ? Response.json(metadata())
          : new Response("", {
              status: 403,
              headers: { "cf-mitigated": "challenge" },
            }),
    });
    expect(artifact.videos[0]!.sourceAvailability[0]!.result).toMatchObject({
      reason: "access-challenge",
      httpStatus: 403,
    });
  });

  it("bounds body consumption by the same deadline and concurrency limit", async () => {
    let active = 0;
    let maximum = 0;
    const artifact = await monitorPublicVideos(
      [
        {
          ...input,
          sourceUrls: Array.from(
            { length: 5 },
            (_, i) => `https://example.org/${i}`,
          ),
        },
      ],
      {
        timeoutMs: 15,
        retryDelayMs: 0,
        concurrency: 2,
        fetchImpl: async (url, init) => {
          if (String(url).includes("oembed")) return Response.json(metadata());
          active++;
          maximum = Math.max(maximum, active);
          return new Response(
            new ReadableStream({
              start(controller) {
                init!.signal!.addEventListener(
                  "abort",
                  () => {
                    active--;
                    controller.error(new Error("private stalled body"));
                  },
                  { once: true },
                );
              },
            }),
          );
        },
      },
    );
    expect(maximum).toBeLessThanOrEqual(2);
    expect(active).toBe(0);
    expect(artifact.summary.sourceReasons.timeout).toBe(5);
    expect(
      artifact.videos[0]!.sourceAvailability.every(
        (s) => s.result.attempts === 2,
      ),
    ).toBe(true);
    expect(JSON.stringify(artifact)).not.toContain("private stalled body");
  });

  it("validates metadata, then reports public iframe markup without claiming embeddability", async () => {
    const artifact = await monitorPublicVideos([input], {
      fetchImpl: async (url) =>
        String(url).includes("oembed")
          ? Response.json(metadata())
          : new Response("source"),
    });
    expect(artifact.videos[0]).toMatchObject({
      embedMarkup: { status: "present", basis: "youtube-oembed" },
      embedCapability: {
        status: "not-checked",
        reason: "youtube-api-key-unavailable",
      },
    });
    expect(artifact).toMatchObject({
      schemaVersion: 2,
      overallStatus: "degraded",
      playbackVerification: "not-performed",
    });
    expect(artifact.summary).toMatchObject({
      embedMarkupPresent: 1,
      embedChecksCompleted: 0,
      embedChecksSkipped: 1,
    });
    expect(healthExitCode(artifact)).toBe(2);
  });

  it.each([{}, { title: "Video" }, null, []])(
    "rejects structurally invalid oEmbed JSON: %j",
    async (value) => {
      const artifact = await monitorPublicVideos([input], {
        fetchImpl: async (url) =>
          String(url).includes("oembed")
            ? Response.json(value)
            : new Response("source"),
      });
      expect(artifact.videos[0]!.youtubeMetadata).toMatchObject({
        status: "indeterminate",
        reason: "invalid-response",
      });
    },
  );

  it.each([
    "https://evil.example/embed/8TIJGIRP634",
    "https://www.youtube.com/embed/another1234",
    "https://www.youtube.com@evil.example/embed/8TIJGIRP634",
  ])("does not count unrelated iframe markup: %s", async (src) => {
    const artifact = await monitorPublicVideos([input], {
      fetchImpl: async (url) =>
        String(url).includes("oembed")
          ? Response.json({
              ...metadata(),
              html: `<iframe src="${src}"></iframe>`,
            })
          : new Response("source"),
    });
    expect(artifact.summary.embedMarkupPresent).toBe(0);
    expect(artifact.videos[0]!.embedMarkup.status).toBe("absent");
  });

  it.each([true, false, undefined])(
    "requires the requested API video ID and a boolean flag: %s",
    async (flag) => {
      const artifact = await monitorPublicVideos([input], {
        youtubeApiKey: "private-test-key",
        fetchImpl: async (url) =>
          String(url).includes("googleapis")
            ? Response.json({
                items: [
                  {
                    id: flag === undefined ? "another1234" : "8TIJGIRP634",
                    status: { embeddable: flag ?? true },
                  },
                ],
              })
            : String(url).includes("oembed")
              ? Response.json(metadata())
              : new Response("source"),
      });
      expect(artifact.videos[0]!.embedCapability.status).toBe(
        flag === undefined
          ? "indeterminate"
          : flag
            ? "embeddable"
            : "not-embeddable",
      );
      expect(healthExitCode(artifact)).toBe(
        flag === undefined ? 2 : flag ? 0 : 1,
      );
      expect(JSON.stringify(artifact)).not.toContain("private-test-key");
    },
  );
});

describe("repaired source evidence", () => {
  it("keeps every Nishikori claim tied to the original AP report after removing the redundant dead citation", () => {
    const entry = eventUpdates.entries.find(
      (v) => v.slug === "kei-nishikori-2017-wrist",
    )!;
    const apUrl =
      "https://www.tennis.com/news/articles/kei-nishikori-to-miss-remainder-of-season-with-torn-tendon-in-wrist";
    expect(entry.sources).toHaveLength(4);
    for (const claim of [entry.timeline![0]!, entry.mechanism!.summary]) {
      expect(claim.sourceIndexes.map((i) => entry.sources[i - 1]!.url)).toEqual(
        [apUrl],
      );
    }
    expect(entry.sources[3]!.url).toBe(entry.videoUrl);
    expect(entry.eventDate).toBeNull();
    expect(entry.returnDate).toBeNull();
    expect(entry.injury).toContain("右腕肌腱撕裂");
    expect(entry.mechanism!.limitation).toContain("不能補 ECU 或 TFCC");
  });

  it("preserves Elliott's closed-door return milestone with its verified original report", () => {
    const entry = eventUpdates.entries.find(
      (v) => v.slug === "harvey-elliott-2021-ankle",
    )!;
    const milestone = entry.timeline!.find((t) => t.date === "2022-01-29")!;
    expect(
      milestone.sourceIndexes.map((i) => entry.sources[i - 1]!.url),
    ).toContain(
      "https://www.liverpoolecho.co.uk/sport/football/football-news/harvey-elliott-liverpool-game-breaking-22917827",
    );
    expect(entry.sources[1]!.publishedAt).toBe("2022-01-29");
    expect(entry.returnDate).toBe("2022-01-29");
    expect(entry.returnSummary).toBe(
      "2022-01-29 先於對 Wrexham 的閉門友誼賽回場。",
    );
    expect(entry.context).toContain("不等同一軍正式賽事復出");
  });
});
