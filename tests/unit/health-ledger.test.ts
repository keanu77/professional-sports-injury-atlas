import { describe, expect, it } from "vitest";
import { monitorPublicVideos } from "../../src/lib/video/health-monitor";
import { updateHealthLedger } from "../../src/lib/video/health-ledger";

const input = {
  slug: "case-a",
  videoUrl: "https://www.youtube.com/watch?v=8TIJGIRP634",
  sourceUrls: ["https://example.org/report"],
};
const provenance = {
  sourceCommit: "a".repeat(40),
  sourceDirty: false,
  catalogDigest: "b".repeat(64),
  targetOrigin: "https://injury.sportsmedicine.tw",
  deploymentCommit: "c".repeat(40),
};
async function check(status: number, day: number) {
  return monitorPublicVideos([input], {
    now: () => new Date(`2026-11-${String(day).padStart(2, "0")}T00:00:00Z`),
    provenance,
    fetchImpl: async (request) =>
      String(request).includes("oembed")
        ? Response.json({
            type: "video",
            provider_name: "YouTube",
            title: "Example",
            html: '<iframe src="https://www.youtube.com/embed/8TIJGIRP634"></iframe>',
          })
        : new Response("source", { status }),
    retryDelayMs: 0,
  });
}

describe("persistent health triage", () => {
  it("keeps production/source mismatch and never calls HTTP a playback check", async () => {
    const artifact = await check(200, 18);
    expect(artifact.provenance.deploymentMatch).toBe("different-revision");
    expect(artifact.playbackVerification).toBe("not-performed");
  });
  it("tracks first failure, repeated failure, uncertainty, owner and restoration", async () => {
    const first = updateHealthLedger(await check(200, 18));
    expect(first.continuity).toBe("new-baseline");
    const failure = updateHealthLedger(await check(404, 19), first);
    const source = failure.entries.find((entry) => entry.kind === "source")!;
    expect(source).toMatchObject({
      status: "unavailable",
      owner: null,
      firstSeenAt: first.checkedAt,
      lastSuccessfulAt: first.checkedAt,
      firstProblemAt: failure.checkedAt,
      nextAction: "review-confirmed-failure",
    });
    source.owner = "editor";
    const repeated = updateHealthLedger(await check(404, 20), failure);
    const next = repeated.entries.find((entry) => entry.kind === "source")!;
    expect(next.consecutiveChecks).toBe(2);
    expect(next.dueAt).toBe(source.dueAt);
    expect(next.owner).toBe("editor");
    expect(
      repeated.changes.find((change) => change.id === next.id),
    ).toBeUndefined();
    const uncertain = updateHealthLedger(await check(403, 21), repeated);
    expect(
      uncertain.entries.find((entry) => entry.kind === "source")?.status,
    ).toBe("indeterminate");
    const restored = updateHealthLedger(await check(200, 22), uncertain);
    expect(
      restored.entries.find((entry) => entry.kind === "source"),
    ).toMatchObject({
      status: "available",
      dueAt: null,
      resolvedAt: restored.checkedAt,
      owner: "editor",
    });
    expect(
      restored.changes.find((change) => change.id === source.id)?.kind,
    ).toBe("restored");
  });
  it("retains removed records as inactive, not falsely fixed; rejects reverse time", async () => {
    const first = updateHealthLedger(await check(429, 18));
    const artifact = await check(200, 19);
    artifact.videos = [];
    const retired = updateHealthLedger(artifact, first);
    expect(retired.entries.every((entry) => !entry.active)).toBe(true);
    expect(
      retired.entries.find((entry) => entry.kind === "source")?.status,
    ).toBe("indeterminate");
    expect(() =>
      updateHealthLedger(
        { ...artifact, checkedAt: "2026-11-17T00:00:00Z" },
        first,
      ),
    ).toThrow("newer");
  });
});
