import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { issue, type ValidationIssue } from "../src/lib/contracts/canonical";

/** Decision 25: exact local copies of the selected videos' default covers. */
export function loadVideoThumbnails(root: string): {
  allowedPaths: string[];
  issues: ValidationIssue[];
} {
  const manifestPath = "src/assets/videos/provenance.json";
  if (!existsSync(join(root, "src/assets/videos")))
    return { allowedPaths: [], issues: [] };
  try {
    const manifest = JSON.parse(readFileSync(join(root, manifestPath), "utf8"));
    const launch = JSON.parse(
      readFileSync(join(root, "src/data/public-launch.v1.json"), "utf8"),
    );
    const expansion = JSON.parse(
      readFileSync(join(root, "src/data/videos/expansion.v1.json"), "utf8"),
    );
    const additions = JSON.parse(
      readFileSync(join(root, "src/data/videos/additions.v1.json"), "utf8"),
    );
    const curation = JSON.parse(
      readFileSync(join(root, "src/data/videos/curation.v1.json"), "utf8"),
    );
    const batch30 = JSON.parse(
      readFileSync(join(root, "src/data/videos/batch-30.v1.json"), "utf8"),
    );
    const expected = new Set<string>([
      ...[...launch.cases, ...expansion.cases].map(
        (record: { videoUrl: string }) =>
          new URL(record.videoUrl).searchParams.get("v")!,
      ),
      ...[
        ...expansion.clips,
        ...additions.clips,
        ...curation.clips,
        ...batch30.clips,
        ...JSON.parse(
          readFileSync(join(root, "src/data/videos/batch-31.v1.json"), "utf8"),
        ).clips,
        ...JSON.parse(
          readFileSync(join(root, "src/data/videos/batch-32.v1.json"), "utf8"),
        ).clips,
        ...JSON.parse(
          readFileSync(join(root, "src/data/videos/batch-34.v1.json"), "utf8"),
        ).clips,
        ...JSON.parse(
          readFileSync(
            join(root, "src/data/videos/recent-120.v1.json"),
            "utf8",
          ),
        ).clips,
        ...JSON.parse(
          readFileSync(
            join(root, "src/data/videos/recent-150.v1.json"),
            "utf8",
          ),
        ).clips,
        ...JSON.parse(
          readFileSync(join(root, "src/data/videos/judge-rib.v1.json"), "utf8"),
        ).clips,
        ...JSON.parse(
          readFileSync(
            join(root, "src/data/videos/rib-fracture-three.v1.json"),
            "utf8",
          ),
        ).clips,
        ...JSON.parse(
          readFileSync(
            join(root, "src/data/videos/nerve-four.v1.json"),
            "utf8",
          ),
        ).clips,
        ...JSON.parse(
          readFileSync(
            join(root, "src/data/videos/catalog-200.v1.json"),
            "utf8",
          ),
        ).clips,
      ]
        .filter(
          (clip: { slug: string; provider?: string }) =>
            !curation.removedSlugs.includes(clip.slug) &&
            clip.provider !== "mlb",
        )
        .map((clip: { videoId: string }) => clip.videoId),
    ]);
    if (
      manifest.schemaVersion !== 1 ||
      manifest.decision !== "decision-25" ||
      manifest.authorizationQuote !==
        "影片的圖片請用youtube的第一張圖片為主就好" ||
      !Array.isArray(manifest.assets) ||
      manifest.assets.length !== expected.size ||
      expected.size === 0
    )
      throw new Error("invalid inventory");
    const allowedPaths: string[] = [];
    for (const asset of manifest.assets) {
      if (
        !/^[A-Za-z0-9_-]{11}$/.test(asset.videoId) ||
        !expected.delete(asset.videoId) ||
        asset.path !== `src/assets/videos/${asset.videoId}.jpg` ||
        asset.source !== `https://i.ytimg.com/vi/${asset.videoId}/hqdefault.jpg`
      )
        throw new Error("invalid video binding");
      const bytes = readFileSync(join(root, asset.path));
      if (
        bytes.length < 2000 ||
        bytes.readUInt16BE(0) !== 0xffd8 ||
        createHash("sha256").update(bytes).digest("hex") !== asset.sha256
      )
        throw new Error("invalid cover bytes");
      allowedPaths.push(asset.path);
    }
    return { allowedPaths, issues: [] };
  } catch {
    return {
      allowedPaths: [],
      issues: [
        issue(
          "brand-video-thumbnail-inventory",
          manifestPath,
          "YouTube covers must match the selected video IDs, default-cover sources, and recorded file hashes",
        ),
      ],
    };
  }
}
