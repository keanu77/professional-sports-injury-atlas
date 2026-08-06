/**
 * Append-only source-manifest registry contract. Source manifests are
 * immutable editions/batches; the registry resolves the exact manifest and
 * source-review-decision paths and digests for every case binding, and a
 * correction is the only way to supersede a frozen entry.
 */

import { z } from "astro/zod";
import {
  canonicalJson,
  CanonicalJsonError,
  isValidIsoDate,
  isValidUtcTimestamp,
  issue,
  parseStrictJson,
  SHA256_RE,
  sha256Hex,
  type ValidationIssue,
} from "./canonical";
import type { SourceManifestBinding } from "./case";

export const EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES =
  '{"entries":[],"schemaVersion":1}';

export const BATCH_TYPES = ["launch", "quarterly", "correction"] as const;
export type BatchType = (typeof BATCH_TYPES)[number];

const QUARTER_PERIOD_RE = /^\d{4}-q[1-4]$/;
const MANIFEST_DIR = "research/source-manifests/";
const DECISION_DIR = "research/reviews/source-batches/";

const nonEmpty = z.string().min(1);
const sha256Lower = z.string().regex(SHA256_RE);

export const supersedesReferenceSchema = z.strictObject({
  manifestId: nonEmpty,
  candidateId: nonEmpty,
  entryDigest: sha256Lower,
});
export type SupersedesReference = z.infer<typeof supersedesReferenceSchema>;

export const sourceManifestRegistryEntrySchema = z.strictObject({
  manifestId: nonEmpty,
  manifestPath: nonEmpty,
  manifestDigest: sha256Lower,
  sourceReviewDecisionPath: nonEmpty,
  sourceReviewDecisionDigest: sha256Lower,
  sourcePolicyVersion: nonEmpty,
  batchType: z.enum(BATCH_TYPES),
  period: nonEmpty,
  createdAt: nonEmpty,
  previousRegistryBytesDigest: sha256Lower,
  supersedes: z.array(supersedesReferenceSchema),
});
export type SourceManifestRegistryEntry = z.infer<
  typeof sourceManifestRegistryEntrySchema
>;

export const sourceManifestRegistrySchema = z.strictObject({
  schemaVersion: z.literal(1),
  entries: z.array(sourceManifestRegistryEntrySchema),
});
export type SourceManifestRegistryV1 = z.infer<
  typeof sourceManifestRegistrySchema
>;

export const sourceCandidateEntrySchema = z.strictObject({
  candidateId: nonEmpty,
  athleteName: nonEmpty,
  teamName: nonEmpty,
  opponentName: nonEmpty,
  sportCode: nonEmpty,
  leagueCode: nonEmpty,
  competitionCode: nonEmpty,
  season: nonEmpty,
  eventDate: nonEmpty,
  injuryCode: nonEmpty,
  confirmedDiagnosis: nonEmpty,
  videoProvider: nonEmpty,
  canonicalVideoUrl: nonEmpty,
  uploaderName: nonEmpty,
  uploaderProvenance: nonEmpty,
  durationSeconds: z.number().int().min(1),
  classicProposal: z
    .strictObject({
      proposedBy: nonEmpty,
      reason: nonEmpty,
      firstPartyDiagnosisEvidence: z.enum([
        "available",
        "documented-unavailable",
      ]),
    })
    .nullable(),
});
export type SourceCandidateEntry = z.infer<typeof sourceCandidateEntrySchema>;

export const sourceBatchManifestSchema = z.strictObject({
  schemaVersion: z.literal(1),
  manifestId: nonEmpty,
  batchType: z.enum(BATCH_TYPES),
  period: nonEmpty,
  sourcePolicyVersion: nonEmpty,
  entries: z.array(sourceCandidateEntrySchema),
});
export type SourceBatchManifest = z.infer<typeof sourceBatchManifestSchema>;

export const sourceReviewDecisionSchema = z.strictObject({
  schemaVersion: z.literal(1),
  decisionType: z.literal("source-batch-review"),
  manifestId: nonEmpty,
  manifestDigest: sha256Lower,
  decisionStatus: z.literal("approved"),
  sourcePolicyVersion: nonEmpty,
  reviewedBy: nonEmpty,
  reviewedAt: nonEmpty,
  candidateDecisions: z
    .array(
      z.strictObject({
        candidateId: nonEmpty,
        status: z.enum(["accepted", "rejected"]),
        classicProposal: z
          .strictObject({
            proposedBy: nonEmpty,
            firstPartyDiagnosisEvidence: z.enum([
              "available",
              "documented-unavailable",
            ]),
          })
          .nullable(),
      }),
    )
    .min(1),
});
export type SourceReviewDecision = z.infer<typeof sourceReviewDecisionSchema>;

export interface ResolvedSourceManifestBinding {
  entry: SourceManifestRegistryEntry;
  candidateId: string;
  superseded: boolean;
  supersededBy: SupersedesReference | null;
}

export class SourceBindingError extends Error {}

function compareSupersedes(
  a: SupersedesReference,
  b: SupersedesReference,
): number {
  if (a.manifestId !== b.manifestId)
    return a.manifestId < b.manifestId ? -1 : 1;
  if (a.candidateId !== b.candidateId) {
    return a.candidateId < b.candidateId ? -1 : 1;
  }
  if (a.entryDigest !== b.entryDigest)
    return a.entryDigest < b.entryDigest ? -1 : 1;
  return 0;
}

/** Validates the parsed registry object: shape, ordering, uniqueness, rules. */
export function validateSourceManifestRegistry(
  registry: unknown,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const parsed = sourceManifestRegistrySchema.safeParse(registry);
  if (!parsed.success) {
    for (const zodIssue of parsed.error.issues) {
      issues.push(
        issue("registry-schema", zodIssue.path.join("."), zodIssue.message),
      );
    }
    return issues;
  }
  const entries = parsed.data.entries;

  const seen = {
    manifestIds: new Set<string>(),
    manifestPaths: new Set<string>(),
    manifestDigests: new Set<string>(),
    decisionPaths: new Set<string>(),
    decisionDigests: new Set<string>(),
  };
  const supersededRefs = new Map<string, string>();

  entries.forEach((entry, index) => {
    const path = `entries[${index}]`;
    if (!isValidUtcTimestamp(entry.createdAt)) {
      issues.push(
        issue("registry-schema", `${path}.createdAt`, "invalid UTC timestamp"),
      );
    }
    if (!entry.manifestPath.startsWith(MANIFEST_DIR)) {
      issues.push(
        issue(
          "registry-path",
          `${path}.manifestPath`,
          `manifest path must be under ${MANIFEST_DIR}`,
        ),
      );
    }
    if (!entry.sourceReviewDecisionPath.startsWith(DECISION_DIR)) {
      issues.push(
        issue(
          "registry-path",
          `${path}.sourceReviewDecisionPath`,
          `decision path must be under ${DECISION_DIR}`,
        ),
      );
    }
    for (const [key, value] of [
      ["manifestIds", entry.manifestId],
      ["manifestPaths", entry.manifestPath],
      ["manifestDigests", entry.manifestDigest],
      ["decisionPaths", entry.sourceReviewDecisionPath],
      ["decisionDigests", entry.sourceReviewDecisionDigest],
    ] as const) {
      const bucket = seen[key];
      if (bucket.has(value)) {
        issues.push(
          issue(
            "registry-duplicate",
            path,
            `duplicate registry value ${value}`,
          ),
        );
      }
      bucket.add(value);
    }

    if (entry.batchType === "quarterly") {
      if (!QUARTER_PERIOD_RE.test(entry.period)) {
        issues.push(
          issue(
            "registry-period",
            `${path}.period`,
            "quarterly period must be YYYY-qN",
          ),
        );
      }
    } else if (!isValidIsoDate(entry.period)) {
      issues.push(
        issue(
          "registry-period",
          `${path}.period`,
          "launch/correction period must be an ISO date",
        ),
      );
    }

    if (entry.batchType === "correction") {
      if (entry.supersedes.length === 0) {
        issues.push(
          issue(
            "registry-supersedes",
            `${path}.supersedes`,
            "a correction batch must supersede at least one prior entry",
          ),
        );
      }
    } else if (entry.supersedes.length > 0) {
      issues.push(
        issue(
          "registry-supersedes",
          `${path}.supersedes`,
          `${entry.batchType} batches must not supersede prior entries`,
        ),
      );
    }

    const priorIds = new Set(entries.slice(0, index).map((e) => e.manifestId));
    entry.supersedes.forEach((reference, refIndex) => {
      const refPath = `${path}.supersedes[${refIndex}]`;
      if (!priorIds.has(reference.manifestId)) {
        issues.push(
          issue(
            "registry-supersedes",
            refPath,
            `supersedes reference does not resolve to an older entry (${reference.manifestId})`,
          ),
        );
      }
      if (refIndex > 0) {
        const previous = entry.supersedes[refIndex - 1] as SupersedesReference;
        if (compareSupersedes(previous, reference) >= 0) {
          issues.push(
            issue(
              "registry-supersedes",
              refPath,
              "supersedes references must be strictly sorted",
            ),
          );
        }
      }
      const refKey = `${reference.manifestId} ${reference.candidateId}`;
      const existing = supersededRefs.get(refKey);
      if (existing !== undefined) {
        issues.push(
          issue(
            "registry-supersedes-duplicate",
            refPath,
            `prior entry ${reference.candidateId} is superseded more than once`,
          ),
        );
      }
      supersededRefs.set(refKey, entry.manifestId);
    });

    if (index === 0) {
      const emptyDigest = sha256Hex(EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES);
      if (entry.previousRegistryBytesDigest !== emptyDigest) {
        issues.push(
          issue(
            "registry-chain",
            `${path}.previousRegistryBytesDigest`,
            "first entry must anchor the canonical empty-registry bytes digest",
          ),
        );
      }
    }
    if (index > 0) {
      const previous = entries[index - 1] as SourceManifestRegistryEntry;
      const orderKeyPrev = `${previous.createdAt} ${previous.manifestId}`;
      const orderKeyCurrent = `${entry.createdAt} ${entry.manifestId}`;
      if (orderKeyPrev >= orderKeyCurrent) {
        issues.push(
          issue(
            "registry-order",
            path,
            "entries must be sorted by createdAt then manifestId",
          ),
        );
      }
    }
  });

  return issues;
}

export interface ParsedRegistryBytes {
  registry: SourceManifestRegistryV1 | null;
  issues: ValidationIssue[];
}

/** Duplicate-key-detecting strict canonical-bytes parse of a registry file. */
export function parseSourceManifestRegistryBytes(
  bytes: Uint8Array,
): ParsedRegistryBytes {
  const text = Buffer.from(bytes).toString("utf8");
  let parsed: unknown;
  try {
    parsed = parseStrictJson(text);
  } catch (error) {
    return {
      registry: null,
      issues: [
        issue(
          "registry-bytes",
          "",
          error instanceof CanonicalJsonError
            ? error.message
            : "registry bytes are not strict JSON",
        ),
      ],
    };
  }
  if (canonicalJson(parsed) !== text) {
    return {
      registry: null,
      issues: [
        issue(
          "registry-bytes",
          "",
          "registry bytes are not canonical compact JSON",
        ),
      ],
    };
  }
  const issues = validateSourceManifestRegistry(parsed);
  if (issues.length > 0) return { registry: null, issues };
  return { registry: parsed as SourceManifestRegistryV1, issues: [] };
}

/**
 * Proves append-only continuity: the exact trusted prior bytes hash to the
 * expected digest, remain a byte-identical canonical prefix, and exactly one
 * terminal entry is appended whose anchor equals that prior-bytes digest.
 */
export function validateSourceManifestRegistryAppend(
  previousCanonicalBytes: Uint8Array,
  nextRegistry: SourceManifestRegistryV1,
  expectedPreviousBytesDigest: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const measured = sha256Hex(previousCanonicalBytes);
  if (measured !== expectedPreviousBytesDigest) {
    issues.push(
      issue(
        "registry-append-prev-digest",
        "",
        `previous registry bytes hash ${measured} does not equal the trusted digest ${expectedPreviousBytesDigest}`,
      ),
    );
    return issues;
  }
  const parsedPrevious = parseSourceManifestRegistryBytes(
    previousCanonicalBytes,
  );
  if (parsedPrevious.registry === null) {
    return [...issues, ...parsedPrevious.issues];
  }
  const nextIssues = validateSourceManifestRegistry(nextRegistry);
  if (nextIssues.length > 0) return [...issues, ...nextIssues];

  const previousEntries = parsedPrevious.registry.entries;
  const nextEntries = nextRegistry.entries;
  if (nextEntries.length !== previousEntries.length + 1) {
    issues.push(
      issue(
        "registry-append-count",
        "entries",
        `exactly one entry must be appended (${previousEntries.length} -> ${nextEntries.length})`,
      ),
    );
    return issues;
  }
  for (let i = 0; i < previousEntries.length; i += 1) {
    if (canonicalJson(previousEntries[i]) !== canonicalJson(nextEntries[i])) {
      issues.push(
        issue(
          "registry-append-prefix",
          `entries[${i}]`,
          "previously finalized entries must remain a byte-identical prefix",
        ),
      );
    }
  }
  const terminal = nextEntries[
    nextEntries.length - 1
  ] as SourceManifestRegistryEntry;
  if (terminal.previousRegistryBytesDigest !== expectedPreviousBytesDigest) {
    issues.push(
      issue(
        "registry-append-terminal",
        `entries[${nextEntries.length - 1}].previousRegistryBytesDigest`,
        "appended entry must anchor the exact prior registry bytes digest",
      ),
    );
  }
  return issues;
}

export type RegistryArtifactLoader = (path: string) => Uint8Array;

interface ActiveEntryRecord {
  manifestId: string;
  entryDigest: string;
  identityKey: string;
  canonicalVideoUrl: string;
}

function parseManifestArtifact(
  entry: SourceManifestRegistryEntry,
  loadFile: RegistryArtifactLoader,
  issues: ValidationIssue[],
): SourceBatchManifest | null {
  let bytes: Uint8Array;
  try {
    bytes = loadFile(entry.manifestPath);
  } catch {
    issues.push(
      issue(
        "artifact-missing",
        entry.manifestPath,
        "manifest artifact is missing at the registered path",
      ),
    );
    return null;
  }
  if (sha256Hex(bytes) !== entry.manifestDigest) {
    issues.push(
      issue(
        "artifact-digest",
        entry.manifestPath,
        "manifest bytes do not match the registered digest",
      ),
    );
    return null;
  }
  let parsed: unknown;
  try {
    parsed = parseStrictJson(Buffer.from(bytes).toString("utf8"));
  } catch {
    issues.push(
      issue(
        "artifact-schema",
        entry.manifestPath,
        "manifest is not strict JSON",
      ),
    );
    return null;
  }
  const manifest = sourceBatchManifestSchema.safeParse(parsed);
  if (!manifest.success) {
    issues.push(
      issue("artifact-schema", entry.manifestPath, "manifest shape is invalid"),
    );
    return null;
  }
  if (
    manifest.data.manifestId !== entry.manifestId ||
    manifest.data.batchType !== entry.batchType ||
    manifest.data.period !== entry.period ||
    manifest.data.sourcePolicyVersion !== entry.sourcePolicyVersion
  ) {
    issues.push(
      issue(
        "artifact-mismatch",
        entry.manifestPath,
        "manifest header does not match its registry entry",
      ),
    );
    return null;
  }
  return manifest.data;
}

function parseDecisionArtifact(
  entry: SourceManifestRegistryEntry,
  loadFile: RegistryArtifactLoader,
  issues: ValidationIssue[],
): SourceReviewDecision | null {
  let bytes: Uint8Array;
  try {
    bytes = loadFile(entry.sourceReviewDecisionPath);
  } catch {
    issues.push(
      issue(
        "artifact-missing",
        entry.sourceReviewDecisionPath,
        "source-review decision artifact is missing at the registered path",
      ),
    );
    return null;
  }
  if (sha256Hex(bytes) !== entry.sourceReviewDecisionDigest) {
    issues.push(
      issue(
        "artifact-digest",
        entry.sourceReviewDecisionPath,
        "decision bytes do not match the registered digest",
      ),
    );
    return null;
  }
  let parsed: unknown;
  try {
    parsed = parseStrictJson(Buffer.from(bytes).toString("utf8"));
  } catch {
    issues.push(
      issue(
        "artifact-schema",
        entry.sourceReviewDecisionPath,
        "decision is not strict JSON",
      ),
    );
    return null;
  }
  const decision = sourceReviewDecisionSchema.safeParse(parsed);
  if (!decision.success) {
    issues.push(
      issue(
        "artifact-schema",
        entry.sourceReviewDecisionPath,
        "decision shape is invalid",
      ),
    );
    return null;
  }
  if (
    decision.data.manifestId !== entry.manifestId ||
    decision.data.manifestDigest !== entry.manifestDigest ||
    decision.data.sourcePolicyVersion !== entry.sourcePolicyVersion
  ) {
    issues.push(
      issue(
        "artifact-mismatch",
        entry.sourceReviewDecisionPath,
        "decision does not match its registry entry",
      ),
    );
    return null;
  }
  return decision.data;
}

/**
 * Loads every registered manifest/decision, verifies digests, and computes
 * the active source-entry set. Active candidate IDs, event identities, and
 * canonical video URLs are globally unique; only an exact correction may move
 * a prior entry out of the active set and admit its replacement.
 */
export function validateSourceManifestRegistryArtifacts(
  registry: SourceManifestRegistryV1,
  loadFile: RegistryArtifactLoader,
): ValidationIssue[] {
  const issues = validateSourceManifestRegistry(registry);
  if (issues.length > 0) return issues;

  const active = new Map<string, ActiveEntryRecord>();

  for (const entry of registry.entries) {
    const manifest = parseManifestArtifact(entry, loadFile, issues);
    const decision = parseDecisionArtifact(entry, loadFile, issues);
    if (manifest === null || decision === null) continue;

    const decisionByCandidate = new Map(
      decision.candidateDecisions.map((candidate) => [
        candidate.candidateId,
        candidate,
      ]),
    );

    if (entry.batchType === "correction") {
      const replacementIds = new Set(
        manifest.entries.map((candidate) => candidate.candidateId),
      );
      for (const reference of entry.supersedes) {
        const current = active.get(reference.candidateId);
        if (
          current === undefined ||
          current.manifestId !== reference.manifestId ||
          current.entryDigest !== reference.entryDigest
        ) {
          issues.push(
            issue(
              "registry-supersedes",
              `${entry.manifestId}.supersedes`,
              `supersedes reference for ${reference.candidateId} does not match the active entry`,
            ),
          );
          continue;
        }
        active.delete(reference.candidateId);
        const replacements = manifest.entries.filter(
          (candidate) => candidate.candidateId === reference.candidateId,
        );
        if (replacements.length !== 1) {
          issues.push(
            issue(
              "correction-replacement",
              `${entry.manifestId}.entries`,
              `a correction must contain exactly one replacement entry for ${reference.candidateId}`,
            ),
          );
        }
      }
      for (const candidate of manifest.entries) {
        if (!replacementIds.has(candidate.candidateId)) continue;
        if (
          !entry.supersedes.some(
            (reference) => reference.candidateId === candidate.candidateId,
          )
        ) {
          issues.push(
            issue(
              "correction-replacement",
              `${entry.manifestId}.entries`,
              `correction entry ${candidate.candidateId} has no matching supersedes reference`,
            ),
          );
        }
      }
    }

    for (const candidate of manifest.entries) {
      const candidateDecision = decisionByCandidate.get(candidate.candidateId);
      if (candidateDecision === undefined) {
        issues.push(
          issue(
            "artifact-mismatch",
            `${entry.manifestId}.${candidate.candidateId}`,
            "manifest entry has no matching candidate decision",
          ),
        );
        continue;
      }
      if (candidateDecision.status !== "accepted") continue;
      const identityKey = [
        candidate.athleteName,
        candidate.eventDate,
        candidate.opponentName,
        candidate.competitionCode,
      ].join(" ");
      if (active.has(candidate.candidateId)) {
        issues.push(
          issue(
            "active-duplicate-candidate",
            `${entry.manifestId}.${candidate.candidateId}`,
            "candidate ID already exists in the active source-entry set",
          ),
        );
        continue;
      }
      for (const record of active.values()) {
        if (record.identityKey === identityKey) {
          issues.push(
            issue(
              "active-duplicate-identity",
              `${entry.manifestId}.${candidate.candidateId}`,
              "event identity already exists in the active source-entry set",
            ),
          );
        }
        if (record.canonicalVideoUrl === candidate.canonicalVideoUrl) {
          issues.push(
            issue(
              "active-duplicate-video-url",
              `${entry.manifestId}.${candidate.candidateId}`,
              "canonical video URL already exists in the active source-entry set",
            ),
          );
        }
      }
      active.set(candidate.candidateId, {
        manifestId: entry.manifestId,
        entryDigest: sha256Hex(canonicalJson(candidate)),
        identityKey,
        canonicalVideoUrl: candidate.canonicalVideoUrl,
      });
    }
  }

  return issues;
}

function resolveBinding(
  registry: SourceManifestRegistryV1,
  binding: SourceManifestBinding,
): ResolvedSourceManifestBinding {
  const entry = registry.entries.find(
    (candidate) => candidate.manifestId === binding.manifestId,
  );
  if (entry === undefined) {
    throw new SourceBindingError(
      `binding manifest ${binding.manifestId} is not registered`,
    );
  }
  if (
    entry.manifestDigest !== binding.manifestDigest ||
    entry.sourceReviewDecisionDigest !== binding.sourceReviewDecisionDigest ||
    entry.sourcePolicyVersion !== binding.sourcePolicyVersion
  ) {
    throw new SourceBindingError(
      `binding for ${binding.candidateId} is stale against registry entry ${entry.manifestId}`,
    );
  }
  let supersededBy: SupersedesReference | null = null;
  for (const later of registry.entries) {
    for (const reference of later.supersedes) {
      if (
        reference.manifestId === binding.manifestId &&
        reference.candidateId === binding.candidateId
      ) {
        supersededBy = reference;
      }
    }
  }
  return {
    entry,
    candidateId: binding.candidateId,
    superseded: supersededBy !== null,
    supersededBy,
  };
}

/**
 * Resolves only active entries and fails closed on a superseded origin.
 * Selectors and new approval decisions must use this resolver.
 */
export function resolveSourceManifestBinding(
  registry: SourceManifestRegistryV1,
  binding: SourceManifestBinding,
): ResolvedSourceManifestBinding {
  const resolved = resolveBinding(registry, binding);
  if (resolved.superseded) {
    throw new SourceBindingError(
      `binding for ${binding.candidateId} resolves to a superseded origin entry`,
    );
  }
  return resolved;
}

/**
 * Audit-only resolver: may resolve an immutable superseded entry only for
 * release-history validation or a bounded retired/unavailable audit record.
 * Selectors and new approval decisions are forbidden from calling it.
 */
export function resolveHistoricalSourceManifestBinding(
  registry: SourceManifestRegistryV1,
  binding: SourceManifestBinding,
): ResolvedSourceManifestBinding {
  return resolveBinding(registry, binding);
}
