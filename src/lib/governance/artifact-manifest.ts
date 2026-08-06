/**
 * One strict canonical sorted-path artifact-manifest contract shared by
 * review and public modes. A manifest must cover every built file exactly
 * once with hashes and metadata only; it never contains credentials or raw
 * copyrighted/clinical page bytes, and it may not include the out-of-tree
 * manifest/receipt artifacts that describe it.
 */

import { z } from "astro/zod";
import {
  canonicalJson,
  CanonicalJsonError,
  compareCodePoints,
  issue,
  parseStrictJson,
  SHA256_RE,
  sha256Hex,
  type ValidationIssue,
} from "../contracts/canonical";

const sha256Lower = z.string().regex(SHA256_RE);
const nonEmpty = z.string().min(1);

export const artifactFileSchema = z.strictObject({
  path: nonEmpty,
  sha256: sha256Lower,
  byteLength: z.number().int().min(0),
  contentType: nonEmpty,
});
export type ArtifactFile = z.infer<typeof artifactFileSchema>;

export const artifactManifestSchema = z.strictObject({
  schemaVersion: z.literal(1),
  manifestType: z.literal("built-artifact"),
  buildMode: z.enum(["review", "public"]),
  files: z.array(artifactFileSchema).min(1),
});
export type ArtifactManifest = z.infer<typeof artifactManifestSchema>;

/**
 * Out-of-tree persistence prefixes for governance artifacts (persisted as
 * `*.v1.json` under these directories). A built route output such as
 * `review/review-set.json` is a legitimate manifest entry; the persisted
 * manifest/receipt/decision artifacts themselves never are.
 */
export const ARTIFACT_PERSISTENCE_PREFIXES: readonly string[] = [
  "review/",
  "public-release-artifacts/",
];

function isPersistedGovernanceArtifactPath(path: string): boolean {
  return (
    ARTIFACT_PERSISTENCE_PREFIXES.some((prefix) => path.startsWith(prefix)) &&
    /\.v\d+\.json$/.test(path)
  );
}

function pathIssues(path: string, location: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (path.startsWith("/") || path.includes("\\")) {
    issues.push(
      issue(
        "artifact-path",
        location,
        `artifact path ${path} must be a relative forward-slash path`,
      ),
    );
    return issues;
  }
  const segments = path.split("/");
  if (
    segments.some(
      (segment) => segment === "" || segment === "." || segment === "..",
    )
  ) {
    issues.push(
      issue(
        "artifact-path-traversal",
        location,
        `artifact path ${path} contains an empty or traversal segment`,
      ),
    );
  }
  return issues;
}

export interface ArtifactManifestOptions {
  /**
   * Paths of the manifest/receipt artifacts themselves; a manifest that
   * attempts to include one of them is rejected.
   */
  selfPaths?: readonly string[];
}

/** Validates one parsed manifest object. */
export function validateArtifactManifest(
  value: unknown,
  options: ArtifactManifestOptions = {},
): ValidationIssue[] {
  const parsed = artifactManifestSchema.safeParse(value);
  if (!parsed.success) {
    return parsed.error.issues.map((zodIssue) =>
      issue(
        "artifact-manifest-schema",
        zodIssue.path.join("."),
        zodIssue.message,
      ),
    );
  }
  const issues: ValidationIssue[] = [];
  const selfPaths = new Set(options.selfPaths ?? []);
  const seen = new Set<string>();
  parsed.data.files.forEach((file, index) => {
    const location = `files[${index}]`;
    issues.push(...pathIssues(file.path, location));
    if (seen.has(file.path)) {
      issues.push(
        issue(
          "artifact-duplicate-path",
          location,
          `artifact path ${file.path} appears more than once`,
        ),
      );
    }
    seen.add(file.path);
    if (
      selfPaths.has(file.path) ||
      isPersistedGovernanceArtifactPath(file.path)
    ) {
      issues.push(
        issue(
          "artifact-self-reference",
          location,
          `artifact manifest may not include its own manifest/receipt artifact ${file.path}`,
        ),
      );
    }
    if (index > 0) {
      const previous = parsed.data.files[index - 1]!;
      if (compareCodePoints(previous.path, file.path) >= 0) {
        issues.push(
          issue(
            "artifact-order",
            location,
            "artifact files must be strictly sorted by path",
          ),
        );
      }
    }
  });
  return issues;
}

/**
 * Requires the manifest to cover every built file exactly once: no missing
 * and no extra paths against the actual built file set.
 */
export function validateArtifactManifestCoverage(
  manifest: ArtifactManifest,
  builtPaths: readonly string[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const manifestPaths = new Set(manifest.files.map((file) => file.path));
  const built = new Set(builtPaths);
  for (const path of built) {
    if (!manifestPaths.has(path)) {
      issues.push(
        issue(
          "artifact-missing-path",
          path,
          `built file ${path} is missing from the artifact manifest`,
        ),
      );
    }
  }
  for (const path of manifestPaths) {
    if (!built.has(path)) {
      issues.push(
        issue(
          "artifact-extra-path",
          path,
          `manifest lists ${path} which is not a built file`,
        ),
      );
    }
  }
  return issues;
}

export interface BuiltFileInput {
  path: string;
  bytes: Uint8Array | string;
  contentType: string;
}

export class ArtifactManifestError extends Error {}

/** Builds the canonical sorted manifest for a built file set. */
export function buildArtifactManifest(
  buildMode: "review" | "public",
  files: readonly BuiltFileInput[],
): ArtifactManifest {
  const entries = files
    .map((file) => ({
      path: file.path,
      sha256: sha256Hex(file.bytes),
      byteLength:
        typeof file.bytes === "string"
          ? Buffer.byteLength(file.bytes, "utf8")
          : file.bytes.byteLength,
      contentType: file.contentType,
    }))
    .sort((a, b) => compareCodePoints(a.path, b.path));
  const manifest: ArtifactManifest = {
    schemaVersion: 1,
    manifestType: "built-artifact",
    buildMode,
    files: entries,
  };
  const issues = validateArtifactManifest(manifest);
  if (issues.length > 0) {
    throw new ArtifactManifestError(
      issues.map((entry) => `${entry.path}: ${entry.message}`).join("; "),
    );
  }
  return manifest;
}

/** Canonical byte digest of a manifest. */
export function computeArtifactManifestDigest(
  manifest: ArtifactManifest,
): string {
  return sha256Hex(canonicalJson(manifest));
}

export interface ParsedArtifactManifest {
  manifest: ArtifactManifest | null;
  manifestDigest: string;
  issues: ValidationIssue[];
}

/** Strict canonical-bytes parse of a persisted manifest artifact. */
export function parseArtifactManifestBytes(
  bytes: Uint8Array | string,
): ParsedArtifactManifest {
  const manifestDigest = sha256Hex(bytes);
  const text =
    typeof bytes === "string" ? bytes : Buffer.from(bytes).toString("utf8");
  let parsed: unknown;
  try {
    parsed = parseStrictJson(text);
  } catch (error) {
    return {
      manifest: null,
      manifestDigest,
      issues: [
        issue(
          "artifact-manifest-parse",
          "",
          error instanceof CanonicalJsonError ? error.message : String(error),
        ),
      ],
    };
  }
  const issues: ValidationIssue[] = [];
  if (canonicalJson(parsed) !== text) {
    issues.push(
      issue(
        "artifact-manifest-not-canonical",
        "",
        "manifest bytes must be exact canonical JSON",
      ),
    );
  }
  issues.push(...validateArtifactManifest(parsed));
  if (issues.length > 0) return { manifest: null, manifestDigest, issues };
  return {
    manifest: parsed as ArtifactManifest,
    manifestDigest,
    issues,
  };
}
