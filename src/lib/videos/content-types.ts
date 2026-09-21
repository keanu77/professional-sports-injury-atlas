import { z } from "astro/zod";
import data from "../../data/video-content-types.v1.json";
import type { InjuryCase } from "../contracts/case";
import type { ObservationClip } from "./expansion";

/** These labels describe what the reviewed source contains, never a diagnosis. */
export const CONTENT_TYPES = [
  { id: "injury-moment", label: "受傷瞬間" },
  { id: "immediate-aftermath", label: "傷後反應／退場" },
  { id: "post-event-interview", label: "事後採訪／本人說明" },
  { id: "news-report", label: "新聞報導" },
  { id: "expert-analysis", label: "專業解說" },
  { id: "rehab-return", label: "復健／回場紀錄" },
  { id: "documentary-retrospective", label: "紀錄片／事件回顧" },
  { id: "match-record-commentary", label: "賽事紀錄／觀賽評論" },
] as const;

export type ContentTypeId = (typeof CONTENT_TYPES)[number]["id"];
export type VideoContentType = (typeof CONTENT_TYPES)[number];

const contentTypeIds = CONTENT_TYPES.map((type) => type.id) as [
  ContentTypeId,
  ...ContentTypeId[],
];
const contentTypeById = new Map(CONTENT_TYPES.map((type) => [type.id, type]));

const segmentSchema = z.strictObject({
  startSeconds: z.number().int().nonnegative(),
  typeIds: z.array(z.enum(contentTypeIds)).min(1),
  note: z.string().min(1),
});

export const videoContentTypeEntrySchema = z.strictObject({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  videoUrl: z.url({ protocol: /^https$/ }),
  tags: z.array(z.enum(contentTypeIds)).min(1),
  reviewedAt: z.iso.datetime({ offset: true }),
  evidenceRefs: z.array(z.string().min(1)).min(1),
  reviewNote: z.string().min(1),
  speakerRole: z.string().min(1).optional(),
  segments: z.array(segmentSchema).optional(),
});

export const videoContentTypesSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    status: z.enum(["draft", "reviewed"]),
    entries: z.array(videoContentTypeEntrySchema),
  })
  .superRefine((registry, ctx) => {
    const slugs = new Set<string>();
    const urls = new Set<string>();
    for (const [index, entry] of registry.entries.entries()) {
      const path = ["entries", index] as const;
      if (slugs.has(entry.slug))
        ctx.addIssue({
          code: "custom",
          path: [...path, "slug"],
          message: "Duplicate video content-type slug binding",
        });
      slugs.add(entry.slug);
      if (urls.has(entry.videoUrl))
        ctx.addIssue({
          code: "custom",
          path: [...path, "videoUrl"],
          message: "Duplicate video content-type source binding",
        });
      urls.add(entry.videoUrl);
      if (new Set(entry.tags).size !== entry.tags.length)
        ctx.addIssue({
          code: "custom",
          path: [...path, "tags"],
          message: "Repeated video content type",
        });
      for (const [segmentIndex, segment] of (entry.segments ?? []).entries()) {
        if (new Set(segment.typeIds).size !== segment.typeIds.length)
          ctx.addIssue({
            code: "custom",
            path: [...path, "segments", segmentIndex, "typeIds"],
            message: "Repeated segment content type",
          });
        if (segment.typeIds.some((typeId) => !entry.tags.includes(typeId)))
          ctx.addIssue({
            code: "custom",
            path: [...path, "segments", segmentIndex, "typeIds"],
            message: "Segment type must be an entry tag",
          });
      }
    }
  });

export type VideoContentTypeEntry = z.infer<typeof videoContentTypeEntrySchema>;
export type VideoContentTypeRegistry = z.infer<typeof videoContentTypesSchema>;

export const videoContentTypes = videoContentTypesSchema.parse(data);
export const contentTypeEntries = videoContentTypes.entries;

const entriesByBinding = new Map(
  contentTypeEntries.map((entry) => [
    `${entry.slug}\u0000${entry.videoUrl}`,
    entry,
  ]),
);

/** Exact URL binding intentionally prevents a similarly named event from inheriting labels. */
export function contentTypeEntryFor(
  slug: string,
  videoUrl: string,
): VideoContentTypeEntry | undefined {
  return entriesByBinding.get(`${slug}\u0000${videoUrl}`);
}

export function contentTypesFor(
  slug: string,
  videoUrl: string,
): readonly VideoContentType[] {
  return (
    contentTypeEntryFor(slug, videoUrl)?.tags.map((typeId) =>
      contentTypeById.get(typeId)!,
    ) ?? []
  );
}

export function contentTypeSegmentsFor(slug: string, videoUrl: string) {
  return contentTypeEntryFor(slug, videoUrl)?.segments ?? [];
}

export function videosByContentType(
  entries: readonly VideoContentTypeEntry[] = contentTypeEntries,
) {
  return CONTENT_TYPES.map((type) => ({
    ...type,
    entries: entries.filter((entry) => entry.tags.includes(type.id)),
  }));
}

/** Build browse groups from source bindings, never from a title or legacy footage kind. */
export function contentTypeGroups(
  records: readonly InjuryCase[],
  clips: readonly ObservationClip[],
) {
  return CONTENT_TYPES.map((type) => {
    const cases = records.filter((record) =>
      contentTypesFor(record.slug, record.video.canonicalUrl).some(
        (candidate) => candidate.id === type.id,
      ),
    );
    const matchingClips = clips.filter((clip) =>
      contentTypesFor(clip.slug, clip.videoUrl).some(
        (candidate) => candidate.id === type.id,
      ),
    );
    return {
      ...type,
      cases,
      clips: matchingClips,
      count: cases.length + matchingClips.length,
    };
  });
}
