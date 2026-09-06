import { compareCodePoints } from "../contracts/canonical";
import { BODY_PARTS, videosByBodyPart } from "./body-parts";
import { discoveryFor, SITUATIONS } from "./discovery";
import type { ObservationClip } from "./expansion";
import { SPORTS, videosBySport } from "./sports";

export interface ObservationResource {
  kind: "article" | "topic-overview";
  title: string;
  url: string;
}

const ACL_ARTICLE: ObservationResource = {
  kind: "article",
  title: "前十字韌帶重建的術後復健評估",
  url: "https://sportsmedicine.tw/content/articles/2020-03-10-運醫-前十字韌帶重建的術後復健評估/",
};
const ANKLE_FIRST_AID_ARTICLE: ObservationResource = {
  kind: "article",
  title: "外側腳踝受傷不再恐慌：快速應對指南",
  url: "https://sportsmedicine.tw/content/articles/2023-09-16-復健-外側腳踝受傷不再恐慌-快速應對指南/",
};
const CHRONIC_ANKLE_INSTABILITY_ARTICLE: ObservationResource = {
  kind: "article",
  title: "慢性踝關節不穩",
  url: "https://sportsmedicine.tw/content/articles/2026-07-19-運醫-慢性踝關節不穩/",
};
const SPORTS_INJURY_TOPIC: ObservationResource = {
  kind: "topic-overview",
  title: "運動傷害主題總覽",
  url: "https://sportsmedicine.tw/content/topics/sports-injury/",
};

const RESOURCES_BY_SLUG: Readonly<
  Record<string, readonly ObservationResource[]>
> = {
  "ronald-acuna-miami-2021": [ACL_ARTICLE],
  "carolina-marin-indonesia-2019": [ACL_ARTICLE],
  "lindsey-vonn-schladming-2013": [ACL_ARTICLE],
  "zverev-roland-garros-2022": [
    ANKLE_FIRST_AID_ARTICLE,
    CHRONIC_ANKLE_INSTABILITY_ARTICLE,
  ],
  "chris-bassitt-2021-face": [SPORTS_INJURY_TOPIC],
  "antoine-dupont-world-cup-2023": [SPORTS_INJURY_TOPIC],
};

export function observationResourcesFor(
  slug: string,
): readonly ObservationResource[] {
  return RESOURCES_BY_SLUG[slug] ?? [];
}

function relatedPriority(
  clip: ObservationClip,
  candidate: ObservationClip,
): number {
  if (candidate.bodyPart === clip.bodyPart) return 0;
  if (
    discoveryFor(candidate.slug).situation === discoveryFor(clip.slug).situation
  )
    return 1;
  if (candidate.sport === clip.sport) return 2;
  return 3;
}

export function relatedObservationClips(
  clip: ObservationClip,
  clips: readonly ObservationClip[],
): ObservationClip[] {
  return clips
    .filter(
      (candidate) =>
        candidate.slug !== clip.slug && relatedPriority(clip, candidate) < 3,
    )
    .sort(
      (left, right) =>
        relatedPriority(clip, left) - relatedPriority(clip, right) ||
        compareCodePoints(left.slug, right.slug),
    )
    .slice(0, 3);
}

export interface ObservationCategoryLink {
  kind: "body-part" | "sport" | "situation";
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
