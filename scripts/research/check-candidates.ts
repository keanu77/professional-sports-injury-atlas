/**
 * Read-only checker for the three fixed NBA source-discovery ledgers.
 *
 * The CLI deliberately loads every ledger before running set validation so
 * candidate, event, and canonical-video duplicates cannot hide across files.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import {
  CANDIDATE_CSV_COLUMNS,
  CANDIDATE_DISCOVERY_STATUSES,
  CANDIDATE_INJURY_CODES,
  type CandidateDiscoveryStatus,
  type CandidateInjuryCode,
  type CandidateRow,
  type ValidationIssue,
} from "../../src/lib/research/candidate-contract";
import {
  CandidateCsvError,
  parseCandidateCsv,
} from "../../src/lib/research/csv";
import { validateCandidateSet } from "../../src/lib/research/validation";

export const MINIMUM_RESEARCHED_CANDIDATES_PER_INJURY = 15;
export const CANDIDATE_LEDGER_DIRECTORY = "research/candidates";

export const CANDIDATE_LEDGER_PATHS = Object.freeze(
  Object.fromEntries(
    CANDIDATE_INJURY_CODES.map((injury) => [
      injury,
      `${CANDIDATE_LEDGER_DIRECTORY}/${injury}.csv`,
    ]),
  ) as Record<CandidateInjuryCode, string>,
);

export interface CandidateLedgerSummary {
  injury: CandidateInjuryCode;
  path: string;
  parsed: boolean;
  total: number;
  recent: number;
  classic: number;
  invalidClassic: number;
  sourceReadyOrVerified: number;
  statusCounts: Record<CandidateDiscoveryStatus, number>;
  invalidStatus: number;
}

export interface CandidateAuditQueueEntry {
  injury: CandidateInjuryCode;
  eventDate: string;
  candidateId: string;
  discoveryStatus: "source-ready" | "source-verified";
  diagnosisSource1Url: string;
  diagnosisSource2Url: string;
  videoUrl: string;
  eventUrl: string;
  csvFilename: string;
  csvRow: number;
}

export interface CandidateCheckResult {
  rows: CandidateRow[];
  summaries: CandidateLedgerSummary[];
  auditQueue: CandidateAuditQueueEntry[];
  issues: ValidationIssue[];
}

export interface CandidateCheckOutput {
  log(line: string): void;
  error(line: string): void;
}

const defaultOutput: CandidateCheckOutput = {
  log: (line) => console.log(line),
  error: (line) => console.error(line),
};

const injuryOrder = new Map<CandidateInjuryCode, number>(
  CANDIDATE_INJURY_CODES.map((injury, index) => [injury, index]),
);
const filenameOrder = new Map<string, number>(
  CANDIDATE_INJURY_CODES.map((injury, index) => [`${injury}.csv`, index]),
);
const columnOrder = new Map<string, number>(
  CANDIDATE_CSV_COLUMNS.map((column, index) => [column, index]),
);

const compareText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const compareIssues = (left: ValidationIssue, right: ValidationIssue): number =>
  (filenameOrder.get(left.filename) ?? filenameOrder.size) -
    (filenameOrder.get(right.filename) ?? filenameOrder.size) ||
  compareText(left.filename, right.filename) ||
  left.row - right.row ||
  (columnOrder.get(left.column) ?? columnOrder.size) -
    (columnOrder.get(right.column) ?? columnOrder.size) ||
  compareText(left.column, right.column) ||
  compareText(left.code, right.code) ||
  compareText(left.message, right.message);

const sortAndDedupeIssues = (
  issues: readonly ValidationIssue[],
): ValidationIssue[] => {
  const sorted = [...issues].sort(compareIssues);
  return sorted.filter((entry, index) => {
    const previous = sorted[index - 1];
    return (
      previous === undefined ||
      entry.filename !== previous.filename ||
      entry.row !== previous.row ||
      entry.column !== previous.column ||
      entry.code !== previous.code ||
      entry.message !== previous.message
    );
  });
};

const ledgerIssue = (
  injury: CandidateInjuryCode,
  code: string,
  message: string,
): ValidationIssue => ({
  filename: `${injury}.csv`,
  row: 1,
  column: "<ledger>",
  code,
  message,
});

function emptyStatusCounts(): Record<CandidateDiscoveryStatus, number> {
  return Object.fromEntries(
    CANDIDATE_DISCOVERY_STATUSES.map((status) => [status, 0]),
  ) as Record<CandidateDiscoveryStatus, number>;
}

function summarizeLedger(
  injury: CandidateInjuryCode,
  rows: readonly CandidateRow[],
  parsed: boolean,
): CandidateLedgerSummary {
  const statusCounts = emptyStatusCounts();
  let invalidStatus = 0;
  let recent = 0;
  let classic = 0;
  let invalidClassic = 0;

  for (const row of rows) {
    if (row.isClassic === true) classic += 1;
    else if (row.isClassic === false) recent += 1;
    else invalidClassic += 1;

    if (
      CANDIDATE_DISCOVERY_STATUSES.includes(
        row.discoveryStatus as CandidateDiscoveryStatus,
      )
    ) {
      statusCounts[row.discoveryStatus as CandidateDiscoveryStatus] += 1;
    } else {
      invalidStatus += 1;
    }
  }

  return {
    injury,
    path: CANDIDATE_LEDGER_PATHS[injury],
    parsed,
    total: rows.length,
    recent,
    classic,
    invalidClassic,
    sourceReadyOrVerified:
      statusCounts["source-ready"] + statusCounts["source-verified"],
    statusCounts,
    invalidStatus,
  };
}

const isAuditStatus = (
  status: CandidateRow["discoveryStatus"],
): status is "source-ready" | "source-verified" =>
  status === "source-ready" || status === "source-verified";

function buildAuditQueue(
  rows: readonly CandidateRow[],
): CandidateAuditQueueEntry[] {
  return rows
    .filter((row) => isAuditStatus(row.discoveryStatus))
    .map((row) => ({
      injury: row.expectedInjury,
      eventDate: row.eventDate,
      candidateId: row.candidateId,
      discoveryStatus: row.discoveryStatus as
        "source-ready" | "source-verified",
      diagnosisSource1Url: row.diagnosisSource1Url,
      diagnosisSource2Url: row.diagnosisSource2Url,
      videoUrl: row.videoCanonicalUrl,
      eventUrl: row.eventSourceUrl,
      csvFilename: row.csvFilename,
      csvRow: row.csvRow,
    }))
    .sort(
      (left, right) =>
        (injuryOrder.get(left.injury) ?? injuryOrder.size) -
          (injuryOrder.get(right.injury) ?? injuryOrder.size) ||
        compareText(left.eventDate, right.eventDate) ||
        compareText(left.candidateId, right.candidateId) ||
        compareText(left.csvFilename, right.csvFilename) ||
        left.csvRow - right.csvRow,
    );
}

/** Load and validate the fixed three ledgers without mutating repository data. */
export function checkCandidateLedgers(
  root: string = process.cwd(),
): CandidateCheckResult {
  const issues: ValidationIssue[] = [];
  const rowsByInjury = new Map<CandidateInjuryCode, CandidateRow[]>();
  const parseSucceeded = new Set<CandidateInjuryCode>();

  for (const injury of CANDIDATE_INJURY_CODES) {
    const relativePath = CANDIDATE_LEDGER_PATHS[injury];
    const absolutePath = join(root, ...relativePath.split("/"));
    if (!existsSync(absolutePath)) {
      issues.push(
        ledgerIssue(
          injury,
          "candidate-ledger-missing",
          `required candidate ledger ${relativePath} is missing`,
        ),
      );
      rowsByInjury.set(injury, []);
      continue;
    }

    let text: string;
    try {
      text = readFileSync(absolutePath, "utf8");
    } catch {
      issues.push(
        ledgerIssue(
          injury,
          "candidate-ledger-read",
          `required candidate ledger ${relativePath} could not be read`,
        ),
      );
      rowsByInjury.set(injury, []);
      continue;
    }

    try {
      const parsedRows = parseCandidateCsv(text, injury);
      rowsByInjury.set(injury, parsedRows);
      parseSucceeded.add(injury);
      if (parsedRows.length === 0) {
        issues.push(
          ledgerIssue(
            injury,
            "candidate-count-zero",
            `${injury} ledger has zero candidates; at least ${MINIMUM_RESEARCHED_CANDIDATES_PER_INJURY} researched candidates are required`,
          ),
        );
      } else if (parsedRows.length < MINIMUM_RESEARCHED_CANDIDATES_PER_INJURY) {
        issues.push(
          ledgerIssue(
            injury,
            "candidate-count-minimum",
            `${injury} ledger has ${parsedRows.length} candidates; at least ${MINIMUM_RESEARCHED_CANDIDATES_PER_INJURY} researched candidates are required`,
          ),
        );
      }
    } catch (error) {
      rowsByInjury.set(injury, []);
      if (error instanceof CandidateCsvError) {
        issues.push(...error.issues);
      } else {
        issues.push(
          ledgerIssue(
            injury,
            "candidate-ledger-parse",
            `required candidate ledger ${relativePath} could not be parsed`,
          ),
        );
      }
    }
  }

  const rows = CANDIDATE_INJURY_CODES.flatMap(
    (injury) => rowsByInjury.get(injury) ?? [],
  );
  try {
    issues.push(...validateCandidateSet(rows));
  } catch {
    issues.push({
      filename: "<candidate-set>",
      row: 1,
      column: "<set>",
      code: "candidate-set-validation",
      message: "candidate set validation could not be completed",
    });
  }

  const summaries = CANDIDATE_INJURY_CODES.map((injury) =>
    summarizeLedger(
      injury,
      rowsByInjury.get(injury) ?? [],
      parseSucceeded.has(injury),
    ),
  );

  return {
    rows,
    summaries,
    auditQueue: buildAuditQueue(rows),
    issues: sortAndDedupeIssues(issues),
  };
}

function formatSummary(summary: CandidateLedgerSummary): string {
  const statusCounts = CANDIDATE_DISCOVERY_STATUSES.map(
    (status) => `${status}:${summary.statusCounts[status]}`,
  ).join(",");
  return (
    `COUNT injury=${summary.injury} parsed=${summary.parsed} ` +
    `total=${summary.total} recent=${summary.recent} classic=${summary.classic} ` +
    `invalidClassic=${summary.invalidClassic} ` +
    `sourceReadyOrVerified=${summary.sourceReadyOrVerified} ` +
    `statuses=${statusCounts} invalidStatus=${summary.invalidStatus}`
  );
}

function formatAuditEntry(entry: CandidateAuditQueueEntry): string {
  return (
    `AUDIT injury=${entry.injury} eventDate=${JSON.stringify(entry.eventDate)} ` +
    `candidateId=${JSON.stringify(entry.candidateId)} ` +
    `status=${entry.discoveryStatus} ` +
    `diagnosisSource1Url=${JSON.stringify(entry.diagnosisSource1Url)} ` +
    `diagnosisSource2Url=${JSON.stringify(entry.diagnosisSource2Url)} ` +
    `videoUrl=${JSON.stringify(entry.videoUrl)} ` +
    `eventUrl=${JSON.stringify(entry.eventUrl)}`
  );
}

const oneLine = (value: string): string => value.replace(/\s+/gu, " ").trim();

/** Print a deterministic report and return the intended process exit code. */
export function runCandidateCheckCli(
  root: string = process.cwd(),
  output: CandidateCheckOutput = defaultOutput,
): number {
  const result = checkCandidateLedgers(root);

  output.log("research:check candidate counts");
  for (const summary of result.summaries) output.log(formatSummary(summary));

  output.log(
    `research:check source-ready audit queue entries=${result.auditQueue.length}`,
  );
  for (const entry of result.auditQueue) output.log(formatAuditEntry(entry));

  if (result.issues.length === 0) {
    output.log("research:check OK");
    return 0;
  }

  for (const issue of result.issues) {
    output.error(
      `[${issue.code}] ${issue.filename}:${issue.row}:${issue.column} ${oneLine(issue.message)}`,
    );
  }
  output.error(`research:check FAILED with ${result.issues.length} issue(s)`);
  return 1;
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(runCandidateCheckCli());
}
