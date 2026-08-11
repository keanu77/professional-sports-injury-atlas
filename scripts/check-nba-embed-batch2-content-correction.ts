/**
 * Decision 8 content guard for the second NBA embed correction, extended by
 * Decision 11's exact Anthony Edwards playback-state remediation.
 *
 * The four corrected cases are compared with the exact pre-correction commit
 * after removing only the fields Decision 8 allows to change. Every other
 * case except the single Decision 11 target and every injury overview is
 * compared byte-for-byte. The Decision 11 target gets a three-field
 * projection with an unchanged clinical digest. The dependent Q3
 * record gets a separate, exact allowlist for four digest pairs and one audit
 * timestamp.
 */

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";

import {
  computeCaseContentDigest,
  computeVideoIdentityDigest,
} from "../src/lib/cases/digest";
import {
  canonicalJson,
  issue,
  parseStrictJson,
  type ValidationIssue,
} from "../src/lib/contracts/canonical";
import { caseSchema, type InjuryCase } from "../src/lib/contracts/case";
import {
  updateSchema,
  type QuarterlyUpdate,
} from "../src/lib/contracts/update";

export const NBA_EMBED_BATCH2_BASELINE =
  "610f420515f01f8e84f49ed24395c9f5774cdc40";
export const NBA_EMBED_BATCH2_MANIFEST_ID = "NBA-SOURCE-2026-08-10-001";
export const NBA_EMBED_BATCH2_MANIFEST_DIGEST =
  "bd1121d29e6ffda0122d920b6588e378dd2a1d011fa602689ccefa60c2bf86ff";
export const NBA_EMBED_BATCH2_SOURCE_DECISION_DIGEST =
  "d5b934a3f450b4c3d93bdcd396dc032abe690bb11f1638095ad815e38d3c2ca7";
export const DECISION_8_REVIEWED_AT = "2026-08-10T11:36:08Z";
export const DECISION_11_P0_CASE_PATH =
  "src/content/cases/anthony-edwards-ankle-sprain-2023.json";
export const DECISION_11_P0_EMBED_CHECKED_AT = "2026-08-11T17:29:36Z";
export const DECISION_11_P0_NOTES =
  "2026-08-11 台灣重查：availableCountries 60 國不含 TW，playabilityStatus=UNPLAYABLE，playableInEmbed 缺失；不下載媒體，保留同一原始網址作外部連結。";

export interface CorrectedCaseExpectation {
  path: string;
  caseId: string;
  candidateId: string;
  entryDigest: string;
  canonicalUrl: string;
  uploaderName: string;
  captionStatus: "available" | "unavailable";
  durationSeconds: number;
  oldReviewedContentDigest: string;
}

export const NBA_EMBED_BATCH2_CORRECTED_CASES = [
  {
    path: "src/content/cases/anfernee-simons-ankle-sprain-2023.json",
    caseId: "CASE-NBAANKLE-2023-004",
    candidateId: "CAND-NBA-ANKLE-2023-004",
    entryDigest:
      "739d6b2d68a10614e8a09af958868c46e7179dabe98e5cafdd2653c9d0603f49",
    canonicalUrl: "https://www.youtube.com/watch?v=8TIJGIRP634",
    uploaderName: "NBA on ESPN",
    captionStatus: "available",
    durationSeconds: 86,
    oldReviewedContentDigest:
      "0958fd8fe550da13460c3cbe80fc7ff5783cc7d9b3188785174bba6314633988",
  },
  {
    path: "src/content/cases/jayson-tatum-achilles-rupture-2025.json",
    caseId: "CASE-NBAACHILLES-2025-016",
    candidateId: "CAND-NBA-ACHILLES-2025-016",
    entryDigest:
      "fa494db9042435914774946b0524a3c51d5249ca57c88dbb777bb83b3bc2d71a",
    canonicalUrl: "https://www.youtube.com/watch?v=xSUKd03LJwE",
    uploaderName: "NBA on ESPN",
    captionStatus: "unavailable",
    durationSeconds: 22,
    oldReviewedContentDigest:
      "0d040d5f56f23ecb88ca75e0d83f70317e21aeb7a340c24f55c4597251dec953",
  },
  {
    path: "src/content/cases/lamelo-ball-ankle-sprain-2025.json",
    caseId: "CASE-NBAANKLE-2025-002",
    candidateId: "CAND-NBA-ANKLE-2025-002",
    entryDigest:
      "24f6651056db5d64fe7735fb9e9403c3075399ca1c9923a5fe702d9755ee4488",
    canonicalUrl: "https://www.youtube.com/watch?v=zZdndTqOexc",
    uploaderName: "NBA on ESPN",
    captionStatus: "available",
    durationSeconds: 47,
    oldReviewedContentDigest:
      "b3389d4d64cd4be54c8f1ee333049da667a9d9f3ca7f59e4bbebeda66e4b4227",
  },
  {
    path: "src/content/cases/tyrese-haliburton-achilles-rupture-2025.json",
    caseId: "CASE-NBAACHILLES-2025-017",
    candidateId: "CAND-NBA-ACHILLES-2025-017",
    entryDigest:
      "848910fc37f9aa8270f879730a13c5d32c9e674cc790feb2d68a52d598f80e94",
    canonicalUrl: "https://www.youtube.com/watch?v=azQpbyDBktk",
    uploaderName: "ESPN",
    captionStatus: "unavailable",
    durationSeconds: 52,
    oldReviewedContentDigest:
      "c6aee02cae3858f932185cf9135ccb689d0b3fecfd7449a5390ff3914bddee6f",
  },
] as const satisfies readonly CorrectedCaseExpectation[];

type MutableJson = Record<string, any>;

const VIDEO_MUTATION_KEYS = [
  "provider",
  "canonicalUrl",
  "uploaderName",
  "uploaderProvenance",
  "embedStatus",
  "embedCheckedAt",
  "durationSeconds",
  "startSeconds",
  "endSeconds",
  "fallbackUrl",
  "sourceProvenanceVerification",
  "captionStatus",
  "captionCheckedAt",
] as const;

const VIDEO_SOURCE_MUTATION_KEYS = [
  "title",
  "publisher",
  "independenceGroup",
  "url",
  "publishedAt",
  "accessedAt",
] as const;

function cloneJson(value: unknown): MutableJson {
  return structuredClone(value) as MutableJson;
}

/** Remove only Decision 8's allowlisted case fields. */
export function decision8CaseProjection(record: unknown): unknown {
  const projected = cloneJson(record);
  delete projected.sourceManifestBinding;

  for (const key of VIDEO_MUTATION_KEYS) delete projected.video[key];
  for (const segment of projected.video.segments as MutableJson[]) {
    delete segment.startSeconds;
    delete segment.endSeconds;
  }

  const videoSources = (projected.sources as MutableJson[]).filter(
    (source) => source.type === "video-original",
  );
  for (const source of videoSources) {
    for (const key of VIDEO_SOURCE_MUTATION_KEYS) delete source[key];
  }

  delete projected.review.reviewedAt;
  delete projected.review.reviewedContentDigest;
  return projected;
}

/** Remove only the four dependent digest pairs and Decision 8 audit time. */
export function decision8Q3Projection(record: unknown): unknown {
  const projected = cloneJson(record);
  const caseIds = new Set(
    NBA_EMBED_BATCH2_CORRECTED_CASES.map((entry) => entry.caseId),
  );
  for (const entry of projected.addedCases as MutableJson[]) {
    if (!caseIds.has(entry.caseId)) continue;
    delete entry.currentClinicalDigest;
    delete entry.currentVideoSourceDigest;
  }
  delete projected.audit.updatedAt;
  return projected;
}

/** Remove only the three presentation-state fields authorized by Decision 11 P0-1. */
export function decision11P0CaseProjection(record: unknown): unknown {
  const projected = cloneJson(record);
  delete projected.video.embedStatus;
  delete projected.video.embedCheckedAt;
  delete projected.video.sourceProvenanceVerification.notes;
  return projected;
}

function projectionIssue(
  code: string,
  path: string,
  current: unknown,
  baseline: unknown,
  message: string,
): ValidationIssue[] {
  return canonicalJson(current) === canonicalJson(baseline)
    ? []
    : [issue(code, path, message)];
}

/**
 * Allows Anthony Edwards' current playback state to fail closed while proving
 * that video identity, sources, clinical prose, and the approved clinical
 * digest remain identical to the pre-Decision-8 baseline.
 */
export function validateDecision11P0Case(
  current: InjuryCase,
  baseline: InjuryCase,
  path = DECISION_11_P0_CASE_PATH,
): ValidationIssue[] {
  const issues = projectionIssue(
    "decision11-p0-case-projection-drift",
    path,
    decision11P0CaseProjection(current),
    decision11P0CaseProjection(baseline),
    `content outside the three Decision 11 P0-1 playback-state fields drifted from ${NBA_EMBED_BATCH2_BASELINE}`,
  );
  const exactFacts: Array<[string, unknown, unknown]> = [
    ["video.embedStatus", current.video.embedStatus, "external-link-only"],
    [
      "video.embedCheckedAt",
      current.video.embedCheckedAt,
      DECISION_11_P0_EMBED_CHECKED_AT,
    ],
    [
      "video.sourceProvenanceVerification.notes",
      current.video.sourceProvenanceVerification.notes,
      DECISION_11_P0_NOTES,
    ],
  ];
  for (const [field, actual, expected] of exactFacts) {
    if (canonicalJson(actual) !== canonicalJson(expected)) {
      issues.push(
        issue(
          "decision11-p0-case-fact",
          `${path}.${field}`,
          `expected ${String(expected)}, received ${String(actual)}`,
        ),
      );
    }
  }

  const currentClinicalDigest = computeCaseContentDigest(current);
  const baselineClinicalDigest = computeCaseContentDigest(baseline);
  if (
    currentClinicalDigest !== baselineClinicalDigest ||
    current.review.reviewedContentDigest !== currentClinicalDigest
  ) {
    issues.push(
      issue(
        "decision11-p0-clinical-digest",
        `${path}.review.reviewedContentDigest`,
        "Decision 11 playback remediation must not change or stale the approved clinical payload",
      ),
    );
  }
  return issues;
}

export function validateDecision8CorrectedCase(
  current: InjuryCase,
  baseline: InjuryCase,
  expected: CorrectedCaseExpectation,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  issues.push(
    ...projectionIssue(
      "decision8-case-projection-drift",
      expected.path,
      decision8CaseProjection(current),
      decision8CaseProjection(baseline),
      `non-allowlisted case content drifted from ${NBA_EMBED_BATCH2_BASELINE}`,
    ),
  );

  const exactFacts: Array<[string, unknown, unknown]> = [
    ["id", current.id, expected.caseId],
    [
      "sourceManifestBinding.candidateId",
      current.sourceManifestBinding.candidateId,
      expected.candidateId,
    ],
    [
      "sourceManifestBinding.manifestId",
      current.sourceManifestBinding.manifestId,
      NBA_EMBED_BATCH2_MANIFEST_ID,
    ],
    [
      "sourceManifestBinding.manifestDigest",
      current.sourceManifestBinding.manifestDigest,
      NBA_EMBED_BATCH2_MANIFEST_DIGEST,
    ],
    [
      "sourceManifestBinding.entryDigest",
      current.sourceManifestBinding.entryDigest,
      expected.entryDigest,
    ],
    [
      "sourceManifestBinding.sourceReviewDecisionDigest",
      current.sourceManifestBinding.sourceReviewDecisionDigest,
      NBA_EMBED_BATCH2_SOURCE_DECISION_DIGEST,
    ],
    [
      "sourceManifestBinding.sourcePolicyVersion",
      current.sourceManifestBinding.sourcePolicyVersion,
      "nba-v2",
    ],
    ["video.provider", current.video.provider, "youtube"],
    ["video.canonicalUrl", current.video.canonicalUrl, expected.canonicalUrl],
    ["video.fallbackUrl", current.video.fallbackUrl, expected.canonicalUrl],
    ["video.uploaderName", current.video.uploaderName, expected.uploaderName],
    [
      "video.uploaderProvenance",
      current.video.uploaderProvenance,
      "broadcaster-rightsholder",
    ],
    ["video.embedStatus", current.video.embedStatus, "verified"],
    [
      "video.captionStatus",
      current.video.captionStatus,
      expected.captionStatus,
    ],
    [
      "video.durationSeconds",
      current.video.durationSeconds,
      expected.durationSeconds,
    ],
    [
      "video.sourceProvenanceVerification.status",
      current.video.sourceProvenanceVerification.status,
      "verified",
    ],
    [
      "video.sourceProvenanceVerification.verifiedPolicyVersion",
      current.video.sourceProvenanceVerification.verifiedPolicyVersion,
      "nba-v2",
    ],
    [
      "video.publicRightsReview.status",
      current.video.publicRightsReview.status,
      "not-requested",
    ],
    ["review.status", current.review.status, "approved"],
    ["review.reviewerName", current.review.reviewerName, "吳易澄醫師"],
    [
      "review.reviewerQualification",
      current.review.reviewerQualification,
      "復健科專科醫師",
    ],
    ["review.reviewedAt", current.review.reviewedAt, DECISION_8_REVIEWED_AT],
  ];
  for (const [path, actual, wanted] of exactFacts) {
    if (canonicalJson(actual) !== canonicalJson(wanted)) {
      issues.push(
        issue(
          "decision8-case-fact",
          `${expected.path}.${path}`,
          `expected ${String(wanted)}, received ${String(actual)}`,
        ),
      );
    }
  }

  const identityDigest = computeVideoIdentityDigest(current);
  if (
    current.video.sourceProvenanceVerification.reviewedVideoIdentityDigest !==
    identityDigest
  ) {
    issues.push(
      issue(
        "decision8-video-identity-digest",
        `${expected.path}.video.sourceProvenanceVerification.reviewedVideoIdentityDigest`,
        "stored video identity digest does not match the corrected video payload",
      ),
    );
  }

  const clinicalDigest = computeCaseContentDigest(current);
  if (current.review.reviewedContentDigest !== clinicalDigest) {
    issues.push(
      issue(
        "decision8-reviewed-content-digest",
        `${expected.path}.review.reviewedContentDigest`,
        "stored medical-review digest does not match the corrected final case payload",
      ),
    );
  }
  if (
    current.review.reviewedContentDigest === expected.oldReviewedContentDigest
  ) {
    issues.push(
      issue(
        "decision8-stale-reviewed-content-digest",
        `${expected.path}.review.reviewedContentDigest`,
        "the pre-correction reviewedContentDigest was copied forward",
      ),
    );
  }

  const windows = [
    {
      path: "video",
      startSeconds: current.video.startSeconds,
      endSeconds: current.video.endSeconds,
    },
    ...current.video.segments.map((segment, index) => ({
      path: `video.segments[${index}]`,
      startSeconds: segment.startSeconds,
      endSeconds: segment.endSeconds,
    })),
  ];
  for (const window of windows) {
    if (
      window.startSeconds < 0 ||
      window.endSeconds <= window.startSeconds ||
      window.endSeconds > current.video.durationSeconds
    ) {
      issues.push(
        issue(
          "decision8-video-window",
          `${expected.path}.${window.path}`,
          "the corrected numeric window must be non-empty and bounded by durationSeconds",
        ),
      );
    }
  }

  const videoSources = current.sources.filter(
    (source) => source.type === "video-original",
  );
  if (
    videoSources.length !== 1 ||
    videoSources[0]?.url !== expected.canonicalUrl
  ) {
    issues.push(
      issue(
        "decision8-video-source",
        `${expected.path}.sources`,
        "the single video-original source must describe the selected YouTube primary",
      ),
    );
  }

  return issues;
}

export function validateDecision8Q3(
  current: QuarterlyUpdate,
  baseline: QuarterlyUpdate,
  cases: ReadonlyMap<string, InjuryCase>,
  path = "src/content/updates/2026-q3.json",
): ValidationIssue[] {
  const issues = projectionIssue(
    "decision8-q3-projection-drift",
    path,
    decision8Q3Projection(current),
    decision8Q3Projection(baseline),
    `non-allowlisted Q3 content drifted from ${NBA_EMBED_BATCH2_BASELINE}`,
  );
  if (current.audit.updatedAt !== DECISION_8_REVIEWED_AT) {
    issues.push(
      issue(
        "decision8-q3-audit-time",
        `${path}.audit.updatedAt`,
        `expected ${DECISION_8_REVIEWED_AT}`,
      ),
    );
  }

  const addedById = new Map(
    current.addedCases.map((entry) => [entry.caseId, entry]),
  );
  for (const expected of NBA_EMBED_BATCH2_CORRECTED_CASES) {
    const record = cases.get(expected.caseId);
    const entry = addedById.get(expected.caseId);
    if (record === undefined || entry === undefined) {
      issues.push(
        issue(
          "decision8-q3-target",
          `${path}.addedCases`,
          `missing corrected case pointer ${expected.caseId}`,
        ),
      );
      continue;
    }
    if (entry.currentClinicalDigest !== computeCaseContentDigest(record)) {
      issues.push(
        issue(
          "decision8-q3-clinical-digest",
          `${path}.addedCases.${expected.caseId}.currentClinicalDigest`,
          "Q3 clinical pointer does not match the corrected case payload",
        ),
      );
    }
    if (entry.currentVideoSourceDigest !== computeVideoIdentityDigest(record)) {
      issues.push(
        issue(
          "decision8-q3-video-digest",
          `${path}.addedCases.${expected.caseId}.currentVideoSourceDigest`,
          "Q3 legacy-named video pointer does not match the corrected video identity",
        ),
      );
    }
  }
  return issues;
}

function gitBytes(root: string, path: string): Buffer {
  return execFileSync("git", ["show", `${NBA_EMBED_BATCH2_BASELINE}:${path}`], {
    cwd: root,
    encoding: "buffer",
    maxBuffer: 16 * 1024 * 1024,
  });
}

function baselineJson(root: string, path: string): unknown {
  return parseStrictJson(gitBytes(root, path).toString("utf8"));
}

function jsonNames(root: string, directory: string): string[] {
  return readdirSync(join(root, directory))
    .filter((name) => name.endsWith(".json"))
    .sort();
}

function baselineJsonNames(root: string, directory: string): string[] {
  return execFileSync(
    "git",
    ["ls-tree", "--name-only", `${NBA_EMBED_BATCH2_BASELINE}:${directory}`],
    { cwd: root, encoding: "utf8" },
  )
    .split("\n")
    .filter((name) => name.endsWith(".json"))
    .sort();
}

export interface Decision8ContentGuardResult {
  issues: ValidationIssue[];
  correctedCaseCount: number;
  rightsRemediatedCaseCount: number;
  unchangedCaseCount: number;
  unchangedOverviewCount: number;
}

export function checkNbaEmbedBatch2ContentCorrection(
  root = process.cwd(),
): Decision8ContentGuardResult {
  const issues: ValidationIssue[] = [];
  const casesDirectory = "src/content/cases";
  const overviewsDirectory = "src/content/injuries";
  const expectedPaths = new Set<string>(
    NBA_EMBED_BATCH2_CORRECTED_CASES.map((entry) => entry.path),
  );
  let unchangedCaseCount = 0;
  let rightsRemediatedCaseCount = 0;
  let unchangedOverviewCount = 0;

  try {
    const currentNames = jsonNames(root, casesDirectory);
    const baselineNames = baselineJsonNames(root, casesDirectory);
    issues.push(
      ...projectionIssue(
        "decision8-case-file-set",
        casesDirectory,
        currentNames,
        baselineNames,
        "case JSON file set drifted from the Decision 8 baseline",
      ),
    );

    for (const name of baselineNames) {
      const path = `${casesDirectory}/${name}`;
      if (expectedPaths.has(path)) continue;
      if (path === DECISION_11_P0_CASE_PATH) {
        const current = caseSchema.parse(
          parseStrictJson(readFileSync(join(root, path), "utf8")),
        );
        const baseline = caseSchema.parse(baselineJson(root, path));
        issues.push(...validateDecision11P0Case(current, baseline, path));
        rightsRemediatedCaseCount += 1;
        continue;
      }
      const current = readFileSync(join(root, path));
      const baseline = gitBytes(root, path);
      if (!current.equals(baseline)) {
        issues.push(
          issue(
            "decision8-unchanged-case-bytes",
            path,
            `non-target case bytes drifted from ${NBA_EMBED_BATCH2_BASELINE}`,
          ),
        );
      } else {
        unchangedCaseCount += 1;
      }
    }

    const correctedCases = new Map<string, InjuryCase>();
    for (const expected of NBA_EMBED_BATCH2_CORRECTED_CASES) {
      const current = caseSchema.parse(
        parseStrictJson(readFileSync(join(root, expected.path), "utf8")),
      );
      const baseline = caseSchema.parse(baselineJson(root, expected.path));
      correctedCases.set(current.id, current);
      issues.push(
        ...validateDecision8CorrectedCase(current, baseline, expected),
      );
    }

    const q3Path = "src/content/updates/2026-q3.json";
    const currentQ3 = updateSchema.parse(
      parseStrictJson(readFileSync(join(root, q3Path), "utf8")),
    );
    const baselineQ3 = updateSchema.parse(baselineJson(root, q3Path));
    issues.push(
      ...validateDecision8Q3(currentQ3, baselineQ3, correctedCases, q3Path),
    );

    const currentOverviewNames = jsonNames(root, overviewsDirectory);
    const baselineOverviewNames = baselineJsonNames(root, overviewsDirectory);
    issues.push(
      ...projectionIssue(
        "decision8-overview-file-set",
        overviewsDirectory,
        currentOverviewNames,
        baselineOverviewNames,
        "injury overview JSON file set drifted from the Decision 8 baseline",
      ),
    );
    for (const name of baselineOverviewNames) {
      const path = `${overviewsDirectory}/${name}`;
      if (!readFileSync(join(root, path)).equals(gitBytes(root, path))) {
        issues.push(
          issue(
            "decision8-unchanged-overview-bytes",
            path,
            `overview bytes drifted from ${NBA_EMBED_BATCH2_BASELINE}`,
          ),
        );
      } else {
        unchangedOverviewCount += 1;
      }
    }
  } catch (error) {
    issues.push(
      issue(
        "decision8-baseline-guard",
        relative(root, root) || ".",
        error instanceof Error ? error.message : String(error),
      ),
    );
  }

  return {
    issues,
    correctedCaseCount: NBA_EMBED_BATCH2_CORRECTED_CASES.length,
    rightsRemediatedCaseCount,
    unchangedCaseCount,
    unchangedOverviewCount,
  };
}

export function runNbaEmbedBatch2ContentCorrectionCli(
  root = process.cwd(),
): number {
  const result = checkNbaEmbedBatch2ContentCorrection(root);
  for (const entry of result.issues) {
    console.error(`[${entry.code}] ${entry.path}: ${entry.message}`);
  }
  if (result.issues.length > 0) {
    console.error(
      `nba-embed-batch2 content correction FAILED with ${result.issues.length} issue(s)`,
    );
    return 1;
  }
  console.log(
    `nba-embed-batch2 content correction OK corrected=${result.correctedCaseCount} ` +
      `rightsRemediated=${result.rightsRemediatedCaseCount} ` +
      `unchangedCases=${result.unchangedCaseCount} ` +
      `unchangedOverviews=${result.unchangedOverviewCount}`,
  );
  return 0;
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(runNbaEmbedBatch2ContentCorrectionCli());
}
