/** Decision 21 is a separately reviewed public release, not a relabelled D17 receipt. */
import { z } from "astro/zod";
import data from "../../data/public-launch.v1.json";
import type { InjuryCase } from "../contracts/case";
import { canonicalJson, sha256Hex } from "../contracts/canonical";
import { hasPublicEmbed } from "./featured";

const digest = z.string().regex(/^[a-f0-9]{64}$/);
export const launchApprovalSchema = z.strictObject({
  schemaVersion: z.literal(1),
  decision: z.literal("decision-21"),
  status: z.literal("approved"),
  reviewedBy: z.string().min(1),
  recordedAt: z.iso.datetime(),
  approvalQuote: z.literal("預覽內容可以，請繼續"),
  origin: z.literal("https://sports-injury-atlas.pages.dev"),
  scope: z.literal("native-embeds-and-approved-patient-guides"),
  previewOrigin: z.literal("http://127.0.0.1:14322"),
  reviewPacketDigest: digest,
  inputTreeDigest: digest,
  cases: z
    .array(
      z.strictObject({
        id: z.string().min(1),
        recordDigest: digest,
        videoUrl: z.url({ protocol: /^https$/ }),
      }),
    )
    .min(1),
});
export type LaunchApproval = z.infer<typeof launchApprovalSchema>;
// Parse only when used: historical review/test paths stay independent of D21.
export const launchApproval = data;
export function isLaunchEnabled(): boolean {
  return process.env.ATLAS_PUBLIC_LAUNCH === "decision-21";
}
export function launchCaseAllowed(
  record: InjuryCase,
  approval: LaunchApproval = launchApprovalSchema.parse(data),
): boolean {
  const item = approval.cases.find((candidate) => candidate.id === record.id);
  return (
    !!item &&
    item.recordDigest === sha256Hex(canonicalJson(record)) &&
    item.videoUrl === record.video.canonicalUrl &&
    hasPublicEmbed(record)
  );
}
