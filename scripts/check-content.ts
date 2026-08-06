/**
 * Production content check: loads the three real content collections (cases,
 * injuries, updates) with the production loader (which rejects fixture
 * paths), the append-only source-manifest registry, the public-release
 * history, the course-link data, and the governance records, then runs every
 * record-level and cross-record validator. Zero records is a legitimate
 * review-phase state and passes.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import {
  canonicalJson,
  parseStrictJson,
  type ValidationIssue,
} from "../src/lib/contracts/canonical";
import { issue } from "../src/lib/contracts/canonical";
import { caseSchema, type InjuryCase } from "../src/lib/contracts/case";
import {
  validateCaseCollection,
  validateCaseFilename,
  validateCaseRecord,
  validateCaseSourceBinding,
} from "../src/lib/contracts/cross-validation";
import {
  injuryOverviewSchema,
  type InjuryOverview,
} from "../src/lib/contracts/injury-overview";
import { validateInjuryOverviewForApproval } from "../src/lib/cases/injury-overview-digest";
import {
  validateHistoricalUpdates,
  validateReleaseHistory,
} from "../src/lib/releases/history";
import {
  parseSourceManifestRegistryBytes,
  validateSourceManifestRegistryArtifacts,
  type SourceManifestRegistryV1,
} from "../src/lib/contracts/source-manifest-registry";
import { validateTaxonomyRegistries } from "../src/lib/contracts/taxonomy";
import {
  updateSchema,
  validateUpdateStructure,
  type QuarterlyUpdate,
} from "../src/lib/contracts/update";
import {
  COURSE_LINKS_DATA_PATH,
  parseRtpCourseSummariesBytes,
  RTP_COURSE_SUMMARIES_DATA_PATH,
  validateCourseGovernanceConsistency,
  validateProfessionalCourseLinks,
} from "../src/lib/rtp/course-links";
import {
  SITE_GOVERNANCE_DATA_PATH,
  validateSiteGovernanceRecord,
} from "../src/lib/governance/site-digest";

export const REPO_ROOT = process.cwd();

/** Recursive JSON file listing (skips dotfiles such as .gitkeep). */
export function listJsonFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  const results: string[] = [];
  for (const entry of readdirSync(directory).sort()) {
    if (entry.startsWith(".")) continue;
    const fullPath = join(directory, entry);
    if (statSync(fullPath).isDirectory()) {
      results.push(...listJsonFiles(fullPath));
    } else if (entry.endsWith(".json")) {
      results.push(fullPath);
    }
  }
  return results;
}

export interface LoadedContent {
  cases: Array<{ path: string; record: InjuryCase }>;
  overviews: Array<{ path: string; record: InjuryOverview }>;
  updates: Array<{ path: string; record: QuarterlyUpdate }>;
  issues: ValidationIssue[];
}

/** Production loader for the three content collections; rejects fixtures. */
export function loadContentCollections(
  root: string = REPO_ROOT,
): LoadedContent {
  const issues: ValidationIssue[] = [];
  const cases: LoadedContent["cases"] = [];
  const overviews: LoadedContent["overviews"] = [];
  const updates: LoadedContent["updates"] = [];

  const parseFile = (filePath: string): unknown | undefined => {
    const relPath = relative(root, filePath);
    if (
      relPath
        .split("/")
        .some(
          (segment) =>
            segment === "fixtures" ||
            segment === "tests" ||
            segment === "__mocks__",
        )
    ) {
      issues.push(
        issue(
          "fixture-path",
          relPath,
          "production loaders reject fixture paths and test-only adapters",
        ),
      );
      return undefined;
    }
    try {
      return parseStrictJson(readFileSync(filePath, "utf8"));
    } catch (error) {
      issues.push(
        issue(
          "content-parse",
          relPath,
          error instanceof Error ? error.message : String(error),
        ),
      );
      return undefined;
    }
  };

  for (const filePath of listJsonFiles(join(root, "src/content/cases"))) {
    const parsed = parseFile(filePath);
    if (parsed === undefined) continue;
    const result = caseSchema.safeParse(parsed);
    if (!result.success) {
      issues.push(
        ...result.error.issues.map((zodIssue) =>
          issue(
            "case-schema",
            `${relative(root, filePath)}.${zodIssue.path.join(".")}`,
            zodIssue.message,
          ),
        ),
      );
      continue;
    }
    cases.push({ path: relative(root, filePath), record: result.data });
  }
  for (const filePath of listJsonFiles(join(root, "src/content/injuries"))) {
    const parsed = parseFile(filePath);
    if (parsed === undefined) continue;
    const result = injuryOverviewSchema.safeParse(parsed);
    if (!result.success) {
      issues.push(
        ...result.error.issues.map((zodIssue) =>
          issue(
            "overview-schema",
            `${relative(root, filePath)}.${zodIssue.path.join(".")}`,
            zodIssue.message,
          ),
        ),
      );
      continue;
    }
    overviews.push({ path: relative(root, filePath), record: result.data });
  }
  for (const filePath of listJsonFiles(join(root, "src/content/updates"))) {
    const parsed = parseFile(filePath);
    if (parsed === undefined) continue;
    const result = updateSchema.safeParse(parsed);
    if (!result.success) {
      issues.push(
        ...result.error.issues.map((zodIssue) =>
          issue(
            "update-schema",
            `${relative(root, filePath)}.${zodIssue.path.join(".")}`,
            zodIssue.message,
          ),
        ),
      );
      continue;
    }
    updates.push({ path: relative(root, filePath), record: result.data });
  }
  return { cases, overviews, updates, issues };
}

export interface LoadedRegistry {
  registry: SourceManifestRegistryV1 | null;
  issues: ValidationIssue[];
}

/** Loads and byte-validates the real append-only registry. */
export function loadRealRegistry(root: string = REPO_ROOT): LoadedRegistry {
  const registryPath = join(root, "research/source-manifest-registry.v1.json");
  if (!existsSync(registryPath)) {
    return {
      registry: null,
      issues: [
        issue(
          "registry-missing",
          "research/source-manifest-registry.v1.json",
          "the source-manifest registry file is missing",
        ),
      ],
    };
  }
  const parsed = parseSourceManifestRegistryBytes(readFileSync(registryPath));
  return { registry: parsed.registry, issues: parsed.issues };
}

/** Read-only loader for registered research artifacts. */
export function registryArtifactLoader(root: string = REPO_ROOT) {
  return (path: string): Uint8Array => readFileSync(join(root, path));
}

export function runContentCheck(root: string = REPO_ROOT): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  issues.push(...validateTaxonomyRegistries());

  const loaded = loadContentCollections(root);
  issues.push(...loaded.issues);

  const registryResult = loadRealRegistry(root);
  issues.push(...registryResult.issues);
  const registry = registryResult.registry;
  if (registry !== null) {
    issues.push(
      ...validateSourceManifestRegistryArtifacts(
        registry,
        registryArtifactLoader(root),
      ),
    );
  }

  for (const { path, record } of loaded.cases) {
    const prefix = (entry: ValidationIssue): ValidationIssue => ({
      ...entry,
      path: `${path}.${entry.path}`,
    });
    issues.push(...validateCaseRecord(record).map(prefix));
    issues.push(...validateCaseFilename(path, record));
    if (registry !== null) {
      issues.push(
        ...validateCaseSourceBinding(
          record,
          registry,
          registryArtifactLoader(root),
        ).map(prefix),
      );
    }
  }
  issues.push(
    ...validateCaseCollection(loaded.cases.map((entry) => entry.record)),
  );

  for (const { path, record } of loaded.overviews) {
    issues.push(
      ...validateInjuryOverviewForApproval(record).map((entry) => ({
        ...entry,
        path: `${path}.${entry.path}`,
      })),
    );
  }
  for (const { path, record } of loaded.updates) {
    issues.push(
      ...validateUpdateStructure(record).map((entry) => ({
        ...entry,
        path: `${path}.${entry.path}`,
      })),
    );
  }

  const historyPath = join(
    root,
    "public-release-history/public-release-history.v1.json",
  );
  if (!existsSync(historyPath)) {
    issues.push(
      issue(
        "history-missing",
        "public-release-history/public-release-history.v1.json",
        "the public-release history file is missing",
      ),
    );
  } else {
    const historyText = readFileSync(historyPath, "utf8");
    let historyParsed: unknown;
    try {
      historyParsed = parseStrictJson(historyText);
    } catch (error) {
      historyParsed = undefined;
      issues.push(
        issue(
          "history-parse",
          "public-release-history",
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
    if (historyParsed !== undefined) {
      if (canonicalJson(historyParsed) !== historyText) {
        issues.push(
          issue(
            "history-not-canonical",
            "public-release-history",
            "stored release-history bytes are not canonical",
          ),
        );
      }
      const historyIssues = validateReleaseHistory(historyParsed);
      issues.push(...historyIssues);
      if (historyIssues.length === 0) {
        issues.push(
          ...validateHistoricalUpdates(
            historyParsed as { releases: [] },
            loaded.updates.map((entry) => entry.record),
          ),
        );
      }
    }
  }

  const courseLinksPath = join(root, COURSE_LINKS_DATA_PATH);
  try {
    issues.push(
      ...validateProfessionalCourseLinks(
        parseStrictJson(readFileSync(courseLinksPath, "utf8")),
      ),
    );
  } catch (error) {
    issues.push(
      issue(
        "course-links-load",
        COURSE_LINKS_DATA_PATH,
        error instanceof Error ? error.message : String(error),
      ),
    );
  }
  const summariesPath = join(root, RTP_COURSE_SUMMARIES_DATA_PATH);
  try {
    const parsedSummaries = parseRtpCourseSummariesBytes(
      readFileSync(summariesPath, "utf8"),
    );
    issues.push(...parsedSummaries.issues);
    if (parsedSummaries.summaries !== null) {
      for (const course of parsedSummaries.summaries.courses) {
        issues.push(
          ...validateCourseGovernanceConsistency(
            course,
            `${RTP_COURSE_SUMMARIES_DATA_PATH}.${course.slug}`,
          ),
        );
      }
    }
  } catch (error) {
    issues.push(
      issue(
        "course-summaries-load",
        RTP_COURSE_SUMMARIES_DATA_PATH,
        error instanceof Error ? error.message : String(error),
      ),
    );
  }

  try {
    issues.push(
      ...validateSiteGovernanceRecord(
        parseStrictJson(
          readFileSync(join(root, SITE_GOVERNANCE_DATA_PATH), "utf8"),
        ),
      ),
    );
  } catch (error) {
    issues.push(
      issue(
        "site-governance-load",
        SITE_GOVERNANCE_DATA_PATH,
        error instanceof Error ? error.message : String(error),
      ),
    );
  }

  return issues;
}

function main(): void {
  const loaded = loadContentCollections(REPO_ROOT);
  const issues = runContentCheck(REPO_ROOT);
  console.log(
    `content:check cases=${loaded.cases.length} overviews=${loaded.overviews.length} updates=${loaded.updates.length}`,
  );
  if (issues.length === 0) {
    console.log(
      "content:check OK (zero records is a legitimate review-phase state)",
    );
    return;
  }
  for (const entry of issues) {
    console.error(`[${entry.code}] ${entry.path}: ${entry.message}`);
  }
  console.error(`content:check FAILED with ${issues.length} issue(s)`);
  process.exit(1);
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
