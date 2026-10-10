import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { canonicalJson } from "../src/lib/contracts/canonical";
import {
  healthExitCode,
  monitorPublicVideos,
} from "../src/lib/video/health-monitor";
import { eventUpdates } from "../src/lib/videos/event-updates";

const output = resolve(
  process.argv[2] ?? "artifacts/public-video-health.v2.json",
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
    overallStatus: artifact.overallStatus,
    playbackVerification: artifact.playbackVerification,
    ...artifact.summary,
    output,
  }),
);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    [
      `## Public source/video health: ${artifact.overallStatus}`,
      "",
      `- Sources: ${artifact.summary.sourceUrls}; unavailable: ${artifact.summary.unavailableSources}; indeterminate: ${artifact.summary.indeterminateSources}.`,
      `- Source reasons: ${JSON.stringify(artifact.summary.sourceReasons)}.`,
      `- Metadata unavailable/indeterminate: ${artifact.summary.unavailableMetadata}/${artifact.summary.indeterminateMetadata}.`,
      `- Public oEmbed markup present: ${artifact.summary.embedMarkupPresent}/${artifact.summary.videos}.`,
      `- API embed checks completed/skipped/indeterminate: ${artifact.summary.embedChecksCompleted}/${artifact.summary.embedChecksSkipped}/${artifact.summary.embedChecksIndeterminate}.`,
      "- Playback was not tested. Metadata, iframe markup and API flags do not prove playback in a viewer's browser or region.",
      "- Exit codes: 0 = complete checks; 1 = confirmed failure; 2 = incomplete verification (including missing API authorization).",
      "",
    ].join("\n"),
  );
}
process.exitCode = healthExitCode(artifact);
