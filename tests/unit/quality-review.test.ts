import { describe, expect, it } from "vitest";
import { sha256Hex } from "../../src/lib/contracts/canonical";
import type { EventUpdate } from "../../src/lib/videos/event-updates";
import type { PublicInventoryEntry } from "../../src/lib/videos/public-inventory";
import {
  createQualityReviewQueue,
  extractEventReviewClaims,
  qualityReviewClaimSchema,
  qualityReviewQueueSchema,
  qualityCsv,
  reviewSourceId,
  validateSemanticReviewReceipt,
  type QualityVideoMetadata,
} from "../../src/lib/videos/quality-review";

const generatedAt = "2026-11-18T00:00:00Z";
function fixture(slug = "sample-event") {
  const videoUrl = `https://www.youtube.com/watch?v=${slug}`;
  const event: EventUpdate = {
    slug,
    videoUrl,
    eventDate: "2025-01-01",
    injury: "原報導傷勢敘述。",
    returnDate: null,
    returnSummary: "尚無可確認的首次出賽日期。",
    context: "不同傷害事件不可合併。",
    checkedAt: "2026-09-01",
    sources: [
      {
        title: "事件來源",
        url: "https://example.org/event",
        publishedAt: "2025-01-01",
      },
      {
        title: "後續來源",
        url: "https://example.org/update",
        publishedAt: "2026-08-01",
      },
    ],
    mechanism: {
      title: "觀察任務",
      summary: { text: "有來源的摘要。", sourceIndexes: [2, 1] },
      steps: ["第一個可見動作。", "第二個可見動作。"],
      explanation: { text: "一般醫學原理。", sourceIndexes: [1] },
      limitation: "影片無法證明診斷。",
    },
    timeline: [
      {
        date: "2025-01",
        title: "月份精度",
        text: "當月已知事件。",
        sourceIndexes: [1],
      },
    ],
  };
  const inventory: PublicInventoryEntry = {
    slug,
    videoUrl,
    path: `/videos/${slug}/`,
    provider: "youtube",
    startSeconds: 0,
    durationSeconds: 20,
    captionRequired: false,
    sourceUrls: event.sources.map((source) => source.url),
    references: event.sources.map((source) => ({
      url: source.url,
      kinds: ["event"],
    })),
  };
  const metadata: QualityVideoMetadata = {
    slug,
    videoUrl,
    athlete: "Test Athlete",
    sport: "籃球",
    bodyPart: "膝蓋",
    layer: "observation",
    captionStatus: "available",
    captionCheckedAt: null,
    tags: ["post-event-interview"],
    observation: "現有觀察敘述",
    limitation: "現有限制",
    windows: [],
    originalCoreReview: null,
  };
  return { inventory, event, metadata };
}
function input(count = 1) {
  const items = Array.from({ length: count }, (_, index) =>
    fixture(`event-${index}`),
  );
  return {
    inventory: items.map((item) => item.inventory),
    events: items.map((item) => item.event),
    metadata: items.map((item) => item.metadata),
    historicalPlayback: [],
    generatedAt,
    sourceCommit: "a".repeat(40),
    sourceDirty: true,
    catalogDigest: "b".repeat(64),
  };
}

function citedClaim(event = fixture().event) {
  return extractEventReviewClaims(event).find(
    (claim) => claim.field === "mechanism.summary",
  )!;
}
const evidence = "Synthetic reviewer evidence fixture, not clinical approval.";
function receipt(claim = citedClaim()) {
  return {
    schemaVersion: 1,
    claimId: claim.id,
    claimDigest: claim.digest,
    videoUrl: claim.videoUrl,
    sourceIds: claim.citations.map((source) => source.id),
    decision: "supported",
    reviewerId: "fixture-reviewer",
    reviewedAt: "2026-11-17T12:00:00Z",
    evidenceSha256: sha256Hex(evidence),
    medicalApproval: false,
    publicationApproval: false,
  };
}
const reviewOptions = {
  evidence,
  allowedReviewerIds: new Set(["fixture-reviewer"]),
  now: generatedAt,
};

describe("current semantic review worklist", () => {
  it("preserves exact text and only existing explicit source assignments", () => {
    const event = fixture().event;
    const claims = extractEventReviewClaims(event);
    const injury = claims.find((claim) => claim.field === "injury")!;
    expect(injury.text).toBe(event.injury);
    expect(injury.sourceIndexes).toBeNull();
    expect(injury.citations).toEqual([]);
    expect(injury.citationState).toBe("unlinked-no-inference");
    const summary = citedClaim(event);
    expect(summary.sourceIndexes).toEqual([2, 1]);
    expect(summary.citations.map((source) => source.url)).toEqual([
      event.sources[1]!.url,
      event.sources[0]!.url,
    ]);
    expect(summary.citations[0]!.id).toBe(
      reviewSourceId(event.sources[1]!.url),
    );
    expect(
      claims.find((claim) => claim.field === "timeline[0]")!.context,
    ).toMatchObject({
      date: "2025-01",
      title: "月份精度",
      eventDate: "2025-01-01",
    });
    expect(
      claims.every(
        (claim) =>
          claim.reviewStatus === "pending-current-semantic-review" &&
          !claim.medicalApproval,
      ),
    ).toBe(true);
  });
  it("rejects unknown citation positions instead of guessing a source", () => {
    const event = fixture().event;
    event.mechanism!.summary.sourceIndexes = [99];
    expect(() => extractEventReviewClaims(event)).toThrow(/Unknown source/);
  });
  it("rejects status relabeling and changed claim or source bindings", () => {
    const claim = citedClaim();
    for (const change of [
      { reviewStatus: "approved" },
      { medicalApproval: true },
      { text: "修改後的敘述" },
      { videoUrl: "https://www.youtube.com/watch?v=other" },
      { id: "other-id" },
      {
        citations: claim.citations.map((source) => ({
          ...source,
          url: "https://example.org/other",
        })),
      },
    ])
      expect(
        qualityReviewClaimSchema.safeParse({ ...claim, ...change }).success,
      ).toBe(false);
  });
  it("uses dynamic catalog coverage including a 201st video", () => {
    const queue = createQualityReviewQueue(input(201));
    expect(queue.entries).toHaveLength(201);
    expect(queue.coverage[0]!.count).toBe(201);
    expect(queue.flagshipPreparation.slots).toHaveLength(20);
    expect(
      queue.flagshipPreparation.slots.every((slot) => slot.slug === null),
    ).toBe(true);
    expect(queue.flagshipPreparation.selectionStatus).toBe(
      "pending-editor-selection",
    );
    expect(
      queue.entries.every(
        (entry) =>
          entry.scheduling.assignedTo === null &&
          entry.scheduling.nextReviewAt === null,
      ),
    ).toBe(true);
    expect(
      queue.entries.every(
        (entry) => entry.diseaseCourseStatus === "unclassified",
      ),
    ).toBe(true);
  });
  it("binds the 20 selected drafts in order without granting review approval", () => {
    const data = input(21);
    const flagshipSlugs = data.inventory
      .slice(1)
      .map((entry) => entry.slug)
      .reverse();
    const queue = createQualityReviewQueue({ ...data, flagshipSlugs });
    expect(queue.flagshipPreparation).toEqual({
      targetCount: 20,
      selectionStatus: "draft-selected-review-pending",
      slots: flagshipSlugs.map((slug, index) => ({
        slot: index + 1,
        slug,
        status: "draft-selected-review-pending",
      })),
    });
    expect(queue.medicalApproval).toBe(false);
    expect(queue.entries.every((entry) => !entry.medicalApproval)).toBe(true);
  });
  it.each(["empty", "short", "long", "duplicate", "unknown"])(
    "rejects %s selected draft bindings",
    (invalid) => {
      const data = input(21);
      const flagshipSlugs = data.inventory
        .slice(0, 20)
        .map((entry) => entry.slug);
      if (invalid === "empty") flagshipSlugs.length = 0;
      if (invalid === "short") flagshipSlugs.pop();
      if (invalid === "long") flagshipSlugs.push(data.inventory[20]!.slug);
      if (invalid === "duplicate") flagshipSlugs[19] = flagshipSlugs[0]!;
      if (invalid === "unknown") flagshipSlugs[19] = "outside-public-catalog";
      expect(() =>
        createQualityReviewQueue({ ...data, flagshipSlugs }),
      ).toThrow();
    },
  );
  it("rejects forged selected slot bindings and approval labels at schema validation", () => {
    const data = input(20);
    const queue = createQualityReviewQueue({
      ...data,
      flagshipSlugs: data.inventory.map((entry) => entry.slug),
    });
    const preparation = queue.flagshipPreparation;
    for (const slots of [
      preparation.slots.slice(1),
      [...preparation.slots, preparation.slots[0]],
      preparation.slots.map((slot, index) =>
        index === 0 ? { ...slot, slug: "outside-public-catalog" } : slot,
      ),
      preparation.slots.map((slot, index) =>
        index === 0 ? { ...slot, slug: preparation.slots[1]!.slug } : slot,
      ),
      preparation.slots.map((slot) => ({ ...slot, slot: 1 })),
      preparation.slots.map((slot) => ({
        ...slot,
        status: "clinical-approved",
      })),
      preparation.slots.map((slot) => ({ ...slot, slug: null })),
    ])
      expect(
        qualityReviewQueueSchema.safeParse({
          ...queue,
          flagshipPreparation: { ...preparation, slots },
        }).success,
      ).toBe(false);
    for (const selectionStatus of [
      "clinical-approved",
      "pending-editor-selection",
    ])
      expect(
        qualityReviewQueueSchema.safeParse({
          ...queue,
          flagshipPreparation: { ...preparation, selectionStatus },
        }).success,
      ).toBe(false);
  });
  it("uses the Taiwan review date for the inclusive two-year priority boundary", () => {
    const data = input();
    data.generatedAt = "2026-11-17T18:00:00Z";
    data.events[0]!.eventDate = "2024-11-18";
    expect(createQualityReviewQueue(data).reviewDate).toBe("2026-11-18");
    expect(
      createQualityReviewQueue(data).entries[0]!.scheduling.reasons,
    ).toContain("recent-event-date");
    data.events[0]!.eventDate = "2024-11-17";
    expect(
      createQualityReviewQueue(data).entries[0]!.scheduling.reasons,
    ).not.toContain("recent-event-date");
  });
  it("keeps historical playback and caption metadata separate from current checks", () => {
    const data = input();
    const queue = createQualityReviewQueue({
      ...data,
      historicalPlayback: [
        {
          url: data.inventory[0]!.videoUrl,
          path: data.inventory[0]!.path,
          origin: "https://preview.example.org",
          checkedAt: "2026-10-19T16:50:00Z",
          status: "played",
        },
      ],
    });
    expect(queue.entries[0]).toMatchObject({
      metadata: { captionStatus: "available" },
      historicalPlayback: { status: "played", scope: "historical-only" },
      currentManualCheck: "pending",
      currentPlayback: "pending",
      existingContentCheckedAt: "2026-09-01",
      medicalApproval: false,
    });
    const changed = structuredClone(queue);
    (
      changed.entries[0] as unknown as { currentPlayback: string }
    ).currentPlayback = "passed";
    expect(qualityReviewQueueSchema.safeParse(changed).success).toBe(false);
  });
  it("does not inherit playback from the same title on another page", () => {
    const data = input();
    const queue = createQualityReviewQueue({
      ...data,
      historicalPlayback: [
        {
          url: data.inventory[0]!.videoUrl,
          path: "/videos/another-event/",
          origin: "https://preview.example.org",
          checkedAt: "2026-10-19T16:50:00Z",
          status: "played",
        },
      ],
    });
    expect(queue.entries[0]!.historicalPlayback).toBeNull();
  });
  it("fails closed on missing event or mismatched video metadata", () => {
    const data = input();
    expect(() => createQualityReviewQueue({ ...data, events: [] })).toThrow(
      /Missing/,
    );
    data.metadata[0]!.videoUrl = "https://example.org/other-video";
    expect(() => createQualityReviewQueue(data)).toThrow(
      /changed review binding/,
    );
  });
  it("rejects altered source registry and out-of-range teaching windows", () => {
    const queue = createQualityReviewQueue(input());
    queue.entries[0]!.sources[0]!.title = "changed source";
    expect(qualityReviewQueueSchema.safeParse(queue).success).toBe(false);
    const data = input();
    data.metadata[0]!.windows = [
      {
        startSeconds: 0,
        endSeconds: 100,
        note: "wrong window",
        source: "content-type-registry",
      },
    ];
    expect(() => createQualityReviewQueue(data)).toThrow(/Teaching window/);
  });
});

describe("review receipt binding without publication authority", () => {
  it("accepts a matching documented review but grants no medical approval", () => {
    const result = validateSemanticReviewReceipt(
      receipt(),
      citedClaim(),
      reviewOptions,
    );
    expect(result.medicalApproval).toBe(false);
    expect(result.publicationApproval).toBe(false);
    expect(citedClaim().reviewStatus).toBe("pending-current-semantic-review");
  });
  it.each([
    { medicalApproval: true },
    { publicationApproval: true },
    { decision: "approved" },
    { reviewerId: "unapproved-reviewer" },
    { claimDigest: "f".repeat(64) },
    { sourceIds: [] },
    { videoUrl: "https://example.org/replaced-video" },
    { evidenceSha256: "e".repeat(64) },
    { reviewedAt: "2027-01-01T00:00:00Z" },
  ])("rejects invented approval or mismatched evidence %#", (change) => {
    expect(() =>
      validateSemanticReviewReceipt(
        { ...receipt(), ...change },
        citedClaim(),
        reviewOptions,
      ),
    ).toThrow();
  });
  it("invalidates the old receipt after any original statement, video or source change", () => {
    const original = receipt();
    for (const change of ["text", "video", "source", "event-date"] as const) {
      const event = fixture().event;
      if (change === "text") event.mechanism!.summary.text += "新增敘述。";
      if (change === "video") event.videoUrl = "https://example.org/new-video";
      if (change === "source") event.sources[0]!.title += "更正";
      if (change === "event-date") event.eventDate = "2025-01-02";
      expect(() =>
        validateSemanticReviewReceipt(
          original,
          citedClaim(event),
          reviewOptions,
        ),
      ).toThrow(/stale/);
    }
  });
  it("requires evidence bytes and explicit attribution for a supported claim", () => {
    expect(() =>
      validateSemanticReviewReceipt(receipt(), citedClaim(), {
        ...reviewOptions,
        evidence: "",
      }),
    ).toThrow(/evidence/);
    const uncited = extractEventReviewClaims(fixture().event)[0]!;
    expect(() =>
      validateSemanticReviewReceipt(receipt(uncited), uncited, reviewOptions),
    ).toThrow(/explicit source/);
  });
});

describe("review exports", () => {
  it("neutralizes formula prefixes preceded by whitespace", () => {
    expect(qualityCsv([["  =SUM(1,2)", "\t+1"]])).toContain("'  =SUM(1,2)");
    expect(qualityCsv([["  =SUM(1,2)", "\t+1"]])).toContain("'\t+1");
  });
  it("quotes cells and neutralizes spreadsheet formulas without altering JSON originals", () => {
    expect(
      qualityCsv([["=SUM(1,2)", 'quoted "text"', "line\nbreak", null]]),
    ).toBe('"\'=SUM(1,2)","quoted ""text""","line\nbreak",""\r\n');
  });
});
