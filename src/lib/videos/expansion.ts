/** User-confirmed video expansion; observation clips do not claim medical approval. */
import { z } from "astro/zod";
import data from "../../data/videos/expansion.v1.json";
import type { InjuryCase } from "../contracts/case";
import { canonicalJson, sha256Hex } from "../contracts/canonical";
import { parseYouTubeVideoId } from "../video/youtube";
const url = z.url({ protocol: /^https$/ });
const day = z.iso.date().nullable();
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
    clips: z
      .array(
        z.strictObject({
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
        }),
      )
      .length(7),
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
export type ObservationClip = (typeof expansion.clips)[number];
export const expansionEnabled = () =>
  process.env.ATLAS_PUBLIC_LAUNCH === "decision-21";
export function captionsOptionalFor(videoUrl: string): boolean {
  return (
    expansionEnabled() &&
    [...expansion.cases, ...expansion.clips].some(
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
  return expansionEnabled() ? expansion.clips : [];
}
