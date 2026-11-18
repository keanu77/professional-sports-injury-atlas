import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  symlinkSync,
  linkSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  assessReaderRound,
  READER_PROTOCOL,
  READER_TASKS,
  readerSessionDigest,
  type ReaderSession,
} from "../../scripts/lib/reader-results";

const version = "a".repeat(40);
const now = new Date("2026-11-18T12:00:00Z");
function fixture() {
  const participants = Array.from({ length: 12 }, (_, index) => ({
    participantId: `P${String(index + 1).padStart(2, "0")}`,
    cohort: (["clinician", "student", "public"] as const)[
      Math.floor(index / 4)
    ]!,
  }));
  const roster = {
    schemaVersion: 1,
    protocolVersion: READER_PROTOCOL,
    commit: version,
    participants,
  };
  const sessions: ReaderSession[] = participants.map((person) => {
    const session: ReaderSession = {
      schemaVersion: 1,
      protocolVersion: READER_PROTOCOL,
      recordedAt: "2026-11-18T10:00:00Z",
      ...person,
      commit: version,
      device: "Synthetic test fixture, not a real participant",
      evidenceKind: "facilitator-observed",
      reviewStatus: "reviewed",
      clinicalApproval: false,
      publicationApproval: false,
      tasks: READER_TASKS.map((task) => ({
        taskId: task.id,
        outcome: "unassisted",
        elapsedSeconds: 10,
        response: "Synthetic observed answer",
      })),
    };
    session.facilitatorReview = {
      reviewerId: "H01",
      reviewedAt: "2026-11-18T11:00:00Z",
      sessionDigest: readerSessionDigest(session),
      tasks: READER_TASKS.map((task) => ({
        taskId: task.id,
        answerCorrect: true,
        majorMisreading: false,
        note: "Synthetic correctness check",
      })),
    };
    return session;
  });
  return { roster, sessions };
}
function reseal(session: ReaderSession) {
  session.facilitatorReview!.sessionDigest = readerSessionDigest(session);
}

describe("reader study evidence accounting", () => {
  it("keeps an empty study at zero readers and never treats it as a passing round", () => {
    const result = assessReaderRound(
      {
        schemaVersion: 1,
        protocolVersion: READER_PROTOCOL,
        commit: null,
        participants: [],
      },
      [],
      now,
    );
    expect(result).toMatchObject({
      receivedParticipants: 0,
      reviewedParticipants: 0,
      expectedParticipants: 12,
      expectedTasks: 108,
      successRate: null,
      acceptancePassed: false,
    });
  });
  it("accepts a complete observed synthetic round without granting clinical or publication approval", () => {
    const { roster, sessions } = fixture();
    expect(assessReaderRound(roster, sessions, now)).toMatchObject({
      expectedTasks: 108,
      successfulTasks: 108,
      acceptancePassed: true,
      clinicalApproval: false,
      publicationApproval: false,
    });
  });
  it("keeps missing and blocked tasks in the planned denominator", () => {
    const { roster, sessions } = fixture();
    sessions.pop();
    sessions[0]!.tasks[0]!.outcome = "blocked";
    reseal(sessions[0]!);
    const result = assessReaderRound(roster, sessions, now);
    expect(result.expectedTasks).toBe(108);
    expect(result.missingParticipantIds).toEqual(["P12"]);
    expect(result.tasks[0]).toMatchObject({
      successful: 10,
      expected: 12,
      passed: false,
    });
    expect(result.acceptancePassed).toBe(false);
  });
  it("does not promote self reports or pending facilitator observations", () => {
    const { roster, sessions } = fixture();
    sessions[0]!.evidenceKind = "participant-self-report";
    reseal(sessions[0]!);
    sessions[1]!.reviewStatus = "pending-facilitator-review";
    delete sessions[1]!.facilitatorReview;
    const result = assessReaderRound(roster, sessions, now);
    expect(result).toMatchObject({
      receivedParticipants: 12,
      reviewedParticipants: 10,
      selfReportedSessions: 1,
      acceptancePassed: false,
    });
  });
  it("excludes owner pilots from success counts but preserves their major misreading blockers", () => {
    const { roster, sessions } = fixture();
    const pilot = structuredClone(sessions[0]!);
    pilot.participantId = "Owner01";
    pilot.cohort = "owner-pilot";
    pilot.facilitatorReview!.tasks[0]!.majorMisreading = true;
    reseal(pilot);
    const result = assessReaderRound(roster, [...sessions, pilot], now);
    expect(result).toMatchObject({
      ownerPilotSessions: 1,
      reviewedParticipants: 12,
      successfulTasks: 108,
      majorMisreadings: 1,
      acceptancePassed: false,
    });
  });
  it("requires all three reader cohorts even with twelve observed readers", () => {
    const { roster, sessions } = fixture();
    roster.participants[4]!.cohort = "clinician";
    sessions[4]!.cohort = "clinician";
    reseal(sessions[4]!);
    const result = assessReaderRound(roster, sessions, now);
    expect(result.expectedParticipants).toBe(13);
    expect(result.gates.cohortQuorum).toBe(false);
    expect(result.acceptancePassed).toBe(false);
  });
  it("rejects duplicate IDs even if the case differs, and mixed versions", () => {
    const { roster, sessions } = fixture();
    const duplicate = structuredClone(sessions[0]!);
    duplicate.participantId = "p01";
    reseal(duplicate);
    expect(() =>
      assessReaderRound(roster, [...sessions, duplicate], now),
    ).toThrow(/Duplicate participant/);
    sessions[0]!.commit = "b".repeat(40);
    reseal(sessions[0]!);
    expect(() => assessReaderRound(roster, sessions, now)).toThrow(/versions/);
    roster.participants[1]!.participantId = "p01";
    expect(() => assessReaderRound(roster, [], now)).toThrow(
      /Duplicate roster/,
    );
  });
  it("rejects changed answers after review and exports claiming approval", () => {
    const { roster, sessions } = fixture();
    sessions[0]!.tasks[0]!.response = "Changed after observation";
    expect(() => assessReaderRound(roster, sessions, now)).toThrow(/bind/);
    expect(() =>
      assessReaderRound(
        roster,
        [{ ...sessions[1], clinicalApproval: true }],
        now,
      ),
    ).toThrow();
  });
  it("rejects unknown participants, changed cohorts and invalid dates", () => {
    const { roster, sessions } = fixture();
    const session = sessions[0]!;
    session.participantId = "Unknown01";
    reseal(session);
    expect(() => assessReaderRound(roster, [session], now)).toThrow(/roster/);
    session.participantId = "P01";
    session.cohort = "public";
    reseal(session);
    expect(() => assessReaderRound(roster, [session], now)).toThrow(/roster/);
    session.cohort = "clinician";
    session.recordedAt = "2026-11-19T10:00:00Z";
    reseal(session);
    expect(() => assessReaderRound(roster, [session], now)).toThrow(/Future/);
    session.recordedAt = "2026-11-18T10:00:00Z";
    session.facilitatorReview!.reviewedAt = "2026-11-18T09:00:00Z";
    reseal(session);
    expect(() => assessReaderRound(roster, [session], now)).toThrow(
      /review date/,
    );
  });
  it("rejects missing or repeated task IDs in results and in the review", () => {
    const { roster, sessions } = fixture();
    const session = sessions[0]!;
    session.tasks[0]!.taskId = "T02";
    reseal(session);
    expect(() => assessReaderRound(roster, [session], now)).toThrow(
      /exactly once/,
    );
    session.tasks[0]!.taskId = "T01";
    session.facilitatorReview!.tasks[0]!.taskId = "T02";
    reseal(session);
    expect(() => assessReaderRound(roster, [session], now)).toThrow(
      /exactly once/,
    );
    session.tasks.pop();
    reseal(session);
    expect(() => assessReaderRound(roster, [session], now)).toThrow();
  });
  it("requires the task time limit and correct answers, not just a completed checkbox", () => {
    const { roster, sessions } = fixture();
    sessions[0]!.tasks[2]!.elapsedSeconds = 31;
    reseal(sessions[0]!);
    sessions[1]!.facilitatorReview!.tasks[2]!.answerCorrect = false;
    const result = assessReaderRound(roster, sessions, now);
    expect(result.tasks[2]).toMatchObject({ successful: 10, passed: false });
    expect(result.gates.overallAtLeast90Percent).toBe(true);
    expect(result.acceptancePassed).toBe(false);
  });
  it("fails a major misreading even when aggregate scores exceed ninety percent", () => {
    const { roster, sessions } = fixture();
    sessions[0]!.facilitatorReview!.tasks[3]!.majorMisreading = true;
    const result = assessReaderRound(roster, sessions, now);
    expect(result.gates.eachTaskAtLeast90Percent).toBe(true);
    expect(result).toMatchObject({
      majorMisreadings: 1,
      acceptancePassed: false,
    });
  });
});

describe("reader CLI preserves source evidence", () => {
  it("rejects identical paths, symbolic links and hard links without changing the input", () => {
    const dir = mkdtempSync(join(tmpdir(), "reader-cli-"));
    try {
      const input = join(dir, "roster.json");
      const source = JSON.stringify(fixture().roster);
      writeFileSync(input, source);
      const symbolic = join(dir, "symbolic.json");
      const hard = join(dir, "hard.json");
      symlinkSync(input, symbolic);
      linkSync(input, hard);
      for (const output of [input, symbolic, hard]) {
        const result = spawnSync(
          process.execPath,
          [
            "--import",
            "tsx",
            resolve("scripts/assess-reader-testing.ts"),
            "--roster",
            input,
            "--output",
            output,
          ],
          { encoding: "utf8" },
        );
        expect(result.status).toBe(1);
        expect(readFileSync(input, "utf8")).toBe(source);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
  it("invalid input cannot leave a stale passing report", () => {
    const dir = mkdtempSync(join(tmpdir(), "reader-invalid-"));
    try {
      const input = join(dir, "roster.json");
      const output = join(dir, "assessment.json");
      writeFileSync(input, "{}");
      writeFileSync(output, JSON.stringify({ acceptancePassed: true }));
      const result = spawnSync(
        process.execPath,
        [
          "--import",
          "tsx",
          resolve("scripts/assess-reader-testing.ts"),
          "--roster",
          input,
          "--output",
          output,
        ],
        { encoding: "utf8" },
      );
      expect(result.status).toBe(1);
      expect(JSON.parse(readFileSync(output, "utf8"))).toMatchObject({
        status: "invalid-input",
        acceptancePassed: false,
      });
      expect(readFileSync(input, "utf8")).toBe("{}");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
