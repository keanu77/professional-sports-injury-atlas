import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { canonicalJson } from "../src/lib/contracts/canonical";
import { monitorPublicVideos } from "../src/lib/video/health-monitor";
import { eventUpdates } from "../src/lib/videos/event-updates";

const output = resolve(
  process.argv[2] ?? "artifacts/public-video-health.v1.json",
);
const artifact = await monitorPublicVideos(
  eventUpdates.entries.map((entry) => ({
    slug: entry.slug,
    provider: entry.videoUrl.startsWith("https://www.mlb.com/")
      ? ("mlb" as const)
      : ("youtube" as const),
    videoUrl: entry.videoUrl,
    sourceUrls: entry.sources.map((source) => source.url),
  })),
  { youtubeApiKey: process.env.YOUTUBE_API_KEY ?? null },
);
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${canonicalJson(artifact)}\n`, "utf8");
console.log(
  JSON.stringify({
    event: "public-video-health",
    checkedAt: artifact.checkedAt,
    ...artifact.summary,
    output,
  }),
);
if (
  artifact.summary.unavailableSources > 0 ||
  artifact.summary.unavailableMetadata > 0 ||
  artifact.summary.notEmbeddable > 0
)
  process.exitCode = 1;
