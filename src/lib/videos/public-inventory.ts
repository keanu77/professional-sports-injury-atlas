import launchData from "../../data/public-launch.v1.json";
import relatedArticles from "../../data/patient-related-articles.v1.json";
import { canonicalJson, sha256Hex } from "../contracts/canonical";
import { patientGuides } from "../patient/guides";
import type { PublicVideoHealthInput } from "../video/health-monitor";
import { eventUpdates } from "./event-updates";
import { allObservationClips, expansion } from "./expansion";
import { observationResourcesFor } from "./observation-guidance";

export type PublicReferenceKind =
  "video" | "event" | "supplemental" | "case" | "safety" | "further-reading";
export interface PublicReference {
  url: string;
  kinds: PublicReferenceKind[];
}
export interface PublicInventoryEntry extends PublicVideoHealthInput {
  path: string;
  provider: "youtube" | "mlb";
  startSeconds: number;
  durationSeconds: number;
  captionRequired: boolean;
  references: PublicReference[];
}
export interface PublicInventoryCoreCase {
  id: string;
  slug: string;
  injury: { code: string };
  video: {
    canonicalUrl: string;
    startSeconds: number;
    durationSeconds: number;
  };
  sources: readonly { url: string }[];
}

/** Mirrors the public observation safety sections; coverage tests guard drift. */
export const OBSERVATION_SAFETY_URLS = {
  head: [
    "https://www.cdc.gov/heads-up/response/index.html",
    "https://www.nhs.uk/conditions/head-injury-and-concussion/",
  ],
  rib: ["https://www.nhs.uk/conditions/broken-or-bruised-ribs/"],
  general: [
    "https://www.nhs.uk/conditions/sprains-and-strains/",
    "https://www.nhs.uk/conditions/broken-leg/",
    "https://www.nhs.uk/conditions/dislocated-shoulder/",
  ],
} as const;
const ribSlugs = new Set([
  "aaron-judge-2026-rib",
  "fernando-alonso-2016-rib",
  "drew-brees-2020-rib",
  "tua-tagovailoa-2021-rib",
]);

/** Uses the same governed catalog as the page loaders, never a frozen count. */
export function createPublicVideoInventory(
  coreCases: readonly PublicInventoryCoreCase[],
): PublicInventoryEntry[] {
  const bindings = [...launchData.cases, ...expansion.cases];
  const cases = bindings.map((binding) => {
    const record = coreCases.find((candidate) => candidate.id === binding.id);
    if (!record || record.video.canonicalUrl !== binding.videoUrl)
      throw new Error(`Public case binding missing or changed: ${binding.id}`);
    return record;
  });
  const inputs = [
    ...cases.map((record) => ({
      slug: record.slug,
      videoUrl: record.video.canonicalUrl,
      path: `/cases/${record.slug}/`,
      provider: "youtube" as const,
      startSeconds: record.video.startSeconds,
      durationSeconds: record.video.durationSeconds,
      captionRequired: launchData.cases.some((item) => item.id === record.id),
      record,
      clip: undefined,
    })),
    ...allObservationClips.map((clip) => ({
      slug: clip.slug,
      videoUrl: clip.videoUrl,
      path: `/videos/${clip.slug}/`,
      provider: clip.provider ?? ("youtube" as const),
      startSeconds: clip.startSeconds,
      durationSeconds: clip.durationSeconds,
      captionRequired: false,
      record: undefined,
      clip,
    })),
  ];
  if (new Set(inputs.map((item) => item.slug)).size !== inputs.length)
    throw new Error("Duplicate public catalog slug");
  if (new Set(inputs.map((item) => item.videoUrl)).size !== inputs.length)
    throw new Error("Duplicate public catalog video URL");
  const events = new Map(
    eventUpdates.entries.map((entry) => [entry.slug, entry]),
  );
  if (events.size !== inputs.length)
    throw new Error("Event reports and public catalog have different coverage");
  return inputs.map(({ record, clip, ...item }) => {
    const event = events.get(item.slug);
    if (!event || event.videoUrl !== item.videoUrl)
      throw new Error(`Missing event binding: ${item.slug}`);
    const sources = new Map<string, Set<PublicReferenceKind>>();
    const add = (url: string, kind: PublicReferenceKind) => {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" || parsed.username || parsed.password)
        throw new Error(`Invalid public reference: ${item.slug}`);
      const kinds = sources.get(url) ?? new Set<PublicReferenceKind>();
      kinds.add(kind);
      sources.set(url, kinds);
    };
    add(item.videoUrl, "video");
    event.sources.forEach((source) => add(source.url, "event"));
    if (clip) {
      clip.sources.forEach((source) => add(source.url, "supplemental"));
      observationResourcesFor(clip.slug).forEach((source) =>
        add(source.url, "further-reading"),
      );
      const safety =
        clip.bodyPart === "頭頸部"
          ? OBSERVATION_SAFETY_URLS.head
          : ribSlugs.has(clip.slug)
            ? OBSERVATION_SAFETY_URLS.rib
            : OBSERVATION_SAFETY_URLS.general;
      safety.forEach((url) => add(url, "safety"));
    }
    if (record) {
      record.sources.forEach((source) => add(source.url, "case"));
      const guide = patientGuides.find(
        (guide) => guide.injuryCode === record.injury.code,
      );
      if (!guide) throw new Error(`Missing public patient guide: ${item.slug}`);
      guide.sources.forEach((source) => add(source.url, "safety"));
      const articles =
        relatedArticles[record.injury.code as keyof typeof relatedArticles] ??
        [];
      articles.forEach((source) => add(source.url, "further-reading"));
    }
    const references = [...sources]
      .sort(([a], [b]) => a.localeCompare(b, "en"))
      .map(([url, kinds]) => ({ url, kinds: [...kinds].sort() }));
    return {
      ...item,
      references,
      sourceUrls: references.map(({ url }) => url),
    };
  });
}

export function publicInventoryDigest(
  inventory: readonly PublicInventoryEntry[],
): string {
  return sha256Hex(
    canonicalJson(
      [...inventory].sort((a, b) => a.slug.localeCompare(b.slug, "en")),
    ),
  );
}

/** Fails if any source added to a public page is absent from its monitor input. */
export function assertPublicReferenceCoverage(
  inventory: readonly PublicInventoryEntry[],
  references: readonly { path: string; url: string }[],
): void {
  const byPath = new Map(inventory.map((entry) => [entry.path, entry]));
  const missing = references.filter(
    ({ path, url }) => !byPath.get(path)?.sourceUrls.includes(url),
  );
  if (missing.length)
    throw new Error(
      `Unmonitored public references: ${missing.map((item) => `${item.path} ${item.url}`).join(", ")}`,
    );
}
