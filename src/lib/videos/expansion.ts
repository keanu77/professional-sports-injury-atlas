/** User-confirmed video expansion; observation clips do not claim medical approval. */
import { z } from "astro/zod";
import batchData from "../../data/videos/batch-30.v1.json";
import batch31Data from "../../data/videos/batch-31.v1.json";
import batch32Data from "../../data/videos/batch-32.v1.json";
import data from "../../data/videos/expansion.v1.json";
import launchData from "../../data/public-launch.v1.json";
import curationData from "../../data/videos/curation.v1.json";
import additionsData from "../../data/videos/additions.v1.json";
import type { InjuryCase } from "../contracts/case";
import { canonicalJson, sha256Hex } from "../contracts/canonical";
import { parseYouTubeVideoId } from "../video/youtube";
const url = z.url({ protocol: /^https$/ });
const day = z.iso.date().nullable();
export const observationClipSchema = z.strictObject({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  videoId: z.string().regex(/^[\w-]{11}$/),
  name: z.string().min(1),
  sport: z.string().min(1),
  event: z.string().min(1),
  bodyPart: z.string().min(1),
  observation: z.string().min(1),
  eventDate: day,
  returnDate: day,
  returnText: z.string().min(1),
  videoUrl: url,
  publisher: z.string().min(1),
  sourceTitle: z.string().min(1),
  captionStatus: z.enum(["available", "unavailable", "not-verified"]),
  startSeconds: z.number().int().nonnegative(),
  durationSeconds: z.number().int().positive(),
  sources: z.array(z.strictObject({ title: z.string().min(1), url })),
});
export const expansionSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("decision-23"),
    authorizationQuote: z.literal("可以"),
    authorizedAt: z.iso.datetime(),
    scope: z.literal("nine-confirmed-videos-captions-optional"),
    cases: z
      .array(
        z.strictObject({
          id: z.string(),
          slug: z.string(),
          recordDigest: z.string().regex(/^[a-f0-9]{64}$/),
          videoUrl: url,
        }),
      )
      .length(2),
    clips: z.array(observationClipSchema).length(7),
  })
  .superRefine((value, ctx) => {
    const urls = [
      ...value.cases.map((c) => c.videoUrl),
      ...value.clips.map((c) => c.videoUrl),
    ];
    if (
      new Set(urls).size !== 9 ||
      urls.some((u) => parseYouTubeVideoId(u) === null)
    )
      ctx.addIssue({
        code: "custom",
        message: "Nine distinct canonical YouTube videos required",
      });
    if (new Set(value.clips.map((c) => c.slug)).size !== value.clips.length)
      ctx.addIssue({ code: "custom", message: "Duplicate clip slug" });
    for (const c of value.clips) {
      if (
        parseYouTubeVideoId(c.videoUrl) !== c.videoId ||
        c.startSeconds >= c.durationSeconds
      )
        ctx.addIssue({
          code: "custom",
          message: `Invalid video binding or timecode: ${c.slug}`,
        });
      if (
        c.returnDate &&
        (!c.eventDate || c.returnDate < c.eventDate || c.sources.length === 0)
      )
        ctx.addIssue({
          code: "custom",
          message: `Unsupported return date: ${c.slug}`,
        });
    }
  });
export const expansion = expansionSchema.parse(data);
export type ObservationClip = z.infer<typeof observationClipSchema>;
export const additionsSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("decision-27"),
    authorizationQuote: z.literal("可以，請在搜尋更多影片並加入"),
    authorizedAt: z.iso.datetime(),
    clips: z.array(observationClipSchema).min(1),
  })
  .superRefine((value, ctx) => {
    const videoIds = new Set(
      [...launchData.cases, ...expansion.cases].map((c) =>
        parseYouTubeVideoId(c.videoUrl),
      ),
    );
    const slugs = new Set(expansion.cases.map((c) => c.slug));
    for (const c of [...expansion.clips, ...value.clips]) {
      if (
        videoIds.has(c.videoId) ||
        slugs.has(c.slug) ||
        parseYouTubeVideoId(c.videoUrl) !== c.videoId ||
        c.startSeconds >= c.durationSeconds ||
        (c.returnDate &&
          (!c.eventDate ||
            c.returnDate < c.eventDate ||
            c.sources.length === 0))
      ) {
        ctx.addIssue({
          code: "custom",
          message: `Invalid or duplicate clip: ${c.slug}`,
        });
      }
      videoIds.add(c.videoId);
      slugs.add(c.slug);
    }
  });
export const additions = additionsSchema.parse(additionsData);
export const curationSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("decision-28"),
    authorizationQuote: z.literal(
      "請刪除兩個球友上傳的影片，然後繼續搜尋更多影片來源，可包含任何運動項目",
    ),
    authorizedAt: z.iso.datetime(),
    removedSlugs: z
      .array(z.enum(["volleyball-pov-135", "ankle-inversion-observation"]))
      .length(2),
    clips: z.array(observationClipSchema),
  })
  .superRefine((value, ctx) => {
    if (new Set(value.removedSlugs).size !== 2)
      ctx.addIssue({
        code: "custom",
        message: "Exactly two distinct removed videos required",
      });
    const combined = additionsSchema.safeParse({
      ...additions,
      clips: [...additions.clips, ...value.clips],
    });
    if (!combined.success)
      ctx.addIssue({
        code: "custom",
        message: "Invalid or duplicate new curation video",
      });
  });
export const curation = curationSchema.parse(curationData);
export const batch30Schema = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("decision-30"),
    authorizationQuote: z.literal(
      "影片總數量的目標是50個以上，請你盡最大努力完成",
    ),
    authorizedAt: z.iso.datetime(),
    clips: z.array(observationClipSchema).min(1),
  })
  .superRefine((value, ctx) => {
    const combined = additionsSchema.safeParse({
      ...additions,
      clips: [...additions.clips, ...curation.clips, ...value.clips],
    });
    if (!combined.success)
      ctx.addIssue({
        code: "custom",
        message: "Invalid or duplicate batch 30 video",
      });
  });
export const batch30 = batch30Schema.parse(batchData);
export const batch31Schema = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("decision-31"),
    authorizationQuote: z.literal("好的，我們繼續補充"),
    authorizedAt: z.iso.datetime(),
    clips: z.array(observationClipSchema).min(1),
  })
  .superRefine((value, ctx) => {
    const combined = additionsSchema.safeParse({
      ...additions,
      clips: [
        ...additions.clips,
        ...curation.clips,
        ...batch30.clips,
        ...value.clips,
      ],
    });
    if (!combined.success)
      ctx.addIssue({
        code: "custom",
        message: "Invalid or duplicate batch 31 video",
      });
  });
export const batch31 = batch31Schema.parse(batch31Data);
export const batch32Schema = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("decision-32"),
    authorizationQuote: z.literal("我覺得棒球的影片可以多一些"),
    authorizedAt: z.iso.datetime(),
    clips: z.array(observationClipSchema).min(1),
  })
  .superRefine((value, ctx) => {
    const combined = additionsSchema.safeParse({
      ...additions,
      clips: [
        ...additions.clips,
        ...curation.clips,
        ...batch30.clips,
        ...batch31.clips,
        ...value.clips,
      ],
    });
    if (!combined.success)
      ctx.addIssue({
        code: "custom",
        message: "Invalid or duplicate batch 32 video",
      });
  });
export const batch32 = batch32Schema.parse(batch32Data);
export const allObservationClips: ObservationClip[] = [
  ...expansion.clips,
  ...additions.clips,
  ...curation.clips,
  ...batch30.clips,
  ...batch31.clips,
  ...batch32.clips,
].filter((c) => !curation.removedSlugs.some((slug) => slug === c.slug));
export const expansionEnabled = () =>
  process.env.ATLAS_PUBLIC_LAUNCH === "decision-21";
export function captionsOptionalFor(videoUrl: string): boolean {
  return (
    expansionEnabled() &&
    [...expansion.cases, ...allObservationClips].some(
      (c) => c.videoUrl === videoUrl,
    )
  );
}
export function expandedCaseAllowed(record: InjuryCase): boolean {
  return (
    expansionEnabled() &&
    expansion.cases.some(
      (c) =>
        c.id === record.id &&
        c.videoUrl === record.video.canonicalUrl &&
        c.recordDigest === sha256Hex(canonicalJson(record)),
    )
  );
}
export function observationClips(): ObservationClip[] {
  return expansionEnabled() ? allObservationClips : [];
}
