/** Read-only checker for the canonical append-only source-manifest registry. */

import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

import {
  canonicalJson,
  issue,
  sha256Hex,
  type ValidationIssue,
} from "../../src/lib/contracts/canonical";
import {
  parseSourceManifestRegistryBytes,
  validateSourceManifestRegistryArtifacts,
  type SourceManifestRegistryV1,
} from "../../src/lib/contracts/source-manifest-registry";

export const SOURCE_MANIFEST_REGISTRY_PATH =
  "research/source-manifest-registry.v1.json";

export interface SourceManifestRegistryCheckResult {
  bytes: Buffer;
  digest: string;
  registry: SourceManifestRegistryV1 | null;
  issues: ValidationIssue[];
}

function safeArtifactPath(root: string, relativePath: string): string {
  if (
    relativePath === "" ||
    relativePath.includes("\\") ||
    relativePath.startsWith("/") ||
    relativePath
      .split("/")
      .some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    throw new Error(`unsafe registered artifact path ${relativePath}`);
  }
  const realRoot = realpathSync(root);
  const target = resolve(realRoot, ...relativePath.split("/"));
  const fromRoot = relative(realRoot, target);
  if (fromRoot === "" || fromRoot === ".." || fromRoot.startsWith(`..${sep}`)) {
    throw new Error(
      `registered artifact escapes the repository root: ${relativePath}`,
    );
  }
  const resolvedTarget = realpathSync(target);
  if (resolvedTarget !== target) {
    throw new Error(
      `registered artifact path traverses a symlink: ${relativePath}`,
    );
  }
  if (!lstatSync(target).isFile()) {
    throw new Error(
      `registered artifact is not a regular file: ${relativePath}`,
    );
  }
  return target;
}

function validateRegistryChain(
  registry: SourceManifestRegistryV1,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (let index = 0; index < registry.entries.length; index += 1) {
    const priorBytes = canonicalJson({
      entries: registry.entries.slice(0, index),
      schemaVersion: 1,
    });
    const expected = sha256Hex(priorBytes);
    const observed = registry.entries[index]!.previousRegistryBytesDigest;
    if (observed !== expected) {
      issues.push(
        issue(
          "registry-chain",
          `entries[${index}].previousRegistryBytesDigest`,
          `registry entry anchors ${observed}; exact prior canonical bytes hash to ${expected}`,
        ),
      );
    }
  }
  return issues;
}

/** Inspect every registry/artifact byte without repairing or rewriting state. */
export function checkSourceManifestRegistry(
  root: string = process.cwd(),
): SourceManifestRegistryCheckResult {
  const registryPath = join(root, ...SOURCE_MANIFEST_REGISTRY_PATH.split("/"));
  let bytes: Buffer;
  try {
    bytes = readFileSync(registryPath);
  } catch (error) {
    return {
      bytes: Buffer.alloc(0),
      digest: sha256Hex(Buffer.alloc(0)),
      registry: null,
      issues: [
        issue(
          "registry-missing",
          SOURCE_MANIFEST_REGISTRY_PATH,
          error instanceof Error ? error.message : String(error),
        ),
      ],
    };
  }

  const parsed = parseSourceManifestRegistryBytes(bytes);
  if (parsed.registry === null) {
    return {
      bytes,
      digest: sha256Hex(bytes),
      registry: null,
      issues: parsed.issues,
    };
  }

  const issues = [
    ...validateRegistryChain(parsed.registry),
    ...validateSourceManifestRegistryArtifacts(parsed.registry, (path) =>
      readFileSync(safeArtifactPath(root, path)),
    ),
  ];
  return {
    bytes,
    digest: sha256Hex(bytes),
    registry: parsed.registry,
    issues,
  };
}

export function runSourceManifestRegistryCheck(
  root: string = process.cwd(),
): number {
  const result = checkSourceManifestRegistry(root);
  if (result.issues.length > 0 || result.registry === null) {
    for (const entry of result.issues) {
      console.error(`[${entry.code}] ${entry.path} ${entry.message}`);
    }
    console.error(
      `research:registry:check FAILED with ${result.issues.length} issue(s)`,
    );
    return 1;
  }
  console.log(
    `research:registry:check OK entries=${result.registry.entries.length} digest=${result.digest}`,
  );
  return 0;
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(runSourceManifestRegistryCheck());
}
