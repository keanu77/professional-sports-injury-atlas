import { describe, expect, it } from "vitest";
import { monitorPublicVideos } from "../../src/lib/video/health-monitor";
import { eventUpdates } from "../../src/lib/videos/event-updates";

const input = {
  slug: "example",
  videoUrl: "https://www.youtube.com/watch?v=8TIJGIRP634",
  sourceUrls: ["https://example.org/report"],
};

describe("public video health monitoring", () => {
  it("covers every governed public video without requiring network at import", () => {
    expect(eventUpdates.entries).toHaveLength(154);
    expect(new Set(eventUpdates.entries.map((entry) => entry.slug)).size).toBe(
      154,
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
          return Response.json({ items: [{ status: { embeddable: true } }] });
        if (url.includes("oembed")) return Response.json({ title: "Video" });
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
          ? Response.json({ title: "Video" })
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
          if (url.includes("oembed")) return Response.json({ title: "Video" });
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
});
