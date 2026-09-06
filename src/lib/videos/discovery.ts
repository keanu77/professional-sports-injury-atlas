import { z } from "astro/zod";
import data from "../../data/videos/discovery.v1.json";
import type { InjuryCase } from "../contracts/case";
import type { ObservationClip } from "./expansion";

export const SITUATIONS = [
  { code: "landing", label: "跳躍與落地" },
  { code: "running-turning", label: "跑動與轉向" },
  { code: "collision", label: "碰撞與接觸" },
  { code: "fall", label: "滑壘、滑倒與摔落" },
  { code: "ball-impact", label: "球體撞擊" },
  { code: "racket-swing", label: "揮拍擊球" },
  { code: "unclear", label: "其他或畫面未明" },
] as const;
export type SituationCode = (typeof SITUATIONS)[number]["code"];
const situationCodes = SITUATIONS.map((item) => item.code);
export const discoverySchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    reviewedAt: z.iso.date(),
    classificationBasis: z.string().min(1),
    curationBasis: z.string().min(1),
    videos: z.array(
      z.strictObject({
        slug: z.string().regex(/^[a-z0-9-]+$/),
        situation: z.enum(situationCodes),
        curatedRank: z.number().int().positive().optional(),
      }),
    ),
  })
  .superRefine((value, ctx) => {
    const slugs = value.videos.map((item) => item.slug);
    const ranks = value.videos.flatMap((item) =>
      item.curatedRank ? [item.curatedRank] : [],
    );
    if (
      new Set(slugs).size !== slugs.length ||
      new Set(ranks).size !== ranks.length
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Discovery slugs and curated ranks must be unique",
      });
    }
  });
export const discovery = discoverySchema.parse(data);
const metadata = new Map(discovery.videos.map((item) => [item.slug, item]));
/** Future additions stay discoverable without inferring a movement from a diagnosis. */
export function discoveryFor(slug: string) {
  return metadata.get(slug) ?? { slug, situation: "unclear" as const };
}
export function videosBySituation(
  records: readonly InjuryCase[],
  clips: readonly ObservationClip[],
) {
  return SITUATIONS.map((situation) => {
    const cases = records.filter(
      (record) => discoveryFor(record.slug).situation === situation.code,
    );
    const observations = clips.filter(
      (clip) => discoveryFor(clip.slug).situation === situation.code,
    );
    return {
      ...situation,
      cases,
      clips: observations,
      count: cases.length + observations.length,
    };
  }).filter((situation) => situation.count > 0);
}
