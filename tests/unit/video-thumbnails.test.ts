import batch30Data from "../../src/data/videos/batch-30.v1.json";
import batch31Data from "../../src/data/videos/batch-31.v1.json";
import batch32Data from "../../src/data/videos/batch-32.v1.json";
import batch34Data from "../../src/data/videos/batch-34.v1.json";
import recent120Data from "../../src/data/videos/recent-120.v1.json";
import curation from "../../src/data/videos/curation.v1.json";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, test } from "vitest";
import { loadVideoThumbnails } from "../../scripts/verify-video-thumbnails";
const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "atlas-covers-"));
  roots.push(root);
  for (const path of ["src/assets/videos", "src/data/videos"])
    mkdirSync(join(root, path), { recursive: true });
  cpSync("src/assets/videos", join(root, "src/assets/videos"), {
    recursive: true,
  });
  for (const path of [
    "src/data/public-launch.v1.json",
    "src/data/videos/expansion.v1.json",
    "src/data/videos/additions.v1.json",
    "src/data/videos/curation.v1.json",
    "src/data/videos/batch-30.v1.json",
    "src/data/videos/batch-31.v1.json",
    "src/data/videos/batch-32.v1.json",
    "src/data/videos/batch-34.v1.json",
    "src/data/videos/recent-120.v1.json",
  ])
    cpSync(path, join(root, path));
  expect(loadVideoThumbnails(root).issues).toEqual([]);
  return root;
}
test("all selected video covers have matching local provenance", () => {
  const result = loadVideoThumbnails(process.cwd());
  expect(result.issues).toEqual([]);
  expect(result.allowedPaths).toHaveLength(
    19 -
      curation.removedSlugs.length +
      curation.clips.length +
      batch30Data.clips.length +
      batch31Data.clips.length +
      batch32Data.clips.length +
      batch34Data.clips.length +
      recent120Data.clips.length,
  );
});
test("changed cover bytes fail closed", () => {
  const root = fixture();
  writeFileSync(
    join(root, "src/assets/videos/8TIJGIRP634.jpg"),
    "wrong video image",
  );
  expect(loadVideoThumbnails(root).allowedPaths).toEqual([]);
  expect(loadVideoThumbnails(root).issues).toHaveLength(1);
});
test.each(["videoId", "path", "source"])(
  "unapproved %s binding fails closed",
  (field) => {
    const root = fixture();
    const path = join(root, "src/assets/videos/provenance.json");
    const manifest = JSON.parse(readFileSync(path, "utf8"));
    manifest.assets[0][field] = "unapproved";
    writeFileSync(path, JSON.stringify(manifest));
    expect(loadVideoThumbnails(root).issues).toHaveLength(1);
  },
);
