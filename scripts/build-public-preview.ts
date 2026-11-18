/** Build public UI for local/CI verification. Never grants release or clinical approval. */
import { execFileSync } from "node:child_process";
import { writeFileSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
import { loadPublicVideoInventory } from "./lib/public-video-inventory";
import { containPicomatch } from "./security/picomatch-containment.mjs";
containPicomatch();
const out = "artifacts/public-preview";
execFileSync(process.execPath, ["node_modules/.bin/astro", "build"], {
  stdio: "inherit",
  env: {
    ...process.env,
    ATLAS_BUILD_MODE: "public",
    ATLAS_PUBLIC_LAUNCH: "decision-21",
    ATLAS_PUBLIC_PREVIEW: "1",
  },
});
let htmlPages = 0;
function verify(dir: string): void {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory()) verify(path);
    else if (item.name.endsWith(".html")) {
      const html = readFileSync(path, "utf8");
      assert.ok(
        /name="robots"[^>]*content="noindex,nofollow,noarchive,nosnippet,noimageindex"/.test(
          html,
        ),
        `Preview must be noindex: ${path}`,
      );
      assert.ok(
        !html.includes('data-playback-statistics="enabled"'),
        `Preview telemetry must be disabled: ${path}`,
      );
      htmlPages++;
    }
  }
}
verify(out);
const inventory = loadPublicVideoInventory();
for (const video of inventory) {
  assert.ok(
    readFileSync(join(out, video.path, "index.html"), "utf8").includes(
      "data-video-learning=",
    ),
    `Missing public detail: ${video.path}`,
  );
}
assert.ok(htmlPages > inventory.length, "Public catalog was not built");
assert.equal(
  readFileSync(join(out, "robots.txt"), "utf8"),
  "User-agent: *\nDisallow: /\n",
);
writeFileSync(
  join(out, "PREVIEW_ONLY.json"),
  JSON.stringify(
    {
      schemaVersion: 1,
      artifactType: "public-ui-preview",
      deployable: false,
      clinicalApproval: false,
      commit: execFileSync("git", ["rev-parse", "HEAD"], {
        encoding: "utf8",
      }).trim(),
      htmlPages,
      publicVideoCount: inventory.length,
      builtAt: new Date().toISOString(),
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Verified ${htmlPages} noindex public preview pages; no deployment approval.`,
);
