// Run after capture-demo.mjs. Requires ffmpeg and ffprobe on PATH.
import { execFileSync } from "node:child_process";
import { readFile, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const capture = JSON.parse(
  await readFile("output/repo-launch-20261020/media/capture.json", "utf8"),
);
const run = (args) =>
  execFileSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-y", ...args],
    { stdio: "inherit" },
  );
const probe = (file) =>
  JSON.parse(
    execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration,size",
        "-of",
        "json",
        file,
      ],
      { encoding: "utf8" },
    ),
  ).format;
const full = "docs/media/catalog-demo.mp4";
const short = "docs/media/catalog-demo-short.mp4";
const gif = "docs/media/catalog-demo.gif";
run([
  "-i",
  capture.videoPath,
  "-vf",
  "fps=30,format=yuv420p",
  "-c:v",
  "libx264",
  "-crf",
  "22",
  "-preset",
  "medium",
  "-movflags",
  "+faststart",
  "-an",
  full,
]);
const duration = Number(probe(full).duration);
if (duration > 45) throw new Error(`Demo exceeds 45 seconds: ${duration}`);
run([
  "-i",
  full,
  "-filter_complex",
  `[0:v]trim=start=7:end=17,setpts=PTS-STARTPTS[a];[0:v]trim=start=${duration - 3}:end=${duration},setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0[out]`,
  "-map",
  "[out]",
  "-c:v",
  "libx264",
  "-crf",
  "22",
  "-pix_fmt",
  "yuv420p",
  "-movflags",
  "+faststart",
  "-an",
  short,
]);
run([
  "-i",
  full,
  "-vf",
  "fps=10,scale=760:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle",
  "-loop",
  "0",
  gif,
]);
if ((await stat(gif)).size > 6_000_000) throw new Error("GIF exceeds 6 MB");
const png = "docs/media/social-preview-1280x640.png";
if ((await stat(png)).size > 1_000_000)
  throw new Error("Social preview exceeds 1 MB");
const files = [];
for (const path of [full, short, gif, png]) {
  const bytes = await readFile(path);
  files.push({
    path,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    ...(path.endsWith(".mp4")
      ? { durationSeconds: Number(probe(path).duration) }
      : {}),
  });
}
const manifest = {
  capturedAt: capture.capturedAt,
  source: capture.source,
  workflow:
    "Search Acuna, open the event, follow its source citation, and return with filters preserved.",
  originalVideoPlayback: false,
  telemetryPosted: false,
  pageErrors: capture.errors,
  files,
};
await writeFile(
  "docs/media/manifest.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(JSON.stringify(files, null, 2));
