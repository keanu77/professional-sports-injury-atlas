/** D20 review metadata overlays immutable D18 facts only after provenance checks. */
import { lstatSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "astro/zod";
import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../contracts/canonical";
import {
  FOLLOW_UP_KINDS,
  type CaseFollowUp,
} from "../contracts/case-follow-up";
import {
  computeFollowUpDraftDigest,
  computeFollowUpItemPayloadDigest,
} from "./follow-up-digest";
import { loadDecision18TransitionalFollowUpCorpus } from "./decision-18-follow-up-corpus";

export const FOLLOW_UP_APPROVAL_LEDGER_PATH =
  "review/follow-up-approvals/decision-20.ledger.v1.json";
export const FOLLOW_UP_ADOPTION_RECEIPT_PATH =
  "review/follow-up-approvals/decision-20.adoption.v1.json";
export const DECISION_20_PLAN_PATH =
  "docs/superpowers/plans/2026-08-16-decision-20-follow-up-owner-approval.md";
export const DECISION_20_AUTHORIZATION_PATH =
  "docs/decisions/2026-08-16-decision-20-follow-up-owner-approval-authorization.v1.json";
export const DECISION_20_AUTHORITY_BINDING = {
  planPath: DECISION_20_PLAN_PATH,
  planSha256:
    "a080f0dd88f0a09e3d3316c946463db68a62a12793e735c5d2242d379144cc94",
  authorizationPath: DECISION_20_AUTHORIZATION_PATH,
  authorizationSha256:
    "be1dc0658328079d181e7c2ff91b73a7073cd3def66df35e49fc11dec566792b",
} as const;
const digest = z.string().regex(/^[0-9a-f]{64}$/u);
const nonempty = z.string().min(1);
const entrySchema = z.strictObject({
  caseId: nonempty,
  itemId: nonempty,
  reviewedPayloadDigest: digest,
});
export const followUpApprovalLedgerSchema = z
  .strictObject({
    schemaVersion: z.literal("follow-up-approval-ledger.v1"),
    decisionId: z.literal("decision-20"),
    approvedAt: z.literal("2026-08-16"),
    authorityBinding: z.strictObject({
      planPath: z.literal(DECISION_20_PLAN_PATH),
      planSha256: z.literal(DECISION_20_AUTHORITY_BINDING.planSha256),
      authorizationPath: z.literal(DECISION_20_AUTHORIZATION_PATH),
      authorizationSha256: z.literal(
        DECISION_20_AUTHORITY_BINDING.authorizationSha256,
      ),
    }),
    entries: z.array(entrySchema).length(148),
  })
  .superRefine((ledger, context) => {
    const keys = new Set<string>();
    for (const [index, entry] of ledger.entries.entries()) {
      const key = `${entry.caseId}:${entry.itemId}`;
      if (keys.has(key))
        context.addIssue({
          code: "custom",
          path: ["entries", index],
          message: "duplicate approval item",
        });
      keys.add(key);
    }
  });
export type FollowUpApprovalLedger = z.infer<
  typeof followUpApprovalLedgerSchema
>;
export const followUpAdoptionReceiptSchema = z.strictObject({
  schemaVersion: z.literal("follow-up-review-adoption.v1"),
  decisionId: z.literal("decision-20"),
  ledgerPath: z.literal(FOLLOW_UP_APPROVAL_LEDGER_PATH),
  predecessors: z.tuple([
    z.strictObject({
      path: z.literal(
        "research/follow-ups/decision-18/batches/acl.receipt.v1.json",
      ),
      sha256: z.literal(
        "b3f167661b645012b6b0e0c8146f2704e5f4ba503e693f8f2555b4be7273d78c",
      ),
    }),
    z.strictObject({
      path: z.literal(
        "research/follow-ups/decision-18/batches/ankle.receipt.v1.json",
      ),
      sha256: z.literal(
        "a8c6651e338d11d5b39f427675e09882847231e6d5185931e89973b99e61726d",
      ),
    }),
    z.strictObject({
      path: z.literal(
        "research/follow-ups/decision-18/batches/achilles.receipt.v1.json",
      ),
      sha256: z.literal(
        "3ba4605374803183f7c73caf81438b7e2c595a2bf7ff631fd779cc45534e8361",
      ),
    }),
  ]),
});

function readRegular(root: string, path: string): Buffer {
  const absolute = join(root, path);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink())
    throw new Error(`not a regular approval artifact: ${path}`);
  return readFileSync(absolute);
}
function readCanonical(root: string, path: string): unknown {
  const bytes = readRegular(root, path).toString("utf8");
  const parsed = parseStrictJson(bytes);
  if (canonicalJson(parsed) !== bytes)
    throw new Error(`noncanonical approval artifact: ${path}`);
  return parsed;
}

/** No sidecar write, no payload change. Missing or stale approval stays pending. */
export function applyFollowUpApprovals(
  sidecar: CaseFollowUp,
  input: FollowUpApprovalLedger,
): CaseFollowUp {
  const ledger = followUpApprovalLedgerSchema.parse(input);
  const approved = new Map(
    ledger.entries.map((entry) => [
      `${entry.caseId}:${entry.itemId}`,
      entry.reviewedPayloadDigest,
    ]),
  );
  const result = structuredClone(sidecar);
  for (const kind of FOLLOW_UP_KINDS)
    for (const item of result.categories[kind]) {
      const current = computeFollowUpItemPayloadDigest(item);
      item.review =
        approved.get(`${result.caseId}:${item.id}`) === current &&
        item.itemPayloadDigest === current
          ? {
              status: "owner-approved",
              reviewedPayloadDigest: current,
              approvedAt: ledger.approvedAt,
              approvedByDecision: ledger.decisionId,
            }
          : { status: "pending-owner-signoff", reviewedPayloadDigest: current };
    }
  return result;
}

export function followUpReviewStatus(
  sidecar: CaseFollowUp,
): "owner-approved" | "pending-owner-signoff" {
  const items = FOLLOW_UP_KINDS.flatMap((kind) => sidecar.categories[kind]);
  return items.length > 0 &&
    items.every((item) => item.review.status === "owner-approved")
    ? "owner-approved"
    : "pending-owner-signoff";
}

/** Retains every D18 byte/Git gate before applying the separate D20 ledger. */
export function loadReviewFollowUpCorpus(
  ...args: Parameters<typeof loadDecision18TransitionalFollowUpCorpus>
): ReturnType<typeof loadDecision18TransitionalFollowUpCorpus> {
  const [root] = args;
  const corpus = loadDecision18TransitionalFollowUpCorpus(...args);
  if (corpus.issues.length > 0 || corpus.entries.length === 0) return corpus;
  try {
    const receipt = followUpAdoptionReceiptSchema.parse(
      readCanonical(root, FOLLOW_UP_ADOPTION_RECEIPT_PATH),
    );
    const ledger = followUpApprovalLedgerSchema.parse(
      readCanonical(root, FOLLOW_UP_APPROVAL_LEDGER_PATH),
    );
    for (const binding of [
      {
        path: ledger.authorityBinding.planPath,
        sha256: ledger.authorityBinding.planSha256,
      },
      {
        path: ledger.authorityBinding.authorizationPath,
        sha256: ledger.authorityBinding.authorizationSha256,
      },
      ...receipt.predecessors,
    ]) {
      if (sha256Hex(readRegular(root, binding.path)) !== binding.sha256)
        throw new Error(
          `approval authority/predecessor digest mismatch: ${binding.path}`,
        );
    }
    const binding = parseStrictJson(
      readRegular(root, "docs/decisions/plan-binding.v1.json").toString("utf8"),
    ) as {
      documents: Array<{
        path: string;
        sha256: string;
        lifecycle: string;
        executionAuthorization?: {
          status: string;
          decisionPath: string;
          decisionSha256: string;
        };
      }>;
    };
    const plan = binding.documents.find(
      (doc) => doc.path === DECISION_20_PLAN_PATH,
    );
    const decision = binding.documents.find(
      (doc) => doc.path === DECISION_20_AUTHORIZATION_PATH,
    );
    if (
      plan?.lifecycle !== "active" ||
      plan.sha256 !== ledger.authorityBinding.planSha256 ||
      plan.executionAuthorization?.status !== "authorized" ||
      plan.executionAuthorization.decisionPath !==
        DECISION_20_AUTHORIZATION_PATH ||
      plan.executionAuthorization.decisionSha256 !==
        ledger.authorityBinding.authorizationSha256 ||
      decision?.lifecycle !== "active" ||
      decision.sha256 !== ledger.authorityBinding.authorizationSha256
    )
      throw new Error("D20 authority is not actively bound");
    if (corpus.completedBatchIds.length !== 3)
      throw new Error("D20 requires all three completed D18 receipts");
    // Ledger can only approve the exact payloads inherited from these frozen receipts.
    const inherited = new Map(
      corpus.entries.flatMap((entry) =>
        FOLLOW_UP_KINDS.flatMap((kind) =>
          entry.sidecar.categories[kind].map(
            (item) =>
              [
                `${entry.sidecar.caseId}:${item.id}`,
                computeFollowUpItemPayloadDigest(item),
              ] as const,
          ),
        ),
      ),
    );
    for (const entry of ledger.entries) {
      if (
        inherited.get(`${entry.caseId}:${entry.itemId}`) !==
        entry.reviewedPayloadDigest
      )
        throw new Error(
          `approval does not match inherited D18 item: ${entry.itemId}`,
        );
    }
    return {
      ...corpus,
      entries: corpus.entries.map((entry) => {
        const sidecar = applyFollowUpApprovals(entry.sidecar, ledger);
        return {
          ...entry,
          sidecar,
          draftDigest: computeFollowUpDraftDigest(sidecar),
        };
      }),
    };
  } catch (error) {
    return {
      ...corpus,
      entries: [],
      issues: [
        {
          code: "follow-up-approval-ledger-invalid",
          path: FOLLOW_UP_APPROVAL_LEDGER_PATH,
          message: error instanceof Error ? error.message : String(error),
        },
      ],
    };
  }
}
