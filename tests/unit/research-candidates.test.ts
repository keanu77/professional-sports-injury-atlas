import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CANDIDATE_CSV_COLUMNS,
  type CandidateRow,
} from "../../src/lib/research/candidate-contract";
import {
  CandidateCsvError,
  parseCandidateCsv,
} from "../../src/lib/research/csv";
import {
  validateCandidateRow,
  validateCandidateSet,
} from "../../src/lib/research/validation";

const validText = readFileSync(
  new URL("../fixtures/research/valid-candidates.csv", import.meta.url),
  "utf8",
);
const invalidText = readFileSync(
  new URL("../fixtures/research/invalid-candidates.csv", import.meta.url),
  "utf8",
);

const validRows = (): CandidateRow[] => parseCandidateCsv(validText, "acl");
const row = (
  base: CandidateRow,
  overrides: Partial<CandidateRow>,
): CandidateRow => ({ ...base, ...overrides });
const codes = (rows: CandidateRow[]): string[] =>
  validateCandidateSet(rows).map((entry) => entry.code);
const rowCodes = (candidate: CandidateRow): string[] =>
  validateCandidateRow(candidate).map((entry) => entry.code);

function headerError(text: string): CandidateCsvError {
  try {
    parseCandidateCsv(text, "acl");
  } catch (error) {
    expect(error).toBeInstanceOf(CandidateCsvError);
    return error as CandidateCsvError;
  }
  throw new Error("expected CandidateCsvError");
}

describe("strict candidate CSV parsing", () => {
  it("uses the exact 60-column contract in the exact order", () => {
    expect(CANDIDATE_CSV_COLUMNS).toHaveLength(60);
    expect(validText.split("\n", 1)[0]).toBe(CANDIDATE_CSV_COLUMNS.join(","));
    expect(validRows()).toHaveLength(2);
  });

  it("parses RFC 4180 quoted commas and newlines without executing content", () => {
    const [candidate] = validRows();
    expect(candidate?.videoTitle).toBe(
      "Avery Example injury event vs. Harbor Pilots, 2025-01-15,\n" +
        "NBA regular season",
    );

    const inert = validText.replace(
      "Avery Example injury event vs. Harbor Pilots, 2025-01-15,\nNBA regular season",
      "=1+1,<script>globalThis.compromised=true</script>",
    );
    expect(parseCandidateCsv(inert, "acl")[0]?.videoTitle).toBe(
      "=1+1,<script>globalThis.compromised=true</script>",
    );
    expect((globalThis as Record<string, unknown>).compromised).toBeUndefined();
  });

  it("accepts one BOM, ignores blank records, and trims outer whitespace", () => {
    const rows = parseCandidateCsv(`\uFEFF${validText}\n\n`, "acl");
    expect(rows).toHaveLength(2);
    expect(rows[0]?.athleteDisplayName).toBe("Avery Example");
    expect(rows[0]?.csvRow).toBe(2);
    expect(rows[0]?.csvFilename).toBe("acl.csv");
  });

  it("rejects missing, duplicate, unknown, and reordered headers", () => {
    const [header, ...body] = validText.split("\n");
    const cells = header!.split(",");

    const missing = headerError(
      [cells.slice(0, -1).join(","), ...body].join("\n"),
    );
    expect(missing.issues.map((entry) => entry.code)).toContain(
      "csv-header-missing",
    );

    const duplicateCells = [...cells];
    duplicateCells[duplicateCells.length - 1] = "candidate_id";
    const duplicate = headerError(
      [duplicateCells.join(","), ...body].join("\n"),
    );
    expect(duplicate.issues.map((entry) => entry.code)).toEqual(
      expect.arrayContaining(["csv-header-duplicate", "csv-header-missing"]),
    );

    const unknownCells = [...cells];
    unknownCells[unknownCells.length - 1] = "surprise_column";
    const unknown = headerError([unknownCells.join(","), ...body].join("\n"));
    expect(unknown.issues.map((entry) => entry.code)).toEqual(
      expect.arrayContaining(["csv-header-unknown", "csv-header-missing"]),
    );

    const reorderedCells = [...cells];
    [reorderedCells[0], reorderedCells[1]] = [
      reorderedCells[1]!,
      reorderedCells[0]!,
    ];
    const reordered = headerError(
      [reorderedCells.join(","), ...body].join("\n"),
    );
    expect(reordered.issues.map((entry) => entry.code)).toContain(
      "csv-header-order",
    );
  });

  it("reports structural errors with file, 1-based row, column, code, and message", () => {
    const [header] = validText.split("\n");
    const error = headerError(`${header}\nonly-one-field\n`);
    expect(error.issues[0]).toMatchObject({
      filename: "acl.csv",
      row: 2,
      code: "csv-column-count",
    });
    expect(error.issues[0]?.column).toBeTruthy();
    expect(error.issues[0]?.message).toBeTruthy();
  });
});

describe("row contract validation", () => {
  it("accepts a complete recent first-party row and classic exception row", () => {
    expect(validateCandidateSet(validRows())).toEqual([]);
  });

  it("rejects duplicate IDs and reports stable locations", () => {
    const [recent] = validRows();
    const duplicate = row(recent!, {
      csvRow: 3,
      athleteDisplayName: "Blake Example",
      videoTitle: "Blake Example vs. Harbor Pilots injury event",
      eventSourceTitle: "Blake Example vs. Harbor Pilots game report",
    });
    const issues = validateCandidateSet([recent!, duplicate]);
    expect(issues.map((entry) => entry.code)).toContain(
      "duplicate-candidate-id",
    );
    expect(
      issues.find((entry) => entry.code === "duplicate-candidate-id"),
    ).toMatchObject({
      filename: "acl.csv",
      row: 3,
      column: "candidate_id",
    });
  });

  it("rejects candidate ID injury/year and expected-ledger mismatches", () => {
    const invalid = parseCandidateCsv(invalidText, "acl")[0]!;
    expect(rowCodes(invalid)).toEqual(
      expect.arrayContaining([
        "candidate-id-injury-mismatch",
        "candidate-id-year-mismatch",
      ]),
    );

    const [recent] = validRows();
    expect(
      rowCodes(row(recent!, { expectedInjury: "ankle-sprain" })),
    ).toContain("candidate-injury-file-mismatch");
  });

  it("rejects invalid dates, season shape/mapping, competition, URL scheme, enum, and boolean", () => {
    const invalid = parseCandidateCsv(invalidText, "acl")[0]!;
    expect(rowCodes(invalid)).toEqual(
      expect.arrayContaining([
        "invalid-date",
        "invalid-season",
        "invalid-enum",
        "invalid-boolean",
        "invalid-url-scheme",
      ]),
    );

    const [recent] = validRows();
    expect(rowCodes(row(recent!, { season: "2023-24" }))).toContain(
      "season-event-mismatch",
    );
    expect(rowCodes(row(recent!, { embedCheckedAt: "2026-08-06" }))).toContain(
      "invalid-date",
    );
  });

  it("keeps the bounded 2019-20 NBA restart inside its season", () => {
    const [recent] = validRows();
    const restart = row(recent!, {
      candidateId: "CAND-NBA-ACL-2020-088",
      season: "2019-20",
      eventDate: "2020-08-20",
      videoTitle:
        "Avery Example injury event vs. Harbor Pilots 2020-08-20 NBA playoffs",
      eventSourceTitle:
        "Avery Example vs. Harbor Pilots 2020-08-20 game report",
    });
    expect(rowCodes(restart)).not.toContain("season-event-mismatch");

    const wrongOverlap = row(restart, { season: "2020-21" });
    expect(rowCodes(wrongOverlap)).toContain("season-event-mismatch");
  });

  it("rejects a duplicate normalized athlete/date/injury event", () => {
    const [recent] = validRows();
    const duplicateEvent = row(recent!, {
      csvRow: 3,
      candidateId: "CAND-NBA-ACL-2025-099",
      athleteDisplayName: "  AVERY   example ",
      videoCanonicalUrl: "https://www.youtube.com/watch?v=AclCase0099",
    });
    expect(codes([recent!, duplicateEvent])).toContain("duplicate-event");
  });

  it("rejects one canonical video URL assigned to different events", () => {
    const [recent] = validRows();
    const otherEvent = row(recent!, {
      csvRow: 3,
      candidateId: "CAND-NBA-ACL-2024-099",
      athleteDisplayName: "Blake Example",
      eventDate: "2024-12-20",
      videoTitle:
        "Blake Example injury event vs. Harbor Pilots 2024-12-20 NBA regular season",
      eventSourceTitle:
        "Blake Example vs. Harbor Pilots 2024-12-20 game report",
      videoCanonicalUrl: "https://youtu.be/AclCase0001",
    });
    expect(codes([recent!, otherEvent])).toContain("duplicate-video-url");
  });

  it("enforces classic date and reason consistency", () => {
    const [recent, classic] = validRows();
    expect(rowCodes(row(recent!, { isClassic: true }))).toEqual(
      expect.arrayContaining([
        "classic-date-mismatch",
        "classic-reason-required",
      ]),
    );
    expect(rowCodes(row(classic!, { isClassic: false }))).toEqual(
      expect.arrayContaining([
        "classic-date-mismatch",
        "classic-reason-unexpected",
      ]),
    );
    expect(
      rowCodes(
        row(classic!, {
          eventDate: "not-a-date",
          classicReason: "",
        }),
      ),
    ).toContain("classic-reason-required");
  });

  it("requires a first-party diagnosis for a recent source-ready row", () => {
    const [recent] = validRows();
    expect(
      rowCodes(
        row(recent!, {
          diagnosisSource1Type: "diagnosis-secondary",
          firstPartyAvailabilityStatus: "documented-unavailable",
          firstPartyUnavailabilityBasis: "No official page found.",
          firstPartyAvailabilityAuditRef:
            "/candidates/0/firstPartyAvailability",
        }),
      ),
    ).toContain("recent-first-party-required");
  });

  it("rejects unavailability evidence when first-party status is available", () => {
    const [recent] = validRows();
    expect(
      rowCodes(
        row(recent!, {
          firstPartyUnavailabilityBasis: "Stale unavailability assertion.",
          firstPartyAvailabilityAuditRef:
            "/candidates/0/firstPartyAvailability",
        }),
      ),
    ).toContain("first-party-unavailability-unexpected");
  });

  it("allows an original diagnosis source to omit a syndicated origin ID", () => {
    const [recent, classic] = validRows();
    expect(
      rowCodes(row(recent!, { diagnosisSource1OriginReportId: "" })),
    ).not.toContain("required-field");
    expect(
      rowCodes(
        row(classic!, {
          diagnosisSource1OriginReportId: "",
          diagnosisSource2OriginReportId: "",
        }),
      ),
    ).not.toContain("required-field");
  });

  it("requires two independent, non-syndicated classic secondary sources", () => {
    const [, classic] = validRows();
    expect(
      rowCodes(
        row(classic!, {
          diagnosisSource2Type: "",
          diagnosisSource2Title: "",
          diagnosisSource2Publisher: "",
          diagnosisSource2IndependenceGroup: "",
          diagnosisSource2OriginReportId: "",
          diagnosisSource2Url: "",
          diagnosisSource2PublishedAt: "",
          diagnosisSource2AccessedAt: "",
        }),
      ),
    ).toContain("classic-secondary-source-2-required");

    expect(
      rowCodes(
        row(classic!, {
          diagnosisSource2IndependenceGroup:
            classic!.diagnosisSource1IndependenceGroup,
        }),
      ),
    ).toContain("diagnosis-source-not-independent");

    expect(
      rowCodes(
        row(classic!, {
          diagnosisSource2OriginReportId:
            classic!.diagnosisSource1OriginReportId,
        }),
      ),
    ).toContain("diagnosis-source-syndicated");
  });

  it("requires complete structured first-party-unavailability evidence", () => {
    const [, classic] = validRows();
    expect(
      rowCodes(
        row(classic!, {
          firstPartyUnavailabilityBasis: "",
          firstPartyAvailabilityCheckedBy: "",
          firstPartyAvailabilityCheckedAt: "",
          firstPartyAvailabilityAuditRef: "not-a-json-pointer",
        }),
      ),
    ).toEqual(
      expect.arrayContaining([
        "first-party-unavailability-required",
        "first-party-audit-ref-invalid",
      ]),
    );
  });
});

describe("status-dependent validation", () => {
  it("allows source fields to remain blank while a row still needs research", () => {
    const [recent] = validRows();
    const incomplete = row(recent!, {
      videoProvider: "" as CandidateRow["videoProvider"],
      videoContentType: "" as CandidateRow["videoContentType"],
      videoCanonicalUrl: "",
      videoTitle: "",
      videoUploaderName: "",
      videoUploaderProvenance: "" as CandidateRow["videoUploaderProvenance"],
      videoChannelUrl: "",
      videoPublishedAt: "",
      videoAccessedAt: "",
      embedStatus: "" as CandidateRow["embedStatus"],
      embedCheckedAt: "",
      captionStatus: "" as CandidateRow["captionStatus"],
      captionCheckedAt: "",
      videoProvenanceBasis: "",
      provenanceCheckStatus: "" as CandidateRow["provenanceCheckStatus"],
      provenanceCheckedBy: "",
      provenanceCheckedAt: "",
      diagnosisStatus: "unconfirmed",
      diagnosisClaim: "",
      firstPartyAvailabilityStatus: "not-applicable",
      firstPartyAvailabilityCheckedBy: "",
      firstPartyAvailabilityCheckedAt: "",
      diagnosisSource1Type: "",
      diagnosisSource1Title: "",
      diagnosisSource1Publisher: "",
      diagnosisSource1IndependenceGroup: "",
      diagnosisSource1OriginReportId: "",
      diagnosisSource1Url: "",
      diagnosisSource1PublishedAt: "",
      diagnosisSource1AccessedAt: "",
      eventSourceTitle: "",
      eventSourcePublisher: "",
      eventSourceUrl: "",
      eventSourcePublishedAt: "",
      eventSourceAccessedAt: "",
      discoveryStatus: "needs-source",
    });
    expect(validateCandidateRow(incomplete)).toEqual([]);
  });

  it("enforces the source-ready video content and event identity", () => {
    const [recent] = validRows();
    expect(
      rowCodes(
        row(recent!, {
          videoContentType: "news-recap" as CandidateRow["videoContentType"],
        }),
      ),
    ).toContain("source-ready-video-content-type");
    expect(
      rowCodes(
        row(recent!, {
          videoTitle: "Different athlete at an unrelated event",
        }),
      ),
    ).toContain("event-video-identity-mismatch");
    expect(
      rowCodes(
        row(recent!, {
          eventDate: "2025-01-16",
          competition: "nba-playoffs",
        }),
      ),
    ).toContain("event-video-identity-mismatch");
  });

  it("uses an inclusive event-day through +3-day primary-video publication window", () => {
    const [recent] = validRows();
    const videoTitleWithoutDate = "Avery Example exits game with injury";

    expect(
      rowCodes(
        row(recent!, {
          videoTitle: videoTitleWithoutDate,
          videoPublishedAt: "2025-01-18",
        }),
      ),
    ).not.toContain("event-video-identity-mismatch");
    expect(
      rowCodes(
        row(recent!, {
          videoTitle: videoTitleWithoutDate,
          videoPublishedAt: "2025-01-19",
        }),
      ),
    ).toContain("event-video-identity-mismatch");
    expect(
      rowCodes(
        row(recent!, {
          videoTitle: videoTitleWithoutDate,
          videoPublishedAt: "2025-01-14",
        }),
      ),
    ).toContain("event-video-identity-mismatch");
  });

  it("preserves the title-date alternative and exact event-source date rule", () => {
    const [recent] = validRows();

    expect(
      rowCodes(row(recent!, { videoPublishedAt: "2025-01-19" })),
    ).not.toContain("event-video-identity-mismatch");
    expect(
      rowCodes(
        row(recent!, {
          videoTitle: "Avery Example exits game with injury",
          videoPublishedAt: "2025-01-18",
          eventSourceTitle: "Avery Example game report",
          eventSourcePublishedAt: "2025-01-16",
        }),
      ),
    ).toContain("event-video-identity-mismatch");
  });

  it("defers full opponent and competition identity to the root audit", () => {
    const [recent] = validRows();
    expect(
      rowCodes(
        row(recent!, {
          videoTitle: "Avery Example exits game with injury",
        }),
      ),
    ).not.toContain("event-video-identity-mismatch");
  });

  it("binds a source-ready uploader channel to the selected video provider", () => {
    const [recent] = validRows();
    expect(
      rowCodes(
        row(recent!, {
          videoChannelUrl: "https://unrelated.example.org/channel",
        }),
      ),
    ).toContain("video-channel-provider-mismatch");
  });

  it("rejects tracking parameters on a canonical video URL", () => {
    const [recent] = validRows();
    expect(
      rowCodes(
        row(recent!, {
          videoProvider: "nba",
          videoCanonicalUrl:
            "https://www.nba.com/watch/video/fictional-event?utm_source=test",
          videoChannelUrl: "https://www.nba.com/watch",
          embedStatus: "external-link-only",
        }),
      ),
    ).toContain("video-url-tracking-parameters");
  });

  it("requires verified provenance, usable embed/link state, and checked captions", () => {
    const [recent] = validRows();
    expect(
      rowCodes(row(recent!, { provenanceCheckStatus: "pending" })),
    ).toContain("source-ready-provenance");
    expect(rowCodes(row(recent!, { embedStatus: "unchecked" }))).toContain(
      "source-ready-embed",
    );
    expect(rowCodes(row(recent!, { captionStatus: "not-verified" }))).toContain(
      "source-ready-caption",
    );
  });

  it("rejects conflicts and incomplete event/video/source/check metadata", () => {
    const [recent] = validRows();
    expect(rowCodes(row(recent!, { diagnosisStatus: "conflicted" }))).toContain(
      "source-ready-diagnosis",
    );

    expect(
      rowCodes(
        row(recent!, {
          videoTitle: "",
          videoPublishedAt: "",
          eventSourceTitle: "",
          eventSourcePublishedAt: "",
          diagnosisSource1Title: "",
          diagnosisSource1AccessedAt: "",
        }),
      ),
    ).toContain("required-field");

    expect(rowCodes(row(recent!, { provenanceCheckedBy: "" }))).toContain(
      "source-ready-checker",
    );
  });

  it("requires source-verified rows to pass source-ready and name the reviewer/date", () => {
    const [recent] = validRows();
    const verified = row(recent!, {
      discoveryStatus: "source-verified",
      embedStatus: "unchecked",
      reviewedBy: "",
      reviewedAt: "",
    });
    expect(rowCodes(verified)).toEqual(
      expect.arrayContaining([
        "source-ready-embed",
        "source-verified-reviewer",
      ]),
    );
  });

  it("requires a reason only for excluded rows", () => {
    const [recent] = validRows();
    expect(
      rowCodes(
        row(recent!, {
          discoveryStatus: "excluded",
          exclusionReason: "",
        }),
      ),
    ).toContain("excluded-reason-required");
    expect(
      rowCodes(row(recent!, { exclusionReason: "not actually excluded" })),
    ).toContain("exclusion-reason-unexpected");
  });

  it("emits complete deterministic issue records for the invalid fixture", () => {
    const issues = validateCandidateSet(parseCandidateCsv(invalidText, "acl"));
    expect(issues.length).toBeGreaterThan(10);
    for (const entry of issues) {
      expect(entry.filename).toBe("acl.csv");
      expect(entry.row).toBe(2);
      expect(entry.column).toBeTruthy();
      expect(entry.code).toMatch(/^[a-z0-9-]+$/);
      expect(entry.message).toBeTruthy();
    }
    expect(issues).toEqual(
      validateCandidateSet(parseCandidateCsv(invalidText, "acl")),
    );
  });
});
