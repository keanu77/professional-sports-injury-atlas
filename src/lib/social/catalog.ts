/** Public text facts only; this catalog is shared by metadata and PNG routes. */
import type { InjuryCase } from "../contracts/case";
import type { BuildMode } from "../governance/build-mode";
import { permittedCasesForMode } from "../cases/pagination";
import { findInjury, findLeague } from "../contracts/taxonomy";
import { isLaunchEnabled } from "../patient/public-launch";
import { observationClips } from "../videos/expansion";
import {
  observationCardMetadata,
  observationFootageLabel,
} from "../videos/observation-card";

export interface ShareImage {
  path: string;
  width: number;
  height: number;
  alt: string;
}

export interface DetailShareCard {
  kind: "cases" | "videos";
  slug: string;
  pagePath: string;
  image: ShareImage;
  title: string;
  subtitle: string;
  category: string;
  label: string;
}

export const HOME_SHARE_IMAGE: ShareImage = {
  path: "/social/injury-atlas-home-20260907.png",
  width: 1380,
  height: 542,
  alt: "運動傷害影片圖鑑",
};

function detailCard(
  kind: DetailShareCard["kind"],
  slug: string,
  text: Pick<DetailShareCard, "title" | "subtitle" | "category" | "label">,
): DetailShareCard {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Invalid public share slug");
  }
  return {
    ...text,
    kind,
    slug,
    pagePath: `/${kind}/${slug}/`,
    image: {
      path: `/social/${kind}/${slug}.png`,
      width: 1200,
      height: 630,
      alt: `${text.title}｜${text.subtitle}｜運動傷害影片圖鑑`,
    },
  };
}

/** Review builds never produce exportable detail artwork, even with launch set. */
export function detailShareCatalog(
  mode: BuildMode,
  records: InjuryCase[],
): DetailShareCard[] {
  if (mode !== "public" || !isLaunchEnabled()) return [];
  return [
    ...permittedCasesForMode("public", records).map((record) =>
      detailCard("cases", record.slug, {
        title: record.athlete.name,
        subtitle: findInjury(record.injury.code)?.labelZh ?? record.injury.code,
        category: `${findLeague(record.league.code)?.labelZh ?? record.league.code} · ${record.eventDate}`,
        label: "教學案例",
      }),
    ),
    ...observationClips().map((clip) => {
      const metadata = observationCardMetadata(clip);
      return detailCard("videos", clip.slug, {
        title: clip.name,
        subtitle: clip.event,
        category: `${metadata.sport} · ${metadata.bodyPart} · ${metadata.eventYear}`,
        label: observationFootageLabel(clip),
      });
    }),
  ];
}

/** Unknown detail URLs cannot point at an image the static route never built. */
export function shareImageForPage(
  pathname: string,
  catalog: readonly DetailShareCard[],
): ShareImage | null {
  const detail = catalog.find((entry) => entry.pagePath === pathname);
  if (detail !== undefined) return detail.image;
  if (/^\/(?:cases|videos)\//.test(pathname)) return null;
  return HOME_SHARE_IMAGE;
}
