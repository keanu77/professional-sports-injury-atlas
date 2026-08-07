/**
 * Transactional publisher for the frozen NBA source-review manifest.
 *
 * The fixed lock is acquired before any authority read. Manifest publication
 * is an exclusive same-filesystem hard link; the registry replacement is an
 * fsynced atomic rename. Failures retain the exact lock and this transaction's
 * temp files for explicit operator inspection.
 */

import { isUtf8 } from "node:buffer";
import { randomUUID } from "node:crypto";
import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  fsyncSync,
  linkSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

import {
  canonicalJson,
  isValidUtcTimestamp,
  sha256Hex,
} from "../../src/lib/contracts/canonical";
import {
  parseSourceManifestRegistryBytes,
  validateSourceManifestRegistryAppend,
  validateSourceManifestRegistryArtifacts,
  type SourceManifestRegistryEntry,
  type SourceManifestRegistryV1,
} from "../../src/lib/contracts/source-manifest-registry";
import {
  CANDIDATE_INJURY_CODES,
  type CandidateInjuryCode,
  type CandidateRow,
} from "../../src/lib/research/candidate-contract";
import { parseCandidateCsv } from "../../src/lib/research/csv";
import {
  NBA_LAUNCH_CUTOFF_DATE,
  NBA_LAUNCH_MANIFEST_PERIOD,
  NBA_LAUNCH_SOURCE_POLICY_VERSION,
  NBA_LAUNCH_ZERO_CLASSIC_MANIFEST_ID,
  buildCandidateManifest,
  digestCandidateManifest,
  serializeCandidateManifest,
  type CandidateSourceManifestV1,
} from "../../src/lib/research/candidate-manifest";
import {
  CANDIDATE_LEDGER_PATHS,
  MINIMUM_RESEARCHED_CANDIDATES_PER_INJURY,
} from "./check-candidates";
import {
  SOURCE_POLICY_JSON_PATH,
  SOURCE_POLICY_MARKDOWN_PATH,
  SOURCE_REVIEW_DECISION_PATH,
} from "./check-candidate-verification";
import {
  ROOT_AUDIT_PATH,
  VERIFICATION_ARTIFACT_PATH,
} from "./verify-candidate-links";

export const MANIFEST_PATH =
  "research/source-manifests/NBA-SOURCE-2026-08-06-001.v1.json";
export const REGISTRY_PATH = "research/source-manifest-registry.v1.json";
export const REGISTRY_LOCK_PATH = "research/.source-batch-registry.lock";
export const REGISTRY_TEMP_DIRECTORY = "research/.source-batch-tmp";

const TRANSACTION_ID_RE = /^[0-9a-f]{32}$/;

export type ManifestGenerationFaultPoint =
  | "before-manifest-publication"
  | "after-manifest-publication"
  | "after-registry-replacement";

export type ManifestDurabilityEvent =
  | "lock-file"
  | "lock-parent-after-create"
  | "manifest-temp-file"
  | "registry-temp-file"
  | "manifest-target-file"
  | "manifest-parent-after-publish"
  | "registry-target-file"
  | "registry-parent-after-rename"
  | "temp-parent-after-cleanup"
  | "lock-file-before-remove"
  | "lock-parent-after-remove";

export interface GenerateCandidateManifestOptions {
  validationNow?: string;
  transactionNow?: () => string;
  randomId?: () => string;
  faultAt?: ManifestGenerationFaultPoint;
  afterLockAcquired?: () => void;
  onAuthorityRead?: () => void;
  onCheckpoint?: (point: ManifestGenerationFaultPoint) => void;
  onDurabilityEvent?: (event: ManifestDurabilityEvent) => void;
}

export interface GenerateCandidateManifestResult {
  status: "published" | "adopted-orphan" | "already-complete";
  manifestDigest: string;
  registryDigest: string;
}

export class ManifestGenerationCrash extends Error {
  readonly faultAt: ManifestGenerationFaultPoint;

  constructor(faultAt: ManifestGenerationFaultPoint) {
    super(`simulated manifest generation crash at ${faultAt}`);
    this.name = "ManifestGenerationCrash";
    this.faultAt = faultAt;
  }
}

class CompletionDurabilityUncertainError extends Error {
  constructor(cause: unknown) {
    super(
      "registry transaction completed and removed its lock, but lock-parent durability is uncertain",
      { cause },
    );
    this.name = "CompletionDurabilityUncertainError";
  }
}

interface AuthoritySnapshot {
  csvBytes: Record<CandidateInjuryCode, string>;
  verificationArtifactBytes: string;
  rootAuditBytes: string;
  sourcePolicyJsonBytes: string;
  sourcePolicyMarkdownBytes: string;
  sourceReviewDecisionBytes: string;
  registryBytes: Buffer;
}

interface LockIdentity {
  bytes: Buffer;
  dev: number;
  ino: number;
}

export interface ExpectedCandidateManifest {
  manifest: CandidateSourceManifestV1;
  bytes: Buffer;
  digest: string;
}

const defaultValidationNow = (): string =>
  new Date().toISOString().replace(/\.\d{3}Z$/u, "Z");
const defaultTransactionNow = defaultValidationNow;
const defaultRandomId = (): string => randomUUID().replaceAll("-", "");

function absolute(root: string, relativePath: string): string {
  return join(root, ...relativePath.split("/"));
}

function readRegularFile(path: string, label: string): Buffer {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`${label} must be a regular non-symlink file`);
  }
  return readFileSync(path);
}

function utf8(bytes: Buffer, label: string): string {
  if (!isUtf8(bytes)) throw new Error(`${label} is not valid UTF-8`);
  return bytes.toString("utf8");
}

function captureAuthoritySnapshot(
  root: string,
  onAuthorityRead?: () => void,
): AuthoritySnapshot {
  onAuthorityRead?.();
  const csvBytes = Object.fromEntries(
    CANDIDATE_INJURY_CODES.map((injury) => {
      const path = CANDIDATE_LEDGER_PATHS[injury];
      const bytes = readRegularFile(absolute(root, path), path);
      return [injury, utf8(bytes, path)];
    }),
  ) as Record<CandidateInjuryCode, string>;
  const readText = (relativePath: string): string =>
    utf8(
      readRegularFile(absolute(root, relativePath), relativePath),
      relativePath,
    );
  return {
    csvBytes,
    verificationArtifactBytes: readText(VERIFICATION_ARTIFACT_PATH),
    rootAuditBytes: readText(ROOT_AUDIT_PATH),
    sourcePolicyJsonBytes: readText(SOURCE_POLICY_JSON_PATH),
    sourcePolicyMarkdownBytes: readText(SOURCE_POLICY_MARKDOWN_PATH),
    sourceReviewDecisionBytes: readText(SOURCE_REVIEW_DECISION_PATH),
    registryBytes: readRegularFile(
      absolute(root, REGISTRY_PATH),
      REGISTRY_PATH,
    ),
  };
}

function snapshotFieldEntries(
  snapshot: AuthoritySnapshot,
): Array<[string, string | Buffer]> {
  return [
    ...CANDIDATE_INJURY_CODES.map(
      (injury) =>
        [`csv:${injury}`, snapshot.csvBytes[injury]] as [string, string],
    ),
    ["verification", snapshot.verificationArtifactBytes],
    ["root-audit", snapshot.rootAuditBytes],
    ["policy-json", snapshot.sourcePolicyJsonBytes],
    ["policy-markdown", snapshot.sourcePolicyMarkdownBytes],
    ["source-review-decision", snapshot.sourceReviewDecisionBytes],
    ["registry", snapshot.registryBytes],
  ];
}

function assertSnapshotEqual(
  expected: AuthoritySnapshot,
  observed: AuthoritySnapshot,
  phase: string,
): void {
  const observedByName = new Map(snapshotFieldEntries(observed));
  for (const [name, expectedBytes] of snapshotFieldEntries(expected)) {
    const actual = observedByName.get(name);
    const matches =
      typeof expectedBytes === "string" && typeof actual === "string"
        ? expectedBytes === actual
        : Buffer.isBuffer(expectedBytes) && Buffer.isBuffer(actual)
          ? expectedBytes.equals(actual)
          : false;
    if (!matches) {
      throw new Error(`${name} authority bytes changed during ${phase}`);
    }
  }
}

function parseRows(snapshot: AuthoritySnapshot): CandidateRow[] {
  const rows: CandidateRow[] = [];
  for (const injury of CANDIDATE_INJURY_CODES) {
    const injuryRows = parseCandidateCsv(snapshot.csvBytes[injury], injury);
    if (injuryRows.length < MINIMUM_RESEARCHED_CANDIDATES_PER_INJURY) {
      throw new Error(
        `${injury} has ${injuryRows.length} researched candidates; at least ${MINIMUM_RESEARCHED_CANDIDATES_PER_INJURY} are required`,
      );
    }
    rows.push(...injuryRows);
  }
  return rows;
}

function buildManifest(
  snapshot: AuthoritySnapshot,
  validationNow: string,
): CandidateSourceManifestV1 {
  return buildCandidateManifest({
    manifestId: NBA_LAUNCH_ZERO_CLASSIC_MANIFEST_ID,
    batchType: "launch",
    period: NBA_LAUNCH_MANIFEST_PERIOD,
    sourcePolicyVersion: NBA_LAUNCH_SOURCE_POLICY_VERSION,
    cutoffDate: NBA_LAUNCH_CUTOFF_DATE,
    rows: parseRows(snapshot),
    csvBytes: snapshot.csvBytes,
    verificationArtifactBytes: snapshot.verificationArtifactBytes,
    rootAuditBytes: snapshot.rootAuditBytes,
    sourcePolicyJsonBytes: snapshot.sourcePolicyJsonBytes,
    sourcePolicyMarkdownBytes: snapshot.sourcePolicyMarkdownBytes,
    sourceReviewDecisionBytes: snapshot.sourceReviewDecisionBytes,
    validationNow,
    supersedes: [],
  });
}

/** Recompute expected bytes without publishing; used by read-only checkers. */
export function buildExpectedCandidateManifest(
  root: string = process.cwd(),
  validationNow: string = defaultValidationNow(),
): ExpectedCandidateManifest {
  const initial = captureAuthoritySnapshot(root);
  const confirmed = captureAuthoritySnapshot(root);
  assertSnapshotEqual(initial, confirmed, "read-only manifest inspection");
  const manifest = buildManifest(initial, validationNow);
  const bytes = Buffer.from(serializeCandidateManifest(manifest));
  return { manifest, bytes, digest: digestCandidateManifest(manifest) };
}

function ensureDirectory(path: string, mode: number): void {
  if (!existsSync(path)) mkdirSync(path, { mode });
  const stat = lstatSync(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(`${path} must be a non-symlink directory`);
  }
}

function fsyncFilePath(
  path: string,
  event: ManifestDurabilityEvent,
  options: GenerateCandidateManifestOptions,
): void {
  const fd = openSync(path, constants.O_RDONLY);
  try {
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  options.onDurabilityEvent?.(event);
}

function fsyncDirectory(
  path: string,
  event: ManifestDurabilityEvent,
  options: GenerateCandidateManifestOptions,
): void {
  const fd = openSync(path, constants.O_RDONLY);
  try {
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  options.onDurabilityEvent?.(event);
}

function writeExclusiveTemp(
  path: string,
  bytes: Buffer,
  event: ManifestDurabilityEvent,
  options: GenerateCandidateManifestOptions,
): void {
  const fd = openSync(path, "wx", 0o600);
  try {
    writeFileSync(fd, bytes);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  options.onDurabilityEvent?.(event);
}

function acquireLock(
  root: string,
  transactionId: string,
  createdAt: string,
  options: GenerateCandidateManifestOptions,
): LockIdentity {
  const lockPath = absolute(root, REGISTRY_LOCK_PATH);
  const lockBytes = Buffer.from(
    canonicalJson({
      createdAt,
      manifestId: NBA_LAUNCH_ZERO_CLASSIC_MANIFEST_ID,
      processId: process.pid,
      schemaVersion: 1,
      transactionId,
    }),
  );
  let fd: number;
  try {
    fd = openSync(lockPath, "wx", 0o600);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "EEXIST") {
      throw new Error(
        `registry transaction lock already exists at ${REGISTRY_LOCK_PATH}`,
      );
    }
    throw error;
  }
  try {
    writeFileSync(fd, lockBytes);
    fsyncSync(fd);
    options.onDurabilityEvent?.("lock-file");
    const stat = fstatSync(fd);
    return { bytes: lockBytes, dev: stat.dev, ino: stat.ino };
  } finally {
    closeSync(fd);
  }
}

function releaseOwnedLock(
  root: string,
  identity: LockIdentity,
  options: GenerateCandidateManifestOptions,
): void {
  const path = absolute(root, REGISTRY_LOCK_PATH);
  const stat = lstatSync(path);
  const bytes = readFileSync(path);
  if (
    stat.dev !== identity.dev ||
    stat.ino !== identity.ino ||
    !bytes.equals(identity.bytes)
  ) {
    throw new Error(
      "registry transaction lock identity changed; refusing removal",
    );
  }
  fsyncFilePath(path, "lock-file-before-remove", options);
  unlinkSync(path);
  try {
    fsyncDirectory(dirname(path), "lock-parent-after-remove", options);
  } catch (error) {
    throw new CompletionDurabilityUncertainError(error);
  }
}

function checkpoint(
  point: ManifestGenerationFaultPoint,
  options: GenerateCandidateManifestOptions,
): void {
  options.onCheckpoint?.(point);
  if (options.faultAt === point) throw new ManifestGenerationCrash(point);
}

function safeRegisteredArtifactPath(
  root: string,
  relativePath: string,
): string {
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
    throw new Error(`registered artifact escapes root: ${relativePath}`);
  }
  return target;
}

function registryArtifactLoader(
  root: string,
  inMemoryManifest?: Buffer,
): (path: string) => Uint8Array {
  return (path) => {
    if (path === MANIFEST_PATH && inMemoryManifest !== undefined) {
      return inMemoryManifest;
    }
    return readRegularFile(
      safeRegisteredArtifactPath(root, path),
      `registered artifact ${path}`,
    );
  };
}

function throwIssues(
  prefix: string,
  issues: readonly { code: string; path: string; message: string }[],
): never {
  throw new Error(
    `${prefix}: ${issues
      .map((entry) => `[${entry.code}] ${entry.path} ${entry.message}`)
      .join("\n")}`,
  );
}

function expectedRegistryEntry(
  manifest: CandidateSourceManifestV1,
  manifestDigest: string,
  decisionDigest: string,
  priorRegistryBytes: Uint8Array,
): SourceManifestRegistryEntry {
  return {
    manifestId: manifest.manifestId,
    manifestPath: MANIFEST_PATH,
    manifestDigest,
    sourceReviewDecisionPath: SOURCE_REVIEW_DECISION_PATH,
    sourceReviewDecisionDigest: decisionDigest,
    sourcePolicyVersion: manifest.sourcePolicyVersion,
    batchType: manifest.batchType,
    period: manifest.period,
    createdAt: manifest.generatedAt,
    previousRegistryBytesDigest: sha256Hex(priorRegistryBytes),
    supersedes: manifest.supersedes,
  };
}

function validateRegistryArtifacts(
  root: string,
  registry: SourceManifestRegistryV1,
  inMemoryManifest?: Buffer,
): void {
  const issues = validateSourceManifestRegistryArtifacts(
    registry,
    registryArtifactLoader(root, inMemoryManifest),
  );
  if (issues.length > 0)
    throwIssues("registry artifact validation failed", issues);
}

function cleanOwnTemps(
  tempPaths: readonly string[],
  tempDirectory: string,
  options: GenerateCandidateManifestOptions,
): void {
  for (const path of tempPaths) {
    if (existsSync(path)) unlinkSync(path);
  }
  fsyncDirectory(tempDirectory, "temp-parent-after-cleanup", options);
}

function retainedLockError(root: string, error: unknown): Error {
  const path = absolute(root, REGISTRY_LOCK_PATH);
  let suffix = `; registry lock retained at ${REGISTRY_LOCK_PATH}`;
  try {
    suffix += ` sha256=${sha256Hex(readFileSync(path))}`;
  } catch {
    suffix += " (digest unavailable)";
  }
  if (error instanceof ManifestGenerationCrash) return error;
  if (error instanceof CompletionDurabilityUncertainError) return error;
  const wrapped = new Error(
    `${error instanceof Error ? error.message : String(error)}${suffix}`,
    { cause: error },
  );
  wrapped.name = "ManifestGenerationError";
  return wrapped;
}

/** Publish or idempotently validate the one authorized launch batch. */
export function generateCandidateManifest(
  root: string = process.cwd(),
  options: GenerateCandidateManifestOptions = {},
): GenerateCandidateManifestResult {
  const transactionId = (options.randomId ?? defaultRandomId)();
  const transactionCreatedAt = (
    options.transactionNow ?? defaultTransactionNow
  )();
  const validationNow = options.validationNow ?? defaultValidationNow();
  if (!TRANSACTION_ID_RE.test(transactionId)) {
    throw new Error(
      "transaction ID must be exactly 32 lowercase hex characters",
    );
  }
  if (!isValidUtcTimestamp(transactionCreatedAt)) {
    throw new Error("transaction timestamp must be UTC seconds precision");
  }
  if (!isValidUtcTimestamp(validationNow)) {
    throw new Error("validationNow must be UTC seconds precision");
  }

  const researchDirectory = absolute(root, "research");
  const lockIdentity = acquireLock(
    root,
    transactionId,
    transactionCreatedAt,
    options,
  );
  try {
    fsyncDirectory(researchDirectory, "lock-parent-after-create", options);
    options.afterLockAcquired?.();

    const initial = captureAuthoritySnapshot(root, options.onAuthorityRead);
    const confirmed = captureAuthoritySnapshot(root, options.onAuthorityRead);
    assertSnapshotEqual(initial, confirmed, "initial capture");
    const manifest = buildManifest(initial, validationNow);
    const manifestBytes = Buffer.from(serializeCandidateManifest(manifest));
    const manifestDigest = digestCandidateManifest(manifest);
    const decisionDigest = sha256Hex(initial.sourceReviewDecisionBytes);
    const parsedRegistry = parseSourceManifestRegistryBytes(
      initial.registryBytes,
    );
    if (parsedRegistry.registry === null) {
      throwIssues("registry bytes are invalid", parsedRegistry.issues);
    }

    const registry = parsedRegistry.registry;
    const existingIndex = registry.entries.findIndex(
      (entry) => entry.manifestId === manifest.manifestId,
    );
    const manifestTarget = absolute(root, MANIFEST_PATH);

    if (existingIndex >= 0) {
      const existing = registry.entries[existingIndex]!;
      const priorBytes = Buffer.from(
        canonicalJson({
          entries: registry.entries.slice(0, existingIndex),
          schemaVersion: 1,
        }),
      );
      const expected = expectedRegistryEntry(
        manifest,
        manifestDigest,
        decisionDigest,
        priorBytes,
      );
      if (canonicalJson(existing) !== canonicalJson(expected)) {
        throw new Error(
          "registered manifest entry does not match current frozen inputs",
        );
      }
      const finalBytes = readRegularFile(manifestTarget, MANIFEST_PATH);
      if (!finalBytes.equals(manifestBytes)) {
        throw new Error(
          "registered manifest bytes do not match current frozen inputs",
        );
      }
      validateRegistryArtifacts(root, registry);
      const finalSnapshot = captureAuthoritySnapshot(
        root,
        options.onAuthorityRead,
      );
      assertSnapshotEqual(initial, finalSnapshot, "idempotent validation");
      releaseOwnedLock(root, lockIdentity, options);
      return {
        status: "already-complete",
        manifestDigest,
        registryDigest: sha256Hex(initial.registryBytes),
      };
    }

    const expectedEntry = expectedRegistryEntry(
      manifest,
      manifestDigest,
      decisionDigest,
      initial.registryBytes,
    );
    const nextRegistry: SourceManifestRegistryV1 = {
      schemaVersion: 1,
      entries: [...registry.entries, expectedEntry],
    };
    const appendIssues = validateSourceManifestRegistryAppend(
      initial.registryBytes,
      nextRegistry,
      sha256Hex(initial.registryBytes),
    );
    if (appendIssues.length > 0) {
      throwIssues("registry append validation failed", appendIssues);
    }
    validateRegistryArtifacts(root, nextRegistry, manifestBytes);

    let disposition: GenerateCandidateManifestResult["status"] = "published";
    const manifestExists = existsSync(manifestTarget);
    if (manifestExists) {
      const orphanBytes = readRegularFile(manifestTarget, MANIFEST_PATH);
      if (!orphanBytes.equals(manifestBytes)) {
        throw new Error(
          "orphan manifest bytes do not match recomputed authority bytes",
        );
      }
      disposition = "adopted-orphan";
    }

    const manifestDirectory = dirname(manifestTarget);
    const tempDirectory = absolute(root, REGISTRY_TEMP_DIRECTORY);
    ensureDirectory(manifestDirectory, 0o755);
    ensureDirectory(tempDirectory, 0o700);
    const baseName = `${manifest.manifestId}.${transactionId}`;
    const manifestTemp = join(tempDirectory, `${baseName}.manifest.tmp`);
    const registryTemp = join(tempDirectory, `${baseName}.registry.tmp`);
    if (
      dirname(manifestTemp) !== tempDirectory ||
      dirname(registryTemp) !== tempDirectory
    ) {
      throw new Error("transaction temp path escaped the bounded directory");
    }
    const ownTemps = [manifestTemp, registryTemp];
    const nextRegistryBytes = Buffer.from(canonicalJson(nextRegistry));

    if (!manifestExists) {
      writeExclusiveTemp(
        manifestTemp,
        manifestBytes,
        "manifest-temp-file",
        options,
      );
    }
    writeExclusiveTemp(
      registryTemp,
      nextRegistryBytes,
      "registry-temp-file",
      options,
    );

    const beforePublication = captureAuthoritySnapshot(
      root,
      options.onAuthorityRead,
    );
    assertSnapshotEqual(initial, beforePublication, "manifest publication");
    checkpoint("before-manifest-publication", options);

    if (!manifestExists) {
      linkSync(manifestTemp, manifestTarget);
      fsyncFilePath(manifestTarget, "manifest-target-file", options);
      fsyncDirectory(
        manifestDirectory,
        "manifest-parent-after-publish",
        options,
      );
    } else {
      fsyncFilePath(manifestTarget, "manifest-target-file", options);
      fsyncDirectory(
        manifestDirectory,
        "manifest-parent-after-publish",
        options,
      );
    }
    checkpoint("after-manifest-publication", options);

    const beforeRegistry = captureAuthoritySnapshot(
      root,
      options.onAuthorityRead,
    );
    assertSnapshotEqual(initial, beforeRegistry, "registry replacement");
    renameSync(registryTemp, absolute(root, REGISTRY_PATH));
    fsyncFilePath(
      absolute(root, REGISTRY_PATH),
      "registry-target-file",
      options,
    );
    fsyncDirectory(researchDirectory, "registry-parent-after-rename", options);
    checkpoint("after-registry-replacement", options);

    const finalManifestBytes = readRegularFile(manifestTarget, MANIFEST_PATH);
    const finalRegistryBytes = readRegularFile(
      absolute(root, REGISTRY_PATH),
      REGISTRY_PATH,
    );
    if (!finalManifestBytes.equals(manifestBytes)) {
      throw new Error("published manifest failed final byte validation");
    }
    if (!finalRegistryBytes.equals(nextRegistryBytes)) {
      throw new Error("published registry failed final byte validation");
    }
    const finalParsed = parseSourceManifestRegistryBytes(finalRegistryBytes);
    if (finalParsed.registry === null) {
      throwIssues("published registry is invalid", finalParsed.issues);
    }
    validateRegistryArtifacts(root, finalParsed.registry);

    const frozenAfterPublish = captureAuthoritySnapshot(
      root,
      options.onAuthorityRead,
    );
    const expectedFinal: AuthoritySnapshot = {
      ...initial,
      registryBytes: nextRegistryBytes,
    };
    assertSnapshotEqual(
      expectedFinal,
      frozenAfterPublish,
      "final full validation",
    );

    cleanOwnTemps(ownTemps, tempDirectory, options);
    releaseOwnedLock(root, lockIdentity, options);
    return {
      status: disposition,
      manifestDigest,
      registryDigest: sha256Hex(nextRegistryBytes),
    };
  } catch (error) {
    throw retainedLockError(root, error);
  }
}

export function runCandidateManifestGenerator(
  root: string = process.cwd(),
): number {
  try {
    const result = generateCandidateManifest(root);
    console.log(
      `research:manifest ${result.status} manifest=${result.manifestDigest} registry=${result.registryDigest}`,
    );
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(runCandidateManifestGenerator());
}
