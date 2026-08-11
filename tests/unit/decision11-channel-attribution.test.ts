import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readJson(path: string): any {
  return JSON.parse(readFileSync(join(root, path), "utf8"));
}

const expectations = [
  {
    candidateId: "CAND-NBA-ANKLE-2023-001",
    casePath: "src/content/cases/anthony-edwards-ankle-sprain-2023.json",
    manifestPath: "research/source-manifests/NBA-SOURCE-2026-08-06-001.v1.json",
    videoId: "V9mtX4mE8wQ",
  },
  {
    candidateId: "CAND-NBA-ANKLE-2023-008",
    casePath: "src/content/cases/lamelo-ball-ankle-sprain-2023.json",
    manifestPath: "research/source-manifests/NBA-SOURCE-2026-08-08-001.v1.json",
    videoId: "RDDGpqOvSdg",
  },
] as const;

describe("Decision 11 ESPN channel attribution", () => {
  it.each(expectations)(
    "$videoId keeps ESPN @espn distinct from the NBA on ESPN program-title suffix",
    ({ candidateId, casePath, manifestPath, videoId }) => {
      const record = readJson(casePath);
      const manifest = readJson(manifestPath);
      const entry = manifest.entries.find(
        (candidate: any) => candidate.candidateId === candidateId,
      );
      const videoSource = record.sources.find(
        (source: any) => source.type === "video-original",
      );

      expect(record.video.canonicalUrl).toBe(
        `https://www.youtube.com/watch?v=${videoId}`,
      );
      expect(record.video.uploaderName).toBe("ESPN");
      expect(videoSource.publisher).toBe("ESPN");
      expect(entry.video.uploaderName).toBe("ESPN");
      expect(entry.video.channelUrl).toBe("https://www.youtube.com/@espn");
      expect(entry.video.uploaderName).not.toBe("NBA on ESPN");
    },
  );
});
