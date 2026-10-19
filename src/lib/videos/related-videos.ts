import type { InjuryCase } from "../contracts/case";
import type { ObservationClip } from "./expansion";
import { compareCodePoints } from "../contracts/canonical";
import { parseYouTubeVideoId } from "../video/youtube";
import { videosByBodyPart } from "./body-parts";
import { discoveryFor, SITUATIONS } from "./discovery";
import { videosBySport } from "./sports";

export type RelatedVideo =
  | { kind: "case"; record: InjuryCase }
  | { kind: "observation"; clip: ObservationClip };
export interface RelatedVideoMatch {
  video: RelatedVideo;
  slug: string;
  reasons: string[];
}

function metadata(video: RelatedVideo) {
  const records = video.kind === "case" ? [video.record] : [];
  const clips = video.kind === "observation" ? [video.clip] : [];
  const slug = video.kind === "case" ? video.record.slug : video.clip.slug;
  const url =
    video.kind === "case"
      ? video.record.video.canonicalUrl
      : video.clip.videoUrl;
  const youtubeId =
    video.kind === "observation" && video.clip.provider !== "mlb"
      ? video.clip.videoId
      : parseYouTubeVideoId(url);
  const canonical = new URL(url);
  return {
    slug,
    videoKey: youtubeId
      ? `youtube:${youtubeId}`
      : `${canonical.origin}${canonical.pathname}`,
    body: videosByBodyPart(records, clips)[0],
    sport: videosBySport(records, clips)[0],
    discovery: discoveryFor(slug),
    date:
      (video.kind === "case" ? video.record.eventDate : video.clip.eventDate) ??
      "",
  };
}

/** Caller supplies only selector-permitted, publicly playable catalog items. */
export function relatedVideosFor(
  source: RelatedVideo,
  candidates: readonly RelatedVideo[],
  limit = 3,
): RelatedVideoMatch[] {
  const current = metadata(source);
  const seenVideos = new Set([current.videoKey]);
  const seenSlugs = new Set([current.slug]);
  const ranked = candidates
    .map((video) => {
      const candidate = metadata(video);
      const sameBody =
        !!current.body && candidate.body?.code === current.body.code;
      const sameSport =
        !!current.sport && candidate.sport?.code === current.sport.code;
      // "Other or unclear" is not evidence of a shared observable situation.
      const sameSituation =
        current.discovery.situation !== "unclear" &&
        candidate.discovery.situation === current.discovery.situation;
      const situation = SITUATIONS.find(
        (item) => item.code === current.discovery.situation,
      );
      const reasons = [
        ...(sameBody ? [`同部位：${current.body!.label}`] : []),
        ...(sameSport ? [`同運動：${current.sport!.label}`] : []),
        ...(sameSituation ? [`同情境：${situation!.label}`] : []),
      ];
      return {
        video,
        ...candidate,
        reasons,
        score:
          Number(sameBody) * 8 +
          Number(sameSport) * 4 +
          Number(sameSituation) * 2,
      };
    })
    .filter((candidate) => candidate.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (a.discovery.curatedRank ?? Number.MAX_SAFE_INTEGER) -
          (b.discovery.curatedRank ?? Number.MAX_SAFE_INTEGER) ||
        compareCodePoints(b.date, a.date) ||
        compareCodePoints(a.slug, b.slug),
    );
  const matches: RelatedVideoMatch[] = [];
  for (const candidate of ranked) {
    if (matches.length >= limit) break;
    if (seenVideos.has(candidate.videoKey) || seenSlugs.has(candidate.slug))
      continue;
    seenVideos.add(candidate.videoKey);
    seenSlugs.add(candidate.slug);
    matches.push({
      video: candidate.video,
      slug: candidate.slug,
      reasons: candidate.reasons,
    });
  }
  return matches;
}

export function caseCategoryLinks(record: InjuryCase) {
  const body = videosByBodyPart([record], [])[0];
  const sport = videosBySport([record], [])[0];
  const situation = SITUATIONS.find(
    (item) => item.code === discoveryFor(record.slug).situation,
  );
  return [
    ...(body
      ? [
          {
            kind: "body-part",
            label: `受傷部位：${body.label}`,
            href: `/body-parts/${body.code}/`,
          },
        ]
      : []),
    ...(sport
      ? [
          {
            kind: "sport",
            label: `運動項目：${sport.label}`,
            href: `/sports/${sport.code}/`,
          },
        ]
      : []),
    ...(situation
      ? [
          {
            kind: "situation",
            label: `受傷情境：${situation.label}`,
            href: `/situations/${situation.code}/`,
          },
        ]
      : []),
  ];
}
