import { execFileSync } from "node:child_process";
import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  lstatSync,
  openSync,
  readSync,
} from "node:fs";
import { join } from "node:path";
import { z } from "astro/zod";
import { sha256Hex } from "../../src/lib/contracts/canonical";
import {
  ownedPlaybackOrigin,
  selectCurrentPlaybackEvidence,
  type CurrentPlaybackReceipt,
} from "../../src/lib/video/playback-evidence";
import {
  publicInventoryDigest,
  type PublicInventoryEntry,
} from "../../src/lib/videos/public-inventory";
import {
  inputTreeDigest,
  isReleaseInputPath,
  RELEASE_INPUT_PATHS,
} from "./input-tree";

export const CURRENT_PLAYBACK_REGISTRY =
  "docs/reviews/current-playback.v1.json";
const sha = z.string().regex(/^[a-f0-9]{40}$/);
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const registrySchema = z.strictObject({
  schemaVersion: z.literal(1),
  status: z.enum(["pending", "ready"]),
  sourceCommit: sha.nullable(),
  inputTreeDigest: digest.nullable(),
  catalogDigest: digest.nullable(),
  origin: z.string().refine(ownedPlaybackOrigin).nullable(),
  receiptFiles: z
    .array(z.strictObject({ path: z.string(), sha256: digest }))
    .max(32),
  note: z.string().max(2000).optional(),
});
const stateSchema = z.strictObject({
  time: z.number().nonnegative(),
  paused: z.boolean(),
  readyState: z.number().int().min(0).max(4),
});
const receiptSchema = z.looseObject({
  url: z.url(),
  path: z.string(),
  origin: z.string(),
  startSeconds: z.number().int().nonnegative(),
  sourceCommit: sha,
  sourceDirty: z.boolean(),
  deploymentCommit: sha.nullable(),
  catalogDigest: digest,
  checkedAt: z.iso.datetime({ offset: true }),
  status: z.enum(["played", "unverified", "failed", "unavailable"]),
  error: z.string().max(2000).optional(),
  before: stateSchema.optional(),
  after: stateSchema.optional(),
  captionsEnabled: z.boolean().optional(),
});

/** No traversal, links (including parent directories), or unbounded JSON reads. */
export function readPlaybackEvidenceFile(
  root: string,
  relative: string,
  maximumBytes: number,
): Buffer {
  const segments = relative.split("/");
  if (
    !/^docs\/reviews\/[A-Za-z0-9_./-]+\.json$/.test(relative) ||
    segments.some(
      (segment) => segment === "." || segment === ".." || segment === "",
    )
  )
    throw new Error(
      "Playback evidence path must be a JSON file under docs/reviews",
    );
  let path = root;
  for (const segment of segments) {
    path = join(path, segment);
    if (lstatSync(path).isSymbolicLink())
      throw new Error(`Playback evidence cannot use symlinks: ${relative}`);
  }
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.size > maximumBytes || stat.size === 0)
      throw new Error(`Invalid or oversized playback JSON: ${relative}`);
    const bytes = Buffer.alloc(stat.size + 1);
    let count = 0;
    while (count < bytes.length) {
      const read = readSync(fd, bytes, count, bytes.length - count, null);
      if (read === 0) break;
      count += read;
    }
    if (count !== stat.size)
      throw new Error(`Playback evidence changed while reading: ${relative}`);
    return bytes.subarray(0, count);
  } finally {
    closeSync(fd);
  }
}

/** Docs-only evidence commits do not invalidate the tested application revision. */
export function assertPlaybackSourceInputsUnchanged(
  root: string,
  sourceCommit: string,
): void {
  sha.parse(sourceCommit);
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", sourceCommit, "HEAD"], {
      cwd: root,
      stdio: "ignore",
    });
  } catch {
    throw new Error(
      "Playback source commit must exist and be an ancestor of HEAD",
    );
  }
  // Includes tracked working-tree changes; ignored/untracked inputs are checked
  // independently, so an uncommitted input cannot impersonate the tested SHA.
  const changed = execFileSync(
    "git",
    ["diff", "--no-renames", "--name-only", "-z", sourceCommit, "--"],
    { cwd: root, encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean)
    .filter(isReleaseInputPath);
  const untracked = execFileSync(
    "git",
    ["ls-files", "--others", "-z", "--", ...RELEASE_INPUT_PATHS],
    { cwd: root, encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean)
    .filter(isReleaseInputPath);
  if (changed.length || untracked.length)
    throw new Error(
      `Release inputs differ from playback source commit: ${[...new Set([...changed, ...untracked])].join(", ")}`,
    );
}

export interface LoadedCurrentPlayback {
  registry: z.infer<typeof registrySchema>;
  sourceCommit: string;
  receiptCount: number;
  proofsByPath: Map<string, CurrentPlaybackReceipt>;
}

/** Null means absent registry only. Pending/invalid/incomplete never fall back. */
export function loadCurrentPlaybackRegistry(
  root: string,
  options: { inventory: readonly PublicInventoryEntry[]; now: Date },
): LoadedCurrentPlayback | null {
  const registryPath = join(root, CURRENT_PLAYBACK_REGISTRY);
  // existsSync follows links; lstat also catches a dangling registry symlink.
  if (!existsSync(registryPath)) {
    try {
      lstatSync(registryPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }
  const registry = registrySchema.parse(
    JSON.parse(
      readPlaybackEvidenceFile(
        root,
        CURRENT_PLAYBACK_REGISTRY,
        65_536,
      ).toString("utf8"),
    ),
  );
  if (registry.status !== "ready")
    throw new Error(
      "Current playback registry is pending: complete real playback and evidence review before release",
    );
  if (
    !registry.sourceCommit ||
    !registry.inputTreeDigest ||
    !registry.catalogDigest ||
    !registry.origin ||
    !registry.receiptFiles.length
  )
    throw new Error(
      "Ready playback registry requires complete input, origin and receipt bindings",
    );
  if (registry.inputTreeDigest !== inputTreeDigest(root))
    throw new Error("Current playback input-tree digest mismatch");
  if (registry.catalogDigest !== publicInventoryDigest(options.inventory))
    throw new Error("Current playback catalog digest mismatch");
  assertPlaybackSourceInputsUnchanged(root, registry.sourceCommit);
  if (
    new Set(registry.receiptFiles.map((file) => file.path)).size !==
    registry.receiptFiles.length
  )
    throw new Error("Duplicate playback receipt file");
  const receipts: CurrentPlaybackReceipt[] = [];
  let totalBytes = 0;
  for (const file of registry.receiptFiles) {
    const bytes = readPlaybackEvidenceFile(root, file.path, 8_388_608);
    totalBytes += bytes.length;
    if (totalBytes > 33_554_432)
      throw new Error("Playback evidence exceeds aggregate size limit");
    if (sha256Hex(bytes) !== file.sha256)
      throw new Error(`Playback receipt digest mismatch: ${file.path}`);
    receipts.push(
      ...z
        .array(receiptSchema)
        .max(10_000)
        .parse(JSON.parse(bytes.toString("utf8"))),
    );
  }
  const proofsByPath = new Map<string, CurrentPlaybackReceipt>();
  for (const entry of options.inventory) {
    const result = selectCurrentPlaybackEvidence(
      receipts,
      {
        videoUrl: entry.videoUrl,
        path: entry.path,
        origin: registry.origin,
        startSeconds: entry.startSeconds,
        sourceCommit: registry.sourceCommit,
        catalogDigest: registry.catalogDigest,
        captionRequired: entry.captionRequired,
      },
      options.now,
    );
    if (!result.receipt)
      throw new Error(
        `Current playback rejected for ${entry.path}: ${result.reasons.join(", ")}`,
      );
    proofsByPath.set(entry.path, result.receipt);
  }
  if (
    !options.inventory.length ||
    proofsByPath.size !== options.inventory.length
  )
    throw new Error("Current playback must cover every unique public path");
  return {
    registry,
    sourceCommit: registry.sourceCommit,
    receiptCount: receipts.length,
    proofsByPath,
  };
}
