/** Offline reader-study accounting. Validation is not proof that a session occurred. */
import { z } from "astro/zod";
import { canonicalJson, sha256Hex } from "../../src/lib/contracts/canonical";
import tasks from "../../docs/reviews/2026-11-18-followup/reader-testing/tasks.json";

export const READER_PROTOCOL = "2026-11-18-v1";
export const READER_TASKS = tasks;
const cohorts = ["clinician", "student", "public"] as const;
const id = z.string().regex(/^[A-Za-z][A-Za-z0-9-]{1,19}$/);
const commit = z.string().regex(/^[a-f0-9]{40}$/);
const note = z.string().trim().min(1).max(3000);
const date = z.iso.datetime({ offset: true });
const taskId = z
  .string()
  .refine((value) => tasks.some((task) => task.id === value), "Unknown task");
const taskResultSchema = z
  .strictObject({
    taskId,
    outcome: z.enum([
      "not-tried",
      "unassisted",
      "assisted",
      "failed",
      "blocked",
    ]),
    elapsedSeconds: z.number().int().nonnegative().max(3600).nullable(),
    response: z.string().max(3000),
  })
  .superRefine((task, ctx) => {
    if (
      task.outcome !== "not-tried" &&
      (task.elapsedSeconds === null || !task.response.trim())
    )
      ctx.addIssue({
        code: "custom",
        message: "Attempted tasks need elapsed time and a response",
      });
  });
const reviewSchema = z.strictObject({
  reviewerId: id,
  reviewedAt: date,
  sessionDigest: z.string().regex(/^[a-f0-9]{64}$/),
  tasks: z
    .array(
      z.strictObject({
        taskId,
        answerCorrect: z.boolean(),
        majorMisreading: z.boolean(),
        note,
      }),
    )
    .length(tasks.length),
});
export const readerSessionSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    protocolVersion: z.literal(READER_PROTOCOL),
    recordedAt: date,
    participantId: id,
    cohort: z.enum([...cohorts, "owner-pilot"]),
    commit,
    device: z.string().trim().min(1).max(160),
    evidenceKind: z.enum(["participant-self-report", "facilitator-observed"]),
    reviewStatus: z.enum(["pending-facilitator-review", "reviewed"]),
    clinicalApproval: z.literal(false),
    publicationApproval: z.literal(false),
    tasks: z.array(taskResultSchema).length(tasks.length),
    facilitatorReview: reviewSchema.optional(),
  })
  .superRefine((session, ctx) => {
    if (new Set(session.tasks.map((task) => task.taskId)).size !== tasks.length)
      ctx.addIssue({
        code: "custom",
        message: "Every task must occur exactly once",
      });
    if (
      session.facilitatorReview &&
      new Set(session.facilitatorReview.tasks.map((task) => task.taskId))
        .size !== tasks.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Every review task must occur exactly once",
      });
    if (
      (session.reviewStatus === "reviewed") !==
      Boolean(session.facilitatorReview)
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Reviewed status requires a facilitator review; pending exports cannot carry a review",
      });
  });
export type ReaderSession = z.infer<typeof readerSessionSchema>;
export const readerRosterSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    protocolVersion: z.literal(READER_PROTOCOL),
    commit: commit.nullable(),
    participants: z
      .array(z.strictObject({ participantId: id, cohort: z.enum(cohorts) }))
      .max(120),
  })
  .superRefine((roster, ctx) => {
    if (
      new Set(roster.participants.map((p) => p.participantId.toLowerCase()))
        .size !== roster.participants.length
    )
      ctx.addIssue({ code: "custom", message: "Duplicate roster participant" });
    if (roster.participants.length > 0 && !roster.commit)
      ctx.addIssue({
        code: "custom",
        message: "An enrolled round needs a fixed commit",
      });
  });

export function readerSessionDigest(session: ReaderSession): string {
  const {
    facilitatorReview: _review,
    reviewStatus: _status,
    ...observed
  } = session;
  return sha256Hex(canonicalJson(observed));
}

export function assessReaderRound(
  rosterInput: unknown,
  sessionInputs: unknown[],
  now = new Date(),
) {
  const roster = readerRosterSchema.parse(rosterInput);
  const sessions = sessionInputs.map((session) =>
    readerSessionSchema.parse(session),
  );
  const seen = new Set<string>();
  const expected = new Map(
    roster.participants.map((p) => [p.participantId.toLowerCase(), p]),
  );
  if (!Number.isFinite(now.valueOf()))
    throw new Error("Invalid assessment time");
  for (const session of sessions) {
    const key = session.participantId.toLowerCase();
    if (seen.has(key))
      throw new Error(`Duplicate participant: ${session.participantId}`);
    seen.add(key);
    if (!roster.commit || session.commit !== roster.commit)
      throw new Error("Mixed or unspecified website versions");
    if (Date.parse(session.recordedAt) > now.valueOf())
      throw new Error("Future session date");
    const person = expected.get(key);
    if (
      session.cohort === "owner-pilot"
        ? person
        : !person || person.cohort !== session.cohort
    )
      throw new Error("Participant/cohort does not match the planned roster");
    if (session.facilitatorReview) {
      if (
        session.facilitatorReview.sessionDigest !== readerSessionDigest(session)
      )
        throw new Error(
          "Facilitator review does not bind the exported session",
        );
      const reviewedAt = Date.parse(session.facilitatorReview.reviewedAt);
      if (
        reviewedAt < Date.parse(session.recordedAt) ||
        reviewedAt > now.valueOf()
      )
        throw new Error("Invalid facilitator review date");
    }
  }
  const formal = sessions.filter((s) => s.cohort !== "owner-pilot");
  const eligible = formal.filter(
    (s) =>
      s.evidenceKind === "facilitator-observed" &&
      s.reviewStatus === "reviewed",
  );
  const cohortCounts = cohorts.map((cohort) => ({
    cohort,
    enrolled: roster.participants.filter((p) => p.cohort === cohort).length,
    received: formal.filter((s) => s.cohort === cohort).length,
    reviewed: eligible.filter((s) => s.cohort === cohort).length,
  }));
  // Empty roster slots, absent readers, blocked tasks and non-reviewed exports never disappear.
  const expectedParticipants = cohortCounts.reduce(
    (total, group) => total + Math.max(4, group.enrolled),
    0,
  );
  const acceptedTask = (
    session: ReaderSession,
    task: (typeof tasks)[number],
  ) => {
    const result = session.tasks.find((row) => row.taskId === task.id)!;
    const review = session.facilitatorReview!.tasks.find(
      (row) => row.taskId === task.id,
    )!;
    return (
      result.outcome === "unassisted" &&
      result.elapsedSeconds !== null &&
      result.elapsedSeconds <= task.timeLimitSeconds &&
      review.answerCorrect &&
      !review.majorMisreading
    );
  };
  const taskResults = tasks.map((task) => {
    const successful = eligible.filter((s) => acceptedTask(s, task)).length;
    return {
      taskId: task.id,
      successful,
      expected: expectedParticipants,
      successRate: successful / expectedParticipants,
      passed: successful * 10 >= expectedParticipants * 9,
    };
  });
  const majorMisreadings = sessions.reduce(
    (total, s) =>
      total +
      (s.facilitatorReview?.tasks.filter((t) => t.majorMisreading).length ?? 0),
    0,
  );
  const successes = taskResults.reduce(
    (total, task) => total + task.successful,
    0,
  );
  const expectedTasks = expectedParticipants * tasks.length;
  const gates = {
    fixedVersion: roster.commit !== null,
    cohortQuorum: cohortCounts.every((group) => group.enrolled >= 4),
    allPlannedReadersObservedAndReviewed:
      eligible.length === expectedParticipants,
    eachTaskAtLeast90Percent: taskResults.every((task) => task.passed),
    overallAtLeast90Percent: successes * 10 >= expectedTasks * 9,
    noMajorMisreadings: majorMisreadings === 0,
  };
  const acceptancePassed = Object.values(gates).every(Boolean);
  return {
    schemaVersion: 1,
    protocolVersion: READER_PROTOCOL,
    checkedAt: now.toISOString(),
    commit: roster.commit,
    status: acceptancePassed
      ? "passed-reader-round"
      : formal.length === 0
        ? "awaiting-real-participants"
        : "not-passed",
    expectedParticipants,
    receivedParticipants: formal.length,
    reviewedParticipants: eligible.length,
    ownerPilotSessions: sessions.length - formal.length,
    selfReportedSessions: formal.filter(
      (s) => s.evidenceKind === "participant-self-report",
    ).length,
    missingParticipantIds: roster.participants
      .filter(
        (p) =>
          !formal.some(
            (s) =>
              s.participantId.toLowerCase() === p.participantId.toLowerCase(),
          ),
      )
      .map((p) => p.participantId),
    cohorts: cohortCounts.map((group) => ({
      ...group,
      successfulTasks: eligible
        .filter((s) => s.cohort === group.cohort)
        .reduce(
          (total, s) =>
            total + tasks.filter((task) => acceptedTask(s, task)).length,
          0,
        ),
      expectedTasks: Math.max(4, group.enrolled) * tasks.length,
    })),
    tasks: taskResults,
    successfulTasks: successes,
    expectedTasks,
    successRate: formal.length === 0 ? null : successes / expectedTasks,
    majorMisreadings,
    gates,
    acceptancePassed,
    clinicalApproval: false,
    publicationApproval: false,
    sessionDigests: sessions.map((s) => ({
      participantId: s.participantId,
      digest: readerSessionDigest(s),
    })),
    scope:
      "Offline arithmetic and evidence consistency only; cannot authenticate people, observations, or reviewer identity. Actual devices, medical review and publication have separate requirements.",
  };
}
