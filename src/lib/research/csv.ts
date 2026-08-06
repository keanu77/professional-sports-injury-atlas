/** Strict RFC 4180 parsing for NBA candidate ledgers. */

import { parse } from "csv-parse/sync";
import { compareCodePoints } from "../contracts/canonical";
import {
  CANDIDATE_COLUMN_TO_PROPERTY,
  CANDIDATE_CSV_COLUMNS,
  type CandidateInjuryCode,
  type CandidateRow,
  type ValidationIssue,
} from "./candidate-contract";

const columnOrder = new Map<string, number>(
  CANDIDATE_CSV_COLUMNS.map((column, index) => [column, index]),
);

const issueOrder = (left: ValidationIssue, right: ValidationIssue): number =>
  compareCodePoints(left.filename, right.filename) ||
  left.row - right.row ||
  (columnOrder.get(left.column) ?? CANDIDATE_CSV_COLUMNS.length) -
    (columnOrder.get(right.column) ?? CANDIDATE_CSV_COLUMNS.length) ||
  compareCodePoints(left.column, right.column) ||
  compareCodePoints(left.code, right.code) ||
  compareCodePoints(left.message, right.message);

const csvIssue = (
  filename: string,
  row: number,
  column: string,
  code: string,
  message: string,
): ValidationIssue => ({ filename, row, column, code, message });

export class CandidateCsvError extends Error {
  readonly issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    const sorted = [...issues].sort(issueOrder);
    super(
      sorted.length === 1
        ? sorted[0]!.message
        : `candidate CSV has ${sorted.length} structural errors`,
    );
    this.name = "CandidateCsvError";
    this.issues = sorted;
  }
}

function parseRawRecords(text: string, filename: string): readonly string[][] {
  try {
    const records = parse(text, {
      bom: true,
      columns: false,
      encoding: "utf8",
      relax_column_count: true,
      relax_quotes: false,
      skip_empty_lines: false,
    }) as unknown;
    if (!Array.isArray(records)) {
      throw new Error("CSV parser did not return an array");
    }
    return records.map((record, index) => {
      if (
        !Array.isArray(record) ||
        !record.every((value) => typeof value === "string")
      ) {
        throw new CandidateCsvError([
          csvIssue(
            filename,
            index + 1,
            "<row>",
            "csv-record-shape",
            "CSV record must be an array of strings",
          ),
        ]);
      }
      return record as string[];
    });
  } catch (error) {
    if (error instanceof CandidateCsvError) throw error;
    const parserError = error as { message?: unknown; lines?: unknown };
    const row =
      typeof parserError.lines === "number" && parserError.lines > 0
        ? parserError.lines
        : 1;
    throw new CandidateCsvError([
      csvIssue(
        filename,
        row,
        "<row>",
        "csv-syntax",
        `invalid RFC 4180 CSV: ${
          typeof parserError.message === "string"
            ? parserError.message
            : String(error)
        }`,
      ),
    ]);
  }
}

function validateHeader(header: readonly string[], filename: string): void {
  const issues: ValidationIssue[] = [];
  const expected = new Set<string>(CANDIDATE_CSV_COLUMNS);
  const observedCounts = new Map<string, number>();
  for (const column of header) {
    observedCounts.set(column, (observedCounts.get(column) ?? 0) + 1);
  }

  for (const column of CANDIDATE_CSV_COLUMNS) {
    if (!observedCounts.has(column)) {
      issues.push(
        csvIssue(
          filename,
          1,
          column,
          "csv-header-missing",
          `required column ${column} is missing`,
        ),
      );
    }
  }
  for (const [column, count] of observedCounts) {
    if (!expected.has(column)) {
      issues.push(
        csvIssue(
          filename,
          1,
          column || "<empty-header>",
          "csv-header-unknown",
          `unknown column ${JSON.stringify(column)}`,
        ),
      );
    }
    if (count > 1) {
      issues.push(
        csvIssue(
          filename,
          1,
          column || "<empty-header>",
          "csv-header-duplicate",
          `column ${JSON.stringify(column)} appears ${count} times`,
        ),
      );
    }
  }

  const sameMembers =
    issues.length === 0 && header.length === CANDIDATE_CSV_COLUMNS.length;
  if (
    sameMembers &&
    header.some((column, index) => column !== CANDIDATE_CSV_COLUMNS[index])
  ) {
    issues.push(
      csvIssue(
        filename,
        1,
        "<header>",
        "csv-header-order",
        "candidate columns are not in the required order",
      ),
    );
  }

  if (issues.length > 0) throw new CandidateCsvError(issues);
}

const normalizeField = (value: string): string => value.trim().normalize("NFC");

const isBlankRecord = (record: readonly string[]): boolean =>
  record.every((value) => value.trim() === "");

/**
 * Parse one injury ledger. This performs only structural parsing and inert
 * whitespace/boolean conversion; all semantic checks are pure validators.
 */
export function parseCandidateCsv(
  text: string,
  expectedInjury: CandidateInjuryCode,
): CandidateRow[] {
  const filename = `${expectedInjury}.csv`;
  const records = parseRawRecords(text, filename);
  if (records.length === 0 || isBlankRecord(records[0]!)) {
    throw new CandidateCsvError([
      csvIssue(
        filename,
        1,
        "<header>",
        "csv-header-missing",
        "candidate CSV is missing its required header",
      ),
    ]);
  }
  validateHeader(records[0]!, filename);

  const widthIssues: ValidationIssue[] = [];
  for (let index = 1; index < records.length; index += 1) {
    const record = records[index]!;
    if (isBlankRecord(record)) continue;
    if (record.length !== CANDIDATE_CSV_COLUMNS.length) {
      widthIssues.push(
        csvIssue(
          filename,
          index + 1,
          "<row>",
          "csv-column-count",
          `expected ${CANDIDATE_CSV_COLUMNS.length} columns but found ${record.length}`,
        ),
      );
    }
  }
  if (widthIssues.length > 0) throw new CandidateCsvError(widthIssues);

  const rows: CandidateRow[] = [];
  for (let index = 1; index < records.length; index += 1) {
    const record = records[index]!;
    if (isBlankRecord(record)) continue;
    const values: Record<string, unknown> = {};
    for (
      let columnIndex = 0;
      columnIndex < CANDIDATE_CSV_COLUMNS.length;
      columnIndex += 1
    ) {
      const column = CANDIDATE_CSV_COLUMNS[columnIndex]!;
      const property = CANDIDATE_COLUMN_TO_PROPERTY[column];
      const value = normalizeField(record[columnIndex]!);
      values[property] =
        column === "is_classic"
          ? value === "true"
            ? true
            : value === "false"
              ? false
              : value
          : value;
    }
    values.csvFilename = filename;
    values.csvRow = index + 1;
    values.expectedInjury = expectedInjury;
    rows.push(values as unknown as CandidateRow);
  }
  return rows;
}
