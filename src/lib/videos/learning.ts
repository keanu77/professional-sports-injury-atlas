import { z } from "astro/zod";
import data from "../../data/video-learning.v1.json";
import { eventUpdates, type EventUpdate } from "./event-updates";
import { allObservationClips } from "./expansion";
import type { BuildMode } from "../governance/build-mode";

const text = z.string().trim().min(1);
const slug = z.string().regex(/^[a-z0-9-]+$/u);
const https = z.url({ protocol: /^https$/ });
const basisField = z.enum([
  "mechanism.summary",
  "mechanism.limitation",
  "returnSummary",
]);
export const LEARNING_BASIS_LABELS = {
  "mechanism.summary": "本頁機轉摘要與所引來源",
  "mechanism.limitation": "本頁影片分析限制",
  returnSummary: "本頁回場摘要",
} as const;
const draftSchema = z.strictObject({
  slug,
  videoUrl: https,
  status: z.literal("editorial-draft"),
  clinicalApproval: z.literal("pending"),
  title: text,
  objective: text,
  observationQuestions: z.array(text).length(2),
  selfChecks: z
    .array(
      z.strictObject({
        question: text,
        answer: text,
        basisFields: z.array(basisField).min(1),
      }),
    )
    .length(2),
  comparison: z.strictObject({ slug, videoUrl: https, prompt: text }),
  basis: z
    .array(
      z.strictObject({
        field: basisField,
        text,
        sourceIndexes: z.array(z.number().int().positive()),
        sourceUrls: z.array(https),
      }),
    )
    .min(1),
});
export const videoLearningSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    preparedAt: z.iso.date(),
    preparedBy: z.literal("assistant"),
    status: z.literal("editorial-draft"),
    clinicalApproval: z.literal("pending"),
    scope: z.literal("page-evidence-reading-not-clinical-approval"),
    entries: z.array(draftSchema).min(1),
  })
  .superRefine((value, ctx) => {
    if (
      new Set(value.entries.map((entry) => entry.slug)).size !==
      value.entries.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Learning draft slugs must be unique",
      });
    for (const [i, entry] of value.entries.entries()) {
      const fields = new Set(entry.basis.map((basis) => basis.field));
      if (
        fields.size !== entry.basis.length ||
        entry.selfChecks.some((check) =>
          check.basisFields.some((field) => !fields.has(field)),
        )
      )
        ctx.addIssue({
          code: "custom",
          path: ["entries", i, "basis"],
          message: "Learning answers need unique, explicit basis fields",
        });
      if (entry.comparison.slug === entry.slug)
        ctx.addIssue({
          code: "custom",
          path: ["entries", i, "comparison"],
          message: "A comparison requires a different event",
        });
    }
  });
export type VideoLearningDraft = z.infer<typeof draftSchema>;

/** Snapshot equality prevents a later page/source edit silently inheriting the
 * draft's answers. It proves binding only; it is not clinical or media review.
 */
export function validateLearningBindings(
  payload: unknown,
  events: readonly EventUpdate[] = eventUpdates.entries,
) {
  const parsed = videoLearningSchema.parse(payload);
  const bySlug = new Map(events.map((event) => [event.slug, event]));
  for (const entry of parsed.entries) {
    const event = bySlug.get(entry.slug);
    if (!event || event.videoUrl !== entry.videoUrl)
      throw new Error(`Learning video binding mismatch: ${entry.slug}`);
    const comparison = bySlug.get(entry.comparison.slug);
    if (!comparison || comparison.videoUrl !== entry.comparison.videoUrl)
      throw new Error(`Learning comparison binding mismatch: ${entry.slug}`);
    for (const basis of entry.basis) {
      const value =
        basis.field === "returnSummary"
          ? event.returnSummary
          : basis.field === "mechanism.summary"
            ? event.mechanism?.summary.text
            : event.mechanism?.limitation;
      const indexes =
        basis.field === "mechanism.summary"
          ? (event.mechanism?.summary.sourceIndexes ?? [])
          : [];
      const urls = indexes.map((index) => event.sources[index - 1]?.url);
      if (
        value !== basis.text ||
        JSON.stringify(indexes) !== JSON.stringify(basis.sourceIndexes) ||
        JSON.stringify(urls) !== JSON.stringify(basis.sourceUrls)
      )
        throw new Error(
          `Learning basis changed; review draft again: ${entry.slug}/${basis.field}`,
        );
    }
  }
  return parsed;
}

export const videoLearning = validateLearningBindings(data);
const bySlug = new Map(
  videoLearning.entries.map((entry) => [entry.slug, entry]),
);

/** Explicit preview opt-in; true on its own can never expose a draft in a
 * normal public build. No legacy case approval is inherited by this package.
 */
export function learningFor(
  slug: string,
  videoUrl: string,
  options: {
    showDrafts?: boolean;
    buildMode?: BuildMode;
    publicPreview?: boolean;
  } = {},
): VideoLearningDraft | undefined {
  const entry = bySlug.get(slug);
  if (entry && entry.videoUrl !== videoUrl)
    throw new Error(`Learning video binding mismatch: ${slug}`);
  const preview =
    options.buildMode === "review" ||
    (options.buildMode === "public" && options.publicPreview === true);
  return entry && options.showDrafts === true && preview ? entry : undefined;
}

export function learningComparisonHref(entry: VideoLearningDraft): string {
  const kind = allObservationClips.some(
    (clip) => clip.slug === entry.comparison.slug,
  )
    ? "videos"
    : "cases";
  return `/${kind}/${entry.comparison.slug}/`;
}

export function learningComparisonTitle(entry: VideoLearningDraft): string {
  return bySlug.get(entry.comparison.slug)?.title ?? entry.comparison.slug;
}

/** Generic reading prompts make no claim about what a particular clip shows. */
export const VIDEO_READING_PROMPTS = [
  {
    label: "觀察",
    question:
      "這是比賽畫面、訪談還是解說？哪些內容能直接看見，哪些需要查來源？",
  },
  {
    label: "來源",
    question:
      "傷勢與回場資料由誰公布？資訊查到哪一天？請將報導與畫面觀察分開。",
  },
  {
    label: "未知",
    question:
      "本頁有哪些無法確認的內容？先閱讀影片分析限制，保留看不清楚或未公開的資訊。",
  },
] as const;
