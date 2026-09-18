import approval from "../../data/public-launch.v1.json";
import expansion from "../../data/videos/expansion.v1.json";
import additions from "../../data/videos/additions.v1.json";
import curation from "../../data/videos/curation.v1.json";
import batch30 from "../../data/videos/batch-30.v1.json";
import batch31 from "../../data/videos/batch-31.v1.json";
import batch32 from "../../data/videos/batch-32.v1.json";
import batch34 from "../../data/videos/batch-34.v1.json";
import recent120 from "../../data/videos/recent-120.v1.json";
import recent150 from "../../data/videos/recent-150.v1.json";
import judgeRib from "../../data/videos/judge-rib.v1.json";

/** Shared public allowlist; no research candidates or removed videos. */
export const publicVideoIds = new Set([
  ...[...approval.cases, ...expansion.cases].map((entry) =>
    new URL(entry.videoUrl).searchParams.get("v")!,
  ),
  ...[
    ...expansion.clips,
    ...additions.clips,
    ...curation.clips,
    ...batch30.clips,
    ...batch31.clips,
    ...batch32.clips,
    ...batch34.clips,
    ...recent120.clips,
    ...recent150.clips,
    ...judgeRib.clips,
  ]
    .filter((entry) => !curation.removedSlugs.includes(entry.slug))
    .map((entry) => entry.videoId),
]);
