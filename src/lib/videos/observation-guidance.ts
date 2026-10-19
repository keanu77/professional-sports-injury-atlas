import { z } from "astro/zod";
import resourceData from "../../data/videos/observation-resources.v1.json";
import { BODY_PARTS, videosByBodyPart } from "./body-parts";
import { discoveryFor, SITUATIONS } from "./discovery";
import type { ObservationClip } from "./expansion";
import { SPORTS, videosBySport } from "./sports";
import { NERVE_CATEGORIES } from "./nerve-categories";
import { relatedVideosFor } from "./related-videos";

export interface ObservationResource {
  kind: "article" | "topic-overview";
  title: string;
  url: string;
  note: string;
}

const resourceSchema = z.strictObject({
  kind: z.enum(["article", "topic-overview"]),
  title: z.string().min(1),
  url: z
    .url()
    .refine((url) => new URL(url).origin === "https://sportsmedicine.tw"),
  note: z.string(),
});
const resourceRegistry = z
  .strictObject({
    schemaVersion: z.literal(1),
    checkedAt: z.iso.date(),
    resources: z.record(z.string(), resourceSchema),
    entries: z.record(
      z.string(),
      z.strictObject({
        resources: z.array(z.string()).min(1).max(3),
        note: z.string(),
      }),
    ),
  })
  .parse(resourceData);
for (const entry of Object.values(resourceRegistry.entries)) {
  for (const id of entry.resources) {
    if (!resourceRegistry.resources[id])
      throw new Error(`Unknown article resource: ${id}`);
  }
}

export function observationResourcesFor(
  slug: string,
): readonly ObservationResource[] {
  return (resourceRegistry.entries[slug]?.resources ?? []).map(
    (id) => resourceRegistry.resources[id]!,
  );
}

export function observationResourceNoteFor(slug: string): string {
  return resourceRegistry.entries[slug]?.note ?? "";
}

export function relatedObservationClips(
  clip: ObservationClip,
  clips: readonly ObservationClip[],
): ObservationClip[] {
  return relatedVideosFor(
    { kind: "observation", clip },
    clips.map((candidate) => ({ kind: "observation", clip: candidate })),
  ).flatMap((match) =>
    match.video.kind === "observation" ? [match.video.clip] : [],
  );
}

export interface ObservationCategoryLink {
  kind: "body-part" | "sport" | "situation" | "nerve";
  label: string;
  href: string;
}

export function observationCategoryLinks(
  clip: ObservationClip,
): ObservationCategoryLink[] {
  const bodyPart = videosByBodyPart([], [clip])[0];
  const sport = videosBySport([], [clip])[0];
  const situationCode = discoveryFor(clip.slug).situation;
  const situation = SITUATIONS.find((item) => item.code === situationCode);
  if (
    bodyPart === undefined ||
    !BODY_PARTS.some((item) => item.code === bodyPart.code) ||
    sport === undefined ||
    !SPORTS.some((item) => item.code === sport.code) ||
    situation === undefined
  ) {
    throw new Error(`Missing observation category route: ${clip.slug}`);
  }
  return [
    ...NERVE_CATEGORIES.filter(
      (category) => category.code === clip.nerveCategory,
    ).map((category) => ({
      kind: "nerve" as const,
      label: category.label,
      href: `/nerve-injuries/${category.code}/`,
    })),
    {
      kind: "body-part",
      label: `受傷部位：${bodyPart.label}`,
      href: `/body-parts/${bodyPart.code}/`,
    },
    {
      kind: "sport",
      label: `運動項目：${sport.label}`,
      href: `/sports/${sport.code}/`,
    },
    {
      kind: "situation",
      label: `受傷情境：${situation.label}`,
      href: `/situations/${situation.code}/`,
    },
  ];
}
