/** Build-time review worklists, never a medical or publication approval ledger. */
import { z } from "astro/zod";
import { sha256Hex, canonicalJson } from "../contracts/canonical";
import type { EventUpdate } from "./event-updates";
import type { PublicInventoryEntry } from "./public-inventory";

const text = z.string().min(1);
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const https = z.url({ protocol: /^https$/ });
const pending = z.literal("pending-current-semantic-review");
const sourceSchema = z.strictObject({
  id: text,
  url: https,
  sourceIndex: z.number().int().positive(),
  title: text,
  publishedAt: z.iso.date().nullable(),
});
export const qualityReviewClaimSchema = z
  .strictObject({
    id: text,
    slug: text,
    videoUrl: https,
    field: text,
    text,
    context: z.record(z.string(), z.string()),
    sourceIndexes: z.array(z.number().int().positive()).nullable(),
    citations: z.array(sourceSchema),
    citationState: z.enum([
      "existing-explicit-reference",
      "unlinked-no-inference",
    ]),
    digest: hash,
    reviewStatus: pending,
    medicalApproval: z.literal(false),
  })
  .superRefine((claim, ctx) => {
    if (
      claim.sourceIndexes === null
        ? claim.citations.length !== 0 ||
          claim.citationState !== "unlinked-no-inference"
        : claim.citationState !== "existing-explicit-reference" ||
          claim.sourceIndexes.length !== claim.citations.length ||
          claim.sourceIndexes.some(
            (index, position) =>
              index !== claim.citations[position]?.sourceIndex,
          )
    )
      ctx.addIssue({
        code: "custom",
        message: "Citation mapping must preserve explicit source indexes only",
      });
    if (claim.id !== `${claim.slug}#${claim.field}`)
      ctx.addIssue({ code: "custom", message: "Claim identity mismatch" });
    if (
      claim.citations.some((source) => source.id !== reviewSourceId(source.url))
    )
      ctx.addIssue({ code: "custom", message: "Source identity mismatch" });
    if (claim.digest !== qualityClaimDigest(claim))
      ctx.addIssue({
        code: "custom",
        message: "Claim binding digest mismatch",
      });
  });
export type QualityReviewClaim = z.infer<typeof qualityReviewClaimSchema>;

export function reviewSourceId(url: string): string {
  return `source-${sha256Hex(url)}`;
}
/** Exact original strings and reference order are bound, including uncited status. */
export function qualityClaimDigest(
  claim: Pick<
    QualityReviewClaim,
    | "slug"
    | "videoUrl"
    | "field"
    | "text"
    | "context"
    | "sourceIndexes"
    | "citations"
  >,
): string {
  return sha256Hex(
    JSON.stringify({
      slug: claim.slug,
      videoUrl: claim.videoUrl,
      field: claim.field,
      text: claim.text,
      context: Object.fromEntries(
        Object.entries(claim.context).sort(([a], [b]) =>
          a.localeCompare(b, "en"),
        ),
      ),
      sourceIndexes: claim.sourceIndexes,
      citations: claim.citations.map((source) => ({
        id: source.id,
        url: source.url,
        sourceIndex: source.sourceIndex,
        title: source.title,
        publishedAt: source.publishedAt,
      })),
    }),
  );
}

export function extractEventReviewClaims(
  event: EventUpdate,
): QualityReviewClaim[] {
  const claims: QualityReviewClaim[] = [];
  const add = (
    field: string,
    content: string,
    sourceIndexes: number[] | null = null,
    context: Record<string, string> = {},
  ) => {
    const citations = (sourceIndexes ?? []).map((index) => {
      const source = event.sources[index - 1];
      if (!source)
        throw new Error(
          `Unknown source index ${index}: ${event.slug} ${field}`,
        );
      return { id: reviewSourceId(source.url), sourceIndex: index, ...source };
    });
    const binding = {
      slug: event.slug,
      videoUrl: event.videoUrl,
      field,
      text: content,
      context: {
        eventDate: event.eventDate ?? "unknown",
        eventDateCertainty: event.eventDateCertainty ?? "not-specified",
        returnDate: event.returnDate ?? "unknown",
        returnDateCertainty: event.returnDateCertainty ?? "not-specified",
        ...context,
      },
      sourceIndexes,
      citations,
    };
    claims.push(
      qualityReviewClaimSchema.parse({
        ...binding,
        id: `${event.slug}#${field}`,
        digest: qualityClaimDigest(binding),
        citationState:
          sourceIndexes === null
            ? "unlinked-no-inference"
            : "existing-explicit-reference",
        reviewStatus: "pending-current-semantic-review",
        medicalApproval: false,
      }),
    );
  };
  add("injury", event.injury);
  add("returnSummary", event.returnSummary);
  add("context", event.context);
  if (event.mechanism) {
    add("mechanism.title", event.mechanism.title);
    for (const field of ["summary", "explanation", "research"] as const) {
      const value = event.mechanism[field];
      if (value) add(`mechanism.${field}`, value.text, value.sourceIndexes);
    }
    event.mechanism.steps.forEach((step, index) =>
      add(`mechanism.steps[${index}]`, step),
    );
    add("mechanism.limitation", event.mechanism.limitation);
  }
  event.timeline?.forEach((item, index) =>
    add(`timeline[${index}]`, item.text, item.sourceIndexes, {
      date: item.date,
      title: item.title,
    }),
  );
  event.returnMilestones?.forEach((item, index) =>
    add(`returnMilestones[${index}]`, item.text, item.sourceIndexes, {
      date: item.date,
      kind: item.kind,
    }),
  );
  return claims;
}

const windowSchema = z.strictObject({
  startSeconds: z.number().int().nonnegative(),
  endSeconds: z.number().int().positive().nullable(),
  note: text,
  source: z.enum(["core-video-contract", "content-type-registry"]),
});
export const qualityVideoMetadataSchema = z.strictObject({
  slug: text,
  videoUrl: https,
  athlete: text,
  sport: text,
  bodyPart: text,
  layer: z.enum(["core", "observation"]),
  captionStatus: z.enum(["available", "unavailable", "not-verified"]),
  captionCheckedAt: z.string().nullable(),
  tags: z.array(text),
  observation: text,
  limitation: text,
  windows: z.array(windowSchema),
  originalCoreReview: z
    .strictObject({
      status: text,
      reviewedAt: z.string().nullable(),
      contentDigest: hash.nullable(),
      scope: z.literal("historical-original-core-only"),
    })
    .nullable(),
});
export type QualityVideoMetadata = z.infer<typeof qualityVideoMetadataSchema>;
export interface HistoricalPlayback {
  url: string;
  path: string;
  origin: string;
  checkedAt: string;
  status: string;
}
const historicalSchema = z.strictObject({
  origin: https,
  checkedAt: z.iso.datetime({ offset: true }),
  status: text,
  evidencePath: text,
  scope: z.literal("historical-only"),
});
export const qualityReviewEntrySchema = z.strictObject({
  slug: text,
  path: text,
  videoUrl: https,
  provider: z.enum(["youtube", "mlb"]),
  startSeconds: z.number().int().nonnegative(),
  durationSeconds: z.number().int().positive(),
  metadata: qualityVideoMetadataSchema,
  existingContentCheckedAt: z.iso.date(),
  eventDate: z.iso.date().nullable(),
  returnDate: z.iso.date().nullable(),
  diseaseCourseStatus: z.literal("unclassified"),
  scheduling: z.strictObject({
    priority: z.enum(["P1", "P2"]),
    reasons: z.array(text),
    ownerRoles: z.array(z.enum(["medical-editor", "media-reviewer"])),
    assignedTo: z.null(),
    nextReviewAt: z.null(),
    assignmentStatus: z.literal("unassigned"),
  }),
  sources: z.array(sourceSchema),
  references: z.array(
    z.strictObject({ id: text, url: https, kinds: z.array(text) }),
  ),
  claims: z.array(qualityReviewClaimSchema),
  currentManualCheck: z.literal("pending"),
  currentPlayback: z.literal("pending"),
  historicalPlayback: historicalSchema.nullable(),
  teachingGaps: z.array(text),
  medicalApproval: z.literal(false),
});
export const qualityReviewQueueSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    scope: z.literal("public-catalog-review-worklist"),
    generatedAt: z.iso.datetime({ offset: true }),
    reviewDate: z.iso.date(),
    sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
    sourceDirty: z.boolean(),
    catalogDigest: hash,
    medicalApproval: z.literal(false),
    entries: z.array(qualityReviewEntrySchema),
    coverage: z.array(
      z.strictObject({
        bodyPart: text,
        sport: text,
        videoType: text,
        count: z.number().int().positive(),
        slugs: z.array(text),
      }),
    ),
    flagshipPreparation: z.discriminatedUnion("selectionStatus", [
      z.strictObject({
        targetCount: z.literal(20),
        selectionStatus: z.literal("pending-editor-selection"),
        slots: z
          .array(
            z.strictObject({
              slot: z.number().int().positive(),
              slug: z.null(),
              status: z.literal("pending-selection-and-review"),
            }),
          )
          .length(20),
      }),
      z.strictObject({
        targetCount: z.literal(20),
        selectionStatus: z.literal("draft-selected-review-pending"),
        slots: z
          .array(
            z.strictObject({
              slot: z.number().int().positive(),
              slug: text,
              status: z.literal("draft-selected-review-pending"),
            }),
          )
          .length(20),
      }),
    ]),
  })
  .superRefine((queue, ctx) => {
    const slugs = new Set(queue.entries.map((entry) => entry.slug));
    if (slugs.size !== queue.entries.length)
      ctx.addIssue({ code: "custom", message: "Duplicate review event" });
    const flagship = queue.flagshipPreparation;
    if (flagship.slots.some((slot, index) => slot.slot !== index + 1))
      ctx.addIssue({ code: "custom", message: "Invalid flagship slot order" });
    if (flagship.selectionStatus === "draft-selected-review-pending") {
      if (new Set(flagship.slots.map((slot) => slot.slug)).size !== 20)
        ctx.addIssue({ code: "custom", message: "Duplicate flagship slug" });
      for (const slot of flagship.slots)
        if (!slugs.has(slot.slug))
          ctx.addIssue({
            code: "custom",
            message: `Flagship slug missing from public catalog: ${slot.slug}`,
          });
    }
    for (const entry of queue.entries) {
      if (
        entry.metadata.slug !== entry.slug ||
        entry.metadata.videoUrl !== entry.videoUrl ||
        entry.claims.some(
          (claim) =>
            claim.slug !== entry.slug || claim.videoUrl !== entry.videoUrl,
        )
      )
        ctx.addIssue({
          code: "custom",
          message: "Review event binding mismatch",
        });
      if (
        [...entry.sources, ...entry.references].some(
          (source) => source.id !== reviewSourceId(source.url),
        )
      )
        ctx.addIssue({
          code: "custom",
          message: "Reference identity mismatch",
        });
      for (const claim of entry.claims)
        for (const citation of claim.citations) {
          if (
            canonicalJson(citation) !==
            canonicalJson(entry.sources[citation.sourceIndex - 1] ?? null)
          )
            ctx.addIssue({
              code: "custom",
              message: "Claim citation does not match current event sources",
            });
        }
      if (
        entry.metadata.windows.some(
          (window) =>
            window.startSeconds >= entry.durationSeconds ||
            (window.endSeconds !== null &&
              (window.endSeconds <= window.startSeconds ||
                window.endSeconds > entry.durationSeconds)),
        )
      )
        ctx.addIssue({
          code: "custom",
          message: "Teaching window outside bound video",
        });
    }
  });
export type QualityReviewQueue = z.infer<typeof qualityReviewQueueSchema>;

export function createQualityReviewQueue(input: {
  inventory: readonly PublicInventoryEntry[];
  events: readonly EventUpdate[];
  metadata: readonly QualityVideoMetadata[];
  historicalPlayback: readonly HistoricalPlayback[];
  flagshipSlugs?: readonly string[];
  generatedAt: string;
  sourceCommit: string;
  sourceDirty: boolean;
  catalogDigest: string;
}): QualityReviewQueue {
  const bySlug = new Map(input.events.map((event) => [event.slug, event]));
  const metadata = new Map(input.metadata.map((item) => [item.slug, item]));
  if (
    bySlug.size !== input.events.length ||
    metadata.size !== input.metadata.length
  )
    throw new Error("Duplicate event or metadata binding");
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(input.generatedAt));
  const cutoffDate = new Date(`${day}T00:00:00Z`);
  const month = cutoffDate.getUTCMonth();
  cutoffDate.setUTCFullYear(cutoffDate.getUTCFullYear() - 2);
  if (cutoffDate.getUTCMonth() !== month) cutoffDate.setUTCDate(0);
  const cutoff = cutoffDate.toISOString().slice(0, 10);
  const audioTags = new Set([
    "post-event-interview",
    "expert-analysis",
    "news-report",
    "documentary-retrospective",
  ]);
  const entries = input.inventory.map((video) => {
    const event = bySlug.get(video.slug);
    const meta = metadata.get(video.slug);
    if (
      !event ||
      !meta ||
      event.videoUrl !== video.videoUrl ||
      meta.videoUrl !== video.videoUrl
    )
      throw new Error(`Missing or changed review binding: ${video.slug}`);
    const claims = extractEventReviewClaims(event);
    const reasons = [
      ...(event.eventDate && event.eventDate >= cutoff && event.eventDate <= day
        ? ["recent-event-date"]
        : []),
      ...(event.returnDate === null
        ? ["return-date-unresolved-not-active-diagnosis"]
        : []),
      ...(meta.tags.some((tag) => audioTags.has(tag))
        ? ["audio-led-content"]
        : []),
      ...(video.durationSeconds > 600 ? ["long-video"] : []),
    ];
    const historical = input.historicalPlayback
      .filter((item) => item.url === video.videoUrl && item.path === video.path)
      .sort((a, b) => b.checkedAt.localeCompare(a.checkedAt))[0];
    const gaps = [
      "current-semantic-review-pending",
      "current-media-accessibility-check-pending",
      "current-playback-check-pending",
      "learning-objective-and-assessment-review-pending",
      ...(claims.some((claim) => claim.sourceIndexes === null)
        ? ["unlinked-report-claims-need-attribution-review"]
        : []),
      ...(meta.windows.length === 0 ? ["teaching-window-not-defined"] : []),
      ...(meta.windows.some((window) => window.endSeconds === null)
        ? ["teaching-window-end-not-reviewed"]
        : []),
    ];
    return {
      slug: video.slug,
      path: video.path,
      videoUrl: video.videoUrl,
      provider: video.provider,
      startSeconds: video.startSeconds,
      durationSeconds: video.durationSeconds,
      metadata: meta,
      existingContentCheckedAt: event.checkedAt,
      eventDate: event.eventDate,
      returnDate: event.returnDate,
      diseaseCourseStatus: "unclassified" as const,
      scheduling: {
        priority: reasons.length ? ("P1" as const) : ("P2" as const),
        reasons,
        ownerRoles: ["medical-editor", "media-reviewer"] as const,
        assignedTo: null,
        nextReviewAt: null,
        assignmentStatus: "unassigned" as const,
      },
      sources: event.sources.map((source, index) => ({
        ...source,
        id: reviewSourceId(source.url),
        sourceIndex: index + 1,
      })),
      references: video.references.map((reference) => ({
        id: reviewSourceId(reference.url),
        ...reference,
      })),
      claims,
      currentManualCheck: "pending" as const,
      currentPlayback: "pending" as const,
      historicalPlayback: historical
        ? {
            origin: historical.origin,
            checkedAt: historical.checkedAt,
            status: historical.status,
            evidencePath:
              "docs/reviews/2026-10-20-ux-release/playback.all.json",
            scope: "historical-only" as const,
          }
        : null,
      teachingGaps: gaps,
      medicalApproval: false as const,
    };
  });
  const matrix = new Map<
    string,
    {
      bodyPart: string;
      sport: string;
      videoType: string;
      count: number;
      slugs: string[];
    }
  >();
  for (const entry of entries)
    for (const videoType of entry.metadata.tags.length
      ? entry.metadata.tags
      : ["unclassified"]) {
      const key = JSON.stringify([
        entry.metadata.bodyPart,
        entry.metadata.sport,
        videoType,
      ]);
      const cell = matrix.get(key) ?? {
        bodyPart: entry.metadata.bodyPart,
        sport: entry.metadata.sport,
        videoType,
        count: 0,
        slugs: [],
      };
      cell.count++;
      cell.slugs.push(entry.slug);
      matrix.set(key, cell);
    }
  return qualityReviewQueueSchema.parse({
    schemaVersion: 1,
    scope: "public-catalog-review-worklist",
    generatedAt: input.generatedAt,
    reviewDate: day,
    sourceCommit: input.sourceCommit,
    sourceDirty: input.sourceDirty,
    catalogDigest: input.catalogDigest,
    medicalApproval: false,
    entries,
    coverage: [...matrix.values()].sort((a, b) =>
      canonicalJson(a).localeCompare(canonicalJson(b), "en"),
    ),
    flagshipPreparation:
      input.flagshipSlugs === undefined
        ? {
            targetCount: 20,
            selectionStatus: "pending-editor-selection",
            slots: Array.from({ length: 20 }, (_, index) => ({
              slot: index + 1,
              slug: null,
              status: "pending-selection-and-review",
            })),
          }
        : {
            targetCount: 20,
            selectionStatus: "draft-selected-review-pending",
            slots: input.flagshipSlugs.map((slug, index) => ({
              slot: index + 1,
              slug,
              status: "draft-selected-review-pending",
            })),
          },
  });
}

/** This receipt only binds a documented review; it cannot authorize publication. */
export const semanticReviewReceiptSchema = z.strictObject({
  schemaVersion: z.literal(1),
  claimId: text,
  claimDigest: hash,
  videoUrl: https,
  sourceIds: z.array(text),
  decision: z.enum(["supported", "needs-correction", "unverifiable"]),
  reviewerId: text,
  reviewedAt: z.iso.datetime({ offset: true }),
  evidenceSha256: hash,
  medicalApproval: z.literal(false),
  publicationApproval: z.literal(false),
});
export function validateSemanticReviewReceipt(
  value: unknown,
  claim: QualityReviewClaim,
  options: {
    evidence: string | Uint8Array;
    allowedReviewerIds: ReadonlySet<string>;
    now: string;
  },
): z.infer<typeof semanticReviewReceiptSchema> {
  const receipt = semanticReviewReceiptSchema.parse(value);
  qualityReviewClaimSchema.parse(claim);
  if (!options.allowedReviewerIds.has(receipt.reviewerId))
    throw new Error("Reviewer not authorized for this review worklist");
  if (
    receipt.claimId !== claim.id ||
    receipt.claimDigest !== claim.digest ||
    receipt.videoUrl !== claim.videoUrl ||
    JSON.stringify(receipt.sourceIds) !==
      JSON.stringify(claim.citations.map((source) => source.id))
  )
    throw new Error(
      "Review receipt is stale or bound to different content, media or sources",
    );
  if (receipt.decision === "supported" && !claim.citations.length)
    throw new Error("Supported review needs explicit source attribution first");
  if (
    !options.evidence.length ||
    receipt.evidenceSha256 !== sha256Hex(options.evidence)
  )
    throw new Error("Review evidence digest mismatch");
  if (
    Date.parse(receipt.reviewedAt) > Date.parse(options.now) ||
    !Number.isFinite(Date.parse(options.now))
  )
    throw new Error("Invalid review date");
  return receipt;
}

/** Spreadsheet-safe output; raw original strings remain available in JSON. */
export function qualityCsv(rows: readonly (readonly unknown[])[]): string {
  return (
    rows
      .map((row) =>
        row
          .map((value) => {
            const raw =
              value === null || value === undefined ? "" : String(value);
            const safe = /^(?:[\t\r\n ]*[=+\-@]|[\t\r\n])/.test(raw)
              ? `'${raw}`
              : raw;
            return `"${safe.replaceAll('"', '""')}"`;
          })
          .join(","),
      )
      .join("\r\n") + "\r\n"
  );
}
