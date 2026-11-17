import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "astro/zod";
import { caseSchema } from "../src/lib/contracts/case";
import { findSport } from "../src/lib/contracts/taxonomy";
import { videosByBodyPart } from "../src/lib/videos/body-parts";
import { contentTypeEntryFor } from "../src/lib/videos/content-types";
import { eventUpdates } from "../src/lib/videos/event-updates";
import { allObservationClips } from "../src/lib/videos/expansion";
import { videoLearning } from "../src/lib/videos/learning";
import { publicInventoryDigest } from "../src/lib/videos/public-inventory";
import {
  createQualityReviewQueue,
  qualityCsv,
  qualityVideoMetadataSchema,
} from "../src/lib/videos/quality-review";
import { loadPublicVideoInventory } from "./lib/public-video-inventory";

const inventory = loadPublicVideoInventory();
const cases = readdirSync("src/content/cases")
  .filter((file) => file.endsWith(".json"))
  .map((file) =>
    caseSchema.parse(
      JSON.parse(readFileSync(`src/content/cases/${file}`, "utf8")),
    ),
  );
const metadata = inventory.map((video) => {
  const record = cases.find((item) => item.slug === video.slug);
  const clip = allObservationClips.find((item) => item.slug === video.slug);
  const event = eventUpdates.entries.find((item) => item.slug === video.slug)!;
  const classification = contentTypeEntryFor(video.slug, video.videoUrl);
  if ((!record && !clip) || (record && clip))
    throw new Error(`Ambiguous public metadata: ${video.slug}`);
  const parts = videosByBodyPart(record ? [record] : [], clip ? [clip] : []);
  return qualityVideoMetadataSchema.parse({
    slug: video.slug,
    videoUrl: video.videoUrl,
    athlete: record?.athlete.name ?? clip!.name,
    sport: record
      ? (findSport(record.sport.code)?.labelZh ?? record.sport.code)
      : clip!.sport,
    bodyPart: parts[0]?.label ?? "未分類",
    layer: record ? "core" : "observation",
    captionStatus: record?.video.captionStatus ?? clip!.captionStatus,
    captionCheckedAt: record?.video.captionCheckedAt ?? null,
    tags: classification?.tags ?? [],
    observation: record?.general.whatIsVisible ?? clip!.observation,
    limitation:
      record?.general.whatVideoCannotProve ??
      event.mechanism?.limitation ??
      "尚未整理",
    windows: [
      ...(record?.video.segments.map((segment) => ({
        startSeconds: segment.startSeconds,
        endSeconds: segment.endSeconds,
        note: segment.observation,
        source: "core-video-contract",
      })) ?? []),
      ...(classification?.segments?.map((segment) => ({
        startSeconds: segment.startSeconds,
        endSeconds: segment.endSeconds ?? null,
        note: segment.note,
        source: "content-type-registry",
      })) ?? []),
    ],
    originalCoreReview: record
      ? {
          status: record.review.status,
          reviewedAt: record.review.reviewedAt,
          contentDigest: record.review.reviewedContentDigest,
          scope: "historical-original-core-only",
        }
      : null,
  });
});
const historicalPlayback = z
  .array(
    z.object({
      url: z.url(),
      path: z.string(),
      origin: z.url(),
      checkedAt: z.iso.datetime({ offset: true }),
      status: z.string(),
    }),
  )
  .parse(
    JSON.parse(
      readFileSync(
        "docs/reviews/2026-10-20-ux-release/playback.all.json",
        "utf8",
      ),
    ),
  );
const queue = createQualityReviewQueue({
  inventory,
  events: eventUpdates.entries,
  metadata,
  historicalPlayback,
  flagshipSlugs: videoLearning.entries.map((entry) => entry.slug),
  generatedAt: new Date().toISOString(),
  sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  sourceDirty:
    execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()
      .length > 0,
  catalogDigest: publicInventoryDigest(inventory),
});
const output = resolve("output/site-quality-validation");
mkdirSync(output, { recursive: true });
const writeJson = (file: string, value: unknown) =>
  writeFileSync(resolve(output, file), JSON.stringify(value, null, 2) + "\n");
writeJson("content-review.json", queue);
writeFileSync(
  resolve(output, "content-review.csv"),
  qualityCsv([
    [
      "slug",
      "path",
      "athlete",
      "sport",
      "bodyPart",
      "videoUrl",
      "videoTypes",
      "existingContentCheckedAt",
      "eventDate",
      "returnDate",
      "diseaseCourseStatus",
      "priority",
      "priorityReasons",
      "ownerRoles",
      "assignedTo",
      "nextReviewAt",
      "assignmentStatus",
      "captionMetadata",
      "currentManualCheck",
      "currentPlayback",
      "historicalPlaybackDate",
      "historicalPlaybackScope",
      "claims",
      "unlinkedClaims",
      "teachingGaps",
    ],
    ...queue.entries.map((entry) => [
      entry.slug,
      entry.path,
      entry.metadata.athlete,
      entry.metadata.sport,
      entry.metadata.bodyPart,
      entry.videoUrl,
      entry.metadata.tags.join(";"),
      entry.existingContentCheckedAt,
      entry.eventDate,
      entry.returnDate,
      entry.diseaseCourseStatus,
      entry.scheduling.priority,
      entry.scheduling.reasons.join(";"),
      entry.scheduling.ownerRoles.join(";"),
      entry.scheduling.assignedTo,
      entry.scheduling.nextReviewAt,
      entry.scheduling.assignmentStatus,
      entry.metadata.captionStatus,
      entry.currentManualCheck,
      entry.currentPlayback,
      entry.historicalPlayback?.checkedAt,
      entry.historicalPlayback?.scope,
      entry.claims.length,
      entry.claims.filter((claim) => claim.sourceIndexes === null).length,
      entry.teachingGaps.join(";"),
    ]),
  ]),
);
writeFileSync(
  resolve(output, "content-review-claims.csv"),
  qualityCsv([
    [
      "claimId",
      "slug",
      "path",
      "videoUrl",
      "field",
      "originalText",
      "context",
      "sourceIndexes",
      "sourceIds",
      "sourceUrls",
      "citationState",
      "claimDigest",
      "reviewStatus",
      "medicalApproval",
    ],
    ...queue.entries.flatMap((entry) =>
      entry.claims.map((claim) => [
        claim.id,
        entry.slug,
        entry.path,
        entry.videoUrl,
        claim.field,
        claim.text,
        JSON.stringify(claim.context),
        JSON.stringify(claim.sourceIndexes),
        claim.citations.map((source) => source.id).join(";"),
        claim.citations.map((source) => source.url).join(";"),
        claim.citationState,
        claim.digest,
        claim.reviewStatus,
        claim.medicalApproval,
      ]),
    ),
  ]),
);
const references = new Map<
  string,
  { id: string; url: string; slugs: Set<string>; kinds: Set<string> }
>();
for (const entry of queue.entries)
  for (const source of entry.references) {
    const row = references.get(source.id) ?? {
      id: source.id,
      url: source.url,
      slugs: new Set<string>(),
      kinds: new Set<string>(),
    };
    row.slugs.add(entry.slug);
    source.kinds.forEach((kind) => row.kinds.add(kind));
    references.set(source.id, row);
  }
writeFileSync(
  resolve(output, "content-review-sources.csv"),
  qualityCsv([
    [
      "sourceId",
      "url",
      "affectedSlugs",
      "roles",
      "currentReadability",
      "currentSemanticSupport",
    ],
    ...[...references.values()]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((source) => [
        source.id,
        source.url,
        [...source.slugs].join(";"),
        [...source.kinds].sort().join(";"),
        "not-checked-by-this-tool",
        "pending-current-semantic-review",
      ]),
  ]),
);
writeFileSync(
  resolve(output, "content-review-coverage.csv"),
  qualityCsv([
    ["bodyPart", "sport", "videoType", "count", "slugs"],
    ...queue.coverage.map((cell) => [
      cell.bodyPart,
      cell.sport,
      cell.videoType,
      cell.count,
      cell.slugs.join(";"),
    ]),
  ]),
);
const claims = queue.entries.flatMap((entry) => entry.claims);
const summary = {
  generatedAt: queue.generatedAt,
  reviewDate: queue.reviewDate,
  sourceCommit: queue.sourceCommit,
  sourceDirty: queue.sourceDirty,
  catalogDigest: queue.catalogDigest,
  videos: queue.entries.length,
  reportClaims: claims.length,
  explicitlyLinkedClaims: claims.filter((claim) => claim.sourceIndexes !== null)
    .length,
  unlinkedClaims: claims.filter((claim) => claim.sourceIndexes === null).length,
  uniquePublicReferences: references.size,
  historicalPlaybackRecords: queue.entries.filter(
    (entry) => entry.historicalPlayback,
  ).length,
  captionMetadata: Object.fromEntries(
    ["available", "unavailable", "not-verified"].map((status) => [
      status,
      queue.entries.filter((entry) => entry.metadata.captionStatus === status)
        .length,
    ]),
  ),
  withoutTeachingWindows: queue.entries.filter(
    (entry) => !entry.metadata.windows.length,
  ).length,
  windowsWithUnknownEnd: queue.entries
    .flatMap((entry) => entry.metadata.windows)
    .filter((window) => window.endSeconds === null).length,
  p1ReviewQueue: queue.entries.filter(
    (entry) => entry.scheduling.priority === "P1",
  ).length,
  unassignedEvents: queue.entries.filter(
    (entry) => entry.scheduling.assignedTo === null,
  ).length,
  coverageCells: queue.coverage.length,
  flagshipSlotsPending: queue.flagshipPreparation.slots.filter(
    (slot) => slot.slug === null,
  ).length,
  flagshipDraftsSelected: queue.flagshipPreparation.slots.filter(
    (slot) => slot.status === "draft-selected-review-pending",
  ).length,
  flagshipReviewsPending: queue.flagshipPreparation.slots.length,
  currentSemanticChecksCompleted: 0,
  currentManualMediaChecksCompleted: 0,
  medicalApprovalsGranted: 0,
};
writeJson("content-review-summary.json", summary);
console.log(JSON.stringify({ ...summary, output }, null, 2));
