import { videosByBodyPart } from "../../src/lib/videos/body-parts";
import { videosBySport } from "../../src/lib/videos/sports";
import { videosBySituation } from "../../src/lib/videos/discovery";
import { publicVideoIds } from "../../src/lib/videos/public-video-ids";
import {
  allObservationClips,
  curation,
  expansion,
} from "../../src/lib/videos/expansion";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { parse } from "parse5";
import { launchApprovalSchema } from "../../src/lib/patient/public-launch";
import { canonicalJson, sha256Hex } from "../../src/lib/contracts/canonical";
import { loadContentCollections } from "../check-content";
import { inputTreeDigest } from "./input-tree";

const approval = launchApprovalSchema.parse(
  JSON.parse(readFileSync("src/data/public-launch.v1.json", "utf8")),
);
assert.equal(
  approval.inputTreeDigest,
  inputTreeDigest(),
  "Inputs changed during build",
);
const selected = loadContentCollections()
  .cases.map((entry) => entry.record)
  .filter((record) =>
    [...approval.cases, ...expansion.cases].some(
      (item) => item.id === record.id,
    ),
  );
assert.equal(selected.length, approval.cases.length + expansion.cases.length);
assert.deepEqual(
  [...publicVideoIds].sort(),
  [
    ...selected.map((record) =>
      new URL(record.video.canonicalUrl).searchParams.get("v"),
    ),
    ...allObservationClips.map((clip) => clip.videoId),
  ].sort(),
  "Statistics allowlist must match the actual public video collection",
);
const situations = videosBySituation(selected, allObservationClips).map(
  (item) => ({
    code: item.code,
    label: item.label,
    count: item.count,
    paths: [
      ...item.cases.map((c) => `/cases/${c.slug}/`),
      ...item.clips.map((c) => `/videos/${c.slug}/`),
    ],
  }),
);
assert.deepEqual(
  readdirSync("dist/situations").sort(),
  situations.map((s) => s.code).sort(),
);
assert.equal(
  situations.reduce((sum, item) => sum + item.count, 0),
  selected.length + allObservationClips.length,
);
assert.deepEqual(
  readdirSync("dist/videos").sort(),
  allObservationClips.map((c) => c.slug).sort(),
  "Observation route set mismatch",
);
const bodyParts = videosByBodyPart(selected, allObservationClips).map(
  (part) => ({
    code: part.code,
    label: part.label,
    count: part.count,
    paths: [
      ...part.cases.map((c) => `/cases/${c.slug}/`),
      ...part.clips.map((c) => `/videos/${c.slug}/`),
    ],
  }),
);
assert.deepEqual(
  readdirSync("dist/body-parts").sort(),
  bodyParts.map((p) => p.code).sort(),
);
assert.deepEqual(
  bodyParts.flatMap((p) => p.paths).sort(),
  [
    ...selected.map((c) => `/cases/${c.slug}/`),
    ...allObservationClips.map((c) => `/videos/${c.slug}/`),
  ].sort(),
  "Each video must appear in exactly one body part",
);
const sports = videosBySport(selected, allObservationClips).map((sport) => ({
  code: sport.code,
  label: sport.label,
  count: sport.count,
  paths: [
    ...sport.cases.map((c) => `/cases/${c.slug}/`),
    ...sport.clips.map((c) => `/videos/${c.slug}/`),
  ],
}));
assert.deepEqual(
  readdirSync("dist/sports").sort(),
  sports.map((sport) => sport.code).sort(),
  "Sport route set mismatch",
);
assert.deepEqual(
  sports.flatMap((sport) => sport.paths).sort(),
  [
    ...selected.map((c) => `/cases/${c.slug}/`),
    ...allObservationClips.map((c) => `/videos/${c.slug}/`),
  ].sort(),
  "Each video must appear in exactly one sport",
);
for (const slug of curation.removedSlugs)
  assert.ok(
    !existsSync(`dist/videos/${slug}`),
    `Removed video route exists: ${slug}`,
  );
assert.ok(!existsSync("dist/review"), "Private review routes leaked");
assert.ok(!existsSync("dist/updates"), "Unapproved historical update leaked");
const list = (path: string): string[] =>
  readdirSync(path).flatMap((name) => {
    const full = join(path, name);
    return statSync(full).isDirectory() ? list(full) : [full];
  });
const htmlFiles = list("dist").filter((path) => path.endsWith(".html"));
const cases = htmlFiles.filter((path) => path.startsWith("dist/cases/"));
assert.deepEqual(
  cases.sort(),
  selected.map((record) => `dist/cases/${record.slug}/index.html`).sort(),
  "Public case route set mismatch",
);
let links = 0;
for (const path of htmlFiles) {
  const html = readFileSync(path, "utf8");
  assert.ok(
    !/atlas-artifact-identity-v1|data-review-digest|data-workflow-status|data-review-banner|127\.0\.0\.1|localhost/.test(
      html,
    ),
    `Private metadata in ${path}`,
  );
  assert.ok(
    !/<iframe\b/i.test(html),
    `Third-party content loaded before consent: ${path}`,
  );
  assert.ok(
    !/name="robots"[^>]+noindex/.test(html),
    `Review robots in ${path}`,
  );
  const nodes: any[] = [parse(html)];
  while (nodes.length) {
    const node = nodes.pop();
    nodes.push(...(node.childNodes ?? []));
    const attrs = Object.fromEntries(
      (node.attrs ?? []).map((a: { name: string; value: string }) => [
        a.name,
        a.value,
      ]),
    );
    if (node.tagName === "link" && attrs.rel === "canonical")
      assert.ok(attrs.href.startsWith(approval.origin + "/"));
    if (["img", "script", "source"].includes(node.tagName))
      assert.ok(
        !/^https?:/.test(attrs.src ?? ""),
        `External preactivation asset: ${path}`,
      );
    if (attrs.href?.startsWith("/")) {
      assert.ok(!attrs.href.startsWith("//"));
      const local = decodeURIComponent(attrs.href.split(/[?#]/)[0]);
      const target = join("dist", local);
      assert.ok(
        existsSync(target) &&
          (!statSync(target).isDirectory() ||
            existsSync(join(target, "index.html"))),
        `Broken internal link ${attrs.href} in ${path}`,
      );
      links++;
    }
  }
}
for (const record of selected) {
  const html = readFileSync(`dist/cases/${record.slug}/index.html`, "utf8");
  assert.ok(
    html.includes("data-video-load") &&
      html.includes("受傷當下") &&
      html.includes("回場"),
    `Missing patient experience: ${record.id}`,
  );
}
for (const item of [
  ...selected.map((r) => ({ ...r, prefix: "cases" })),
  ...allObservationClips.map((c) => ({ ...c, prefix: "videos" })),
]) {
  const html = readFileSync(
    `dist/${item.prefix}/${item.slug}/index.html`,
    "utf8",
  );
  assert.ok(
    html.includes(`data-event-follow-up="${item.slug}"`) &&
      html.includes("查看傷勢與回場來源"),
    `Missing sourced event report: ${item.slug}`,
  );
}
assert.equal(
  readFileSync("dist/robots.txt", "utf8"),
  "User-agent: *\nAllow: /\n",
);
// Native YouTube API loads only after the visitor activates the local facade.
writeFileSync(
  "dist/_headers",
  `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; frame-src https://www.youtube-nocookie.com; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
`,
);
// Removed Pages assets can remain in CDN cache. Redirect before asset lookup.
writeFileSync(
  "dist/_redirects",
  curation.removedSlugs
    .flatMap((slug) =>
      ["", "/", "/index.html"].map(
        (suffix) => `/videos/${slug}${suffix} /removed-video/ 302`,
      ),
    )
    .join("\n") + "\n",
);
const receipt = {
  schemaVersion: 1,
  decision: "decision-21",
  mode: "public",
  origin: approval.origin,
  commit: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  approvalDigest: sha256Hex(canonicalJson(approval)),
  generatedAt: new Date().toISOString(),
  cases: selected.map(({ id, slug }) => ({ id, slug })),
  clips: allObservationClips.map(({ slug, videoUrl, startSeconds }) => ({
    slug,
    videoUrl,
    startSeconds,
  })),
  bodyParts,
  sports,
  situations,
  htmlPages: htmlFiles.length,
  internalLinks: links,
  files: list("dist")
    .sort()
    .map((path) => ({
      path: path.slice(5),
      digest: sha256Hex(readFileSync(path)),
    })),
};
mkdirSync("artifacts", { recursive: true });
writeFileSync(
  "artifacts/public-launch-receipt.v1.json",
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(
  `Public artifact verified: ${receipt.htmlPages} pages, ${selected.length} cases, ${links} local links; no review routes or preactivation embeds.`,
);
