import { z } from "astro/zod";
import { canonicalJson, sha256Hex } from "../contracts/canonical";
import { findInjury } from "../contracts/taxonomy";
import acl from "../../data/patient-guides/acl.json";
import ankle from "../../data/patient-guides/ankle-sprain.json";
import achilles from "../../data/patient-guides/achilles-rupture.json";

const claim = z.strictObject({
  text: z.string().min(1).max(110),
  sourceIds: z.array(z.string().min(1)).min(1),
});
export const patientGuideSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    injuryCode: z
      .string()
      .min(1)
      .refine((code) => findInjury(code) !== undefined, "Unknown injury"),
    label: z.string().min(1),
    immediate: z.array(claim).min(1).max(3),
    redFlags: z.array(claim).min(1).max(3),
    returnRanges: z
      .array(
        z.strictObject({
          label: z.string().min(1),
          value: z.string().min(1),
          detail: claim,
        }),
      )
      .min(1)
      .max(3),
    readiness: claim,
    sources: z
      .array(
        z.strictObject({
          id: z.string().min(1),
          title: z.string().min(1),
          publisher: z.string().min(1),
          url: z.url({ protocol: /^https$/ }),
          year: z.number().int().nullable(),
          accessedAt: z.iso.date(),
        }),
      )
      .min(1),
    review: z.strictObject({
      status: z.enum(["needs-review", "approved"]),
      reviewedBy: z.string().min(1).nullable(),
      reviewedAt: z.iso.date().nullable(),
      contentDigest: z
        .string()
        .regex(/^[a-f0-9]{64}$/)
        .nullable(),
    }),
  })
  .superRefine((guide, ctx) => {
    const ids = new Set(guide.sources.map((source) => source.id));
    if (ids.size !== guide.sources.length)
      ctx.addIssue({ code: "custom", message: "duplicate source" });
    for (const item of [
      ...guide.immediate,
      ...guide.redFlags,
      ...guide.returnRanges.map((range) => range.detail),
      guide.readiness,
    ]) {
      if (item.sourceIds.some((id) => !ids.has(id)))
        ctx.addIssue({ code: "custom", message: "unresolved claim source" });
    }
  });
export type PatientGuide = z.infer<typeof patientGuideSchema>;
export function patientGuideDigest(guide: PatientGuide): string {
  const { review: _review, ...content } = guide;
  return sha256Hex(canonicalJson(content));
}
export function isPatientGuideApproved(guide: PatientGuide): boolean {
  return (
    guide.review.status === "approved" &&
    !!guide.review.reviewedBy &&
    !!guide.review.reviewedAt &&
    guide.review.contentDigest === patientGuideDigest(guide)
  );
}
export const patientGuides = [acl, ankle, achilles].map((guide) =>
  patientGuideSchema.parse(guide),
);
export function patientGuideFor(
  injuryCode: string,
  mode: "review" | "public",
): PatientGuide {
  const guide = patientGuides.find((item) => item.injuryCode === injuryCode);
  if (!guide) throw new Error(`Missing patient guide: ${injuryCode}`);
  if (mode === "public" && !isPatientGuideApproved(guide))
    throw new Error(`Patient guide requires medical review: ${injuryCode}`);
  return guide;
}
